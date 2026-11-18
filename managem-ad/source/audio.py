import numpy as np, wave
SR=44100; D=43.0; N=int(SR*D); t=np.arange(N)/SR
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def add(sig,at,pan=0.0,g=1.0):
    i=int(at*SR); n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*g*(1-max(0,pan)); R[i:i+n]+=sig[:n]*g*(1+min(0,pan))
def hz(m): return 440*2**((m-69)/12)
def env(n,a,r):
    e=np.ones(n); A=int(a*SR); Rl=int(r*SR)
    if A: e[:A]=np.linspace(0,1,A)**2
    if Rl: e[-Rl:]*=np.linspace(1,0,Rl)**2
    return e
def lp(x,k):
    return np.convolve(x,np.ones(k)/k,mode='same')
beat=0.6; bar=2.4
chords=[[53,60,64,69,72],[55,62,67,71,74],[57,60,64,67,72],[48,55,64,67,72]]  # F, G, Am, C
roots=[41,43,45,36]
nb=int(D/bar)+1
for b in range(nb):
    c=chords[b%4]; at=b*bar; n=int((bar+0.5)*SR); tt=np.arange(n)/SR
    sig=np.zeros(n)
    for m in c:
        f=hz(m)
        for det in (-0.004,0,0.004):
            sig+=np.sin(2*np.pi*f*(1+det)*tt)+0.25*np.sin(2*np.pi*2*f*(1+det)*tt)
    sig*=env(n,0.5,0.6)*(0.85+0.15*np.sin(2*np.pi*0.8*tt))
    g=0.034 if at<8 else 0.017
    add(sig,at,0,g)
    # arp from 3.3s
    for k in range(8):
        ta=at+k*beat/2
        if ta<3.3 or ta>41: continue
        m=c[[1,2,3,4,3,2,3,4][k]]+12; n2=int(0.45*SR); t2=np.arange(n2)/SR
        p=(np.sin(2*np.pi*hz(m)*t2)+0.3*np.sin(2*np.pi*2*hz(m)*t2))*np.exp(-t2*9)
        add(p,ta,0.5 if k%2 else -0.5,0.07 if ta>8 else 0.11)
        add(p,ta+0.225,-0.5 if k%2 else 0.5,0.02)
    # bass + drums
    for k in range(4):
        tb=at+k*beat
        if 8.0<=tb<41.5:
            n3=int(0.5*SR); t3=np.arange(n3)/SR; f=hz(roots[b%4])
            bs=(np.sin(2*np.pi*f*t3)+0.4*np.sin(2*np.pi*2*f*t3))*np.exp(-t3*5)*env(n3,0.005,0.05)
            add(bs,tb,0,0.22)
        if 11.1<=tb<37.0:
            n4=int(0.3*SR); t4=np.arange(n4)/SR
            ph=2*np.pi*(45*t4+(110-45)*(1-np.exp(-t4*28))/28)
            add(np.sin(ph)*np.exp(-t4*13),tb,0,0.55)
            hh=rng.standard_normal(int(0.06*SR)); hh=np.diff(hh,prepend=0)*np.exp(-np.arange(len(hh))/SR*70)
            add(hh,tb+beat/2,0.2,0.05)
            if k in (1,3):
                cl=rng.standard_normal(int(0.14*SR)); cl=(cl-lp(cl,30))*np.exp(-np.arange(len(cl))/SR*30)
                add(cl,tb,-0.1,0.09)
def whoosh(at,dur=0.7,g=0.16):
    n=int(dur*SR); x=rng.standard_normal(n); x=lp(x,24)-lp(x,400)
    e=np.sin(np.linspace(0,np.pi,n))**3
    add(x*e,at-dur*0.6,-0.3,g*3); add(np.roll(x,300)*e,at-dur*0.6,0.3,g*3)
for s in [3.3,8.0,11.1,14.2,16.8,21.8,24.3,26.8,29.1,33.2,37.1]: whoosh(s)
def hit(at,g=0.5):
    n=int(1.6*SR); tt=np.arange(n)/SR
    boom=np.sin(2*np.pi*(38*tt+30*(1-np.exp(-tt*10))/10))*np.exp(-tt*3.5)
    sh=rng.standard_normal(n); sh=(sh-lp(sh,12))*np.exp(-tt*4)*0.12
    add(boom+sh,at,0,g)
hit(8.0,0.6); hit(37.1,0.5)
for s in [33.35,34.5,35.7]: hit(s,0.3)
def click(at):
    n=int(0.05*SR); tt=np.arange(n)/SR
    add(np.sin(2*np.pi*1900*tt)*np.exp(-tt*120),at,0,0.25); add(np.sin(2*np.pi*1300*tt)*np.exp(-tt*120),at+0.07,0,0.18)
click(23.55); click(40.35)
# sparkle chimes
for at,m in [(0.4,84),(11.9,88),(17.3,86),(38.1,91)]:
    n=int(1.2*SR); tt=np.arange(n)/SR
    add((np.sin(2*np.pi*hz(m)*tt)+0.5*np.sin(2*np.pi*hz(m+7)*tt))*np.exp(-tt*4),at,0.3,0.05)
fade=np.ones(N); fi=int(0.4*SR); fo=int(2.2*SR); fade[:fi]=np.linspace(0,1,fi); fade[-fo:]=np.linspace(1,0,fo)**1.5
st=np.stack([L,R],1)*fade[:,None]
st=np.tanh(st*1.6); st=st/np.abs(st).max()*0.85
w=wave.open('music.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
print('ok',np.abs(st).mean())
