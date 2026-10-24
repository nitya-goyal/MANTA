const steps=[
 ['overview','See the opportunity','Five faulty laptops, a limited repair budget, and one reusable part. Compare the plan with selling every device as-is.'],
 ['inventory','Inspect the findings','Look at the battery, RAM, display, board, and keyboard faults. Every estimate can be edited; these are illustrative values.'],
 ['evidence','Check the evidence','The sample has no market observations. Add a real source manually when available; the demo does not fetch live prices.'],
 ['planner','Explore the trade-offs','Try the ₹3,000 budget preset, then return to ₹6,500. Disable donor confirmation to see how compatibility changes the allocation.'],
 ['review','Explain the decision','Review each route and its costs, approve only after checking assumptions, then export the CSV. Estimates exclude acquisition costs and overhead.']
];
export function mountShowcase(page){
 if(window.MANTA_BACKEND)return;
 const active=window.MANTA_DEMO;
 if(!active&&page!=='overview')return;
 const section=document.createElement('section');section.className='showcase-banner';section.setAttribute('aria-label',active?'Guided demo':'Explore MANTA');
 if(!active){section.innerHTML='<div><strong>New to MANTA?</strong><p>Explore a five-device sample in a temporary workspace. Your saved batch stays untouched.</p></div><a class="button primary" href="?demo=1#overview">Start guided demo →</a>';}
 else{
  const index=Math.max(0,steps.findIndex(s=>s[0]===page));const [,title,description]=steps[index];
  section.innerHTML=`<div><span class="eyebrow">GUIDED DEMO · ${index+1} OF ${steps.length} · SAMPLE DATA</span><h2>${title}</h2><p>${description}</p><small>Temporary session: refresh resets the sample. Your saved workspace is unchanged.</small></div><div class="showcase-actions">${index?`<a class="button" href="#${steps[index-1][0]}">← Back</a>`:''}${index<steps.length-1?`<a class="button primary" href="#${steps[index+1][0]}">Next step →</a>`:'<a class="button primary" href="?#overview">Finish demo</a>'}<a class="text-link" href="?#overview">Exit demo</a></div>`;
 }
 document.querySelector('#app').prepend(section);
}
