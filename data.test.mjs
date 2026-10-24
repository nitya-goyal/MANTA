import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from './dist/engine.mjs';
import {validateWorkspace,makeBackup,readBackup} from './dist/data.mjs';
test('backup preserves complete workspace without mutating it',()=>assert.deepEqual(readBackup(makeBackup(seed)),seed));
test('rejects invalid values, duplicates, and oversized batches',()=>{
 for(const change of [s=>s.budget=-1,s=>s.hours=Infinity,s=>s.devices[0].parts='20',s=>s.devices.push(s.devices[0]),s=>s.devices=Array(13).fill(s.devices[0])]){const s=structuredClone(seed);change(s);assert.throws(()=>validateWorkspace(s));}
});
test('rejects unsafe links and unsupported backups',()=>{
 const s=structuredClone(seed);s.evidence=[{title:'Quote',kind:'Supplier quote',device:'M-001',price:10,date:'2026-10-24',url:'javascript:alert(1)',notes:'',verified:false}];assert.throws(()=>validateWorkspace(s));
 assert.throws(()=>readBackup('{"version":2}'));assert.throws(()=>readBackup('x'.repeat(2000001)));
});
test('removed donor device clears compatibility confirmation',()=>{const s=structuredClone(seed);s.devices=s.devices.filter(d=>d.id!==s.donor.from);assert.equal(validateWorkspace(s).donor.confirmed,false);});
