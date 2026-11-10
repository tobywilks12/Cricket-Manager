// ===== LIMITED-OVERS ENGINE (ODI and T20) =====
const LO = {
  odi: { overs: 50, cap: 10, pp: 10, death: 40, w0: 0.0175, p1: 0.31, p2: 0.07, p4: 0.097, p6: 0.023, wd: 0.016, par: 5.6, name: 'ODI' },
  t20: { overs: 20, cap: 4, pp: 6, death: 15, w0: 0.0235, p1: 0.31, p2: 0.07, p4: 0.093, p6: 0.031, wd: 0.022, par: 7.9, name: 'T20' },
};
const LOK = { off: -4, up: 0.025, run: 0.011 };
const LO_COMPS = ['odi', 't20i', 'odc', 'bbl'];
const fmtOfComp = comp => comp === 'odi' || comp === 'odc' ? 'odi' : 't20';

// ---------- White-ball ratings ----------
const wbo = (p, f, k) => p.wbo && p.wbo[f] ? p.wbo[f][k] : 0;
function wbBat(p, f) { return wbBatRaw(p, f) + wbo(p, f, 'bat'); }
function wbBowl(p, f) { return p.bowl ? wbBowlRaw(p, f) + wbo(p, f, 'bowl') : 0; }
function wbBatRaw(p, f) {
  const b = p.bat, reg = (b.off + b.on) / 2, pw = b.power != null ? b.power : b.agg * 0.6 + 30, fn = b.finish != null ? b.finish : (b.tech + b.agg) / 2;
  return f === 't20' ? b.tech * 0.08 + b.conc * 0.06 + b.vPace * 0.12 + b.vSpin * 0.12 + reg * 0.06 + pw * 0.3 + fn * 0.2 + b.agg * 0.06
    : b.tech * 0.17 + b.conc * 0.13 + b.vPace * 0.15 + b.vSpin * 0.15 + reg * 0.08 + pw * 0.12 + fn * 0.17 + b.agg * 0.03;
}
function wbBowlRaw(p, f) {
  if (!p.bowl) return 0; const w = p.bowl, dt = w.death != null ? w.death : w.skill - 5, vr = w.vars != null ? w.vars : w.skill - 3;
  return f === 't20' ? w.skill * 0.3 + w.acc * 0.15 + mov(w) * 0.05 + dt * 0.25 + vr * 0.25 : w.skill * 0.4 + w.acc * 0.2 + mov(w) * 0.1 + dt * 0.15 + vr * 0.15;
}
function wbOverallRaw(p, f) {
  const bat = wbBat(p, f), bowl = wbBowl(p, f), fl = fieldRating(p);
  if (p.role === 'BAT') return bat * 0.9 + fl * 0.1;
  if (p.role === 'BOWL') return bowl * 0.92 + fl * 0.08;
  if (p.role === 'AR') { const hi = Math.max(bat, bowl), lo = Math.min(bat, bowl); return Math.max(hi * 0.55 + lo * 0.45 + 3 + (fl - 80) * 0.05, bat * 0.9 + fl * 0.1, bowl * 0.92 + fl * 0.08); }
  return bat * 0.7 + p.keep * 0.3;
}
// fit the white-ball trait so the player's rating matches the real-life assessment
function fitWBO(p) {
  const T = typeof WB_TARGET !== 'undefined' && WB_TARGET[p.name];
  p.wbo = { odi: { bat: 0, bowl: 0 }, t20: { bat: 0, bowl: 0 } };
  if (!T) return p;
  ['odi', 't20'].forEach((f, k) => {
    for (let it = 0; it < 6; it++) {
      const d = T[k] - wbOverallRaw(p, f); if (Math.abs(d) < 0.3) break;
      const o = p.wbo[f], bat = wbBat(p, f), bowl = wbBowl(p, f);
      if (p.role === 'BOWL') o.bowl += d / 0.92;
      else if (p.role === 'AR' && p.bowl) { if (bowl > bat + 4) o.bowl += d / 0.92; else if (bat > bowl + 4) o.bat += d / 0.9; else { o.bat += d; o.bowl += d; } }
      else if (p.role === 'WK') o.bat += d / 0.7;
      else o.bat += d / 0.9;
    }
    p.wbo[f].bat = Math.round(p.wbo[f].bat * 10) / 10; p.wbo[f].bowl = Math.round(p.wbo[f].bowl * 10) / 10;
  });
  return p;
}
function wbOverall(p, f) { return clamp(Math.round(wbOverallRaw(p, f)), 1, 99); }
function wbPotential(p, f) { const o = wbOverall(p, f), to = overall(p), h = potential(p) - to; if (p.wbOnly) return clamp(o + h, 1, 99); return clamp(Math.round(Math.max(o, o + h * clamp((97 - o) / Math.max(1, 97 - to), 0, 1.2))), 1, 99); }
function fmtOVR(p, f) { return f === 'test' ? overall(p) : wbOverall(p, f); }
function fmtPOT(p, f) { return f === 'test' ? potential(p) : wbPotential(p, f); }

// ---------- Setup ----------
function createMatchLO(o) {
  const F = LO[o.fmt];
  const m = {
    lo: true, fmt: o.fmt, F,
    teams: [makeTeam(o.home, o.xi[o.home], o.TEAMS, null, o.labels && o.labels[o.home], o.captains && o.captains[o.home]), makeTeam(o.away, o.xi[o.away], o.TEAMS, null, o.labels && o.labels[o.away], o.captains && o.captains[o.away])],
    venue: o.venue, venueKey: o.venueKey, user: o.userTeam === o.home ? 0 : (o.userTeam === o.away ? 1 : -1),
    neutral: !!o.neutral, quiet: !!o.quiet, comp: o.comp || (o.fmt === 'odi' ? 'odi' : 't20i'), title: o.title || '',
    maxOvers: F.overs, cap: F.cap, superOver: o.superOver !== false, knockout: !!o.knockout,
    day: 1, days: 1, dayBalls: 1e6, sessBalls: 1e9, ballsInDay: 0, innings: [], events: [], phase: 'toss', pending: null, result: null,
    endBowler: [null, null], end: 0, overBalls: 0, overRuns: 0, overLog: [], ballAge: 0, stopOnWicket: false, oversDone: 0,
    fstats: [{}, {}], injuries: [], freeHit: false, lastBowler: null,
  };
  m.teams.forEach(t => t.players.forEach(p => { p.rest = 0; }));
  const host = o.venue.home || o.home;
  const wx0 = genWeather(host, 2);
  m.wx = wx0; m.forecast = wx0.slice();
  // rain before the start: reduced match or abandoned
  if (wx0[0] === 'Rain' && rnd() < 0.7) {
    if (rnd() < 0.12) { m.abandoned = true; }
    else { m.maxOvers = o.fmt === 'odi' ? 25 + Math.floor(rnd() * 21) : 8 + Math.floor(rnd() * 10); m.cap = Math.ceil(m.maxOvers / 5); m.reduced = true; }
  }
  m.dn = o.fmt === 't20' || rnd() < 0.7; // day-night
  m.tossWinner = rnd() < 0.5 ? 0 : 1;
  if (m.abandoned) { log(m, 'session', `Rain. The match at ${m.venue.name} is abandoned without a ball bowled.`); m.phase = 'done'; m.result = { winner: -1, text: 'No result (rain)', nr: true }; return m; }
  log(m, 'info', `${m.teams[m.tossWinner].name} win the toss at ${m.venue.name}.${m.reduced ? ` Rain has delayed the start: ${m.maxOvers} overs a side.` : ''}`);
  if (m.tossWinner === m.user) { m.pending = { kind: 'toss' }; m.phase = 'decide'; }
  else loToss(m, (m.venue.pace >= 3 || wx0[0] === 'Overcast' || (m.dn && rnd() < 0.5)) && rnd() < 0.6 ? 'bowl' : 'bat');
  return m;
}
function loToss(m, choice) {
  const w = m.tossWinner, batFirst = choice === 'bat' ? w : 1 - w;
  log(m, 'info', `${m.teams[w].name} have chosen to ${choice} first.`);
  m.pending = null; m.phase = 'live';
  loStartInnings(m, batFirst);
}
function loStartInnings(m, bat, so) {
  const n = m.innings.length, t = m.teams[bat];
  let order = t.order.slice();
  if (so) order = t.order.slice().sort((a, b) => (t.players[b].bat.power + t.players[b].bat.finish) - (t.players[a].bat.power + t.players[a].bat.finish)).slice(0, 3).concat(t.order.filter(i => false));
  const inn = { bat, bowl: 1 - bat, runs: 0, wkts: 0, legal: 0, extras: { b: 0, lb: 0, w: 0, nb: 0 },
    cards: t.players.map(() => ({ runs: 0, balls: 0, fours: 0, sixes: 0, status: 'dnb', how: '', bowler: null })),
    bowling: {}, bowlOrder: [], fow: [], declared: false, closed: false, part: { runs: 0, balls: 0 }, num: n + 1, order: so ? order.concat(t.order.filter(i => !order.includes(i))) : order,
    maxBalls: so ? 6 : m.maxOvers * 6, maxW: so ? 2 : 10, so: !!so };
  m.innings.push(inn);
  m.striker = inn.order[0]; m.nonStriker = inn.order[1]; m.nextIn = 2;
  inn.cards[m.striker].status = 'batting'; inn.cards[m.nonStriker].status = 'batting';
  m.ballAge = 0; m.endBowler = [null, null]; m.end = 0; m.overBalls = 0; m.overRuns = 0; m.overLog = []; m.lastBowler = null; m.prevSameEnd = null; m.freeHit = false;
  m.teams[1 - bat].players.forEach(p => { p.spell = 0; p.rest = 0; p.soUsed = false; });
  if (so) log(m, 'innings', `SUPER OVER: ${t.name} bat first${n === 3 ? `, needing ${m.target}` : ''}.`);
  else if (n === 0) log(m, 'innings', `${t.name} to bat. ${m.maxOvers} overs.`);
  else log(m, 'innings', `${t.name} need ${m.target} to win from ${m.maxOvers} overs.${m.dn ? ' Under lights.' : ''}`);
  m.endBowler[0] = loChooseBowler(m);
}

// ---------- Situation ----------
const loInn = m => m.innings[m.innings.length - 1];
const loChasing = m => loInn(m).num % 2 === 0;
function loPhase(m) {
  const inn = loInn(m), ov = Math.floor(inn.legal / 6), F = m.F, mo = inn.maxBalls / 6;
  if (inn.so) return 'death';
  const pp = Math.max(1, Math.round(F.pp * mo / F.overs)), death = Math.round(mo * F.death / F.overs);
  return ov < pp ? 'pp' : ov >= death ? 'death' : 'mid';
}
function loAutoIntent(m) {
  const inn = loInn(m), F = m.F, t20 = m.fmt === 't20';
  if (inn.so) return 2.1;
  const ballsLeft = inn.maxBalls - inn.legal, total = inn.maxBalls, used = inn.legal / total, wl = 10 - inn.wkts;
  const ov = inn.legal / 6, mo = total / 6, death0 = mo * F.death / F.overs;
  let I;
  const ph = loPhase(m);
  if (ph === 'pp') I = t20 ? 1.3 : 1.02;
  else if (ph === 'mid') I = t20 ? 1.18 + used * 0.25 : 0.93 + Math.max(0, used - 0.5) * 0.6;
  else I = (t20 ? 1.55 : 1.3) + (ov - death0) / Math.max(1, mo - death0) * (t20 ? 0.6 : 0.65);
  // wickets in hand
  const expW = 10 * Math.pow(used, 1.25) * (t20 ? 0.75 : 0.85);
  I *= clamp(1 - (inn.wkts - expW) * (t20 ? 0.045 : 0.07), 0.62, 1.18);
  if (wl <= 2 && ballsLeft > (t20 ? 18 : 60)) I *= 0.8;
  if (ballsLeft <= (t20 ? 12 : 30)) I = Math.max(I, 1.5);
  if (loChasing(m)) {
    const need = m.target - inn.runs, rrr = need / Math.max(1, ballsLeft) * 6;
    const res = loResource(ballsLeft / 6 * (50 / (t20 ? 20 : 50)), inn.wkts);
    const parRate = F.par * (0.55 + 0.6 * res);
    let Ic = Math.pow(rrr / Math.max(3, parRate), 0.85);
    Ic *= clamp(0.85 + wl * 0.03, 0.85, 1.15);
    I = clamp(I * 0.35 + Ic * 0.75, 0.6, 2.3);
    if (need <= 6) I = Math.min(I, 1.1);
  }
  return clamp(I, 0.55, 2.3);
}
function loIntent(m) {
  const inn = loInn(m), t = m.teams[inn.bat];
  let I = loAutoIntent(m);
  if (inn.bat === m.user && t.approach !== 'auto') I *= t.approach === 'defend' ? 0.78 : t.approach === 'attack' ? 1.28 : 1;
  return I;
}
function loApproachLabel(I) { return I < 0.85 ? 'consolidate' : I < 1.15 ? 'rotate' : I < 1.5 ? 'aggressive' : 'all-out attack'; }
function loFieldOf(m) {
  const inn = loInn(m), t = m.teams[inn.bowl];
  if (inn.bowl === m.user && t.field !== 'auto') return t.field;
  const ph = loPhase(m);
  if (ph === 'pp') return 'attack';
  if (loChasing(m) && m.target - inn.runs < 20) return 'defend';
  if (ph === 'death') return 'defend';
  return 'normal';
}
// simplified Duckworth-Lewis-Stern resource table: overs left (ODI scale), wickets lost
function loResource(u, w) {
  if (w >= 10) return 0;
  const z0 = Math.pow(1 - w / 10, 0.7), b = 0.032 * (1 + w * 0.17);
  const r = z0 * (1 - Math.exp(-b * u)) / (1 - Math.exp(-0.032 * 50));
  return clamp(r, 0, 1);
}

// ---------- Effectiveness ----------
function loEffBat(m, p, bowler, batIdx) {
  const b = p.bat, pace = isPace((bowler.bowl || PT).type), ph = loPhase(m), t20 = m.fmt === 't20';
  const reg = (b.off + b.on) / 2, mu = pace ? b.vPace : b.vSpin;
  let e = t20 ? b.tech * 0.1 + mu * 0.33 + b.conc * 0.05 + reg * 0.1 + b.finish * 0.17 + b.power * 0.25
    : b.tech * 0.18 + mu * 0.34 + b.conc * 0.12 + reg * 0.1 + b.finish * 0.18 + b.power * 0.08;
  if (ph === 'death') e += (b.finish - 75) * 0.12 + (b.power - 75) * 0.08;
  e += wbo(p, m.fmt, 'bat');
  e += m.venue.flat * 0.5 + (m.dn && loChasing(m) ? 0.4 : 0);
  if (isHome(m, batIdx)) e += 1;
  e += (p.form || 0) * 0.22 + (p.morale != null ? (p.morale - 60) * 0.04 : 0) + (m.teams[batIdx].lb || 0);
  return e;
}
function loEffBowl(m, p, bowlIdx, phOverride) {
  const w = p.bowl || PT, ph = phOverride || loPhase(m), pace = isPace(w.type);
  const dt = w.death != null ? w.death : w.skill - 8, vr = w.vars != null ? w.vars : w.skill - 8;
  let e;
  if (ph === 'death') e = w.skill * 0.3 + w.acc * 0.15 + dt * 0.35 + vr * 0.2;
  else if (ph === 'pp') e = w.skill * 0.42 + w.acc * 0.2 + mov(w) * (pace ? 0.25 : 0.1) + vr * (pace ? 0.13 : 0.28);
  else e = w.skill * 0.42 + w.acc * 0.28 + mov(w) * 0.1 + vr * 0.2;
  const v = m.venue, wx = (m.wx && m.wx[Math.min(1, m.innings.length - 1)]) || 'Sunny';
  if (pace) { e += v.pace * 0.5 + (ph === 'pp' && (wx === 'Overcast' || wx === 'Humid') ? (w.swing - 70) * 0.08 : 0) + (ph === 'pp' ? 1 : 0); }
  else { e += v.spin * 0.7 - 1 + (ph === 'mid' ? 1.2 : ph === 'pp' ? -1 : -0.5) + (m.dn && m.innings.length === 2 ? -0.8 : 0); }
  if (!p.bowl) e -= 4; else e += wbo(p, m.fmt, 'bowl');
  if (isHome(m, bowlIdx)) e += 1;
  e += (p.form || 0) * 0.22 + (p.morale != null ? (p.morale - 60) * 0.04 : 0) + (m.teams[bowlIdx].lb || 0);
  return e;
}

// ---------- Bowling plan ----------
const loOvers = (inn, i) => (inn.bowling[i] ? Math.floor(inn.bowling[i].legal / 6) : 0);
function loMaxSpell(m, p) {
  const pace = p.bowl && isPace(p.bowl.type);
  if (m.fmt === 't20') return pace ? (p.spellNew ? 3 : 2) : 4;
  return pace ? (p.spellNew ? 6 : 4) : 8;
}
function loCanBowl(m, p, inn) {
  if (p.hurt) return false;
  if (inn.so) return !p.soUsed || m.overBalls > 0;
  return loOvers(inn, p.idx) < m.cap;
}
function loChooseBowler(m) {
  const inn = loInn(m), team = m.teams[inn.bowl], last = m.lastBowler, cur0 = m.endBowler[m.end];
  const ok = p => p.idx !== last && loCanBowl(m, p, inn);
  if (inn.bowl === m.user && team.bowlMode === 'manual') {
    const want = team.plan[0];
    if (want != null && ok(team.players[want])) { const p = team.players[want]; if (p.idx !== cur0) { p.spell = 0; p.spellNew = inn.legal < 60; } return want; }
  }
  const ovDone = Math.floor(inn.legal / 6), oversLeft = inn.maxBalls / 6 - ovDone;
  const ph = loPhase(m), mo = inn.maxBalls / 6, death0 = Math.round(mo * m.F.death / m.F.overs);
  const cap = inn.so ? 1 : m.cap;
  const bowlers = team.players.filter(p => p.bowl && ok(p));
  // death specialists to keep overs for
  const dRank = team.players.filter(p => p.bowl).sort((a, b) => loEffBowl(m, b, inn.bowl, 'death') - loEffBowl(m, a, inn.bowl, 'death')).slice(0, 3).map(p => p.idx);
  const deathLeft = Math.max(0, mo - Math.max(ovDone, death0));
  let best = null, bs = -1e9;
  bowlers.forEach(p => {
    const used = loOvers(inn, p.idx), left = cap - used;
    let s = loEffBowl(m, p, inn.bowl) + rnd() * 2.5 * clamp(1.6 - (team.lead || 60) / 100, 0.5, 1.3);
    if (p.bowl.skill < 62) s -= 6;
    // spells: continue from the same end, otherwise rest
    const continuing = m.prevSameEnd === p.idx;
    if (continuing && p.spell < loMaxSpell(m, p)) s += 2.5;
    if (continuing && p.spell >= loMaxSpell(m, p) && ph !== 'death') s -= 9;
    if (!continuing && p.rest > 0 && ph !== 'death') s -= 4;
    // save the death bowlers
    const rank = dRank.indexOf(p.idx);
    if (ph !== 'death' && rank >= 0 && !inn.so) {
      const keep = m.fmt === 't20' ? [2, 2, 1][rank] : [3, 3, 2][rank];
      const need = Math.min(keep, Math.ceil(deathLeft / 2));
      if (left - 1 < need) s -= 7;
    }
    // workload: do not burn through quotas too fast
    s -= Math.max(0, used / cap - (ovDone + 1) / mo - 0.12) * 14;
    if (s > bs) { bs = s; best = p.idx; }
  });
  // feasibility: everyone else must still be able to finish the innings
  if (best == null || (!inn.so && oversLeft > 1 && bowlers.filter(p => p.idx !== best).reduce((a, p) => a + cap - loOvers(inn, p.idx), 0) + (cap - loOvers(inn, best) - 1) < oversLeft - 1)) {
    const cands = bowlers.slice().sort((a, b) => (cap - loOvers(inn, b.idx)) - (cap - loOvers(inn, a.idx)));
    if (cands.length) best = cands[0].idx;
  }
  if (best == null) { // part-timers
    const pt = team.players.filter(p => p.idx !== last && !p.hurt && loOvers(inn, p.idx) < cap).sort((a, b) => bowlRating(b) - bowlRating(a));
    best = (pt[0] || team.players.find(p => p.idx !== last) || team.players[0]).idx;
  }
  const bp = team.players[best];
  if (best !== cur0) { bp.spell = 0; bp.spellNew = inn.legal < 60; }
  return best;
}
function loSetPlan(m, idx) {
  const t = m.teams[m.user]; t.plan[0] = idx;
  const inn = loInn(m);
  if (m.phase === 'live' && inn.bowl === m.user && t.bowlMode === 'manual' && m.overBalls === 0 && idx !== m.lastBowler && loCanBowl(m, t.players[idx], inn)) {
    if (m.endBowler[m.end] !== idx) { t.players[idx].spell = 0; t.players[idx].spellNew = inn.legal < 60; }
    m.endBowler[m.end] = idx;
  }
}

// ---------- Ball ----------
function loBall(m) {
  if (m.phase !== 'live') return;
  const inn = loInn(m), bt = m.teams[inn.bat], bw = m.teams[inn.bowl], F = m.F;
  if (m.endBowler[m.end] == null) m.endBowler[m.end] = loChooseBowler(m);
  const bowler = bw.players[m.endBowler[m.end]];
  const bat = bt.players[m.striker], card = inn.cards[m.striker];
  const fig = inn.bowling[bowler.idx] || (inn.bowling[bowler.idx] = { legal: 0, runs: 0, wkts: 0, maidens: 0, dots: 0 });
  if (!inn.bowlOrder.includes(bowler.idx)) inn.bowlOrder.push(bowler.idx);
  const bb = bowler.bowl || PT, ph = loPhase(m);
  const accF = 1.75 - bb.acc / 100 + (ph === 'death' ? 0.15 : 0);
  const r0 = rnd();
  if (r0 < F.wd * accF) { inn.runs++; inn.extras.w++; fig.runs++; m.overRuns++; inn.part.runs++; m.overLog.push('wd'); loCheck(m); return; }
  if (r0 < F.wd * accF + 0.0045 * accF) {
    const extra = rnd() < 0.25 ? (rnd() < 0.5 ? 4 : 1) : 0;
    inn.runs += 1 + extra; inn.extras.nb++; card.runs += extra; fig.runs += 1 + extra; m.overRuns += 1 + extra; inn.part.runs += 1 + extra;
    if (extra === 4) card.fours++;
    m.overLog.push('nb'); m.freeHit = true;
    log(m, 'info', `No-ball from ${surname(bowler.name)}. Free hit coming up.`);
    loCheck(m); return;
  }
  inn.legal++; m.ballAge++; m.overBalls++; fig.legal++; card.balls++; inn.part.balls++;
  const free = m.freeHit; m.freeHit = false;
  const I = loIntent(m);
  const d = clamp(loEffBat(m, bat, bowler, inn.bat) - loEffBowl(m, bowler, inn.bowl) + LOK.off, -24, 24);
  const b = card.balls - 1;
  const setM = b < 6 ? 1.3 : b < 15 ? 1.08 : b < 40 ? 1 : 0.92;
  const fld = loFieldOf(m);
  const fW = fld === 'attack' ? 1.12 : fld === 'defend' ? 0.9 : 1, fR = fld === 'attack' ? 1.1 : fld === 'defend' ? 0.86 : 1;
  const pW = F.w0 * Math.exp(-LOK.up * d) * Math.pow(I, 1.65) * setM * fW * (0.85 + bat.bat.agg / 400) * (ph === 'pp' && isPace(bb.type) ? 1.08 : 1);
  if (!free && rnd() < pW) { loWicket(m, bowler, bat, fig, I); loCheck(m); return; }
  if (rnd() < (0.0016 + (110 - avgGround(bw)) * 0.00002) * Math.pow(I, 1.2)) { loRunOut(m, bowler); loCheck(m); return; }
  const mult = Math.exp(LOK.run * d) * fR;
  const ppB = ph === 'pp' ? 1.3 : ph === 'death' ? 1.08 : 1;
  const pw = bat.bat.power, fn = bat.bat.finish;
  const B = mult * Math.pow(I * (free ? 1.5 : 1), 1.35) * (0.62 + pw / 220) * ppB * (1 + m.venue.flat * 0.03);
  const S = clamp(Math.sqrt(mult) * Math.pow(I, 0.45) * (0.72 + fn / 300) * (fld === 'defend' ? 1.08 : 1), 0.4, 1.35);
  let p4 = F.p4 * B * (1.12 - pw / 400), p6 = F.p6 * B * Math.pow(pw / 76, 1.6) * Math.pow(I, 0.6) * (ppB > 1.2 ? 0.8 : 1);
  let p1 = F.p1 * S, p2 = F.p2 * S * (0.7 + fn / 250), p3 = 0.005 * S;
  const tot = p1 + p2 + p3 + p4 + p6;
  if (tot > 0.93) { const k = 0.93 / tot; p1 *= k; p2 *= k; p3 *= k; p4 *= k; p6 *= k; }
  const r = rnd(); let runs = 0, acc = 0;
  const vals = [1, 2, 3, 4, 6], pr = [p1, p2, p3, p4, p6];
  for (let i = 0; i < 5; i++) { acc += pr[i]; if (r < acc) { runs = vals[i]; break; } }
  if (runs === 0 && rnd() < 0.02) {
    const x = rnd() < 0.8 ? 1 : 4, lb = rnd() < 0.75;
    inn.runs += x; inn.part.runs += x; inn.extras[lb ? 'lb' : 'b'] += x; m.overLog.push(x + (lb ? 'lb' : 'b'));
    if (x % 2) swapStrike(m);
  } else {
    if (runs === 0) fig.dots++;
    loAddRuns(m, runs, bat, bowler, fig, card);
  }
  if (rnd() < 0.00008) hurt(m, bat, inn.bat, pick(['a hamstring strain', 'a blow to the hand']));
  loCheck(m);
}
function loAddRuns(m, runs, bat, bowler, fig, card) {
  const inn = loInn(m), before = card.runs, pB = inn.part.runs;
  inn.runs += runs; card.runs += runs; fig.runs += runs; m.overRuns += runs; inn.part.runs += runs; bat.matchRuns += runs;
  m.overLog.push(runs === 0 ? '·' : String(runs));
  if (runs === 4) { card.fours++; boundaryText(m, bat, bowler, 4); }
  if (runs === 6) { card.sixes++; boundaryText(m, bat, bowler, 6); }
  for (const ms of [50, 100, 150, 200]) if (before < ms && card.runs >= ms) log(m, 'mile', `${ms === 50 ? 'Fifty' : ms === 100 ? 'HUNDRED' : ms + ''} for ${bat.name}! ${card.runs} off ${card.balls} balls.`, { team: inn.bat });
  for (const ms of [50, 100, 150, 200]) if (pB < ms && inn.part.runs >= ms && ms >= (m.fmt === 't20' ? 50 : 100)) log(m, 'mile', `${ms} partnership between ${surname(m.teams[inn.bat].players[m.striker].name)} and ${surname(m.teams[inn.bat].players[m.nonStriker].name)}.`, { team: inn.bat });
  if (runs % 2 === 1) swapStrike(m);
}
function loWicket(m, bowler, bat, fig, I) {
  const inn = loInn(m), bw = m.teams[inn.bowl], pace = isPace((bowler.bowl || PT).type), keeper = bw.players[bw.keeper];
  const kinds = ['cb', 'field', 'deep', 'bowled', 'lbw', 'st', 'cab'];
  const hi = Math.min(2, I);
  const w = pace ? [16, 22, 12 + hi * 14, 15, 11, 0, 2] : [6, 18, 14 + hi * 14, 14, 15, 7, 3];
  const k = pickW(kinds, w);
  const B = surname(bowler.name), N = surname(bat.name);
  let how, txt;
  if (k === 'cb' || k === 'field' || k === 'deep' || k === 'cab') {
    const f = k === 'cb' ? keeper : k === 'cab' ? bowler : pickFielder(bw, [bowler.idx, bw.keeper], k === 'field');
    const drop = k === 'cb' ? (100 - f.keep) / 300 : k === 'deep' ? (100 - f.field) / 160 : (100 - f.field) / 240;
    if (rnd() < drop) { fstat(m, inn.bowl, f.idx).drops++; log(m, 'drop', `DROPPED! ${N} ${k === 'deep' ? 'skies it' : 'edges it'} and ${f.name} puts it down. ${N} on ${inn.cards[m.striker].runs}.`, { team: inn.bowl }); m.overLog.push('·'); return; }
    fstat(m, inn.bowl, f.idx).ct++;
    const F_ = surname(f.name);
    if (k === 'cab') { how = `c & b ${B}`; txt = `Caught and bowled by ${B}!`; }
    else if (k === 'cb') { how = `c ${F_} b ${B}`; txt = `Thin edge and ${F_} takes it behind.`; }
    else if (k === 'deep') { how = `c ${F_} b ${B}`; txt = `Goes for the big one and ${F_} takes it ${pick(['at long-on', 'at deep midwicket', 'on the rope at long-off', 'at deep square leg', 'running in from third man', 'at deep cover'])}.`; }
    else { how = `c ${F_} b ${B}`; txt = `Picks out ${F_} at ${pick(['cover', 'point', 'mid-off', 'mid-on', 'short fine leg', 'backward point', 'short third'])}.`; }
  } else if (k === 'bowled') { how = `b ${B}`; txt = pick(['Bowled him! Yorker crashes into the stumps.', 'Clean bowled, swinging across the line.', 'Through the gate and bowled.']); }
  else if (k === 'lbw') { how = `lbw b ${B}`; txt = pick(['Trapped in front!', 'Given lbw, missed the sweep.', 'Plumb lbw.']); }
  else { fstat(m, inn.bowl, bw.keeper).st++; how = `st ${surname(keeper.name)} b ${B}`; txt = `Down the track, beaten, and ${surname(keeper.name)} completes the stumping.`; }
  fig.wkts++; bowler.matchWkts++;
  inn.cards[m.striker].bowler = bowler.idx;
  loOut(m, m.striker, how, `${B} to ${N}, OUT! ${txt}`);
  if (fig.wkts === (m.fmt === 't20' ? 4 : 5)) log(m, 'mile', `${fig.wkts} wickets for ${bowler.name}!`, { team: inn.bowl });
}
function loRunOut(m, bowler) {
  const bw = m.teams[loInn(m).bowl], f = pickFielder(bw, [bowler.idx]);
  fstat(m, loInn(m).bowl, f.idx).ro++;
  const who = rnd() < 0.5 ? m.striker : m.nonStriker;
  loOut(m, who, `run out (${surname(f.name)})`, `RUN OUT! Pushing for a tight one and ${surname(f.name)} hits.`);
}
function loOut(m, who, how, txt) {
  const inn = loInn(m), bt = m.teams[inn.bat], c = inn.cards[who];
  c.status = 'out'; c.how = how; inn.wkts++;
  inn.fow.push({ wkt: inn.wkts, runs: inn.runs, name: bt.players[who].name, over: oversStr(inn.legal) });
  m.overLog.push('W'); m.lastWicketFlag = true;
  log(m, 'wkt', `${txt} ${surname(bt.players[who].name)} ${c.runs} (${c.balls}).`, { team: inn.bowl });
  inn.part = { runs: 0, balls: 0 };
  if (inn.wkts >= inn.maxW || m.nextIn >= inn.order.length) { m.innsOver = true; return; }
  const next = inn.order[m.nextIn++];
  inn.cards[next].status = 'batting';
  if (who === m.striker) m.striker = next; else m.nonStriker = next;
}

// ---------- Over and innings end ----------
function loCheck(m) {
  if (m.phase !== 'live') return;
  const inn = loInn(m);
  const chase = inn.num % 2 === 0;
  if (chase && inn.runs >= m.target) { loEndInnings(m); return; }
  if (m.innsOver || inn.wkts >= inn.maxW) { m.innsOver = false; loEndInnings(m); return; }
  if (m.overBalls < 6) return;
  const bw = m.teams[inn.bowl], bowler = bw.players[m.endBowler[m.end]], fig = inn.bowling[bowler.idx];
  m.oversDone++;
  if (m.overRuns === 0 && fig) fig.maidens++;
  bowler.spell++; if (inn.so) bowler.soUsed = true;
  bw.players.forEach(p => { if (p !== bowler) { if (p.idx === m.endBowler[1 - m.end]) return; p.rest = (p.rest || 0) + 1; if (p.rest >= 3) p.spell = 0; } });
  bowler.rest = 0;
  if (bowler.bowl && isPace(bowler.bowl.type) && rnd() < 0.0006 * (bowler.prone || 1)) hurt(m, bowler, inn.bowl, pick(['a hamstring strain', 'a side strain', 'an ankle injury']));
  m.lastOver = { bowler: bowler.name, log: m.overLog.slice() };
  m.prevSameEnd = m.endBowler[1 - m.end];
  m.lastBowler = bowler.idx;
  m.overBalls = 0; m.overRuns = 0; m.overLog = [];
  swapStrike(m);
  m.end = 1 - m.end;
  if (inn.legal >= inn.maxBalls) { loEndInnings(m); return; }
  // rain during the chase (DLS)
  if (chase && !inn.so && m.wx[1] === 'Rain' && !m.rainHit && inn.legal >= inn.maxBalls * 0.4 && rnd() < 0.06) { m.rainHit = true; loRainEnd(m); return; }
  m.endBowler[m.end] = loChooseBowler(m);
}
function loRainEnd(m) {
  const inn = loInn(m), sc = 50 / m.maxOvers;
  const used = 1 - loResource((inn.maxBalls - inn.legal) / 6 * sc, inn.wkts);
  const par = Math.round((m.target - 1) * used);
  log(m, 'session', `Rain! Play is abandoned. ${m.teams[inn.bat].short} are ${inn.runs}/${inn.wkts}; the DLS par score is ${par}.`);
  inn.closed = true; inn.cards.forEach(c => { if (c.status === 'batting') { c.status = 'notout'; c.how = 'not out'; } });
  if (inn.runs > par) loFinish(m, inn.bat, `${m.teams[inn.bat].name} win by ${10 - inn.wkts} wickets (DLS method)`);
  else if (inn.runs < par) loFinish(m, inn.bowl, `${m.teams[inn.bowl].name} win by ${par - inn.runs} runs (DLS method)`);
  else loFinish(m, -1, 'Match tied (DLS method)');
}
function loEndInnings(m) {
  const inn = loInn(m); inn.closed = true;
  inn.cards.forEach(c => { if (c.status === 'batting') { c.status = 'notout'; c.how = 'not out'; } });
  const bt = m.teams[inn.bat];
  if (!inn.so) log(m, 'innings', `${bt.name} ${inn.wkts >= 10 ? 'all out for ' + inn.runs : 'finish on ' + inn.runs + '/' + inn.wkts} (${oversStr(inn.legal)} ov).`);
  if (inn.num === 1) { m.target = inn.runs + 1; loStartInnings(m, inn.bowl); return; }
  if (inn.num === 3) { m.target = inn.runs + 1; loStartInnings(m, inn.bowl, true); return; }
  // second innings or super over finished
  if (inn.runs >= m.target) {
    const left = inn.maxBalls - inn.legal;
    loFinish(m, inn.bat, inn.so ? `Match tied. ${bt.name} win the Super Over` : `${bt.name} win by ${inn.maxW - inn.wkts} wicket${inn.maxW - inn.wkts === 1 ? '' : 's'}${left ? ` (${left} ball${left === 1 ? '' : 's'} left)` : ''}`);
    return;
  }
  const short = m.target - 1 - inn.runs;
  if (short > 0) { loFinish(m, inn.bowl, inn.so ? `Match tied. ${m.teams[inn.bowl].name} win the Super Over` : `${m.teams[inn.bowl].name} win by ${short} run${short === 1 ? '' : 's'}`); return; }
  // tie
  if (inn.so) {
    if ((m.soCount || 1) >= 3) { loFinish(m, inn.bowl, `Match tied. ${m.teams[inn.bowl].name} win on boundary count`); return; }
    m.soCount = (m.soCount || 1) + 1;
    log(m, 'innings', 'The Super Over is tied too! Another one.');
    const first = inn.bat;
    m.innings.splice(2, 2);
    m.target = null; loStartInnings(m, first, true);
    return;
  }
  if (m.superOver) { log(m, 'innings', 'Scores are level. MATCH TIED! We go to a Super Over.'); m.target = null; loStartInnings(m, inn.bat, true); return; }
  loFinish(m, -1, 'Match tied');
}
function loFinish(m, winner, text) {
  if (m.phase === 'done') return;
  m.phase = 'done'; m.result = { winner, text, tie: /tied/.test(text) };
  if (m.innings.length) loInn(m).cards.forEach(c => { if (c.status === 'batting') { c.status = 'notout'; c.how = 'not out'; } });
  log(m, 'result', text + '.');
}

// ---------- Sim controls ----------
function loSimUntil(m, unit, n) {
  const ev = m.events.length, od0 = m.oversDone, inns0 = m.innings.length;
  m.lastWicketFlag = false;
  let g = 0;
  while (m.phase === 'live' && g++ < 2000) {
    loBall(m);
    if (m.phase !== 'live' || unit === 'ball') break;
    const od = m.oversDone - od0;
    if (unit === 'over' && od >= 1) break;
    if (unit === 'overs' && od >= n) break;
    if (unit === 'innings' && m.innings.length !== inns0) break;
    if (unit === 'phase' && m.overBalls === 0 && od >= 1 && (() => { const inn = loInn(m), ov = inn.legal / 6, mo = inn.maxBalls / 6; return ov === Math.max(1, Math.round(m.F.pp * mo / m.F.overs)) || ov === Math.round(mo * m.F.death / m.F.overs); })()) break;
    if (m.stopOnWicket && m.lastWicketFlag && unit !== 'over') break;
    if (m.pauseEachOver && od >= 1 && loInn(m).bowl === m.user && m.teams[m.user].bowlMode === 'manual' && unit !== 'over') break;
  }
  return m.events.length - ev;
}
function loSimQuick(m) {
  for (let g = 0; g < 10 && m.phase !== 'done'; g++) {
    if (m.phase === 'decide') loToss(m, 'bat');
    loSimUntil(m, 'match');
  }
}
function loSituation(m) {
  const inn = loInn(m);
  if (!inn) return '';
  if (inn.so) return inn.num === 4 ? `Super Over: ${m.teams[inn.bat].short} need ${m.target - inn.runs} from ${inn.maxBalls - inn.legal} balls` : `Super Over: ${m.teams[inn.bat].short} batting first`;
  if (inn.num === 2) { const need = m.target - inn.runs, b = inn.maxBalls - inn.legal; return `${m.teams[inn.bat].short} need ${need} from ${b} ball${b === 1 ? '' : 's'} · req. rate ${(need / Math.max(1, b) * 6).toFixed(2)}`; }
  return `${m.teams[inn.bat].short} batting first · run rate ${inn.legal ? (inn.runs / inn.legal * 6).toFixed(2) : '0.00'} · projected ${inn.legal >= 30 ? Math.round(inn.runs + inn.runs / inn.legal * (inn.maxBalls - inn.legal) * 1.08) : '-'}`;
}

Object.assign(Engine, { fitWBO, LO, wbBat, wbBowl, wbOverall, wbOverallRaw, wbPotential, fmtOVR, fmtPOT, createMatchLO, loToss, loSimUntil, loSimQuick, loSituation, loIntent, loApproachLabel, loFieldOf, loSetPlan, loPhase, LO_COMPS, fmtOfComp, loInn });
