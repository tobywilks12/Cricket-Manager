// ===== UI =====
const E = Engine, CR = Career;
const SAVE_KEY = 'cricketManagerCareer_v3';
let C = null;
let screen = 'title', tab = 'comm', showBoundaries = true, ui = {}, modalFn = null;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tName = code => (TEAMS[code] || STATES[code] || { name: code }).name;
const roleName = { BAT: 'Batter', BOWL: 'Bowler', AR: 'All-rounder', WK: 'Keeper' };
const bowlName = { RF: 'Right-arm fast', RFM: 'Right-arm fast-medium', RM: 'Right-arm medium', LF: 'Left-arm fast', LFM: 'Left-arm fast-medium', OB: 'Off spin', LB: 'Leg spin', SLA: 'Left-arm orthodox' };

function badge(v, extra) { const cls = v >= 85 ? 'b-elite' : v >= 75 ? 'b-gold' : v >= 65 ? 'b-silver' : 'b-bronze'; return `<span class="badge ${cls} ${extra || ''}">${v}</span>`; }
const ovrPot = (p, fmt) => { const o = E.fmtOVR(p, fmt || 'test'), q = E.fmtPOT(p, fmt || 'test'); return `${badge(o)}${q > o ? ' ' + badge(q, 'pot') : ''}`; };
const FN = { test: 'Test', odi: 'ODI', t20: 'T20I' }, FNP = { test: 'Tests', odi: 'ODIs', t20: 'T20Is' };
const fmtF = f => (f && f.fmt) || 'test';
const matchWord = f => fmtF(f) === 'test' ? 'Test' : f.wc ? 'Match' : FN[fmtF(f)];
const clubName = k => (BBL_CLUBS[k] || { name: k }).name;
const intlTag = p => p.intl === 'none' ? '<span class="tag">No international white-ball</span>' : p.intl === 't20' ? '<span class="tag">T20Is only</span>' : p.intl === 'odi' ? '<span class="tag">ODIs only (white ball)</span>' : '';
const styleTag = p => p.role === 'BOWL' ? (p.bat.agg >= 75 ? 'Swings the bat' : '') : p.bat.agg >= 80 ? 'Aggressive' : p.bat.agg <= 50 ? 'Watchful' : '';
const pl = (name, label) => `<a class="pl" data-pl="${esc(name)}">${esc(label || name)}</a>`;
function formTag(p) { const f = p.form || 0; return f >= 6 ? '<span class="fm hot">Hot</span>' : f >= 2.5 ? '<span class="fm good">Good</span>' : f <= -6 ? '<span class="fm cold">Cold</span>' : f <= -2.5 ? '<span class="fm poor">Poor</span>' : ''; }
const morTag = p => { const v = p.morale != null ? p.morale : 65, l = CR.moraleLabel(v); return `<span class="mor m${l.replace(' ', '')}" title="Morale ${Math.round(v)}">${l === 'Very unhappy' ? 'V.unhappy' : l}</span>`; };
const capTag = (n, fm) => { if (!C) return ''; const cc = !fm || fm === 'test' ? [C.captain, C.vice] : (C.captains && C.captains[fm]) || []; return cc[0] === n ? ' <span class="cap">C</span>' : cc[1] === n ? ' <span class="cap vc">VC</span>' : ''; };
const injTag = p => p.injury ? `<span class="inj" title="${esc(p.injury.what)}">INJ ${Math.ceil(p.injury.weeks)}w</span>` : '';
const avgS = s => s.inn - s.no > 0 ? (s.runs / (s.inn - s.no)).toFixed(2) : (s.inn ? '-' : '-');

// Saves are compressed (lz-string), about 7 times smaller than raw JSON. Old uncompressed saves still load.
const GAME_VERSION = '5.1', SAVE_VERSION = 5;
const CHANGELOG = [
  ['5.1', ['Saves are now compressed, so long careers fit comfortably in browser storage.', 'An automatic backup is kept before a save is upgraded to a new version.', 'Old domestic-only records of retired players are tidied away each season.', 'You get a warning if the browser ever refuses to save.']],
  ['5.0', ['ODIs and T20Is with separate squads, ratings and potentials.', 'One-Day Cup and Big Bash League.', 'ODI and T20 World Cups.', 'White-ball ICC rankings and stats.']],
];
let saveFailed = false;
const packSave = json => 'LZ1:' + LZString.compressToUTF16(json);
const unpackSave = raw => raw.startsWith('LZ1:') ? LZString.decompressFromUTF16(raw.slice(4)) : raw;
function save() {
  try { localStorage.setItem(SAVE_KEY, packSave(JSON.stringify(C))); if (saveFailed) { saveFailed = false; render(); } }
  catch (e) { if (!saveFailed) { saveFailed = true; setTimeout(render, 0); } }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
    const obj = JSON.parse(unpackSave(raw));
    if ((obj.v || 0) < SAVE_VERSION) { try { localStorage.setItem(SAVE_KEY + '_backup', raw); } catch (e) { } }
    return CR.migrate(obj);
  } catch (e) { return null; }
}
function restoreBackup() {
  const raw = localStorage.getItem(SAVE_KEY + '_backup'); if (!raw) return null;
  return CR.migrate(JSON.parse(unpackSave(raw)));
}
function saveCode() { return 'CM2:' + LZString.compressToEncodedURIComponent(JSON.stringify(C)); }
function readCode(code) {
  code = code.trim();
  const json = code.startsWith('CM2:') ? LZString.decompressFromEncodedURIComponent(code.slice(4)) : decodeURIComponent(escape(atob(code)));
  return CR.migrate(JSON.parse(json));
}

function go(s, extra) { screen = s; ui = Object.assign({}, extra || {}); modalFn = null; render(); window.scrollTo(0, 0); }
function render() {
  const fn = { title: vTitle, board: vBoard, goat: vGoat, hub: vHub, calendar: vCalendar, players: vPlayers, shield: vDomestic, stats: vStats, rankings: vRankings, squad: vSquadPick, series: vSeries, prematch: vPrematch, match: vMatch }[screen];
  $('#app').innerHTML = (screen === 'title' ? '' : nav()) + fn() + (modalFn ? modalFn() : '');
  bindAll();
}
function openModal(fn) { modalFn = fn; render(); }
function nav() {
  const items = [['hub', 'Hub'], ['calendar', 'Calendar'], ['board', 'Board'], ['players', 'Players'], ['shield', 'Domestic'], ['stats', 'Stats'], ['rankings', 'Rankings'], ['goat', 'GOAT']];
  return `<div class="nav"><span class="logo cond">CRICKET MANAGER</span>
    ${items.map(([k, l]) => `<button class="navb ${screen === k ? 'on' : ''}" data-go="${k}">${l}</button>`).join('')}
    ${C && C.match && screen !== 'match' ? '<button class="navb primary" data-go="match">Resume match</button>' : ''}
    <span class="navdate mute sm">${C && C.date ? CR.fmtDate(C.date) : ''}</span><button class="navb" id="saveBtn">Save code</button></div>
    ${saveFailed ? '<div class="savewarn">This browser refused to save your career (storage full or blocked). Click "Save code" and copy the code somewhere safe.</div>' : ''}`;
}

function confirmRestore() { return true; }
function whatsNew() {
  if (!C || C.seenVer === GAME_VERSION) return;
  const since = C.seenVer;
  const items = CHANGELOG.filter(([v]) => !since || v > since);
  C.seenVer = GAME_VERSION; save();
  if (!items.length) return;
  openModal(() => `<div class="modal-bg"><div class="modal wide"><h2>What's new</h2>${items.map(([v, l]) => `<h3>Version ${v}</h3><ul>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}<div class="btns"><button class="primary" id="mClose">Play</button></div></div></div>`);
}
// ================= TITLE =================
function vTitle() {
  const has = !!load();
  return `<div class="title-screen"><div class="tag">Tests · ODIs · T20Is · career mode</div><h1 class="big">CRICKET MANAGER</h1>
    <p class="mute">Head coach and chair of selectors, Australia, in all three formats. Plan the tours, chase World Cups, watch the Shield, One-Day Cup and Big Bash, and develop the next generation.</p>
    <div class="btns">${has ? '<button class="primary" id="cont">Continue career</button>' : ''}<button ${has ? '' : 'class="primary"'} id="newc">New career</button><button id="imp">Load save code</button></div>
    ${has ? '<p class="mute sm">Starting a new career replaces the one saved in this browser.</p>' : ''}
    ${localStorage.getItem(SAVE_KEY + '_backup') ? '<p class="mute sm">A backup from before the last update is kept. <a class="pl" id="restoreBk">Restore it</a></p>' : ''}
    <div id="loading" class="mute sm"></div><div class="mute sm" style="margin-top:18px">Version ${GAME_VERSION}</div></div>`;
}

// ================= HUB =================
function seriesScore(f) { const s = { us: 0, them: 0, d: 0 }; f.results.forEach(r => { if (r.winner === 'AUS') s.us++; else if (r.winner) s.them++; else s.d++; }); return s; }
function seriesLine(f) {
  const s = seriesScore(f);
  if (f.wc) { const t = f.t; if (t.stage === 'done') return t.champ === 'AUS' ? 'Australia are world champions!' : `${tName(t.champ)} won the title. Australia: ${['', 'out in the group stage', 'semi-finalists', 'runners-up'][CR.wcStage(f)]}`; return f.results.length ? `Australia ${s.us} won, ${s.them} lost${s.d ? `, ${s.d} no result` : ''}` : 'Not started'; }
  if (f.status === 'done') return s.us > s.them ? `Australia won ${s.us}-${s.them}` : s.them > s.us ? `${tName(f.opp)} won ${s.them}-${s.us}` : `Series drawn ${s.us}-${s.them}`;
  return f.results.length ? `Australia ${s.us}-${s.them} ${tName(f.opp)}${s.d ? ` (${s.d} drawn)` : ''}` : 'Not started';
}
function fixtureDesc(f) {
  const fm = fmtF(f);
  if (f.wc) return `${FNP[fm].replace('s', '')} World Cup · 12 teams`;
  if (f.neutral) return `v ${tName(f.opp)} at Lord's · 1 Test`;
  return `${f.home ? `${tName(f.opp)} tour Australia` : `Australia tour ${tName(f.opp)}`} · ${f.tests} ${f.tests > 1 ? FNP[fm] : FN[fm]}`;
}
function fixDate(w, f, i) { return CR.matchDate(w, f, i); }
function fixDateStr(w, f, i) { return fmtF(f) === 'test' ? CR.fmtRange(fixDate(w, f, i)) : CR.fmtDate(fixDate(w, f, i)); }

function vHub() {
  const w = CR.curWindow(C), f = curFixture(), all = CR.fixturesOf(w);
  let main;
  const legs = all.length > 1 ? `<div class="legs">${all.map(x => `<span class="leg ${x === f ? 'on' : x.status === 'done' ? 'done' : ''}"><span class="fb f-${fmtF(x)}">${FN[fmtF(x)]}</span> ${esc(x.title || (x.opp ? tName(x.opp) : ''))}${x.status === 'done' ? ' ✓' : ''}</span>`).join('<span class="mute">›</span>')}</div>` : '';
  if (f) {
    const btn = C.match ? '<button class="primary" data-go="match">Resume match</button>'
      : f.status === 'planned' ? '<button class="primary" id="pickSquad">Pick squad</button>'
      : '<button class="primary" data-go="series">Go to series</button>';
    main = `<div class="card hero"><div class="mute sm">${CR.seasonLabel(w.season)} · ${esc(w.label)} · ${esc(w.months)}</div>${legs}
      <h2><span class="fb f-${fmtF(f)}">${FN[fmtF(f)]}</span> ${esc(f.title || fixtureDesc(f))}</h2><div class="mute">${fixtureDesc(f)}</div>
      <div class="venues">${f.venues.map((v, i) => `<span class="tag ${i < f.results.length ? 'done' : ''}">${i + 1}. ${f.wc ? 'v ' + esc(tName(f.matches[i].opp)) + ', ' : ''}${esc(VENUES[v].name.split(',')[0])}</span>`).join(' ')}</div>
      <div class="mute sm" style="margin-top:8px">${f.venues.map((v, i) => `${matchWord(f)} ${i + 1}: ${fixDateStr(w, f, i)}`).join(' · ')}</div>
      ${f.exp ? `<div class="sm" style="margin-top:6px">Board target: <b>${esc(f.exp.text)}</b></div>` : ''}
      <div class="status" style="margin:10px 0">${seriesLine(f)}</div>${btn}</div>`;
  } else if (all.length) {
    main = `<div class="card hero"><div class="mute sm">${CR.seasonLabel(w.season)} · ${esc(w.label)}</div>${legs}<h2>All series complete</h2>
      ${all.map(x => `<div class="row"><span><span class="fb f-${fmtF(x)}">${FN[fmtF(x)]}</span> ${esc(x.title || fixtureDesc(x))}</span><span>${seriesLine(x)}</span></div>`).join('')}
      <div class="btns"><button class="primary" id="nextWin">Continue</button></div></div>`;
  } else if (w.past) {
    main = `<div class="card hero"><div class="mute sm">${CR.seasonLabel(w.season)} · ${esc(w.label)}</div><h2>${esc(w.label)}</h2><p>${esc(w.past)}</p><button class="primary" id="nextWin">Continue</button></div>`;
  } else {
    main = `<div class="card hero"><div class="mute sm">${CR.seasonLabel(w.season)} · ${esc(w.label)} · ${esc(w.months)}</div>
      <h2>No tour booked</h2><p class="mute">This window is free. Book a Test, ODI or T20I series, or rest the players. The domestic competitions and other nations' series go on either way.</p>
      <div class="btns"><button class="primary" data-plan="${w.key}">Plan a tour</button><button id="skipWin">Skip window</button></div></div>`;
  }
  const upcoming = C.windows.slice(C.ptr + 1, C.ptr + 5).map(x => { const fx = CR.fixturesOf(x);
    return `<div class="row"><span><span class="mute sm">${CR.seasonLabel(x.season)} · ${esc(x.label)}</span><br>${fx.length ? fx.map(y => `<span class="fb f-${fmtF(y)}">${FN[fmtF(y)]}</span> ${esc(y.title || fixtureDesc(y))}`).join('<br>') : x.event ? `<span class="mute">${esc(x.event.name)}</span>` : x.wtc ? '<span class="mute">Final if you finish top two</span>' : '<span class="mute">Open</span>'}</span>
    ${x.wtc || x.noTour ? '' : `<button class="sm" data-plan="${x.key}|">Plan</button>`}</div>`; }).join('');
  const lad = CR.shieldLadder(C).map((l, i) => `<div class="row sm"><span>${i + 1}. ${l.s}</span><span class="mono">${l.p}p · ${l.pts.toFixed(2)}</span></div>`).join('');
  const wt = CR.wtcSorted(C).slice(0, 5).map((r, i) => `<div class="row sm"><span>${i + 1}. ${tName(r.t)}</span><span class="mono">${r.pct.toFixed(1)}%</span></div>`).join('');
  const nw = C.news.slice(0, 14).map(n => `<div class="news ${n.type}"><span class="mute sm">${esc(n.when)}</span><div>${esc(n.text)}</div></div>`).join('');
  return `<div class="wrap"><div class="grid3">${main}
    <div><div class="card"><h3>Board confidence</h3>${confBar(C.board.conf)}
      ${C.contractRound ? '<div class="warn" style="margin-top:8px">Contract renewals are due. <a class="pl" data-go="board">Review on the Board screen</a></div>' : ''}
      ${!C.captain ? '<div class="warn">You have no Test captain. <a class="pl" data-go="board">Name one</a></div>' : `<div class="mute sm" style="margin-top:6px">Captain ${esc(C.captain)}${C.vice ? ' · Vice ' + esc(C.vice) : ''}</div>`}</div>
    <div class="card" style="margin-top:14px"><h3>Coming up</h3>${upcoming}</div></div></div>
    <div class="grid3" style="margin-top:14px"><div class="card"><h3>News</h3>${nw}</div>
    <div><div class="card"><h3>Sheffield Shield ${CR.seasonLabel(C.shield.y)}</h3>${lad}${C.shield.champ ? `<div class="ok">Champions: ${STATES[C.shield.champ].name}</div>` : ''}</div>
    <div class="card" style="margin-top:14px"><h3>One-Day Cup and BBL</h3><div class="grid2c"><div>${CR.ladderSorted(C.odc.ladder).slice(0, 4).map((l, i) => `<div class="row sm"><span>${i + 1}. ${l.s}</span><span class="mono">${l.pts}</span></div>`).join('')}${C.odc.champ ? `<div class="ok sm">${STATES[C.odc.champ].name}</div>` : ''}</div>
      <div>${C.bbl.played.length ? CR.ladderSorted(C.bbl.ladder).slice(0, 4).map((l, i) => `<div class="row sm"><span>${i + 1}. ${esc(clubName(l.s).split(' ').pop())}</span><span class="mono">${l.pts}</span></div>`).join('') : '<div class="mute sm">BBL starts in December</div>'}${C.bbl.champ ? `<div class="ok sm">${esc(clubName(C.bbl.champ))}</div>` : ''}</div></div></div>
    <div class="card" style="margin-top:14px"><h3>WTC ${C.wtc.cycle}</h3>${wt}</div></div></div></div>`;
}

// ================= CALENDAR =================
function vCalendar() {
  const seasons = [...new Set(C.windows.map(w => w.season))];
  return `<div class="wrap"><h2 style="margin-bottom:6px">Calendar</h2><p class="mute">Book tours like the board does: Tests, ODIs and T20Is. Home summers are at home, winter and spring are tours away, the late summer can be either. A window can hold one series of each format. World Cups and the WTC Final are fixed.</p>
  ${seasons.map(y => `<div class="card" style="margin-bottom:12px"><h3>${CR.seasonLabel(y)}</h3>
    ${C.windows.filter(w => w.season === y).map(w => { const i = C.windows.indexOf(w), past = i < C.ptr, now = i === C.ptr, fx = CR.fixturesOf(w);
      const canAdd = !past && !w.wtc && !w.noTour && ['test', 'odi', 't20'].some(fm => !fx.some(f => fmtF(f) === fm));
      return `<div class="calrow ${past ? 'past' : ''} ${now ? 'now' : ''}"><div><b>${esc(w.label)}</b> <span class="mute sm">${esc(w.months)}</span>${now ? ' <span class="tag on">Now</span>' : ''}</div>
      <div>${fx.length ? fx.map(f => { const locked = past || f.wc || f.fixed || f.final || f.status !== 'planned';
        return `<div class="calfx"><span><span class="fb f-${fmtF(f)}">${FN[fmtF(f)]}</span> ${esc(f.title || fixtureDesc(f))}<div class="mute sm">${fixtureDesc(f)} · ${f.wc ? 'hosts ' + w.event.host.map(tName).join(' and ') : f.venues.map(v => esc(VENUES[v].name.split(',')[0])).join(', ')}${f.status !== 'planned' ? ' · ' + seriesLine(f) : ''}</div></span>
          <span class="right">${locked ? '' : `<button class="sm" data-plan="${w.key}|${fmtF(f)}">Edit</button> <button class="sm" data-cancel="${w.key}|${fmtF(f)}">Cancel</button>`}</span></div>`; }).join('')
        : `<span class="mute">${w.past ? esc(w.past) : w.event ? `${esc(w.event.name)} in ${w.event.host.map(tName).join(' and ')}. Australia's squad is named when it arrives.` : w.wtc ? 'World Test Championship Final' : past ? 'No series' : 'Open'}</span>`}</div>
      <div class="right">${canAdd ? `<button class="sm ${fx.length ? '' : 'primary'}" data-plan="${w.key}|">${fx.length ? 'Add series' : 'Plan tour'}</button>` : ''}</div></div>`; }).join('')}</div>`).join('')}</div>`;
}
function planModal(key) {
  const [wk, fm0] = key.split('|');
  const w = C.windows.find(x => x.key === wk), fx = CR.fixturesOf(w);
  const free = ['test', 'odi', 't20'].filter(fm => !fx.some(f => fmtF(f) === fm));
  const editF = fm0 ? fx.find(f => fmtF(f) === fm0) : null;
  const st = ui.plan || (ui.plan = editF ? { fmt: fm0, opp: editF.opp, home: editF.home, tests: editF.tests, venues: editF.venues.slice(), title: editF.title, when: editF.when || 'post', edit: true }
    : { fmt: free[0] || 'test', opp: (fx[0] && fx[0].opp) || 'IND', home: fx[0] ? fx[0].home : w.type !== 'away', tests: free[0] === 'test' || !free[0] ? 3 : 3, venues: null, title: '', when: 'post' });
  if (w.type === 'home') st.home = true; if (w.type === 'away') st.home = false;
  const lo = st.fmt !== 'test';
  const host = st.home ? 'AUS' : st.opp, vlist = lo ? CR.venuesOfLO(host) : CR.venuesOf(host);
  if (!st.venues || st.venues.length !== st.tests || !st.venues.every(v => VENUES[v].home === host)) st.venues = lo ? CR.defaultVenuesLO(host, st.tests, st.fmt) : CR.defaultVenues(host, st.tests);
  const fmts = st.edit ? [st.fmt] : free;
  const hasTests = !!w.fixture && st.fmt !== 'test';
  return `<div class="modal-bg"><div class="modal wide"><h2>Plan ${lo ? 'series' : 'tour'} · ${esc(w.label)} ${CR.seasonLabel(w.season)}</h2>
    <div class="form">
      <label>Format<select id="pFmt" ${st.edit ? 'disabled' : ''}>${fmts.map(fm => `<option value="${fm}" ${fm === st.fmt ? 'selected' : ''}>${FNP[fm]}</option>`).join('')}</select></label>
      <label>Opponent<select id="pOpp">${CR.NATIONS.filter(n => n !== 'AUS').map(n => `<option value="${n}" ${n === st.opp ? 'selected' : ''}>${tName(n)} (${FN[st.fmt]} rank ${rankOf(n, st.fmt)})</option>`).join('')}</select></label>
      <label>Where<select id="pHome" ${w.type !== 'either' ? 'disabled' : ''}><option value="1" ${st.home ? 'selected' : ''}>Home (in Australia)</option><option value="0" ${!st.home ? 'selected' : ''}>Away (in ${tName(st.opp)})</option></select></label>
      <label>${FNP[st.fmt]}<select id="pTests">${[1, 2, 3, 4, 5].map(n => `<option ${n === st.tests ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${hasTests ? `<label>When<select id="pWhen"><option value="pre" ${st.when === 'pre' ? 'selected' : ''}>Before the Tests</option><option value="post" ${st.when !== 'pre' ? 'selected' : ''}>After the Tests</option></select></label>` : ''}
      <label>Series name<input id="pTitle" value="${esc(st.title)}" placeholder="Optional, e.g. The Ashes"></label></div>
    <p class="mute sm">${lo ? 'White-ball series move the ODI or T20I rankings and give your limited-overs players games. They count less with the board than Tests.' : (CR.WTC_TEAMS.includes(st.opp) ? 'Counts towards the World Test Championship.' : 'Not part of the World Test Championship.') + ' Away tours develop young players faster.'}</p>
    <h3 style="margin-top:8px">Venues</h3>
    ${st.venues.map((v, i) => `<div class="row"><span class="mute">${FN[st.fmt]} ${i + 1}</span><select data-pv="${i}">${vlist.map(k => `<option value="${k}" ${k === v ? 'selected' : ''}>${esc(VENUES[k].name)}</option>`).join('')}</select></div>`).join('')}
    <div class="btns"><button class="primary" id="pSave">Book ${lo ? 'series' : 'tour'}</button><button id="mClose">Cancel</button></div></div></div>`;
}
function rankOf(code, fmt) { const T = !fmt || fmt === 'test' ? C.trank : C.trankWB[fmt]; return Object.entries(T).sort((a, b) => b[1] - a[1]).findIndex(([t]) => t === code) + 1; }

// ================= PLAYERS =================
const st_ = (n, k) => (C.stats[n] || {})[k];
const srS = s => s && s.balls ? (s.runs / s.balls * 100).toFixed(1) : '-';
const ecS = s => s && s.bBalls ? (s.bRuns / s.bBalls * 6).toFixed(2) : '-';
function vPlayers() {
  const code = ui.code || 'AUS', st = ui.st || 'ALL', q = (ui.q || '').toLowerCase(), role = ui.role || 'ALL', fm = ui.fmt || 'test';
  let list = C.players[code].filter(p => (code !== 'AUS' || st === 'ALL' || p.state === st) && (role === 'ALL' || p.role === role) && (!q || p.name.toLowerCase().includes(q)));
  const sk = ui.sk || 'ovr', comp = CR.FMT_COMP[fm];
  const keyF = { ovr: p => E.fmtOVR(p, fm), pot: p => E.fmtPOT(p, fm), age: p => -p.age, form: p => p.form || 0, runs: p => (st_(p.name, comp) || {}).runs || 0, wk: p => (st_(p.name, comp) || {}).wk || 0,
    sruns: p => ((fm === 'test' ? C.shield : fm === 'odi' ? C.odc : C.bbl).stats[p.name] || {}).runs || 0, swk: p => ((fm === 'test' ? C.shield : fm === 'odi' ? C.odc : C.bbl).stats[p.name] || {}).wk || 0 }[sk] || (p => E.fmtOVR(p, fm));
  list = list.sort((a, b) => keyF(b) - keyF(a));
  const th = (k, l, cls) => `<th class="${cls || ''} sortable ${sk === k ? 'on' : ''}" data-psort="${k}">${l}</th>`;
  const dom = fm === 'test' ? 'Shield' : fm === 'odi' ? 'ODC' : 'BBL', domS = fm === 'test' ? C.shield.stats : fm === 'odi' ? C.odc.stats : C.bbl.stats;
  return `<div class="wrap"><div class="top"><h2>Players</h2><div class="filters">
    <div class="tabs" style="margin:0">${['test', 'odi', 't20'].map(f => `<button data-pfmt="${f}" class="${fm === f ? 'on' : ''}">${FN[f]}</button>`).join('')}</div>
    <select id="natSel">${CR.NATIONS.map(n => `<option value="${n}" ${n === code ? 'selected' : ''}>${tName(n)}</option>`).join('')}</select>
    ${code === 'AUS' ? `<select id="stSel"><option value="ALL">All states</option>${CR.STATE_CODES.map(s => `<option value="${s}" ${s === st ? 'selected' : ''}>${STATES[s].name}</option>`).join('')}</select>` : ''}
    <select id="roleSel">${['ALL', 'BAT', 'BOWL', 'AR', 'WK'].map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${r === 'ALL' ? 'All roles' : roleName[r]}</option>`).join('')}</select>
    <input id="pq" value="${esc(ui.q || '')}" placeholder="Search"></div></div>
  <p class="mute sm">Every player has separate Test, ODI and T20 ratings and potentials. White-ball ratings add power hitting, finishing, death bowling and variations to the core skills.</p>
  <div class="card scroll"><table><tr><th>Player</th>${th('age', 'Age', 'n')}${code === 'AUS' ? '<th>State</th>' : ''}<th>Role</th>${th('ovr', FN[fm] + ' OVR')}${th('pot', 'POT')}<th class="mute">Other formats</th>${th('form', 'Form')}<th>Style</th>
    <th class="n">${FNP[fm]}</th>${th('runs', 'Runs', 'n')}<th class="n">Avg</th>${fm !== 'test' ? '<th class="n">SR</th>' : ''}${th('wk', 'Wkts', 'n')}${fm !== 'test' ? '<th class="n">Econ</th>' : ''}${code === 'AUS' || fm === 't20' ? th('sruns', dom + ' runs', 'n') + th('swk', dom + ' wkts', 'n') : ''}</tr>
  ${list.map(p => { const s = st_(p.name, comp), ss = domS[p.name], others = ['test', 'odi', 't20'].filter(f => f !== fm);
    return `<tr><td>${pl(p.name)} ${injTag(p)}${p.regen ? ' <span class="tag">regen</span>' : ''}${p.wbOnly && fm === 'test' ? ' <span class="tag">white-ball only</span>' : ''}</td><td class="n">${p.age}</td>${code === 'AUS' ? `<td>${p.state || ''}</td>` : ''}<td>${p.role}</td><td>${badge(E.fmtOVR(p, fm))}</td><td>${badge(E.fmtPOT(p, fm), 'pot')}</td>
    <td class="sm mute">${others.map(f => `${FN[f]} ${E.fmtOVR(p, f)}`).join(' · ')}</td><td>${formTag(p)}</td>
    <td class="sm mute">${[styleTag(p), p.bowl ? p.bowl.type : ''].filter(Boolean).join(' · ')}</td>
    <td class="n">${s ? s.m : 0}</td><td class="n">${s ? s.runs : '-'}</td><td class="n">${s ? avgS(s) : '-'}</td>${fm !== 'test' ? `<td class="n">${srS(s)}</td>` : ''}<td class="n">${s ? s.wk : '-'}</td>${fm !== 'test' ? `<td class="n">${ecS(s)}</td>` : ''}
    ${code === 'AUS' || fm === 't20' ? `<td class="n">${ss ? ss.runs : '-'}</td><td class="n">${ss ? ss.wk : '-'}</td>` : ''}</tr>`; }).join('')}</table></div></div>`;
}

// ---------- Player profile ----------
function bar(label, v) { const x = Math.round(v); const cls = x >= 85 ? 'e' : x >= 75 ? 'g' : x >= 65 ? 's' : 'b'; return `<div class="attr"><span>${label}</span><span class="abar"><i class="${cls}" style="width:${x}%"></i></span><b>${x}</b></div>`; }
function profileModal(name) {
  const p = CR.P_(C, name);
  if (!p) return `<div class="modal-bg"><div class="modal"><p>${esc(name)} has retired.</p><button id="mClose">Close</button></div></div>`;
  const b = p.bat, w = p.bowl, st = C.stats[name] || {};
  const pr = C.prank[name], club = CR.bblClubOf(C, name);
  const statRow = (lab, s, lo) => s && s.m ? `<tr><td>${lab}</td><td class="n">${s.m}</td><td class="n">${s.inn}</td><td class="n">${s.runs}</td><td class="n">${s.hs}${s.hsNo ? '*' : ''}</td><td class="n">${avgS(s)}</td><td class="n">${srS(s)}</td><td class="n">${s.h100}/${s.h50}</td><td class="n">${s.wk}</td><td class="n">${s.wk ? (s.bRuns / s.wk).toFixed(2) : '-'}</td><td class="n">${lo ? ecS(s) : '-'}</td><td class="n">${s.bw ? s.bw + '/' + s.br : '-'}</td><td class="n">${s.ct}${s.st ? '+' + s.st + 'st' : ''}</td></tr>` : '';
  const hist = (p.hist || []).map(h => `<span class="tag">${h.y}: ${h.o}/${h.p}</span>`).join(' ');
  const fmBox = f => `<div class="fbox"><div class="mute sm">${FN[f]}</div><div>${badge(E.fmtOVR(p, f))} ${badge(E.fmtPOT(p, f), 'pot')}</div></div>`;
  const wr = f => { const r = C.prankWB && C.prankWB[f][name]; return r && C.ptr - r.last <= 6 ? `${FN[f]} bat ${r.bat}${r.bowl ? ' · bowl ' + r.bowl : ''}` : ''; };
  const ranks = [pr ? `Test bat ${pr.bat}${pr.bowl ? ' · bowl ' + pr.bowl : ''}` : '', wr('odi'), wr('t20')].filter(Boolean).join('<br>');
  return `<div class="modal-bg"><div class="modal xl"><div class="top"><div><h2>${esc(p.name)}</h2>
    <div class="mute">${tName(p.nat)}${p.state ? ' · ' + STATES[p.state].name : ''}${club ? ' · ' + esc(clubName(club)) : ''} · Age ${p.age} · ${roleName[p.role]} · ${p.hand === 'L' ? 'Left' : 'Right'}-handed bat${w ? ' · ' + bowlName[w.type] : ''}</div>
    <div style="margin-top:6px">${formTag(p)} ${morTag(p)} ${injTag(p)}${capTag(p.name)} ${p.nat === 'AUS' ? ((C.contracts || []).includes(p.name) ? '<span class="tag on">CA contract</span>' : '<span class="tag">No contract</span>') : ''} <span class="tag">Leadership ${Math.round(p.lead || 50)}</span> ${styleTag(p) ? `<span class="tag">${styleTag(p)}</span>` : ''} ${p.wbOnly ? '<span class="tag">White-ball only</span>' : ''} ${intlTag(p)} ${p.regen ? '<span class="tag">Regen</span>' : ''}</div></div>
    <div class="right"><div class="fboxes">${fmBox('test')}${fmBox('odi')}${fmBox('t20')}</div>${ranks ? `<div class="mute sm" style="margin-top:4px">ICC points: ${ranks}</div>` : ''}</div></div>
    <div class="grid3c">
      <div><h3>Batting</h3>${bar('Technique', b.tech)}${bar('Concentration', b.conc)}${bar('Vs pace', b.vPace)}${bar('Vs spin', b.vSpin)}${bar('Off side', b.off)}${bar('On side', b.on)}${bar('Aggression', b.agg)}${bar('Power hitting', b.power)}${bar('Finishing', b.finish)}</div>
      <div><h3>Bowling</h3>${w ? bar('Skill', w.skill) + bar('Accuracy', w.acc) + bar('Stamina', w.stam) + (E.isPace(w.type) ? bar('Swing', w.swing) + bar('Seam', w.seam) : bar('Turn', w.turn) + bar('Flight and drift', w.flight)) + bar('Death bowling', w.death) + bar('Variations', w.vars) : '<div class="mute">Does not bowl.</div>'}</div>
      <div><h3>Fielding</h3>${bar('Catching', p.field)}${bar('Ground and throw', p.ground)}${p.keep ? bar('Keeping', p.keep) : ''}
        <h3 style="margin-top:10px">Development</h3><div class="sm">${hist}</div><div class="mute sm" style="margin-top:4px">Peak so far: Test ${p.peak || E.overall(p)}${p.peakWB ? ' · white ball ' + p.peakWB : ''}</div></div></div>
    <h3 style="margin-top:12px">Career in this save</h3>
    <div class="scroll"><table><tr><th></th><th class="n">M</th><th class="n">Inn</th><th class="n">Runs</th><th class="n">HS</th><th class="n">Avg</th><th class="n">SR</th><th class="n">100/50</th><th class="n">Wkts</th><th class="n">Avg</th><th class="n">Econ</th><th class="n">Best</th><th class="n">Ct</th></tr>
    ${statRow('Tests', st.test)}${statRow('ODIs', st.odi, 1)}${statRow('T20Is', st.t20i, 1)}${statRow('Shield', st.shield)}${statRow('One-Day Cup', st.odc, 1)}${statRow('BBL', st.bbl, 1)}${statRow('Shield this season', C.shield.stats[name])}</table></div>
    ${(() => { const L = CR.goatLists(C), rb = L.bat.findIndex(r => r.name === name), rw = L.bowl.findIndex(r => r.name === name), pre = typeof PRESTATS !== 'undefined' && PRESTATS[name];
      return (pre || rb >= 0 || rw >= 0) ? `<div class="sm" style="margin:6px 0">${pre ? `Test career before this save: ${pre[0]} Tests, ${pre[1]} runs${pre[3] ? `, ${pre[3]} hundreds` : ''}${pre[4] ? `, ${pre[4]} wickets` : ''}. ` : ''}${rb >= 0 && rb < 100 ? `All-time Test batting rank: <b>No.${rb + 1}</b>. ` : ''}${rw >= 0 && rw < 100 ? `All-time Test bowling rank: <b>No.${rw + 1}</b>.` : ''}</div>` : ''; })()}
    ${['test', 'odi', 't20i'].map(k => { const s = st[k]; return s && s.recentBat.length ? `<div class="mute sm">Recent ${k === 'test' ? 'Test' : k === 'odi' ? 'ODI' : 'T20I'} scores: ${s.recentBat.slice(-6).join(', ')}${s.recentBowl.length ? ' · Bowling: ' + s.recentBowl.slice(-5).join(', ') : ''}</div>` : ''; }).join('')}
    <div class="btns"><button id="mClose">Close</button></div></div></div>`;
}

// ================= DOMESTIC =================
function vDomestic() {
  const d = ui.dom || 'shield';
  const tabs = `<div class="tabs" style="margin:0 0 12px">${[['shield', 'Sheffield Shield'], ['odc', 'One-Day Cup'], ['bbl', 'Big Bash League']].map(([k, l]) => `<button data-dom="${k}" class="${d === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const body = d === 'odc' ? vODC() : d === 'bbl' ? vBBL() : vShield();
  return body.replace('<div class="wrap">', '<div class="wrap">' + tabs);
}
function lbLeaders(stats, lo, nameF) {
  const leaders = f => Object.entries(stats).filter(([n, s]) => f(s) > 0).sort((a, b) => f(b[1]) - f(a[1])).slice(0, 10);
  const runs = leaders(s => s.runs), wk = leaders(s => s.wk);
  return `<div class="mute sm">Most runs</div>${runs.map(([n, s]) => `<div class="row sm"><span>${pl(n)} <span class="mute">${nameF(n)}</span></span><span class="mono">${s.runs} @ ${avgS(s)}${lo ? ` · SR ${srS(s)}` : ''}</span></div>`).join('') || '<div class="mute">-</div>'}
    <div class="mute sm" style="margin-top:8px">Most wickets</div>${wk.map(([n, s]) => `<div class="row sm"><span>${pl(n)} <span class="mute">${nameF(n)}</span></span><span class="mono">${s.wk} @ ${(s.bRuns / s.wk).toFixed(1)}${lo ? ` · econ ${ecS(s)}` : ''}</span></div>`).join('') || '<div class="mute">-</div>'}`;
}
function loLadder(L, nameF, top, extra) {
  return `<table><tr><th>Team</th><th class="n">P</th><th class="n">W</th><th class="n">L</th><th class="n">NR</th><th class="n">NRR</th><th class="n">Pts</th></tr>
    ${CR.ladderSorted(L).map((l, i) => `<tr class="${i < top ? 'top2' : ''}"><td>${nameF(l.s)}</td><td class="n">${l.p}</td><td class="n">${l.w}</td><td class="n">${l.l}</td><td class="n">${l.nr}</td><td class="n">${l.nrr >= 0 ? '+' : ''}${l.nrr.toFixed(3)}</td><td class="n"><b>${l.pts}</b></td></tr>`).join('')}</table>${extra || ''}`;
}
function resultsList(res, nameF) {
  const rounds = [...new Set(res.map(r => r.round))].sort((a, b) => b - a);
  return rounds.map(r => `<div class="mute sm" style="margin-top:8px">Round ${r}</div>${res.filter(x => x.round === r).map(x => `<div class="row sm"><span><b>${nameF(x.home)} v ${nameF(x.away)}</b> · ${esc(x.sc)}<br><span class="mute">${x.top.map(esc).join(' · ')}</span></span><span>${esc(x.text)}</span></div>`).join('')}`).join('') || '<div class="mute">No matches yet this season.</div>';
}
function vODC() {
  const o = C.odc, stOf = n => { const p = CR.P_(C, n); return p ? p.state || '' : ''; };
  const next = [0, 1, 2, 3, 4, 5, 6].find(r => !o.played.includes(r));
  return `<div class="wrap"><div class="top"><h2>One-Day Cup ${CR.seasonLabel(o.y)}</h2><span class="mute">${next != null ? `Next: round ${next + 1} of 7` : o.champ ? `Champions: ${STATES[o.champ].name}` : 'Final to come'}</span></div>
  <p class="mute">The 50-over state competition, played in spring and late summer. National players turn out when they are not on international duty. A strong One-Day Cup is the path to the ODI side.</p>
  <div class="grid3"><div class="card"><h3>Table</h3>${loLadder(o.ladder, s => `<a class="pl" data-state="${s}">${STATES[s].name}</a>`, 2, `<div class="mute sm" style="margin-top:6px">Win 4, no result 2, plus a bonus point for winning with a run rate 1.25 times the opposition's. Top two play the final.</div>${o.final ? `<div class="ok" style="margin-top:8px">Final: ${esc(o.final.text)} (${esc(o.final.sc)})</div>` : ''}`)}</div>
    <div class="card"><h3>Season leaders</h3>${lbLeaders(o.stats, true, stOf)}</div></div>
  <div class="card" style="margin-top:14px"><h3>Results</h3>${resultsList(o.results, s => s)}</div>
  <div class="card" style="margin-top:14px"><h3>Past champions</h3>${(C.odcHistory || []).slice(0, 10).map(h => `<span class="tag">${CR.seasonLabel(h.y)}: ${h.champ}</span>`).join(' ')}</div></div>`;
}
function vBBL() {
  const o = C.bbl, clubOf = n => { const k = CR.bblClubOf(C, n); return k ? clubName(k).split(' ').pop() : ''; };
  const next = o.rounds.findIndex((_, r) => !o.played.includes(r));
  return `<div class="wrap"><div class="top"><h2>BBL|${o.y - 2010} · ${CR.seasonLabel(o.y)}</h2><span class="mute">${!o.played.length ? 'Starts in December' : next >= 0 ? `Next: round ${next + 1} of 10` : o.champ ? `Champions: ${esc(clubName(o.champ))}` : 'Finals to come'}</span></div>
  <p class="mute">Eight clubs, ten games each, then the Qualifier, Knockout, Challenger and Final. Clubs can field three overseas players. Test players are usually away on national duty in December and January.</p>
  <div class="grid3"><div class="card"><h3>Ladder</h3>${loLadder(o.ladder, k => `<a class="pl" data-club="${k}">${esc(clubName(k))}</a>`, 4, `<div class="mute sm" style="margin-top:6px">Win 2, no result 1. Top four make the finals.</div>${o.finals.map(f => `<div class="row sm"><span><b>${f.stage}</b>: ${esc(clubName(f.home))} v ${esc(clubName(f.away))}</span><span>${esc(f.text)}</span></div>`).join('')}`)}</div>
    <div class="card"><h3>Season leaders</h3>${lbLeaders(o.stats, true, clubOf)}</div></div>
  <div class="card" style="margin-top:14px"><h3>Clubs</h3><div class="clubs">${CR.BBL_CODES.map(k => `<a class="tag pl" data-club="${k}">${esc(clubName(k))} (${o.clubs[k].squad.length})</a>`).join(' ')}</div></div>
  <div class="card" style="margin-top:14px"><h3>Results</h3>${resultsList(o.results, k => esc(clubName(k).split(' ').pop()))}</div>
  <div class="card" style="margin-top:14px"><h3>Past champions</h3>${(C.bblHistory || []).slice(0, 10).map(h => `<span class="tag">BBL|${h.y - 2010}: ${esc(clubName(h.champ))}</span>`).join(' ')}</div></div>`;
}
function clubModal(k) {
  const list = C.bbl.clubs[k].squad.map(n => CR.P_(C, n)).filter(Boolean).sort((a, b) => E.wbOverall(b, 't20') - E.wbOverall(a, 't20'));
  return `<div class="modal-bg"><div class="modal xl"><h2>${esc(clubName(k))}</h2><div class="mute sm" style="margin-bottom:8px">Home: ${esc(VENUES[BBL_CLUBS[k].home].name)} · ${list.filter(p => p.nat !== 'AUS').length} overseas</div><div class="scroll"><table><tr><th>Player</th><th>Nat</th><th class="n">Age</th><th>Role</th><th>T20 OVR</th><th>POT</th><th>Form</th><th class="n">BBL runs</th><th class="n">SR</th><th class="n">Wkts</th><th class="n">Econ</th></tr>
    ${list.map(p => { const ss = C.bbl.stats[p.name]; return `<tr><td>${pl(p.name)} ${injTag(p)}${p.nat !== 'AUS' ? ' <span class="tag">overseas</span>' : ''}</td><td>${p.nat}</td><td class="n">${p.age}</td><td>${p.role}</td><td>${badge(E.wbOverall(p, 't20'))}</td><td>${badge(E.wbPotential(p, 't20'), 'pot')}</td><td>${formTag(p)}</td><td class="n">${ss ? ss.runs : '-'}</td><td class="n">${srS(ss)}</td><td class="n">${ss ? ss.wk : '-'}</td><td class="n">${ecS(ss)}</td></tr>`; }).join('')}</table></div>
    <div class="btns"><button id="mClose">Close</button></div></div></div>`;
}

// ================= SHIELD =================
function vShield() {
  const sh = C.shield, lad = CR.shieldLadder(C);
  const rounds = [...new Set(sh.results.map(r => r.round))].sort((a, b) => b - a);
  const leaders = (k, f) => Object.entries(sh.stats).filter(([n, s]) => f(s) > 0).sort((a, b) => f(b[1]) - f(a[1])).slice(0, 10);
  const stOf = n => { const p = CR.P_(C, n); return p ? p.state : ''; };
  const runs = leaders('runs', s => s.runs), wk = leaders('wk', s => s.wk);
  const next = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find(r => !sh.played.includes(r));
  return `<div class="wrap"><div class="top"><h2>Sheffield Shield ${CR.seasonLabel(sh.y)}</h2><span class="mute">${next != null ? `Next: round ${next + 1}` : sh.champ ? `Champions: ${STATES[sh.champ].name}` : 'Final to come'}</span></div>
  <p class="mute">The Shield is where talent grows. Players develop fastest by playing and performing here. Test players return when they are not on national duty.</p>
  <div class="grid3"><div class="card"><h3>Ladder</h3><table><tr><th>State</th><th class="n">P</th><th class="n">W</th><th class="n">L</th><th class="n">D</th><th class="n">Pts</th></tr>
    ${lad.map((l, i) => `<tr class="${i < 2 ? 'top2' : ''}"><td><a class="pl" data-state="${l.s}">${STATES[l.s].name}</a></td><td class="n">${l.p}</td><td class="n">${l.w}</td><td class="n">${l.l}</td><td class="n">${l.d}</td><td class="n"><b>${l.pts.toFixed(2)}</b></td></tr>`).join('')}</table>
    <div class="mute sm" style="margin-top:6px">Win 6, draw 1, plus bonus points for first-innings runs over 200 and wickets after five. Top two play the final.</div>
    ${sh.final ? `<div class="ok" style="margin-top:8px">Final: ${esc(sh.final.text)} (${esc(sh.final.sc)})</div>` : ''}</div>
    <div class="card"><h3>Season leaders</h3>
      <div class="mute sm">Most runs</div>${runs.map(([n, s]) => `<div class="row sm"><span>${pl(n)} <span class="mute">${stOf(n)}</span></span><span class="mono">${s.runs} @ ${avgS(s)}</span></div>`).join('') || '<div class="mute">-</div>'}
      <div class="mute sm" style="margin-top:8px">Most wickets</div>${wk.map(([n, s]) => `<div class="row sm"><span>${pl(n)} <span class="mute">${stOf(n)}</span></span><span class="mono">${s.wk} @ ${(s.bRuns / s.wk).toFixed(1)}</span></div>`).join('') || '<div class="mute">-</div>'}</div></div>
  <div class="card" style="margin-top:14px"><h3>Results</h3>${rounds.map(r => `<div class="mute sm" style="margin-top:8px">Round ${r}</div>${sh.results.filter(x => x.round === r).map(x => `<div class="row sm"><span><b>${x.home} v ${x.away}</b> · ${esc(x.sc)}<br><span class="mute">${x.top.map(esc).join(' · ')}</span></span><span>${esc(x.text)}</span></div>`).join('')}`).join('') || '<div class="mute">No rounds yet this season.</div>'}</div>
  <div class="card" style="margin-top:14px"><h3>Past champions</h3>${C.shieldHistory.slice(0, 10).map(h => `<span class="tag">${CR.seasonLabel(h.y)}: ${h.champ}</span>`).join(' ')}</div></div>`;
}
function stateModal(s) {
  const list = CR.statePool(C, s).sort((a, b) => E.overall(b) - E.overall(a));
  return `<div class="modal-bg"><div class="modal xl"><h2>${STATES[s].name} squad</h2><div class="scroll"><table><tr><th>Player</th><th class="n">Age</th><th>Role</th><th>Test</th><th>POT</th><th>ODI</th><th>T20</th><th>Form</th><th class="n">Shield runs</th><th class="n">Wkts</th><th class="n">ODC runs</th><th class="n">Wkts</th></tr>
    ${list.map(p => { const ss = C.shield.stats[p.name], os = C.odc.stats[p.name]; return `<tr><td>${pl(p.name)} ${injTag(p)}${p.wbOnly ? ' <span class="tag">white ball</span>' : ''}</td><td class="n">${p.age}</td><td>${p.role}</td><td>${badge(E.overall(p))}</td><td>${badge(E.potential(p), 'pot')}</td><td>${badge(E.wbOverall(p, 'odi'))}</td><td>${badge(E.wbOverall(p, 't20'))}</td><td>${formTag(p)}</td><td class="n">${ss ? ss.runs : '-'}</td><td class="n">${ss ? ss.wk : '-'}</td><td class="n">${os ? os.runs : '-'}</td><td class="n">${os ? os.wk : '-'}</td></tr>`; }).join('')}</table></div>
    <div class="btns"><button id="mClose">Close</button></div></div></div>`;
}

// ================= STATS =================
function vStats() {
  const comp = ui.comp || 'test', scope = ui.scope || 'ALL', cat = ui.cat || 'bat';
  const rows = [];
  const seasonSrc = { season: C.shield.stats, odcS: C.odc.stats, bblS: C.bbl.stats }[comp];
  const src = seasonSrc ? Object.entries(seasonSrc) : Object.entries(C.stats).map(([n, o]) => [n, o[comp]]).filter(x => x[1]);
  const lo = ['odi', 't20i', 'odc', 'bbl', 'odcS', 'bblS'].includes(comp), intl = ['test', 'odi', 't20i'].includes(comp);
  src.forEach(([n, s]) => {
    const p = CR.P_(C, n); const nat = p ? p.nat : '?';
    if (scope !== 'ALL' && nat !== scope && !(scope === 'AUS' && p && p.state)) return;
    rows.push({ n, s, nat, st: p ? p.state : '', retired: !p });
  });
  const minI = +(ui.min || (comp === 'test' ? 3 : 3));
  const cols = {
    bat: [['Player', r => `${pl(r.n)} <span class="mute sm">${intl ? r.nat : r.st || r.nat}</span>`], ['M', r => r.s.m, 'm'], ['Inn', r => r.s.inn, 'inn'], ['NO', r => r.s.no, 'no'], ['Runs', r => r.s.runs, 'runs'], ['HS', r => r.s.hs + (r.s.hsNo ? '*' : ''), 'hs'],
      ['Avg', r => avgS(r.s), 'avg'], ['Balls', r => r.s.balls, 'balls'], ['SR', r => r.s.balls ? (r.s.runs / r.s.balls * 100).toFixed(1) : '-', 'sr'], ['100', r => r.s.h100, 'h100'], ['50', r => r.s.h50, 'h50'], ['0', r => r.s.ducks, 'ducks'], ['4s', r => r.s.fours, 'fours'], ['6s', r => r.s.sixes, 'sixes']],
    bowl: [['Player', r => `${pl(r.n)} <span class="mute sm">${intl ? r.nat : r.st || r.nat}</span>`], ['M', r => r.s.m, 'm'], ['Overs', r => E.oversStr(r.s.bBalls), 'bBalls'], ['Mdns', r => r.s.mdn, 'mdn'], ['Runs', r => r.s.bRuns, 'bRuns'], ['Wkts', r => r.s.wk, 'wk'],
      ['Avg', r => r.s.wk ? (r.s.bRuns / r.s.wk).toFixed(2) : '-', 'bavg'], ['Econ', r => r.s.bBalls ? (r.s.bRuns / r.s.bBalls * 6).toFixed(2) : '-', 'econ'], ['SR', r => r.s.wk ? (r.s.bBalls / r.s.wk).toFixed(1) : '-', 'bsr'], ['Best', r => r.s.bw ? `${r.s.bw}/${r.s.br}` : '-', 'bw'], ...(lo ? [['4w', r => r.s.fourW || 0, 'fourW'], ['5w', r => r.s.fiveW, 'fiveW']] : [['5w', r => r.s.fiveW, 'fiveW'], ['10w', r => r.s.tenW, 'tenW']])],
    field: [['Player', r => `${pl(r.n)} <span class="mute sm">${intl ? r.nat : r.st || r.nat}</span>`], ['M', r => r.s.m, 'm'], ['Catches', r => r.s.ct, 'ct'], ['Stumpings', r => r.s.st, 'st'], ['Run outs', r => r.s.ro, 'ro'], ['Dismissals', r => r.s.ct + r.s.st + r.s.ro, 'dis'], ['Per match', r => r.s.m ? ((r.s.ct + r.s.st + r.s.ro) / r.s.m).toFixed(2) : '-', 'pm']],
  }[cat];
  const num = { avg: s => s.inn - s.no > 0 ? s.runs / (s.inn - s.no) : 0, sr: s => s.balls ? s.runs / s.balls : 0, bavg: s => s.wk ? -s.bRuns / s.wk : -999, econ: s => s.bBalls ? -s.bRuns / s.bBalls : -99, bsr: s => s.wk ? -s.bBalls / s.wk : -999, bw: s => s.bw * 1000 - s.br, dis: s => s.ct + s.st + s.ro, pm: s => s.m ? (s.ct + s.st + s.ro) / s.m : 0 };
  const sk = ui.sk || (cat === 'bat' ? 'runs' : cat === 'bowl' ? 'wk' : 'dis');
  const qual = cat === 'bat' ? (r => ['avg', 'sr'].includes(sk) ? r.s.inn >= minI : r.s.inn > 0) : cat === 'bowl' ? (r => ['bavg', 'econ', 'bsr'].includes(sk) ? r.s.wk >= minI * 3 : r.s.bBalls > 0) : (r => r.s.m > 0);
  const list = rows.filter(qual).sort((a, b) => (num[sk] ? num[sk](b.s) - num[sk](a.s) : (b.s[sk] || 0) - (a.s[sk] || 0))).slice(0, 60);
  const opt = (id, cur, items) => `<select id="${id}">${items.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `<div class="wrap"><div class="top"><h2>Stats</h2><div class="filters">
    ${opt('sComp', comp, [['test', 'Test career'], ['odi', 'ODI career'], ['t20i', 'T20I career'], ['shield', 'Shield career'], ['season', `Shield ${CR.seasonLabel(C.shield.y)}`], ['odc', 'One-Day Cup career'], ['odcS', `One-Day Cup ${CR.seasonLabel(C.odc.y)}`], ['bbl', 'BBL career'], ['bblS', `BBL|${C.bbl.y - 2010}`]])}
    ${opt('sScope', scope, [['ALL', 'All players'], ...CR.NATIONS.map(n => [n, tName(n)])])}
    ${opt('sCat', cat, [['bat', 'Batting'], ['bowl', 'Bowling'], ['field', 'Fielding']])}
    ${opt('sMin', String(minI), [['1', 'Min 1'], ['3', 'Min 3'], ['5', 'Min 5'], ['10', 'Min 10']])}</div></div>
  <p class="mute sm">Click a column to sort. Averages and strike rates need the minimum innings (or three times that many wickets for bowlers). Stats count from the start of this career.</p>
  <div class="card scroll">${list.length ? `<table><tr><th>#</th>${cols.map(c => `<th class="${c[2] ? 'n sortable' : ''} ${c[2] === sk ? 'on' : ''}" ${c[2] ? `data-ssort="${c[2]}"` : ''}>${c[0]}</th>`).join('')}</tr>
    ${list.map((r, i) => `<tr><td class="mute">${i + 1}</td>${cols.map(c => `<td class="${c[2] ? 'n' : ''}">${c[1](r)}</td>`).join('')}</tr>`).join('')}</table>` : '<div class="mute">No stats yet for this view.</div>'}</div></div>`;
}

// ================= RANKINGS =================
function vRankings() {
  const t = ui.rt || 'bat', fm = ui.rf || 'test';
  const tabsF = `<div class="tabs" style="margin:0 0 12px">${['test', 'odi', 't20'].map(f => `<button data-rf="${f}" class="${fm === f ? 'on' : ''}">${FN[f]}</button>`).join('')}</div>`;
  const P = fm === 'test' ? C.prank : C.prankWB[fm], T = fm === 'test' ? C.trank : C.trankWB[fm];
  const active = Object.entries(P).filter(([n, r]) => C.ptr - r.last <= (fm === 'test' ? 5 : 6) && CR.P_(C, n));
  const list = t === 'bat' ? active.sort((a, b) => b[1].bat - a[1].bat).map(([n, r]) => [n, r.bat])
    : t === 'bowl' ? active.filter(([n, r]) => r.bowl).sort((a, b) => b[1].bowl - a[1].bowl).map(([n, r]) => [n, r.bowl])
    : active.filter(([n, r]) => r.bat > 200 && r.bowl > 200).map(([n, r]) => [n, Math.round(r.bat * r.bowl / 1000)]).sort((a, b) => b[1] - a[1]);
  const tr = Object.entries(T).sort((a, b) => b[1] - a[1]);
  const wt = CR.wtcSorted(C);
  const left = fm === 'test' ? `<div class="card"><h3>World Test Championship ${C.wtc.cycle}</h3><table><tr><th>#</th><th>Team</th><th class="n">P</th><th class="n">W</th><th class="n">L</th><th class="n">D</th><th class="n">Pts</th><th class="n">PCT</th></tr>
      ${wt.map((r, i) => `<tr class="${i < 2 ? 'top2' : ''} ${r.t === 'AUS' ? 'us' : ''}"><td>${i + 1}</td><td>${tName(r.t)}</td><td class="n">${r.p}</td><td class="n">${r.w}</td><td class="n">${r.l}</td><td class="n">${r.d}</td><td class="n">${r.pts}</td><td class="n"><b>${r.pct.toFixed(2)}</b></td></tr>`).join('')}</table>
      <div class="mute sm" style="margin-top:6px">Win 12, draw 4, tie 6. Ranked by percentage of points. Top two meet in the final at Lord's.</div>
      ${C.wtcHistory.length ? `<div style="margin-top:8px">${C.wtcHistory.map(h => `<div class="sm">${h.cycle}: ${esc(h.text)}</div>`).join('')}</div>` : ''}</div>`
    : `<div class="card"><h3>World Cups</h3>${(() => { const nx = C.windows.slice(C.ptr).find(w => w.event && w.event.fmt === fm); return nx ? `<div class="sm">Next: <b>${esc(nx.event.name)}</b> in ${nx.event.host.map(tName).join(' and ')}, ${esc(nx.months)} ${nx.season}${nx.id === 'win' ? '' : ''}</div>` : ''; })()}
      ${(C.wcHistory || []).filter(h => h.fmt === fm).map(h => `<div class="row sm"><span>${esc(h.name)}</span><span><b>${tName(h.champ)}</b> beat ${tName(h.runner)}</span></div>`).join('') || '<div class="mute sm" style="margin-top:6px">No World Cups played in this save yet. Real holders: ' + (fm === 'odi' ? 'Australia (2023)' : 'India (2026)') + '.</div>'}</div>`;
  return `<div class="wrap">${tabsF}<div class="grid2">${left}
    <div class="card"><h3>ICC ${FN[fm]} team rankings</h3><table><tr><th>#</th><th>Team</th><th class="n">Rating</th></tr>
      ${tr.map(([c, r], i) => `<tr class="${c === 'AUS' ? 'us' : ''}"><td>${i + 1}</td><td>${tName(c)}</td><td class="n"><b>${Math.round(r)}</b></td></tr>`).join('')}</table></div></div>
  <div class="card" style="margin-top:14px"><div class="top"><h3 style="margin:0">ICC ${FN[fm]} player rankings</h3><div class="tabs" style="margin:0">
    ${[['bat', 'Batters'], ['bowl', 'Bowlers'], ['ar', 'All-rounders']].map(([k, l]) => `<button data-rt="${k}" class="${t === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <table><tr><th>#</th><th>Player</th><th>Team</th><th>${FN[fm]} OVR</th><th class="n">Rating</th></tr>
    ${list.slice(0, 25).map(([n, r], i) => { const p = CR.P_(C, n); return `<tr class="${p.nat === 'AUS' ? 'us' : ''}"><td>${i + 1}</td><td>${pl(n)}</td><td>${tName(p.nat)}</td><td>${badge(E.fmtOVR(p, fm))}</td><td class="n"><b>${r}</b></td></tr>`; }).join('')}</table>
    <div class="mute sm" style="margin-top:6px">Started from the real ICC rankings of November 2026, then moved by every ${FN[fm]} played in this career. Players drop off after about 18 months without a game.</div></div>
  <div class="card" style="margin-top:14px"><h3>Around the world</h3>${C.intl.filter(r => (r.fmt || 'test') === fm).slice(0, 20).map(r => `<div class="row sm"><span>${esc(r.text)}</span><span class="mute">${esc(r.when)}</span></div>`).join('') || '<div class="mute">Other nations\' series appear here as the calendar moves on.</div>'}</div></div>`;
}

// ================= SQUAD SELECTION =================
function curFixture() { return CR.activeFixture(CR.curWindow(C)); }
const squadSize = f => fmtF(f) === 'test' ? [12, 18] : f.wc ? [15, 15] : [13, 16];
const domStats = fm => fm === 'test' ? C.shield.stats : fm === 'odi' ? C.odc.stats : C.bbl.stats;
function vSquadPick() {
  const f = curFixture(), fm = fmtF(f), lo = fm !== 'test', [mn, mx] = squadSize(f);
  const eligible = C.players.AUS.filter(p => CR.intlOK(p, fm));
  const sel = ui.sel || (ui.sel = new Set(f.squad && f.squad.length ? f.squad : (lo ? CR.autoSquadLO(C.players.AUS, fm, 15) : CR.autoSquad(C.players.AUS, 15)).map(p => p.name)));
  const st = ui.st || 'ALL', role = ui.role || 'ALL', minO = +(ui.minO || 70);
  const list = eligible.filter(p => sel.has(p.name) || ((st === 'ALL' || p.state === st) && (role === 'ALL' || p.role === role) && E.fmtOVR(p, fm) >= minO)).sort((a, b) => (sel.has(b.name) - sel.has(a.name)) || E.fmtOVR(b, fm) - E.fmtOVR(a, fm));
  const chosen = C.players.AUS.filter(p => sel.has(p.name));
  const keepers = chosen.filter(p => p.role === 'WK').length, pace = chosen.filter(p => p.bowl && E.isPace(p.bowl.type) && p.bowl.skill >= 64).length, spin = chosen.filter(p => p.bowl && !E.isPace(p.bowl.type) && p.bowl.skill >= 64).length;
  const ok = sel.size >= mn && sel.size <= mx && keepers >= 1;
  const v0 = VENUES[f.venues[f.testIdx || 0]], DS = domStats(fm), dn = fm === 'test' ? 'Shield' : fm === 'odi' ? 'One-Day Cup' : 'BBL';
  const domCell = p => { const ss = DS[p.name]; if (!ss) return '<td class="n">-</td><td class="n">-</td>';
    return `<td class="n">${ss.inn ? `${ss.runs} @ ${avgS(ss)}${lo ? ` <span class="mute">SR ${srS(ss)}</span>` : ''}` : '-'}</td><td class="n">${ss.wk ? `${ss.wk} @ ${(ss.bRuns / ss.wk).toFixed(1)}${lo ? ` <span class="mute">e ${ecS(ss)}</span>` : ''}` : '-'}</td>`; };
  return `<div class="wrap"><div class="top"><div><div class="mute sm"><span class="fb f-${fm}">${FN[fm]}</span> ${esc(f.title || '')}</div><h2>${f.status === 'active' ? 'Change squad' : 'Pick your squad'} · ${fixtureDesc(f)}</h2>
    <div class="mute">${f.wc ? `${f.wc ? 'World Cup squads are 15 players.' : ''}` : `Next ${matchWord(f)} at ${esc(v0.name)}: ${esc(v0.desc)}`}</div></div>
    <div class="right"><div class="cond" style="font-size:28px">${sel.size} <span class="mute" style="font-size:16px">players</span></div>
    <div class="sm ${keepers ? 'mute' : 'warnc'}">${keepers} keeper${keepers === 1 ? '' : 's'} · ${pace} quicks · ${spin} spinners</div></div></div>
    <div class="filters" style="margin-bottom:10px"><select id="sqSt"><option value="ALL">All states</option>${CR.STATE_CODES.map(s => `<option value="${s}" ${s === st ? 'selected' : ''}>${STATES[s].name}</option>`).join('')}</select>
      <select id="sqRole">${['ALL', 'BAT', 'BOWL', 'AR', 'WK'].map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${r === 'ALL' ? 'All roles' : roleName[r]}</option>`).join('')}</select>
      <select id="sqMin">${[60, 65, 70, 74].map(n => `<option value="${n}" ${n === minO ? 'selected' : ''}>${FN[fm]} OVR ${n}+</option>`).join('')}</select>
      <span class="mute sm">${lo ? 'Ratings shown are for this format. Players who have retired from this format are not listed.' : f.home ? '' : 'Touring players who do not play still develop a little.'}</span></div>
    <div class="card scroll"><table><tr><th></th><th>Player</th><th class="n">Age</th><th>State</th><th>Role</th><th>${FN[fm]} OVR</th><th>POT</th><th class="mute">Other</th><th>Form</th><th>Morale</th><th>Type</th><th class="n">${dn} runs</th><th class="n">${dn} wkts</th><th>Recent</th></tr>
    ${list.map(p => { const dis = !!p.injury && !sel.has(p.name);
      return `<tr class="pick ${sel.has(p.name) ? 'sel' : ''} ${dis ? 'dis' : ''}" ${dis ? '' : `data-tog="${esc(p.name)}"`}><td><input type="checkbox" ${sel.has(p.name) ? 'checked' : ''} ${dis ? 'disabled' : ''}></td><td>${pl(p.name)}${capTag(p.name, fm)} ${injTag(p)}</td><td class="n">${p.age}</td><td>${p.state || ''}</td><td>${p.role}</td>
      <td>${badge(E.fmtOVR(p, fm))}</td><td>${badge(E.fmtPOT(p, fm), 'pot')}</td><td class="sm mute">${['test', 'odi', 't20'].filter(x => x !== fm).map(x => `${FN[x]} ${E.fmtOVR(p, x)}`).join(' · ')}</td><td>${formTag(p)}</td><td>${morTag(p)}</td><td class="sm mute">${[styleTag(p), p.bowl ? p.bowl.type : ''].filter(Boolean).join(' · ')}</td>
      ${domCell(p)}<td class="sm mute">${recentStr(p, fm)}</td></tr>`; }).join('')}</table></div>
    <div class="btns sticky"><button class="primary" id="confirmSquad" ${ok ? '' : 'disabled'}>Name squad</button><button id="autoSquad">Selectors' pick</button>${f.status === 'active' ? '<button data-go="series">Back</button>' : ''}
    <span class="mute sm">${ok ? '' : mn === mx ? `Pick exactly ${mn} players, including a keeper.` : `Pick ${mn} to ${mx} players, including a keeper.`}</span></div></div>`;
}
function recentStr(p, fm) {
  const k = CR.FMT_COMP[fm || 'test'], s = (C.stats[p.name] || {})[k]; if (!s) return '';
  const b = s.recentBat.slice(-4).join(', '), w = s.recentBowl.slice(-3).join(', ');
  return [b && `${FNP[fm || 'test']}: ` + b, w && w].filter(Boolean).join(' · ');
}

// ================= SERIES =================
function wcTables(f) {
  const t = f.t;
  return `<div class="grid2">${[0, 1].map(g => `<div><h3>Group ${'AB'[g]}</h3><table><tr><th>Team</th><th class="n">P</th><th class="n">W</th><th class="n">L</th><th class="n">NR</th><th class="n">NRR</th><th class="n">Pts</th></tr>
    ${CR.wcSorted(t, g).map((r, i) => `<tr class="${i < 2 ? 'top2' : ''} ${r.t === 'AUS' ? 'us' : ''}"><td>${tName(r.t)}</td><td class="n">${r.p}</td><td class="n">${r.w}</td><td class="n">${r.l}</td><td class="n">${r.nr}</td><td class="n">${r.nrr >= 0 ? '+' : ''}${r.nrr.toFixed(2)}</td><td class="n"><b>${r.pts}</b></td></tr>`).join('')}</table></div>`).join('')}</div>
    ${t.ko.length ? `<h3 style="margin-top:10px">Knockouts</h3>${t.ko.map(k => `<div class="row sm"><span><b>${k.stage}</b>: ${tName(k.a)} v ${tName(k.b)}</span><span>${k.res ? esc(k.res.text) : 'To come'}</span></div>`).join('')}` : ''}
    <div class="mute sm" style="margin-top:6px">Two groups of six. Win 2 points, no result 1. Top two in each group reach the semi-finals.</div>
    <details style="margin-top:8px"><summary class="mute sm">All group results</summary>${t.games.filter(g => g.res).map(g => `<div class="row sm"><span>${tName(g.a)} v ${tName(g.b)} · ${esc(g.res.sc || '')}</span><span>${esc(g.res.text)}</span></div>`).join('')}</details>`;
}
function vSeries() {
  const f = ui.fx || curFixture();
  if (!f || !f.squad) return vHub();
  const fm = fmtF(f), w = CR.curWindow(C);
  const opp = (f.oppSquad || []).map(n => CR.P_(C, n)).filter(Boolean);
  const nextOpp = f.wc ? CR.oppOf(f, f.testIdx) : f.opp;
  return `<div class="wrap"><div class="top"><div><div class="mute sm"><span class="fb f-${fm}">${FN[fm]}</span> ${esc(f.title || '')}</div><h2>${fixtureDesc(f)}</h2><div class="status">${seriesLine(f)}</div>${f.exp ? `<div class="sm">Board target: <b>${esc(f.exp.text)}</b></div>` : ''}${f.pressure && f.pressure.length ? `<div class="warn sm">Media pressure: ${f.pressure.map(x => esc(x[0])).join(', ')}</div>` : ''}</div>
    <div class="btns" style="margin:0">${f.status === 'done' ? '<button class="primary" id="finishSeries">Continue</button>' : C.match ? '<button class="primary" data-go="match">Resume match</button>' : `<button class="primary" id="toPre">${matchWord(f)} ${f.testIdx + 1}${f.wc ? ` v ${tName(nextOpp)}` : ''}: select XI</button><button id="editSquad">Change squad</button>`}</div></div>
    <div class="card"><h3>${f.wc ? 'Our matches' : FNP[fm]}</h3>${f.venues.map((v, i) => { const r = f.results[i];
      return `<div class="row"><span><b>${f.wc ? `${f.matches[i].stage} v ${tName(f.matches[i].opp)}` : `${matchWord(f)} ${i + 1}`}</b> · ${esc(VENUES[v].name)} <span class="mute sm">${fixDateStr(w, f, i)}</span>${r ? `<br><span class="mute sm">${esc(r.scores)}${r.potm ? ' · Player of the match: ' + esc(r.potm) : ''}</span>` : ''}</span>
      <span class="${r ? (r.winner === 'AUS' ? 'win' : r.winner ? 'loss' : '') : 'mute'}">${r ? esc(r.text) : i === f.testIdx ? 'Next' : ''}</span></div>`; }).join('')}</div>
    ${f.wc ? `<div class="card" style="margin-top:14px">${wcTables(f)}</div>` : ''}
    <div class="grid2" style="margin-top:14px">
      <div class="card"><h3>Your squad</h3>${f.squad.map(n => { const p = CR.P_(C, n); if (!p) return '';
        const rr = f.status === 'done' || fm !== 'test' ? 100 : rested(n);
        return `<div class="row"><span>${pl(n)}${capTag(n, fm)} <span class="tag">${p.role}</span> ${formTag(p)} ${morTag(p)} ${injTag(p)}${rr < 90 ? ` <span class="sm warnc">${Math.round(rr)}% fit</span>` : ''}</span><span>${ovrPot(p, fm)}</span></div>`; }).join('')}</div>
      <div class="card"><h3>${f.wc ? `Next opponent: ${tName(nextOpp)}` : tName(f.opp) + ' squad'}</h3>${(f.wc ? CR.autoSquadLO(C.players[nextOpp] || [], fm, 15) : opp).map(p => `<div class="row"><span>${pl(p.name)} <span class="tag">${p.role}</span> ${formTag(p)} ${injTag(p)}</span><span>${ovrPot(p, fm)}</span></div>`).join('')}</div></div></div>`;
}

// ================= PRE-MATCH =================
function forecastStrip(wx, days, curIdx) {
  return `<div class="fc">${Array.from({ length: days }, (_, d) => `<div class="fcd"><span class="mute sm">Day ${d + 1}</span><div>${[0, 1, 2].map(s => { const i = d * 3 + s; return `<span class="wx ${i === curIdx ? 'now' : ''}" title="${wx[i]}">${E.WX_ICON[wx[i]]}</span>`; }).join('')}</div></div>`).join('')}</div>`;
}
function rested(n) { const f = curFixture(), w = CR.curWindow(C), e = C.energy[n]; if (fmtF(f) !== 'test') return 100; return e == null ? 100 : Math.min(100, e + CR.restDays(w, f.testIdx) * 5); }
function restedEnergy() { const o = {}; Object.keys(C.energy).forEach(n => { o[n] = rested(n); }); return o; }
function oppSquadNow(f) { const fm = fmtF(f); if (f.wc) return CR.autoSquadLO(C.players[CR.oppOf(f, f.testIdx)], fm, 15); return (f.oppSquad || []).map(n => CR.P_(C, n)).filter(Boolean); }
function vPrematch() {
  const f = curFixture(), fm = fmtF(f), lo = fm !== 'test', vk = f.venues[f.testIdx], v = VENUES[vk], w = CR.curWindow(C);
  const squad = f.squad.map(n => CR.P_(C, n)).filter(Boolean);
  const en = restedEnergy();
  if (!ui.xi) ui.xi = lo ? CR.autoXILO(squad, fm, v) : CR.autoXI(squad, v, en);
  const chosen = ui.xi.map(n => squad.find(p => p.name === n)).filter(Boolean);
  const warns = [];
  const capt = fm === 'test' ? [C.captain, C.vice] : (C.captains[fm] || []);
  if (chosen.length < 11) warns.push(`Pick ${11 - chosen.length} more player${chosen.length === 10 ? '' : 's'}.`);
  if (chosen.length && !chosen.some(p => p.role === 'WK')) warns.push('No specialist keeper. Your best gloveman will keep, badly.');
  if (lo) {
    const opts = chosen.filter(p => p.bowl && p.bowl.skill >= 60).length;
    if (chosen.length === 11 && opts < 5) warns.push(`Only ${opts} bowling options. You need ${fm === 'odi' ? '50 overs from bowlers capped at 10 each' : '20 overs from bowlers capped at 4 each'}: pick at least five, ideally six.`);
    if (v.spin >= 2 && !chosen.some(p => p.bowl && !E.isPace(p.bowl.type) && p.bowl.skill >= 64)) warns.push('Slow, gripping surface and no frontline spinner.');
  } else {
    const bowlers = chosen.filter(p => p.bowl && p.bowl.skill >= 68).length;
    if (chosen.length === 11 && bowlers < 4) warns.push(`Only ${bowlers} frontline bowlers. You'll want at least four.`);
    if (v.spin >= 3 && !chosen.some(p => p.bowl && !E.isPace(p.bowl.type) && p.bowl.skill >= 70)) warns.push('This pitch will turn and you have no frontline spinner.');
  }
  if (capt[0] && squad.some(p => p.name === capt[0]) && !ui.xi.includes(capt[0])) warns.push(`Your captain ${capt[0]} is not in the XI. ${capt[1] && ui.xi.includes(capt[1]) ? capt[1] + ' will lead.' : 'The most experienced leader will step in.'}`);
  chosen.forEach(p => { if (!lo && rested(p.name) < 85) warns.push(`${p.name} is still tired (${Math.round(rested(p.name))}%).`); if (p.injury) warns.push(`${p.name} is injured.`); });
  const oppSquad = oppSquadNow(f), oppCode = CR.oppOf(f, f.testIdx);
  const oppXI = (lo ? CR.autoXILO(oppSquad, fm, v) : CR.autoXI(oppSquad, v, en)).map(n => CR.P_(C, n));
  if (!ui.wx) ui.wx = tmpForecast(v.home);
  const rowInfo = p => { const DS = domStats(fm), ss = DS[p.name], st = (C.stats[p.name] || {})[CR.FMT_COMP[fm]];
    return `<span class="mute sm">${p.bowl ? p.bowl.type + ' · ' : ''}${st && st.recentBat.length ? `${FNP[fm]}: ` + st.recentBat.slice(-3).join(', ') : ss && ss.inn ? `${fm === 'test' ? 'Shield' : fm === 'odi' ? 'ODC' : 'BBL'} ${ss.runs} @ ${avgS(ss)}${lo ? ' SR ' + srS(ss) : ''}${ss.wk ? `, ${ss.wk} wk` : ''}` : ''}</span>`; };
  const xiRows = ui.xi.map((n, i) => { const p = squad.find(q => q.name === n); if (!p) return '';
    return `<div class="xirow ${ui.selSlot === i ? 'on' : ''}" data-xslot="${i}"><span class="mono mute">${i + 1}</span>
      <div class="xmain"><div>${pl(p.name)}${capTag(p.name, fm)} <span class="tag">${p.role}</span> ${formTag(p)} ${morTag(p)}</div>${rowInfo(p)}</div>
      <span class="en ${rested(p.name) < 85 ? 'low' : ''}">${lo ? '' : Math.round(rested(p.name)) + '%'}</span><span>${ovrPot(p, fm)}</span>
      <span class="xbtns"><button class="mini" data-up="${i}" title="Move up">▲</button><button class="mini" data-down="${i}" title="Move down">▼</button><button class="mini" data-rm="${i}" title="Remove">✕</button></span></div>`; }).join('');
  const bench = squad.filter(p => !ui.xi.includes(p.name));
  const benchRows = bench.map(p => `<div class="xirow bench ${p.injury ? 'dis' : ''}" ${p.injury ? '' : `data-add="${esc(p.name)}"`}><span class="mono mute">+</span>
      <div class="xmain"><div>${pl(p.name)}${capTag(p.name, fm)} <span class="tag">${p.role}</span> ${formTag(p)} ${morTag(p)} ${injTag(p)}</div>${rowInfo(p)}</div>
      <span class="en ${rested(p.name) < 85 ? 'low' : ''}">${lo ? '' : Math.round(rested(p.name)) + '%'}</span><span>${ovrPot(p, fm)}</span><span></span></div>`).join('');
  const wxCard = lo ? `<div class="card" style="margin-bottom:14px"><div class="row"><b>Match day</b><span class="mute sm">${fm === 't20' ? 'Night match.' : 'Day-night match: dew can make spin harder under lights.'} Rain can shorten the game; a rain-hit chase is decided by DLS.</span></div><div class="fc"><div class="fcd"><span class="mute sm">Forecast</span><div><span class="wx">${E.WX_ICON[ui.wx[0]]}</span> ${ui.wx[0]}</div></div></div></div>`
    : `<div class="card" style="margin-bottom:14px"><div class="row"><b>Five-day forecast</b><span class="mute sm">${f.testIdx ? `${CR.restDays(w, f.testIdx)} days' rest since the last Test. ` : ''}Overcast and humid help swing; sun helps batting and wears the pitch; rain costs overs.</span></div>${forecastStrip(ui.wx, 5, -1)}</div>`;
  return `<div class="wrap"><div class="top"><div><div class="mute sm"><span class="fb f-${fm}">${FN[fm]}</span> ${esc(f.title || '')} · ${f.wc ? f.matches[f.testIdx].stage : `${matchWord(f)} ${f.testIdx + 1} of ${f.tests}`} · ${fixDateStr(w, f, f.testIdx)} · ${seriesLine(f)}</div><h2>${f.wc ? 'v ' + tName(oppCode) + ' · ' : ''}${esc(v.name)}</h2><div class="mute">${esc(v.desc)}</div></div>
    <div class="right">${pitchBars(v)}</div></div>
  ${wxCard}
  <div class="grid3"><div class="card"><h3>Your XI · batting order</h3>
    <div class="mute sm" style="margin-bottom:6px">Click a player in the XI to select him, then click someone on the bench to swap them. Use the arrows to change the batting order.${lo ? ' Openers and finishers matter: put your power hitters where the overs are.' : ''}</div>
    ${xiRows}
    ${ui.flash ? `<div class="warn">${esc(ui.flash)}</div>` : ''}${(ui.flash = null, '')}
    ${warns.length ? warns.map(w => `<div class="warn">${esc(w)}</div>`).join('') : '<div class="ok">XI looks balanced.</div>'}
    <div class="btns"><button class="primary" id="startTest" ${chosen.length === 11 ? '' : 'disabled'}>Start ${matchWord(f) === 'Match' ? 'match' : matchWord(f)}</button><button id="autoXI">Auto-pick XI</button><button data-go="series">Back</button></div>
    <h3 style="margin-top:16px">Bench</h3>${benchRows || '<div class="mute">Everyone in the squad is in the XI.</div>'}</div>
  <div class="card"><h3>${tName(oppCode)} likely XI</h3>${oppXI.map((p, i) => `<div class="row"><span><span class="mono mute">${i + 1}</span> ${pl(p.name)} <span class="tag">${p.role}</span> ${formTag(p)}</span><span>${ovrPot(p, fm)}</span></div>`).join('')}</div></div></div>`;
}
function tmpForecast(home) {
  const cl = CLIMATE[home] || CLIMATE.AUS; const out = []; let c = null;
  for (let i = 0; i < 15; i++) { if (!c || Math.random() > 0.55) { let r = Math.random(), k = 0; while (k < 4 && r > cl[k]) { r -= cl[k]; k++; } c = E.WX[k]; } out.push(c); }
  return out;
}
function pitchBars(v) {
  const bar = (l, x) => `<div class="pb"><span class="mute sm">${l}</span><span class="bars">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= x ? 'on' : ''}"></i>`).join('')}</span></div>`;
  return bar('Pace', clamp(Math.round((v.pace + 3) / 1.4), 0, 5)) + bar('Spin', clamp(Math.round((v.spin + 3) / 1.6), 0, 5)) + bar('Batting', clamp(Math.round((v.flat + 1) * 1.2), 0, 5));
}
function startTest() {
  const f = curFixture(), fm = fmtF(f), lo = fm !== 'test', vk = f.venues[f.testIdx], v = VENUES[vk], w = CR.curWindow(C);
  const opp = CR.oppOf(f, f.testIdx);
  const homeSide = f.home || (f.wc && v.home === 'AUS');
  const homeC = homeSide ? 'AUS' : opp, awayC = homeSide ? opp : 'AUS';
  const ours = ui.xi.map(n => CR.P_(C, n));
  const oppSquad = oppSquadNow(f);
  const en = restedEnergy();
  const theirs = (lo ? CR.autoXILO(oppSquad, fm, v) : CR.autoXI(oppSquad, v, en)).map(n => CR.P_(C, n));
  if (lo) CR.onXISelectedWB(C, f, ui.xi.slice()); else CR.onXISelected(C, f, ui.xi.slice());
  C.date = CR.isoD(CR.matchDate(w, f, f.testIdx));
  if (lo) {
    const neutral = f.wc ? v.home !== 'AUS' && v.home !== opp : !!f.neutral;
    C.match = E.createMatchLO({ fmt: fm, home: homeC, away: awayC, venue: v, venueKey: vk, xi: { AUS: ours, [opp]: theirs }, userTeam: 'AUS', TEAMS, neutral, comp: CR.FMT_COMP[fm],
      superOver: fm === 't20' || !!f.wc, knockout: !!(f.wc && f.matches[f.testIdx].stage !== 'Group'), captains: { AUS: C.captains[fm] || [] }, title: f.title });
    if (ui.wx && ui.wx[0] !== C.match.wx[0] && Math.random() < 0.7 && !C.match.reduced && !C.match.abandoned) C.match.wx[0] = ui.wx[0] === 'Rain' ? 'Cloudy' : ui.wx[0];
  } else {
    C.match = E.createMatch({ home: homeC, away: awayC, venue: v, venueKey: vk, xi: { AUS: ours, [opp]: theirs }, userTeam: 'AUS', TEAMS, energy: en, neutral: !!f.neutral, captains: { AUS: [C.captain, C.vice] } });
    if (ui.wx) { C.match.forecast = ui.wx.slice(); C.match.wx = ui.wx.map(w => Math.random() < 0.8 ? w : C.match.wx[0]); }
  }
  save(); tab = 'comm'; go('match');
}

// ================= MATCH =================
const sessName = ['Morning session', 'Afternoon session', 'Evening session'];
function wearLabel(w) { return w < 1 ? 'Fresh' : w < 2.2 ? 'Good' : w < 3.5 ? 'Wearing' : w < 5 ? 'Breaking up' : 'Crumbling'; }
function vMatch() {
  const m = C.match;
  if (!m) return '<div class="wrap"><div class="card">No match in progress.</div></div>';
  if (m.lo) return vMatchLO();
  const inn = m.innings.length ? E.cur(m) : null;
  const tScore = ti => { const inns = m.innings.filter(i => i.bat === ti);
    return `<div class="tscore"><span style="color:${ti === m.user ? 'var(--gold)' : 'var(--ink)'}">${m.teams[ti].name}</span>
      <b>${inns.map(i => E.scoreLine(i) + (i.followOn ? ' (f/o)' : '')).join(' &amp; ') || '<span class="mute" style="font-size:18px">yet to bat</span>'}</b></div>`; };
  const status = m.phase === 'done' ? m.result.text : inn ? E.situation(m) : '';
  const w = E.wear(m), wl = Math.min(5, Math.ceil(w)), sess = Math.min(2, Math.floor(m.ballsInDay / m.sessBalls));
  const wxNow = E.wxNow(m);
  let live = '';
  if (inn && !inn.closed && m.phase !== 'done') {
    const bt = m.teams[inn.bat], bw = m.teams[inn.bowl];
    const bline = i => { const c = inn.cards[i], p = bt.players[i]; return `<div class="row"><span>${esc(p.name)}${i === m.striker ? ' <span style="color:var(--gold)">*</span>' : ''} <span class="mute sm">${styleTag(p)}</span>${p.hurt ? ' <span class="inj">hurt</span>' : ''}</span><span class="mono">${c.runs} <span class="mute">(${c.balls})</span></span></div>`; };
    const bi = m.endBowler[m.end], bp = bi != null ? bw.players[bi] : null, f = bp && inn.bowling[bi];
    const lo = m.overBalls === 0 && m.lastOver ? m.lastOver.log : m.overLog;
    live = `<div class="live">
      <div class="liveBox"><div class="mute sm">BATTING · ${bt.short} · approach: ${E.approachOf(m)}</div>${bline(m.striker)}${bline(m.nonStriker)}
        <div class="row mute sm"><span>Partnership</span><span class="mono">${inn.part.runs} (${inn.part.balls})</span></div></div>
      <div class="liveBox"><div class="mute sm">BOWLING · ${bw.short} · field: ${E.fieldOf(m, inn.cards[m.striker])}</div>
        ${bp ? `<div class="row"><span>${esc(bp.name)} <span class="tag">${bp.bowl ? bp.bowl.type : 'PT'}</span></span><span class="mono">${f ? `${E.oversStr(f.legal)}-${f.maidens}-${f.runs}-${f.wkts}` : '0-0-0-0'}</span></div>
        <div class="row mute sm"><span>Spell ${bp.spell} ov · energy ${Math.round(bp.energy)}%</span><span class="mono">Ball ${Math.floor(m.ballAge / 6)} ov old</span></div>` : ''}
        <div class="chips">${lo.map(x => `<span class="chip ${x === '4' ? 'c4' : x === '6' ? 'c6' : x === 'W' ? 'cW' : ''}">${x}</span>`).join('')}</div></div></div>`;
  }
  const ut = m.teams[m.user];
  const userBatting = inn && inn.bat === m.user && m.phase === 'live';
  const userBowling = inn && inn.bowl === m.user && m.phase === 'live';
  let tactics = '';
  if (userBatting) tactics = `<div class="tact"><span class="mute sm">Batting approach</span>
      <select id="appr">${['auto', 'defend', 'normal', 'attack'].map(a => `<option value="${a}" ${ut.approach === a ? 'selected' : ''}>${a === 'auto' ? 'Auto (captain decides)' : a[0].toUpperCase() + a.slice(1)}</option>`).join('')}</select>
      <span class="mute sm">Nightwatchman</span><select id="nw"><option value="auto" ${ut.nightwatch === 'auto' ? 'selected' : ''}>Use when needed</option><option value="never" ${ut.nightwatch === 'never' ? 'selected' : ''}>Never</option></select>
      ${m.innings.length < 4 ? '<button class="danger" id="decl">Declare now</button>' : ''}
      <label class="chk"><input type="checkbox" id="ad" ${m.autoDeclare ? 'checked' : ''}> Captain declares for us</label></div>`;
  if (userBowling) {
    const opt = end => { const sel = end === m.end ? m.endBowler[end] : (ut.plan[end] != null ? ut.plan[end] : m.endBowler[end]);
      return (sel == null ? '<option value="" selected>Captain\'s choice</option>' : '') + ut.players.map((p, i) => { const fg = inn.bowling[i];
        return `<option value="${i}" ${i === sel ? 'selected' : ''} ${p.hurt ? 'disabled' : ''}>${esc(p.name)} · ${p.bowl ? p.bowl.type : 'part-time'} · ${fg ? `${E.oversStr(fg.legal)}-${fg.runs}-${fg.wkts}` : '0 ov'} · ${Math.round(p.energy)}%${p.hurt ? ' (injured)' : ''}</option>`; }).join(''); };
    tactics = `<div class="tact"><span class="mute sm">Field</span><select id="fld">${['auto', 'attack', 'normal', 'defend'].map(a => `<option value="${a}" ${ut.field === a ? 'selected' : ''}>${a === 'auto' ? 'Auto (captain decides)' : a === 'attack' ? 'Attacking (slips, close catchers)' : a === 'defend' ? 'Defensive (save runs)' : 'Balanced'}</option>`).join('')}</select>
      <span class="mute sm">Bowling</span><select id="bmode"><option value="auto" ${ut.bowlMode === 'auto' ? 'selected' : ''}>Captain picks bowlers</option><option value="manual" ${ut.bowlMode === 'manual' ? 'selected' : ''}>I pick bowlers</option></select></div>
      ${ut.bowlMode === 'manual' ? `<div class="tact"><span class="mute sm">This over</span><select data-end="${m.end}">${opt(m.end)}</select>
        <span class="mute sm">Other end</span><select data-end="${1 - m.end}">${opt(1 - m.end)}</select>
        <label class="chk"><input type="checkbox" id="peo" ${m.pauseEachOver ? 'checked' : ''}> Pause after every over</label></div>
        <div class="mute sm" style="margin:-6px 0 10px">Quicks lose energy fast, and tired quicks are more likely to break down. A bowler can't bowl two overs in a row.</div>` : ''}`;
  }
  const controls = m.phase === 'done' ? '' : `<div class="controls">
    <button data-sim="ball">Ball</button><button data-sim="over">Over</button><button data-sim="overs" data-n="5">5 overs</button><button data-sim="overs" data-n="10">10 overs</button>
    <button data-sim="session" class="primary">To session break</button><button data-sim="day">To stumps</button><button data-sim="innings">End of innings</button><button data-sim="match">Sim to result</button>
    <label class="chk"><input type="checkbox" id="pw" ${m.stopOnWicket ? 'checked' : ''}> Pause on wickets</label></div>${tactics}`;
  const banner = m.phase === 'done' ? `<div class="banner"><div><div class="cond" style="font-size:26px">${esc(m.result.text)}</div>
    <div class="mute">Player of the match: ${esc((CR.playerOfMatch(m) || {}).name || '-')}${m.lostOvers ? ` · ${Math.round(m.lostOvers)} overs lost to weather` : ''}</div></div><button class="primary" id="afterMatch">Continue</button></div>` : '';
  return `<div class="wrap">
  <div class="top"><div><span class="tag">${esc(m.venue.name)}</span><h2>${m.teams[0].name} v ${m.teams[1].name}</h2></div>
    <div class="mute sm" style="text-align:right">${m.phase === 'done' ? 'Match complete' : `Day ${Math.min(m.day, m.days)} · ${sessName[sess]} · <span class="wx now">${E.WX_ICON[wxNow]}</span> ${wxNow}`}<br>
    Pitch: ${wearLabel(w)} <span class="wear">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= wl ? 'on' : ''}"></i>`).join('')}</span></div></div>
  ${banner}
  <div class="board"><div class="scores">${tScore(0)}${tScore(1)}</div><div class="status">${esc(status)}</div>${live}
    <div style="margin-top:10px">${forecastStrip(m.wx, m.days, m.phase === 'done' ? -1 : E.sessionIdx(m))}</div></div>
  ${controls}
  <div class="tabs"><button data-tab="comm" class="${tab === 'comm' ? 'on' : ''}">Commentary</button><button data-tab="card" class="${tab === 'card' ? 'on' : ''}">Scorecard</button><button data-tab="xi" class="${tab === 'xi' ? 'on' : ''}">Teams</button></div>
  <div class="card">${tab === 'comm' ? commentary(m) : tab === 'card' ? scorecard(m) : teamsView(m)}</div></div>
  ${matchModal(m)}`;
}
function vMatchLO() {
  const m = C.match, inn = m.innings.length ? E.loInn(m) : null, fm = m.fmt;
  const tScore = ti => { const inns = m.innings.filter(i => i.bat === ti);
    return `<div class="tscore"><span style="color:${ti === m.user ? 'var(--gold)' : 'var(--ink)'}">${m.teams[ti].name}</span>
      <b>${inns.map(i => `${i.so ? '<span class="sm mute">SO </span>' : ''}${i.runs}/${i.wkts} <span class="mute" style="font-size:16px">(${E.oversStr(i.legal)})</span>`).join(' &amp; ') || '<span class="mute" style="font-size:18px">yet to bat</span>'}</b></div>`; };
  const status = m.phase === 'done' ? m.result.text : inn ? E.loSituation(m) : '';
  const ph = inn && m.phase === 'live' ? E.loPhase(m) : null;
  let live = '';
  if (inn && !inn.closed && m.phase !== 'done') {
    const bt = m.teams[inn.bat], bw = m.teams[inn.bowl];
    const bline = i => { const c = inn.cards[i], p = bt.players[i]; return `<div class="row"><span>${esc(p.name)}${i === m.striker ? ' <span style="color:var(--gold)">*</span>' : ''} <span class="mute sm">${styleTag(p)}</span>${p.hurt ? ' <span class="inj">hurt</span>' : ''}</span><span class="mono">${c.runs} <span class="mute">(${c.balls}) SR ${c.balls ? Math.round(c.runs / c.balls * 100) : 0}</span></span></div>`; };
    const bi = m.endBowler[m.end], bp = bi != null ? bw.players[bi] : null, f = bp && inn.bowling[bi];
    const lo = m.overBalls === 0 && m.lastOver ? m.lastOver.log : m.overLog;
    live = `<div class="live">
      <div class="liveBox"><div class="mute sm">BATTING · ${bt.short} · intent: ${E.loApproachLabel(E.loIntent(m))}</div>${bline(m.striker)}${bline(m.nonStriker)}
        <div class="row mute sm"><span>Partnership</span><span class="mono">${inn.part.runs} (${inn.part.balls})</span></div></div>
      <div class="liveBox"><div class="mute sm">BOWLING · ${bw.short} · field: ${E.loFieldOf(m)}</div>
        ${bp ? `<div class="row"><span>${esc(bp.name)} <span class="tag">${bp.bowl ? bp.bowl.type : 'PT'}</span></span><span class="mono">${f ? `${E.oversStr(f.legal)}-${f.maidens}-${f.runs}-${f.wkts}` : '0-0-0-0'}</span></div>
        <div class="row mute sm"><span>${inn.so ? 'Super Over' : `${Math.floor((f ? f.legal : 0) / 6)} of ${m.cap} overs used`}</span><span class="mono">${m.freeHit ? '<b style="color:var(--gold)">FREE HIT</b>' : ''}</span></div>` : ''}
        <div class="chips">${lo.map(x => `<span class="chip ${x === '4' ? 'c4' : x === '6' ? 'c6' : x === 'W' ? 'cW' : ''}">${x}</span>`).join('')}</div></div></div>`;
  }
  const ut = m.teams[m.user];
  const userBatting = inn && inn.bat === m.user && m.phase === 'live';
  const userBowling = inn && inn.bowl === m.user && m.phase === 'live';
  let tactics = '';
  if (userBatting) tactics = `<div class="tact"><span class="mute sm">Batting intent</span>
      <select id="appr">${[['auto', 'Auto (captain reads the game)'], ['defend', 'Consolidate (protect wickets)'], ['normal', 'Balanced'], ['attack', 'Attack (go hard)']].map(([a, l]) => `<option value="${a}" ${ut.approach === a ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <span class="mute sm">Auto already lifts the tempo at the death and in chases. Attack scores faster but loses wickets faster.</span></div>`;
  if (userBowling) {
    const nextIdx = m.overBalls === 0 ? m.endBowler[m.end] : (ut.plan[0] != null ? ut.plan[0] : null);
    const opts = (nextIdx == null ? '<option value="" selected>Captain\'s choice</option>' : '') + ut.players.map((p, i) => { const fg = inn.bowling[i], ov = fg ? Math.floor(fg.legal / 6) : 0, can = !p.hurt && (inn.so ? !p.soUsed : ov < m.cap) && i !== m.lastBowler;
      return `<option value="${i}" ${i === nextIdx ? 'selected' : ''} ${can ? '' : 'disabled'}>${esc(p.name)} · ${p.bowl ? p.bowl.type : 'part-time'} · ${fg ? `${E.oversStr(fg.legal)}-${fg.runs}-${fg.wkts}` : '0 ov'}${inn.so ? '' : ` · ${m.cap - ov} left`}${p.hurt ? ' (injured)' : i === m.lastBowler ? ' (bowled last over)' : ''}</option>`; }).join('');
    tactics = `<div class="tact"><span class="mute sm">Field</span><select id="fld">${['auto', 'attack', 'normal', 'defend'].map(a => `<option value="${a}" ${ut.field === a ? 'selected' : ''}>${a === 'auto' ? 'Auto (captain decides)' : a === 'attack' ? 'Attacking (catchers in, risk boundaries)' : a === 'defend' ? 'Defensive (sweepers out, give singles)' : 'Balanced'}</option>`).join('')}</select>
      <span class="mute sm">Bowling</span><select id="bmode"><option value="auto" ${ut.bowlMode === 'auto' ? 'selected' : ''}>Captain picks bowlers</option><option value="manual" ${ut.bowlMode === 'manual' ? 'selected' : ''}>I pick bowlers</option></select></div>
      ${ut.bowlMode === 'manual' ? `<div class="tact"><span class="mute sm">${m.overBalls === 0 ? 'This over' : 'Next over'}</span><select id="nextBowler">${opts}</select>
        <label class="chk"><input type="checkbox" id="peo" ${m.pauseEachOver ? 'checked' : ''}> Pause after every over</label></div>
        <div class="mute sm" style="margin:-6px 0 10px">Each bowler has ${m.cap} overs. Nobody bowls two in a row. Keep your best death bowlers' overs for the end.</div>` : ''}`;
  }
  const controls = m.phase === 'done' ? '' : `<div class="controls">
    <button data-sim="ball">Ball</button><button data-sim="over">Over</button><button data-sim="overs" data-n="5">5 overs</button>${fm === 'odi' ? '<button data-sim="overs" data-n="10">10 overs</button>' : ''}
    <button data-sim="phase" class="primary">To next phase</button><button data-sim="innings">End of innings</button><button data-sim="match">Sim to result</button>
    <label class="chk"><input type="checkbox" id="pw" ${m.stopOnWicket ? 'checked' : ''}> Pause on wickets</label></div>${tactics}`;
  const banner = m.phase === 'done' ? `<div class="banner"><div><div class="cond" style="font-size:26px">${esc(m.result.text)}</div>
    <div class="mute">Player of the match: ${esc((CR.playerOfMatch(m) || {}).name || '-')}</div></div><button class="primary" id="afterMatch">Continue</button></div>` : '';
  const phName = { pp: 'Powerplay', mid: 'Middle overs', death: 'Death overs' };
  const ovInfo = inn && !inn.closed ? `Over ${Math.floor(inn.legal / 6) + 1} of ${inn.maxBalls / 6}` : '';
  return `<div class="wrap">
  <div class="top"><div><span class="tag">${esc(m.venue.name)}</span> <span class="fb f-${fm}">${FN[fm]}</span><h2>${m.teams[0].name} v ${m.teams[1].name}</h2>${m.title ? `<div class="mute sm">${esc(m.title)}</div>` : ''}</div>
    <div class="mute sm" style="text-align:right">${m.phase === 'done' ? 'Match complete' : `${ovInfo}${ph ? ` · <b>${phName[ph]}</b>` : ''}`}<br><span class="wx now">${E.WX_ICON[m.wx[Math.min(1, Math.max(0, m.innings.length - 1))]]}</span> ${m.wx[Math.min(1, Math.max(0, m.innings.length - 1))]}${m.dn ? ' · day-night' : ''}${m.reduced ? ` · ${m.maxOvers} overs a side` : ''}</div></div>
  ${banner}
  <div class="board"><div class="scores">${tScore(0)}${tScore(1)}</div><div class="status">${esc(status)}</div>${live}</div>
  ${controls}
  <div class="tabs"><button data-tab="comm" class="${tab === 'comm' ? 'on' : ''}">Commentary</button><button data-tab="card" class="${tab === 'card' ? 'on' : ''}">Scorecard</button><button data-tab="xi" class="${tab === 'xi' ? 'on' : ''}">Teams</button></div>
  <div class="card">${tab === 'comm' ? commentary(m) : tab === 'card' ? scorecard(m) : teamsView(m)}</div></div>
  ${matchModal(m)}`;
}
function commentary(m) {
  const evs = m.events.filter(e => showBoundaries || (e.type !== 'four' && e.type !== 'six')).slice(-400).reverse();
  return `<div class="row" style="margin-bottom:6px"><span class="mute sm">Newest first</span><label class="chk"><input type="checkbox" id="sb" ${showBoundaries ? 'checked' : ''}> Show boundaries</label></div>
  <div class="feed">${evs.map(e => `<div class="ev ${e.type}"><div class="meta">${m.lo ? '' : `Day ${Math.min(e.day, m.days)} · `}${e.score ? esc(e.score) : ''}</div>${esc(e.text)}</div>`).join('') || '<div class="mute">Waiting for the first ball.</div>'}</div>`;
}
function scorecard(m) {
  if (!m.innings.length) return '<div class="mute">No play yet.</div>';
  return m.innings.slice().reverse().map(inn => {
    const bt = m.teams[inn.bat], bw = m.teams[inn.bowl];
    const ord = inn.order || bt.order;
    const order = ord.filter(i => inn.cards[i].status !== 'dnb');
    const dnb = ord.filter(i => inn.cards[i].status === 'dnb').map(i => bt.players[i].name);
    const rows = order.map(i => { const c = inn.cards[i], p = bt.players[i];
      return `<tr class="${c.status === 'batting' && !inn.closed ? 'crease' : ''}"><td>${esc(p.name)}${i === bt.cap ? ' (c)' : ''}${i === bt.keeper ? ' †' : ''}${c.status === 'batting' && !inn.closed && i === m.striker ? ' *' : ''}</td><td class="mute sm">${esc(c.status === 'batting' ? 'batting' : c.how)}</td><td class="n"><b>${c.runs}</b></td><td class="n">${c.balls}</td><td class="n">${c.fours}</td><td class="n">${c.sixes}</td><td class="n">${c.balls ? (c.runs / c.balls * 100).toFixed(1) : '-'}</td></tr>`; }).join('');
    const ex = inn.extras;
    const bowl = inn.bowlOrder.map(i => { const f = inn.bowling[i]; return `<tr class="${!inn.closed && m.phase !== 'done' && m.endBowler[m.end] === i && E.cur(m) === inn ? 'crease' : ''}"><td>${esc(bw.players[i].name)}</td><td class="n">${E.oversStr(f.legal)}</td><td class="n">${f.maidens}</td><td class="n">${f.runs}</td><td class="n"><b>${f.wkts}</b></td><td class="n">${f.legal ? (f.runs / f.legal * 6).toFixed(2) : '-'}</td></tr>`; }).join('');
    return `<div style="margin-bottom:22px"><div class="inn-h"><h3 style="margin:0">${bt.name} · ${inn.so ? 'Super Over' : ['1st', '2nd', '3rd', '4th'][inn.num - 1] + ' innings'}${inn.followOn ? ' (following on)' : ''}</h3>
      <span class="cond" style="font-size:22px">${m.lo ? `${inn.runs}/${inn.wkts}` : E.scoreLine(inn)} <span class="mute" style="font-size:16px">(${E.oversStr(inn.legal)}${m.lo ? '/' + inn.maxBalls / 6 : ''} ov)</span></span></div>
      <div class="scroll"><table><tr><th>Batter</th><th></th><th class="n">R</th><th class="n">B</th><th class="n">4s</th><th class="n">6s</th><th class="n">SR</th></tr>${rows}
      <tr><td>Extras</td><td class="mute sm">b ${ex.b}, lb ${ex.lb}, w ${ex.w}, nb ${ex.nb}</td><td class="n">${ex.b + ex.lb + ex.w + ex.nb}</td><td colspan="4"></td></tr></table></div>
      ${dnb.length ? `<div class="mute sm" style="margin-top:6px">Did not bat: ${dnb.map(esc).join(', ')}</div>` : ''}
      ${inn.fow.length ? `<div class="mute sm" style="margin-top:6px">Fall of wickets: ${inn.fow.map(f => `${f.wkt}-${f.runs} (${esc(E.surname(f.name))}, ${f.over})`).join(', ')}</div>` : ''}
      <div class="scroll"><table style="margin-top:10px"><tr><th>Bowler</th><th class="n">O</th><th class="n">M</th><th class="n">R</th><th class="n">W</th><th class="n">Econ</th></tr>${bowl}</table></div></div>`;
  }).join('');
}
function teamsView(m) {
  return `<div class="grid2">${m.teams.map(t => `<div><h3>${t.name}</h3>${t.order.map((i, k) => { const p = t.players[i];
    return `<div class="row"><span><span class="mono mute">${k + 1}</span> ${pl(p.name)}${i === t.cap ? ' <span class="cap">C</span>' : ''}${i === t.keeper ? ' †' : ''} <span class="tag">${p.role}</span> <span class="mute sm">${[styleTag(p), p.bowl ? bowlName[p.bowl.type] : ''].filter(Boolean).join(' · ')}</span></span><span>${ovrPot(p)}</span></div>`; }).join('')}</div>`).join('')}</div>`;
}
function matchModal(m) {
  if (m.phase !== 'decide' || !m.pending) return '';
  if (m.pending.kind === 'toss' && m.lo) return `<div class="modal-bg locked"><div class="modal"><h2>You've won the toss</h2>
    <p>${esc(m.venue.name)}: ${esc(m.venue.desc)}</p><p>Weather: ${E.WX_ICON[m.wx[0]]} ${m.wx[0]}.${m.reduced ? ` Rain has cut the match to ${m.maxOvers} overs a side.` : ''} ${m.dn ? 'Under lights, the dew can make the ball skid on and spin harder to grip for the side bowling second.' : ''} ${m.venue.pace >= 3 || m.wx[0] === 'Overcast' ? 'The new ball should do a bit early.' : ''}</p>
    <div class="btns"><button class="primary" data-toss="bat">Bat first</button><button data-toss="bowl">Bowl first</button></div></div></div>`;
  if (m.pending.kind === 'toss') return `<div class="modal-bg locked"><div class="modal"><h2>You've won the toss</h2>
    <p>${esc(m.venue.name)}: ${esc(m.venue.desc)}</p><p>Weather this morning: ${E.WX_ICON[m.wx[0]]} ${m.wx[0]}. ${m.wx[0] === 'Overcast' || m.wx[0] === 'Humid' ? 'Good conditions for swing.' : m.wx[0] === 'Sunny' ? 'A good day to bat.' : ''} The pitch wears as the match goes on.</p>
    ${forecastStrip(m.wx, m.days, 0)}
    <div class="btns"><button class="primary" data-toss="bat">Bat first</button><button data-toss="bowl">Bowl first</button></div></div></div>`;
  if (m.pending.kind === 'followon') return `<div class="modal-bg locked"><div class="modal"><h2>Enforce the follow-on?</h2>
    <p>You lead by ${m.pending.lead}. Enforcing sends ${esc(m.teams[1 - m.user].name)} straight back in, but your bowlers get no rest. ${Math.round(E.oversLeft(m))} overs remain.</p>
    <div class="btns"><button class="primary" data-fo="1">Enforce</button><button data-fo="0">Bat again</button></div></div></div>`;
  return '';
}

function afterMatch() {
  const m = C.match, f = curFixture(), fm = fmtF(f), lo = !!m.lo, w = CR.curWindow(C);
  const usIdx = m.user;
  if (lo) CR.recordMatch(C, m, CR.FMT_COMP[fm], { awayTeam: f.home || (f.wc && m.teams[0].code === 'AUS') ? 1 : 0, wc: !!f.wc });
  else {
    CR.recordMatch(C, m, 'test', { awayTeam: f.home || f.neutral ? 1 : 0, final: !!f.final });
    if (!f.home && !f.neutral) f.squad.filter(n => !m.teams[m.user].players.some(p => p.name === n)).forEach(n => { const p = CR.P_(C, n); if (p) CR.touringGrowth(C, p); });
  }
  CR.passWeeks(C, lo ? 0.4 : 1);
  const potm = CR.playerOfMatch(m);
  const line = i => lo ? `${i.runs}/${i.wkts}${i.legal < i.maxBalls && i.wkts < 10 ? ` (${E.oversStr(i.legal)})` : ''}` : E.scoreLine(i);
  const scores = m.teams.map((t, ti) => `${t.short} ${m.innings.filter(i => i.bat === ti && !i.so).map(line).join(' & ') || '-'}`).join(', ');
  f.results.push({ venue: m.venueKey, text: m.result.text, winner: m.result.winner === -1 ? null : m.teams[m.result.winner].code, scores, potm: potm ? potm.name : '', opp: m.teams[1 - usIdx].code });
  f.testIdx++;
  C.match = null;
  const label = f.wc ? `${f.title}, ${f.matches[f.testIdx - 1].stage.toLowerCase()} v ${tName(f.matches[f.testIdx - 1].opp)}` : `${matchWord(f)} ${f.testIdx}${f.title ? ' (' + f.title + ')' : ''}`;
  CR.news(C, `${label}: ${m.result.text}.`, m.result.winner === usIdx ? 'good' : m.result.winner === -1 ? '' : 'bad');
  if (f.wc) CR.wcAfterMatch(C, f, m);
  CR.windowProgress(C, w);
  if (f.testIdx >= f.tests || f.status === 'done') {
    f.status = 'done';
    C.history.push({ season: CR.seasonLabel(w.season), title: f.title || fixtureDesc(f), result: seriesLine(f), tests: f.results.map(r => r.winner), fmt: fm });
    CR.news(C, `${f.title || fixtureDesc(f)}: ${seriesLine(f)}.`, 'big');
    if (fm === 'test') CR.seriesFinished(C, f); else CR.seriesFinishedWB(C, f);
  }
  C.date = CR.isoD(CR.addDays(CR.matchDate(w, f, f.testIdx - 1), lo ? 1 : 5));
  CR.goatCheck(C);
  save(); go('series', { fx: f.status === 'done' ? f : null });
}
function advance() {
  const y0 = CR.curWindow(C).season;
  $('#app').insertAdjacentHTML('beforeend', '<div class="modal-bg"><div class="modal"><h2>Simulating…</h2><p class="mute">Shield rounds and Tests around the world are being played.</p></div></div>');
  setTimeout(() => {
    CR.advanceWindow(C); save();
    const y1 = CR.curWindow(C).season;
    go('hub');
    if (y1 !== y0 && C.lastReport) openModal(() => seasonModal(C.lastReport, y1));
  }, 30);
}
function seasonModal(r, y) {
  return `<div class="modal-bg"><div class="modal wide"><h2>Season ${CR.seasonLabel(y)} begins</h2>
    <p class="mute">Everyone is a year older. Young players developed over the off-season, veterans slowed down.</p>
    ${r.improved.length ? `<h3>Most improved Australians</h3><div class="sm">${r.improved.slice(0, 8).map(([n, d]) => `${pl(n)} +${d}`).join(', ')}</div>` : ''}
    ${r.retired.length ? `<h3 style="margin-top:10px">Retirements</h3><div class="sm">${r.retired.map(esc).join(', ')}</div>` : ''}
    ${r.wonderkids.length ? `<h3 style="margin-top:10px">New talent to watch</h3><div class="sm">${r.wonderkids.map(esc).join('<br>')}</div>` : ''}
    <div class="warn" style="margin-top:10px">Contract renewals are due. Review them on the Board screen before your first series.</div>
    <div class="btns"><button class="primary" data-go="board">Go to contracts</button><button id="mClose">Later</button></div></div></div>`;
}
function confBar(v) { const cls = v >= 60 ? 'g' : v >= 35 ? 's' : 'b'; return `<div class="conf"><span class="abar big"><i class="${cls}" style="width:${v}%"></i></span><b>${Math.round(v)}%</b></div><div class="mute sm">${v >= 75 ? 'The board is delighted with you.' : v >= 55 ? 'The board is happy with your work.' : v >= 35 ? 'The board expects improvement.' : v >= 15 ? 'Your job is under pressure.' : 'Your job is on the line.'}</div>`; }

// ================= BOARD =================
function vBoard() {
  const aus = C.players.AUS.slice().sort((a, b) => E.overall(b) - E.overall(a));
  const sel = ui.cset || (ui.cset = new Set(C.contracts));
  const editable = C.contractRound;
  const leaders = aus.filter(p => E.overall(p) >= 70).sort((a, b) => b.lead - a.lead);
  const capOpts = cur => leaders.map(p => `<option value="${esc(p.name)}" ${p.name === cur ? 'selected' : ''}>${esc(p.name)} (leadership ${Math.round(p.lead)}, OVR ${E.overall(p)})</option>`).join('');
  const best = p => Math.max(E.overall(p), E.wbOverall(p, 'odi'), E.wbOverall(p, 't20'));
  const list = aus.filter(p => sel.has(p.name) || best(p) >= (ui.cmin || 72)).sort((a, b) => best(b) - best(a));
  return `<div class="wrap"><h2 style="margin-bottom:10px">Board room</h2><div class="grid2">
    <div class="card"><h3>Board confidence</h3>${confBar(C.board.conf)}
      ${C.board.exp ? `<div class="sm" style="margin-top:8px">Current target: <b>${esc(C.board.exp)}</b></div>` : ''}
      <div class="mute sm" style="margin-top:8px">The board judges you on results against expectations, the WTC, giving young players a chance, and whether you pick in-form players. Ignoring big Shield performers or backing out-of-form players draws media criticism.</div>
      <h3 style="margin-top:12px">Recent verdicts</h3>${C.board.log.slice(0, 10).map(l => `<div class="row sm"><span>${esc(l.why)}</span><span class="${l.v >= 0 ? 'win' : 'loss'}">${l.v >= 0 ? '+' : ''}${Math.round(l.v * 10) / 10}</span></div>`).join('') || '<div class="mute sm">Nothing yet.</div>'}</div>
    <div class="card"><h3>Captaincy</h3>
      <div class="form"><label>Captain<select id="capSel"><option value="">None</option>${capOpts(C.captain)}</select></label><label>Vice-captain<select id="viceSel"><option value="">None</option>${capOpts(C.vice)}</select></label></div>
      <p class="mute sm">A strong leader lifts the whole side a little and makes sharper bowling changes. Weak leaders can let the job weigh on their own batting. Changing captain upsets the old one, and doing it mid-series worries the board.</p>
      <button class="primary" id="capSave">Confirm Test leadership</button>
      <h3 style="margin-top:14px">White-ball captains</h3>
      ${['odi', 't20'].map(f => { const cc = C.captains[f] || []; const opts = cur => aus.filter(p => E.wbOverall(p, f) >= 72 && CR.intlOK(p, f)).sort((a, b) => b.lead - a.lead).map(p => `<option value="${esc(p.name)}" ${p.name === cur ? 'selected' : ''}>${esc(p.name)} (leadership ${Math.round(p.lead)}, ${FN[f]} ${E.wbOverall(p, f)})</option>`).join('');
        return `<div class="form"><label>${FN[f]} captain<select id="wcap_${f}"><option value="">None</option>${opts(cc[0])}</select></label><label>Vice<select id="wvice_${f}"><option value="">None</option>${opts(cc[1])}</select></label></div>`; }).join('')}
      <button id="wcapSave">Confirm white-ball leadership</button></div></div>
  <div class="card" style="margin-top:14px"><div class="top"><h3 style="margin:0">National contracts ${CR.seasonLabel(CR.curWindow(C).season)} · ${sel.size} players</h3>
    <div class="filters"><select id="cMin">${[60, 68, 72, 76].map(n => `<option value="${n}" ${n === (ui.cmin || 72) ? 'selected' : ''}>OVR ${n}+</option>`).join('')}</select>
    ${editable ? `<button class="primary" id="cConfirm" ${sel.size >= 20 && sel.size <= 24 ? '' : 'disabled'}>Confirm contracts</button>` : ''}</div></div>
    <p class="mute sm">${editable ? 'Renewals are open. Offer 20 to 24 contracts. New contracts lift morale; losing one hurts, and unhappy veterans may walk away from Test cricket.' : 'Contracts renew once a season, at the start of the winter. Anyone who plays a Test without one gets an automatic upgrade.'}</p>
    <div class="scroll"><table><tr><th></th><th>Player</th><th class="n">Age</th><th>State</th><th>Role</th><th>Test</th><th>ODI</th><th>T20</th><th>POT</th><th>Form</th><th>Morale</th><th class="n">Leadership</th></tr>
    ${list.map(p => `<tr class="${editable ? 'pick' : ''} ${sel.has(p.name) ? 'sel' : ''}" ${editable ? `data-ctog="${esc(p.name)}"` : ''}><td><input type="checkbox" ${sel.has(p.name) ? 'checked' : ''} ${editable ? '' : 'disabled'}></td><td>${pl(p.name)}${capTag(p.name)} ${injTag(p)}</td><td class="n">${p.age}</td><td>${p.state || ''}</td><td>${p.role}</td><td>${badge(E.overall(p))}</td><td>${badge(E.wbOverall(p, 'odi'))}</td><td>${badge(E.wbOverall(p, 't20'))}</td><td>${badge(Math.max(E.potential(p), E.wbPotential(p, 'odi'), E.wbPotential(p, 't20')), 'pot')}</td><td>${formTag(p)}</td><td>${morTag(p)}</td><td class="n">${Math.round(p.lead)}</td></tr>`).join('')}</table></div></div></div>`;
}

// ================= GOAT =================
function vGoat() {
  const k = ui.gk || 'all', L = CR.goatLists(C), list = L[k].slice(0, 50);
  const tabs = [['all', 'Overall'], ['bat', 'Batting'], ['bowl', 'Bowling'], ['ar', 'All-rounders'], ['runs', 'Most runs'], ['wk', 'Most wickets']];
  const score = r => k === 'runs' ? r.runs : k === 'wk' ? r.wk : r.sc[k];
  return `<div class="wrap"><div class="top"><div><h2>Greatest of all time</h2><p class="mute sm" style="margin:4px 0 0">Real Test careers up to November 2026, plus everything in this save. Legends are fixed; active players climb as they score runs and take wickets.</p></div>
    <div class="tabs" style="margin:0">${tabs.map(([v, l]) => `<button data-gk="${v}" class="${k === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
  <div class="card scroll"><table><tr><th>#</th><th>Player</th><th>Team</th><th class="n">Tests</th><th class="n">Runs</th><th class="n">Avg</th><th class="n">100s</th><th class="n">Wkts</th><th class="n">Bowl avg</th><th class="n">${k === 'runs' ? 'Runs' : k === 'wk' ? 'Wkts' : 'GOAT score'}</th></tr>
  ${list.map((r, i) => `<tr class="${r.active && r.nat === 'AUS' ? 'us' : ''}"><td>${i + 1}</td><td>${r.active ? pl(r.name) : esc(r.name)} ${r.active ? '<span class="tag on">Active</span>' : r.retired ? '<span class="tag">Retired in this save</span>' : ''}</td><td>${tName(r.nat)}</td>
    <td class="n">${r.m}</td><td class="n">${Math.round(r.runs)}</td><td class="n">${r.avg ? r.avg.toFixed(2) : '-'}</td><td class="n">${r.h100}</td><td class="n">${r.wk}</td><td class="n">${r.wk >= 20 ? r.bavg.toFixed(2) : '-'}</td><td class="n"><b>${score(r)}</b></td></tr>`).join('')}</table>
  <div class="mute sm" style="margin-top:8px">GOAT score rewards both volume and quality: runs and wickets, weighted heavily by average, with a bonus for hundreds. Active players' pre-career totals are approximate.</div></div></div>`;
}

// ================= EVENTS =================
function bindAll() {
  const on = (sel, ev, fn) => document.querySelectorAll(sel).forEach(el => el[ev] = fn);
  on('[data-go]', 'onclick', e => { tab = 'comm'; go(e.currentTarget.dataset.go); });
  on('#mClose', 'onclick', () => { modalFn = null; ui.plan = null; render(); });
  on('.modal-bg:not(.locked)', 'onclick', e => { if (e.target === e.currentTarget && modalFn) { modalFn = null; ui.plan = null; render(); } });
  on('[data-gk]', 'onclick', e => { ui.gk = e.currentTarget.dataset.gk; render(); });
  on('#cMin', 'onchange', e => { ui.cmin = +e.target.value; render(); });
  on('[data-ctog]', 'onclick', e => { const n = e.currentTarget.dataset.ctog; ui.cset.has(n) ? ui.cset.delete(n) : ui.cset.add(n); render(); });
  on('#cConfirm', 'onclick', () => { CR.confirmContracts(C, [...ui.cset]); save(); render(); });
  on('#wcapSave', 'onclick', () => { ['odi', 't20'].forEach(f => { const cp = $('#wcap_' + f).value || null, vc = $('#wvice_' + f).value || null; if (cp && cp === vc) return; CR.setCaptainWB(C, f, cp, vc); }); save(); render(); });
  on('#capSave', 'onclick', () => { const cp = $('#capSel').value || null, vc = $('#viceSel').value || null; if (cp && cp === vc) return; CR.setCaptain(C, cp, vc); save(); render(); });
  on('[data-xslot]', 'onclick', e => { if (e.target.closest('button') || e.target.closest('a')) return; const i = +e.currentTarget.dataset.xslot; ui.selSlot = ui.selSlot === i ? null : i; render(); });
  on('[data-up]', 'onclick', e => { const i = +e.currentTarget.dataset.up; if (i > 0) { [ui.xi[i - 1], ui.xi[i]] = [ui.xi[i], ui.xi[i - 1]]; ui.selSlot = null; render(); } });
  on('[data-down]', 'onclick', e => { const i = +e.currentTarget.dataset.down; if (i < ui.xi.length - 1) { [ui.xi[i + 1], ui.xi[i]] = [ui.xi[i], ui.xi[i + 1]]; ui.selSlot = null; render(); } });
  on('[data-rm]', 'onclick', e => { ui.xi.splice(+e.currentTarget.dataset.rm, 1); ui.selSlot = null; render(); });
  on('[data-add]', 'onclick', e => { if (e.target.closest('a')) return; const n = e.currentTarget.dataset.add;
    if (ui.selSlot != null) { ui.xi[ui.selSlot] = n; ui.selSlot = null; } else if (ui.xi.length < 11) ui.xi.push(n); else { ui.flash = 'XI is full: select a player in the XI first, then click the bench player to swap.'; }
    render(); });
  on('[data-pl]', 'onclick', e => { e.stopPropagation(); const n = e.currentTarget.dataset.pl; openModal(() => profileModal(n)); });
  on('[data-state]', 'onclick', e => { const s = e.currentTarget.dataset.state; openModal(() => stateModal(s)); });
  on('[data-club]', 'onclick', e => { const k = e.currentTarget.dataset.club; openModal(() => clubModal(k)); });
  on('[data-dom]', 'onclick', e => { ui.dom = e.currentTarget.dataset.dom; render(); });
  on('#saveBtn', 'onclick', () => {
    const code = saveCode();
    openModal(() => `<div class="modal-bg"><div class="modal wide"><h2>Save code</h2><p class="mute">Your career saves automatically in this browser. To back it up or move it to another device, copy this code and load it from the title screen.</p><textarea id="codeBox" readonly>${code}</textarea><div class="btns"><button class="primary" id="copyCode">Copy</button><button id="mClose">Close</button></div></div></div>`);
  });
  on('#copyCode', 'onclick', () => { const t = $('#codeBox'); navigator.clipboard && navigator.clipboard.writeText(t.value).then(() => { $('#copyCode').textContent = 'Copied'; }).catch(() => t.select()); });
  on('#cont', 'onclick', () => { C = load(); save(); go(C.match ? 'match' : 'hub'); whatsNew(); });
  on('#restoreBk', 'onclick', () => { try { const b = restoreBackup(); if (b && confirmRestore()) { C = b; save(); go('hub'); } } catch (e) { } });
  on('#newc', 'onclick', () => { $('#loading').textContent = 'Setting up the world and simulating the first Shield rounds…'; setTimeout(() => { C = CR.newCareer(); C.seenVer = GAME_VERSION; save(); go('hub'); }, 30); });
  on('#imp', 'onclick', () => openModal(() => '<div class="modal-bg"><div class="modal wide"><h2>Load save code</h2><textarea id="codeIn" placeholder="Paste your save code"></textarea><div id="impErr" class="warn"></div><div class="btns"><button class="primary" id="doImp">Load</button><button id="mClose">Cancel</button></div></div></div>'));
  on('#doImp', 'onclick', () => { try { C = readCode($('#codeIn').value); save(); go('hub'); } catch (e) { $('#impErr').textContent = 'That code did not work.'; } });
  on('#pickSquad', 'onclick', () => go('squad'));
  on('#skipWin', 'onclick', advance);
  on('#nextWin', 'onclick', advance);
  on('[data-plan]', 'onclick', e => { const k = e.currentTarget.dataset.plan; ui.plan = null; ui.planKey = k.includes('|') ? k : k + '|'; openModal(() => planModal(ui.planKey)); });
  on('[data-cancel]', 'onclick', e => { const [wk, fm] = e.currentTarget.dataset.cancel.split('|'); const w = C.windows.find(x => x.key === wk);
    if (fm === 'test') w.fixture = null; else w.wb = (w.wb || []).filter(f => f.fmt !== fm); CR.scheduleWindow(w); save(); render(); });
  const st = ui.plan;
  if (st) {
    on('#pFmt', 'onchange', e => { st.fmt = e.target.value; st.venues = null; render(); });
    on('#pOpp', 'onchange', e => { st.opp = e.target.value; st.venues = null; render(); });
    on('#pHome', 'onchange', e => { st.home = e.target.value === '1'; st.venues = null; render(); });
    on('#pTests', 'onchange', e => { st.tests = +e.target.value; st.venues = null; render(); });
    on('#pWhen', 'onchange', e => { st.when = e.target.value; });
    on('#pTitle', 'oninput', e => { st.title = e.target.value; });
    on('[data-pv]', 'onchange', e => { st.venues[+e.target.dataset.pv] = e.target.value; });
    on('#pSave', 'onclick', () => {
      const w = C.windows.find(x => x.key === ui.planKey.split('|')[0]);
      if (st.fmt === 'test') w.fixture = CR.mkFixture(st.opp, st.home, st.tests, st.venues.slice(), st.title.trim());
      else { w.wb = (w.wb || []).filter(f => f.fmt !== st.fmt); w.wb.push(CR.mkWB(st.fmt, st.opp, st.home, st.tests, st.venues.slice(), st.title.trim(), { when: w.fixture ? st.when : 'post' })); }
      CR.scheduleWindow(w); modalFn = null; ui.plan = null; save(); render(); });
  }
  on('#natSel', 'onchange', e => go('players', { code: e.target.value, fmt: ui.fmt }));
  on('[data-pfmt]', 'onclick', e => { ui.fmt = e.currentTarget.dataset.pfmt; ui.sk = null; render(); });
  on('#stSel', 'onchange', e => { ui.st = e.target.value; render(); });
  on('#roleSel', 'onchange', e => { ui.role = e.target.value; render(); });
  on('#pq', 'onchange', e => { ui.q = e.target.value; render(); });
  on('[data-psort]', 'onclick', e => { ui.sk = e.currentTarget.dataset.psort; render(); });
  on('#sComp', 'onchange', e => { ui.comp = e.target.value; render(); });
  on('#sScope', 'onchange', e => { ui.scope = e.target.value; render(); });
  on('#sCat', 'onchange', e => { ui.cat = e.target.value; ui.sk = null; render(); });
  on('#sMin', 'onchange', e => { ui.min = e.target.value; render(); });
  on('[data-ssort]', 'onclick', e => { ui.sk = e.currentTarget.dataset.ssort; render(); });
  on('[data-rt]', 'onclick', e => { ui.rt = e.currentTarget.dataset.rt; render(); });
  on('[data-rf]', 'onclick', e => { ui.rf = e.currentTarget.dataset.rf; render(); });
  on('[data-tog]', 'onclick', e => { const n = e.currentTarget.dataset.tog; ui.sel.has(n) ? ui.sel.delete(n) : ui.sel.add(n); render(); });
  on('#sqSt', 'onchange', e => { ui.st = e.target.value; render(); });
  on('#sqRole', 'onchange', e => { ui.role = e.target.value; render(); });
  on('#sqMin', 'onchange', e => { ui.minO = e.target.value; render(); });
  on('#autoSquad', 'onclick', () => { const f = curFixture(), fm = fmtF(f); ui.sel = new Set((fm === 'test' ? CR.autoSquad(C.players.AUS, 15) : CR.autoSquadLO(C.players.AUS, fm, 15)).map(p => p.name)); render(); });
  on('#confirmSquad', 'onclick', () => {
    const f = curFixture();
    f.squad = C.players.AUS.filter(p => ui.sel.has(p.name)).map(p => p.name);
    if (f.status !== 'active') {
      const fm = fmtF(f);
      if (!f.wc) f.oppSquad = (fm === 'test' ? CR.autoSquad(C.players[f.opp], 15) : CR.autoSquadLO(C.players[f.opp], fm, 15)).map(p => p.name).sort((a, b) => C.players[f.opp].findIndex(p => p.name === a) - C.players[f.opp].findIndex(p => p.name === b));
      f.status = 'active'; if (fm === 'test') C.energy = {};
      CR.news(C, `${FN[fm]} squad named for ${f.title || fixtureDesc(f)}: ${f.squad.join(', ')}.`);
      if (fm === 'test') CR.onSquadNamed(C, f); else { f.exp = CR.expectationWB(C, f); C.board.exp = f.exp.text; }
    }
    save(); go('series');
  });
  on('#editSquad', 'onclick', () => go('squad', { sel: new Set(curFixture().squad) }));
  on('#toPre', 'onclick', () => { const f = curFixture(), fm = fmtF(f);
    if (!f.wc) { f.oppSquad = f.oppSquad.filter(n => CR.P_(C, n)); const opp = f.oppSquad.map(n => CR.P_(C, n)).filter(p => CR.available(p)); if (opp.length < 13) { (fm === 'test' ? CR.autoSquad(C.players[f.opp], 15) : CR.autoSquadLO(C.players[f.opp], fm, 15)).forEach(p => { if (!f.oppSquad.includes(p.name)) f.oppSquad.push(p.name); }); } }
    go('prematch'); });
  on('#finishSeries', 'onclick', () => { if (curFixture()) go('hub'); else advance(); });
  on('[data-slot]', 'onchange', e => { const i = +e.target.dataset.slot, n = e.target.value.replace(' (injured)', ''), j = ui.xi.indexOf(n); if (j >= 0) ui.xi[j] = ui.xi[i]; ui.xi[i] = n; render(); });
  on('#autoXI', 'onclick', () => { const f = curFixture(), fm = fmtF(f), sq = f.squad.map(n => CR.P_(C, n)).filter(Boolean), v = VENUES[f.venues[f.testIdx]]; ui.xi = fm === 'test' ? CR.autoXI(sq, v, restedEnergy()) : CR.autoXILO(sq, fm, v); ui.selSlot = null; render(); });
  on('#startTest', 'onclick', startTest);
  const m = C && C.match;
  if (m && screen === 'match') {
    const step = () => { save(); render(); };
    on('[data-sim]', 'onclick', e => { const b = e.currentTarget; E.simUntil(m, b.dataset.sim, +b.dataset.n || 0); step(); });
    on('[data-tab]', 'onclick', e => { tab = e.currentTarget.dataset.tab; render(); });
    on('[data-toss]', 'onclick', e => { E.tossDecision(m, e.currentTarget.dataset.toss); step(); });
    on('[data-fo]', 'onclick', e => { E.followOnDecision(m, e.currentTarget.dataset.fo === '1'); step(); });
    on('#pw', 'onchange', e => { m.stopOnWicket = e.target.checked; save(); });
    on('#peo', 'onchange', e => { m.pauseEachOver = e.target.checked; save(); });
    on('#ad', 'onchange', e => { m.autoDeclare = e.target.checked; save(); });
    on('#nw', 'onchange', e => { m.teams[m.user].nightwatch = e.target.value; save(); });
    on('#appr', 'onchange', e => { m.teams[m.user].approach = e.target.value; step(); });
    on('#fld', 'onchange', e => { m.teams[m.user].field = e.target.value; step(); });
    on('#bmode', 'onchange', e => { const t = m.teams[m.user]; t.bowlMode = e.target.value; if (t.bowlMode === 'manual') t.plan = m.lo ? [null, null] : m.endBowler.slice(); step(); });
    on('[data-end]', 'onchange', e => { if (e.target.value === '') return; E.setPlan(m, +e.target.dataset.end, +e.target.value); step(); });
    on('#nextBowler', 'onchange', e => { if (e.target.value === '') return; E.setPlan(m, 0, +e.target.value); step(); });
    on('#decl', 'onclick', () => { m.declareRequested = true; E.simUntil(m, 'ball'); step(); });
    on('#sb', 'onchange', e => { showBoundaries = e.target.checked; render(); });
    on('#afterMatch', 'onclick', afterMatch);
  }
}

C = load();
render();

// ================= UPDATES (website / installed app only) =================
// When a new version is published, the browser downloads it in the background and we offer a one-click update.
// Inside the claude.ai artifact or a local file this does nothing.
function showUpdateBar(worker) {
  if (document.querySelector('.updbar')) return;
  const bar = document.createElement('div'); bar.className = 'updbar';
  bar.innerHTML = '<span>A new version of Cricket Manager is ready.</span><button>Update</button>';
  bar.querySelector('button').onclick = () => { if (C) save(); worker.postMessage('update'); };
  document.body.appendChild(bar);
}
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/claude|anthropic/.test(location.hostname)) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = true; location.reload(); } });
  navigator.serviceWorker.register('sw.js').then(reg => {
    if (reg.waiting && navigator.serviceWorker.controller) showUpdateBar(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdateBar(w); });
    });
    setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
  }).catch(() => {});
}
