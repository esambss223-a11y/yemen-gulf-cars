import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { loadUiModule } from './load-ui-module.mjs';

// Exercise actual component callbacks; native browser validation is not simulated.
function editor(onSubmit) {
  const cells = []; let cursor = 0; let tree;
  const react = { ...React, useEffect() {}, useState(initial) {
    const index = cursor++; if (!(index in cells)) cells[index] = typeof initial === 'function' ? initial() : initial;
    return [cells[index], next => { cells[index] = typeof next === 'function' ? next(cells[index]) : next; }];
  }, useRef(initial) { const index = cursor++; return cells[index] ??= { current: initial }; } };
  const Wrapper = loadUiModule('components/admin/modals/CarFormModal.tsx', { react, '@/lib/upload-car-image': {} }).default;
  const props = { isOpen: true, editingCar: { id: 'fixture-car' }, owners: [], onClose() {}, onSubmit,
    carForm: { carCode: 'TEST', make: 'Test', model: 'Car', dailyPriceEGP: 1000, weeklyPriceEGP: 5000, monthlyPriceEGP: 20000, securityDepositEGP: 0, minRentalDays: 1, images: [] }, setCarForm() {} };
  function nodes(node, result = []) {
    if (Array.isArray(node)) { node.forEach(child => nodes(child, result)); return result; }
    if (!node?.props) return result;
    result.push(node); nodes(node.props.children, result); return result;
  }
  function render() {
    cursor = 0; const session = Wrapper(props); tree = session.type(session.props);
    const form = nodes(tree).find(node => node.type === 'form');
    form.props.ref.current = { reportValidity: () => true, scrollTo() {} };
  }
  render();
  return {
    props, render, nodes: () => nodes(tree),
    active: () => nodes(tree).filter(node => node.type === 'fieldset' && !node.props.hidden),
    async submit() { const form = nodes(tree).find(node => node.type === 'form'); const pending = form.props.onSubmit({ preventDefault() {} }); render(); await pending; render(); },
  };
}

test('car editor advances through three steps and saves only on the final step', async () => {
  let writes = 0; const fixture = editor(async () => { writes++; });
  assert.equal(fixture.active().length, 1);
  assert.equal(fixture.nodes().find(node => node.props['aria-label'] === 'خطوات بيانات السيارة').props.children[2].props.disabled, true);
  await fixture.submit(); assert.equal(writes, 0);
  assert.equal(fixture.active()[0].props.children[0].props.children, 'الأسعار والعروض');
  await fixture.submit(); assert.equal(writes, 0);
  assert.equal(fixture.active()[0].props.children[0].props.children, 'الصور والتفاصيل');
  await fixture.submit(); assert.equal(writes, 1);
});

test('invalid independent offers stay on the price step and never reach save', async () => {
  let writes = 0; const fixture = editor(async () => { writes++; });
  await fixture.submit(); fixture.props.carForm.originalDailyPriceEGP = 900;
  await fixture.submit(); assert.equal(writes, 0);
  assert.ok(fixture.nodes().some(node => node.props.role === 'alert'));
  assert.equal(fixture.active()[0].props.children[0].props.children, 'الأسعار والعروض');
});

test('save is single-flight and failed saves retain the editor data for retry', async () => {
  let finish; let writes = 0;
  const fixture = editor(() => { writes++; return new Promise(resolve => { finish = resolve; }); });
  await fixture.submit(); await fixture.submit();
  const first = fixture.submit(); await fixture.submit(); assert.equal(writes, 1); finish(); await first;
  fixture.props.onSubmit = async () => { throw new Error('TEST SAVE FAILED'); };
  fixture.render();
  await fixture.submit();
  assert.ok(fixture.nodes().some(node => node.props.role === 'alert' && typeof node.props.children === 'string'));
  assert.equal(fixture.props.carForm.make, 'Test');
});
