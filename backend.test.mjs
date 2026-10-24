import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackend} from './backend.mjs';
import {seed} from './dist/engine.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('shared workshop: sessions, isolation, invites, conflicts, validation and persistence',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'manta-test-')),database=join(directory,'test.sqlite'),origin='http://127.0.0.1:18474';let server;
 async function start(){server=await createBackend({database,origin});await new Promise(r=>server.listen(18474,'127.0.0.1',r));}
 async function stop(){await new Promise(r=>server.close(r));}
 async function call(path,method='GET',data,cookie='',requestOrigin=origin){const r=await fetch(origin+'/api/'+path,{method,headers:{Origin:requestOrigin,'Content-Type':'application/json',Cookie:cookie},body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],rawCookie:r.headers.get('set-cookie')};}
 const password='test-only-password-123';
 try{
  await start();
  assert.equal((await call('session')).status,401);
  assert.equal((await call('register','POST',{email:'owner@example.test',password,workshop:'Workshop A'},'','https://evil.test')).status,403);
  const owner=await call('register','POST',{email:'owner@example.test',password,workshop:'Workshop A'});assert.equal(owner.status,201);assert.match(owner.rawCookie,/HttpOnly/);assert.match(owner.rawCookie,/SameSite=Strict/);assert.equal(owner.body.workspace.devices.length,0);
  assert.equal((await call('login','POST',{email:'owner@example.test',password:'incorrect-password-123'})).status,401);
  const saved=await call('workspace','PUT',{workshopId:owner.body.workshopId,revision:1,workspace:seed},owner.cookie);assert.equal(saved.status,200);assert.equal(saved.body.revision,2);
  assert.equal((await call('workspace','PUT',{workshopId:owner.body.workshopId,revision:1,workspace:seed},owner.cookie)).status,409);
  assert.equal((await call('workspace','PUT',{workshopId:owner.body.workshopId,revision:2,workspace:{...seed,budget:-1}},owner.cookie)).status,400);
  const other=await call('register','POST',{email:'other@example.test',password,workshop:'Workshop B'});assert.equal(other.status,201);assert.equal(other.body.workspace.devices.length,0);
  const invitation=await call('invites','POST',{},owner.cookie);assert.equal(invitation.status,201);
  const member=await call('register','POST',{email:'member@example.test',password,invite:invitation.body.invite});assert.equal(member.status,201);assert.equal(member.body.workshop,'Workshop A');assert.equal(member.body.workspace.devices.length,5);
  assert.equal((await call('invites','POST',{},member.cookie)).status,403);
  assert.equal((await call('register','POST',{email:'reuse@example.test',password,invite:invitation.body.invite})).status,400);
  const changed={...seed,budget:3000};assert.equal((await call('workspace','PUT',{workshopId:owner.body.workshopId,revision:2,workspace:changed},member.cookie)).status,200);
  assert.equal((await call('workspace','PUT',{workshopId:owner.body.workshopId,revision:2,workspace:seed},owner.cookie)).status,409);
  assert.equal((await call('session','GET',undefined,other.cookie)).body.workspace.devices.length,0);
  await stop();await start();assert.equal((await call('session','GET',undefined,owner.cookie)).body.workspace.budget,3000);
  assert.equal((await call('logout','POST',{},owner.cookie)).status,200);assert.equal((await call('session','GET',undefined,owner.cookie)).status,401);
 }finally{if(server?.listening)await stop();await rm(directory,{recursive:true,force:true});}
});
