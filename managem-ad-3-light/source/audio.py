import numpy as np, wave, sys, json
SR=44100; D=float(sys.argv[1]); cuts=json.loads(sys.argv[2]) if len(sys.argv)>2 else []
N=int(SR*D); L=np.zeros(N); R=np.zeros(N); rng=np.random.default_rng(3)
def add(sig,at,pan=0.0,g=1.0):
    i=int(at*SR)
    if i<0: sig=sig[-i:]; i=0
    n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*g*(1-max(0,pan)); R[i:i+n]+=sig[:n]*g*(1+min(0,pan))
hz=lambda m:440*2**((m-69)/12)
def lp(x,k): return np.convolve(x,np.ones(k)/k,mode='same')
bar=3.2
chords=[[50,57,62,66,69],[47,54,59,62,66],[43,50,55,59,62],[45,52,57,61,64]]  # D, Bm, G, A (warm, hopeful)
for b in range(int(D/bar)+2):
    c=chords[b%4]; at=b*bar-0.3; n=int((bar+1.2)*SR); tt=np.arange(n)/SR; sig=np.zeros(n)
    for m in c:
        for det in (-0.003,0.003):
            sig+=np.sin(2*np.pi*hz(m)*(1+det)*tt)+0.18*np.sin(2*np.pi*2*hz(m)*(1+det)*tt)
    e=np.ones(n); A=int(1.0*SR); Rl=int(1.2*SR); e[:A]=np.linspace(0,1,A)**1.5; e[-Rl:]=np.linspace(1,0,Rl)**1.5
    add(sig*e,at,0,0.02)
    sub=np.sin(2*np.pi*hz(c[0]-12)*tt)*e; add(sub,at,0,0.07)
    # soft felt-piano notes
    pat=[(0,4,0.9),(0.8,2,0.6),(1.6,3,0.7),(2.4,4,0.55),(2.8,2,0.4)]
    for off,idx,v in pat:
        m=c[idx]+12; n2=int(2.2*SR); t2=np.arange(n2)/SR
        note=(np.sin(2*np.pi*hz(m)*t2)+0.35*np.sin(2*np.pi*2*hz(m)*t2)*np.exp(-t2*3)+0.12*np.sin(2*np.pi*3*hz(m)*t2)*np.exp(-t2*6))*np.exp(-t2*2.2)
        a=int(0.012*SR); note[:a]*=np.linspace(0,1,a)
        add(note,at+0.3+off,0.35 if idx%2 else -0.35,0.09*v); add(note,at+0.3+off+0.33,-0.35 if idx%2 else 0.35,0.025*v)
for cpt in cuts:
    n=int(0.9*SR); x=rng.standard_normal(n); x=lp(x,40)-lp(x,500); e=np.sin(np.linspace(0,np.pi,n))**3
    add(x*e,cpt-0.55,-0.3,0.22); add(np.roll(x,400)*e,cpt-0.55,0.3,0.22)
fade=np.ones(N); fi=int(0.8*SR); fo=int(2.5*SR); fade[:fi]=np.linspace(0,1,fi); fade[-fo:]=np.linspace(1,0,fo)**1.5
st=np.stack([L,R],1)*fade[:,None]; st=np.tanh(st*1.3); st=st/np.abs(st).max()*0.7
w=wave.open(sys.argv[3] if len(sys.argv)>3 else 'music2.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes()); w.close(); print('ok')
