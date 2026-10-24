export function validateWorkspace(input){
 const fail=message=>{throw new Error(message);};
 const object=(v,name)=>{if(!v||typeof v!=='object'||Array.isArray(v))fail(`Invalid ${name}.`);};
 const num=(v,name,max=1000000)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max)fail(`Invalid ${name}.`);return v;};
 const str=(v,name,max=1000)=>{if(typeof v!=='string'||v.length>max)fail(`Invalid ${name}.`);return v;};
 object(input,'workspace');
 if(!Array.isArray(input.devices)||input.devices.length>12)fail('A batch supports up to 12 devices.');
 const ids=new Set();
 const devices=input.devices.map(d=>{object(d,'device');const out={};for(const k of ['id','model','spec','fault','part'])out[k]=str(d[k],k,200);if(!out.id||!out.model.trim()||ids.has(out.id))fail('Device IDs must be unique and models cannot be empty.');ids.add(out.id);for(const k of ['asIs','resale','parts','labour','fees','hours'])out[k]=num(d[k],k);return out;});
 object(input.donor,'donor');const d=input.donor;
 if(typeof d.confirmed!=='boolean')fail('Invalid donor confirmation.');
 const donor={from:str(d.from,'donor',200),to:str(d.to,'recipient',200),residual:num(d.residual,'residual'),hours:num(d.hours,'donor hours',100),confirmed:d.confirmed};
 if(!ids.has(donor.from)||!ids.has(donor.to)||donor.from===donor.to)donor.confirmed=false;
 if(!Array.isArray(input.evidence)||input.evidence.length>1000)fail('Invalid evidence list (maximum 1,000 records).');
 const evidence=input.evidence.map(e=>{object(e,'evidence');const out={};for(const k of ['title','kind','device','url','date','notes'])out[k]=str(e[k],k,k==='url'?2048:1000);if(!['Supplier quote','Resale asking price','Completed sale'].includes(out.kind))fail('Invalid evidence type.');let url;try{url=new URL(out.url);}catch{fail('Invalid source URL.');}if(!['http:','https:'].includes(url.protocol))fail('Source links must use HTTP or HTTPS.');if(!/^\d{4}-\d{2}-\d{2}$/.test(out.date)||!Number.isFinite(Date.parse(out.date)))fail('Invalid observation date.');out.price=num(e.price,'price');if(typeof e.verified!=='boolean')fail('Invalid evidence review.');out.verified=e.verified;return out;});
 let approved=input.approved;if(approved!==null&&(typeof approved!=='string'||!Number.isFinite(Date.parse(approved))))fail('Invalid approval date.');
 return {budget:num(input.budget,'budget'),hours:num(input.hours,'capacity',10000),devices,donor,evidence,approved};
}
export function readBackup(text){
 if(text.length>2000000)throw new Error('Backup exceeds the 2 MB limit.');
 const data=JSON.parse(text);
 if(data.format!=='manta-workspace'||data.version!==1)throw new Error('Choose a MANTA workspace backup (version 1).');
 return validateWorkspace(data.workspace);
}
export function makeBackup(state){return JSON.stringify({format:'manta-workspace',version:1,exportedAt:new Date().toISOString(),workspace:validateWorkspace(state)},null,2);}
