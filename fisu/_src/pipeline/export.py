import json, os, sys
import numpy as np
from PIL import Image, ImageFilter
OUT='/home/user/bighouse/fisu/assets/img'
os.makedirs(OUT,exist_ok=True)
USE=['pote-trio','pote-trio-b','barra-crocante','barra-crocante-b','bombon-pack','torta-frutilla','torta-frutilla-b',
 'tricolor','bombon-crema','almendrado','almendrado-b','almendrado-choco','panqueque','bochas','canasta-choco',
 'pote-lila','pote-solo','almendrado-box','scoop-frutilla','crocante-duo',
 'ing-frutillas','ing-choco','ing-choco-fly','ing-almendras','icon-tienda','icon-delivery','icon-redes']
man={}
mp=f'{OUT}/manifest.json'
if os.path.exists(mp): man=json.load(open(mp))
only=sys.argv[1:]
for n in USE:
  if only and n not in only: continue
  p=f'up/{n}.png' if os.path.exists(f'up/{n}.png') else f'cut/{n}.png'
  if not os.path.exists(p): print('missing',n); continue
  im=Image.open(p).convert('RGBA')
  a=np.asarray(im).astype(np.float32)
  al=a[...,3:4]/255.
  rgb=a[...,:3]
  # defringe: des-mezclar el blanco del fondo original en bordes semitransparentes
  edge=(al>0.04)&(al<0.97)
  un=np.clip((rgb-(1-al)*255)/np.maximum(al,0.04),0,255)
  rgb=np.where(edge,un,rgb)
  al[al<0.03]=0
  out=Image.fromarray(np.dstack([rgb,al*255]).astype(np.uint8),'RGBA')
  bb=out.getchannel('A').point(lambda v:255 if v>10 else 0).getbbox(); out=out.crop(bb)
  # nitidez suave sobre RGB
  r,g,b,A=out.split(); sharp=Image.merge('RGB',(r,g,b)).filter(ImageFilter.UnsharpMask(radius=1.2,percent=30,threshold=2))
  out=Image.merge('RGBA',(*sharp.split(),A))
  W,H=out.size
  if n=='bombon-pack':  # quitar el borde del podio rosa que quedó debajo
    out=out.crop((0,0,W,int(H*0.955))); W,H=out.size
  if W>1400: out=out.resize((1400,round(H*1400/W)),Image.LANCZOS); W,H=out.size
  sizes=[W] if W<400 else ([round(W/2),W] if W<900 else [round(W/3),round(W*2/3),W])
  for w in sizes:
    o=out if w==W else out.resize((w,round(H*w/W)),Image.LANCZOS)
    o.save(f'{OUT}/{n}-{w}.webp',quality=86,alpha_quality=92,method=6)
    o.save(f'{OUT}/{n}-{w}.avif',quality=62)
  man[n]={'w':W,'h':H,'sizes':sizes}
  print(n,W,H,sizes)
json.dump(man,open(mp,'w'),indent=1)
