// ===== FIRST-CLASS MATCH ENGINE (Tests and Sheffield Shield) =====
const K = { off: 10, base: 66, up: 0.032, down: 0.013 };
const PACE_TYPES = ['RF', 'RFM', 'RM', 'LF', 'LFM'];
const isPace = t => PACE_TYPES.includes(t);
const rnd = () => Math.random();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pickW = (items, w) => { let s = w.reduce((a, b) => a + b, 0), r = rnd() * s; for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; };
const pick = a => a[Math.floor(rnd() * a.length)];
const surname = n => n.split(' ').slice(1).join(' ') || n;
const WX = ['Sunny', 'Cloudy', 'Overcast', 'Humid', 'Rain'];
const WX_ICON = { Sunny: '☀', Cloudy: '⛅', Overcast: '☁', Humid: '♨', Rain: '☂' };

// ---------- Ratings ----------
const mov = w => isPace(w.type) ? (w.swing + w.seam) / 2 : (w.turn + w.flight) / 2;
function batRating(p) { const b = p.bat; return b.tech * 0.26 + b.conc * 0.22 + b.vPace * 0.2 + b.vSpin * 0.2 + (b.off + b.on) / 2 * 0.12; }
function bowlRating(p) { if (!p.bowl) return 0; const w = p.bowl; return w.skill * 0.5 + w.acc * 0.2 + w.stam * 0.1 + mov(w) * 0.2; }
function fieldRating(p) { return (p.field + p.ground) / 2; }
function overallRaw(p) {
  const bat = batRating(p), bowl = bowlRating(p), f = fieldRating(p);
  if (p.role === 'BAT') return bat * 0.95 + f * 0.05;
  if (p.role === 'BOWL') return bowl * 0.95 + f * 0.05;
  if (p.role === 'AR') { const hi = Math.max(bat, bowl), lo = Math.min(bat, bowl); return hi * 0.55 + lo * 0.45 + 3; }
  return bat * 0.6 + p.keep * 0.4;
}
function overall(p) { return clamp(Math.round(overallRaw(p)), 1, 99); }
function potential(p) { const o = overall(p); return Math.max(o, Math.round(p.potRaw || o)); }

// ---------- Weather ----------
function genWeather(home, n) {
  const cl = (typeof CLIMATE !== 'undefined' && CLIMATE[home]) || [0.5, 0.25, 0.1, 0.07, 0.08];
  const out = []; let cur = pickW(WX, cl);
  for (let i = 0; i < n; i++) { if (i && rnd() > 0.55) cur = pickW(WX, cl); out.push(cur); }
  return out;
}

// ---------- Setup ----------
function makeTeam(code, xi, TEAMS, energy, label, capt) {
  const T = TEAMS[code] || { name: label || code, short: code };
  const players = xi.map((src, i) => {
    if (typeof src === 'string') src = T.squad.find(p => p.name === src);
    const e = energy && energy[src.name] != null ? energy[src.name] : 100;
    const c = JSON.parse(JSON.stringify(src));
    return Object.assign(c, { idx: i, energy: e, spell: 0, spellNew: false, matchWkts: 0, matchRuns: 0, hurt: null });
  });
  let keeper = players.findIndex(p => p.role === 'WK');
  if (keeper < 0) keeper = players.reduce((b, p, i) => (p.keep > players[b].keep ? i : b), 0);
  let cap = capt ? players.findIndex(p => p.name === capt[0]) : -1;
  if (cap < 0 && capt) cap = players.findIndex(p => p.name === capt[1]);
  if (cap < 0) cap = players.reduce((b, p, i) => ((p.lead || 50) > (players[b].lead || 50) ? i : b), 0);
  const lead = players[cap].lead || 55;
  return { code, name: label || T.name, short: code, players, keeper, cap, lead, lb: (lead - 70) * 0.025, order: players.map((_, i) => i),
    approach: 'auto', field: 'auto', bowlMode: 'auto', plan: [null, null], nightwatch: 'auto' };
}

function createMatch(o) {
  const days = o.days || 5, dayBalls = (o.overs || 90) * 6;
  const m = {
    teams: [makeTeam(o.home, o.xi[o.home], o.TEAMS, o.energy, o.labels && o.labels[o.home], o.captains && o.captains[o.home]), makeTeam(o.away, o.xi[o.away], o.TEAMS, o.energy, o.labels && o.labels[o.away], o.captains && o.captains[o.away])],
    venue: o.venue, venueKey: o.venueKey, user: o.userTeam === o.home ? 0 : (o.userTeam === o.away ? 1 : -1),
    days, dayBalls, sessBalls: dayBalls / 3, neutral: !!o.neutral, quiet: !!o.quiet, comp: o.comp || 'test', title: o.title || '',
    day: 1, ballsInDay: 0, innings: [], events: [], phase: 'toss', pending: null, result: null,
    endBowler: [null, null], end: 0, overBalls: 0, overRuns: 0, overLog: [], ballAge: 0, stopOnWicket: false,
    declareRequested: false, lastWicketFlag: false, autoDeclare: true, sessSeen: 0, oversDone: 0,
    fstats: [{}, {}], injuries: [],
  };
  const host = o.venue.home || o.home;
  m.forecast = genWeather(host, days * 3);
  m.wx = m.forecast.map(w => rnd() < 0.8 ? w : genWeather(host, 1)[0]);
  m.tossWinner = rnd() < 0.5 ? 0 : 1;
  log(m, 'info', `${m.teams[m.tossWinner].name} win the toss at ${m.venue.name}. Weather: ${m.wx[0].toLowerCase()}.`);
  if (m.tossWinner === m.user) { m.pending = { kind: 'toss' }; m.phase = 'decide'; }
  else {
    const green = m.venue.pace >= 3 || ['Overcast', 'Humid'].includes(m.wx[0]);
    tossDecision(m, green && rnd() < 0.45 ? 'bowl' : 'bat');
  }
  return m;
}

function tossDecision(m, choice) {
  if (m.lo) return loToss(m, choice);
  const w = m.tossWinner, batFirst = choice === 'bat' ? w : 1 - w;
  log(m, 'info', `${m.teams[w].name} have chosen to ${choice} first.`);
  m.pending = null; m.phase = 'live';
  startSessionWeather(m);
  startInnings(m, batFirst, false);
}

// ---------- Helpers ----------
const cur = m => m.innings[m.innings.length - 1];
const batTeam = m => m.teams[cur(m).bat];
const bowlTeam = m => m.teams[cur(m).bowl];
const matchBalls = m => (m.day - 1) * m.dayBalls + m.ballsInDay;
const oversLeft = m => Math.max(0, (m.days * m.dayBalls - matchBalls(m)) / 6);
const sessionIdx = m => (m.day - 1) * 3 + Math.min(2, Math.floor(m.ballsInDay / m.sessBalls));
const teamTotal = (m, t) => m.innings.filter(i => i.bat === t).reduce((a, i) => a + i.runs, 0);
const oversStr = balls => `${Math.floor(balls / 6)}${balls % 6 ? '.' + (balls % 6) : ''}`;
const wxNow = m => m.wx[Math.min(m.wx.length - 1, sessionIdx(m))] || 'Sunny';
const wear = m => ((m.day - 1) + m.ballsInDay / m.dayBalls) * m.venue.wear * 1.2 * (5 / m.days) * (m.hot || 1);
function scoreLine(inn) { return inn.wkts >= 10 ? `${inn.runs}` : `${inn.wkts}/${inn.runs}${inn.declared ? 'd' : ''}`; }
const isHome = (m, idx) => !m.neutral && idx === 0;

function log(m, type, text, extra) {
  if (m.quiet && type !== 'result') return;
  const inn = m.innings.length ? cur(m) : null;
  m.events.push(Object.assign({ type, text, day: m.day, session: Math.min(2, Math.floor(m.ballsInDay / m.sessBalls)),
    score: inn ? `${m.teams[inn.bat].short} ${inn.wkts}/${inn.runs} (${oversStr(inn.legal)} ov)` : '' }, extra || {}));
}

function startInnings(m, bat, followOn) {
  const n = m.innings.length;
  if (n > 0) {
    m.ballsInDay = Math.ceil(m.ballsInDay / 6) * 6 + 12;
    rollTime(m);
    if (m.phase === 'done') return;
  }
  const t = m.teams[bat];
  const inn = { bat, bowl: 1 - bat, runs: 0, wkts: 0, legal: 0, extras: { b: 0, lb: 0, w: 0, nb: 0 },
    cards: t.players.map(() => ({ runs: 0, balls: 0, fours: 0, sixes: 0, status: 'dnb', how: '', bowler: null })),
    bowling: {}, bowlOrder: [], fow: [], declared: false, followOn, closed: false, part: { runs: 0, balls: 0 }, num: n + 1, order: t.order.slice() };
  m.innings.push(inn);
  m.striker = inn.order[0]; m.nonStriker = inn.order[1]; m.nextIn = 2;
  inn.cards[m.striker].status = 'batting'; inn.cards[m.nonStriker].status = 'batting';
  m.ballAge = 0; m.endBowler = [null, null]; m.end = 0; m.overBalls = 0; m.overRuns = 0; m.overLog = [];
  m.declareRequested = false;
  const label = ['First', 'Second', 'Third', 'Fourth'][n];
  log(m, 'innings', `${label} innings: ${t.name} ${followOn ? 'follow on' : 'to bat'}.` + (n === 3 ? ` Target ${m.target}.` : ''));
  m.endBowler[0] = chooseBowler(m, 0);
}

// ---------- Effectiveness ----------
const PT = { type: 'RM', skill: 25, acc: 35, stam: 50, swing: 30, seam: 30 };
function effBowl(m, p, bowlIdx) {
  const w = p.bowl || PT;
  let e = w.skill * 0.5 + w.acc * 0.3 + mov(w) * 0.2;
  const v = m.venue, wr = wear(m), wx = wxNow(m);
  if (isPace(w.type)) {
    const newB = m.ballAge < 60 ? 1 : m.ballAge < 120 ? 0.7 : m.ballAge < 240 ? 0.3 : 0;
    const swingCond = (wx === 'Overcast' || wx === 'Humid' ? 1 : wx === 'Cloudy' ? 0.5 : 0.15) + (v.home === 'ENG' || v.home === 'NZ' ? 0.3 : 0);
    e += v.pace * 0.6 + wr * 0.25;
    e += newB * 3 + (w.swing - 70) * 0.09 * swingCond * (0.4 + newB);
    e += (w.seam - 70) * 0.05 * clamp(v.pace / 3 + (m.day <= 2 ? 0.4 : 0), 0, 1.6);
    e += m.ballAge > 420 ? -1.5 : 0;
    if (wx === 'Overcast' || wx === 'Humid') e += 1;
  } else {
    e += v.spin * 0.8 - 1.5 + wr * (1.2 + v.spin * 0.12) * (0.6 + w.turn / 200);
  }
  if (isHome(m, bowlIdx)) e += 1;
  e += (p.form || 0) * 0.22 + (p.morale != null ? (p.morale - 60) * 0.04 : 0) + (m.teams[bowlIdx].lb || 0);
  if (p.energy < 70) e -= (70 - p.energy) * 0.25;
  return e;
}
function effBat(m, p, bowler, batIdx) {
  const b = p.bat, pace = isPace((bowler.bowl || PT).type);
  const wx = wxNow(m);
  const tW = pace && (wx === 'Overcast' || wx === 'Humid') ? 0.45 : 0.35;
  let e = b.tech * tW + (pace ? b.vPace : b.vSpin) * (0.75 - tW) + b.conc * 0.25;
  e += m.venue.flat * 0.5 - wear(m) * 0.5 + (wx === 'Sunny' ? 0.6 : 0);
  if (isHome(m, batIdx)) e += 1;
  e += (p.form || 0) * 0.22 + (p.morale != null ? (p.morale - 60) * 0.04 : 0) + (m.teams[batIdx].lb || 0);
  if (m.teams[batIdx].cap === p.idx && (m.teams[batIdx].lead || 60) < 60) e -= 1;
  return e;
}

// ---------- Bowling changes ----------
function canBowl(p) { return !p.hurt; }
function maxSpell(p) { if (!p.bowl || !isPace(p.bowl.type)) return 14; return (p.spellNew ? 6 : 4) + (p.bowl.stam >= 85 ? 1 : 0); }
function chooseBowler(m, end) {
  const inn = cur(m), team = m.teams[inn.bowl], current = m.endBowler[end], other = m.endBowler[1 - end];
  if (inn.bowl === m.user && team.bowlMode === 'manual') {
    const want = team.plan[end];
    if (want != null && want !== other && canBowl(team.players[want])) { if (want !== current) startSpell(m, team.players[want]); return want; }
  }
  if (current != null) {
    const p = team.players[current];
    if (p.bowl && canBowl(p) && p.spell < maxSpell(p) && p.energy >= 50) return current;
  }
  const bowlers = team.players.filter(p => p.bowl && canBowl(p));
  const wt = p => p.bowl.skill < 68 ? 0.25 : isPace(p.bowl.type) ? 1 : 1.35;
  const tot = bowlers.reduce((a, p) => a + wt(p), 0) || 1;
  const innOvers = inn.legal / 6;
  let best = null, bestS = -1e9;
  bowlers.forEach(p => {
    const i = p.idx;
    if (i === other || i === current) return;
    let s = effBowl(m, p, inn.bowl) + rnd() * 3 * clamp(1.6 - (team.lead || 60) / 100, 0.5, 1.3);
    if (isPace(p.bowl.type) && p.energy < 85) s -= 12;
    if (p.energy < 55) s -= 15;
    const ov = (inn.bowling[i] ? inn.bowling[i].legal : 0) / 6;
    s -= Math.max(0, ov - innOvers * wt(p) / tot) * 1.6;
    if (s > bestS) { bestS = s; best = i; }
  });
  if (best == null) {
    const cands = team.players.filter(p => p.idx !== other && canBowl(p)).sort((a, b) => bowlRating(b) - bowlRating(a));
    best = current != null && current !== other ? current : (cands[0] || team.players.find(p => p.idx !== other)).idx;
  }
  if (best !== current) startSpell(m, team.players[best]);
  return best;
}
function startSpell(m, p) { p.spell = 0; p.spellNew = m.ballAge < 60; }
function setPlan(m, end, idx) {
  if (m.lo) return loSetPlan(m, idx);
  const t = m.teams[m.user]; t.plan[end] = idx;
  if (m.phase === 'live' && cur(m).bowl === m.user && t.bowlMode === 'manual' && m.overBalls === 0 && end === m.end && idx !== m.endBowler[1 - end] && canBowl(t.players[idx])) {
    if (m.endBowler[end] !== idx) startSpell(m, t.players[idx]);
    m.endBowler[end] = idx;
  }
}

// ---------- Approach / field ----------
function declareTarget(O, m) { return clamp(2.6 * O, 220, 420) * (m.days === 4 ? 0.9 : 1); }
function autoApproach(m) {
  const inn = cur(m), n = m.innings.length - 1, O = oversLeft(m);
  if (n < 2) return 'normal';
  if (n === 2) {
    const L = teamTotal(m, inn.bat) - teamTotal(m, inn.bowl);
    if (L > 0 && O >= 45 && O <= m.days * 38 && L >= declareTarget(Math.min(O, 150), m) * 0.7) return 'attack';
    if (L < 120 && O < 110) return 'defend';
    return 'normal';
  }
  const need = m.target - inn.runs, w = 10 - inn.wkts, r = need / Math.max(O, 1);
  if (need <= 25) return 'attack';
  if (r <= 3.4) return 'normal';
  if (r <= 4.8 && w >= 5) return 'attack';
  return 'defend';
}
function approachOf(m) { const t = batTeam(m); return t.approach === 'auto' || cur(m).bat !== m.user ? autoApproach(m) : t.approach; }
function fieldOf(m, card) {
  const t = bowlTeam(m);
  if (cur(m).bowl === m.user && t.field !== 'auto') return t.field;
  if (m.ballAge < 90 || card.balls < 12) return 'attack';
  if (card.balls > 60 && card.runs > 40) return 'defend';
  if (m.innings.length === 4 && m.target - cur(m).runs < 60) return 'defend';
  return 'normal';
}

// ---------- Ball ----------
function simBall(m) {
  if (m.phase !== 'live') return;
  const inn = cur(m), bt = batTeam(m), bw = bowlTeam(m);
  if (m.declareRequested && inn.bat === m.user) { declare(m); return; }
  if (m.endBowler[m.end] == null) m.endBowler[m.end] = chooseBowler(m, m.end);
  const bowler = bw.players[m.endBowler[m.end]];
  const bat = bt.players[m.striker], card = inn.cards[m.striker];
  const fig = inn.bowling[bowler.idx] || (inn.bowling[bowler.idx] = { legal: 0, runs: 0, wkts: 0, maidens: 0 });
  if (!inn.bowlOrder.includes(bowler.idx)) inn.bowlOrder.push(bowler.idx);
  const appr = approachOf(m);
  const bb = bowler.bowl || PT;
  const accF = 1.6 - bb.acc / 100;

  const r0 = rnd();
  if (r0 < 0.005 * accF) { inn.runs++; inn.extras.w++; fig.runs++; m.overRuns++; inn.part.runs++; m.overLog.push('wd'); return; }
  if (isPace(bb.type) && r0 < 0.011 * accF) { inn.runs++; inn.extras.nb++; fig.runs++; m.overRuns++; inn.part.runs++; m.overLog.push('nb'); return; }

  inn.legal++; m.ballsInDay++; m.ballAge++; m.overBalls++; fig.legal++; card.balls++; inn.part.balls++;
  const d = effBat(m, bat, bowler, inn.bat) - effBowl(m, bowler, inn.bowl) + K.off;
  const b = card.balls - 1;
  let setM = b < 8 ? 1.35 : b < 20 ? 1.12 : b < 50 ? 1.0 : 0.9;
  if (b > 240) setM *= 1 + (b - 240) / 600 * (1.3 - bat.bat.conc / 100);
  const apW = appr === 'defend' ? 0.65 : appr === 'attack' ? 1.45 : 1;
  const apR = appr === 'defend' ? 0.55 : appr === 'attack' ? 1.5 : 1;
  const fld = fieldOf(m, card);
  const fW = fld === 'attack' ? 1.18 : fld === 'defend' ? 0.82 : 1, fR = fld === 'attack' ? 1.15 : fld === 'defend' ? 0.82 : 1;
  const bpw = K.base * Math.exp(d > 0 ? K.up * d : K.down * d);
  const pW = (1 / bpw) * setM * (0.8 + bat.bat.agg / 250) * apW * fW;

  if (rnd() < pW) { dismissal(m, bowler, bat, fig); endOverCheck(m); return; }
  if (rnd() < 0.0004 + (110 - avgGround(bw)) * 0.000005) { runOut(m, bowler); endOverCheck(m); return; }

  const early = b < 15 ? 0.55 + bat.bat.agg / 200 : 1;
  const sc = bat.bat.off * 0.5 + bat.bat.on * 0.5, weak = Math.min(bat.bat.off, bat.bat.on);
  const regionF = 1 + ((sc * 0.75 + weak * 0.25) - batRating(bat)) * 0.012 - (bb.acc - 75) * 0.002;
  const groundF = 1 - (avgGround(bw) - 76) * 0.004;
  const mult = Math.exp(0.012 * d) * (0.55 + bat.bat.agg / 110) * apR * fR * (1 + m.venue.flat * 0.02) * early * regionF * groundF;
  const p6 = 0.004 * mult * mult * (bat.bat.agg / 60);
  const probs = [0.16 * mult, 0.037 * mult, 0.006 * mult, 0.065 * mult, p6];
  const r = rnd(); let acc = 0, runs = 0;
  const vals = [1, 2, 3, 4, 6];
  for (let i = 0; i < 5; i++) { acc += probs[i]; if (r < acc) { runs = vals[i]; break; } }
  if (runs === 0 && rnd() < 0.011) {
    const lb = rnd() < 0.7, x = lb ? 1 : pickW([1, 4], [3, 1]);
    inn.runs += x; inn.part.runs += x; inn.extras[lb ? 'lb' : 'b'] += x; m.overLog.push(x + (lb ? 'lb' : 'b'));
    if (x % 2) swapStrike(m);
  } else {
    addRuns(m, runs, bat, bowler, fig, card);
  }
  // batter injury (hit, strain)
  if (rnd() < 0.00012) hurt(m, bat, inn.bat, pick(['a finger injury', 'a hamstring strain', 'a blow to the hand']));
  endOverCheck(m);
}
function avgGround(team) { if (team._g == null) team._g = team.players.reduce((a, p) => a + p.ground, 0) / team.players.length; return team._g; }

function hurt(m, p, teamIdx, what) {
  if (p.hurt) return;
  p.hurt = what;
  m.injuries.push({ name: p.name, team: m.teams[teamIdx].code, what });
  log(m, 'drop', `Injury: ${p.name} picks up ${what}.${p.bowl ? ' He won\'t bowl again in this match.' : ''}`, { team: teamIdx });
}

function addRuns(m, runs, bat, bowler, fig, card) {
  const inn = cur(m);
  const before = card.runs, pBefore = inn.part.runs;
  inn.runs += runs; card.runs += runs; fig.runs += runs; m.overRuns += runs; inn.part.runs += runs; bat.matchRuns += runs;
  m.overLog.push(runs === 0 ? '·' : String(runs));
  if (runs === 4) { card.fours++; boundaryText(m, bat, bowler, 4); }
  if (runs === 6) { card.sixes++; boundaryText(m, bat, bowler, 6); }
  for (const ms of [50, 100, 150, 200, 250, 300]) if (before < ms && card.runs >= ms) {
    log(m, 'mile', `${ms === 50 ? 'Fifty' : ms === 100 ? 'HUNDRED' : ms + ''} for ${bat.name}! ${card.runs} off ${card.balls} balls${ms >= 100 ? ', a superb innings' : ''}.`, { team: inn.bat });
  }
  for (const ms of [100, 150, 200, 250]) if (pBefore < ms && inn.part.runs >= ms) {
    const a = batTeam(m).players[m.striker], b2 = batTeam(m).players[m.nonStriker];
    log(m, 'mile', `${ms} partnership between ${surname(a.name)} and ${surname(b2.name)}.`, { team: inn.bat });
  }
  if (inn.num === 4 && inn.runs >= m.target) return;
  if (runs % 2 === 1) swapStrike(m);
}

const FOUR_TXT = { off: ['driven through the covers for four', 'cut hard past point for four', 'punched off the back foot through cover', 'edged, but it flies between slip and gully for four'],
  on: ['pulled away to the boundary', 'flicked off the pads for four', 'clipped through midwicket for four', 'driven straight down the ground for four'] };
const SIX_TXT = ['launched over long-on for SIX', 'hooked into the crowd for SIX', 'down the track and over the sightscreen for SIX', 'slog-swept into the stands for SIX'];
function boundaryText(m, bat, bowler, n) {
  if (m.quiet) return;
  const side = rnd() < bat.bat.off / (bat.bat.off + bat.bat.on) ? 'off' : 'on';
  let txt = n === 4 ? pick(FOUR_TXT[side]) : pick(SIX_TXT);
  if (bowler.bowl && !isPace(bowler.bowl.type) && txt.includes('hooked')) txt = 'swept into the crowd for SIX';
  log(m, n === 4 ? 'four' : 'six', `${surname(bowler.name)} to ${surname(bat.name)}: ${txt}.`, { team: cur(m).bat });
}

function pickFielder(team, exclude, top) {
  const c = team.players.filter(p => !exclude.includes(p.idx));
  if (top) { c.sort((a, b) => b.field - a.field); return c[Math.floor(rnd() * Math.min(3, c.length))]; }
  return pickW(c, c.map(p => p.field));
}
function fstat(m, ti, pi) { const f = m.fstats[ti]; return f[pi] || (f[pi] = { ct: 0, st: 0, ro: 0, drops: 0 }); }

function dismissal(m, bowler, bat, fig) {
  const inn = cur(m), bw = bowlTeam(m), pace = isPace((bowler.bowl || PT).type);
  const keeper = bw.players[bw.keeper];
  const kinds = ['cb', 'slip', 'field', 'bowled', 'lbw', 'st', 'cab'];
  const sw = bowler.bowl ? (pace ? (bowler.bowl.seam - 70) * 0.2 : (bowler.bowl.turn - 70) * 0.15) : 0;
  const w = pace ? [27 + sw, 15 + sw, 22, 17, 18, 0, 1] : [6, 8, 34, 16 + sw, 24 + sw, 8, 4];
  const k = pickW(kinds, w);
  let fielder = null, how = '', txt = '';
  const B = surname(bowler.name), N = surname(bat.name);
  if (k === 'cb' || k === 'slip' || k === 'field' || k === 'cab') {
    fielder = k === 'cb' ? keeper : k === 'cab' ? bowler : k === 'slip' ? pickFielder(bw, [bowler.idx, bw.keeper], true) : pickFielder(bw, [bowler.idx, bw.keeper]);
    const dropP = k === 'cb' ? (100 - fielder.keep) / 300 : k === 'slip' ? (100 - fielder.field) / 220 : (100 - fielder.field) / 260;
    if (rnd() < dropP) {
      fstat(m, inn.bowl, fielder.idx).drops++;
      log(m, 'drop', `DROPPED! ${N} edges ${B} and ${fielder.name} puts it down. ${N} on ${inn.cards[m.striker].runs}.`, { team: inn.bowl });
      m.overLog.push('·'); return false;
    }
    fstat(m, inn.bowl, fielder.idx).ct++;
    const F = surname(fielder.name);
    if (k === 'cab') { how = `c & b ${B}`; txt = `Caught and bowled! ${B} takes a sharp return catch.`; }
    else if (k === 'cb') { how = `c ${F} b ${B}`; txt = pace ? `Edged and gone! ${F} takes it behind the stumps.` : `Gets a thin edge, ${F} gathers it behind.`; }
    else if (k === 'slip') { how = `c ${F} b ${B}`; txt = `Nicked, and ${F} holds on at ${pace ? 'slip' : 'short leg'}.`; }
    else {
      const pos = pace ? ['gully', 'point', 'mid-off', 'mid-on', 'fine leg', 'square leg', 'cover', 'deep backward square'] : ['long-on', 'deep midwicket', 'mid-off', 'cover', 'silly point', 'long-off', 'deep square leg'];
      how = `c ${F} b ${B}`; txt = `Picks out ${F} at ${pick(pos)}.`;
    }
  } else if (k === 'bowled') { how = `b ${B}`; txt = pick(['Bowled him! Through the gate and the stumps are rearranged.', 'Clean bowled, off stump cartwheeling.', 'Plays down the wrong line and loses his off stump.']); }
  else if (k === 'lbw') { how = `lbw b ${B}`; txt = pick(['Trapped in front! The finger goes up.', 'Pinned on the crease, given out lbw.', 'Big appeal... given! Hitting middle.']); }
  else { fstat(m, inn.bowl, bw.keeper).st++; how = `st ${surname(keeper.name)} b ${B}`; txt = `Down the track, beaten in flight, and ${surname(keeper.name)} whips the bails off.`; }
  fig.wkts++; bowler.matchWkts++;
  inn.cards[m.striker].bowler = bowler.idx;
  outBatter(m, m.striker, how, `${B} to ${N}, OUT! ${txt}`);
  if (fig.wkts === 5) log(m, 'mile', `Five-wicket haul for ${bowler.name}!`, { team: inn.bowl });
  if (bowler.matchWkts === 10) log(m, 'mile', `Ten wickets in the match for ${bowler.name}!`, { team: inn.bowl });
  return true;
}

function runOut(m, bowler) {
  const bw = bowlTeam(m), f = pickFielder(bw, [bowler.idx]);
  fstat(m, cur(m).bowl, f.idx).ro++;
  const who = rnd() < 0.5 ? m.striker : m.nonStriker;
  outBatter(m, who, `run out (${surname(f.name)})`, `RUN OUT! A terrible mix-up and ${surname(f.name)} hits direct. ${surname(batTeam(m).players[who].name)} has to go.`);
}

function outBatter(m, who, how, txt) {
  const inn = cur(m), bt = batTeam(m), c = inn.cards[who];
  c.status = 'out'; c.how = how; inn.wkts++;
  inn.fow.push({ wkt: inn.wkts, runs: inn.runs, name: bt.players[who].name, over: oversStr(inn.legal) });
  m.overLog.push('W'); m.lastWicketFlag = true;
  log(m, 'wkt', `${txt} ${surname(bt.players[who].name)} ${c.runs} (${c.balls}).`, { team: inn.bowl });
  inn.part = { runs: 0, balls: 0 };
  if (inn.wkts >= 10) { endInnings(m, 'allout'); return; }
  nightwatchCheck(m, inn, bt);
  const next = inn.order[m.nextIn++];
  inn.cards[next].status = 'batting';
  if (who === m.striker) m.striker = next; else m.nonStriker = next;
}

function nightwatchCheck(m, inn, bt) {
  const left = m.dayBalls - m.ballsInDay;
  if (left > 42 || inn.wkts >= 7 || m.nextIn > 6) return;
  if (inn.num === 4 && m.target - inn.runs < 80) return;
  if (inn.bat === m.user && bt.nightwatch === 'never') return;
  if (m.day >= m.days) return;
  const nextP = bt.players[inn.order[m.nextIn]];
  if (!nextP || batRating(nextP) < 65) return;
  const cands = inn.order.slice(m.nextIn + 1).filter(i => inn.cards[i].status === 'dnb' && bt.players[i].role === 'BOWL');
  if (!cands.length) return;
  const nw = cands.sort((a, b) => (bt.players[b].bat.tech + bt.players[b].bat.conc) - (bt.players[a].bat.tech + bt.players[a].bat.conc))[0];
  inn.order.splice(inn.order.indexOf(nw), 1);
  inn.order.splice(m.nextIn, 0, nw);
  log(m, 'info', `Nightwatchman: ${bt.players[nw].name} comes in ahead of ${nextP.name} with ${Math.ceil(left / 6)} over${Math.ceil(left / 6) === 1 ? "" : "s"} left in the day.`);
}

function swapStrike(m) { const t = m.striker; m.striker = m.nonStriker; m.nonStriker = t; }

// ---------- Over / time ----------
function endOverCheck(m) {
  if (m.phase !== 'live') return;
  const inn = cur(m);
  if (inn.num === 4 && inn.runs >= m.target) { finish(m, inn.bat, `${m.teams[inn.bat].name} win by ${10 - inn.wkts} wicket${10 - inn.wkts === 1 ? '' : 's'}`); return; }
  if (m.overBalls < 6) return;
  const bw = bowlTeam(m), bowler = bw.players[m.endBowler[m.end]];
  const fig = inn.bowling[bowler.idx];
  m.oversDone++;
  if (m.overRuns === 0 && fig) fig.maidens++;
  bowler.spell++;
  const bt = bowler.bowl || PT, pace = isPace(bt.type);
  const hot = wxNow(m) === 'Sunny' || wxNow(m) === 'Humid' ? 1.15 : 1;
  bowler.energy = clamp(bowler.energy - (pace ? 3 + (100 - bt.stam) * 0.06 : 1 + (100 - bt.stam) * 0.04) * hot, 0, 100);
  bw.players.forEach(p => { if (p !== bowler && p.idx !== m.endBowler[1 - m.end]) p.energy = clamp(p.energy + 2, 0, 100); });
  if (pace && rnd() < 0.0011 * (1 + Math.max(0, 70 - bowler.energy) / 25) * (bowler.prone || 1)) hurt(m, bowler, inn.bowl, pick(['a hamstring strain', 'a side strain', 'back soreness', 'an ankle injury', 'a calf strain']));
  m.lastOver = { bowler: bowler.name, log: m.overLog.slice() };
  m.overBalls = 0; m.overRuns = 0; m.overLog = [];
  swapStrike(m);
  m.end = 1 - m.end;
  if (m.ballAge >= 480 && m.ballAge < 486) newBallDecision(m);
  if (m.stumpsEarly && m.ballsInDay >= m.stumpsEarly) { log(m, 'session', 'Bad light ends play early.'); m.ballsInDay = m.dayBalls; m.stumpsEarly = null; }
  rollTime(m);
  if (m.phase !== 'live') return;
  if (cur(m).bat !== m.user || m.autoDeclare) aiDeclare(m);
  if (m.phase !== 'live' || cur(m) !== inn) return;
  m.endBowler[m.end] = chooseBowler(m, m.end);
}

function newBallDecision(m) {
  const inn = cur(m), bw = bowlTeam(m);
  const bestPace = Math.max(0, ...bw.players.filter(p => p.bowl && isPace(p.bowl.type)).map(p => p.bowl.skill));
  const bestSpin = Math.max(0, ...bw.players.filter(p => p.bowl && !isPace(p.bowl.type)).map(p => effBowl(m, p, inn.bowl)));
  if (bestSpin - (bestPace + m.venue.pace) > 6) return;
  m.ballAge = 0; m.endBowler = [null, null];
  log(m, 'info', `${bw.name} take the second new ball.`);
}

function startSessionWeather(m) {
  const s = sessionIdx(m), w = m.wx[s] || 'Sunny';
  m.hot = w === 'Sunny' ? 1.1 : 1;
  if (w === 'Rain') {
    const frac = 0.3 + rnd() * 0.7;
    const sessEnd = (Math.floor(m.ballsInDay / m.sessBalls) + 1) * m.sessBalls;
    const lost = Math.min(sessEnd - m.ballsInDay, Math.round(m.sessBalls * frac / 6) * 6);
    if (lost > 0) {
      log(m, 'session', lost >= sessEnd - m.ballsInDay ? `Rain. The whole session is washed out.` : `Rain delay: ${lost / 6} overs lost.`);
      m.ballsInDay += lost;
      m.lostOvers = (m.lostOvers || 0) + lost / 6;
    }
  }
  if (s % 3 === 2 && (w === 'Overcast' || w === 'Rain') && rnd() < 0.35) m.stumpsEarly = m.dayBalls - 6 * (4 + Math.floor(rnd() * 14));
}

function rollTime(m) {
  for (let guard = 0; guard < 6; guard++) {
    if (m.ballsInDay >= m.dayBalls) {
      sessionBreak(m, 2);
      m.day++; m.ballsInDay = 0; m.stumpsEarly = null;
      m.sessSeen = sessionIdx(m);
      m.teams.forEach(t => t.players.forEach(p => { p.energy = 100; p.spell = 0; }));
      m.endBowler = [null, null];
      if (m.day > m.days) { finish(m, -1, 'Match drawn'); return; }
      log(m, 'info', `Day ${m.day} under way. ${m.wx[sessionIdx(m)]}.`);
      startSessionWeather(m);
      continue;
    }
    const s = sessionIdx(m);
    if (s > m.sessSeen) {
      sessionBreak(m, (s - 1) % 3);
      m.sessSeen = s;
      m.teams.forEach(t => t.players.forEach(p => { p.energy = clamp(p.energy + 20, 0, 100); p.spell = 0; }));
      m.endBowler = [null, null];
      startSessionWeather(m);
      continue;
    }
    break;
  }
}

function sessionBreak(m, s) {
  if (m.quiet || !m.innings.length || m.phase === 'done') return;
  const name = ['Lunch', 'Tea', 'Stumps'][s];
  const inn = cur(m), bt = m.teams[inn.bat];
  let txt = `${name}, Day ${m.day}: ${bt.short} ${scoreLine(inn)} (${oversStr(inn.legal)} ov)`;
  if (!inn.closed) {
    const a = inn.cards[m.striker], b = inn.cards[m.nonStriker];
    txt += `. ${surname(bt.players[m.striker].name)} ${a.runs}*, ${surname(bt.players[m.nonStriker].name)} ${b.runs}*`;
  }
  log(m, 'session', txt + '. ' + situation(m) + '.');
}

function situation(m) {
  const inn = cur(m), n = m.innings.length;
  if (n === 4) { const need = m.target - inn.runs; return `${m.teams[inn.bat].short} need ${need} more with ${10 - inn.wkts} wickets left`; }
  const L = teamTotal(m, inn.bat) - teamTotal(m, inn.bowl);
  if (n === 1) return `${m.teams[inn.bat].short} batting first`;
  if (L > 0) return `${m.teams[inn.bat].short} lead by ${L}`;
  if (L < 0) return `${m.teams[inn.bat].short} trail by ${-L}`;
  return 'Scores level';
}

// ---------- Declarations / follow-on ----------
function aiDeclare(m) {
  const inn = cur(m), n = m.innings.length, O = oversLeft(m);
  if (n === 4) return;
  const L = teamTotal(m, inn.bat) - teamTotal(m, inn.bowl);
  const sc = m.days === 4 ? 0.85 : 1;
  let dec = false;
  if (n === 1) dec = inn.runs >= 620 * sc || (inn.runs >= 540 * sc && inn.wkts >= 7);
  if (n === 2) dec = L >= 250 && inn.runs >= 550 * sc && O < 200 * sc;
  if (n === 3) dec = (O > 150 * sc && L >= 650 * sc) || (O <= 150 * sc && O >= 45 && L >= declareTarget(O, m)) || (O >= 20 && O < 45 && L >= 4 * O + 60);
  if (dec) declare(m);
}
function declare(m) {
  const inn = cur(m);
  inn.declared = true; inn.declDay = m.day; m.declareRequested = false;
  log(m, 'info', `DECLARATION! ${m.teams[inn.bat].name} declare on ${inn.wkts}/${inn.runs}.`);
  endInnings(m, 'declared');
}

function endInnings(m, why) {
  const inn = cur(m); inn.closed = true;
  inn.cards.forEach(c => { if (c.status === 'batting') { c.status = 'notout'; c.how = 'not out'; } });
  const n = m.innings.length, bt = m.teams[inn.bat];
  if (why === 'allout') log(m, 'innings', `${bt.name} all out for ${inn.runs} (${oversStr(inn.legal)} ov).`);
  if (n === 1) { startInnings(m, inn.bowl, false); return; }
  if (n === 2) {
    const lead = m.innings[0].runs - inn.runs, leader = m.innings[0].bat;
    const foLimit = m.days === 4 ? 150 : 200;
    if (lead >= foLimit) {
      if (leader === m.user) { m.pending = { kind: 'followon', lead }; m.phase = 'decide'; return; }
      followOnDecision(m, lead >= 300 || oversLeft(m) < 210 * m.days / 5);
      return;
    }
    startInnings(m, leader, false); return;
  }
  if (n === 3) {
    const t3 = inn.bat, other = inn.bowl, diff = teamTotal(m, other) - teamTotal(m, t3);
    if (diff > 0) { finish(m, other, `${m.teams[other].name} win by an innings and ${diff} runs`); return; }
    m.target = -diff + 1;
    startInnings(m, other, false); return;
  }
  const need = m.target - 1 - inn.runs;
  if (need === 0) finish(m, -1, 'Match tied!');
  else finish(m, inn.bowl, `${m.teams[inn.bowl].name} win by ${need} run${need === 1 ? '' : 's'}`);
}

function followOnDecision(m, enforce) {
  const leader = m.innings[0].bat;
  m.pending = null; m.phase = 'live';
  log(m, 'info', enforce ? `${m.teams[leader].name} enforce the follow-on!` : `${m.teams[leader].name} decide not to enforce the follow-on, and will bat again.`);
  startInnings(m, enforce ? 1 - leader : leader, enforce);
}

function finish(m, winner, text) {
  if (m.phase === 'done') return;
  m.phase = 'done'; m.result = { winner, text };
  if (m.innings.length) cur(m).cards.forEach(c => { if (c.status === 'batting') { c.status = 'notout'; c.how = 'not out'; } });
  log(m, 'result', text + '.');
}

// ---------- Sim controls ----------
function simUntil(m, unit, n) {
  if (m.lo) return loSimUntil(m, unit, n);
  const start = { inns: m.innings.length, sess: sessionIdx(m), day: m.day, ev: m.events.length };
  const od0 = m.oversDone;
  m.lastWicketFlag = false;
  let guard = 0;
  while (m.phase === 'live' && guard++ < 6000) {
    simBall(m);
    if (m.phase !== 'live') break;
    if (unit === 'ball') break;
    const od = m.oversDone - od0;
    if (unit === 'over' && od >= 1) break;
    if (unit === 'overs' && od >= n) break;
    if (unit === 'session' && sessionIdx(m) !== start.sess) break;
    if (unit === 'day' && m.day !== start.day) break;
    if (unit === 'innings' && m.innings.length !== start.inns) break;
    if (m.stopOnWicket && m.lastWicketFlag && unit !== 'over') break;
    if (m.pauseEachOver && od >= 1 && cur(m).bowl === m.user && m.teams[m.user].bowlMode === 'manual' && unit !== 'over') break;
  }
  return m.events.length - start.ev;
}
function simQuick(m) {
  if (m.lo) return loSimQuick(m);
  // AI vs AI: resolve toss/follow-on and run to the end
  for (let g = 0; g < 20 && m.phase !== 'done'; g++) {
    if (m.phase === 'decide') { if (m.pending.kind === 'toss') tossDecision(m, 'bat'); else followOnDecision(m, true); }
    simUntil(m, 'match');
  }
}

const Engine = { K, WX, WX_ICON, createMatch, tossDecision, followOnDecision, simUntil, simQuick, simBall, overall, overallRaw, potential, batRating, bowlRating, fieldRating,
  oversStr, scoreLine, teamTotal, oversLeft, surname, isPace, situation, autoApproach, approachOf, cur, effBowl, wear, setPlan, fieldOf, maxSpell, wxNow, sessionIdx, mov };
if (typeof module !== 'undefined') { global.CLIMATE = require('./data.js').CLIMATE; module.exports = Engine; }
