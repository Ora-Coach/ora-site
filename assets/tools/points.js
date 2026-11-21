// Powerlifting points (DOTS, original Wilks, IPF GL). Bodyweight and total in kg.
// Constants and limits match OpenPowerlifting's opl-data `coefficients` crate.
(() => {
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const DOTS = { M: [-0.0000010930, 0.0007391293, -0.1918759221, 24.0900756, -307.75076, 40, 210],
    F: [-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, -57.96288, 40, 150] };
  const WILKS = { M: [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-06, -1.291e-08, 40, 201.9],
    F: [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 0.00004731582, -0.00000009054, 26.51, 154.53] };
  // [sex][event][equipment] = [A, B, C]
  const GL = {
    M: { SBD: { raw: [1199.72839, 1025.18162, 0.00921], eq: [1236.25115, 1449.21864, 0.01644] },
      B: { raw: [320.98041, 281.40258, 0.01008], eq: [381.22073, 733.79378, 0.02398] } },
    F: { SBD: { raw: [610.32796, 1045.59282, 0.03048], eq: [758.63878, 949.31382, 0.02435] },
      B: { raw: [142.40398, 442.52671, 0.04724], eq: [221.82209, 357.00377, 0.02937] } },
  };
  function dots(sex, bw, total) {
    if (!(bw > 0) || !(total > 0)) return 0;
    const [a, b, c, d, e, lo, hi] = DOTS[sex === 'F' ? 'F' : 'M'], x = clamp(bw, lo, hi);
    return total * 500 / ((((a * x + b) * x + c) * x + d) * x + e);
  }
  function wilks(sex, bw, total) {
    if (!(bw > 0) || !(total > 0)) return 0;
    const [a, b, c, d, e, f, lo, hi] = WILKS[sex === 'F' ? 'F' : 'M'], x = clamp(bw, lo, hi);
    return total * 500 / (a + x * (b + x * (c + x * (d + x * (e + x * f)))));
  }
  function goodlift(sex, event, equip, bw, total) {
    if (!(bw >= 35) || !(total > 0)) return 0;
    const [A, B, C] = GL[sex === 'F' ? 'F' : 'M'][event === 'B' ? 'B' : 'SBD'][equip === 'eq' ? 'eq' : 'raw'];
    const den = A - B * Math.exp(-C * bw);
    return den ? Math.max(0, total * 100 / den) : 0;
  }
  const api = { dots, wilks, goodlift };
  if (typeof window !== 'undefined') window.OraPoints = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
