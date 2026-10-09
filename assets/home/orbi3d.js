// 3D Orbi for the web, built from docs/product/ORBI_MASCOT_GUIDE.md:
// a glossy brand-blue ball (very slightly wider than tall), a dark visor with
// two white eyes painted on its front, and a rigid kettlebell handle. Light
// is fixed at the upper left; the visor slides round the ball as he turns.
// Interactions: follows the cursor, blinks, drag to spin, click to hop (the
// app's launch hop: crouch, jump with one full turn, jelly landing).
import * as THREE from 'three';

// Logo palette (ORBI_MASCOT_GUIDE): body #156CF6, handle #1E78FA.
const BODY = [16, 118, 246], HANDLE = 0x1e78fa, BEZEL = 0x2b58b8;
// Guide measurements, in units of the ball's horizontal radius (153 px @3x).
const RY = 137 / 153; // ball vertical radius
// Front view, in R units (R = the ball's horizontal radius), measured on the
// 3x logo art: a stadium visor with fully round ends, and tall oval eyes.
const VISOR_A = 0.75, VISOR_B = 0.385, VISOR_C = -0.03;
const EYE_X = 0.355, EYE_Y = -0.055, EYE_W = 0.108, EYE_H = 0.2;

/** Signed distance (R units) to the visor stadium in the front view. */
function visorDistance(X, Y) {
  const dx = Math.max(Math.abs(X) - (VISOR_A - VISOR_B), 0);
  const dy = Y - VISOR_C;
  return Math.sqrt(dx * dx + dy * dy) - VISOR_B;
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** The bell's paint: the logo's mid blue, a touch darker underneath. */
function bodyMap() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), img = g.createImageData(W, H);
  for (let py = 0; py < H; py++) {
    const y = Math.cos(((py + 0.5) / H) * Math.PI);
    const ao = 1 - 0.1 * smooth(-0.35, -1, y);
    for (let px = 0; px < W; px++) {
      const i = (py * W + px) * 4;
      img.data[i] = BODY[0] * ao; img.data[i + 1] = BODY[1] * ao; img.data[i + 2] = BODY[2] * ao; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Orbi's face screen, drawn in front-view coordinates (R units): deep navy
 *  glass with a fine pixel grid and scanlines, and two eyes made of light. */
const SCREEN = { x0: -VISOR_A, x1: VISOR_A, y0: VISOR_C - VISOR_B, y1: VISOR_C + VISOR_B };
function makeScreen() {
  const W = 1024, H = Math.round(W * (SCREEN.y1 - SCREEN.y0) / (SCREEN.x1 - SCREEN.x0));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const px = (X) => (X - SCREEN.x0) / (SCREEN.x1 - SCREEN.x0) * W;
  const py = (Y) => (SCREEN.y1 - Y) / (SCREEN.y1 - SCREEN.y0) * H;
  const unit = W / (SCREEN.x1 - SCREEN.x0);
  const stadium = (ctx) => { const r = H / 2; ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(W - r, 0); ctx.arc(W - r, r, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(r, H); ctx.arc(r, r, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); };
  // Static layer: glass, vignette, pixel grid, scanlines.
  const base = document.createElement('canvas'); base.width = W; base.height = H;
  const b = base.getContext('2d');
  const bg = b.createRadialGradient(W / 2, H * 0.62, H * 0.1, W / 2, H / 2, W * 0.55);
  bg.addColorStop(0, '#0d2257'); bg.addColorStop(0.55, '#071640'); bg.addColorStop(1, '#030a1f');
  b.fillStyle = bg; b.fillRect(0, 0, W, H);
  b.fillStyle = 'rgba(120,170,255,0.07)';
  for (let x = 0; x < W; x += 6) b.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 6) b.fillRect(0, y, W, 1);
  b.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < H; y += 3) b.fillRect(0, y, W, 1);
  // Alpha: the stadium shape, softly antialiased.
  const mask = document.createElement('canvas'); mask.width = W; mask.height = H;
  const m = mask.getContext('2d'); m.fillStyle = '#000'; m.fillRect(0, 0, W, H); m.fillStyle = '#fff'; stadium(m); m.fill();
  function draw(open) {
    g.clearRect(0, 0, W, H);
    g.drawImage(base, 0, 0);
    for (const side of [-1, 1]) {
      const cx = px(side * EYE_X), cy = py(EYE_Y), rx = EYE_W * unit, ry = Math.max(2, EYE_H * unit * open);
      g.save();
      // Light, not paint: a wide soft bloom, then the bright core.
      g.fillStyle = '#eaf6ff';
      for (const [blur, color] of [[70, '#2f86ff'], [34, '#6fb6ff'], [12, '#cfe8ff']]) {
        g.shadowColor = color; g.shadowBlur = blur;
        g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
      }
      const core = g.createRadialGradient(cx - rx * 0.2, cy - ry * 0.25, 1, cx, cy, Math.max(rx, ry));
      core.addColorStop(0, '#ffffff'); core.addColorStop(0.7, '#f1f8ff'); core.addColorStop(1, '#bfe0ff');
      g.shadowBlur = 0; g.fillStyle = core;
      g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    // The pixel grid shows through the lit eyes, like a real display.
    g.save(); stadium(g); g.clip();
    g.fillStyle = 'rgba(10,40,110,0.22)';
    for (let x = 0; x < W; x += 6) g.fillRect(x, 0, 1, H);
    for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 1);
    g.restore();
    tex.needsUpdate = true;
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const alpha = new THREE.CanvasTexture(mask);
  draw(1);
  return { tex, alpha, draw };
}

/** A grid in front-view space projected onto the bell's front, so texture
 *  coordinates map straight onto the screen drawing. */
function screenGeometry(lift) {
  const geo = new THREE.PlaneGeometry(SCREEN.x1 - SCREEN.x0, SCREEN.y1 - SCREEN.y0, 96, 48);
  geo.translate(0, (SCREEN.y0 + SCREEN.y1) / 2, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const X = pos.getX(i), Y = pos.getY(i), yu = Y / RY;
    const z = Math.sqrt(Math.max(0, 1 - X * X - yu * yu));
    pos.setXYZ(i, X * lift, Y * lift, z * lift);
  }
  geo.computeVertexNormals();
  return geo;
}

/** The bezel: a glossy rim tracing the screen's stadium edge on the bell. */
function bezelGeometry(lift) {
  const pts = [], r = VISOR_B, half = VISOR_A - VISOR_B, N = 220;
  for (let k = 0; k < N; k++) {
    const t = k / N * (2 * half * 2 + 2 * Math.PI * r), P = 2 * half;
    let X, Y;
    if (t < P) { X = -half + t; Y = r; }
    else if (t < P + Math.PI * r) { const a = (t - P) / r; X = half + r * Math.sin(a); Y = r * Math.cos(a); }
    else if (t < 2 * P + Math.PI * r) { X = half - (t - P - Math.PI * r); Y = -r; }
    else { const a = (t - 2 * P - Math.PI * r) / r; X = -half - r * Math.sin(a); Y = -r * Math.cos(a); }
    Y += VISOR_C;
    const yu = Y / RY, z = Math.sqrt(Math.max(0, 1 - X * X - yu * yu));
    pts.push(new THREE.Vector3(X * lift, Y * lift, z * lift));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 400, 0.026, 16, true);
}

/** A soft studio: one big round softbox at the upper left (the guide's key
 *  light), a dim blue rim at the back right, dark navy below. Gives the
 *  logo's curved glossy streaks instead of hard square reflections. */
function studioTexture() {
  const W = 1024, H = 512;
  const paint = (draw) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); draw(g); return g.getImageData(0, 0, W, H).data;
  };
  const sky = paint((g) => {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1d4fb0'); grad.addColorStop(0.5, '#0a2462'); grad.addColorStop(1, '#020814');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
  });
  const lights = paint((g) => {
    const blob = (u, v, rx, ry, color, alpha) => {
      const grad = g.createRadialGradient(u * W, v * H, 0, u * W, v * H, rx * W);
      grad.addColorStop(0, color); grad.addColorStop(0.6, color); grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.globalAlpha = alpha; g.translate(u * W, v * H); g.scale(1, ry / rx); g.translate(-u * W, -v * H);
      g.fillStyle = grad; g.beginPath(); g.arc(u * W, v * H, rx * W, 0, Math.PI * 2); g.fill(); g.restore();
    };
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    // Side strips reflect along the ball's upper-left and upper-right edges
    // (the logo's curved streaks); a dim front box gives the visor its gloss.
    blob(0.985, 0.2, 0.05, 0.08, '#ffffff', 1);     // left side, high
    blob(0.53, 0.2, 0.035, 0.065, '#e6f0ff', 0.8);  // right side, high
    blob(0.36, 0.42, 0.05, 0.12, '#5c9dff', 0.7);   // blue rim, back right
    blob(0.12, 0.42, 0.05, 0.12, '#3d7dff', 0.5);   // blue rim, back left
  });
  // Softboxes are far brighter than white, so they show in a clear coat.
  const data = new Float32Array(W * H * 4);
  const lin = (v) => Math.pow(v / 255, 2.2);
  for (let i = 0; i < W * H * 4; i += 4) {
    for (let k = 0; k < 3; k++) data[i + k] = lin(sky[i + k]) + lin(lights[i + k]) * 18;
    data[i + 3] = 1;
  }
  // Canvas rows run top-down; the equirect texture expects bottom-up.
  const flipped = new Float32Array(data.length);
  for (let y = 0; y < H; y++) flipped.set(data.subarray(y * W * 4, (y + 1) * W * 4), (H - 1 - y) * W * 4);
  const t = new THREE.DataTexture(flipped, W, H, THREE.RGBAFormat, THREE.FloatType);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(61,139,255,0.9)');
  grad.addColorStop(0.45, 'rgba(31,111,224,0.35)');
  grad.addColorStop(1, 'rgba(31,111,224,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const easeOut = (k) => 1 - (1 - k) * (1 - k);
const easeInOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

/** The app's launch hop (OraBouncePose): crouch, a jump with one full
 *  turn, then a jelly landing. [sec] is the time since the hop started;
 *  [timing] sets the phase lengths (the app's are 0.18 / 0.75 / 0.57 s) so
 *  a page can match his airtime to a move. */
function hopPose(sec, jump, timing) {
  const { crouch, air, land } = timing;
  const HEIGHT = 2.45; // Orbi's full height in ball radii
  if (sec < crouch) {
    const k = easeOut(sec / crouch);
    return { sx: 1 + 0.08 * k, sy: 1 - 0.1 * k, lift: 0, spin: 0, glow: 0.35 };
  }
  if (sec < crouch + air) {
    const u = (sec - crouch) / air;
    const lift = jump * 4 * u * (1 - u) * HEIGHT;
    const sy = u < 0.12 ? 0.9 + (1.07 - 0.9) * (u / 0.12) : 1 + 0.07 * Math.abs(Math.cos(Math.PI * u));
    return { sx: 1 / Math.sqrt(sy), sy, lift, spin: easeInOutCubic(u) * Math.PI * 2, glow: 0.35 * (1 - Math.min(1, u * 4) * 0.8) };
  }
  const tau = Math.min(1, (sec - crouch - air) / land);
  const jelly = 0.17 * Math.exp(-5.5 * tau) * Math.cos(2 * Math.PI * 3 * tau);
  return { sx: 1 + 0.8 * jelly, sy: 1 - jelly, lift: 0, spin: 0, glow: 0.35 + 0.9 * Math.exp(-6 * tau) };
}
const APP_HOP = { crouch: 0.18, air: 0.75, land: 0.57 };

/** Poses for a flight the page drives frame by frame (see setFlight). */
function crouchPose(k) { k = easeOut(Math.min(1, k)); return { sx: 1 + 0.08 * k, sy: 1 - 0.1 * k, lift: 0, spin: 0, glow: 0.35 }; }
function airPose(u, jump) {
  const sy = u < 0.12 ? 0.9 + (1.07 - 0.9) * (u / 0.12) : 1 + 0.07 * Math.abs(Math.cos(Math.PI * u));
  return { sx: 1 / Math.sqrt(sy), sy, lift: jump * 4 * u * (1 - u) * 2.45, spin: easeInOutCubic(u) * Math.PI * 2, glow: 0.35 * (1 - Math.min(1, u * 4) * 0.8) };
}
function jellyPose(tau) {
  const jelly = 0.17 * Math.exp(-5.5 * tau) * Math.cos(2 * Math.PI * 3 * tau);
  return { sx: 1 + 0.8 * jelly, sy: 1 - jelly, lift: 0, spin: 0, glow: 0.35 + 0.9 * Math.exp(-6 * tau) };
}

export function createOrbi(parent, opts = {}) {
  const {
    autoHop = 0, // seconds between idle hops; 0 = only on click
    hopOnLoad = true,
    followPointer = true,
    distance = 7.4,
    target = 1.05,
    exposure = 1.15,
    jump = 0.48, // peak of the hop, as a share of Orbi's height (the app's is 0.48)
  } = opts;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // exact logo colors: no curve shifting the blue
  renderer.toneMappingExposure = exposure;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab';
  parent.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(studioTexture()).texture;
  scene.environmentIntensity = 0.8;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, target + 0.12, distance);
  camera.lookAt(0, target, 0);

  const key = new THREE.DirectionalLight(0xd8efff, 2.1); // cyan-white, so lit blue stays blue
  const under = new THREE.DirectionalLight(0x3f8cff, 1.3); // bounce from below: the underside stays bright blue
  under.position.set(2.2, -3, 0.6); // low and from the side, so it never glints on the screen
  scene.add(under);
  key.position.set(-3.5, 4.5, 4);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0x7cc4ff, 0x1f6fe0, 1.25));
  scene.add(new THREE.AmbientLight(0x2a86ff, 0.55));
  const rim = new THREE.DirectionalLight(0x6aaeff, 1.6);
  rim.position.set(3.5, 1.5, -3);
  scene.add(rim);

  // bounce (squash at the base, lift) → turn (look + spin) → body offset
  const bounce = new THREE.Group();
  const turn = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = RY;
  bounce.add(turn); turn.add(inner); scene.add(bounce);

  // Solid, dense painted vinyl: a soft satin base under a thin clear coat.
  const solid = { roughness: 0.38, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.18 };
  const map = bodyMap();
  // The bell swells into a soft mound where each handle leg comes out, so
  // the handle grows out of it instead of poking into a perfect sphere.
  const bell = new THREE.SphereGeometry(1, 160, 120);
  {
    const pos = bell.attributes.position, n = new THREE.Vector3();
    const feet = [-1, 1].map(sx => new THREE.Vector3(sx * 0.5, Math.sqrt(1 - 0.25), 0).normalize());
    for (let i = 0; i < pos.count; i++) {
      n.fromBufferAttribute(pos, i).normalize();
      let lift = 0;
      for (const f of feet) { const a = n.angleTo(f); lift += 0.07 * Math.exp(-((a / 0.2) ** 2)); }
      n.multiplyScalar(1 + lift);
      pos.setXYZ(i, n.x, n.y, n.z);
    }
    bell.computeVertexNormals();
  }
  const body = new THREE.Mesh(
    bell,
    new THREE.MeshPhysicalMaterial({ map, ...solid, envMapIntensity: 0.55 }),
  );
  body.scale.set(1, RY, 1);
  inner.add(body);

  // Face: a curved screen set into the bell, with a glossy bezel. The eyes
  // are drawn on it as light (and blink by redrawing).
  const screen = makeScreen();
  const face = new THREE.Mesh(screenGeometry(1.004), new THREE.MeshPhysicalMaterial({
    color: 0x02060f, emissive: 0xffffff, emissiveMap: screen.tex, emissiveIntensity: 1.15,
    alphaMap: screen.alpha, transparent: true, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
  }));
  inner.add(face);
  const bezel = new THREE.Mesh(bezelGeometry(1.004), new THREE.MeshPhysicalMaterial({ color: BEZEL, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 }));
  inner.add(bezel);
  let eyeOpen = 1;

  // Handle: a thick tube arch in the front plane, legs sunk into the ball.
  const pts = [
    [-0.5, 0.6], [-0.5, 0.92], [-0.47, 1.06], [-0.37, 1.16], [-0.2, 1.21], [0, 1.22],
    [0.2, 1.21], [0.37, 1.16], [0.47, 1.06], [0.5, 0.92], [0.5, 0.6],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const SEG = 160, RAD = 40, tube = new THREE.TubeGeometry(curve, SEG, 0.18, RAD, false);
  const pos = tube.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i <= SEG; i++) {
    const c = curve.getPointAt(i / SEG);
    // Widen only the last stretch of each leg into the ball (y ≈ 0.78), a
    // smooth fillet, so the handle grows out of the bell instead of poking in.
    const k = 1;
    for (let j = 0; j <= RAD; j++) {
      const idx = i * (RAD + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  tube.computeVertexNormals();
  const handle = new THREE.Mesh(
    tube,
    new THREE.MeshPhysicalMaterial({ color: HANDLE, ...solid, envMapIntensity: 0.55 }),
  );
  inner.add(handle);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.6),
    new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.002;
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.75)'); grad.addColorStop(0.5, 'rgba(0,0,0,0.35)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.001;
  scene.add(shadow);
  scene.add(glow);

  // ---- interaction state
  let lookX = 0, lookY = 0, curX = 0, curY = 0;
  let spin = 0, spinVel = 0, dragging = false, dragMoved = 0, lastX = 0;
  let hopStart = -1, nextBlink = 1.5, blinkStart = -1, lastHop = 0;
  let hopTiming = APP_HOP;
  // A page-driven flight: { crouch: 0..1 } or { u: 0..1 }; null when grounded.
  let ext = null, landStart = -1;

  // Remember where the cursor is; the look is worked out every frame from
  // Orbi's current place, so he keeps watching it after a jump or a scroll
  // even when the mouse hasn't moved.
  let pointer = null;
  const onPointer = (e) => { if (followPointer) pointer = { x: e.clientX, y: e.clientY }; };
  function aim() {
    if (!pointer) return;
    const r = renderer.domElement.getBoundingClientRect();
    lookX = THREE.MathUtils.clamp((pointer.x - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1);
    lookY = THREE.MathUtils.clamp((pointer.y - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1);
  }
  addEventListener('pointermove', onPointer, { passive: true });
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    dragging = true; dragMoved = 0; lastX = e.clientX; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX; dragMoved += Math.abs(dx);
    spin += dx * 0.012; spinVel = dx * 0.012 * 60;
  });
  el.addEventListener('pointerup', () => {
    dragging = false; el.style.cursor = 'grab';
    if (dragMoved < 6) hop();
  });

  const clock = new THREE.Clock();
  /** Starts a hop. [timing] overrides the phase lengths; a new hop with
   *  timing restarts even mid-hop, so a page move always gets its jump. */
  function hop(timing) {
    if (reduce) return;
    if (hopStart >= 0 && !timing) return;
    hopTiming = timing ? { ...APP_HOP, ...timing } : APP_HOP;
    hopStart = clock.getElapsedTime();
    opts.onHop?.();
  }

  function resize() {
    const w = parent.clientWidth || 1, h = parent.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(parent);
  resize();

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(parent);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const now = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta() || 1 / 60, 0.05);

    let pose = { sx: 1, sy: 1, lift: 0, spin: 0, glow: 0.35 };
    if (!reduce) {
      if (ext) {
        pose = ext.crouch != null ? crouchPose(ext.crouch) : airPose(ext.u, jump);
      } else if (landStart >= 0) {
        const tau = (now - landStart) / 0.57;
        if (tau >= 1) { landStart = -1; lastHop = now; } else pose = jellyPose(tau);
      } else if (hopStart >= 0) {
        const sec = now - hopStart;
        if (sec >= hopTiming.crouch + hopTiming.air + hopTiming.land) { hopStart = -1; lastHop = now; }
        else pose = hopPose(sec, jump, hopTiming);
      } else {
        const b = Math.sin(now * 2.2) * 0.012; // breathing
        pose.sy = 1 + b; pose.sx = 1 - b * 0.6;
        if (autoHop && now - lastHop > autoHop) hop();
      }
      // Blink every few seconds.
      if (blinkStart < 0 && now > nextBlink) blinkStart = now;
      let open = 1;
      if (blinkStart >= 0) {
        const k = (now - blinkStart) / 0.16;
        if (k >= 1) { blinkStart = -1; nextBlink = now + 2.5 + Math.random() * 3; } else open = 1 - Math.sin(k * Math.PI) * 0.92;
      }
      if (Math.abs(open - eyeOpen) > 0.02 || (open === 1 && eyeOpen !== 1)) { eyeOpen = open; screen.draw(open); }
      // Spin inertia, then ease back to facing the viewer.
      if (!dragging) {
        spin += spinVel * dt;
        spinVel *= Math.pow(0.04, dt);
        if (Math.abs(spinVel) < 0.4) {
          const home = Math.round(spin / (Math.PI * 2)) * Math.PI * 2;
          spin += (home - spin) * Math.min(1, dt * 3);
        }
      }
    }
    aim();
    curX += (lookX - curX) * Math.min(1, dt * 4);
    curY += (lookY - curY) * Math.min(1, dt * 4);
    bounce.scale.set(pose.sx, pose.sy, pose.sx);
    bounce.position.y = pose.lift;
    turn.rotation.y = curX * 0.55 + spin + pose.spin;
    turn.rotation.x = curY * 0.22;
    const g = 1 - Math.min(pose.lift / 1.6, 0.6);
    glow.scale.set(g, g, g);
    shadow.scale.set(g, g, g);
    shadow.material.opacity = Math.max(0.25, 1 - pose.lift / 1.2);
    glow.material.opacity = Math.min(1, pose.glow + 0.25);
    renderer.render(scene, camera);
  }
  frame();
  if (hopOnLoad) setTimeout(hop, 700);

  /** Drive a flight from the page: setFlight({ crouch: k }) to squat,
   *  setFlight({ u }) through the air (u 0..1 sets turn and stretch),
   *  setFlight(null, true) to land with the jelly settle. */
  function setFlight(f, land = false) {
    if (reduce) return;
    if (f && !ext) { hopStart = -1; opts.onHop?.(); }
    ext = f;
    if (!f && land) landStart = clock.getElapsedTime();
  }
  /** The page shows the canvas scaled by [s]; render only the pixels that needs
   *  (in quarter steps, so a flight between slots doesn't resize every frame). */
  function setDisplayScale(s) {
    // Up to 3x, so he stays sharp when a big screen scales him past his box.
    const pr = Math.min(3, Math.max(0.5, Math.ceil(Math.min(devicePixelRatio, 3) * s * 4) / 4));
    if (pr === renderer.getPixelRatio()) return;
    renderer.setPixelRatio(pr);
    resize();
  }
  return { hop, setFlight, setDisplayScale, setLook: (x, y) => { lookX = x; lookY = y; }, canvas: el };
}
