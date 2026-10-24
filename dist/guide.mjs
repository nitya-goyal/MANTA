const tips={
 overview:['A clearer route for every device','Start with the inventory, add real market evidence, then compare recovery routes within your workshop limits.','inventory','Check your devices'],
 inventory:['Good plans start with good findings','Replace the sample devices and estimates with your own. Record faults before choosing repair, resale, or donor routes.','evidence','Add market evidence'],
 evidence:['Give your estimates a source','Record comparable prices and source links. Check condition and selling costs before using a listing as an estimate.','planner','Set workshop limits'],
 planner:['Make the most of your limits','Try a different budget or technician capacity to compare plans. Confirm donor compatibility only after a technician checks both devices.','review','Review the breakdown'],
 review:['One final workshop check','Review findings, repair costs, and donor compatibility before approval. Approval records a decision; it does not order parts or start repairs.','inventory','Revisit the inventory']
};
export function mountGuide(page){
 let button=document.querySelector('#manta-guide');
 if(!button){
  button=document.createElement('button');button.id='manta-guide';button.className='guide-trigger';button.type='button';button.setAttribute('aria-haspopup','dialog');
  button.innerHTML='<img src="manta.svg" alt="" width="30" height="26"> Manta Guide';
  document.querySelector('header').append(button);
 }
 button.onclick=()=>{
  const [title,body,target,label]=tips[page]||tips.overview;
  const dialog=document.createElement('dialog');dialog.className='guide-dialog';dialog.setAttribute('aria-labelledby','guide-title');
  dialog.innerHTML=`<div class="guide-portrait"><img src="manta.svg" alt="Manta ray guide" width="120" height="100"><span class="guide-eyes" aria-hidden="true">••</span></div><span class="eyebrow">MANTA GUIDE · WORKSHOP TIPS</span><h2 id="guide-title">${title}</h2><p>${body}</p><div class="guide-footnote">${window.MANTA_DEMO?'This demo is temporary. Refresh resets the sample; Exit returns to your saved workspace.':window.MANTA_BACKEND?'Save to your workshop to share this draft. Download a backup before replacing unsaved work.':'Your data stays in this browser. Download a workspace backup to keep a restorable copy.'}</div><div class="dialog-actions"><button type="button" class="button" data-dismiss>Close</button><a class="button primary" href="#${target}">${label} →</a></div>`;
  document.body.append(dialog);
  dialog.querySelector('[data-dismiss]').onclick=()=>dialog.close();
  dialog.querySelector('a').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{dialog.remove();button.focus();},{once:true});
  dialog.showModal();
 };
}
