// Shared barbell math and drawing for the free lifting tools (/tools/).
// Used by the 1RM calculators and the plate calculator.
(() => {
  // Real proportions: [weight, colour, diameter mm, thickness mm]. `extra` plates
  // are off by default in the plate calculator (not every gym has them).
  const PLATES = {
    lb: [[55, '#d23b30', 450, 62, 'extra'], [45, '#1f5fd6', 450, 56], [35, '#e8b20c', 400, 48], [25, '#1f9a55', 330, 40],
      [10, '#e9edf3', 260, 30], [5, '#d23b30', 215, 24], [2.5, '#525c6e', 165, 18], [1.25, '#b9c1cc', 140, 14, 'extra']],
    kg: [[25, '#d32f2f', 450, 54], [20, '#1f5fd6', 450, 46], [15, '#e8b20c', 450, 40], [10, '#1f9a55', 450, 34],
      [5, '#e9edf3', 230, 26], [2.5, '#2b2f38', 210, 20], [1.25, '#b9c1cc', 160, 16], [0.5, '#e9edf3', 135, 12, 'extra']],
  };
  const defaults = unit => PLATES[unit].filter(p => !p[4]).map(p => p[0]);
  const EPS = 1e-9;

  // Plates per side for a total, heaviest first (how most people load a bar).
  // If that leaves a remainder but an exact load exists with the plates given,
  // use the exact load with the fewest plates instead.
  function load(total, unit, bar, have) {
    have = (have || defaults(unit)).slice().sort((a, b) => b - a);
    const list = PLATES[unit].filter(p => have.includes(p[0]));
    let side = (total - bar) / 2;
    if (side < -EPS) return null;
    const out = [];
    for (const pl of list) while (side >= pl[0] - EPS) { out.push(pl); side -= pl[0]; }
    if (side > EPS) {
      const exact = fewest((total - bar) / 2, list);
      if (exact) return { out: exact, left: 0, bar };
    }
    return { out, left: Math.max(0, side), bar };
  }

  // Exact per-side load with the fewest plates (quarter-unit steps), or null.
  function fewest(side, list) {
    const q = 4, n = Math.round(side * q);
    if (Math.abs(n / q - side) > EPS || n > 40000) return null;
    const best = new Array(n + 1).fill(Infinity), pick = new Array(n + 1).fill(-1);
    best[0] = 0;
    const units = list.map(p => Math.round(p[0] * q));
    for (let a = 1; a <= n; a++) {
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (u <= a && best[a - u] + 1 < best[a]) { best[a] = best[a - u] + 1; pick[a] = i; }
      }
    }
    if (!isFinite(best[n])) return null;
    const out = [];
    for (let a = n; a > 0; a -= units[pick[a]]) out.push(list[pick[a]]);
    return out.sort((x, y) => y[0] - x[0]);
  }

  // Closest totals you can load at or below / at or above a target.
  function nearest(total, unit, bar, have) {
    have = have || defaults(unit);
    const q = 4, list = PLATES[unit].filter(p => have.includes(p[0])), units = list.map(p => Math.round(p[0] * q));
    const want = Math.max(0, (total - bar) / 2), top = Math.round(want * q) + Math.max(...units, 1) + 1;
    const ok = new Array(top + 1).fill(false); ok[0] = true;
    for (let a = 1; a <= top; a++) ok[a] = units.some(u => u <= a && ok[a - u]);
    let lo = Math.min(top, Math.floor(want * q + EPS)); while (lo > 0 && !ok[lo]) lo--;
    let hi = Math.ceil(want * q - EPS); while (hi < top && !ok[hi]) hi++;
    return { below: bar + 2 * lo / q, above: ok[hi] ? bar + 2 * hi / q : null };
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    const f = x => Math.max(0, Math.min(255, Math.round(x + amt)));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  // SVG of a barbell loaded with `list` (plates on one side, collar outward).
  function draw(list) {
    const W = 680, k = 0.42; // px per mm
    const big = Math.max(160, ...list.map(x => x[2])), H = Math.round(big * k + 34), cy = H - 14 - big * k / 2; // the bar rests on its biggest plates
    const sleeveL = 168, collarW = 14, shaftL = W - 2 * (sleeveL + collarW + 12);
    const thick = list.map(p => Math.max(9, p[3] * k * 1.25)), fit = Math.min(1, (sleeveL - 14) / (thick.reduce((a, b) => a + b + 1, 0) || 1));
    const xS = 12 + sleeveL + collarW, xE = xS + shaftL;
    let defs = '', g = '';
    defs += '<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2f7"/><stop offset=".45" stop-color="#a9b3c2"/><stop offset="1" stop-color="#5d6676"/></linearGradient>';
    defs += '<pattern id="knurl" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="url(#steel)"/><path d="M0 0V5" stroke="#00000022" stroke-width="1"/></pattern>';
    g += `<rect x="${xS}" y="${cy - 6}" width="${shaftL}" height="12" rx="3" fill="url(#steel)"/>`;
    g += `<rect x="${xS + 40}" y="${cy - 6}" width="${shaftL / 2 - 70}" height="12" fill="url(#knurl)"/><rect x="${xS + shaftL / 2 + 30}" y="${cy - 6}" width="${shaftL / 2 - 70}" height="12" fill="url(#knurl)"/>`;
    for (const s of [-1, 1]) {
      const inner = s < 0 ? xS : xE;
      const cx = s < 0 ? inner - collarW : inner;
      g += `<rect x="${cx}" y="${cy - 17}" width="${collarW}" height="34" rx="3" fill="url(#steel)" stroke="#00000040"/>`;
      const sx = s < 0 ? cx - sleeveL : cx + collarW;
      g += `<rect x="${sx}" y="${cy - 11}" width="${sleeveL}" height="22" rx="4" fill="url(#steel)" stroke="#00000030"/>`;
      let pos = s < 0 ? cx : cx + collarW;
      list.forEach(([wt, col, dia], i) => {
        const h = dia * k, t = thick[i] * fit, x = s < 0 ? pos - t : pos, y = cy - h / 2, id = `p${s}${i}`;
        defs += `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(col, -45)}"/><stop offset=".35" stop-color="${shade(col, 25)}"/><stop offset=".7" stop-color="${col}"/><stop offset="1" stop-color="${shade(col, -55)}"/></linearGradient>`;
        g += `<rect x="${x}" y="${y}" width="${t}" height="${h}" rx="${Math.min(5, t / 2)}" fill="url(#${id})" stroke="${shade(col, -70)}" stroke-width="1"/>`;
        g += `<rect x="${x + 1.5}" y="${y + 3}" width="${t - 3}" height="5" rx="2" fill="#ffffff2a"/>`;
        if (h > 70 && s > 0) {
          const light = col === '#e9edf3' || col === '#e8b20c' || col === '#b9c1cc';
          g += `<text x="${x + t / 2}" y="${cy}" fill="${light ? '#1d2433' : '#ffffffd9'}" font-family="Roboto,Arial" font-weight="700" font-size="${Math.min(11, t - 2)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 ${x + t / 2} ${cy})">${wt}</text>`;
        }
        pos += s < 0 ? -t - 1 : t + 1;
      });
      const clipX = s < 0 ? pos - 8 : pos;
      g += `<rect x="${clipX}" y="${cy - 14}" width="8" height="28" rx="3" fill="#2b2f38" stroke="#000" stroke-opacity=".4"/>`;
    }
    const shadow = `<ellipse cx="${W / 2}" cy="${H - 10}" rx="${W / 2 - 30}" ry="6" fill="#000" opacity=".35"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Barbell loaded with the plates listed below"><defs>${defs}</defs>${shadow}${g}</svg>`;
  }

  window.OraBar = { PLATES, defaults, load, nearest, draw };
})();
