const env=require('./test-env.js')(['data.js','data_wb.js','engine.js','engine_lo.js','career.js','career_wb.js']);
const {Career:C}=env; const g=env.g;
g("globalThis.__S=[]; const __lf=loFinish; loFinish=function(m,w,t){ if(m.innings[0]&&!m.reduced) __S.push({comp:m.comp, i1:m.innings[0].runs, w1:m.innings[0].wkts, b1:m.innings[0].legal, i2:m.innings[1]?m.innings[1].runs:0, b2:m.innings[1]?m.innings[1].legal:0, chase: !!m.innings[1] && w===m.innings[1].bat}); return __lf(m,w,t); }");
if(process.argv[3]) g(process.argv[3]);
for(let R=0;R<2;R++){ const c=C.newCareer(); const NW=+process.argv[2]||4; for(let k=0;k<NW;k++){ const w=C.curWindow(c); C.fixturesOf(w).forEach(f=>f.status='done'); C.advanceWindow(c);} }
const S=globalThis.__S; const by={}; S.forEach(x=>{(by[x.comp]=by[x.comp]||[]).push(x)});
Object.entries(by).forEach(([k,a])=>{const av=f=>(a.reduce((s,x)=>s+f(x),0)/a.length); console.log(k.padEnd(5),'n',a.length,'1st',av(x=>x.i1).toFixed(0),'w1',av(x=>x.w1).toFixed(1),'rpo1',(av(x=>x.i1)/av(x=>x.b1)*6).toFixed(2),'rpo2',(av(x=>x.i2)/av(x=>x.b2)*6).toFixed(2),'chase win%',(av(x=>x.chase?1:0)*100).toFixed(0));});
