// Procedural 16x16 pixel textures + sprites. Everything the site draws is
// generated here, so there are zero image assets to load.

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hexToRgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const clamp = (v, a = 0, b = 255) => Math.max(a, Math.min(b, v));
const mix = (c, f) => c.map((v) => clamp(Math.round(v * f)));

// Coarse + fine noise field (256 values 0..1) so textures look mottled, not static.
function field(r) {
  const g = Array.from({ length: 25 }, () => r());
  const f = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const gx = x / 4, gy = y / 4;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const tx = gx - x0, ty = gy - y0;
      const a = g[y0 * 5 + x0], b = g[y0 * 5 + x0 + 1];
      const c = g[(y0 + 1) * 5 + x0], d = g[(y0 + 1) * 5 + x0 + 1];
      const smooth = a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
      f.push(smooth * 0.55 + r() * 0.45);
    }
  }
  return f;
}

function make(seed, fn) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d');
  const img = g.createImageData(16, 16);
  const r = rng(seed);
  const f = field(r);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const [R, G, B, A = 255] = fn(x, y, r, f[y * 16 + x], f);
      const i = (y * 16 + x) * 4;
      img.data[i] = R; img.data[i + 1] = G; img.data[i + 2] = B; img.data[i + 3] = A;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

const pick = (pal, v) => hexToRgb(pal[Math.min(pal.length - 1, Math.floor(v * pal.length))]);

const PAL = {
  dirt: ['#6b4a2f', '#79553a', '#8a6243', '#5f4129', '#7b573b'],
  stone: ['#707070', '#7d7d7d', '#8a8a8a', '#939393', '#777777'],
  grass: ['#4f8a26', '#549028', '#5fa134', '#6bb03c', '#78bd44'],
  sand: ['#d2c583', '#dbcf8e', '#e3d89b', '#ebe1a8'],
  leaves: ['#245815', '#2f6b1e', '#3a7d26', '#448f2d'],
  snow: ['#dde8f0', '#e6eef4', '#f4f8fb', '#ffffff'],
  glow: ['#d89a2a', '#f7b73c', '#ffd36e', '#ffe9a3', '#fff2c4'],
  deepslate: ['#35353b', '#3e3e45', '#47474e', '#52525a'],
  lava: ['#d62828', '#e8590c', '#f77f00', '#ff9f1c', '#ffd23f'],
  water: ['#2655d8', '#2a5ee8', '#3269f0', '#3b78ff']
};

function dirt(seed = 1) {
  return make(seed, (x, y, r, v) => pick(PAL.dirt, v));
}
function stone(seed = 2) {
  return make(seed, (x, y, r, v) => pick(PAL.stone, v));
}
function deepslate(seed = 3) {
  return make(seed, (x, y, r, v, f) => {
    const band = f[(y * 16 + ((x + 7) % 16)) % 256];
    return pick(PAL.deepslate, v * 0.55 + band * 0.45);
  });
}
function grassTop(seed = 4) {
  return make(seed, (x, y, r, v) => pick(PAL.grass, v));
}
function grassSide(seed = 5) {
  const jag = Array.from({ length: 16 }, (_, i) => 3 + ((i * 7 + seed) % 3));
  return make(seed, (x, y, r, v) => {
    if (y < jag[x]) return pick(PAL.grass, v);
    if (y === jag[x] && (x + seed) % 2) return mix(hexToRgb('#4f8a26'), 0.9);
    return pick(PAL.dirt, v);
  });
}
function sand(seed = 6) {
  return make(seed, (x, y, r, v) => pick(PAL.sand, v));
}
function snow(seed = 7) {
  return make(seed, (x, y, r, v) => pick(PAL.snow, v));
}
function logSide(seed = 8) {
  const cols = Array.from({ length: 16 }, () => 0);
  const r0 = rng(seed);
  for (let i = 0; i < 16; i++) cols[i] = r0();
  const pal = ['#4e3a20', '#5d4527', '#6b5230', '#7a5e38'];
  return make(seed, (x, y, r, v) => pick(pal, cols[x] * 0.7 + v * 0.3));
}
function logTop(seed = 9) {
  return make(seed, (x, y, r, v) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d > 6.6) return mix(hexToRgb('#5d4527'), 0.9 + v * 0.2);
    const ring = Math.floor(d) % 2;
    return mix(hexToRgb(ring ? '#a6824c' : '#bb9a62'), 0.95 + v * 0.1);
  });
}
function leaves(seed = 10) {
  return make(seed, (x, y, r, v) => {
    if (r() < 0.12) return hexToRgb('#1b4310');
    return pick(PAL.leaves, v);
  });
}
function planks(seed = 11) {
  return make(seed, (x, y, r, v) => {
    const base = hexToRgb('#a8834f');
    if (y % 4 === 3) return mix(base, 0.68);
    const joint = (Math.floor(y / 4) * 7 + seed) % 16;
    if (x === joint) return mix(base, 0.74);
    return mix(base, 0.92 + v * 0.18);
  });
}
function glowstone(seed = 12) {
  return make(seed, (x, y, r, v) => pick(PAL.glow, v));
}
function water(seed = 13) {
  return make(seed, (x, y, r, v) => [...pick(PAL.water, v), 205]);
}
function lava(seed = 14) {
  return make(seed, (x, y, r, v) => pick(PAL.lava, v));
}
function ore(color, seed) {
  const base = hexToRgb(color);
  const light = mix(base, 1.35);
  const dark = mix(base, 0.7);
  const spots = new Set();
  const r0 = rng(seed * 31);
  for (let n = 0; n < 4; n++) {
    const cx = 2 + Math.floor(r0() * 12), cy = 2 + Math.floor(r0() * 12);
    spots.add(cx + cy * 16);
    spots.add(cx + 1 + cy * 16);
    if (r0() > 0.35) spots.add(cx + (cy + 1) * 16);
    if (r0() > 0.6) spots.add(cx + 1 + (cy + 1) * 16);
  }
  return make(seed, (x, y, r, v) => {
    if (spots.has(x + y * 16)) {
      const k = r();
      return k < 0.2 ? light : k < 0.75 ? base : dark;
    }
    return pick(PAL.stone, v);
  });
}
function bedrock(seed = 17) {
  const pal = ['#111111', '#1f1f1f', '#2e2e2e', '#3d3d3d', '#4b4b4b'];
  return make(seed, (x, y, r, v) => pick(pal, v * v + r() * 0.15));
}
function tntSide(seed = 15) {
  const font = {
    T: ['###', '.#.', '.#.', '.#.', '.#.'],
    N: ['#.#', '###', '###', '###', '#.#']
  };
  const glyphs = [font.T, font.N, font.T];
  const text = new Set();
  glyphs.forEach((gl, gi) => gl.forEach((row, ry) => [...row].forEach((ch, rx) => {
    if (ch === '#') text.add(gi * 4 + 3 + rx + (6 + ry) * 16);
  })));
  return make(seed, (x, y, r, v) => {
    if (y >= 5 && y <= 11) {
      if (text.has(x + y * 16)) return [40, 40, 40];
      return mix([232, 228, 214], 0.95 + v * 0.08);
    }
    if (y === 4 || y === 12) return [150, 40, 30];
    return mix([212, 62, 48], 0.9 + v * 0.2);
  });
}
function tntTop(seed = 16) {
  return make(seed, (x, y, r, v) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d < 1.6) return [30, 30, 30];
    return mix([200, 190, 170], 0.9 + v * 0.15);
  });
}

// ---- public texture table -------------------------------------------------
export function buildTextures() {
  return {
    dirt: dirt(), stone: stone(), deepslate: deepslate(),
    grass_top: grassTop(), grass_side: grassSide(),
    sand: sand(), snow: snow(),
    log_side: logSide(), log_top: logTop(), leaves: leaves(),
    planks: planks(), glowstone: glowstone(), water: water(), lava: lava(),
    diamond_ore: ore('#4ee3d6', 21), gold_ore: ore('#f6c93a', 22),
    iron_ore: ore('#d8a583', 23), emerald_ore: ore('#2fd06b', 24),
    redstone_ore: ore('#e53b2f', 25),
    bedrock: bedrock(), tnt_side: tntSide(), tnt_top: tntTop()
  };
}

export const toURL = (canvas) => canvas.toDataURL('image/png');

// Isometric cube icon made from three 16x16 textures.
export function blockIcon(top, left, right = left) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const face = (img, a, b, cc, d, e, f, shade) => {
    g.save();
    g.setTransform(a / 16, b / 16, cc / 16, d / 16, e, f);
    g.drawImage(img, 0, 0);
    g.fillStyle = `rgba(0,0,0,${shade})`;
    g.fillRect(0, 0, 16, 16);
    g.restore();
  };
  face(top, 14, 7, -14, 7, 16, 2, 0);
  face(left, 14, 7, 0, 14, 2, 9, 0.2);
  face(right, 14, -7, 0, 14, 16, 16, 0.4);
  return c;
}

// Palette-char sprite -> canvas.
export function sprite(rows, pal) {
  const c = document.createElement('canvas');
  c.width = rows[0].length;
  c.height = rows.length;
  const g = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }
  }));
  return c;
}

export const HEART = sprite([
  '.XX.XX.',
  'XRWRRRX',
  'XRRRRRX',
  'XRRRRRX',
  '.XRRRX.',
  '..XRX..',
  '...X...'
], { X: '#2a0808', R: '#e12b2b', W: '#ff9d9d' });

export const HEART_EMPTY = sprite([
  '.XX.XX.',
  'X..X..X',
  'X.....X',
  'X.....X',
  '.X...X.',
  '..X.X..',
  '...X...'
], { X: '#2a0808' });

export const AVATAR = sprite([
  'HHHHHHHH',
  'HHHHHHHH',
  'HSSSSSSH',
  'SSSSSSSS',
  'SBWSSWBS',
  'SSSttSSS',
  'SSMMMMSS',
  'SSSSSSSS'
], { H: '#3b2a1a', S: '#c58c5c', t: '#a8693f', B: '#3a4ccf', W: '#ffffff', M: '#8a4b3a' });

// Tiny helper so a page can paint a textured CSS background from a canvas.
export function cssTile(canvas) {
  return `url(${toURL(canvas)})`;
}
