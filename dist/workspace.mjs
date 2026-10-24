import {mountGuide} from './guide.mjs?v=showcase1';
const money=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let query='',route='';

export function enhanceWorkspace(state,plan,page,{save,persist,render,toast,modal}){
 mountGuide(page);
 const main=document.querySelector('#app');
 document.title=({overview:'Overview',inventory:'Inventory',evidence:'Market evidence',planner:'Recovery planner',review:'Plan review'}[page])+' · MANTA';
 if(page!=='overview'){
  const steps=document.createElement('nav');steps.className='workflow';steps.setAttribute('aria-label','Batch workflow');
  steps.innerHTML=[['inventory','Inventory'],['evidence','Evidence'],['planner','Plan'],['review','Review']].map(([id,label],i)=>`<a href="#${id}" ${id===page?'aria-current="step"':''}><span>${i+1}</span>${label}</a>`).join('');main.prepend(steps);
 }
 if(page==='overview'){
  main.querySelector('h1').textContent='Batch overview';
  main.querySelector('.page-title p').textContent='Your devices, your limits, one recovery plan.';
  const hero=main.querySelector('.hero');hero.className='recovery-hero';
  hero.innerHTML=`<div><span class="eyebrow">YOUR RECOVERY OPPORTUNITY</span><h2>${money(plan.uplift)} <span>more potential recovery</span></h2><p>Compared with selling every device as-is, using your current estimates.</p><div class="hero-actions"><a class="button primary" href="#planner">Adjust your plan ↗</a><a class="text-link" href="#review">See the breakdown</a></div></div><div class="comparison"><div class="spread"><span>Sell all as-is</span><strong>${money(plan.baseline)}</strong></div><div class="comparison-track" aria-hidden="true"><span class="baseline-bar" style="width:${plan.net?Math.min(100,plan.baseline/plan.net*100):0}%"></span></div><div class="spread"><span>With your plan</span><strong>${money(plan.net)}</strong></div><div class="comparison-track" aria-hidden="true"><span style="width:${plan.net?100:0}%"></span></div><small>After repair costs & selling allowances</small></div>`;
  const repair=plan.rows.filter(r=>r.action.startsWith('Repair')).length,sell=plan.rows.filter(r=>r.action==='Sell as-is').length,donors=plan.rows.filter(r=>r.action==='Donate part').length;
  main.querySelector('.panel-head h2').textContent='Recommended routes';
  main.querySelector('.panel-head p').textContent=`${repair} repair · ${sell} sell as-is · ${donors} donor`;
  main.querySelectorAll('.mini-row').forEach((row,i)=>{const a=document.createElement('a');a.href='#'+['inventory','evidence','review'][i];a.className='mini-row next-step';a.innerHTML=row.innerHTML+'<span class="step-arrow" aria-hidden="true">↗</span>';row.replaceWith(a);});
  const donorFlow=main.querySelector('.donor-flow');
  const from=state.devices.find(d=>d.id===state.donor.from),to=state.devices.find(d=>d.id===state.donor.to);
  if(from&&to&&from.id!==to.id){donorFlow.innerHTML=`<div><strong>${escape(from.id)}</strong><small>${escape(from.model)}</small></div><span>→</span><div><strong>${escape(to.id)}</strong><small>${escape(to.model)}</small></div>`;}else{donorFlow.textContent='No donor pair selected';}
  const donorCard=donorFlow.closest('.panel');
  donorCard.querySelector('.badge').textContent=from&&to&&from.id!==to.id&&state.donor.confirmed?'CONFIRMED MATCH':'MATCH NEEDS REVIEW';
  donorCard.querySelector('p').textContent='Reuse only technician-verified parts. The plan includes the donor’s remaining value.';
 }
 if(page==='inventory'){
  main.querySelector('h1').textContent='Device inventory';
  main.querySelector('.note').textContent='Starts with a sample batch. Confirm device findings and replace illustrative values before using the plan.';
  const toolbar=main.querySelector('.toolbar'),search=main.querySelector('#search');search.value=query;
  const select=document.createElement('select');select.id='route-filter';select.setAttribute('aria-label','Filter by route');
  select.innerHTML=['','Repair','Repair with donor','Sell as-is','Donate part'].map(v=>`<option value="${v}">${v||'All routes'}</option>`).join('');select.value=route;toolbar.insertBefore(select,toolbar.lastElementChild);
  const count=toolbar.lastElementChild;count.setAttribute('role','status');
  const empty=document.createElement('div');empty.className='empty';empty.hidden=true;empty.innerHTML='<h3>No matching devices</h3><p>Try a different model, finding, or repair route.</p><br><button type="button" class="button">Clear filters</button>';main.querySelector('#inventory-table').append(empty);
  function filter(){let n=0;main.querySelectorAll('tbody tr').forEach((tr,i)=>{tr.hidden=!tr.textContent.toLowerCase().includes(query.toLowerCase())||!!(route&&plan.rows[i].action!==route);if(!tr.hidden)n++;});count.textContent=`${n} of ${state.devices.length} devices`;empty.hidden=n>0||!state.devices.length;const table=main.querySelector('.table-wrap');if(table)table.hidden=n===0;}
  search.addEventListener('input',()=>{query=search.value;filter();});select.onchange=()=>{route=select.value;filter();};empty.querySelector('button').onclick=()=>{query='';route='';search.value='';select.value='';filter();search.focus();};filter();
 }
 if(page==='planner'){
  main.querySelector('h1').textContent='Recovery planner';
  main.querySelector('.panel-head p').textContent='Set your limits, then leave the field to recalculate.';
  const presets=document.createElement('div');presets.className='presets';presets.innerHTML='<span>Try a budget</span>'+[3000,6500,10000].map(n=>`<button type="button" class="preset" data-budget="${n}" aria-pressed="${n===state.budget}">${money(n)}</button>`).join('');main.querySelector('.controls').before(presets);
  presets.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.budget=Number(b.dataset.budget);save();render();document.querySelector(`[data-budget="${state.budget}"]`)?.focus();toast('Budget updated. Plan recalculated.');});
  const validPair=state.devices.some(d=>d.id===state.donor.from)&&state.devices.some(d=>d.id===state.donor.to)&&state.donor.from!==state.donor.to;
  main.querySelector('#confirmed').disabled=!validPair;
  if(!validPair){const warning=document.createElement('p');warning.className='danger';warning.textContent='Select two different devices to enable a donor match.';main.querySelector('#confirmed').closest('label').after(warning);}
 }
 if(page==='review'){
  main.querySelector('h1').textContent='Review your plan';
  const button=main.querySelector('[data-action="approve"]');button.disabled=!!state.approved||!state.devices.length;
  if(!state.approved)button.textContent='Review & approve';
  button.onclick=()=>modal(`<form><h2>Approve this recovery plan?</h2><p>${money(plan.spend)} repair spend · ${plan.hours} technician hours · ${money(plan.net)} estimated net recovery.</p><div class="note approval-note">This records your decision only. It does not order parts or dispatch repairs.</div><label class="inline-check approval-check"><input type="checkbox" required> I have reviewed the findings, costs, and any donor compatibility.</label><div class="dialog-actions"><button type="button" class="button" data-close>Keep reviewing</button><button class="button primary">Approve plan</button></div></form>`,()=>{state.approved=new Date().toISOString();persist();document.querySelector('#modal').close();render();toast('Plan approved. Export it to share with your workshop.');});
 }
 main.querySelectorAll('table').forEach(table=>{
  table.classList.add('responsive-table');table.setAttribute('role','table');
  table.setAttribute('aria-label',page==='review'?'Recovery plan decisions':'Batch devices');
  table.querySelectorAll('thead,tbody').forEach(el=>el.setAttribute('role','rowgroup'));
  table.querySelectorAll('tr').forEach(el=>el.setAttribute('role','row'));
  table.querySelectorAll('th').forEach(th=>{th.setAttribute('role','columnheader');th.setAttribute('scope','col');});
  const headings=[...table.querySelectorAll('th')].map(th=>th.textContent);
  table.querySelectorAll('tbody tr').forEach(row=>row.querySelectorAll('td').forEach((td,i)=>{td.setAttribute('role','cell');if(i&&headings[i]){const label=document.createElement('span');label.className='mobile-cell-label';label.setAttribute('aria-hidden','true');label.textContent=headings[i];td.prepend(label);}}));
 });
 if(!state.devices.length){main.querySelectorAll('.table-wrap').forEach(el=>{el.hidden=false;el.innerHTML='<div class="empty"><h3>No devices yet</h3><p>Add a device to start your recovery plan.</p><a class="button" href="#inventory">Open inventory →</a></div>';});}
 main.querySelectorAll('[data-edit]').forEach(b=>{const d=state.devices.find(d=>d.id===b.dataset.edit);b.setAttribute('aria-label','Edit '+d.model);});
}
