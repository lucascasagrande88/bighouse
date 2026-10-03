from PIL import Image
import numpy as np, subprocess, re
o=Image.open('logo-color.png'); W,H=o.size
big=o.resize((W*4,H*4),Image.LANCZOS)
a=np.asarray(big).astype(int)
alpha=a[...,3]; blue=(a[...,2]>a[...,0])
def mk(mask,name):
  m=np.where(mask,0,255).astype(np.uint8)
  Image.fromarray(m).save(name+'.pbm')
  subprocess.run(['potrace',name+'.pbm','-s','-o',name+'.svg','--turdsize','40','--alphamax','1.0','--opttolerance','0.4'],check=True)
  s=open(name+'.svg').read()
  g=re.search(r'(<g transform.*?</g>)',s,re.S).group(1)
  return g
gp=mk((alpha>128)&~blue,'pink'); gb=mk((alpha>128)&blue,'blue')
gp=re.sub(r'fill="#000000"','fill="#F81F86"',gp); gb=re.sub(r'fill="#000000"','fill="#1147F5"',gb)
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W*4} {H*4}" role="img" aria-label="FISÚ helados"><title>FISÚ helados</title>{gp}{gb}</svg>'
open('logo.svg','w').write(svg)
print(len(svg))
