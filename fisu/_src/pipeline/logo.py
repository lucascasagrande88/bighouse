from PIL import Image
import numpy as np
S=1672/900
files=[l.split(' ',1)[1].strip() for l in open('map.txt')]
im=Image.open('presentacion/'+files[4]).convert('RGB')
c=np.asarray(im.crop((int(80*S),int(90*S),int(520*S),int(372*S)))).astype(float)
m=c.min(axis=2)
a=np.clip((250-m)/215,0,1)
a[a<0.04]=0
rgb=np.where(a[...,None]>0,(c-(1-a[...,None])*255)/np.maximum(a[...,None],1e-3),0)
rgb=np.clip(rgb,0,255)
out=np.dstack([rgb,a*255]).astype(np.uint8)
o=Image.fromarray(out,'RGBA'); o=o.crop(o.getchannel('A').getbbox()); o.save('logo-color.png'); print(o.size)
w=np.asarray(o).copy(); w[...,:3]=255; Image.fromarray(w,'RGBA').save('logo-white.png')
# fisu wordmark only (pink part) by removing blue
arr=np.asarray(o).astype(int); blue=(arr[...,2]>arr[...,0]+40)
p=arr.copy(); p[blue,3]=0; po=Image.fromarray(p.astype(np.uint8),'RGBA'); print(po.getchannel('A').getbbox())
