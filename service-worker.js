const CACHE_NAME='dataprev-sessoes-standalone-v1';
const SHELL=['./','./index.html','./manifest.webmanifest'];
const CONTENT=[
  'https://guerraguilherme.github.io/dataprev-cards/sessoes/sessions.json',
  'https://guerraguilherme.github.io/dataprev-cards/sessoes/PY-COND-R01.json',
  'https://guerraguilherme.github.io/dataprev-cards/sessoes/MAT-ALG-002.json',
  'https://guerraguilherme.github.io/dataprev-cards/sessoes/BD-NORM-002.json',
  'https://guerraguilherme.github.io/dataprev-cards/icons/icon-192.png',
  'https://guerraguilherme.github.io/dataprev-cards/icons/icon-512.png'
];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll([...SHELL,...CONTENT])));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dataprev-sessoes-standalone-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function networkFirst(request,fallback){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(!response||!response.ok)throw new Error('network');
    cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request))||(fallback?await cache.match(fallback):null)||new Response('Indisponível offline.',{status:503});
  }
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'){
    event.respondWith(networkFirst(event.request,'./index.html'));
    return;
  }
  if(url.origin===self.location.origin||CONTENT.includes(url.href)){
    event.respondWith(networkFirst(event.request));
  }
});