'use strict';

(function(){
  const panelId='simuladoPanel';
  let confirmScrollY=null;

  // Ao confirmar uma resposta, o simulador inteiro é rerenderizado. O código-base
  // leva a página ao topo; no iPhone isso quebra a continuidade da leitura.
  // Guardamos a posição antes do clique e a restauramos depois do rerender.
  document.addEventListener('click',event=>{
    const btn=event.target.closest?.('#simConfirm');
    if(!btn)return;
    confirmScrollY=window.scrollY;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(confirmScrollY===null)return;
      window.scrollTo({top:confirmScrollY,behavior:'auto'});
      confirmScrollY=null;
    }));
  },true);

  function resetCurrentSimulado(){
    if(!window.confirm('Reiniciar este simulado? Todas as respostas, marcações de apoio, segurança e tempo deste simulado serão apagados neste aparelho.'))return;
    if(typeof simState==='undefined'||typeof simCurrent==='undefined'||!simCurrent)return;
    const id=simState?.simuladoId||simCurrent.id;
    if(!id)return;

    try{
      const map=typeof simReadStates==='function'?simReadStates():JSON.parse(localStorage.getItem('dataprev_simulados_states_v1')||'{}');
      delete map[id];
      if(typeof simWriteStates==='function')simWriteStates(map);
      else localStorage.setItem('dataprev_simulados_states_v1',JSON.stringify(map));

      simState=typeof simGetState==='function'?simGetState(id):{simuladoId:id,currentIndex:0,answers:{},activeMs:0};
      simState.startedAt=new Date().toISOString();
      simState.completedAt='';
      simState.currentIndex=0;
      simState.answers={};
      simState.activeMs=0;
      simState.timerRunning=true;
      simState.lastTick=Date.now();
      simState.generationTriggered=true;
      if(typeof simSaveState==='function')simSaveState();
      if(typeof simRender==='function')simRender();
      requestAnimationFrame(()=>document.getElementById(panelId)?.scrollIntoView({block:'start',behavior:'auto'}));
    }catch(error){
      console.error('Falha ao reiniciar simulado:',error);
      alert('Não foi possível reiniciar o simulado neste aparelho.');
    }
  }

  function ensureResetButton(){
    const panel=document.getElementById(panelId);
    if(!panel||panel.classList.contains('hidden'))return;
    if(panel.querySelector('[data-reset-simulado]'))return;

    const head=panel.querySelector('.sim-head');
    const resultHome=panel.querySelector('#simResultHome');
    const button=document.createElement('button');
    button.type='button';
    button.className='danger';
    button.dataset.resetSimulado='1';
    button.textContent='Resetar simulado';
    button.addEventListener('click',resetCurrentSimulado);

    if(head){
      const existing=head.querySelector('#simExit');
      if(existing){
        let actions=head.querySelector('.sim-head-actions');
        if(!actions){
          actions=document.createElement('div');
          actions.className='sim-head-actions';
          existing.parentNode.insertBefore(actions,existing);
          actions.appendChild(existing);
        }
        actions.appendChild(button);
      }else head.appendChild(button);
    }else if(resultHome){
      resultHome.parentElement?.appendChild(button);
    }
  }

  const style=document.createElement('style');
  style.textContent='.sim-head-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.sim-head-actions button{min-width:0}@media(max-width:580px){.sim-head{display:block}.sim-head-actions{display:grid;grid-template-columns:1fr;margin-top:10px}.sim-head-actions button{width:100%}}';
  document.head.appendChild(style);

  const panel=document.getElementById(panelId);
  if(panel){
    new MutationObserver(()=>ensureResetButton()).observe(panel,{childList:true,subtree:true});
    ensureResetButton();
  }
})();
