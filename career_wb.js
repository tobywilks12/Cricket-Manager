// ===== WHITE-BALL CAREER: selection, fixtures, One-Day Cup, BBL, rankings, World Cups =====
const WB_FMTS = ['odi', 't20'];
const FMT_NAME = { test: 'Test', odi: 'ODI', t20: 'T20I' };
const FMT_PLURAL = { test: 'Tests', odi: 'ODIs', t20: 'T20Is' };
const FMT_COMP = { odi: 'odi', t20: 't20i', test: 'test' };
const COMP_NAME = { test: 'Test', shield: 'Shield', odi: 'ODI', t20i: 'T20I', odc: 'One-Day Cup', bbl: 'BBL' };
const BBL_CODES = Object.keys(BBL_CLUBS);
const ODC_SLOTS = { spr: { pre: [0, 1], during: [2, 3] }, late: { pre: [4], during: [5, 6, 'final'] } };
const BBL_SLOTS = { sum: { pre: [], mid: [0, 1, 2, 3, 4], during: [5, 6, 7, 8, 9, 'finals'] } };
const WB_OPENERS = new Set(['Travis Head', 'Mitchell Marsh', 'Matt Short', 'Jake Fraser-McGurk', 'Mitch Owen', 'David Warner', 'Matthew Renshaw', 'Josh Inglis', 'Ben McDermott', 'Josh Philippe', 'Max Bryant', 'Sam Konstas', 'Caleb Jewell', 'Usman Khawaja', 'Finn Allen', 'Tim Seifert',
  'Rohit Sharma', 'Shubman Gill', 'Abhishek Sharma', 'Yashasvi Jaiswal', 'Sanju Samson', 'Phil Salt', 'Ben Duckett', 'Jamie Smith', 'Jos Buttler', 'Will Jacks', 'Zak Crawley', 'Tom Banton', 'Quinton de Kock', 'Ryan Rickelton', 'Aiden Markram', 'Reeza Hendricks',
  'Devon Conway', 'Rachin Ravindra', 'Will Young', 'Saim Ayub', 'Fakhar Zaman', 'Sahibzada Farhan', 'Abdullah Shafique', 'Pathum Nissanka', 'Kusal Mendis', 'Kusal Perera', 'Rahmanullah Gurbaz', 'Ibrahim Zadran', 'Tanzid Hasan', 'Litton Das', 'Brandon King', 'Evin Lewis', 'Paul Stirling', 'Brian Bennett', 'Tadiwanashe Marumani', 'Jonny Bairstow', 'Chris Lynn']);

// ---------- Player prep ----------
function wbDefaults(p) {
  const b = p.bat, bl = (b.tech + b.conc + b.vPace + b.vSpin) / 4;
  const d = { power: b.agg * 0.6 + bl * 0.35, finish: b.agg * 0.35 + bl * 0.6 };
  if (p.bowl) { d.death = p.bowl.skill * 0.55 + p.bowl.acc * 0.35; d.vars = p.bowl.skill * 0.7; }
  return d;
}
function wbPrep(p) {
  wbInit(p);
  if (!p.wbo) fitWBO(p);
  if (p.potWB) { const best = Math.max(wbOverall(p, 'odi'), wbOverall(p, 't20')); p.potRaw = Math.max(overall(p), overall(p) + Math.max(0, p.potWB - best)); delete p.potWB; }
  if (p.peakWB == null) p.peakWB = Math.max(wbOverall(p, 'odi'), wbOverall(p, 't20'));
  return p;
}
const intlOK = (p, fmt) => fmt === 'test' ? !p.wbOnly : (!p.intl || p.intl === fmt);
const bblOnly = p => p.wbOnly && p.intl === 'none';
const wbVal = (p, fmt, youth) => wbOverall(p, fmt) + (p.form || 0) * 0.3 + (youth && p.age <= 23 ? Math.max(0, wbPotential(p, fmt) - wbOverall(p, fmt)) * 0.15 : 0);
const bowlOpt = p => p.bowl && p.bowl.skill >= 60;

// ---------- Selection ----------
function autoSquadLO(players, fmt, size, intl) {
  size = size || 15;
  const pool = players.filter(p => available(p) && (intl === false || intlOK(p, fmt)));
  const out = new Set();
  const by = (arr, f) => arr.slice().sort((a, b) => f(b) - f(a));
  by(pool.filter(isKeeper), p => wbBat(p, fmt) + p.keep * 0.25 + (p.form || 0) * 0.3).slice(0, 1).forEach(p => out.add(p));
  by(pool.filter(p => p.role === 'BAT' || p.role === 'AR' || p.role === 'WK'), p => wbBat(p, fmt) + (p.form || 0) * 0.3).slice(0, 7).forEach(p => out.add(p));
  by(pool.filter(p => p.bowl && p.bowl.skill >= 66 && isPace(p.bowl.type)), p => wbBowl(p, fmt) + (p.form || 0) * 0.3).slice(0, 4).forEach(p => out.add(p));
  by(pool.filter(p => p.bowl && p.bowl.skill >= 66 && !isPace(p.bowl.type)), p => wbBowl(p, fmt) + (p.form || 0) * 0.3).slice(0, 2).forEach(p => out.add(p));
  by(pool, p => wbVal(p, fmt)).forEach(p => { if (out.size < size) out.add(p); });
  return [...out].slice(0, size);
}
function autoXILO(squad, fmt, venue, opt) {
  opt = opt || {};
  let pool = squad.filter(p => available(p) && !(opt.unavail && opt.unavail.has(p.name)));
  if (pool.length < 11) pool = squad.filter(available);
  if (pool.length < 11) pool = squad.slice();
  const used = new Set(), maxOS = opt.overseas != null ? opt.overseas : 99;
  const os = () => [...used].filter(p => p.nat !== 'AUS').length;
  const can = p => !used.has(p) && (p.nat === 'AUS' || os() < maxOS);
  const yb = p => opt.youth && p.age <= 23 ? Math.max(0, wbPotential(p, fmt) - wbOverall(p, fmt)) * 0.12 : 0;
  const bv = p => wbBat(p, fmt) + (p.form || 0) * 0.3 + yb(p);
  const wv = p => wbBowl(p, fmt) + (p.form || 0) * 0.3 + (isPace(p.bowl.type) ? venue.pace * 0.5 : venue.spin * 0.7) + yb(p);
  const keepers = pool.filter(p => isKeeper(p) && can(p)).sort((a, b) => (bv(b) + b.keep * 0.3) - (bv(a) + a.keep * 0.3));
  used.add(keepers[0] || pool.slice().sort((a, b) => b.keep - a.keep)[0]);
  const allr = p => p.role === 'AR' && bowlOpt(p);
  pool.filter(p => (p.role === 'BAT' || p.role === 'AR' || p.role === 'WK') && can(p)).sort((a, b) => (bv(b) + (allr(b) ? 4 : 0)) - (bv(a) + (allr(a) ? 4 : 0))).slice(0, 6).forEach(p => { if (can(p)) used.add(p); });
  const opts = () => [...used].filter(bowlOpt).length;
  const spinNeed = venue.spin >= 3 ? 2 : 1;
  const spinners = () => [...used].filter(p => p.bowl && !isPace(p.bowl.type) && wbBowl(p, fmt) >= 74).length;
  pool.filter(p => can(p) && p.bowl && wbBowl(p, fmt) >= 74 && !isPace(p.bowl.type)).sort((a, b) => wv(b) - wv(a)).forEach(p => { if (spinners() < spinNeed && used.size < 11 && can(p)) used.add(p); });
  pool.filter(p => can(p) && bowlOpt(p)).sort((a, b) => wv(b) - wv(a)).forEach(p => { if (used.size < 11 && can(p)) used.add(p); });
  pool.filter(p => can(p)).sort((a, b) => wbVal(b, fmt) - wbVal(a, fmt)).forEach(p => { if (used.size < 11 && can(p)) used.add(p); });
  // make sure there are five bowling options
  let guard = 0;
  while (opts() < 5 && guard++ < 4) {
    const out = [...used].filter(p => !bowlOpt(p) && !isKeeper(p)).sort((a, b) => bv(a) - bv(b))[0];
    const inn = pool.filter(p => !used.has(p) && bowlOpt(p) && (p.nat === 'AUS' || out && out.nat !== 'AUS' || os() < maxOS)).sort((a, b) => wv(b) - wv(a))[0];
    if (!out || !inn) break;
    used.delete(out); used.add(inn);
  }
  return battingOrderLO([...used], fmt).map(p => p.name);
}
function battingOrderLO(xi, fmt) {
  const bat = p => wbBat(p, fmt);
  const cands = xi.filter(p => p.role !== 'BOWL').sort((a, b) => bat(b) - bat(a)).slice(0, 7);
  const isOp = p => WB_OPENERS.has(p.name) || OPENERS.has(p.name) || p.opener;
  const ops = cands.filter(isOp).sort((a, b) => (bat(b) + (fmt === 't20' ? b.bat.power * 0.2 : 0)) - (bat(a) + (fmt === 't20' ? a.bat.power * 0.2 : 0))).slice(0, 2);
  const rest = cands.filter(p => !ops.includes(p));
  while (ops.length < 2 && rest.length) ops.push(rest.shift());
  // anchors before finishers
  rest.sort((a, b) => (bat(b) - (b.bat.finish + b.bat.power - 150) * 0.25) - (bat(a) - (a.bat.finish + a.bat.power - 150) * 0.25));
  const order = ops.concat(rest);
  const tail = xi.filter(p => !order.includes(p)).sort((a, b) => bat(b) - bat(a));
  return order.concat(tail).slice(0, 11);
}

// ---------- Fixtures ----------
function mkWB(fmt, opp, home, n, venues, title, extra) {
  return Object.assign({ fmt, opp, home, tests: n, venues: venues || defaultVenuesLO(home ? 'AUS' : opp, n, fmt), title: title || '', status: 'planned', squad: null, results: [], testIdx: 0, when: 'post' }, extra || {});
}
const venuesOfLO = code => Object.keys(VENUES).filter(k => VENUES[k].home === code && !SHIELD_ONLY.includes(k) && k !== 'showground');
const LO_HOME_PREF = { odi: ['perth', 'adelaide', 'mcg', 'scg', 'hobart', 'manuka', 'gabba'], t20: ['mcg', 'carrara', 'gabba', 'scg', 'manuka', 'perth', 'hobart'] };
function defaultVenuesLO(host, n, fmt) {
  const list = host === 'AUS' ? LO_HOME_PREF[fmt] : venuesOfLO(host), out = [];
  for (let i = 0; i < n; i++) out.push(list[i % list.length]);
  return out;
}
function fixturesOf(w) { const wb = w.wb || []; return [...wb.filter(f => f.when === 'pre'), ...(w.fixture ? [w.fixture] : []), ...wb.filter(f => f.when !== 'pre')]; }
function activeFixture(w) { return w ? fixturesOf(w).find(f => f.status !== 'done') || null : null; }
const fmtOf = f => f.fmt || 'test';
function scheduleWindow(w) {
  const wb = w.wb || [];
  let t = addDays(windowStart(w), w.fixture ? -6 : 0);
  wb.filter(f => f.when === 'pre' && !f.fixed).reverse().forEach(f => {
    const gap = f.fmt === 'odi' ? 3 : 2; f.dates = [];
    for (let i = f.tests - 1; i >= 0; i--) { f.dates[i] = isoD(t); t = addDays(t, -gap); }
    t = addDays(t, -3);
  });
  let s = w.fixture ? addDays(testDate(w, w.fixture.tests - 1), 9) : windowStart(w);
  wb.filter(f => f.when !== 'pre' && !f.fixed).forEach(f => {
    const gap = f.fmt === 'odi' ? 3 : 2; f.dates = [];
    for (let i = 0; i < f.tests; i++) { f.dates.push(isoD(s)); s = addDays(s, gap); }
    s = addDays(s, 3);
  });
}
function matchDate(w, f, i) {
  if (f && f.fmt && f.fmt !== 'test') { const d = f.dates && f.dates[Math.min(i, f.dates.length - 1)]; return d ? new Date(d + 'T00:00:00Z') : windowStart(w); }
  return testDate(w, i);
}
const oppOf = (f, i) => f.wc ? (f.matches[i] || f.matches[f.matches.length - 1] || {}).opp : f.opp;
function windowFirstDate(w) { const fs = fixturesOf(w); let d = windowStart(w); fs.forEach(f => { if (f.fmt && f.fmt !== 'test' && f.dates && f.dates[0]) { const x = new Date(f.dates[0] + 'T00:00:00Z'); if (x < d) d = x; } }); return d; }

// ---------- World Cups ----------
function wcEvent(y) {
  const ev = ICC_EVENTS.find(e => e.season === y);
  if (ev) return Object.assign({ win: ev.after }, ev);
  if (y <= 2035) return null;
  const hosts = ['IND', 'ENG', 'SA', 'AUS', 'NZ', 'WI', 'PAK', 'SL', 'BAN'];
  if (y % 2 === 0) return { season: y, fmt: 't20', name: `T20 World Cup ${y + (y % 4 === 2 ? 0 : 0)}`, host: [hosts[(y / 2) % hosts.length]], months: y % 4 === 2 ? 'Jun to Jul' : 'Oct to Nov', win: y % 4 === 2 ? 'win' : 'spr' };
  if (y % 4 === 3) return { season: y, fmt: 'odi', name: `ODI World Cup ${y}`, host: [hosts[(y + 3) % hosts.length]], months: 'Oct to Nov', win: 'spr' };
  return null;
}
function applyEvent(w) {
  if (w.event || w.done) return;
  const ev = wcEvent(w.season);
  if (!ev || ev.win !== w.id) return;
  w.event = { fmt: ev.fmt, name: ev.name, host: ev.host };
  w.label = ev.name; w.months = ev.months; w.type = 'neutral'; w.noTour = true;
}
function wcVenues(hosts) { const out = []; hosts.forEach(h => venuesOfLO(h).forEach(v => out.push(v))); return out.length ? out : venuesOfLO('IND'); }
function makeWC(c, w) {
  const ev = w.event, fmt = ev.fmt;
  const ranked = NATIONS.slice().sort((a, b) => (c.trankWB[fmt][b] || 0) - (c.trankWB[fmt][a] || 0));
  const groups = [[], []];
  ranked.forEach((t, i) => groups[[0, 1, 1, 0][i % 4]].push(t));
  const vlist = wcVenues(ev.host);
  const games = [];
  groups.forEach((g, gi) => {
    let t = g.slice();
    for (let r = 0; r < 5; r++) {
      for (let i = 0; i < 3; i++) games.push({ r, g: gi, a: t[i], b: t[5 - i], venue: vlist[(games.length * 7 + r) % vlist.length], res: null });
      t = [t[0], t[5], t[1], t[2], t[3], t[4]];
    }
  });
  const table = {}; NATIONS.forEach(n => { table[n] = { p: 0, w: 0, l: 0, nr: 0, pts: 0, rf: 0, bf: 0, ra: 0, ba: 0 }; });
  const start = windowStart(w);
  const ours = games.filter(g => g.a === 'AUS' || g.b === 'AUS').sort((x, y) => x.r - y.r);
  const home = ev.host.includes('AUS');
  const f = { fmt, wc: true, title: ev.name, opp: null, home, neutral: !home, tests: ours.length, venues: ours.map(g => g.venue), dates: ours.map(g => isoD(addDays(start, g.r * 4))), fixed: true,
    matches: ours.map(g => ({ opp: g.a === 'AUS' ? g.b : g.a, venue: g.venue, stage: 'Group', r: g.r })), status: 'planned', squad: null, results: [], testIdx: 0, when: 'post',
    t: { groups, games, table, stage: 'group', ko: [], champ: null, runner: null, start: isoD(start) } };
  return f;
}
function lnrr(r) { return (r.bf ? r.rf / r.bf * 6 : 0) - (r.ba ? r.ra / r.ba * 6 : 0); }
function tableAdd(table, m, fmt, win2pts) {
  const full = (m.F ? m.maxOvers : 50) * 6;
  const pts = win2pts || [2, 1];
  m.teams.forEach((t, ti) => {
    const r = table[t.code] || (table[t.code] = { p: 0, w: 0, l: 0, nr: 0, pts: 0, rf: 0, bf: 0, ra: 0, ba: 0 });
    r.p++;
    if (m.result.nr) { r.nr++; r.pts += pts[1]; return; }
    if (m.result.winner === ti) { r.w++; r.pts += pts[0]; } else if (m.result.winner === -1) { r.nr++; r.pts += pts[1]; } else r.l++;
    const own = m.innings.find(i => i.bat === ti && !i.so), opp = m.innings.find(i => i.bat !== ti && !i.so);
    if (own) { r.rf += own.runs; r.bf += own.wkts >= 10 ? full : own.legal; }
    if (opp) { r.ra += opp.runs; r.ba += opp.wkts >= 10 ? full : opp.legal; }
  });
}
function wcSorted(t, gi) { return t.groups[gi].map(code => Object.assign({ t: code, nrr: lnrr(t.table[code]) }, t.table[code])).sort((a, b) => b.pts - a.pts || b.nrr - a.nrr); }
function wcPlayGame(c, f, g) {
  const m = simLOMatch(c, g.a, g.b, f.fmt, g.venue, { neutral: !(f.t && VENUES[g.venue].home === g.a), wc: true, knockout: !!g.ko });
  g.res = { winner: m.result.winner === -1 ? null : m.teams[m.result.winner].code, text: m.result.text, sc: matchSummary(m).sc };
  if (!g.ko) tableAdd(f.t.table, m, f.fmt);
  return m;
}
// called after the user's World Cup match has been recorded
function wcAfterMatch(c, f, m) {
  const t = f.t, i = f.testIdx - 1, mt = f.matches[i];
  if (mt.stage === 'Group') {
    const g = t.games.find(x => x.r === mt.r && (x.a === 'AUS' || x.b === 'AUS'));
    g.res = { winner: m.result.winner === -1 ? null : m.teams[m.result.winner].code, text: m.result.text, sc: matchSummary(m).sc };
    tableAdd(t.table, m, f.fmt);
    t.games.filter(x => x.r === mt.r && !x.res).forEach(x => wcPlayGame(c, f, x));
    if (mt.r === 4 || !f.matches.some(x => x.stage === 'Group' && x.r > mt.r)) wcGroupsDone(c, f);
  } else if (mt.stage === 'Semi-final') {
    const k = t.ko.find(x => x.stage === 'Semi-final' && (x.a === 'AUS' || x.b === 'AUS'));
    k.res = { winner: m.result.winner === -1 ? null : m.teams[m.result.winner].code, text: m.result.text };
    const other = t.ko.find(x => x.stage === 'Semi-final' && x !== k);
    if (!other.res) wcPlayGame(c, f, other);
    const fin = { stage: 'Final', a: k.res.winner || 'AUS', b: other.res.winner || other.a, venue: t.finalVenue, ko: true, res: null };
    t.ko.push(fin);
    if (fin.a === 'AUS' || fin.b === 'AUS') wcAddMatch(f, fin);
    else wcFinish(c, f);
  } else {
    const k = t.ko.find(x => x.stage === 'Final');
    k.res = { winner: m.result.winner === -1 ? null : m.teams[m.result.winner].code, text: m.result.text };
    wcFinish(c, f);
  }
}
function wcAddMatch(f, k) {
  const last = new Date(f.dates[f.dates.length - 1] + 'T00:00:00Z');
  f.matches.push({ opp: k.a === 'AUS' ? k.b : k.a, venue: k.venue, stage: k.stage });
  f.venues.push(k.venue); f.dates.push(isoD(addDays(last, 4))); f.tests = f.matches.length;
}
function wcGroupsDone(c, f) {
  const t = f.t; t.games.filter(x => !x.res).forEach(x => wcPlayGame(c, f, x));
  const A = wcSorted(t, 0), B = wcSorted(t, 1);
  const vl = wcVenues((c.windows.find(w => w.wb && w.wb.includes(f)) || { event: { host: ['IND'] } }).event.host);
  t.finalVenue = vl[0];
  t.ko = [{ stage: 'Semi-final', a: A[0].t, b: B[1].t, venue: vl[1 % vl.length], ko: true, res: null }, { stage: 'Semi-final', a: B[0].t, b: A[1].t, venue: vl[2 % vl.length], ko: true, res: null }];
  t.stage = 'ko';
  const ours = t.ko.find(k => k.a === 'AUS' || k.b === 'AUS');
  news(c, `${f.title}: group stage complete. Semi-finals: ${t.ko.map(k => `${TEAMS[k.a].name} v ${TEAMS[k.b].name}`).join(', ')}.`, ours ? 'good' : 'bad');
  if (ours) wcAddMatch(f, ours);
  else {
    t.ko.forEach(k => wcPlayGame(c, f, k));
    const fin = { stage: 'Final', a: t.ko[0].res.winner || t.ko[0].a, b: t.ko[1].res.winner || t.ko[1].a, venue: t.finalVenue, ko: true, res: null };
    t.ko.push(fin); wcPlayGame(c, f, fin); wcFinish(c, f);
  }
}
function wcFinish(c, f) {
  const t = f.t, fin = t.ko.find(k => k.stage === 'Final');
  if (fin && !fin.res) wcPlayGame(c, f, fin);
  t.champ = fin.res.winner || fin.a; t.runner = t.champ === fin.a ? fin.b : fin.a; t.stage = 'done';
  f.tests = f.testIdx; f.status = 'done';
  c.wcHistory = c.wcHistory || [];
  c.wcHistory.unshift({ name: f.title, fmt: f.fmt, champ: t.champ, runner: t.runner, text: fin.res.text });
  news(c, `${f.title}: ${TEAMS[t.champ].name} are world champions! ${fin.res.text}.`, t.champ === 'AUS' ? 'big' : 'big');
}
function wcStage(f) { const t = f.t; if (t.champ === 'AUS') return 4; if (t.ko.some(k => k.stage === 'Final' && (k.a === 'AUS' || k.b === 'AUS'))) return 3; if (t.ko.some(k => k.stage === 'Semi-final' && (k.a === 'AUS' || k.b === 'AUS'))) return 2; return 1; }

// ---------- Matches ----------
function loTeamsMap(labels) { const o = {}; Object.keys(labels).forEach(k => { o[k] = { name: labels[k], short: k, squad: [] }; }); return o; }
function simLOMatch(c, home, away, fmt, venueKey, opt) {
  opt = opt || {};
  const venue = VENUES[venueKey];
  const xiOf = code => autoXILO(autoSquadLO(c.players[code], fmt, 15), fmt, venue).map(n => P_(c, n));
  const m = createMatchLO({ fmt, home, away, venue, venueKey, xi: { [home]: xiOf(home), [away]: xiOf(away) }, userTeam: 'none', TEAMS, quiet: true, neutral: !!opt.neutral,
    comp: FMT_COMP[fmt], superOver: fmt === 't20' || !!opt.wc, knockout: !!opt.knockout, captains: opt.captains });
  simQuick(m);
  recordMatch(c, m, FMT_COMP[fmt], { awayTeam: 1, wc: !!opt.wc });
  return m;
}
function simLOSeries(c, home, away, fmt, n) {
  const vs = venuesOfLO(home), res = { w: { [home]: 0, [away]: 0 }, nr: 0 };
  for (let i = 0; i < n; i++) { const m = simLOMatch(c, home, away, fmt, vs[(i + rint(0, 9)) % vs.length]); if (m.result.winner === -1) res.nr++; else res.w[m.teams[m.result.winner].code]++; }
  const hw = res.w[home], aw = res.w[away];
  res.text = `${FMT_NAME[fmt]}s: ` + (hw > aw ? `${TEAMS[home].name} beat ${TEAMS[away].name} ${hw}-${aw}` : aw > hw ? `${TEAMS[away].name} won ${aw}-${hw} in ${TEAMS[home].name}` : `${TEAMS[home].name} v ${TEAMS[away].name} shared ${hw}-${aw}`);
  return res;
}
function backgroundWB(c, w) {
  if (w.id === 'wtcf' || w.id === 'anniv' || w.event) return;
  const busy = new Set(['AUS']); fixturesOf(w).forEach(f => { if (f.opp) busy.add(f.opp); });
  const free = shuffle(NATIONS.filter(n => !busy.has(n)));
  let k = 0;
  while (free.length >= 2 && k++ < 3) {
    const a = free.pop(), b = free.pop(), home = Math.random() < 0.5 ? a : b, away = home === a ? b : a;
    const fmts = Math.random() < 0.5 ? ['odi', 't20'] : [pick(['odi', 't20'])];
    fmts.forEach(fmt => { const r = simLOSeries(c, home, away, fmt, 3); c.intl.unshift({ when: `${w.label} ${seasonLabel(w.season)}`, text: r.text, fmt }); });
  }
  if (c.intl.length > 80) c.intl.length = 80;
}

// ---------- Rankings ----------
function loTeamResult(c, m, fmt) {
  const h = m.teams[0].code, a = m.teams[1].code, R = c.trankWB[fmt];
  if (R[h] == null || R[a] == null || m.result.nr) return;
  const res = m.result.winner === -1 ? null : m.teams[m.result.winner].code;
  const sc = fmt === 't20' ? 40 : 25, K = fmt === 't20' ? 4 : 3;
  const E = 1 / (1 + Math.pow(10, -((R[h] - R[a] + (m.neutral ? 0 : 5)) / sc)));
  const S = res === h ? 1 : res === a ? 0 : 0.5;
  R[h] = Math.round((R[h] + K * (S - E)) * 10) / 10; R[a] = Math.round((R[a] - K * (S - E)) * 10) / 10;
}
function prankLO(c, fmt, name) { const T = c.prankWB[fmt]; return T[name] || (T[name] = { bat: 250, bowl: 0, last: c.ptr }); }
function prankLOBat(c, fmt, name, runs, balls, no) {
  const r = prankLO(c, fmt, name), t20 = fmt === 't20';
  const srF = balls ? clamp(Math.pow((runs / balls * 100) / (t20 ? 135 : 88), 1.2), 0.55, 1.6) : 1;
  const sc = clamp(runs * (t20 ? 15 : 9.5) * srF + (no ? 40 : 0), 0, 1500);
  r.bat = Math.round(r.bat * 0.9 + sc * 0.1); r.last = c.ptr;
}
function prankLOBowl(c, fmt, name, w, runs, balls) {
  const r = prankLO(c, fmt, name), t20 = fmt === 't20';
  if (!r.bowl) r.bowl = 250;
  const econ = runs / balls * 6, par = t20 ? 8.2 : 5.6;
  const sc = clamp(w * (t20 ? 210 : 140) + 300 + clamp((par - econ) * (t20 ? 70 : 90), -200, 200), 0, 1500);
  r.bowl = Math.round(r.bowl * 0.9 + sc * 0.1); r.last = c.ptr;
}
function seedWBRanks(c) {
  c.trankWB = { odi: Object.assign({}, RANK_SEED_ODI), t20: Object.assign({}, RANK_SEED_T20) };
  c.prankWB = { odi: {}, t20: {} };
  WB_FMTS.forEach(fmt => NATIONS.forEach(code => {
    autoSquadLO(c.players[code], fmt, 15).forEach(p => {
      const RB = REAL_WB[fmt + 'Bat'][p.name], RW = REAL_WB[fmt + 'Bowl'][p.name];
      c.prankWB[fmt][p.name] = { bat: RB || Math.round(clamp((wbBat(p, fmt) - 52) * 20, 0, 760)), bowl: RW || (p.bowl && p.bowl.skill >= 60 ? Math.round(clamp((wbBowl(p, fmt) - 52) * 20, 0, 680)) : 0), last: 2 };
    });
  }));
}

// ---------- Domestic: One-Day Cup ----------
function rrRounds(teams, n) {
  let t = teams.slice(); const out = [], k = t.length;
  for (let r = 0; r < k - 1; r++) {
    const rd = []; for (let i = 0; i < k / 2; i++) rd.push(r % 2 ? [t[k - 1 - i], t[i]] : [t[i], t[k - 1 - i]]);
    out.push(rd); t = [t[0], t[k - 1], ...t.slice(1, k - 1)];
  }
  for (let i = 0; out.length < n; i++) out.push(out[i].map(([h, a]) => [a, h]));
  return out.slice(0, n);
}
function blankLadder(codes) { const o = {}; codes.forEach(s => { o[s] = { p: 0, w: 0, l: 0, nr: 0, pts: 0, rf: 0, bf: 0, ra: 0, ba: 0 }; }); return o; }
function newODCSeason(y) {
  const order = STATE_CODES.slice(); for (let i = 0; i < (y % 6); i++) order.push(order.splice(1, 1)[0]);
  return { y, rounds: rrRounds(order, 7), played: [], results: [], ladder: blankLadder(STATE_CODES), stats: {}, final: null, champ: null };
}
function ladderSorted(L) { return Object.entries(L).map(([s, r]) => Object.assign({ s, nrr: lnrr(r) }, r)).sort((a, b) => b.pts - a.pts || b.nrr - a.nrr); }
function domesticXI(c, pool, fmt, venue, unavail, overseas) {
  return autoXILO(pool.filter(p => !(unavail && unavail.has(p.name))), fmt, venue, { youth: true, overseas }).map(n => P_(c, n));
}
function playODC(c, home, away, unavail, final) {
  const vk = STATES[home].home, venue = VENUES[vk];
  const pool = s => statePool(c, s).filter(p => !bblOnly(p));
  const m = createMatchLO({ fmt: 'odi', home, away, venue, venueKey: vk, xi: { [home]: domesticXI(c, pool(home), 'odi', venue, unavail), [away]: domesticXI(c, pool(away), 'odi', venue, unavail) }, userTeam: 'none',
    TEAMS: loTeamsMap({ [home]: STATES[home].name, [away]: STATES[away].name }), quiet: true, comp: 'odc', superOver: !!final, knockout: !!final });
  simQuick(m);
  recordMatch(c, m, 'odc', {});
  return m;
}
function odcResult(o, m, r, h, a) {
  if (m.result.nr) { [h, a].forEach(s => { o.ladder[s].p++; o.ladder[s].nr++; o.ladder[s].pts += 2; }); }
  else {
    tableAdd(o.ladder, m, 'odi', [4, 2]);
    if (m.result.winner !== -1) { // bonus point: run rate 1.25 times the opposition
      const wi = m.result.winner, W = m.teams[wi].code, own = m.innings.find(i => i.bat === wi && !i.so), opp = m.innings.find(i => i.bat !== wi && !i.so);
      if (own && opp && own.legal && opp.legal && own.runs / own.legal >= 1.25 * opp.runs / (opp.wkts >= 10 ? m.maxOvers * 6 : opp.legal)) o.ladder[W].pts += 1;
    }
  }
  o.results.push(Object.assign({ round: r + 1, home: h, away: a, text: m.result.text }, matchSummary(m)));
}
function simODCRound(c, r, unavail) {
  const o = c.odc; if (!o || o.played.includes(r) || r >= o.rounds.length) return;
  o.rounds[r].forEach(([h, a]) => { const m = playODC(c, h, a, unavail, false); odcResult(o, m, r, h, a); });
  o.played.push(r);
}
function simODCFinal(c, unavail) {
  const o = c.odc; if (o.champ) return;
  const [a, b] = ladderSorted(o.ladder);
  const m = playODC(c, a.s, b.s, unavail, true);
  const win = m.result.winner === -1 ? a.s : m.teams[m.result.winner].code;
  o.final = Object.assign({ home: a.s, away: b.s, text: m.result.winner === -1 ? `${m.result.text}, ${STATES[a.s].name} win as the higher-placed side` : m.result.text }, matchSummary(m));
  o.champ = win;
  news(c, `${STATES[win].name} win the One-Day Cup! ${o.final.text}.`, 'big');
}

// ---------- Domestic: Big Bash ----------
function bblSigned(c) { const s = new Set(); Object.values(c.bbl.clubs).forEach(cl => cl.squad.forEach(n => s.add(n))); return s; }
function newBBLSeason(c, y) {
  const prev = c.bbl;
  let clubs;
  if (!prev) { clubs = {}; BBL_CODES.forEach(k => { clubs[k] = { squad: BBL_CLUBS[k].squad.filter(n => P_(c, n)) }; }); }
  else clubs = prev.clubs;
  const o = { y, clubs, rounds: rrRounds(shuffle(BBL_CODES.slice()), 10), played: [], results: [], ladder: blankLadder(BBL_CODES), stats: {}, finals: [], champ: null };
  c.bbl = o;
  if (prev) bblRefresh(c);
  return o;
}
function bblRefresh(c) {
  const clubs = c.bbl.clubs;
  Object.values(clubs).forEach(cl => { cl.squad = cl.squad.filter(n => { const p = P_(c, n); return p && !p.retired; }); });
  // release the weakest if the list is too long
  Object.values(clubs).forEach(cl => { if (cl.squad.length > 17) cl.squad = cl.squad.map(n => P_(c, n)).sort((a, b) => (wbOverall(b, 't20') + (b.age <= 22 ? 4 : 0)) - (wbOverall(a, 't20') + (a.age <= 22 ? 4 : 0))).slice(0, 17).map(p => p.name); });
  const signed = bblSigned(c);
  const locals = c.players.AUS.filter(p => !signed.has(p.name) && !p.retired && p.age >= 18).sort((a, b) => (wbOverall(b, 't20') + Math.max(0, wbPotential(b, 't20') - wbOverall(b, 't20')) * 0.3) - (wbOverall(a, 't20') + Math.max(0, wbPotential(a, 't20') - wbOverall(a, 't20')) * 0.3));
  const os = NATIONS.filter(n => n !== 'AUS' && n !== 'IND').flatMap(n => c.players[n]).filter(p => !signed.has(p.name) && !p.retired && p.age <= 36).sort((a, b) => wbOverall(b, 't20') - wbOverall(a, 't20')).slice(0, 30);
  const keys = shuffle(Object.keys(clubs));
  for (let round = 0; round < 6; round++) keys.forEach(k => {
    const cl = clubs[k], nOS = cl.squad.filter(n => { const p = P_(c, n); return p && p.nat !== 'AUS'; }).length;
    if (nOS < 3 && os.length) { const i = Math.floor(Math.random() * Math.min(6, os.length)); const p = os.splice(i, 1)[0]; cl.squad.push(p.name); }
    else if (cl.squad.length < 16 && locals.length) { const i = Math.floor(Math.random() * Math.min(4, locals.length)); cl.squad.push(locals.splice(i, 1)[0].name); }
  });
}
function bblClubOf(c, name) { if (!c.bbl) return null; return BBL_CODES.find(k => c.bbl.clubs[k].squad.includes(name)) || null; }
function bblPool(c, k, unavail) {
  const list = c.bbl.clubs[k].squad.map(n => P_(c, n)).filter(p => p && available(p) && !(unavail && unavail.has(p.name)));
  if (list.filter(p => p.nat === 'AUS').length < 9) { // local replacement players
    const signed = bblSigned(c);
    c.players.AUS.filter(p => !signed.has(p.name) && available(p) && !(unavail && unavail.has(p.name))).sort((a, b) => wbOverall(b, 't20') - wbOverall(a, 't20')).slice(0, 12 - list.length).forEach(p => list.push(p));
  }
  return list;
}
function playBBL(c, home, away, unavail, venueKey, ko) {
  const vk = venueKey || BBL_CLUBS[home].home, venue = VENUES[vk];
  const m = createMatchLO({ fmt: 't20', home, away, venue, venueKey: vk, xi: { [home]: domesticXI(c, bblPool(c, home, unavail), 't20', venue, null, 3), [away]: domesticXI(c, bblPool(c, away, unavail), 't20', venue, null, 3) },
    userTeam: 'none', TEAMS: loTeamsMap({ [home]: BBL_CLUBS[home].name, [away]: BBL_CLUBS[away].name }), quiet: true, comp: 'bbl', superOver: true, knockout: !!ko });
  simQuick(m);
  recordMatch(c, m, 'bbl', {});
  return m;
}
function simBBLRound(c, r, unavail) {
  const o = c.bbl; if (!o || o.played.includes(r) || r >= o.rounds.length) return;
  o.rounds[r].forEach(([h, a]) => {
    const m = playBBL(c, h, a, unavail);
    tableAdd(o.ladder, m, 't20', [2, 1]);
    o.results.push(Object.assign({ round: r + 1, home: h, away: a, text: m.result.text }, matchSummary(m)));
  });
  o.played.push(r);
}
function simBBLFinals(c, unavail) {
  const o = c.bbl; if (o.champ) return;
  const L = ladderSorted(o.ladder).map(x => x.s);
  const play = (stage, a, b) => { const m = playBBL(c, a, b, unavail, BBL_CLUBS[a].home, true); const w = m.result.winner === -1 ? a : m.teams[m.result.winner].code; o.finals.push(Object.assign({ stage, home: a, away: b, text: m.result.text, winner: w }, matchSummary(m))); return w; };
  const q = play('Qualifier', L[0], L[1]), qLoser = q === L[0] ? L[1] : L[0];
  const k = play('Knockout', L[2], L[3]);
  const ch = play('Challenger', qLoser, k);
  o.champ = play('Final', q, ch);
  news(c, `${BBL_CLUBS[o.champ].name} win BBL|${o.y - 2010}! ${o.finals[3].text}.`, 'big');
}

// ---------- Expectations ----------
function rankIn(table, code) { return Object.entries(table).sort((a, b) => b[1] - a[1]).findIndex(([t]) => t === code) + 1; }
function expectationWB(c, f) {
  const R = c.trankWB[f.fmt];
  if (f.wc) { const rk = rankIn(R, 'AUS'); return rk <= 2 ? { lvl: 3, text: 'Reach the final' } : rk <= 4 ? { lvl: 2, text: 'Reach the semi-finals' } : { lvl: 1, text: 'Be competitive in the group stage' }; }
  const d = (R.AUS || 100) - (R[f.opp] || 60) + (f.home ? 6 : f.neutral ? 0 : -6);
  const sc = f.fmt === 't20' ? 1.6 : 1;
  if (d > 22 * sc) return { lvl: 2, text: 'Win the series comfortably' };
  if (d > 4 * sc) return { lvl: 1, text: 'Win the series' };
  if (d > -8 * sc) return { lvl: 0, text: 'Do not lose the series' };
  return { lvl: -1, text: 'Be competitive' };
}

// ---------- Window helpers ----------
function windowSquads(c, w, onlyAway) {
  const s = new Set();
  fixturesOf(w).forEach(f => { if (f.squad && (!onlyAway || !f.home)) f.squad.forEach(n => s.add(n)); });
  return s;
}

Object.assign(Career, { WB_FMTS, FMT_NAME, FMT_PLURAL, FMT_COMP, COMP_NAME, BBL_CODES, intlOK, bblOnly, autoSquadLO, autoXILO, battingOrderLO, mkWB, venuesOfLO, defaultVenuesLO, fixturesOf, activeFixture,
  fmtOf, scheduleWindow, matchDate, oppOf, wcAfterMatch, wcSorted, wcStage, ladderSorted, expectationWB, bblClubOf, lnrr, windowFirstDate, rankIn, wbPrep });

// ---------- Captaincy, XI and series results ----------
function setCaptainWB(c, fmt, name, vice) {
  const cur = c.captains[fmt] || [null, null];
  if (name && name !== cur[0]) { const p = P_(c, name); if (p) moraleAdd(p, 6); if (cur[0] && P_(c, cur[0])) moraleAdd(P_(c, cur[0]), -6); news(c, `${name} is Australia's new ${FMT_NAME[fmt]} captain.`, 'big'); }
  c.captains[fmt] = [name || null, vice || null];
}
function onXISelectedWB(c, f, xi) {
  const last = f.lastXI || [], comp = FMT_COMP[f.fmt];
  xi.forEach(n => {
    const p = P_(c, n); if (!p) return;
    const st = (c.stats[n] || {})[comp];
    if (!(st && st.m) && p.age <= 27 && !(c.capped && c.capped[f.fmt] && c.capped[f.fmt].includes(n))) { moraleAdd(p, 6); news(c, `${n} will make his ${FMT_NAME[f.fmt]} debut.`, 'good'); }
    else moraleAdd(p, 1.5);
  });
  last.filter(n => !xi.includes(n)).forEach(n => { const p = P_(c, n); if (p) moraleAdd(p, -3); });
  f.lastXI = xi.slice();
}
function seriesFinishedWB(c, f) {
  const us = f.results.filter(r => r.winner === 'AUS').length, them = f.results.filter(r => r.winner && r.winner !== 'AUS').length;
  let d;
  if (f.wc) {
    const st = wcStage(f), tgt = f.exp ? f.exp.lvl : 2;
    d = (st - tgt) * 6 + (st === 4 ? 8 : 0);
    const label = ['', 'out in the group stage', 'semi-finalists', 'runners-up', 'world champions'][st];
    board(c, d, `${f.title}: ${label}${f.exp ? ` (target: ${f.exp.text.toLowerCase()})` : ''}`);
  } else {
    const res = us > them ? (us - them >= 2 || them === 0 ? 2 : 1) : us === them ? 0 : (them - us >= 2 ? -2 : -1);
    const exp = f.exp ? f.exp.lvl : 1;
    d = ((res - exp) * 6 + (us - them)) * (f.fmt === 'odi' ? 0.55 : 0.45);
    board(c, d, `${f.title || FMT_NAME[f.fmt] + ' series v ' + f.opp}: ${us}-${them}${f.exp ? ` (target: ${f.exp.text.toLowerCase()})` : ''}`);
  }
  (f.lastXI || []).forEach(n => { const p = P_(c, n); if (p) moraleAdd(p, us > them ? 2 : them > us ? -1.5 : 0); });
  c.board.exp = null;
}

// ---------- Save migration ----------
function migrateWB(c) {
  if (!c.trankWB) {
    const w = curWindow(c), yrs = w ? Math.max(0, w.season - 2026) : 0;
    NATIONS.forEach(code => (WB_EXTRA[code] || []).forEach(src => {
      if (P_(c, src.name) || src.age + yrs > 39) return;
      const p = JSON.parse(JSON.stringify(src)); p.age += yrs; p.nat = code;
      p.potRaw = p.potRaw || null; wbPrep(p); p.potRaw = Math.max(overall(p), p.potRaw || overall(p)); p.peak = Math.max(p.peak || 0, potential(p));
      p.hist = [{ y: w ? w.season : 2026, o: overall(p), p: potential(p) }]; p.sp = { n: 0, sum: 0 }; p.morale = 65; p.lead = defaultLead(p);
      c.players[code].push(p);
    }));
    bump(c);
    NATIONS.forEach(code => c.players[code].forEach(p => { if (WB_INTL[p.name] && WB_INTL[p.name] !== 'all' && !p.intl) p.intl = WB_INTL[p.name]; wbPrep(p); }));
    seedWBRanks(c);
  }
  NATIONS.forEach(code => c.players[code].forEach(p => { if (p.bat.power == null) wbPrep(p); }));
  if (!c.captains) c.captains = { odi: ['Mitchell Marsh', 'Travis Head'], t20: ['Mitchell Marsh', 'Travis Head'] };
  if (!c.wcHistory) c.wcHistory = [];
  c.windows.forEach(w => { if (!w.wb) w.wb = []; if (w.id === 'anniv') w.noTour = true; if (!w.done) applyEvent(w); });
  if (c.shield && !c.odc) { c.odc = newODCSeason(c.shield.y); c.odcHistory = [{ y: 2025, champ: 'NSW' }]; }
  if (c.shield && !c.bbl) { newBBLSeason(c, c.shield.y); c.bblHistory = [{ y: 2025, champ: 'SCO' }]; }
  const s26 = c.windows.find(w => w.key === '2026-sum');
  if (s26 && !s26.done && !s26.wbSeeded && !s26.wb.length && (!s26.fixture || s26.fixture.status === 'planned')) {
    s26.wb = [mkWB('odi', 'ENG', true, 3, ['perth', 'adelaide', 'hobart'], 'England ODI series', { when: 'pre', fixed: true, dates: ['2026-11-13', '2026-11-15', '2026-11-18'] }),
      mkWB('t20', 'ENG', true, 5, ['mcg', 'carrara', 'gabba', 'scg', 'manuka'], 'England T20I series', { when: 'pre', fixed: true, dates: ['2026-11-21', '2026-11-24', '2026-11-27', '2026-11-29', '2026-12-02'] })];
  }
  if (s26) s26.wbSeeded = true;
  c.v = Math.max(c.v || 0, 5);
}

Object.assign(Career, { setCaptainWB, onXISelectedWB, seriesFinishedWB, migrateWB });

// BBL starts mid-December: the first half is played once the Test summer is under way
function windowProgress(c, w) {
  const bs = BBL_SLOTS[w.id];
  if (!bs || !bs.mid || w.bblMid || !c.bbl) return;
  const tf = w.fixture, started = tf ? tf.results.length >= 1 : fixturesOf(w).every(f => f.status === 'done');
  if (!started) return;
  w.bblMid = true;
  bs.mid.forEach(r => simBBLRound(c, r, windowSquads(c, w)));
  news(c, `The Big Bash is under way: ${BBL_CLUBS[ladderSorted(c.bbl.ladder)[0].s].name} lead after ${bs.mid.length} rounds.`);
}
Object.assign(Career, { windowProgress });

// Keep saves small: drop records that nothing reads any more (called at season end)
function pruneSave(c) {
  const live = new Set(NATIONS.flatMap(n => c.players[n]).map(p => p.name));
  Object.keys(c.stats).forEach(n => {
    if (live.has(n)) return;
    const o = c.stats[n], intl = ['test', 'odi', 't20i'].reduce((a, k) => a + (o[k] ? o[k].m : 0), 0);
    if (intl < 20) { delete c.stats[n]; return; }
    Object.values(o).forEach(s => { delete s.recentBat; delete s.recentBowl; });
  });
  [c.prank].concat(c.prankWB ? [c.prankWB.odi, c.prankWB.t20] : []).forEach(T => { if (T) Object.keys(T).forEach(n => { if (!live.has(n)) delete T[n]; }); });
  if (c.news && c.news.length > 120) c.news.length = 120;
  if (c.intl && c.intl.length > 60) c.intl.length = 60;
}
Object.assign(Career, { pruneSave });
