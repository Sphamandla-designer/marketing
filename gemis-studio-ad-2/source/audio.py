import numpy as np, wave
SR=44100; D=43.5; N=int(SR*D); L=np.zeros(N); R=np.zeros(N); rng=np.random.default_rng(11)
def add(sig,at,pan=0.0,g=1.0):
    i=int(at*SR)
    if i<0: sig=sig[-i:]; i=0
    n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*g*(1-max(0,pan)); R[i:i+n]+=sig[:n]*g*(1+min(0,pan))
hz=lambda m:440*2**((m-69)/12)
def lp(x,k): return np.convolve(x,np.ones(k)/k,mode='same')
beat=60/104; bar=beat*4
chords=[[57,60,64,67,72],[53,57,60,64,69],[48,55,60,64,67],[55,59,62,67,71]]  # Am7 Fmaj7 C G
roots=[45,41,36,43]
for b in range(int(D/bar)+2):
    c=chords[b%4]; at=b*bar; n=int((bar+0.8)*SR); tt=np.arange(n)/SR; sig=np.zeros(n)
    for m in c:
        for det in (-0.003,0.003): sig+=np.sin(2*np.pi*hz(m)*(1+det)*tt)+0.15*np.sin(2*np.pi*2*hz(m)*(1+det)*tt)
    e=np.ones(n); A=int(.5*SR); Rl=int(.8*SR); e[:A]=np.linspace(0,1,A)**1.5; e[-Rl:]=np.linspace(1,0,Rl)**1.5
    add(sig*e,at,0,0.016)
    # marimba-ish pattern (8ths)
    pat=[4,2,3,2,4,3,2,3]
    for k in range(8):
        ta=at+k*beat/2
        if ta<1.0 or ta>41.5: continue
        m=c[pat[k]]+12; n2=int(.6*SR); t2=np.arange(n2)/SR
        note=(np.sin(2*np.pi*hz(m)*t2)+0.5*np.sin(2*np.pi*4*hz(m)*t2)*np.exp(-t2*30))*np.exp(-t2*8)
        note[:60]*=np.linspace(0,1,60)
        v=0.10 if k%2==0 else 0.06
        add(note,ta,0.4 if k%2 else -0.4,v); add(note,ta+beat*0.75,-0.4 if k%2 else 0.4,v*0.25)
    for k in range(4):
        tb=at+k*beat
        if 2.6<=tb<42:
            n3=int(.45*SR); t3=np.arange(n3)/SR; f=hz(roots[b%4])
            add((np.sin(2*np.pi*f*t3)+0.3*np.sin(2*np.pi*2*f*t3))*np.exp(-t3*6),tb,0,0.2 if k in (0,2) else 0.1)
        if 8.3<=tb<37.4 or tb>=37.8 and tb<41.5:
            n4=int(.28*SR); t4=np.arange(n4)/SR
            add(np.sin(2*np.pi*(46*t4+(105-46)*(1-np.exp(-t4*30))/30))*np.exp(-t4*14),tb,0,0.42)
            if k in (1,3):
                clp=rng.standard_normal(int(.12*SR)); clp=(clp-lp(clp,24))*np.exp(-np.arange(len(clp))/SR*38); add(clp,tb,0.1,0.06)
            hh=rng.standard_normal(int(.04*SR)); hh=np.diff(hh,prepend=0)*np.exp(-np.arange(len(hh))/SR*90); add(hh,tb+beat/2,-0.2,0.035)
for cpt in [2.6,12.0,15.8,19.2,23.3,26.3,30.0,34.8]:
    n=int(.9*SR); x=rng.standard_normal(n); x=lp(x,40)-lp(x,500); e=np.sin(np.linspace(0,np.pi,n))**3
    add(x*e,cpt-.55,-.3,.2); add(np.roll(x,400)*e,cpt-.55,.3,.2)
n=int(1.5*SR); tt=np.arange(n)/SR; add(np.sin(2*np.pi*(40*tt+30*(1-np.exp(-tt*10))/10))*np.exp(-tt*3.5),8.3,0,0.45)
# riser + impact into CTA
n=int(1.6*SR); x=rng.standard_normal(n); x=x-lp(x,30); add(x*np.linspace(0,1,n)**3,37.7-1.6,0,0.07)
n=int(1.8*SR); tt=np.arange(n)/SR; add(np.sin(2*np.pi*(38*tt+30*(1-np.exp(-tt*10))/10))*np.exp(-tt*3),37.7,0,0.55)
for at,m in [(0.3,88),(8.3,91),(23.3,93),(37.9,93),(40.5,88)]:
    n=int(1.4*SR); tt=np.arange(n)/SR; add((np.sin(2*np.pi*hz(m)*tt)+.5*np.sin(2*np.pi*hz(m+7)*tt))*np.exp(-tt*3.5),at,.3,.045)
fade=np.ones(N); fi=int(.5*SR); fo=int(2.4*SR); fade[:fi]=np.linspace(0,1,fi); fade[-fo:]=np.linspace(1,0,fo)**1.5
st=np.stack([L,R],1)*fade[:,None]; st=np.tanh(st*1.5); st=st/np.abs(st).max()*.8
w=wave.open('music_gemis2.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes()); w.close(); print('ok')
