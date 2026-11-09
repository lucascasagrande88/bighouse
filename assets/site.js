(()=>{'use strict';
const t=(key,fallback)=>window.LC_I18N?.[key]||fallback;
const menu=document.querySelector('.nav-toggle'),nav=document.querySelector('.nav-links');
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?t('close','Cerrar −'):t('menu','Menú +')});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent=t('menu','Menú +')}))}
const artButtons=[...document.querySelectorAll('[data-art]')],modal=document.querySelector('.lightbox');let active=0,lastFocus=null;
function close(){if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');if(lastFocus)lastFocus.focus()}
function visibleArts(){return artButtons.filter(b=>!b.closest('[hidden]'))}
function show(index){const items=visibleArts();if(!modal||!items.length)return;active=(index+items.length)%items.length;const b=items[active],img=modal.querySelector('img');img.src=b.dataset.art;img.alt=b.querySelector('img')?.alt||b.dataset.title;modal.querySelector('.lightbox-title').textContent=b.dataset.title+' / '+String(active+1).padStart(2,'0')+' '+t('of','de')+' '+items.length}
artButtons.forEach(b=>b.addEventListener('click',()=>{lastFocus=b;show(visibleArts().indexOf(b));modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');modal.querySelector('.lightbox-close').focus()}));
if(modal){modal.querySelector('.lightbox-close').addEventListener('click',close);modal.querySelector('[data-prev]').addEventListener('click',()=>show(active-1));modal.querySelector('[data-next]').addEventListener('click',()=>show(active+1));modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(!modal.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowRight')show(active+1);if(e.key==='ArrowLeft')show(active-1);if(e.key==='Tab'){const els=[...modal.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0].focus()}}})}
document.querySelectorAll('[data-vimeo]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.vimeo;if(!/^\d+$/.test(id))return;const f=document.createElement('iframe');f.src='https://player.vimeo.com/video/'+id+'?autoplay=1&title=0&byline=0&portrait=0&dnt=1';f.title=b.dataset.title||t('video','Video de proyecto');f.allow='autoplay; fullscreen; picture-in-picture';f.allowFullscreen=true;b.replaceWith(f);f.focus()}));
document.querySelectorAll('[data-local-video]').forEach(b=>{b.hidden=false;b.addEventListener('click',()=>{document.querySelectorAll('video').forEach(v=>v.pause());const existing=b.parentElement.querySelector('video.project-video'),v=existing||document.createElement('video');if(!existing)v.src=b.dataset.localVideo;v.poster=b.querySelector('img')?.src||'';v.controls=true;v.playsInline=true;v.preload='metadata';v.setAttribute('aria-label',b.dataset.title||t('video','Video de proyecto'));if(existing)b.remove();else b.replaceWith(v);v.play().catch(()=>{});v.focus()})});
document.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());
document.querySelectorAll('[data-filter-for]').forEach(bar=>{
 const grid=document.getElementById(bar.dataset.filterFor);if(!grid)return;let run=0;
 bar.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',async()=>{
  const current=++run,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  bar.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});
  const items=[...grid.children],matches=item=>button.dataset.filter==='all'||item.dataset.category===button.dataset.filter;
  items.forEach(item=>item.getAnimations().forEach(a=>a.cancel()));
  if(!reduce)await Promise.all(items.filter(item=>!item.hidden&&!matches(item)).map(item=>item.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-12px)'}],{duration:180,easing:'cubic-bezier(.76,0,.24,1)'}).finished.catch(()=>{})));
  if(current!==run)return;
  let count=0;items.forEach(item=>{item.hidden=!matches(item);if(!item.hidden){count++;item.classList.add('is-visible');if(!reduce)item.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:Math.min(count-1,5)*35,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})}});
  const counter=bar.nextElementSibling;if(counter?.classList.contains('selection-count')){counter.textContent=count+' '+(grid.id==='art-grid'?t('images','imágenes'):t('projects','proyectos'))+' / '+(button.dataset.filter==='all'?t('all','Selección completa'):button.dataset.filter);counter.setAttribute('aria-live','polite')}
 }));
});
})();
