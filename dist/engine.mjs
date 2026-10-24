export const seed = {
 budget: 6500, hours: 8, approved: null,
 devices: [
 {id:'M-001',model:'Lenovo ThinkPad T480',spec:'Core i5 · 8 GB · 256 GB',fault:'Battery no longer holds charge',part:'Battery',asIs:5500,resale:14500,parts:2400,labour:700,fees:1300,hours:2},
 {id:'M-002',model:'Dell Latitude 5490',spec:'Core i5 · 8 GB · 256 GB',fault:'Memory failure · technician confirmed',part:'8 GB DDR4 RAM',asIs:4800,resale:13500,parts:1800,labour:500,fees:1200,hours:1},
 {id:'M-003',model:'HP EliteBook 840 G5',spec:'Core i5 · 8 GB · 256 GB',fault:'Cracked display assembly',part:'Display',asIs:4200,resale:15000,parts:4800,labour:1000,fees:1400,hours:3},
 {id:'M-004',model:'Dell Latitude 5480',spec:'Core i5 · 8 GB · No SSD',fault:'Board failure · RAM tested healthy',part:'Mainboard',asIs:2500,resale:11000,parts:7000,labour:1500,fees:1100,hours:4},
 {id:'M-005',model:'Lenovo ThinkPad X270',spec:'Core i5 · 8 GB · 256 GB',fault:'Keyboard intermittent',part:'Keyboard',asIs:4500,resale:12000,parts:1600,labour:700,fees:1100,hours:2}
 ],
 donor:{from:'M-004',to:'M-002',confirmed:true,residual:1300,hours:0.5},
 evidence:[]
};
export function optimise(state) {
 const ds=state.devices, donor=state.donor;
 if(ds.length>12) throw new Error('This MVP supports up to 12 devices per batch.');
 const baseline=ds.reduce((s,d)=>s+d.asIs,0);
 let best={net:baseline,spend:0,hours:0,rows:ds.map(d=>({id:d.id,action:'Sell as-is',net:d.asIs,cost:0,hours:0}))};
 const valid=donor.confirmed && donor.from!==donor.to && ds.some(d=>d.id===donor.from)&&ds.some(d=>d.id===donor.to);
 for(let mask=0;mask<2**ds.length;mask++) for(const use of valid?[false,true]:[false]) {
  if(use && (!(mask & (1<<ds.findIndex(d=>d.id===donor.to))) || (mask & (1<<ds.findIndex(d=>d.id===donor.from))))) continue;
  let spend=0,hours=0,net=0;
  const rows=ds.map((d,i)=>{
   let row={id:d.id,action:'Sell as-is',net:d.asIs,cost:0,hours:0};
   if(mask & (1<<i)){const reused=use&&d.id===donor.to;row={id:d.id,action:reused?'Repair with donor':'Repair',cost:(reused?0:d.parts)+d.labour,hours:d.hours,net:d.resale-(reused?0:d.parts)-d.labour-d.fees};}
   if(use&&d.id===donor.from)row={id:d.id,action:'Donate part',cost:0,hours:donor.hours,net:donor.residual};
   spend+=row.cost;hours+=row.hours;net+=row.net;return row;
  });
  if(spend<=state.budget && hours<=state.hours && (net>best.net || (net===best.net&&spend<best.spend))) best={net,spend,hours,rows};
 }
 return {...best,baseline,uplift:best.net-baseline};
}
