import numpy as np, wave
from scipy.signal import butter, sosfilt
sr=44100; DUR=45.0; N=int(sr*DUR); rng=np.random.default_rng(7)
L=np.zeros(N); R=np.zeros(N)
def add(sig,t,amp=1.0,pan=0.0):
    i=int(t*sr); n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*amp*np.sqrt((1-pan)/2); R[i:i+n]+=sig[:n]*amp*np.sqrt((1+pan)/2)
def filt(x,lo=None,hi=None,order=2):
    if lo and hi: sos=butter(order,[lo,hi],'bandpass',fs=sr,output='sos')
    elif hi: sos=butter(order,hi,'lowpass',fs=sr,output='sos')
    else: sos=butter(order,lo,'highpass',fs=sr,output='sos')
    return sosfilt(sos,x)
def env(n,a=0.005,r=0.1):
    e=np.ones(n); na=int(a*sr); nr=int(r*sr); e[:na]=np.linspace(0,1,na); e[-nr:]=np.linspace(1,0,nr); return e
def reverb(x,decay=0.35,taps=(0.031,0.047,0.071,0.097,0.131)):
    y=np.concatenate([x,np.zeros(int(sr*0.6))]); out=y.copy()
    for k,d in enumerate(taps):
        n=int(d*sr); out[n:]+=y[:-n]*decay*(0.8**k)
        n2=int(d*2.3*sr); out[n2:]+=y[:-n2]*decay*0.4*(0.8**k)
    return out
def drip(f0=900,dur=0.11,rise=1.9):
    t=np.arange(int(dur*sr))/sr
    f=f0*(1+rise*(t/dur)**1.5); ph=2*np.pi*np.cumsum(f)/sr
    s=np.sin(ph)*np.exp(-t*38)*np.minimum(1,t/0.002)
    click=filt(rng.standard_normal(int(0.004*sr)),2000,7000)*0.5
    s[:len(click)]+=click*np.linspace(1,0,len(click))
    return reverb(s,0.3)
def knock():
    t=np.arange(int(0.16*sr))/sr
    s=np.sin(2*np.pi*150*t*(1-0.3*t/0.16))*np.exp(-t*45)+0.5*np.sin(2*np.pi*410*t)*np.exp(-t*70)
    nz=filt(rng.standard_normal(len(t)),900,3500)*np.exp(-t*120)*0.6
    return reverb(s+nz,0.22)
def marimba(f,dur=0.5,bright=0.35):
    t=np.arange(int(dur*sr))/sr
    s=np.sin(2*np.pi*f*t)*np.exp(-t*7)+bright*np.sin(2*np.pi*4*f*t)*np.exp(-t*22)+0.12*np.sin(2*np.pi*10*f*t)*np.exp(-t*45)
    return s*np.minimum(1,t/0.003)
def hz(m): return 440*2**((m-69)/12)
# ---------- ACT 1: roof ambience 0-9
n=int(9.2*sr); t=np.arange(n)/sr
wind=filt(rng.standard_normal(n),150,900)*(0.5+0.5*np.sin(2*np.pi*0.13*t)+0.25*np.sin(2*np.pi*0.31*t+1))
wind2=filt(rng.standard_normal(n),None,220,order=3)*1.6     # distant traffic rumble
e=env(n,0.8,2.2)
add(wind*e,0,0.05,-0.2); add(wind2*e,0,0.09,0.2)
# roller swish (shot 1)
for ts in (0.5,1.9,3.1):
    m=int(0.9*sr); tt=np.arange(m)/sr; sw=filt(rng.standard_normal(m),1200,5000)*np.sin(np.pi*tt/0.9)**2
    add(sw,ts,0.035,0.1)
# taps shot 2
for ts in (5.95,6.27): add(knock(),ts,0.75,0.0)
# bakkie engine 7-9.2
m=int(2.4*sr); tt=np.arange(m)/sr
eng=np.sign(np.sin(2*np.pi*(70-12*tt)*tt))*0.5+filt(rng.standard_normal(m),None,300)*2
eng=filt(eng,None,420,order=3)*(1+0.3*np.sin(2*np.pi*23*tt))*np.exp(-tt*1.3)*np.minimum(1,tt/0.2)
add(eng,7.0,0.16,0.0)
# ---------- ACT 2: the leak 9-27.3
room=filt(rng.standard_normal(int(18.3*sr)),None,140,order=3)*env(int(18.3*sr),1.0,0.02)
add(room,9.0,0.10)                       # low room tone
add(drip(820,0.13,2.1),10.6,1.15,0.0)     # THE first drip
add(drip(700,0.14,2.3),12.55,0.95,-0.1)   # lands on invoice
streams=[(15.0,0.60,880,-0.6),(15.4,0.90,1120,0.5),(16.1,0.45,660,0.0),(17.0,0.75,1320,-0.3)]
for t0,per,f,pan in streams:
    tt=t0
    while tt<19.0: add(drip(f*rng.uniform(.97,1.03)),tt,0.5,pan); tt+=per
streams=[(19.0,0.30,880,-0.6),(19.1,0.45,1120,0.5),(19.05,0.225,660,0.0),(19.2,0.375,1320,-0.3),(20.5,0.15,990,0.3)]
for t0,per,f,pan in streams:
    tt=t0
    while tt<27.25:
        per2=per*(1-0.35*min(1,(tt-19)/8))
        add(drip(f*rng.uniform(.96,1.04)),tt,0.42+0.2*min(1,(tt-19)/8),pan); tt+=per2
# water slosh 22-27.3
m=int(5.3*sr); tt=np.arange(m)/sr
sl=filt(rng.standard_normal(m),300,2200)*(0.5+0.5*np.sin(2*np.pi*0.7*tt))*np.minimum(1,tt/1.5)
add(sl,22.0,0.06)
# cello drone 15 -> 27.3 (hard cut)
m=int(12.3*sr); tt=np.arange(m)/sr
def saw(f,vib=0.004):
    ph=2*np.pi*f*(tt+vib*np.sin(2*np.pi*5.2*tt)/(2*np.pi*5.2)*8); return 2*((ph/(2*np.pi))%1)-1
cel=saw(hz(36))+0.7*saw(hz(43))+0.45*saw(hz(48))*(tt>5)+0.4*saw(hz(51))*(tt>8.5)
cel=filt(cel,None,700,order=2)*(tt/12.3)**1.6*(1+0.08*np.sin(2*np.pi*4.8*tt))
cel[-int(0.012*sr):]*=np.linspace(1,0,int(0.012*sr))
add(cel,15.0,0.34)
# ---------- silence 27.3 - 28.8 ----------
# gem chime 28.8
for k,mn in enumerate((72,76,79,84)): add(reverb(marimba(hz(mn),0.9,0.5),0.4),28.8+k*0.09,0.22,(-0.4+0.25*k))
# ---------- ACT 3: groove 30-45
beat=0.3
melody=[60,64,67,69,67,64,62,64, 60,64,67,72,69,67,64,62, 57,60,64,67,64,60,59,60, 55,59,62,67,65,62,59,62]
bass=[36,36,33,31]
tt=30.0; i=0
while tt<43.2:
    warm=min(1,max(0,(tt-30)/7)); mn=melody[i%len(melody)]
    acc=1.0 if i%4==0 else (0.75 if i%2==0 else 0.55)
    add(reverb(marimba(hz(mn+12),0.55),0.25),tt,0.17*acc,0.35*np.sin(i*1.3))
    if i%8==0: add(marimba(hz(bass[(i//8)%4]),1.6,0.1),tt,0.34,0)
    if i%8==4: add(marimba(hz(bass[(i//8)%4]+12),0.8,0.1),tt,0.2,0)
    if tt>=33.5 and i%2==1:
        sh=filt(rng.standard_normal(int(0.07*sr)),5000,None)*np.exp(-np.arange(int(0.07*sr))/sr*60); add(sh,tt,0.05+0.03*warm,0.4)
    if tt>=37 and i%8==0:   # warm pad chord
        m=int(2.5*sr); t2=np.arange(m)/sr; root=bass[(i//8)%4]+24
        pad=sum(np.sin(2*np.pi*hz(root+k)*t2) for k in (0,4 if root%12 in(0,7,5) else 3,7,12))*np.sin(np.pi*t2/2.5)**1.2
        add(pad,tt,0.035,0)
    tt+=beat; i+=1
# UI click hits
for ts in (30.95,32.0,33.65,35.85):
    m=int(0.2*sr); t2=np.arange(m)/sr
    k=np.sin(2*np.pi*(90+120*np.exp(-t2*40))*t2)*np.exp(-t2*26); c=filt(rng.standard_normal(m),2500,6000)*np.exp(-t2*180)*0.4
    add(k+c,ts,0.5,0)
# shot 12 double tap
for ts in (41.12,41.42): add(knock(),ts,0.7,0.0)
# final musical drip + resolve
add(drip(1046,0.12,1.0),44.35,0.8,0); 
for mn,a in ((48,0.3),(60,0.22),(64,0.16),(67,0.16),(72,0.2)): add(reverb(marimba(hz(mn),1.6,0.25),0.4),44.38,a,0)
# ---------- VO
w=wave.open('vo.wav'); vo=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float64)/32768
segs=[(0.00,2.38,0.60),(2.72,4.08,4.30),(4.66,5.80,7.15),(6.38,8.70,12.30),(9.18,11.45,19.30),(11.75,13.97,22.60),
      (14.48,16.66,30.20),(16.96,18.98,32.60),(19.26,20.98,34.80),(21.17,24.20,37.25),(24.49,27.42,41.65)]
music=np.stack([L,R],1); voL=np.zeros(N); duck=np.ones(N)
for a,b,t0 in segs:
    s=vo[int(a*sr):int(b*sr)].copy(); f=int(0.03*sr); s[:f]*=np.linspace(0,1,f); s[-f:]*=np.linspace(1,0,f)
    i=int(t0*sr); voL[i:i+len(s)]+=s
    j0=max(0,i-int(.15*sr)); j1=min(N,i+len(s)+int(.2*sr)); duck[j0:j1]=0.62
k=int(0.12*sr); duck=np.convolve(duck,np.ones(k)/k,'same')
voL=voL/np.max(np.abs(voL))*0.93
mix=music*duck[:,None]+voL[:,None]*0.9
# master: silence gate + fades + soft limit
s0,s1=int(27.3*sr),int(28.78*sr); mix[s0:s1]=0
mix[-int(0.35*sr):]*=np.linspace(1,0,int(0.35*sr))[:,None]
mix=np.tanh(mix*1.25)/np.tanh(1.25)*0.97
out=(np.clip(mix,-1,1)*32767).astype(np.int16)
ww=wave.open('audio.wav','wb'); ww.setnchannels(2); ww.setsampwidth(2); ww.setframerate(sr); ww.writeframes(out.tobytes()); ww.close()
print('peak',np.abs(mix).max(),'rms',np.sqrt((mix**2).mean()))
