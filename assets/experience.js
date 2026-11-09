(()=>{'use strict';
const t=(key,fallback)=>window.LC_I18N?.[key]||fallback;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const ease='cubic-bezier(.16,1,.3,1)';
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const menu=document.querySelector('.nav-toggle'),nav=document.querySelector('.nav-links');if(menu&&nav?.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent=t('menu','Menú +');menu.focus()}});

// Only below-the-fold content is initially hidden. Reading and keyboard access
// continue to work if motion is unavailable or JavaScript runs late.
const revealTargets=[...document.querySelectorAll('.section-top,.work-tile,.art-grid>figure,.art-preview>figure,.case-section>.section-top,.frames-grid>figure,.film,.about-image,.about-copy,.offer,.press-teaser,.talk-row,.download-card,.press-intro,.contact-heading,.contact-form,.footer-grid>div')];
if(!reduced.matches&&'IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}
  }),{threshold:.07,rootMargin:'0px 0px -25px 0px'});
  revealTargets.forEach(el=>{
    if(el.getBoundingClientRect().top<innerHeight*.92)return;
    el.classList.add('reveal-ready');
    if(el.matches('figure,.about-image'))el.classList.add('reveal-image');
    const siblings=[...el.parentElement.children].filter(c=>c.matches('.work-tile,.film,.download-card'));
    if(siblings.length>1)el.style.setProperty('--reveal-delay',(siblings.indexOf(el)%2)*90+'ms');
    observer.observe(el);
  });
  // A keyboard user must never focus an invisible control during a reveal.
  document.addEventListener('focusin',e=>e.target.closest('.reveal-ready')?.classList.add('is-visible'));
  reduced.addEventListener('change',()=>{if(reduced.matches){revealTargets.forEach(el=>el.classList.add('is-visible'));observer.disconnect()}});
}

const head=document.querySelector('.site-head'),floating=document.querySelector('.floating-contact'),foot=document.querySelector('.new-footer');
let scrollScheduled=false;
const parallax=[...document.querySelectorAll('.visual-break')];
function updateScroll(){
  const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;
  head?.classList.toggle('is-scrolled',y>55);
  head?.style.setProperty('--scroll-progress',max>0?y/max:0);
  const nearFooter=foot&&foot.getBoundingClientRect().top<innerHeight;
  const contact=document.querySelector('.contact-section')?.getBoundingClientRect();
  const nearContact=contact&&contact.top<innerHeight&&contact.bottom>0;
  floating?.classList.toggle('is-visible',y>innerHeight*.65&&!nearFooter&&!nearContact);
  if(!reduced.matches)parallax.forEach(el=>{const r=el.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)el.style.setProperty('--parallax-y',((innerHeight/2-r.top-r.height/2)*.09)+'px')});
  scrollScheduled=false;
}
addEventListener('scroll',()=>{if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(updateScroll)}},{passive:true});
addEventListener('resize',updateScroll,{passive:true});updateScroll();

const reel=document.querySelector('.reel-video');
if(reel){
  const region=reel.closest('.reel-hero'),pause=region.querySelector('[data-reel-pause]'),sound=region.querySelector('[data-reel-sound]');
  let userPaused=false,onScreen=true;
  function reelControls(){
    pause.textContent=reel.paused?t('reelResume','Reproducir'):t('reelPause','Pausar');
    pause.setAttribute('aria-label',reel.paused?t('reelResumeLabel','Reproducir reel'):t('reelPauseLabel','Pausar reel'));
    pause.setAttribute('aria-pressed',String(reel.paused));
    sound.textContent=reel.muted?t('reelSound','Activar sonido'):t('reelMute','Silenciar');
    sound.setAttribute('aria-label',sound.textContent);sound.setAttribute('aria-pressed',String(!reel.muted));
  }
  function reelVisibility(){
    if(document.hidden||!onScreen||userPaused){reel.pause();return}
    reel.play().catch(()=>reelControls());
  }
  pause.addEventListener('click',()=>{userPaused=!reel.paused;if(userPaused)reel.pause();else reel.play().catch(()=>reelControls())});
  sound.addEventListener('click',()=>{reel.muted=!reel.muted;if(!userPaused&&reel.paused)reel.play().catch(()=>{});reelControls()});
  reel.addEventListener('play',()=>{userPaused=false;reelControls()});
  reel.addEventListener('pause',()=>{if(onScreen&&!document.hidden)userPaused=true;reelControls()});
  ['volumechange','loadedmetadata','error'].forEach(event=>reel.addEventListener(event,reelControls));
  document.addEventListener('visibilitychange',reelVisibility);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;reelVisibility()},{threshold:.08}).observe(region);
  addEventListener('pagehide',()=>reel.pause());addEventListener('pageshow',reelVisibility);
  if(navigator.connection?.saveData){userPaused=true;reel.autoplay=false;reel.pause()}
  else reelVisibility();
  reelControls();
}

const slider=document.querySelector('.hero-slider');
if(slider){
  const slides=[...slider.querySelectorAll('.hero-slide')],tabs=[...slider.querySelectorAll('.hero-tab')],pause=slider.querySelector('[data-hero-pause]'),announce=slider.querySelector('.hero-announcement');
  let index=0,elapsed=0,last=0,raf=0,userPaused=reduced.matches,hovered=false,onScreen=true,swipeX=null;
  const period=7000;
  function stopped(){return userPaused||hovered||document.hidden||!onScreen}
  function activeVideo(){return slides[index].querySelector('video')}
  function updateVideo(){
    slides.forEach((s,i)=>{const v=s.querySelector('video');if(!v)return;if(i!==index||stopped()){v.pause();return}if(navigator.connection?.saveData)return;if(!v.src)v.src=v.dataset.src;v.play().then(()=>v.classList.add('is-playing')).catch(()=>v.classList.remove('is-playing'))});
  }
  function controls(){pause.textContent=userPaused?'▶':'Ⅱ';pause.setAttribute('aria-label',userPaused?t('resume','Reanudar presentación'):t('pause','Pausar presentación'));pause.setAttribute('aria-pressed',String(userPaused))}
  function go(next,manual=false){
    const previous=index;index=(next+slides.length)%slides.length;elapsed=0;last=0;
    slides.forEach((s,i)=>{const active=i===index;s.classList.toggle('is-active',active);s.inert=!active;s.setAttribute('aria-hidden',String(!active))});
    tabs.forEach((t,i)=>{t.classList.toggle('is-active',i===index);t.setAttribute('aria-pressed',String(i===index));t.style.setProperty('--slide-progress',i===index?(reduced.matches?1:0):0)});
    if(previous!==index){const v=activeVideo();if(v?.src)v.currentTime=0}
    if(manual){announce.setAttribute('aria-live','polite');announce.textContent=slides[index].getAttribute('aria-label')}
    else announce.setAttribute('aria-live','off');
    updateVideo();
  }
  function tick(now){if(last&&!stopped()){elapsed+=Math.min(now-last,100);tabs[index].style.setProperty('--slide-progress',Math.min(elapsed/period,1));if(elapsed>=period)go(index+1)}last=now;raf=requestAnimationFrame(tick)}
  tabs.forEach((t,i)=>t.addEventListener('click',()=>go(i,true)));
  slider.querySelector('[data-hero-prev]').addEventListener('click',()=>go(index-1,true));
  slider.querySelector('[data-hero-next]').addEventListener('click',()=>go(index+1,true));
  pause.addEventListener('click',()=>{userPaused=!userPaused;hovered=false;controls();updateVideo()});
  slider.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=true;updateVideo()}});
  slider.addEventListener('pointerleave',()=>{hovered=false;updateVideo()});
  slider.addEventListener('focusin',e=>{if(e.target===pause)return;userPaused=true;controls();updateVideo()});
  slider.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();go(index+1,true)}if(e.key==='ArrowLeft'){e.preventDefault();go(index-1,true)}});
  slider.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')swipeX=e.clientX});
  slider.addEventListener('pointerup',e=>{if(swipeX!==null){const delta=e.clientX-swipeX;if(Math.abs(delta)>60)go(index+(delta<0?1:-1),true);swipeX=null}});
  document.addEventListener('visibilitychange',updateVideo);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;updateVideo()},{threshold:.12}).observe(slider);
  reduced.addEventListener('change',()=>{userPaused=reduced.matches;controls();updateVideo()});
  controls();updateVideo();raf=requestAnimationFrame(tick);
  addEventListener('pagehide',()=>{cancelAnimationFrame(raf);slides.forEach(s=>s.querySelector('video')?.pause())});
  addEventListener('pageshow',e=>{if(e.persisted){last=0;raf=requestAnimationFrame(tick);updateVideo()}});
}

// URL-encoded POST is the native Netlify Forms contract. Never report success
// before the server has accepted the request; preserve the user's text on error.
document.querySelectorAll('.contact-form').forEach(form=>{
  const button=form.querySelector('[type=submit]'),label=button.querySelector('span'),status=form.querySelector('.form-status');
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!form.reportValidity()||button.disabled)return;
    button.disabled=true;form.setAttribute('aria-busy','true');label.textContent=t('sending','Enviando…');status.textContent='';status.classList.remove('is-error');
    try{
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
      let response;
      try{response=await fetch('/contacto/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString(),signal:controller.signal})}finally{clearTimeout(timeout)}
      if(!response.ok)throw new Error('Request not accepted');
      form.reset();status.textContent=t('sent','Tu consulta ya quedó recibida. Gracias por escribir, seguimos por mail.');label.textContent=t('received','Idea recibida ✓');
    }catch(error){status.textContent=t('error','No pudimos recibir la consulta. Probá de nuevo o escribime por WhatsApp o mail; tu texto sigue acá.');status.classList.add('is-error');label.textContent=t('retry','Volver a enviar')}
    finally{button.disabled=false;form.removeAttribute('aria-busy')}
  });
});

// Prefetch pages only after clear intent, keeping large media out of the cache.
const prefetched=new Set();
document.addEventListener('pointerover',e=>{const a=e.target.closest('a[href]');if(!a||navigator.connection?.saveData)return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.hash||/\.(pdf|mp4|zip)$/.test(u.pathname)||prefetched.has(u.pathname))return;prefetched.add(u.pathname);const link=document.createElement('link');link.rel='prefetch';link.href=u.pathname;link.as='document';document.head.append(link)},{passive:true});
})();
