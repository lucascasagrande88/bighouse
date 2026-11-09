/* Language preference is local to this browser; no location or translation API. */
(()=>{'use strict';
const lang=document.documentElement.lang.startsWith('en')?'en':'es';
const messages={
 es:{reelPause:'Pausar',reelResume:'Reproducir',reelSound:'Activar sonido',reelMute:'Silenciar',reelPauseLabel:'Pausar reel',reelResumeLabel:'Reproducir reel',menu:'Menú +',close:'Cerrar −',of:'de',video:'Video de proyecto',images:'imágenes',projects:'proyectos',all:'Selección completa',resume:'Reanudar presentación',pause:'Pausar presentación',sending:'Enviando…',sent:'Tu consulta ya quedó recibida. Gracias por escribir, seguimos por mail.',received:'Idea recibida ✓',error:'No pudimos recibir la consulta. Probá de nuevo o escribime por WhatsApp o mail; tu texto sigue acá.',retry:'Volver a enviar'},
 en:{reelPause:'Pause',reelResume:'Play',reelSound:'Sound on',reelMute:'Mute',reelPauseLabel:'Pause reel',reelResumeLabel:'Play reel',menu:'Menu +',close:'Close −',of:'of',video:'Project video',images:'images',projects:'projects',all:'Full selection',resume:'Resume slideshow',pause:'Pause slideshow',sending:'Sending…',sent:'Your enquiry has been received. Thanks for getting in touch. I’ll reply by email.',received:'Enquiry received ✓',error:'Your enquiry could not be sent. Please try again or contact me via WhatsApp or email. Your message is still here.',retry:'Try again'}
};
window.LC_I18N=messages[lang];
const preferenceKey='lc-language';
function saved(){try{return localStorage.getItem(preferenceKey)}catch{return null}}
function remember(value){try{localStorage.setItem(preferenceKey,value)}catch{}}
function preferred(languages){const match=languages.map(x=>String(x).toLowerCase().split('-')[0]).find(x=>x==='es'||x==='en');return match||'en'}
document.addEventListener('click',event=>{const link=event.target.closest?.('a[data-language]');if(link)remember(link.dataset.language)},true);
const url=new URL(location.href),forced=url.searchParams.get('lang');
if(forced==='es'||forced==='en'){
 remember(forced);url.searchParams.delete('lang');history.replaceState(null,'',url.pathname+url.search+url.hash);
 if(forced==='en'&&url.pathname==='/')location.replace('/en/'+url.search+url.hash);
}else if(url.pathname==='/'){
 // Detect only the initial entry. Direct links keep their language, and both
 // complete editions remain linked and available without JavaScript.
 let internal=false;try{internal=Boolean(document.referrer)&&new URL(document.referrer).origin===location.origin}catch{}
 const chosen=saved();
 if(!internal&&chosen==='en')location.replace('/en/'+url.search+url.hash);
 else if(!internal&&!chosen&&preferred(navigator.languages?.length?navigator.languages:[navigator.language||'en'])==='en'){
  document.documentElement.dataset.suggestEnglish='true';
 }
}
document.addEventListener('DOMContentLoaded',()=>{
 const dismiss=document.querySelector('[data-dismiss-language]');
 dismiss?.addEventListener('click',()=>{remember('es');delete document.documentElement.dataset.suggestEnglish});
});
})();
