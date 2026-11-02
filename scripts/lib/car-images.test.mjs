import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import { File } from 'node:buffer';
import { loadUiModule } from './load-ui-module.mjs';
const require = createRequire(import.meta.url);
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../../' + file, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, { exports, Response, Buffer, ...globals, console: { error() {} }, require(name) {
    if (name in mocks) return mocks[name];
    if (name === '@/lib/car-image-files') return load('lib/car-image-files.ts');
    return require(name);
  } });
  return exports;
}
const { MAX_CAR_IMAGE_BYTES, carImageExtension } = load('lib/car-image-files.ts');
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const uploadRequest = (bytes = jpeg, type = 'image/jpeg') => {
  const form = new FormData(); form.append('file', new Blob([bytes], { type }), 'image.jpg');
  return new Request('http://localhost/api/admin/cars/images', { method: 'POST', body: form });
};
function fixture({ denied = false, uploadError = null } = {}) {
  const writes = []; let publicReads = 0;
  const storage = { from(bucket) { assert.equal(bucket, 'car-images'); return {
    upload: async (path, bytes, options) => { writes.push({ path, bytes, options }); return { error: uploadError }; },
    getPublicUrl(path) { publicReads++; return { data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/car-images/' + path } }; },
  }; } };
  const route = load('app/api/admin/cars/images/route.ts', { '@/lib/server/staff-auth': {
    authorizeStaffRequest: async (_request, requireAdmin) => { assert.equal(requireAdmin, true); return denied
      ? { ok: false, status: 403, error: 'Denied' }
      : { ok: true, staff: { id: 'staff-a' }, admin: { storage } }; },
  } });
  return { POST: route.POST, writes, publicReads: () => publicReads };
}
test('car image upload requires an active administrator before touching storage', async () => {
  const f = fixture({ denied: true });
  assert.equal((await f.POST(uploadRequest())).status, 403);
  assert.equal(f.writes.length, 0);
});
test('images receive a new immutable path belonging to the verified actor and only their URL is returned', async () => {
  const f = fixture(); const response = await f.POST(uploadRequest());
  assert.equal(response.status, 200); const result = await response.json();
  assert.match(f.writes[0].path, /^cars\/staff-a\/[a-f0-9-]+\.jpg$/);
  assert.equal(f.writes[0].options.upsert, false); assert.equal(f.writes[0].options.contentType, 'image/jpeg');
  assert.match(result.url, /^https:\/\/example.supabase.co\/storage\/v1\/object\/public\/car-images\//);
  assert.equal(result.size, jpeg.length); assert.equal(f.publicReads(), 1);
});
test('storage failures return a failure without a false success URL or inline image fallback', async () => {
  const f = fixture({ uploadError: { name: 'StorageApiError' } });
  const response = await f.POST(uploadRequest()); const result = await response.json();
  assert.equal(response.status, 503); assert.equal(result.url, undefined); assert.equal(f.publicReads(), 0);
});
test('mismatched content, SVG and malformed multipart data never reach storage', async () => {
  const f = fixture();
  assert.equal((await f.POST(uploadRequest(Buffer.from('<svg/>'), 'image/jpeg'))).status, 400);
  assert.equal((await f.POST(uploadRequest(Buffer.from('<svg/>'), 'image/svg+xml'))).status, 400);
  assert.equal((await f.POST(new Request('http://localhost', { method: 'POST', body: 'not multipart' }))).status, 400);
  assert.equal((await f.POST(new Request('http://localhost', { method: 'POST' }))).status, 400);
  assert.equal(f.writes.length, 0);
});
test('oversized multipart files and streams without a content length are bounded', async () => {
  const f = fixture();
  assert.equal((await f.POST(uploadRequest(new Uint8Array(MAX_CAR_IMAGE_BYTES + 1)))).status, 413);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_CAR_IMAGE_BYTES + 65537)); controller.close(); } });
  assert.equal((await f.POST(new Request('http://localhost', { method: 'POST', body: stream, duplex: 'half' }))).status, 413);
  assert.equal(f.writes.length, 0);
});
test('image signatures support PNG and WEBP while rejecting mismatches', () => {
  assert.equal(carImageExtension('image/png', Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])), 'png');
  assert.equal(carImageExtension('image/webp', Buffer.from('RIFF0000WEBP')), 'webp');
  assert.equal(carImageExtension('image/webp', jpeg), null);
});

function editorFixture(upload) {
  const states = []; const cleanups = [];
  const hooks = { ...React,
    useState(initial) { const index = states.length; states.push(initial); return [initial, value => { states[index] = value; }]; },
    useRef(initial) { return { current: initial }; },
    useEffect(effect) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); },
  };
  let form = { make: 'Test', model: 'Car', carCode: 'YG-1', images: ['old-photo'] };
  const Editor = loadUiModule('components/admin/modals/CarFormModal.tsx', { react: hooks, '@/lib/upload-car-image': { uploadCarImage: upload } }).default;
  const session = Editor({ isOpen: true, editingCar: { id: 'car-1' }, carForm: form, owners: [], onClose() {}, onSubmit() {}, setCarForm(update) { form = update(form); } });
  const tree = session.type(session.props);
  function find(node) {
    if (!node || typeof node !== 'object') return;
    if (node.props?.onFileUpload) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const result = find(child); if (result) return result; }
  }
  return { upload: find(tree).props.onFileUpload, form: () => form, states, cleanups };
}
test('the editor appends the actual stored URL and clears the file input for later retries', async () => {
  const editor = editorFixture(async () => 'https://example.supabase.co/photo.webp');
  const input = { value: 'selected-photo' };
  await editor.upload({ target: { files: [{}] }, currentTarget: input });
  assert.deepEqual(Array.from(editor.form().images), ['old-photo', 'https://example.supabase.co/photo.webp']);
  assert.equal(input.value, ''); assert.equal(editor.states[0], false);
  assert.match(editor.states[1], /احفظ بيانات السيارة/);
});
test('failed and abandoned editor uploads never append an image or an inline data URL', async () => {
  const failed = editorFixture(async () => { throw new Error('Storage unavailable'); });
  await failed.upload({ target: { files: [{}] }, currentTarget: { value: '' } });
  assert.deepEqual(Array.from(failed.form().images), ['old-photo']); assert.equal(failed.states[2], true);
  let finish;
  const abandoned = editorFixture(() => new Promise(resolve => { finish = resolve; }));
  const pending = abandoned.upload({ target: { files: [{}] }, currentTarget: { value: '' } });
  abandoned.cleanups[0](); finish('https://example.supabase.co/unused.webp'); await pending;
  assert.deepEqual(Array.from(abandoned.form().images), ['old-photo']);
});
test('the client reduces a large image to 1920 pixels before sending a WebP with the bearer session', async () => {
  const canvas = { getContext() { return { drawImage() {} }; }, toBlob(done, type) { done(new Blob(['compressed'], { type })); } };
  let released = false; let sent;
  const globals = { File, FormData, AbortSignal, DOMException,
    Image: class { naturalWidth = 4000; naturalHeight = 3000; async decode() {} },
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() { released = true; } },
    document: { createElement() { return canvas; } },
    fetch: async (_url, options) => { sent = options; return Response.json({ url: 'https://example.supabase.co/photo.webp' }); },
  };
  const { uploadCarImage } = load('lib/upload-car-image.ts', { '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) } } } }, globals);
  const url = await uploadCarImage(new File([new Uint8Array(2 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' }), new AbortController().signal);
  assert.equal(url, 'https://example.supabase.co/photo.webp'); assert.equal(canvas.width, 1920); assert.equal(canvas.height, 1440);
  assert.equal(sent.body.get('file').type, 'image/webp'); assert.equal(sent.headers.Authorization, 'Bearer test-token'); assert.equal(released, true);
});
