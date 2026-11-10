// ===== CAREER MODE =====
const NATIONS = ['AUS', 'ENG', 'IND', 'SA', 'NZ', 'PAK', 'SL', 'WI', 'BAN', 'ZIM', 'IRE', 'AFG'];
const WTC_TEAMS = ['AUS', 'ENG', 'IND', 'SA', 'NZ', 'PAK', 'SL', 'WI', 'BAN'];
const STATE_CODES = ['NSW', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const WINDOWS = [
  { id: 'win', label: 'Winter tour', months: 'Jul to Aug', type: 'away', weeks: 8 },
  { id: 'spr', label: 'Spring tour', months: 'Sep to Nov', type: 'away', weeks: 10 },
  { id: 'sum', label: 'Home summer', months: 'Dec to Jan', type: 'home', weeks: 9 },
  { id: 'late', label: 'Late summer', months: 'Feb to Mar', type: 'either', weeks: 8 },
];
// Shield rounds by window: pre = played before the window's Tests (everyone available), during = Test squad away
const SHIELD_SLOTS = { spr: { pre: [], during: [0, 1, 2, 3] }, sum: { pre: [4, 5], during: [] }, late: { pre: [], during: [6, 7, 8, 9, 'final'] } };
const OPENERS = new Set(['Travis Head', 'Jake Weatherald', 'Sam Konstas', 'Marcus Harris', 'Matthew Renshaw', 'Cameron Bancroft', 'Henry Hunt', 'Sam Whiteman', 'Kurtis Patterson',
  'Caleb Jewell', 'Tim Ward', 'Campbell Kellaway', 'Ashley Chandrasinghe', 'Jack Clayton', 'Harry Dixon', 'Jayden Goodwin', 'Jordan Silk',
  'Tom Latham', 'Devon Conway', 'Ben Duckett', 'Zak Crawley', 'Emilio Gay', 'Yashasvi Jaiswal', 'KL Rahul', 'Aiden Markram', 'Ryan Rickelton', 'Marques Ackerman',
  'Abdullah Shafique', 'Imam-ul-Haq', 'Shan Masood', 'Pathum Nissanka', 'Lahiru Udara', 'Kraigg Brathwaite', 'John Campbell', 'Shadman Islam', 'Mahmudul Hasan Joy',
  'Ben Curran', 'Brian Bennett', 'Peter Moor', 'Paul Stirling', 'Ibrahim Zadran', 'Abdul Malik', 'Will Young']);
const HOME_PREF = { 1: ['mcg'], 2: ['perth', 'adelaide'], 3: ['perth', 'adelaide', 'mcg'], 4: ['perth', 'adelaide', 'mcg', 'scg'], 5: ['perth', 'gabba', 'adelaide', 'mcg', 'scg'] };
const seasonLabel = y => `${y}-${String(y + 1).slice(2)}`;
const venuesOf = code => Object.keys(VENUES).filter(k => VENUES[k].home === code && !SHIELD_ONLY.includes(k) && !LO_ONLY.includes(k));
const rand = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rand(a, b + 1));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function defaultVenues(host, n) {
  if (host === 'AUS') return HOME_PREF[n].slice();
  const list = venuesOf(host), out = [];
  for (let i = 0; i < n; i++) out.push(list[i % list.length]);
  return out;
}
function mkFixture(opp, home, tests, venues, title, extra) {
  return Object.assign({ opp, home, tests, venues: venues || defaultVenues(home ? 'AUS' : opp, tests), title: title || '',
    status: 'planned', squad: null, results: [], testIdx: 0 }, extra || {});
}
function makeSeason(y) {
  const ws = WINDOWS.map(w => Object.assign({ key: `${y}-${w.id}`, season: y, fixture: null, done: false }, w));
  if ((y + 1) % 2 === 1) ws.push({ key: `${y}-wtcf`, season: y, id: 'wtcf', label: 'WTC Final', months: 'June', type: 'neutral', weeks: 3, fixture: null, done: false, wtc: true });
  ws.forEach(w => { w.wb = []; applyEvent(w); });
  return ws;
}

// ---------- Player index ----------
let IDX = null;
function idx(c) {
  if (!IDX || IDX.c !== c || IDX.n !== c._ver) {
    const map = new Map();
    NATIONS.forEach(code => c.players[code].forEach(p => map.set(p.name, p)));
    IDX = { c, map, n: c._ver };
  }
  return IDX.map;
}
function bump(c) { c._ver = (c._ver || 0) + 1; }
const P_ = (c, name) => idx(c).get(name);
function findPlayer(c, code, name) { return P_(c, name); }
const available = p => !p.injury && !p.retired;

// ---------- Selection ----------
const isKeeper = p => p.role === 'WK';
const frontline = p => p.bowl && p.bowl.skill >= 68;
const spinner = p => p.bowl && !isPace(p.bowl.type);
const selVal = (p, youth) => overall(p) + (p.form || 0) * 0.35 + (youth && p.age <= 23 ? Math.max(0, potential(p) - overall(p)) * 0.15 : 0);

function autoSquad(players, size, youth) {
  size = size || 15;
  const pool = players.filter(p => available(p) && !p.wbOnly);
  const by = (arr, f) => arr.slice().sort((a, b) => f(b) - f(a));
  const out = new Set();
  const sv = p => selVal(p, youth);
  by(pool.filter(isKeeper), p => sv(p) + p.keep * 0.2).slice(0, 1).forEach(p => out.add(p));
  by(pool.filter(p => p.role === 'BAT' || p.role === 'AR'), p => batRating(p) + (p.form || 0) * 0.35).slice(0, 7).forEach(p => out.add(p));
  by(pool.filter(p => frontline(p) && isPace(p.bowl.type)), p => bowlRating(p) + (p.form || 0) * 0.35).slice(0, 5).forEach(p => out.add(p));
  by(pool.filter(p => frontline(p) && spinner(p)), bowlRating).slice(0, 2).forEach(p => out.add(p));
  by(pool, sv).forEach(p => { if (out.size < size) out.add(p); });
  return [...out].slice(0, size);
}

function autoXI(squad, venue, energy, youth) {
  const ok = p => available(p) && (!energy || energy[p.name] == null || energy[p.name] >= 70);
  let pool = squad.filter(ok);
  if (pool.length < 11) pool = squad.filter(available);
  if (pool.length < 11) pool = squad.slice();
  const used = new Set();
  const take = p => { used.add(p); return p; };
  const bv = p => batRating(p) + (p.form || 0) * 0.35 + (youth && p.age <= 23 ? Math.max(0, potential(p) - overall(p)) * 0.12 : 0);
  const wv = p => bowlRating(p) + (p.form || 0) * 0.35 + (isPace(p.bowl.type) ? venue.pace * 0.6 : venue.spin * 0.8) + (youth && p.age <= 23 ? Math.max(0, potential(p) - overall(p)) * 0.12 : 0);
  const keepers = pool.filter(isKeeper).sort((a, b) => (b.keep * 0.6 + bv(b)) - (a.keep * 0.6 + bv(a)));
  const keeper = take(keepers[0] || pool.slice().sort((a, b) => b.keep - a.keep)[0]);
  const batters = pool.filter(p => !used.has(p) && (p.role === 'BAT' || p.role === 'AR')).sort((a, b) => bv(b) - bv(a)).slice(0, 6);
  batters.forEach(take);
  const spinNeed = venue.spin >= 3 ? 2 : 1;
  let spinHave = batters.filter(p => frontline(p) && spinner(p)).length;
  const bowlers = [];
  pool.filter(p => !used.has(p) && frontline(p) && spinner(p)).sort((a, b) => wv(b) - wv(a)).forEach(p => { if (spinHave < spinNeed && bowlers.length < 4) { bowlers.push(take(p)); spinHave++; } });
  pool.filter(p => !used.has(p) && p.bowl).sort((a, b) => wv(b) - wv(a)).forEach(p => { if (bowlers.length < 4) bowlers.push(take(p)); });
  pool.filter(p => !used.has(p)).sort((a, b) => overall(b) - overall(a)).forEach(p => { if (used.size < 11) take(p); });
  return battingOrder([...used], keeper).map(p => p.name);
}
function battingOrder(xi, keeper) {
  keeper = keeper || xi.find(isKeeper);
  const top = xi.filter(p => p !== keeper && (p.role === 'BAT' || p.role === 'AR')).sort((a, b) => batRating(b) - batRating(a)).slice(0, 6);
  const ops = top.filter(p => OPENERS.has(p.name) || p.opener).slice(0, 2);
  const rest = top.filter(p => !ops.includes(p));
  while (ops.length < 2 && rest.length) ops.push(rest.pop());
  const mid = [rest[1], rest[0], rest[2], rest[3]].filter(Boolean);
  const order = ops.concat(mid);
  const tail = xi.filter(p => !order.includes(p) && p !== keeper).sort((a, b) => batRating(b) - batRating(a));
  return order.concat(keeper ? [keeper] : [], tail).slice(0, 11);
}

// ---------- New career ----------
function blankStats() { return { m: 0, inn: 0, no: 0, runs: 0, balls: 0, hs: 0, hsNo: false, h100: 0, h50: 0, ducks: 0, fours: 0, sixes: 0,
  bBalls: 0, bRuns: 0, wk: 0, mdn: 0, bw: 0, br: 999, fiveW: 0, tenW: 0, ct: 0, st: 0, ro: 0, recentBat: [], recentBowl: [] }; }
function statsOf(c, name, comp) { const s = c.stats[name] || (c.stats[name] = {}); return s[comp] || (s[comp] = blankStats()); }

const TEST_AUS = ['Steve Smith', 'Pat Cummins', 'Mitchell Starc', 'Josh Hazlewood', 'Nathan Lyon', 'Marnus Labuschagne', 'Travis Head', 'Alex Carey', 'Jake Weatherald', 'Cameron Green',
  'Beau Webster', 'Josh Inglis', 'Scott Boland', 'Michael Neser', 'Matthew Kuhnemann', 'Matthew Renshaw', 'Sam Konstas', 'Nathan McSweeney', 'Brendan Doggett', 'Cooper Connolly', 'Todd Murphy', 'Mitchell Marsh'];
const REAL_BAT = { 'Harry Brook': 861, 'Joe Root': 816, 'Travis Head': 799, 'Temba Bavuma': 793, 'Steve Smith': 790, 'Kane Williamson': 760, 'Rishabh Pant': 713, 'Yashasvi Jaiswal': 700, 'Shubman Gill': 709, 'Aiden Markram': 706, 'Babar Azam': 690 };
const REAL_BOWL = { 'Mitchell Starc': 881, 'Marco Jansen': 875, 'Matt Henry': 861, 'Ollie Robinson': 856, 'Jasprit Bumrah': 853, 'Pat Cummins': 835, 'Simon Harmer': 817, 'Kagiso Rabada': 812, 'Josh Hazlewood': 805, 'Noman Ali': 790 };
const WTC_SEED = { NZ: [6, 4, 1, 1, 52], SA: [7, 5, 2, 0, 60], AUS: [13, 9, 4, 0, 108], IND: [11, 5, 4, 2, 68], BAN: [7, 3, 3, 1, 40], ENG: [16, 7, 8, 1, 74], SL: [6, 1, 2, 3, 24], PAK: [9, 2, 7, 0, 16], WI: [12, 1, 9, 2, 18] };
const RANK_SEED = { SA: 124, AUS: 122, ENG: 105, IND: 104, NZ: 104, SL: 84, PAK: 82, BAN: 72, WI: 66, IRE: 25, ZIM: 14, AFG: 12 };

function newCareer() {
  const players = {};
  NATIONS.forEach(code => { players[code] = TEAMS[code].squad.map(p => JSON.parse(JSON.stringify(p))); });
  NATIONS.forEach(code => players[code].forEach(p => {
    wbPrep(p);
    p.potRaw = Math.max(overall(p), p.potRaw || overall(p));
    p.peak = Math.max(p.peak || 0, potential(p));
    p.hist = [{ y: 2026, o: overall(p), p: potential(p) }];
    p.sp = { n: 0, sum: 0 };
  }));
  const windows = [...makeSeason(2026), ...makeSeason(2027)];
  windows[0].done = windows[1].done = true;
  windows[0].past = 'Bangladesh, 2 Tests at home (real life)'; windows[1].past = 'South Africa, 3 Tests away (real life). Lost 2-1.';
  const W = k => windows.find(w => w.key === k);
  W('2026-sum').fixture = mkFixture('NZ', true, 4, ['perth', 'adelaide', 'mcg', 'scg'], 'Trans-Tasman Trophy');
  W('2026-sum').wb = [mkWB('odi', 'ENG', true, 3, ['perth', 'adelaide', 'hobart'], 'England ODI series', { when: 'pre', fixed: true, dates: ['2026-11-13', '2026-11-15', '2026-11-18'] }),
    mkWB('t20', 'ENG', true, 5, ['mcg', 'carrara', 'gabba', 'scg', 'manuka'], 'England T20I series', { when: 'pre', fixed: true, dates: ['2026-11-21', '2026-11-24', '2026-11-27', '2026-11-29', '2026-12-02'] })];
  W('2026-late').fixture = mkFixture('IND', false, 5, ['wankhede', 'eden', 'chepauk', 'chinnaswamy', 'ahmedabad'], 'Border-Gavaskar Trophy');
  windows.splice(windows.indexOf(W('2026-late')) + 1, 0,
    { key: '2026-anniv', season: 2026, id: 'anniv', label: '150th Anniversary Test', months: 'March', type: 'home', weeks: 2, done: false, noTour: true, wb: [],
      fixture: mkFixture('ENG', true, 1, ['mcg'], '150th Anniversary Test') });
  W('2027-win').fixture = mkFixture('ENG', false, 5, ['lords', 'oval', 'edgbaston', 'headingley', 'oldtrafford'], 'The Ashes');
  const c = { v: 3, team: 'AUS', windows, ptr: 2, players, stats: {}, history: [], match: null, energy: {}, created: Date.now(), news: [], _ver: 0,
    wtc: { cycle: '2025-27', table: {} }, wtcHistory: [], trank: Object.assign({}, RANK_SEED), prank: {}, intl: [], shieldHistory: [{ y: 2025, champ: 'SA' }, { y: 2024, champ: 'SA' }] };
  WTC_TEAMS.forEach(t => { const s = WTC_SEED[t]; c.wtc.table[t] = { p: s[0], w: s[1], l: s[2], d: s[3], pts: s[4] }; });
  NATIONS.forEach(code => c.players[code].forEach(p => {
    if (code === 'AUS' && !TEST_AUS.includes(p.name)) return;
    c.prank[p.name] = { bat: REAL_BAT[p.name] || Math.round(clamp((batRating(p) - 50) * 19, 0, 900)), bowl: REAL_BOWL[p.name] || (p.bowl ? Math.round(clamp((bowlRating(p) - 50) * 21, 0, 900)) : 0), last: 2 };
  }));
  seedWBRanks(c);
  c.captains = { odi: ['Mitchell Marsh', 'Travis Head'], t20: ['Mitchell Marsh', 'Travis Head'] };
  migrate(c);
  c.shield = newShieldSeason(2026);
  c.odc = newODCSeason(2026); newBBLSeason(c, 2026);
  c.odcHistory = [{ y: 2025, champ: 'NSW' }]; c.bblHistory = [{ y: 2025, champ: 'SCO' }];
  news(c, 'Welcome, coach. Australia have just lost 2-1 in South Africa and New Zealand arrive in December. The Shield is four rounds old.', 'big');
  // spring rounds already played (Test squad was in South Africa)
  const touring = new Set(['Pat Cummins', 'Scott Boland', 'Alex Carey', 'Cooper Connolly', 'Cameron Green', 'Josh Hazlewood', 'Travis Head', 'Josh Inglis', 'Matthew Kuhnemann', 'Marnus Labuschagne', 'Nathan Lyon', 'Michael Neser', 'Matthew Renshaw', 'Steve Smith', 'Mitchell Starc', 'Beau Webster', 'Jake Weatherald']);
  [0, 1, 2, 3].forEach(r => simShieldRound(c, r, touring));
  [0, 1, 2].forEach(r => simODCRound(c, r, touring));
  activateWindow(c);
  return c;
}

function news(c, text, type) {
  const w = c.windows[c.ptr];
  c.news.unshift({ when: c.date ? fmtDate(c.date) : w ? `${w.label} ${seasonLabel(w.season)}` : '', text, type: type || '' });
  if (c.news.length > 80) c.news.length = 80;
}
const curWindow = c => c.windows[c.ptr];

// ---------- Recording a match: stats, form, growth, injuries, rankings ----------
function seasonStats(c, comp) { return comp === 'shield' ? c.shield.stats : comp === 'odc' && c.odc ? c.odc.stats : comp === 'bbl' && c.bbl ? c.bbl.stats : null; }
function recordMatch(c, m, comp, opt) {
  opt = opt || {};
  const tests = comp === 'test', lo = !!m.lo, fmt = lo ? m.fmt : 'test', intlLO = comp === 'odi' || comp === 't20i';
  if (!m.innings.length) return;
  const SS = seasonStats(c, comp);
  const sts = name => [statsOf(c, name, comp)].concat(SS ? [SS[name] || (SS[name] = blankStats())] : []);
  const perf = new Map();
  m.teams.forEach((t, ti) => t.players.forEach(p => { sts(p.name).forEach(s => s.m++); perf.set(p.name, { runs: 0, bf: 0, batted: false, wk: 0, balls: 0, br: 0, ti, p }); }));
  const cl = COMP_NAME[comp] || comp;
  m.innings.forEach(inn => {
    if (inn.so) return;
    const bt = m.teams[inn.bat], bw = m.teams[inn.bowl];
    inn.cards.forEach((card, i) => {
      if (card.status === 'dnb') return;
      const name = bt.players[i].name, no = card.status !== 'out';
      sts(name).forEach(s => {
        s.inn++; s.runs += card.runs; s.balls += card.balls; s.fours += card.fours; s.sixes += card.sixes; if (no) s.no++;
        if (card.runs > s.hs || (card.runs === s.hs && no)) { s.hs = card.runs; s.hsNo = no; }
        if (card.runs >= 100) s.h100++; else if (card.runs >= 50) s.h50++;
        if (card.runs === 0 && !no) s.ducks++;
      });
      const s = statsOf(c, name, comp); s.recentBat.push(card.runs + (no ? '*' : '')); if (s.recentBat.length > 8) s.recentBat.shift();
      const pf = perf.get(name); pf.runs += card.runs; pf.bf += card.balls; pf.batted = true;
      if (tests && c.prank) prankBat(c, name, card.runs, no, m.teams[inn.bowl]);
      if (intlLO && c.prankWB) prankLOBat(c, fmt, name, card.runs, card.balls, no);
      const big = lo ? (intlLO ? card.runs >= 100 : card.runs >= (comp === 'bbl' ? 100 : 150)) : card.runs >= 150 || (card.runs >= 100 && (inn.bat === m.user || bt.code === 'AUS' || STATE_CODES.includes(bt.code)));
      if (big) {
        const P = P_(c, name);
        if (P && (P.nat === 'AUS' || (lo ? card.runs >= 150 : card.runs >= 250))) news(c, `${name} ${card.runs}${no ? '*' : ''}${lo ? ` off ${card.balls}` : ''} for ${bt.name} v ${bw.name}${comp !== 'test' ? ` (${cl})` : ''}.`, card.runs >= 200 ? 'big' : '');
      }
    });
    Object.keys(inn.bowling).forEach(i => {
      const f = inn.bowling[i], name = bw.players[i].name;
      sts(name).forEach(s => {
        s.wk += f.wkts; s.bRuns += f.runs; s.bBalls += f.legal; s.mdn += f.maidens;
        if (f.wkts > s.bw || (f.wkts === s.bw && f.runs < s.br)) { s.bw = f.wkts; s.br = f.runs; }
        if (f.wkts >= 5) s.fiveW++;
        if (f.wkts >= 4) s.fourW = (s.fourW || 0) + 1;
      });
      const s = statsOf(c, name, comp); s.recentBowl.push(`${f.wkts}/${f.runs}`); if (s.recentBowl.length > 8) s.recentBowl.shift();
      const pf = perf.get(name); pf.wk += f.wkts; pf.balls += f.legal; pf.br += f.runs;
      if (tests && c.prank && f.legal >= 36) prankBowl(c, name, f.wkts, f.runs, f.legal, bt);
      if (intlLO && c.prankWB && f.legal >= 12) prankLOBowl(c, fmt, name, f.wkts, f.runs, f.legal);
      const bigW = lo ? f.wkts >= (intlLO ? (fmt === 't20' ? 4 : 5) : (fmt === 't20' ? 5 : 6)) : f.wkts >= 6 || (f.wkts >= 5 && (bw.code === 'AUS' || STATE_CODES.includes(bw.code)));
      if (bigW) {
        const P = P_(c, name);
        if (P && (P.nat === 'AUS' || f.wkts >= (lo ? 6 : 8))) news(c, `${name} takes ${f.wkts}/${f.runs} for ${bw.name} v ${bt.name}${comp !== 'test' ? ` (${cl})` : ''}.`);
      }
    });
  });
  m.teams.forEach((t, ti) => Object.keys(m.fstats[ti]).forEach(i => {
    const f = m.fstats[ti][i], name = t.players[i].name;
    sts(name).forEach(s => { s.ct += f.ct; s.st += f.st; s.ro += f.ro; });
  }));
  perf.forEach(pf => { if (pf.wk >= 10) statsOf(c, pf.p.name, comp).tenW++; });
  // development and form for the real (persistent) player objects
  perf.forEach((pf, name) => {
    const P = P_(c, name); if (!P) return;
    const res = m.result.winner === -1 ? 0 : m.result.winner === pf.ti ? 1 : -1;
    if (lo) {
      const level = ({ odi: 0.95, t20i: 0.8, odc: 0.75, bbl: 0.65 }[comp] || 0.7) * (opt.wc ? 1.15 : 1) * (opt.awayTeam === pf.ti && intlLO ? 1.1 : 1);
      developLO(c, P, pf, level, comp);
      moraleAdd(P, (P._lastMain || 0) * 1.5 + res * (intlLO ? 1 : 0.5));
      return;
    }
    const level = comp === 'shield' ? 0.85 : opt.final ? 1.3 : (opt.awayTeam === pf.ti ? 1.25 : 1.0);
    develop(c, P, pf, level, comp);
    moraleAdd(P, (P._lastMain || 0) * 3 + res * (comp === 'test' ? 2 : 1));
    if (tests && c.prank && c.prank[name]) c.prank[name].last = c.ptr; else if (tests) c.prank[name] = { bat: 300, bowl: P.bowl ? 250 : 0, last: c.ptr };
  });
  // injuries
  m.injuries.forEach(inj => {
    const P = P_(c, inj.name); if (!P) return;
    const wk = inj.what.includes('back') ? rint(6, 14) : inj.what.includes('side') ? rint(4, 8) : rint(2, 6);
    P.injury = { what: inj.what.replace(/^an? /, ''), weeks: wk };
    if (P.nat === 'AUS') news(c, `Injury: ${P.name} (${P.state || 'AUS'}) is out for about ${wk} weeks with ${inj.what}.`, 'bad');
  });
  if (lo) { if (intlLO && c.trankWB) loTeamResult(c, m, fmt); bump(c); return; }
  // fatigue carried to the next match of a series
  m.teams.forEach(t => t.players.forEach(p => {
    let balls = 0; m.innings.forEach(inn => { if (m.teams[inn.bowl] === t && inn.bowling[p.idx]) balls += inn.bowling[p.idx].legal; });
    c.energy[p.name] = clamp(100 - Math.max(0, balls / 6 - 20) * 0.9, 65, 100);
  }));
  if (tests) testResult(c, m, opt);
  bump(c);
}

// ---------- Development ----------
function ageRate(a) { return a <= 19 ? 1 : a <= 21 ? 0.9 : a <= 23 ? 0.75 : a <= 25 ? 0.55 : a <= 27 ? 0.35 : a <= 29 ? 0.18 : 0.05; }
function addAttr(p, which, amt) {
  const up = (o, k, a) => { o[k] = clamp(Math.round((o[k] + a) * 10) / 10, 1, 99); };
  if (which === 'bat') { ['tech', 'conc', 'vPace', 'vSpin', 'off', 'on'].forEach(k => up(p.bat, k, amt * rand(0.6, 1.4))); ['power', 'finish'].forEach(k => p.bat[k] != null && up(p.bat, k, amt * rand(0.3, 0.8))); }
  if (which === 'wbbat') { ['power', 'finish'].forEach(k => up(p.bat, k, amt * rand(0.7, 1.4))); ['vPace', 'vSpin', 'off', 'on'].forEach(k => up(p.bat, k, amt * rand(0.1, 0.4))); }
  if (which === 'wbbowl' && p.bowl) { ['death', 'vars'].forEach(k => up(p.bowl, k, amt * rand(0.7, 1.4))); ['skill', 'acc'].forEach(k => up(p.bowl, k, amt * rand(0.1, 0.4))); }
  if (which === 'bowl' && p.bowl) {
    ['skill', 'acc'].forEach(k => up(p.bowl, k, amt * rand(0.7, 1.3)));
    (isPace(p.bowl.type) ? ['swing', 'seam'] : ['turn', 'flight']).forEach(k => up(p.bowl, k, amt * rand(0.6, 1.4)));
    up(p.bowl, 'stam', amt * (p.age < 24 ? 0.6 : 0.1));
    ['death', 'vars'].forEach(k => p.bowl[k] != null && up(p.bowl, k, amt * rand(0.3, 0.8)));
  }
  if (which === 'keep' && p.keep) p.keep = clamp(p.keep + amt, 1, 99);
  if (which === 'field') { up(p, 'field', amt); up(p, 'ground', amt); }
}
function develop(c, P, pf, level, comp) {
  const br = batRating(P), bo = bowlRating(P);
  const E = Math.max(8, (br - 40) * 0.85);
  const perfBat = pf.batted ? clamp((pf.runs - E) / Math.max(E, 15), -1, 2) : 0;
  const bowled = pf.balls >= 48;
  const Ew = Math.max(1, (bo - 55) * 0.12);
  const perfBowl = bowled ? clamp((pf.wk - Ew) / Math.max(Ew, 1.5), -1, 2) : 0;
  const gap = clamp((potential(P) - overallRaw(P)) / 6, 0, 1.5);
  const base = ageRate(P.age) * level * gap * 0.24 * (0.85 + ((P.morale != null ? P.morale : 65) - 50) / 200);
  const shareBat = P.role === 'BOWL' ? 0.12 : P.role === 'AR' ? 0.55 : 1;
  const shareBowl = P.role === 'BOWL' ? 1 : P.role === 'AR' ? 0.55 : 0.1;
  if (base > 0) {
    if (pf.batted) addAttr(P, 'bat', base * shareBat * (1 + 0.6 * perfBat));
    if (P.bowl && bowled) addAttr(P, 'bowl', base * shareBowl * (1 + 0.6 * perfBowl));
    else if (P.bowl && P.role === 'BOWL') addAttr(P, 'bowl', base * 0.4);
    if (P.role === 'WK') addAttr(P, 'keep', base * 0.5);
    addAttr(P, 'field', base * 0.15);
  }
  const main = P.role === 'BOWL' ? perfBowl : P.role === 'AR' ? (perfBat + perfBowl) / 2 : perfBat;
  P.form = clamp((P.form || 0) * 0.6 + main * 2.6, -10, 10);
  P.sp = P.sp || { n: 0, sum: 0 }; P.sp.n++; P.sp.sum += main;
  P._lastMain = main;
  // breakthrough performances lift young players' potential
  if (P.age <= 24 && potential(P) < 97 && ((pf.runs >= 100 && comp === 'test') || (pf.wk >= 8 && comp === 'test') || (pf.runs >= 180 && Math.random() < 0.5) || (pf.wk >= 9 && Math.random() < 0.5))) {
    P.potRaw = Math.min(97, potential(P) + 1);
    if (P.nat === 'AUS') news(c, `${P.name}'s potential rises to ${P.potRaw} after a breakthrough match.`, 'good');
  }
}
function developLO(c, P, pf, level, comp) {
  const fmt = comp === 'odi' || comp === 'odc' ? 'odi' : 't20', t20 = fmt === 't20';
  const br = wbBat(P, fmt), bo = wbBowl(P, fmt);
  const E = Math.max(6, (br - 40) * (t20 ? 0.45 : 0.75));
  const sr = pf.bf ? pf.runs / pf.bf * 100 : 0, srPar = t20 ? 135 : 88;
  const perfBat = pf.batted ? clamp((pf.runs - E) / Math.max(E, 12) + (pf.bf >= 8 ? (sr - srPar) / (t20 ? 120 : 160) : 0), -1, 2) : 0;
  const bowled = pf.balls >= (t20 ? 12 : 30);
  const Ew = Math.max(0.6, (bo - 55) * (t20 ? 0.05 : 0.07));
  const econ = pf.balls ? pf.br / pf.balls * 6 : 0, ePar = t20 ? 8.3 : 5.6;
  const perfBowl = bowled ? clamp((pf.wk - Ew) / Math.max(Ew, 1) + (ePar - econ) / (t20 ? 3 : 2.2), -1, 2) : 0;
  const gap = clamp((potential(P) - overallRaw(P)) / 6, 0, 1.5);
  const base = ageRate(P.age) * level * gap * 0.2 * (0.85 + ((P.morale != null ? P.morale : 65) - 50) / 200);
  const shareBat = P.role === 'BOWL' ? 0.15 : P.role === 'AR' ? 0.55 : 1, shareBowl = P.role === 'BOWL' ? 1 : P.role === 'AR' ? 0.55 : 0.1;
  if (base > 0) {
    if (pf.batted) { addAttr(P, 'bat', base * shareBat * 0.5 * (1 + 0.5 * perfBat)); addAttr(P, 'wbbat', base * shareBat * (1 + 0.6 * perfBat)); }
    if (P.bowl && bowled) { addAttr(P, 'bowl', base * shareBowl * 0.5 * (1 + 0.5 * perfBowl)); addAttr(P, 'wbbowl', base * shareBowl * (1 + 0.6 * perfBowl)); }
    if (P.role === 'WK') addAttr(P, 'keep', base * 0.3);
    addAttr(P, 'field', base * 0.25);
  }
  const main = P.role === 'BOWL' ? perfBowl : P.role === 'AR' ? (perfBat + perfBowl) / 2 : perfBat;
  P.form = clamp((P.form || 0) * 0.75 + main * 1.6, -10, 10);
  P.sp = P.sp || { n: 0, sum: 0 }; P.sp.n += 0.6; P.sp.sum += main * 0.6;
  P._lastMain = main;
  const intl = comp === 'odi' || comp === 't20i';
  if (P.age <= 23 && potential(P) < 97 && ((intl && (pf.runs >= (t20 ? 75 : 110) || pf.wk >= (t20 ? 4 : 5))) || (pf.runs >= (t20 ? 100 : 150) && Math.random() < 0.4)) && Math.random() < 0.6) {
    P.potRaw = Math.min(97, potential(P) + 1);
    if (P.nat === 'AUS') news(c, `${P.name}'s potential rises to ${P.potRaw} after a big ${COMP_NAME[comp]} performance.`, 'good');
  }
}
function touringGrowth(c, P) { // in the touring squad but not playing
  const gap = clamp((potential(P) - overallRaw(P)) / 6, 0, 1.5);
  const amt = ageRate(P.age) * gap * 0.32 * 0.3;
  if (amt > 0) addAttr(P, P.role === 'BOWL' ? 'bowl' : 'bat', amt);
}

// ---------- Rankings ----------
function prankBat(c, name, runs, no, oppTeam) {
  const r = c.prank[name] || (c.prank[name] = { bat: 300, bowl: 0, last: c.ptr });
  const opp = oppTeam.players.filter(p => p.bowl && p.bowl.skill >= 68).map(bowlRating);
  const of = clamp(Math.pow((opp.length ? opp.reduce((a, b) => a + b, 0) / opp.length : 75) / 82, 2), 0.6, 1.15);
  r.bat = Math.round(r.bat * 0.92 + clamp(runs * 15 * of + (no ? 40 : 0), 0, 1500) * 0.08);
}
function prankBowl(c, name, w, runs, balls, batTeam) {
  const r = c.prank[name] || (c.prank[name] = { bat: 0, bowl: 300, last: c.ptr });
  const econ = runs / balls * 6;
  const top = batTeam.players.map(batRating).sort((a, b) => b - a).slice(0, 7);
  const of = clamp(Math.pow(top.reduce((a, b) => a + b, 0) / top.length / 80, 2), 0.6, 1.15);
  r.bowl = Math.round(r.bowl * 0.92 + clamp((w * 200 + 250 + clamp((3.4 - econ) * 60, -120, 120)) * of, 0, 1500) * 0.08);
}
function teamRankUpdate(c, home, away, res, neutral) {
  const Ra = c.trank[home] || 50, Rb = c.trank[away] || 50;
  const E = 1 / (1 + Math.pow(10, -((Ra - Rb + (neutral ? 0 : 6)) / 25)));
  const S = res === home ? 1 : res === away ? 0 : 0.5;
  c.trank[home] = Math.round((Ra + 4 * (S - E)) * 10) / 10;
  c.trank[away] = Math.round((Rb - 4 * (S - E)) * 10) / 10;
}
function testResult(c, m, opt) {
  const h = m.teams[0].code, a = m.teams[1].code;
  const res = m.result.winner === -1 ? (m.result.text.includes('tied') ? 'tie' : null) : m.teams[m.result.winner].code;
  teamRankUpdate(c, h, a, res, m.neutral);
  if (!opt.final && WTC_TEAMS.includes(h) && WTC_TEAMS.includes(a)) [h, a].forEach(t => {
    const row = c.wtc.table[t] || (c.wtc.table[t] = { p: 0, w: 0, l: 0, d: 0, pts: 0 });
    row.p++;
    if (res === 'tie') { row.d++; row.pts += 6; } else if (!res) { row.d++; row.pts += 4; } else if (res === t) { row.w++; row.pts += 12; } else row.l++;
  });
}
const pct = r => r.p ? r.pts / (r.p * 12) * 100 : 0;
function wtcSorted(c) { return Object.entries(c.wtc.table).map(([t, r]) => Object.assign({ t, pct: pct(r) }, r)).sort((x, y) => y.pct - x.pct); }

// ---------- Sheffield Shield ----------
function newShieldSeason(y) {
  const flip = (y - 2026) % 2 === 1;
  const ladder = {}; STATE_CODES.forEach(s => { ladder[s] = { p: 0, w: 0, l: 0, d: 0, pts: 0 }; });
  return { y, rounds: SHIELD_FIXTURE.map(r => r.map(([h, a]) => flip ? [a, h] : [h, a])), played: [], results: [], ladder, stats: {}, final: null, champ: null };
}
function shieldStat(c, name) { return c.shield.stats[name] || (c.shield.stats[name] = blankStats()); }
const statePool = (c, s) => c.players.AUS.filter(p => p.state === s);
const STATE_TEAMS = () => { const o = {}; STATE_CODES.forEach(s => { o[s] = { name: STATES[s].name, short: s, squad: [] }; }); return o; };

function playShieldMatch(c, home, away, unavailable, final) {
  const venueKey = STATES[home].home, venue = VENUES[venueKey];
  const pickXI = s => {
    const pool = statePool(c, s).filter(p => !p.wbOnly && !(unavailable && unavailable.has(p.name)));
    return autoXI(pool, venue, null, true).map(n => P_(c, n));
  };
  const m = createMatch({ home, away, venue, venueKey, xi: { [home]: pickXI(home), [away]: pickXI(away) }, userTeam: 'none', TEAMS: STATE_TEAMS(),
    labels: { [home]: STATES[home].name, [away]: STATES[away].name }, days: final ? 5 : 4, overs: 96, quiet: true, comp: 'shield' });
  simQuick(m);
  recordMatch(c, m, 'shield', {});
  return m;
}
function matchSummary(m) {
  const sc = m.teams.map((t, ti) => `${t.short} ${m.innings.filter(i => i.bat === ti).map(i => scoreLine(i)).join(' & ')}`).join(', ');
  let bb = null, bw = null;
  m.innings.forEach(inn => {
    inn.cards.forEach((cd, i) => { if (!bb || cd.runs > bb.r) bb = { r: cd.runs, n: m.teams[inn.bat].players[i].name, no: cd.status !== 'out' }; });
    Object.keys(inn.bowling).forEach(i => { const f = inn.bowling[i]; if (!bw || f.wkts > bw.w || (f.wkts === bw.w && f.runs < bw.r)) bw = { w: f.wkts, r: f.runs, n: m.teams[inn.bowl].players[i].name }; });
  });
  return { sc, top: [bb ? `${bb.n} ${bb.r}${bb.no ? '*' : ''}` : '', bw ? `${bw.n} ${bw.w}/${bw.r}` : ''].filter(Boolean) };
}
function simShieldRound(c, r, unavailable) {
  const sh = c.shield;
  if (sh.played.includes(r)) return;
  sh.rounds[r].forEach(([h, a]) => {
    const m = playShieldMatch(c, h, a, unavailable, false);
    const win = m.result.winner === -1 ? null : m.teams[m.result.winner].short;
    [h, a].forEach((s, ti) => {
      const L = sh.ladder[s]; L.p++;
      if (!win) { L.d++; L.pts += 1; } else if (win === s) { L.w++; L.pts += 6; } else L.l++;
      const fi = m.innings.find(i => i.bat === ti), oi = m.innings.find(i => i.bat === 1 - ti);
      if (fi) L.pts += clamp((fi.runs - 200) * 0.01, 0, 1.5);
      if (oi) L.pts += clamp((oi.wkts - 5) * 0.1, 0, 0.5);
      L.pts = Math.round(L.pts * 100) / 100;
    });
    sh.results.push(Object.assign({ round: r + 1, home: h, away: a, text: m.result.text }, matchSummary(m)));
  });
  sh.played.push(r);
  passWeeks(c, 1.5);
}
function shieldLadder(c) { return Object.entries(c.shield.ladder).map(([s, L]) => Object.assign({ s }, L)).sort((a, b) => b.pts - a.pts); }
function simShieldFinal(c, unavailable) {
  const sh = c.shield; if (sh.champ) return;
  const [a, b] = shieldLadder(c);
  const m = playShieldMatch(c, a.s, b.s, unavailable, true);
  const win = m.result.winner === -1 ? a.s : m.teams[m.result.winner].short;
  sh.final = Object.assign({ home: a.s, away: b.s, text: m.result.winner === -1 ? `Match drawn, ${STATES[a.s].name} win the Shield (top of the ladder)` : m.result.text }, matchSummary(m));
  sh.champ = win;
  news(c, `${STATES[win].name} win the Sheffield Shield! ${sh.final.text}.`, 'big');
}

// ---------- Background internationals ----------
function simTest(c, home, away, venueKey, opt) {
  opt = opt || {};
  const venue = VENUES[venueKey];
  const sq = code => autoSquad(c.players[code], 15).sort((x, y) => c.players[code].indexOf(x) - c.players[code].indexOf(y));
  const xiOf = code => autoXI(sq(code), venue, c.energy).map(n => P_(c, n));
  const m = createMatch({ home, away, venue, venueKey, xi: { [home]: xiOf(home), [away]: xiOf(away) }, userTeam: 'none', TEAMS, quiet: true, neutral: !!opt.neutral, comp: 'test' });
  simQuick(m);
  recordMatch(c, m, 'test', { awayTeam: 1, final: opt.final });
  return m;
}
function simSeries(c, home, away, n) {
  c.energy = {};
  const vs = venuesOf(home), res = { home, away, n, w: { [home]: 0, [away]: 0 }, d: 0 };
  for (let i = 0; i < n; i++) {
    const m = simTest(c, home, away, vs[(i + rint(0, 9)) % vs.length]);
    if (m.result.winner === -1) res.d++; else res.w[m.teams[m.result.winner].code]++;
  }
  c.energy = {};
  const hw = res.w[home], aw = res.w[away];
  res.text = hw > aw ? `${TEAMS[home].name} beat ${TEAMS[away].name} ${hw}-${aw}` : aw > hw ? `${TEAMS[away].name} won ${aw}-${hw} in ${TEAMS[home].name}` : `${TEAMS[home].name} v ${TEAMS[away].name} drawn ${hw}-${aw}`;
  return res;
}
const PRESET_BG = { '2026-sum': [['NZ', 'IND', 2], ['PAK', 'SL', 2]] };
function backgroundTests(c, w) {
  if (w.id === 'wtcf' || w.id === 'anniv') return;
  const busy = new Set(['AUS']); if (w.fixture) busy.add(w.fixture.opp);
  const series = [];
  (PRESET_BG[w.key] || []).forEach(([h, a, n]) => { series.push([h, a, n]); busy.add(h); busy.add(a); });
  const free = shuffle(NATIONS.filter(n => !busy.has(n)));
  while (free.length >= 2) {
    const a = free.pop(), b = free.pop();
    const strong = WTC_TEAMS.includes(a) && WTC_TEAMS.includes(b);
    const home = Math.random() < 0.5 ? a : b;
    series.push([home, home === a ? b : a, strong ? rint(2, 3) : 2]);
  }
  series.forEach(([h, a, n]) => {
    const r = simSeries(c, h, a, n);
    c.intl.unshift({ when: `${w.label} ${seasonLabel(w.season)}`, text: r.text, tests: n });
  });
  if (c.intl.length > 60) c.intl.length = 60;
  if (series.length) news(c, `Around the world: ${series.length} other Test series were played. Check Rankings.`);
}

// ---------- Time ----------
function passWeeks(c, wk) {
  NATIONS.forEach(code => c.players[code].forEach(p => {
    if (p.injury) { p.injury.weeks -= wk; if (p.injury.weeks <= 0) { p.injury = null; if (p.nat === 'AUS' && overall(p) >= 74) news(c, `${p.name} is fit again.`, 'good'); } }
  }));
}
function randomInjuries(c, weeks) {
  NATIONS.forEach(code => c.players[code].forEach(p => {
    if (p.injury || p.retired) return;
    const pace = p.bowl && isPace(p.bowl.type);
    if (Math.random() < weeks * 0.0018 * (pace ? 1.6 : 0.8) * (p.prone || 1)) {
      const what = pick(pace ? ['back stress', 'side strain', 'hamstring strain', 'ankle injury'] : ['hamstring strain', 'broken finger', 'calf strain']);
      p.injury = { what, weeks: what.includes('back') ? rint(6, 16) : rint(2, 7) };
      if (p.nat === 'AUS' && overall(p) >= 72) news(c, `Injury: ${p.name} has a ${what}, out for about ${Math.round(p.injury.weeks)} weeks.`, 'bad');
    }
  }));
}

function activateWindow(c) {
  const w = curWindow(c); if (!w) return;
  if (!w.wb) w.wb = [];
  if (w.event && !w.wcMade) { w.wcMade = true; w.wb.push(makeWC(c, w)); news(c, `The ${w.event.name} is next, hosted by ${w.event.host.map(h => TEAMS[h].name).join(' and ')}. Name your squad.`, 'big'); }
  if (w.wb.length) scheduleWindow(w);
  c.date = isoD(addDays(windowFirstDate(w), -10));
  const slot = SHIELD_SLOTS[w.id];
  if (slot && slot.pre.length) {
    slot.pre.forEach(r => simShieldRound(c, r, null));
    news(c, `Sheffield Shield rounds ${slot.pre.map(r => r + 1).join(' and ')} played. ${STATES[shieldLadder(c)[0].s].name} lead the ladder.`);
  }
  const os = ODC_SLOTS[w.id];
  if (os && c.odc && os.pre.length) { os.pre.forEach(r => simODCRound(c, r, null)); news(c, `One-Day Cup round${os.pre.length > 1 ? 's' : ''} ${os.pre.map(r => r + 1).join(' and ')} played. ${STATES[ladderSorted(c.odc.ladder)[0].s].name} top the table.`); }
  const bs = BBL_SLOTS[w.id];
  if (bs && c.bbl && bs.pre.length) { bs.pre.forEach(r => simBBLRound(c, r, null)); news(c, `The Big Bash is under way: ${BBL_CLUBS[ladderSorted(c.bbl.ladder)[0].s].name} lead after ${bs.pre.length} rounds.`); }
  if (w.id === 'wtcf') {
    const [a, b] = wtcSorted(c);
    if (a.t === 'AUS' || b.t === 'AUS') {
      const opp = a.t === 'AUS' ? b.t : a.t;
      w.fixture = mkFixture(opp, true, 1, ['lords'], `World Test Championship Final ${c.wtc.cycle}`, { neutral: true, final: true });
      news(c, `Australia are in the World Test Championship Final! They meet ${TEAMS[opp].name} at Lord's.`, 'big');
    } else {
      const m = simTest(c, a.t, b.t, 'lords', { neutral: true, final: true });
      const champ = m.result.winner === -1 ? `${TEAMS[a.t].name} and ${TEAMS[b.t].name} share the title` : `${m.teams[m.result.winner].name} are World Test Champions`;
      c.wtcHistory.unshift({ cycle: c.wtc.cycle, text: `${champ} (${m.result.text})` });
      w.past = `${champ}. ${m.result.text}.`;
      news(c, `WTC Final at Lord's: ${champ}. ${m.result.text}.`, 'big');
      newWtcCycle(c);
    }
  }
}
function newWtcCycle(c) {
  const y = parseInt(c.wtc.cycle.slice(0, 4), 10) + 2;
  c.wtc = { cycle: `${y}-${String(y + 2).slice(2)}`, table: {} };
  WTC_TEAMS.forEach(t => { c.wtc.table[t] = { p: 0, w: 0, l: 0, d: 0, pts: 0 }; });
}
function finishWtcFinal(c, f) {
  const r = f.results[0];
  const champ = r.winner ? `${TEAMS[r.winner].name} are World Test Champions` : `Australia and ${TEAMS[f.opp].name} share the title`;
  c.wtcHistory.unshift({ cycle: c.wtc.cycle, text: `${champ} (${r.text})` });
  news(c, `${champ}!`, 'big');
  newWtcCycle(c);
}

function advanceWindow(c) {
  const w = curWindow(c), f = w.fixture;
  if (f && f.final && f.status === 'done') finishWtcFinal(c, f);
  const slot = SHIELD_SLOTS[w.id];
  const away = windowSquads(c, w);
  if (slot && slot.during.length) slot.during.forEach(r => { if (r === 'final') simShieldFinal(c, away); else simShieldRound(c, r, away); });
  const os = ODC_SLOTS[w.id];
  if (os && c.odc) os.during.forEach(r => { if (r === 'final') simODCFinal(c, away); else simODCRound(c, r, away); });
  const bs = BBL_SLOTS[w.id];
  if (bs && c.bbl && bs.mid && !w.bblMid) { w.bblMid = true; bs.mid.forEach(r => simBBLRound(c, r, away)); }
  if (bs && c.bbl) bs.during.forEach(r => { if (r === 'finals') simBBLFinals(c, away); else simBBLRound(c, r, away); });
  backgroundTests(c, w);
  backgroundWB(c, w);
  randomInjuries(c, w.weeks || 8);
  const wbN = (w.wb || []).reduce((a, x) => a + (x.tests || 0), 0);
  passWeeks(c, Math.max(2, (w.weeks || 8) - (f ? f.tests : 0) - wbN * 0.4 - (slot ? slot.pre.length + slot.during.length : 0) * 1.5));
  w.done = true;
  c.ptr++;
  const next = c.windows[c.ptr];
  if (next && next.season !== w.season) seasonEnd(c, w.season);
  const last = c.windows[c.windows.length - 1].season;
  if (c.windows[c.ptr] && c.windows[c.ptr].season >= last) c.windows.push(...makeSeason(last + 1));
  c.energy = {};
  bump(c);
  activateWindow(c);
  goatCheck(c);
}

// ---------- Season end: ageing, decline, potential, retirements, regens, intake ----------
function declineStart(p) { if (p.role === 'WK') return 33; if (!p.bowl || p.role === 'BAT') return 34; return isPace(p.bowl.type) ? 32 : 35; }
function seasonEnd(c, y) {
  const report = { retired: [], improved: [], wonderkids: [] };
  NATIONS.forEach(code => c.players[code].forEach(p => {
    const o0 = overallRaw(p);
    // training growth: everyone young keeps developing, more if they barely played
    const gap = clamp((potential(p) - o0) / 6, 0, 1.5);
    const played = p.sp ? p.sp.n : 0;
    const train = ageRate(p.age) * gap * (played < 4 ? 2.4 : 1.0);
    if (train > 0) { addAttr(p, p.role === 'BOWL' ? 'bowl' : 'bat', train); if (p.role === 'AR') addAttr(p, 'bowl', train * 0.8); if (p.role === 'WK') addAttr(p, 'keep', train * 0.5); }
    // potential review for young players
    if (p.age <= 25 && p.sp) {
      const avg = p.sp.n ? p.sp.sum / p.sp.n : 0;
      if (p.sp.n >= 4 && avg > 0.5) p.potRaw = Math.min(97, potential(p) + (avg > 1 ? 2 : 1));
      else if (p.sp.n >= 4 && avg < -0.4) p.potRaw = Math.max(overall(p), potential(p) - 1);
      else if (p.sp.n === 0 && p.age >= 21 && Math.random() < 0.35) p.potRaw = Math.max(overall(p), potential(p) - 1);
    }
    p.age++;
    const st = declineStart(p);
    if (p.age > st) {
      const dec = 0.5 + 0.3 * (p.age - st);
      const down = (o, k, a) => { if (o && o[k] != null) o[k] = clamp(Math.round((o[k] - a) * 10) / 10, 1, 99); };
      ['tech', 'conc', 'off', 'on', 'vSpin'].forEach(k => down(p.bat, k, dec * rand(0.5, 1.1)));
      down(p.bat, 'vPace', dec * rand(0.9, 1.4));
      if (p.bowl) { down(p.bowl, 'skill', dec * rand(0.7, 1.2)); down(p.bowl, 'acc', dec * 0.4); down(p.bowl, 'stam', dec * (isPace(p.bowl.type) ? 1.6 : 0.6)); ['swing', 'seam', 'turn', 'flight'].forEach(k => down(p.bowl, k, dec * 0.5)); }
      down(p.bat, 'power', dec * rand(0.6, 1.2)); down(p.bat, 'finish', dec * rand(0.2, 0.6));
      if (p.bowl) { down(p.bowl, 'death', dec * 0.4); down(p.bowl, 'vars', dec * 0.15); }
      down(p, 'field', dec * 0.8); down(p, 'ground', dec);
      if (p.keep) p.keep = clamp(p.keep - dec * 0.6, 1, 99);
    }
    if (p.age >= 28) p.potRaw = Math.max(overall(p), Math.min(potential(p), overall(p) + Math.max(0, 31 - p.age)));
    p.peak = Math.max(p.peak || 0, overall(p));
    p.peakWB = Math.max(p.peakWB || 0, wbOverall(p, 'odi'), wbOverall(p, 't20'));
    p.hist = (p.hist || []).concat([{ y: y + 1, o: overall(p), p: potential(p) }]).slice(-12);
    const d = overallRaw(p) - o0;
    if (code === 'AUS' && d >= 3) report.improved.push([p.name, Math.round(d)]);
    p.sp = { n: 0, sum: 0 };
  }));
  // retirements and regens
  NATIONS.forEach(code => {
    const list = c.players[code];
    list.slice().forEach(p => {
      const o = overall(p);
      const base = p.age <= 31 ? 0 : [0.02, 0.04, 0.07, 0.11, 0.16, 0.24, 0.33, 0.45][Math.min(7, p.age - 32)] || 0.6;
      let pr = base * (o >= 85 ? 0.5 : o < 70 ? 1.5 : 1) + (p.age >= 41 ? 0.4 : 0);
      if (p.age >= 27 && o < 58 && potential(p) < 64) pr = 0.6;
      if (code === 'AUS' && (p.morale || 65) < 30 && p.age >= 31 && !(c.contracts || []).includes(p.name)) pr += 0.25;
      if (Math.random() < pr) {
        list.splice(list.indexOf(p), 1);
        p.retired = true;
        retireSnapshot(c, p);
        if (c.captain === p.name) { c.captain = null; news(c, `Your captain ${p.name} has retired. Name a new captain on the Board screen.`, 'bad'); }
        if (o >= 72 || (p.peak || 0) >= 80) report.retired.push(`${p.name} (${code}, ${p.age})`);
        if ((p.peak || 0) >= 72 || Math.random() < 0.5) {
          const r = makeRegen(c, code, p);
          list.push(r);
          if (potential(r) >= 87) report.wonderkids.push(`${r.name} (${code}${r.state ? ' ' + r.state : ''}, POT ${potential(r)}, regen of ${p.name})`);
        }
      }
    });
  });
  NATIONS.forEach(code => c.players[code].forEach(p => { p.morale = Math.round((p.morale != null ? p.morale : 65) * 0.7 + 65 * 0.3); if (p.lead == null) p.lead = defaultLead(p); }));
  c.contractRound = true;
  // youth intake
  STATE_CODES.forEach(s => { for (let i = 0; i < 2; i++) { const r = makeRegen(c, 'AUS', null, s); c.players.AUS.push(r); if (potential(r) >= 87) report.wonderkids.push(`${r.name} (AUS ${s}, POT ${potential(r)})`); } });
  NATIONS.filter(n => n !== 'AUS').forEach(code => { const k = c.players[code].length < 18 ? 2 : 1; for (let i = 0; i < k; i++) c.players[code].push(makeRegen(c, code, null)); });
  // trim lists
  STATE_CODES.forEach(s => {
    const sq = statePool(c, s);
    if (sq.length > 28) sq.sort((a, b) => (overall(a) + potential(a) * 0.5) - (overall(b) + potential(b) * 0.5)).slice(0, sq.length - 28).forEach(p => { c.players.AUS.splice(c.players.AUS.indexOf(p), 1); });
  });
  NATIONS.filter(n => n !== 'AUS').forEach(code => {
    const l = c.players[code];
    if (l.length > 24) l.sort((a, b) => (overall(b) + potential(b) * 0.4) - (overall(a) + potential(a) * 0.4)).length = 24;
  });
  // Shield history and new season
  if (c.shield) c.shieldHistory.unshift({ y, champ: c.shield.champ || shieldLadder(c)[0].s });
  c.shield = newShieldSeason(y + 1);
  pruneSave(c);
  if (c.odc) { c.odcHistory = c.odcHistory || []; c.odcHistory.unshift({ y, champ: c.odc.champ || ladderSorted(c.odc.ladder)[0].s }); c.odc = newODCSeason(y + 1); }
  if (c.bbl) { c.bblHistory = c.bblHistory || []; c.bblHistory.unshift({ y, champ: c.bbl.champ || ladderSorted(c.bbl.ladder)[0].s }); bump(c); newBBLSeason(c, y + 1); }
  bump(c);
  if (report.retired.length) news(c, `Retirements: ${report.retired.join(', ')}.`, 'big');
  if (report.wonderkids.length) news(c, `New talent: ${report.wonderkids.join(', ')}.`, 'good');
  report.improved.sort((a, b) => b[1] - a[1]);
  if (report.improved.length) news(c, `Most improved Australians this season: ${report.improved.slice(0, 6).map(([n, d]) => `${n} (+${d})`).join(', ')}.`, 'good');
  news(c, `Season ${seasonLabel(y + 1)} begins. Everyone is a year older. Contract renewals are due: review them on the Board screen.`, 'big');
  c.lastReport = report;
}

function makeRegen(c, nat, tmpl, state) {
  const names = NAMES[nat] || NAMES.AUS;
  let name, g = 0;
  do { name = `${pick(names[0])} ${pick(names[1])}`; g++; } while (P_(c, name) && g < 50);
  if (P_(c, name)) name += ' Jr';
  const age = rint(17, 19);
  let pot, role, hand, agg, bowl = null, tilt = rint(-2, 2), opener = false, prone = 1;
  let wbT = null;
  if (tmpl) {
    const pkT = tmpl.peak || potential(tmpl), pkW = tmpl.peakWB || 0;
    if (pkW > pkT + 2) wbT = pkW;
    const pk = Math.max(pkT, pkW);
    pot = Math.min(97, pk >= 85 ? pk + rint(-1, 2) : pk + rint(-3, 3));
    role = tmpl.role; hand = tmpl.hand; agg = clamp(tmpl.bat.agg + rint(-6, 6), 30, 98); opener = OPENERS.has(tmpl.name) || !!tmpl.opener;
    if (tmpl.bowl) bowl = tmpl.bowl.type;
  } else {
    role = pickW(['BAT', 'BOWL', 'BOWL', 'AR', 'WK'], [35, 30, 12, 13, 10]);
    hand = Math.random() < 0.3 ? 'L' : 'R'; agg = rint(40, 90); opener = role === 'BAT' && Math.random() < 0.35;
    const roll = Math.random();
    pot = roll < 0.012 ? rint(92, 95) : roll < 0.12 ? rint(84, 90) : rint(66, 82);
  }
  if (role === 'BOWL' && !bowl) bowl = pickW(['RF', 'RFM', 'LFM', 'OB', 'LB', 'SLA'], [20, 30, 10, 14, 10, 16]);
  if (role === 'AR' && !bowl) bowl = pickW(['RFM', 'RM', 'OB', 'SLA'], [40, 15, 25, 20]);
  const start = clamp(48 + rint(0, 9) + (pot - 75) * 0.25, 44, 68);
  const batL = role === 'BOWL' ? rint(25, 45) : role === 'AR' ? start - 2 : role === 'WK' ? start - 1 : start;
  const bowlL = role === 'BOWL' ? start + 1 : start - 3;
  const x = { h: hand, st: state || (tmpl && tmpl.state) || null, keep: role === 'WK' ? start + 6 : 0 };
  const p = Q(name, age, role, batL, agg, tilt, bowl && (role === 'BOWL' || role === 'AR' || Math.random() < 0.3) ? `${bowl} ${role === 'BOWL' || role === 'AR' ? bowlL : rint(30, 45)}` : null, pot, x);
  p.nat = nat; p.potRaw = Math.max(pot, overall(p)); p.regen = true; p.opener = opener; p.morale = 70; p.lead = defaultLead(p);
  wbInit(p);
  if (tmpl && tmpl.bat.power != null) {
    const dT = wbDefaults(tmpl), dP = wbDefaults(p);
    p.bat.power = clamp(Math.round(dP.power + (tmpl.bat.power - dT.power) * 0.8), 20, 97); p.bat.finish = clamp(Math.round(dP.finish + (tmpl.bat.finish - dT.finish) * 0.8), 20, 95);
    if (p.bowl && tmpl.bowl && tmpl.bowl.death != null) { p.bowl.death = clamp(Math.round(dP.death + (tmpl.bowl.death - dT.death) * 0.8), 20, 95); p.bowl.vars = clamp(Math.round(dP.vars + (tmpl.bowl.vars - dT.vars) * 0.8), 20, 95); }
  }
  if (tmpl && tmpl.wbo) p.wbo = { odi: { bat: tmpl.wbo.odi.bat * 0.6, bowl: tmpl.wbo.odi.bowl * 0.6 }, t20: { bat: tmpl.wbo.t20.bat * 0.6, bowl: tmpl.wbo.t20.bowl * 0.6 } };
  if (wbT) { const best = Math.max(wbOverall(p, 'odi'), wbOverall(p, 't20')); p.potRaw = Math.max(overall(p), overall(p) + Math.max(0, pot - best)); }
  p.peak = potential(p); p.peakWB = Math.max(wbOverall(p, 'odi'), wbOverall(p, 't20'));
  if (nat === 'AUS' && !p.state) p.state = pick(STATE_CODES);
  p.hist = [{ y: curWindow(c) ? curWindow(c).season + 1 : 2027, o: overall(p), p: potential(p) }]; p.sp = { n: 0, sum: 0 };
  return p;
}

// ---------- User matches ----------
function playerOfMatch(m) {
  let best = null, bs = -1;
  m.teams.forEach((t, ti) => t.players.forEach(p => {
    let s = 0;
    m.innings.forEach(inn => {
      if (inn.bat === ti) s += inn.cards[p.idx].runs;
      if (inn.bowl === ti && inn.bowling[p.idx]) s += inn.bowling[p.idx].wkts * 22;
    });
    if (m.result && m.result.winner === ti) s *= 1.2;
    if (s > bs) { bs = s; best = { name: p.name, team: t.short }; }
  }));
  return best;
}


// ===================== v4: dates, morale, captaincy, contracts, board, GOAT =====================
const WSTART = { win: [0, 7, 8], spr: [0, 10, 9], sum: [0, 12, 9], late: [1, 1, 21], anniv: [1, 3, 11], wtcf: [1, 6, 10] };
function windowStart(w) { const [dy, mo, d] = WSTART[w.id] || [0, 7, 1]; return new Date(Date.UTC(w.season + dy, mo - 1, d)); }
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const isoD = d => d.toISOString().slice(0, 10);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(s) { const d = typeof s === 'string' ? new Date(s + 'T00:00:00Z') : s; return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }
function fmtRange(d) { const e = addDays(d, 4); return d.getUTCMonth() === e.getUTCMonth() ? `${d.getUTCDate()}-${e.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}` : `${d.getUTCDate()} ${MON[d.getUTCMonth()]} - ${e.getUTCDate()} ${MON[e.getUTCMonth()]} ${e.getUTCFullYear()}`; }
function testDate(w, i) { const off = w.id === 'sum' ? [0, 8, 17, 26, 35][i] : i * 9; return addDays(windowStart(w), off); }
function restDays(w, i) { return i <= 0 ? 30 : Math.max(0, (testDate(w, i) - testDate(w, i - 1)) / 86400000 - 5); }

function defaultLead(p) { if (typeof LEAD !== 'undefined' && LEAD[p.name]) return LEAD[p.name]; return Math.round(clamp(40 + hashN(p.name + 'L') * 15 + Math.max(0, p.age - 24) * 1.3, 30, 80)); }
function moraleAdd(p, d) { p.morale = clamp(Math.round(((p.morale != null ? p.morale : 65) + d) * 10) / 10, 0, 100); }
function moraleLabel(v) { return v >= 85 ? 'Delighted' : v >= 70 ? 'Happy' : v >= 50 ? 'Content' : v >= 35 ? 'Unsettled' : 'Unhappy'; }

function migrate(c) {
  NATIONS.forEach(code => c.players[code].forEach(p => {
    if (p.lead == null) p.lead = defaultLead(p);
    if (p.morale == null) p.morale = clamp(Math.round(65 + (p.form || 0) * 1.5), 30, 90);
  }));
  if (!c.contracts) { c.contracts = CONTRACTS_2026.filter(n => P_(c, n)); c.contracts.forEach(n => moraleAdd(P_(c, n), 6)); }
  if (c.captain === undefined) { c.captain = 'Pat Cummins'; c.vice = 'Steve Smith'; moraleAdd(P_(c, 'Pat Cummins'), 10); }
  if (!c.board) c.board = { conf: 62, exp: null, log: [] };
  if (!c.retiredStars) c.retiredStars = [];
  if (!c.date) c.date = isoD(addDays(windowStart(curWindow(c)), -10));
  if (!c.goatPrev) c.goatPrev = {};
  if (c.contractRound == null) c.contractRound = false;
  migrateWB(c);
  return c;
}

// ---------- Captaincy ----------
function setCaptain(c, name, vice) {
  const old = c.captain;
  if (name !== old) {
    if (old && P_(c, old)) { moraleAdd(P_(c, old), -12); news(c, `${old} has been replaced as Test captain.`, 'bad'); }
    if (name) { moraleAdd(P_(c, name), 12); news(c, `${name} is Australia's new Test captain.`, 'big'); }
    const f = curWindow(c).fixture; if (f && f.status === 'active' && old) board(c, -3, 'Changed captain mid-series');
  }
  c.captain = name; if (vice !== undefined) c.vice = vice;
}

// ---------- Board confidence and expectations ----------
function board(c, d, why) { c.board.conf = clamp(Math.round((c.board.conf + d) * 10) / 10, 0, 100); if (why) { c.board.log.unshift({ d: fmtDate(c.date), v: d, why }); if (c.board.log.length > 30) c.board.log.length = 30; } }
function expectationFor(c, f) {
  const d = (c.trank.AUS || 100) - (c.trank[f.opp] || 60) + (f.home ? 8 : f.neutral ? 0 : -8);
  if (f.final) return { lvl: 1, text: 'Win the World Test Championship Final' };
  if (d > 25) return { lvl: 2, text: `Win the series comfortably${f.tests > 1 ? ' (lose no more than one Test)' : ''}` };
  if (d > 5) return { lvl: 1, text: 'Win the series' };
  if (d > -10) return { lvl: 0, text: 'Do not lose the series' };
  return { lvl: -1, text: 'Be competitive and avoid a heavy defeat' };
}
function onSquadNamed(c, f) {
  f.exp = expectationFor(c, f);
  c.board.exp = f.exp.text;
  // media pressure: in-form players left out
  const sh = c.shield.stats;
  const runs = Object.entries(sh).filter(([n]) => { const p = P_(c, n); return p && p.nat === 'AUS'; }).sort((a, b) => b[1].runs - a[1].runs).slice(0, 5).filter(([n, s]) => s.runs >= 400);
  const wks = Object.entries(sh).filter(([n]) => { const p = P_(c, n); return p && p.nat === 'AUS'; }).sort((a, b) => b[1].wk - a[1].wk).slice(0, 5).filter(([n, s]) => s.wk >= 20);
  const calls = [...runs.map(([n, s]) => [n, `${s.runs} Shield runs at ${(s.runs / Math.max(1, s.inn - s.no)).toFixed(1)}`]), ...wks.map(([n, s]) => [n, `${s.wk} Shield wickets`])]
    .filter(([n]) => !f.squad.includes(n) && P_(c, n) && !P_(c, n).injury && overall(P_(c, n)) >= 70);
  const seen = new Set(); f.pressure = calls.filter(([n]) => !seen.has(n) && seen.add(n)).slice(0, 4);
  f.pressure.forEach(([n, why]) => { moraleAdd(P_(c, n), -4); news(c, `Media: calls grow for ${n} (${why}) after he was left out of the squad.`, 'bad'); });
  if (f.pressure.length) board(c, -1.5 * f.pressure.length, `Ignored in-form Shield players (${f.pressure.map(x => x[0]).join(', ')})`);
  f.squad.forEach(n => { const p = P_(c, n); if (p && (p.form || 0) <= -6) { news(c, `Media: questions over ${n}'s place after a run of poor scores.`); board(c, -1, `Picked out-of-form ${n}`); } });
}
function onXISelected(c, f, xi) {
  const last = f.lastXI || [];
  xi.forEach(n => {
    const p = P_(c, n); if (!p) return;
    const st = (c.stats[n] || {}).test, pre = typeof PRESTATS !== 'undefined' && PRESTATS[n];
    if (!(st && st.m) && !pre) { moraleAdd(p, 10); news(c, `${n} will make his Test debut.`, 'good'); if (p.age <= 24) board(c, 1, `Gave ${n} a Test debut at ${p.age}`); }
    else moraleAdd(p, 3);
    if (!(c.contracts || []).includes(n)) { c.contracts.push(n); moraleAdd(p, 6); news(c, `${n} earns a contract upgrade by playing for Australia.`, 'good'); }
  });
  last.filter(n => !xi.includes(n)).forEach(n => { const p = P_(c, n); if (!p) return; moraleAdd(p, p.age >= 30 ? -8 : -6); if (overall(p) >= 78) news(c, `${n} is unhappy at being left out of the XI.`, 'bad'); });
  f.squad.filter(n => !xi.includes(n) && !last.includes(n)).forEach(n => { const p = P_(c, n); if (p && p.age >= 24) moraleAdd(p, -1); });
  f.lastXI = xi.slice();
}
function seriesFinished(c, f) {
  const us = f.results.filter(r => r.winner === 'AUS').length, them = f.results.filter(r => r.winner && r.winner !== 'AUS').length;
  const res = us > them ? (us - them >= 2 || (f.tests <= 2 && them === 0) ? 2 : 1) : us === them ? 0 : (them - us >= 2 ? -2 : -1);
  const exp = f.exp ? f.exp.lvl : 1;
  let d = (res - exp) * 6 + (us - them) * 1.5;
  if (f.final) d = us > them ? 15 : them > us ? -6 : 4;
  board(c, d, `${f.title || 'Series v ' + f.opp}: ${us}-${them}${f.exp ? ` (target: ${f.exp.text.toLowerCase()})` : ''}`);
  (f.lastXI || []).forEach(n => { const p = P_(c, n); if (p) moraleAdd(p, us > them ? 4 : them > us ? -3 : 0); });
  const conf = c.board.conf;
  if (conf < 10) news(c, `Board: your position is under serious review. Confidence is ${Math.round(conf)}%.`, 'bad');
  else if (conf < 25) news(c, `Board: results must improve. Confidence is ${Math.round(conf)}%.`, 'bad');
  else if (d >= 6) news(c, `Board: delighted with the series result. Confidence ${Math.round(conf)}%.`, 'good');
  c.board.exp = null;
}

// ---------- Contracts ----------
function confirmContracts(c, list) {
  const old = new Set(c.contracts || []), now = new Set(list);
  list.filter(n => !old.has(n)).forEach(n => { const p = P_(c, n); if (p) { moraleAdd(p, 8); } });
  [...old].filter(n => !now.has(n) && P_(c, n)).forEach(n => { const p = P_(c, n); moraleAdd(p, -12); if (overall(p) >= 76) news(c, `${n} is disappointed to lose his national contract.`, 'bad'); });
  c.contracts = list.slice(); c.contractRound = false;
  news(c, `National contracts confirmed for ${seasonLabel(curWindow(c).season)}: ${list.length} players.`);
}

// ---------- GOAT standings ----------
function retireSnapshot(c, p) {
  const t = goatTotals(c, p.name, p.nat);
  if (t && (t.m >= 10)) c.retiredStars.push(Object.assign({ name: p.name, nat: p.nat, retired: true }, t));
}
function goatTotals(c, name, nat) {
  const pre = typeof PRESTATS !== 'undefined' ? PRESTATS[name] : null;
  const s = (c.stats[name] || {}).test;
  if (!pre && !(s && s.m)) return null;
  const pm = pre ? pre[0] : 0, pr = pre ? pre[1] : 0, pdis = pre && pre[2] ? pr / pre[2] : 0, ph = pre ? pre[3] : 0, pw = pre ? pre[4] : 0, pbr = pre ? pre[4] * pre[5] : 0;
  const m = pm + (s ? s.m : 0), runs = pr + (s ? s.runs : 0), dis = pdis + (s ? s.inn - s.no : 0), h100 = ph + (s ? s.h100 : 0), wk = pw + (s ? s.wk : 0), bRuns = pbr + (s ? s.bRuns : 0);
  return { m, runs, avg: dis > 0 ? runs / dis : 0, h100, wk, bavg: wk ? bRuns / wk : 0 };
}
function goatScore(t) {
  const bat = t.runs >= 1500 ? t.runs / 100 * Math.pow(t.avg / 45, 2) + t.h100 * 1.5 : 0;
  const bowl = t.wk >= 50 ? t.wk / 10 * Math.pow(27 / t.bavg, 2) : 0;
  return { bat: Math.round(bat), bowl: Math.round(bowl * 2.4), all: Math.round(bat + bowl * 2.4), ar: t.runs >= 2000 && t.wk >= 100 ? Math.round(Math.min(bat, bowl * 2.4) * 2 + Math.max(bat, bowl * 2.4) * 0.3) : 0 };
}
function goatLists(c) {
  const rows = [], seen = new Set();
  NATIONS.forEach(code => c.players[code].forEach(p => { const t = goatTotals(c, p.name, code); if (t) { rows.push(Object.assign({ name: p.name, nat: code, active: true }, t)); seen.add(p.name); } }));
  c.retiredStars.forEach(r => { if (!seen.has(r.name)) { rows.push(r); seen.add(r.name); } });
  LEGENDS.forEach(([name, nat, m, runs, avg, h100, wk, bavg]) => { if (!seen.has(name)) rows.push({ name, nat, m, runs, avg, h100, wk, bavg, legend: true }); });
  rows.forEach(r => { r.sc = goatScore(r); });
  const top = k => rows.filter(r => r.sc[k] > 0).sort((a, b) => b.sc[k] - a.sc[k]);
  return { all: top('all'), bat: top('bat'), bowl: top('bowl'), ar: top('ar'), runs: rows.slice().sort((a, b) => b.runs - a.runs), wk: rows.slice().sort((a, b) => b.wk - a.wk) };
}
function goatCheck(c) {
  const L = goatLists(c), prev = c.goatPrev || {}, next = {};
  [['bat', 'batting'], ['bowl', 'bowling']].forEach(([k, label]) => {
    L[k].slice(0, 40).forEach((r, i) => {
      next[k + ':' + r.name] = i + 1;
      const was = prev[k + ':' + r.name];
      if (r.active && was && i + 1 < was && (r.nat === 'AUS' || i < 10)) {
        const passed = L[k][i + 1];
        news(c, `GOAT watch: ${r.name} climbs to No.${i + 1} on the all-time ${label} list${passed ? `, passing ${passed.name}` : ''}.`, 'good');
      }
    });
  });
  ['runs', 'wk'].forEach(k => { L[k].slice(0, 15).forEach((r, i) => { const was = prev[k + ':' + r.name]; next[k + ':' + r.name] = i + 1; if (r.active && was && i + 1 < was) news(c, `Record: ${r.name} moves to No.${i + 1} on the all-time Test ${k === 'runs' ? 'run-scorers' : 'wicket-takers'} list (${k === 'runs' ? r.runs : r.wk}).`, 'big'); }); });
  c.goatPrev = next;
}

const Career = { NATIONS, WTC_TEAMS, STATE_CODES, WINDOWS, seasonLabel, venuesOf, defaultVenues, mkFixture, newCareer, curWindow, findPlayer, P_, advanceWindow, activateWindow,
  autoSquad, autoXI, battingOrder, statsOf, shieldStat, recordMatch, playerOfMatch, isKeeper, frontline, available, wtcSorted, pct, shieldLadder, statePool, touringGrowth,
  passWeeks, news, bump, matchSummary, finishWtcFinal, migrate, testDate, fmtDate, fmtRange, isoD, addDays, restDays, moraleAdd, moraleLabel, onSquadNamed, onXISelected, seriesFinished, goatLists, goatCheck, setCaptain, confirmContracts, expectationFor, defaultLead };
if (false) {
  const D = require('./data.js'); Object.assign(global, D);
  const E = require('./engine.js'); Object.assign(global, { isPace: E.isPace, overall: E.overall, overallRaw: E.overallRaw, potential: E.potential, batRating: E.batRating, bowlRating: E.bowlRating,
    clamp: (x, a, b) => Math.max(a, Math.min(b, x)), createMatch: E.createMatch, simQuick: E.simQuick, scoreLine: E.scoreLine,
    pick: a => a[Math.floor(Math.random() * a.length)], pickW: (items, w) => { let s = w.reduce((a, b) => a + b, 0), r = Math.random() * s; for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; } });
  module.exports = Career;
}
