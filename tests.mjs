import test from 'node:test';
import assert from 'node:assert/strict';
import {optimise,seed} from './dist/engine.mjs';
test('plan respects budget and hours; donor value is conserved',()=>{const p=optimise(seed);assert.ok(p.spend<=seed.budget);assert.ok(p.hours<=seed.hours);assert.equal(p.net,p.rows.reduce((s,r)=>s+r.net,0));assert.equal(p.uplift,p.net-p.baseline);if(p.rows.some(r=>r.action==='Repair with donor'))assert.equal(p.rows.find(r=>r.id===seed.donor.from).action,'Donate part');});
test('zero resources selects the as-is baseline',()=>{const p=optimise({...seed,budget:0,hours:0});assert.equal(p.uplift,0);assert.ok(p.rows.every(r=>r.action==='Sell as-is'));});
test('unconfirmed and self donor matches are rejected',()=>{for(const donor of [{...seed.donor,confirmed:false},{...seed.donor,to:seed.donor.from}])assert.ok(!optimise({...seed,donor}).rows.some(r=>r.action.includes('donor')));});
test('donor opportunity cost can make a free part uneconomical',()=>{const ds=[{id:'a',asIs:100,resale:0,parts:0,labour:1000,fees:0,hours:1},{id:'b',asIs:10,resale:50,parts:20,labour:0,fees:0,hours:1}];const p=optimise({devices:ds,budget:20,hours:10,donor:{from:'a',to:'b',confirmed:true,residual:0,hours:0}});assert.equal(p.net,130);assert.equal(p.rows[0].action,'Sell as-is');assert.equal(p.rows[1].action,'Repair');});
test('empty batch is valid',()=>assert.equal(optimise({...seed,devices:[]}).net,0));
test('more budget cannot reduce the optimum',()=>{let prior=0;for(let budget=0;budget<=20000;budget+=500){const p=optimise({...seed,budget});assert.ok(p.net>=prior);prior=p.net;}});
