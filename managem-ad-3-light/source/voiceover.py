import soundfile as sf, numpy as np, json
from kokoro_onnx import Kokoro
k=Kokoro('kokoro-v1.0.onnx','voices-v1.0.bin')
lines=["Your business runs on numbers. But can you actually see them?",
"Meet Mana Gem. One system, for your whole business.",
"Customers, quotes, and invoices. Projects, stock, and the factory floor. Debtors, and reports. All connected. All live.",
"Track every enquiry, every job, and every rand, from anywhere.",
"Less admin. Better decisions. More profit.",
"Mana Gem. Know what's making you money. Book your demo today."]
d=[]
for i,l in enumerate(lines):
    s,sr=k.create(l,voice='bm_george',speed=0.95,lang='en-gb')
    nz=np.where(np.abs(s)>0.01)[0]; s=s[max(0,nz[0]-int(.03*sr)):nz[-1]+int(.12*sr)]
    sf.write(f'vo{i}.wav',s,sr); d.append(round(len(s)/sr,2))
print(json.dumps(d),sr)
