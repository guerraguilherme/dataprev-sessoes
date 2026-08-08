'use strict';

(function(){
  function attach(scroll){
    if(!scroll||scroll.dataset.scrollIndicatorReady==='1')return;
    const body=scroll.closest('.discipline-body');if(!body)return;
    const indicator=document.createElement('div');indicator.className='discipline-scroll-indicator';indicator.innerHTML='<span class="discipline-scroll-thumb"></span>';
    body.appendChild(indicator);scroll.dataset.scrollIndicatorReady='1';
    const thumb=indicator.querySelector('.discipline-scroll-thumb');
    const update=()=>{
      const max=scroll.scrollHeight-scroll.clientHeight;
      if(max<=2){indicator.classList.remove('visible');return}
      indicator.classList.add('visible');
      const rail=indicator.clientHeight;
      const ratio=Math.max(.14,Math.min(1,scroll.clientHeight/scroll.scrollHeight));
      const h=Math.max(28,rail*ratio);
      const travel=Math.max(0,rail-h);
      const y=max?travel*(scroll.scrollTop/max):0;
      thumb.style.height=h+'px';thumb.style.transform=`translateY(${y}px)`;
    };
    scroll.addEventListener('scroll',update,{passive:true});
    if('ResizeObserver'in window){const ro=new ResizeObserver(update);ro.observe(scroll);ro.observe(scroll.firstElementChild||scroll)}
    setTimeout(update,0);setTimeout(update,180);
  }
  function scan(){document.querySelectorAll('.discipline-scroll').forEach(attach)}
  const mo=new MutationObserver(scan);mo.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('.discipline-toggle'))setTimeout(scan,0)});
  scan();
})();
