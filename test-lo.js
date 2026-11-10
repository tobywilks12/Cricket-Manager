const env=require('./test-env.js')(['data.js','data_wb.js','engine.js','engine_lo.js']);
const {Engine:E,TEAMS,VENUES}=env;
const fmt=process.argv[2]||'odi', N=+process.argv[3]||300, h=process.argv[4]||'AUS', a=process.argv[5]||'ENG', v=process.argv[6]||'mcg', detail=process.argv[7];
function xi(code){ const pool=TEAMS[code].squad.filter(p=>p.intl!=='none'&&p.intl!==(fmt==='odi'?'t20':'odi'));
 const o=p=>E.wbOverall(p,fmt); const sorted=pool.slice().sort((x,y)=>o(y)-o(x));
 const out=[]; const k=sorted.find(p=>p.role==='WK'); out.push(k);
 sorted.filter(p=>p.bowl&&p.bowl.skill>=66&&p.role!=='BAT').slice(0,5).forEach(p=>{if(!out.includes(p))out.push(p)});
 sorted.forEach(p=>{if(out.length<11&&!out.includes(p)&&p.role!=='BOWL')out.push(p)});
 const bats=out.slice().sort((x,y)=>E.wbBat(y,fmt)-E.wbBat(x,fmt)); return bats; }
const X={[h]:xi(h),[a]:xi(a)};
if(detail) for(const c of [h,a]) console.log(c, X[c].map(p=>`${p.name} ${E.wbOverall(p,fmt)}`).join(', '));
let s={w0:0,w1:0,t:0,nr:0,i1:[],rr:[0,0],wk:0,bat:{},bowl:{},sixes:0,fours:0,inns:0, so:0},t0=Date.now();
for(let i=0;i<N;i++){const m=E.createMatchLO({fmt,home:h,away:a,venue:VENUES[v],xi:X,userTeam:'none',TEAMS,quiet:true});E.simQuick(m);
 const r=m.result; if(r.nr)s.nr++; else if(r.winner===0)s.w0++; else if(r.winner===1)s.w1++; else s.t++; if(/Super/.test(r.text))s.so++;
 m.innings.forEach((inn,k)=>{ if(inn.so)return; if(k===0&&!m.reduced)s.i1.push(inn.runs); s.rr[0]+=inn.runs;s.rr[1]+=inn.legal;s.wk+=inn.wkts;s.inns++;
  const t=m.teams[inn.bat]; inn.cards.forEach((c,j)=>{s.sixes+=c.sixes;s.fours+=c.fours; if(c.status==='dnb')return; const n=t.players[j].name; const q=s.bat[n]||(s.bat[n]={r:0,o:0,b:0}); q.r+=c.runs;q.b+=c.balls;if(c.status==='out')q.o++;});
  const bt=m.teams[inn.bowl]; for(const j in inn.bowling){const f=inn.bowling[j];const n=bt.players[j].name;const q=s.bowl[n]||(s.bowl[n]={r:0,w:0,b:0});q.r+=f.runs;q.w+=f.wkts;q.b+=f.legal;}});}
const av=a=>(a.reduce((x,y)=>x+y,0)/a.length).toFixed(0);
console.log(`${fmt} ${h} ${s.w0} ${a} ${s.w1} tie ${s.t} (SO ${s.so}) NR ${s.nr} | 1st inns ${av(s.i1)} | RPO ${(s.rr[0]/s.rr[1]*6).toFixed(2)} | wk/inns ${(s.wk/s.inns).toFixed(1)} | 4s ${(s.fours/s.inns).toFixed(1)} 6s ${(s.sixes/s.inns).toFixed(1)} | ${((Date.now()-t0)/N).toFixed(2)}ms`);
if(detail){Object.entries(s.bat).sort((a,b)=>b[1].b-a[1].b).slice(0,16).forEach(([n,q])=>console.log(n.padEnd(22),(q.r/Math.max(1,q.o)).toFixed(1).padStart(6),(q.r/q.b*100).toFixed(0).padStart(5)));
Object.entries(s.bowl).sort((a,b)=>b[1].b-a[1].b).slice(0,12).forEach(([n,q])=>console.log(n.padEnd(22),(q.r/q.w).toFixed(1).padStart(6),'econ',(q.r/q.b*6).toFixed(2),(q.b/6/N).toFixed(1)+' ov/m'));}
