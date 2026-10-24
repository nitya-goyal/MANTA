import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash,scryptSync,timingSafeEqual} from 'node:crypto';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateWorkspace} from './dist/data.mjs';
import {seed} from './dist/engine.mjs';

const token=()=>randomBytes(32).toString('hex');
const hash=s=>createHash('sha256').update(s).digest('hex');
const passwordHash=(password,salt)=>scryptSync(password,salt,64).toString('hex');
export async function createBackend({database='data/manta.sqlite',origin='http://127.0.0.1:4174'}={}){
 if(database!==':memory:')await mkdir(resolve(database,'..'),{recursive:true});
 const db=new DatabaseSync(database);
 db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS workshops(id TEXT PRIMARY KEY,name TEXT NOT NULL,state TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,salt TEXT NOT NULL,workshop TEXT NOT NULL REFERENCES workshops(id),role TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS invites(token TEXT PRIMARY KEY,workshop TEXT NOT NULL REFERENCES workshops(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,workshop TEXT NOT NULL,user TEXT NOT NULL,action TEXT NOT NULL,created TEXT NOT NULL);`);
 const root=resolve('dist'), attempts=new Map();
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const error=(status,message)=>Object.assign(new Error(message),{status});
 async function body(req){if(!req.headers['content-type']?.startsWith('application/json'))throw error(415,'JSON required.');let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>2000000)throw error(413,'Request too large.');}try{return JSON.parse(text);}catch{throw error(400,'Invalid JSON.');}}
 const cookie=(res,value,age=604800)=>res.setHeader('Set-Cookie',`manta_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${origin.startsWith('https:')?'; Secure':''}`);
 const session=(req)=>{const value=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('manta_session='))?.slice(14);return value&&db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user WHERE s.token=? AND s.expires>?').get(hash(value),Date.now());};
 const login=(res,id)=>{db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());const value=token();db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(value),id,Date.now()+604800000);cookie(res,value);};
 const view=user=>{const w=db.prepare('SELECT * FROM workshops WHERE id=?').get(user.workshop);return {email:user.email,role:user.role,workshopId:w.id,workshop:w.name,revision:w.revision,workspace:JSON.parse(w.state)};};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
  try{
   if(req.headers.host!==new URL(origin).host)throw error(403,'Unexpected host.');
   const path=new URL(req.url,origin).pathname;
   if(!path.startsWith('/api/')){
    if(!['GET','HEAD'].includes(req.method))throw error(405,'Method not allowed.');
    const file=path==='/server-config.mjs'?null:resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
    if(file&&(!file.startsWith(root+sep)))throw error(403,'Forbidden.');
    const content=file?await readFile(file):'window.MANTA_BACKEND=true;';
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',file?({'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[extname(file)]||'application/octet-stream'):'text/javascript');res.end(req.method==='HEAD'?'':content);return;
   }
   if(req.method!=='GET'&&req.headers.origin!==origin)throw error(403,'Request origin rejected.');
   if(path==='/api/register'||path==='/api/login'){
    if(req.method!=='POST')throw error(405,'Method not allowed.');
    const address=req.socket.remoteAddress,now=Date.now();for(const [key,value] of attempts)if(value.until<now)attempts.delete(key);
    const attempt=attempts.get(address)||{count:0,until:now+900000};attempt.count++;attempts.set(address,attempt);if(attempt.count>20)throw error(429,'Too many attempts. Try again in 15 minutes.');
    const b=await body(req),email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof b.password!=='string'||b.password.length<12||b.password.length>128)throw error(400,'Use a valid email and a password of 12–128 characters.');
    if(path==='/api/login'){
     const u=db.prepare('SELECT * FROM users WHERE email=?').get(email);
     const candidate=passwordHash(b.password,u?.salt||'manta-dummy-salt');
     if(!u||!timingSafeEqual(Buffer.from(candidate,'hex'),Buffer.from(u.password,'hex')))throw error(401,'Email or password incorrect.');
     login(res,u.id);send(res,200,view(u));return;
    }
    if(db.prepare('SELECT id FROM users WHERE email=?').get(email))throw error(409,'Account cannot be created with these details.');
    const invitation=typeof b.invite==='string'&&b.invite?db.prepare('SELECT * FROM invites WHERE token=? AND expires>?').get(hash(b.invite),now):null;
    if(b.invite&&!invitation)throw error(400,'Invitation expired or invalid.');
    if(!invitation&&(typeof b.workshop!=='string'||!b.workshop.trim()||b.workshop.length>100))throw error(400,'Enter a workshop name (up to 100 characters).');
    const id=token(),workshop=invitation?invitation.workshop:token(),salt=token(),digest=passwordHash(b.password,salt);
    db.exec('BEGIN');try{
     if(!invitation)db.prepare('INSERT INTO workshops(id,name,state) VALUES(?,?,?)').run(workshop,b.workshop.trim(),JSON.stringify({...seed,devices:[],evidence:[],approved:null,donor:{...seed.donor,from:'',to:'',confirmed:false}}));
     db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(id,email,digest,salt,workshop,invitation?'member':'owner');
     if(invitation)db.prepare('DELETE FROM invites WHERE token=?').run(hash(b.invite));
     db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
    login(res,id);send(res,201,view(db.prepare('SELECT * FROM users WHERE id=?').get(id)));return;
   }
   const user=session(req);if(!user)throw error(401,'Sign in to your workshop.');
   if(path==='/api/session'&&req.method==='GET'){send(res,200,view(user));return;}
   if(path==='/api/logout'&&req.method==='POST'){const value=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('manta_session='))?.slice(14);db.prepare('DELETE FROM sessions WHERE token=?').run(hash(value));cookie(res,'',0);send(res,200,{ok:true});return;}
   if(path==='/api/invites'&&req.method==='POST'){
    if(user.role!=='owner')throw error(403,'Only the workshop owner can invite members.');
    const value=token();db.prepare('DELETE FROM invites WHERE expires<?').run(Date.now());db.prepare('INSERT INTO invites VALUES(?,?,?)').run(hash(value),user.workshop,Date.now()+86400000);send(res,201,{invite:value,expiresInHours:24});return;
   }
   if(path==='/api/workspace'&&req.method==='PUT'){
    const b=await body(req);if(b.workshopId!==user.workshop)throw error(409,'Your signed-in workshop changed. Reload the current session before saving.');let workspace;try{workspace=validateWorkspace(b.workspace);}catch(e){throw error(400,e.message);}
    if(!Number.isSafeInteger(b.revision))throw error(400,'Revision required.');
    db.exec('BEGIN');try{
     const result=db.prepare('UPDATE workshops SET state=?,revision=revision+1 WHERE id=? AND revision=?').run(JSON.stringify(workspace),user.workshop,b.revision);
     if(!result.changes)throw error(409,'A teammate updated this workspace. Back up your draft, then load the latest workshop before saving.');
     db.prepare('INSERT INTO audit(workshop,user,action,created) VALUES(?,?,?,?)').run(user.workshop,user.id,'workspace_saved',new Date().toISOString());db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
    send(res,200,view(user));return;
   }
   throw error(404,'Not found.');
  }catch(e){send(res,e.status||(e.code==='ENOENT'?404:500),{error:e.status?e.message:e.code==='ENOENT'?'Not found.':'Server error.'});}
 });
 server.on('close',()=>db.close());return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const origin='http://127.0.0.1:4174';const server=await createBackend({origin});server.listen(4174,'127.0.0.1',()=>console.log(`MANTA local workshop: ${origin}`));
}
