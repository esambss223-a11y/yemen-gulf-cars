import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { loadUiModule } from './load-ui-module.mjs';
const { sortCarsForDisplay } = loadUiModule('lib/car-display-order.ts');

test('visitor order is independent of status, stable for old cars and does not mutate the fleet', () => {
  const cars=[{id:'new'},{id:'b',displayOrder:0,status:'rented'},{id:'a',displayOrder:1,status:'available'}];
  assert.deepEqual(Array.from(sortCarsForDisplay(cars),car=>car.id),['b','a','new']);
  assert.deepEqual(cars.map(car=>car.id),['new','b','a']);
  assert.deepEqual(Array.from(sortCarsForDisplay([{id:'z'},{id:'a'}]),car=>car.id),['a','z']);
});

function route(auth) {
  const exports={};
  const source=readFileSync(new URL('../../app/api/admin/cars/order/route.ts',import.meta.url),'utf8');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Response,require:()=>({authorizeStaffRequest:auth})});
  return exports.POST;
}
test('order endpoint requires an active administrator before accepting changes', async () => {
  const post=route(async (_request,admin)=>{assert.equal(admin,true);return {ok:false,status:403,error:'Denied'};});
  assert.equal((await post(new Request('http://localhost',{method:'POST'}))).status,403);
});
test('order endpoint rejects duplicate IDs and only reports success after the atomic RPC', async () => {
  let calls=0;
  const post=route(async()=>({ok:true,admin:{rpc:async(name,args)=>{calls++;assert.equal(name,'fleet_save_car_order');assert.deepEqual(Array.from(args.p_ids),['b','a']);return {error:null};}}}));
  const request=ids=>new Request('http://localhost',{method:'POST',body:JSON.stringify({ids})});
  assert.equal((await post(request(['a','a']))).status,400);assert.equal(calls,0);
  assert.equal((await post(request(['b','a']))).status,200);assert.equal(calls,1);
});
test('missing migration produces an actionable failure rather than false success',async()=>{
  const post=route(async()=>({ok:true,admin:{rpc:async()=>({error:{code:'PGRST202'}})}}));
  const response=await post(new Request('http://localhost',{method:'POST',body:JSON.stringify({ids:['a']})}));
  assert.equal(response.status,503);assert.match((await response.json()).error,/20261031_car_display_order.sql/);
});
