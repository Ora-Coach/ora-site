// 1RM calculator (/tools/1rm-calculator/ and its per-lift pages).
// The page sets <body data-lift="..."> and holds the markup; this fills it in.
(() => {
const $ = id => document.getElementById(id);
const PAGES = { any: '/tools/1rm-calculator/', bench: '/tools/1rm-calculator/bench-press/', squat: '/tools/1rm-calculator/squat/',
  deadlift: '/tools/1rm-calculator/deadlift/', ohp: '/tools/1rm-calculator/overhead-press/', row: '/tools/1rm-calculator/barbell-row/' };
const lift = document.body.dataset.lift || 'any';
const q = new URLSearchParams(location.search);
// Old shared links put the lift in the query (?lift=bench); send them to that lift's page.
if (lift === 'any' && PAGES[q.get('lift')] && q.get('lift') !== 'any') {
  const to = PAGES[q.get('lift')]; q.delete('lift');
  location.replace(to + (q.toString() ? '?' + q : ''));
  return;
}
let unit = 'lb';
const RPEVALS = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', ''];
function setRpe(v) {
  $('p').value = v; const off = v === ''; $('track').classList.toggle('off', off); $('ns').classList.toggle('on', off);
  if (off) { $('rLeft').textContent = 'Not sure'; $('rRpe').textContent = 'treated as all-out'; render(); return; }
  const n = +v, left = 10 - n; $('rng').value = n; $('thumb').style.left = ((n - 6) / 4 * 100) + '%';
  $('thumb').textContent = n;
  $('rLeft').textContent = 'RPE ' + n;
  document.querySelectorAll('#ticks span').forEach(t => t.classList.toggle('on', t.dataset.v === String(n)));
  $('rRpe').textContent = left === 0 ? 'nothing left' : left === 0.5 ? 'about half a rep left' : `about ${left % 1 ? Math.floor(left) + '½' : left} rep${left === 1 ? '' : 's'} left`;
  render();
}
$('rng').oninput = e => setRpe(e.target.value);
$('ticks').onclick = e => { const t = e.target.closest('span'); if (t) setRpe(t.dataset.v); };
$('ns').onclick = () => setRpe($('ns').classList.contains('on') ? '8' : '');
document.querySelectorAll('.calc .st').forEach(b => b.onclick = () => {
  const el = $(b.dataset.t), d = +b.dataset.d; let v = parseFloat(el.value) || 0;
  if (b.dataset.t === 'w') v = Math.max(0, Math.round((v + d * step()) / step()) * step()); else v = Math.min(30, Math.max(1, Math.round(v) + d));
  el.value = v; render();
});
const step = () => unit === 'lb' ? 5 : 2.5;
const round = x => Math.round(x / step()) * step();
const fmt = x => (Math.round(x * 10) / 10).toLocaleString();
const shown = m => unit === 'kg' ? Math.round(m * 2) / 2 : Math.round(m);
// Epley with reps in reserve; a true single is the max itself (as in Ora).
const e1rm = (w, reps, rir) => reps + rir <= 1 ? w : w * (1 + (reps + rir) / 30);
const target = (m, reps, rir) => reps + rir <= 1 ? m : m / (1 + (reps + rir) / 30);
const FORMULAS = { Epley: (w, n) => n <= 1 ? w : w * (1 + n / 30), Brzycki: (w, n) => w * 36 / (37 - n), Lombardi: (w, n) => w * Math.pow(n, 0.10),
  Mayhew: (w, n) => 100 * w / (52.2 + 41.9 * Math.exp(-0.055 * n)), "O'Conner": (w, n) => w * (1 + 0.025 * n), Wathan: (w, n) => 100 * w / (48.8 + 53.8 * Math.exp(-0.075 * n)) };
const COLS = { Epley: '#3d8bff', Brzycki: '#1f9a55', Lombardi: '#e8b20c', Mayhew: '#f07b22', "O'Conner": '#c56cf0', Wathan: '#e0352b' };
let planM = 0, planL = 2;
function render() {
  const w = parseFloat($('w').value), reps = Math.min(30, Math.max(1, Math.round(+$('r').value || 1))), rpeBlank = $('p').value === '', rpe = rpeBlank ? 10 : +$('p').value, rir = 10 - rpe;
  if (!(w > 0)) { $('out').textContent = '-'; $('note').textContent = 'Enter the weight you lifted.'; return; }
  const m = e1rm(w, reps, rir);
  $('out').textContent = fmt(shown(m)) + ' ' + unit;
  $('note').textContent = `From ${fmt(w)} ${unit} × ${reps} at RPE ${rpe}` + (rpeBlank ? ' (assumed all-out)' : '');
  const chips = []; const bw = parseFloat($('bw').value);
  if (bw > 0) chips.push(`${(m / bw).toFixed(2)}× bodyweight`);
  chips.push(`${Math.round(w / m * 100)}% of max on this set`);
  if (reps + rir > 12) chips.push('High reps: rough estimate');
  $('chips').innerHTML = chips.map(c => `<span class="chip">${c}</span>`).join('');
  const bar = unit === 'lb' ? 45 : 20, tgt = round(m), pl = OraBar.load(tgt, unit, bar);
  if (pl) {
    $('bar').innerHTML = OraBar.draw(pl.out);
    $('barNote').innerHTML = `To load ${fmt(tgt)} ${unit}: a ${pl.bar} ${unit} bar plus ${pl.out.length ? pl.out.map(x => x[0]).join(' + ') + ' ' + unit + ' on each side' : 'no plates'}. <a href="/tools/plate-calculator/?t=${tgt}&u=${unit}">Other bars and plates</a>`;
  } else { $('bar').innerHTML = ''; $('barNote').textContent = 'Lighter than an empty bar.'; }
  const lefts = [[0, 'All-out'], [1, '1 left'], [2, '2 left'], [3, '3 left']];
  let h = '<tr><th>Reps</th>' + lefts.map(([l, t]) => `<th>${t}<small>RPE ${10 - l}</small></th>`).join('') + '</tr>';
  for (let n = 1; n <= 12; n++) h += `<tr><td>${n} rep${n > 1 ? 's' : ''}</td>` + lefts.map(([l]) => `<td class="${n === reps && l === rir ? 'hi' : ''}">${fmt(round(target(m, n, l)))}</td>`).join('') + '</tr>';
  planM = m; plan();
  $('gridRpe').innerHTML = h;
  h = '<tr><th>Reps</th><th>Weight</th><th>% of 1RM</th></tr>';
  for (let n = 1; n <= 30; n++) { const t = target(m, n, 0); h += `<tr><td>${n}</td><td class="${n === reps && rir === 0 ? 'hi' : ''}${n > 12 ? ' mu' : ''}">${fmt(round(t))} ${unit}</td><td class="${n > 12 ? 'mu' : ''}">${Math.round(t / m * 100)}%</td></tr>`; }
  $('gridReps').innerHTML = h;
  $('pct').innerHTML = [95, 90, 85, 80, 75, 70, 65, 60].map(p => `<div><b>${fmt(round(m * p / 100))}</b><span>${p}% · ${unit}</span></div>`).join('');
  // Deadlifts start from the floor, so the first warm-up has full-size plates on (135 lb / 60 kg).
  const floor = unit === 'lb' ? 135 : 60;
  const W = lift === 'deadlift'
    ? [['40%', Math.max(floor, round(m * .4)), 5], ['60%', Math.max(floor, round(m * .6)), 3], ['75%', round(m * .75), 2], ['85%', round(m * .85), 1], ['92%', round(m * .92), 1]]
    : [['Bar', bar, 10], ['40%', Math.max(bar, round(m * .4)), 5], ['60%', round(m * .6), 3], ['75%', round(m * .75), 2], ['85%', round(m * .85), 1], ['92%', round(m * .92), 1]];
  $('wu').innerHTML = W.map(([n, x, r], i) => `<div><span class="n">Set ${i + 1}</span><b>${fmt(x)} ${unit}</b><span>${n} · ${r} rep${r > 1 ? 's' : ''}</span></div>`).join('') + `<div class="max"><span class="n">Attempt</span><b>${fmt(tgt)} ${unit}</b><span>Your estimated max · 1 rep</span></div>`;
  const nf = reps + rir; const vals = Object.entries(FORMULAS).map(([k, f]) => [k, f(w, nf)]);
  const avg = vals.reduce((a, [, v]) => a + v, 0) / vals.length;
  const lo = Math.min(...vals.map(x => x[1])), hi = Math.max(...vals.map(x => x[1])), span = Math.max(1e-9, hi - lo), pos = v => ((v - lo) / span * 100).toFixed(1);
  $('fsum').innerHTML = `<div class="top"><div><small>AVERAGE OF ${vals.length} FORMULAS</small><b>${fmt(shown(avg))} ${unit}</b></div><div class="rg">All within ${fmt(shown(hi - lo))} ${unit} (${fmt(shown(lo))} to ${fmt(shown(hi))})</div></div>
  <div class="rangebar"><div class="ln"></div><div class="avg" style="left:${pos(avg)}%"></div>${vals.map(([k, v]) => `<i title="${k}" style="left:${pos(v)}%;background:${COLS[k]}"></i>`).join('')}<span class="end" style="left:0%">${fmt(shown(lo))}</span><span class="end" style="left:100%">${fmt(shown(hi))}</span></div>`;
  $('cmp').innerHTML = vals.map(([k, v]) => `<div class="${k === 'Epley' ? 'us' : ''}"><i style="background:${COLS[k]}"></i><b>${fmt(shown(v))} ${unit}</b><span>${k}${k === 'Epley' ? ' · used above' : ''}</span></div>`).join('');
  const qs = `?w=${w}&u=${unit}&r=${reps}&rpe=${$('p').value}` + (bw > 0 ? `&bw=${bw}` : '');
  history.replaceState(null, '', qs);
  // The lift links keep the numbers you typed.
  document.querySelectorAll('#lifts a').forEach(a => a.href = PAGES[a.dataset.k] + qs);
}
['w', 'r', 'bw'].forEach(id => $(id).addEventListener('input', render));
function plan() { const n = Math.min(12, Math.max(1, Math.round(+$('pr').value || 1))); $('pAns').textContent = planM ? fmt(round(target(planM, n, planL))) + ' ' + unit : '-'; }
$('pr').oninput = plan;
$('pr-').onclick = () => { $('pr').value = Math.max(1, (+$('pr').value || 1) - 1); plan(); };
$('pr+').onclick = () => { $('pr').value = Math.min(12, (+$('pr').value || 1) + 1); plan(); };
$('pl').onclick = e => { const b = e.target.closest('button'); if (!b) return; planL = +b.dataset.l; document.querySelectorAll('#pl button').forEach(x => x.classList.toggle('on', x === b)); plan(); };
function setUnit(u) {
  if (unit === u) return; const f = u === 'kg' ? 1 / 2.20462 : 2.20462;
  ['w', 'bw'].forEach(id => { const v = parseFloat($(id).value); if (v > 0) $(id).value = id === 'w' ? Math.round(v * f / (u === 'kg' ? 2.5 : 5)) * (u === 'kg' ? 2.5 : 5) : Math.round(v * f); });
  unit = u; $('wu1').textContent = $('wu2').textContent = u; $('lb').classList.toggle('on', u === 'lb'); $('kg').classList.toggle('on', u === 'kg'); render();
}
$('lb').onclick = () => setUnit('lb'); $('kg').onclick = () => setUnit('kg');
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  ['rpe', 'reps', 'pct'].forEach(t => $('tab-' + t).hidden = t !== b.dataset.t);
});
$('share').onclick = async () => {
  try { await navigator.clipboard.writeText(location.href); $('share').textContent = 'Copied'; } catch (_) { $('share').textContent = 'Copy the address bar'; }
  setTimeout(() => $('share').textContent = 'Copy link', 1600);
};
if (q.get('u') === 'kg') { unit = 'kg'; $('kg').classList.add('on'); $('lb').classList.remove('on'); $('wu1').textContent = $('wu2').textContent = 'kg'; }
if (q.get('w')) $('w').value = q.get('w');
if (q.get('r')) $('r').value = q.get('r');
if (q.get('bw')) $('bw').value = q.get('bw');
const rpeQ = q.has('rpe') ? q.get('rpe') : null;
setRpe(rpeQ !== null && RPEVALS.includes(rpeQ) ? rpeQ : '8');
})();
