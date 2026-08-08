'use strict';

(function(){
  if(document.getElementById('simuladosMediaStyles'))return;
  const style=document.createElement('style');
  style.id='simuladosMediaStyles';
  style.textContent='.sim-stimuli{display:grid;gap:10px;margin:0 0 14px}.sim-stimulus{border:1px solid var(--line);border-radius:13px;background:#f8fafc;padding:11px 12px}.sim-stimulus-label{font-size:.76rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px}.sim-stimulus-body{font-size:.9rem;line-height:1.6;color:var(--text)}.sim-stimulus-source{font-size:.72rem;line-height:1.4;color:var(--muted);margin-top:7px}.sim-stimulus-code pre{margin:0}.sim-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}.sim-stimulus table{width:100%;border-collapse:collapse;font-size:.82rem;min-width:360px}.sim-stimulus th,.sim-stimulus td{border:1px solid var(--line);padding:8px 9px;text-align:left;vertical-align:top}.sim-stimulus th{background:#eef2f7;font-weight:850}.sim-stimulus-image{margin:0}.sim-stimulus-image img{display:block;max-width:100%;height:auto;margin:auto;border-radius:9px}.sim-stimulus-image figcaption{font-size:.78rem;line-height:1.45;color:var(--muted);margin-top:7px}@media(max-width:580px){.sim-stimulus{padding:10px}.sim-stimulus table{font-size:.78rem}.sim-stimulus th,.sim-stimulus td{padding:7px}}';
  document.head.appendChild(style);
})();

function simStimulusHtml(q){
  const items=Array.isArray(q.stimuli)?q.stimuli:(q.stimulus?[q.stimulus]:[]);
  if(!items.length)return'';
  return `<div class="sim-stimuli">${items.map((s,idx)=>{
    if(!s||!s.type)return'';
    const label=s.label?`<div class="sim-stimulus-label">${esc(s.label)}</div>`:'';
    if(s.type==='passage'||s.type==='quote'||s.type==='reference'){
      const source=s.source?`<div class="sim-stimulus-source">${esc(s.source)}</div>`:'';
      return `<section class="sim-stimulus sim-stimulus-text">${label}<div class="sim-stimulus-body">${esc(s.text||'').replace(/\n/g,'<br>')}</div>${source}</section>`;
    }
    if(s.type==='code'){
      const lang=s.language?`<div class="sim-stimulus-source">${esc(s.language)}</div>`:'';
      return `<section class="sim-stimulus sim-stimulus-code">${label}<pre>${esc(s.code||s.text||'')}</pre>${lang}</section>`;
    }
    if(s.type==='table'){
      const headers=Array.isArray(s.headers)?s.headers:[];
      const rows=Array.isArray(s.rows)?s.rows:[];
      const head=headers.length?`<thead><tr>${headers.map(h=>`<th>${esc(String(h))}</th>`).join('')}</tr></thead>`:'';
      const body=`<tbody>${rows.map(r=>`<tr>${(Array.isArray(r)?r:[r]).map(c=>`<td>${esc(String(c))}</td>`).join('')}</tr>`).join('')}</tbody>`;
      const source=s.source?`<div class="sim-stimulus-source">${esc(s.source)}</div>`:'';
      return `<section class="sim-stimulus sim-stimulus-table">${label}<div class="sim-table-wrap"><table>${head}${body}</table></div>${source}</section>`;
    }
    if(s.type==='image'||s.type==='chart'||s.type==='diagram'){
      const src=esc(s.src||'');
      const alt=esc(s.alt||s.label||`Recurso visual ${idx+1}`);
      const caption=s.caption?`<figcaption>${esc(s.caption)}</figcaption>`:'';
      const source=s.source?`<div class="sim-stimulus-source">${esc(s.source)}</div>`:'';
      return `<figure class="sim-stimulus sim-stimulus-image">${label}<img src="${src}" alt="${alt}" loading="lazy">${caption}${source}</figure>`;
    }
    return `<section class="sim-stimulus sim-stimulus-text">${label}<div class="sim-stimulus-body">${esc(s.text||'')}</div></section>`;
  }).join('')}</div>`;
}

const simValidateQuestionBase=simValidateQuestion;
simValidateQuestion=function(q,index){
  simValidateQuestionBase(q,index);
  const items=Array.isArray(q.stimuli)?q.stimuli:(q.stimulus?[q.stimulus]:[]);
  for(const s of items){
    if(!s?.type)throw new Error(`${q.id}: estímulo sem tipo`);
    if(['image','chart','diagram'].includes(s.type)&&!s.src)throw new Error(`${q.id}: recurso visual sem arquivo`);
    if(['image','chart','diagram'].includes(s.type)&&!s.alt&&!s.label)throw new Error(`${q.id}: recurso visual sem descrição acessível`);
    if(s.type==='table'&&!Array.isArray(s.rows))throw new Error(`${q.id}: tabela sem linhas`);
  }
};

const simRenderBaseWithStimuli=simRender;
simRender=function(){
  simRenderBaseWithStimuli();
  if(!simCurrent||!simState||simState.completedAt)return;
  const q=simCurrent.questions?.[simState.currentIndex];
  if(!q)return;
  const html=simStimulusHtml(q);
  if(!html)return;
  const exercise=document.querySelector('#simuladoPanel .exercise');
  if(exercise)exercise.insertAdjacentHTML('afterbegin',html);
};
