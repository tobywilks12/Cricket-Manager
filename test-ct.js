const env=require('./test-env.js')(['data.js','data_wb.js','engine.js','engine_lo.js','career.js','career_wb.js']);
const {Engine:E,Career:C,TEAMS,VENUES}=env; const g=env.g;
let t0=Date.now(); const c=C.newCareer(); console.log('newCareer ms',Date.now()-t0);
const NW=+process.argv[2]||12;
for(let k=0;k<NW;k++){
  const w=C.curWindow(c); let f;
  while((f=C.activeFixture(w))){
    const fmt=C.fmtOf(f);
    f.squad = fmt==='test'? C.autoSquad(c.players.AUS,15).map(p=>p.name) : C.autoSquadLO(c.players.AUS,fmt,15).map(p=>p.name);
    if(f.status==='planned'){ f.status='active'; f.exp = fmt==='test'? C.expectationFor(c,f) : C.expectationWB(c,f); }
    while(f.testIdx<f.tests && f.status!=='done'){
      const i=f.testIdx, opp=C.oppOf(f,i), vk=f.venues[i], V=VENUES[vk];
      const h=f.home||(f.wc&&V.home==='AUS')?'AUS':opp, a=h==='AUS'?opp:'AUS';
      const sqA=f.squad.map(n=>C.P_(c,n)).filter(Boolean);
      let m;
      if(fmt==='test'){ const sq=code=>code==='AUS'?sqA:C.autoSquad(c.players[code],15);
        m=E.createMatch({home:h,away:a,venue:V,xi:{[h]:C.autoXI(sq(h),V).map(n=>C.P_(c,n)),[a]:C.autoXI(sq(a),V).map(n=>C.P_(c,n))},userTeam:'none',TEAMS,quiet:true,neutral:!!f.neutral});
        E.simQuick(m); C.recordMatch(c,m,'test',{awayTeam:1,final:f.final}); }
      else { const sq=code=>code==='AUS'?sqA:C.autoSquadLO(c.players[code],fmt,15);
        m=E.createMatchLO({fmt,home:h,away:a,venue:V,venueKey:vk,xi:{[h]:C.autoXILO(sq(h),fmt,V).map(n=>C.P_(c,n)),[a]:C.autoXILO(sq(a),fmt,V).map(n=>C.P_(c,n))},userTeam:'none',TEAMS,quiet:true,neutral:h!=='AUS'&&a!=='AUS'||!!f.neutral&&V.home!=='AUS',superOver:fmt==='t20'||!!f.wc, knockout: f.wc && f.matches[i].stage!=='Group', captains:{AUS:c.captains[fmt]}});
        E.simQuick(m); C.recordMatch(c,m,C.FMT_COMP[fmt],{awayTeam:h==='AUS'?1:0,wc:!!f.wc}); }
      f.results.push({winner:m.result.winner===-1?null:m.teams[m.result.winner].code,text:m.result.text});
      f.testIdx++;
      if(f.wc) C.wcAfterMatch(c,f,m);
      if(f.testIdx>=f.tests && f.status!=='done') f.status='done';
    }
    if(fmt==='test') C.seriesFinished(c,f); else C.seriesFinishedWB(c,f);
    console.log(`${w.key}: ${fmt} ${f.title||f.opp} -> ${f.results.map(r=>r.winner||'-').join(' ')}${f.wc?' champ '+f.t.champ:''}`);
  }
  C.advanceWindow(c);
}
console.log('ms', Date.now()-t0);
console.log('ODI ranks', Object.entries(c.trankWB.odi).sort((a,b)=>b[1]-a[1]).map(([t,r])=>`${t} ${r}`).join(' | '));
console.log('T20 ranks', Object.entries(c.trankWB.t20).sort((a,b)=>b[1]-a[1]).map(([t,r])=>`${t} ${r}`).join(' | '));
console.log('ODC hist', JSON.stringify(c.odcHistory), 'BBL hist', JSON.stringify(c.bblHistory), 'WC', JSON.stringify(c.wcHistory));
for (const f of ['odi','t20']) { const pr=Object.entries(c.prankWB[f]).filter(([n,r])=>c.ptr-r.last<=6).sort((a,b)=>b[1].bat-a[1].bat).slice(0,8); console.log(f,'bat', pr.map(([n,r])=>`${n} ${r.bat}`).join(', '));
 const pb=Object.entries(c.prankWB[f]).filter(([n,r])=>c.ptr-r.last<=6).sort((a,b)=>b[1].bowl-a[1].bowl).slice(0,8); console.log(f,'bowl', pb.map(([n,r])=>`${n} ${r.bowl}`).join(', ')); }
const st=(n,k)=>{const s=(c.stats[n]||{})[k]; return s? `${s.m}m ${s.runs}r @${(s.runs/Math.max(1,s.inn-s.no)).toFixed(1)} SR ${(s.runs/Math.max(1,s.balls)*100).toFixed(0)} ${s.wk}w econ ${(s.bRuns/Math.max(1,s.bBalls)*6).toFixed(2)}`:'-';};
['Travis Head','Mitchell Marsh','Tim David','Adam Zampa','Nathan Ellis','Glenn Maxwell','Abhishek Sharma','Jasprit Bumrah'].forEach(n=>console.log(n.padEnd(18),'ODI',st(n,'odi'),'| T20I',st(n,'t20i'),'| BBL',st(n,'bbl'),'| ODC',st(n,'odc')));
console.log('board', c.board.conf, c.board.log.slice(0,6).map(l=>l.why+' '+l.v.toFixed(1)).join(' || '));
console.log('save KB', JSON.stringify(c).length/1024|0);
c.news.slice(0,25).forEach(n=>console.log('NEWS',n.when,'|',n.text));
const agg={}; Object.values(c.stats).forEach(o=>Object.entries(o).forEach(([k,s])=>{const a=agg[k]||(agg[k]={r:0,b:0,o:0,inn:0,m:0,w:0,bb:0,br:0}); a.r+=s.runs;a.b+=s.balls;a.o+=s.inn-s.no;a.inn+=s.inn;a.m+=s.m;a.w+=s.wk;a.bb+=s.bBalls;a.br+=s.bRuns;}));
Object.entries(agg).forEach(([k,a])=>console.log('AGG',k.padEnd(7),'bat SR',(a.r/a.b*100).toFixed(1),'avg',(a.r/a.o).toFixed(1),'| team inns approx',(a.br/(a.m/11)/2).toFixed(0),'rpo(bowl)',(a.br/a.bb*6).toFixed(2), 'wk/team-inns',(a.w/(a.m/11)).toFixed(1)));
