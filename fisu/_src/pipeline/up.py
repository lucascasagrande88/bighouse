import sys, os, time, torch, numpy as np
from PIL import Image
from spandrel import ModelLoader
torch.set_num_threads(4)
m=ModelLoader().load_from_file('/tmp/claude-0/RealESRGAN_x4plus.pth').model.eval()
os.makedirs('up',exist_ok=True)
def run(rgb):
  x=torch.from_numpy(rgb).permute(2,0,1)[None].float()/255
  T=192; P=16; _,_,H,W=x.shape; out=torch.zeros(1,3,H*4,W*4)
  with torch.no_grad():
    for y0 in range(0,H,T):
      for x0 in range(0,W,T):
        ya,xa=max(0,y0-P),max(0,x0-P); yb,xb=min(H,y0+T+P),min(W,x0+T+P)
        o=m(x[:,:,ya:yb,xa:xb])
        out[:,:,y0*4:min(H,y0+T)*4,x0*4:min(W,x0+T)*4]=o[:,:,(y0-ya)*4:(y0-ya+min(T,H-y0))*4,(x0-xa)*4:(x0-xa+min(T,W-x0))*4]
  return (out[0].clamp(0,1).permute(1,2,0).numpy()*255).round().astype(np.uint8)
for n in sys.argv[1:]:
  t=time.time()
  im=Image.open(f'cut/{n}.png').convert('RGBA'); W,H=im.size
  bg=Image.new('RGBA',im.size,(255,255,255,255)); comp=Image.alpha_composite(bg,im).convert('RGB')
  big=Image.fromarray(run(np.asarray(comp)))
  A=im.getchannel('A').resize(big.size,Image.LANCZOS)
  f=2 if W*2<=1400 else 1400/W
  tw,th=round(W*f),round(H*f)
  big=big.resize((tw,th),Image.LANCZOS); A=A.resize((tw,th),Image.LANCZOS)
  big.putalpha(A); big.save(f'up/{n}.png'); print(n,big.size,round(time.time()-t,1),flush=True)
