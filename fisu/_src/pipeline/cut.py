import sys, os
from PIL import Image
from rembg import remove, new_session
S=1672/900
files=[l.split(' ',1)[1].strip() for l in open('map.txt')]
crops={
 # name: (slide, x1,y1,x2,y2) in preview coords
 'pote-trio':(10,445,25,860,295),
 'pote-trio-b':(16,395,185,725,445),
 'barra-crocante':(14,445,20,665,225),
 'barra-crocante-b':(19,600,85,855,292),
 'bombon-pack':(1,370,110,565,305),
 'torta-frutilla':(14,85,250,345,395),
 'torta-frutilla-b':(20,598,325,845,445),
 'torta-cuna':(3,372,340,528,465),
 'tricolor':(19,325,92,640,255),
 'tricolor-b':(20,30,180,335,312),
 'bombon-crema':(20,350,138,585,310),
 'bombon-crema-b':(19,250,245,480,450),
 'almendrado':(20,588,160,878,308),
 'almendrado-b':(1,585,340,800,450),
 'almendrado-choco':(19,500,288,848,445),
 'panqueque':(20,65,320,345,465),
 'bochas':(20,340,310,590,462),
 'canasta-choco':(14,555,255,795,455),
 'pote-lila':(14,598,130,800,285),
 'pote-solo':(15,262,262,430,440),
 'almendrado-box':(1,728,160,895,285),
 'scoop-frutilla':(14,240,125,372,248),
 'crocante-duo':(15,455,285,655,450),
 'bombon-bar':(3,225,325,370,455),
 'ing-frutillas':(14,215,330,305,452),
 'ing-choco':(10,750,140,858,268),
 'ing-choco-fly':(14,588,55,668,120),
 'ing-almendras':(1,812,248,898,294),
 'icon-tienda':(18,548,348,668,438),
 'icon-delivery':(18,540,212,672,302),
 'icon-redes':(18,690,348,812,438),
 'icon-pack':(18,405,348,525,438),
 'icon-frio':(18,690,212,812,302),
}
sess=new_session(sys.argv[1] if len(sys.argv)>1 else 'birefnet-general')
os.makedirs('cut',exist_ok=True)
only=sys.argv[2:] 
for n,(s,x1,y1,x2,y2) in crops.items():
  if only and n not in only: continue
  im=Image.open('presentacion/'+files[s-1]).convert('RGB')
  c=im.crop((int(x1*S),int(y1*S),int(x2*S),int(y2*S)))
  os.makedirs('raw',exist_ok=True); c.save(f'raw/{n}.png')
  mk=remove(c,session=sess,only_mask=True,post_process_mask=False); mk.save(f'raw/{n}-mask.png')
  o=c.copy(); o.putalpha(mk)
  bb=o.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
  o=o.crop(bb); o.save(f'cut/{n}.png'); print(n,o.size,flush=True)
