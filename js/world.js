import * as THREE from '../vendor/three.module.min.js';
import { buildTextures, rng } from './textures.js';

// ---------------------------------------------------------------------------
// Block table
// ---------------------------------------------------------------------------
export const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, LOG: 5, LEAVES: 6, WATER: 7,
  SNOW: 8, PLANKS: 9, GLOW: 10, DIAMOND: 11, GOLD: 12, IRON: 13, EMERALD: 14,
  DEEPSLATE: 15, REDSTONE: 16
};

// [+x, -x, +y, -y, +z, -z] texture per block.
const T = (side, top = side, bottom = side) => [side, side, top, bottom, side, side];
const FACES = {
  [B.GRASS]: T('grass_side', 'grass_top', 'dirt'),
  [B.DIRT]: T('dirt'),
  [B.STONE]: T('stone'),
  [B.SAND]: T('sand'),
  [B.LOG]: T('log_side', 'log_top', 'log_top'),
  [B.LEAVES]: T('leaves'),
  [B.WATER]: T('water'),
  [B.SNOW]: T('snow'),
  [B.PLANKS]: T('planks'),
  [B.GLOW]: T('glowstone'),
  [B.DIAMOND]: T('diamond_ore'),
  [B.GOLD]: T('gold_ore'),
  [B.IRON]: T('iron_ore'),
  [B.EMERALD]: T('emerald_ore'),
  [B.DEEPSLATE]: T('deepslate'),
  [B.REDSTONE]: T('redstone_ore')
};

const DEBRIS = {
  [B.GRASS]: 0x5fa134, [B.DIRT]: 0x79553a, [B.STONE]: 0x7d7d7d, [B.SAND]: 0xdbcf8e,
  [B.LOG]: 0x6b5230, [B.LEAVES]: 0x2f6b1e, [B.SNOW]: 0xf0f6fa, [B.PLANKS]: 0xa8834f,
  [B.GLOW]: 0xffd36e, [B.DIAMOND]: 0x4ee3d6, [B.GOLD]: 0xf6c93a, [B.IRON]: 0xd8a583,
  [B.EMERALD]: 0x2fd06b, [B.DEEPSLATE]: 0x3e3e45, [B.REDSTONE]: 0xe53b2f, [B.WATER]: 0x3269f0
};

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------
const N = 45;   // x / z size
const H = 48;   // height
const idx = (x, y, z) => (y * N + z) * N + x;
const inb = (x, y, z) => x >= 0 && x < N && y >= 0 && y < H && z >= 0 && z < N;

function makeNoise(seed) {
  const r = rng(seed);
  const tab = Float32Array.from({ length: 64 * 64 }, () => r());
  const v = (ix, iz) => tab[(ix & 63) + (iz & 63) * 64];
  const smooth = (t) => t * t * (3 - 2 * t);
  const base = (x, z) => {
    const x0 = Math.floor(x), z0 = Math.floor(z);
    const tx = smooth(x - x0), tz = smooth(z - z0);
    return (v(x0, z0) * (1 - tx) + v(x0 + 1, z0) * tx) * (1 - tz) +
           (v(x0, z0 + 1) * (1 - tx) + v(x0 + 1, z0 + 1) * tx) * tz;
  };
  return (x, z) => (base(x, z) * 0.6 + base(x * 2.1 + 17, z * 2.1 + 3) * 0.3 + base(x * 4.3 + 5, z * 4.3 + 11) * 0.1);
}

function generate(seed) {
  const r = rng(seed * 977 + 13);
  const n1 = makeNoise(seed * 7 + 1);
  const n2 = makeNoise(seed * 13 + 5);
  const data = new Uint8Array(N * H * N);
  const set = (x, y, z, id) => { if (inb(x, y, z)) data[idx(x, y, z)] = id; };
  const get = (x, y, z) => (inb(x, y, z) ? data[idx(x, y, z)] : B.AIR);
  const tops = new Int16Array(N * N).fill(-1);
  const c = (N - 1) / 2;
  const R = N * 0.44;

  // --- floating island body
  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - c, z - c) / R + (n2(x * 0.11, z * 0.11) - 0.5) * 0.5;
      const m = 1 - d;
      if (m <= 0.03) continue;
      const mm = Math.min(1, m);
      const hill = n1(x * 0.08, z * 0.08);
      const top = Math.round(20 + hill * 10 * Math.min(1, mm * 2.2) + mm * 3 - (1 - Math.min(1, mm * 3)) * 2);
      const depth = Math.max(2, Math.round(2 + Math.pow(mm, 1.25) * 15 + (n2(x * 0.2 + 40, z * 0.2) - 0.5) * 5));
      tops[z * N + x] = top;
      for (let k = 0; k <= depth; k++) {
        const y = top - k;
        if (y < 1) break;
        let id;
        if (k === 0) id = mm < 0.06 ? B.SAND : top >= 29 ? B.SNOW : B.GRASS;
        else if (k <= 3) id = mm < 0.06 ? B.SAND : B.DIRT;
        else id = k > 9 ? B.DEEPSLATE : B.STONE;
        if (k > 3 && r() < 0.055) {
          const q = r();
          id = q < 0.14 ? B.DIAMOND : q < 0.34 ? B.GOLD : q < 0.64 ? B.IRON : q < 0.8 ? B.EMERALD : B.REDSTONE;
        }
        set(x, y, z, id);
      }
    }
  }
  const topAt = (x, z) => (x < 0 || z < 0 || x >= N || z >= N ? -1 : tops[z * N + x]);

  // --- pond
  const px = Math.round(c + 8), pz = Math.round(c - 6);
  if (topAt(px, pz) > 0) {
    let level = 99;
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      if (Math.hypot(dx, dz) > 4) continue;
      const t = topAt(px + dx, pz + dz);
      if (t > 0) level = Math.min(level, t);
    }
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      const dist = Math.hypot(dx, dz);
      const x = px + dx, z = pz + dz;
      const t = topAt(x, z);
      if (t < 0 || dist > 4.2) continue;
      if (dist <= 2.9) {
        for (let y = level + 1; y <= t + 1; y++) set(x, y, z, B.AIR);
        set(x, level - 1, z, B.SAND);
        set(x, level, z, B.WATER);
        tops[z * N + x] = level;
      } else if (t < level) {
        for (let y = t + 1; y < level; y++) set(x, y, z, B.DIRT);
        set(x, level, z, B.GRASS);
        tops[z * N + x] = level;
      }
    }
  }

  // --- developer cabin on a flattened platform
  const cx = Math.round(c), cz = Math.round(c);
  const base = Math.max(22, topAt(cx, cz));
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
    const x = cx + dx, z = cz + dz;
    for (let y = base + 1; y < H; y++) set(x, y, z, B.AIR);
    let y0 = base;
    while (y0 > 0 && get(x, y0, z) === B.AIR) y0--;
    for (let y = y0 + 1; y <= base; y++) set(x, y, z, B.DIRT);
    set(x, base, z, B.GRASS);
    tops[z * N + x] = base;
  }
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    set(cx + dx, base, cz + dz, B.PLANKS);
    if (Math.max(Math.abs(dx), Math.abs(dz)) === 2) {
      const corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
      for (let y = 1; y <= 3; y++) set(cx + dx, base + y, cz + dz, corner ? B.LOG : B.PLANKS);
    }
  }
  set(cx, base + 1, cz + 2, B.AIR); set(cx, base + 2, cz + 2, B.AIR);       // door
  set(cx - 2, base + 2, cz, B.AIR); set(cx + 2, base + 2, cz, B.AIR);       // windows
  set(cx, base + 2, cz - 2, B.AIR);
  for (let layer = 0; layer < 4; layer++) {
    const rad = 3 - layer;
    for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) set(cx + dx, base + 4 + layer, cz + dz, B.LOG);
  }
  set(cx, base + 4, cz, B.GLOW);                                             // lamp inside
  set(cx - 1, base + 1, cz + 3, B.GLOW); set(cx + 1, base + 1, cz + 3, B.GLOW); // lamps by the door

  // --- trees
  const trees = [];
  for (let attempt = 0; attempt < 80 && trees.length < 10; attempt++) {
    const x = 3 + Math.floor(r() * (N - 6)), z = 3 + Math.floor(r() * (N - 6));
    const t = topAt(x, z);
    if (t < 0 || get(x, t, z) !== B.GRASS) continue;
    if (Math.hypot(x - cx, z - cz) < 7.5 || Math.hypot(x - px, z - pz) < 5) continue;
    if (trees.some(([a, b]) => Math.hypot(a - x, b - z) < 4)) continue;
    trees.push([x, z]);
    const h = 4 + Math.floor(r() * 2);
    for (let i = 1; i <= h; i++) set(x, t + i, z, B.LOG);
    for (let dy = -1; dy <= 2; dy++) {
      const rad = dy <= 0 ? 2 : 1;
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        const corner = Math.abs(dx) === rad && Math.abs(dz) === rad;
        if (corner && (rad === 2 ? r() < 0.55 : dy === 2)) continue;
        const lx = x + dx, ly = t + h + dy, lz = z + dz;
        if (get(lx, ly, lz) === B.AIR) set(lx, ly, lz, B.LEAVES);
      }
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// World / renderer
// ---------------------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const SKY = [
  { s: -1,    top: [4, 6, 26],      bot: [11, 18, 48] },
  { s: -0.14, top: [6, 9, 32],      bot: [16, 26, 62] },
  { s: -0.02, top: [49, 52, 104],   bot: [226, 112, 70] },
  { s: 0.1,   top: [88, 130, 214],  bot: [250, 178, 120] },
  { s: 0.3,   top: [72, 130, 232],  bot: [176, 214, 255] },
  { s: 1,     top: [52, 118, 236],  bot: [168, 210, 255] }
];
function skyAt(s) {
  for (let i = 0; i < SKY.length - 1; i++) {
    const a = SKY[i], b = SKY[i + 1];
    if (s <= b.s) {
      const t = (s - a.s) / (b.s - a.s);
      return { top: a.top.map((v, k) => lerp(v, b.top[k], t)), bot: a.bot.map((v, k) => lerp(v, b.bot[k], t)) };
    }
  }
  return SKY[SKY.length - 1];
}
const css = (c) => `rgb(${c.map(Math.round).join(',')})`;

export function createWorld({ canvas, hero, onEvent = () => {}, reduceMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 600);
  const target = new THREE.Vector3(0, 19, 0);

  // lights ---------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5b4a3a, 0.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  const sz = small ? 1024 : 2048;
  sun.shadow.mapSize.set(sz, sz);
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 260 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  sun.target.position.copy(target);
  scene.add(sun, sun.target);

  const lampLight = new THREE.PointLight(0xffc766, 0, 26, 1.6);
  scene.add(lampLight);

  // celestial bodies ------------------------------------------------------
  const sunMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 2), new THREE.MeshBasicMaterial({ color: 0xfff1b0, fog: false }));
  const moonMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 2), new THREE.MeshBasicMaterial({ color: 0xdde6ff, fog: false }));
  scene.add(sunMesh, moonMesh);

  // clouds ----------------------------------------------------------------
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  const clouds = new THREE.Group();
  {
    const r = rng(99);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 16; i++) {
      const a = r() * Math.PI * 2;
      const rad = i % 4 === 0 ? 40 + r() * 14 : 95 + r() * 40;
      const y = i % 4 === 0 ? 58 + r() * 8 : 4 + r() * 46;
      const cl = new THREE.Group();
      const parts = 4 + Math.floor(r() * 5);
      for (let p = 0; p < parts; p++) {
        const m = new THREE.Mesh(geo, cloudMat);
        m.scale.set(6 + r() * 8, 2 + r() * 1.4, 5 + r() * 5);
        m.position.set((p - parts / 2) * 6 + r() * 3, r() * 1.5, (r() - 0.5) * 6);
        cl.add(m);
      }
      cl.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad);
      cl.rotation.y = r() * 3;
      clouds.add(cl);
    }
  }
  scene.add(clouds);

  // block materials ---------------------------------------------------------
  const canvases = buildTextures();
  const matCache = {};
  const matFor = (key) => {
    if (matCache[key]) return matCache[key];
    const tex = new THREE.CanvasTexture(canvases[key]);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    const opts = { map: tex };
    if (key === 'glowstone') Object.assign(opts, { emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.85 });
    if (key === 'water') Object.assign(opts, { transparent: true, depthWrite: false });
    return (matCache[key] = new THREE.MeshLambertMaterial(opts));
  };
  const blockMats = {};
  for (const id of Object.keys(FACES)) blockMats[id] = FACES[id].map(matFor);

  // island ------------------------------------------------------------------
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const island = new THREE.Group();
  scene.add(island);
  let data = generate(7);
  let meshes = [];
  let pickables = [];
  let blockCount = 0;
  const m4 = new THREE.Matrix4();
  const half = (N - 1) / 2;

  const solidForExposure = (id) => id !== B.AIR && id !== B.WATER;
  function exposed(x, y, z, id) {
    const nb = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    for (const [dx, dy, dz] of nb) {
      const X = x + dx, Y = y + dy, Z = z + dz;
      if (!inb(X, Y, Z)) return true;
      const o = data[idx(X, Y, Z)];
      if (o === B.AIR) return true;
      if (solidForExposure(id) && o === B.WATER) return true;
    }
    return false;
  }

  function rebuild() {
    for (const m of meshes) { island.remove(m); m.dispose(); }
    meshes = []; pickables = []; blockCount = 0;
    const buckets = {};
    for (let y = 0; y < H; y++) for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const id = data[idx(x, y, z)];
      if (!id) continue;
      blockCount++;
      if (!exposed(x, y, z, id)) continue;
      (buckets[id] ||= []).push(x, y, z);
    }
    for (const id of Object.keys(buckets)) {
      const list = buckets[id];
      const count = list.length / 3;
      const mesh = new THREE.InstancedMesh(geo, blockMats[id], count);
      for (let i = 0; i < count; i++) {
        m4.makeTranslation(list[i * 3] - half, list[i * 3 + 1], list[i * 3 + 2] - half);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      mesh.castShadow = +id !== B.WATER;
      mesh.receiveShadow = true;
      mesh.userData = { id: +id, list };
      island.add(mesh);
      meshes.push(mesh);
      if (+id !== B.WATER) pickables.push(mesh);
    }
  }
  rebuild();

  // hover highlight ------------------------------------------------------------
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.012, 1.012, 1.012)),
    new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85 })
  );
  outline.visible = false;
  island.add(outline);

  // particles -------------------------------------------------------------------
  const pGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  const particles = [];
  function burst(pos, id, count = 10, power = 3) {
    const color = DEBRIS[id] ?? 0x888888;
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(pGeo, new THREE.MeshLambertMaterial({ color }));
      m.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8));
      m.castShadow = true;
      island.add(m);
      particles.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * power, Math.random() * power * 0.9 + 1, (Math.random() - 0.5) * power), life: 0.7 + Math.random() * 0.6 });
    }
  }

  // picking -----------------------------------------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -(((clientY - rect.top) / rect.height) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, false);
    if (!hits.length) return null;
    const h = hits[0];
    const list = h.object.userData.list;
    const i = h.instanceId * 3;
    return {
      x: list[i], y: list[i + 1], z: list[i + 2], id: h.object.userData.id,
      nx: Math.round(h.face.normal.x), ny: Math.round(h.face.normal.y), nz: Math.round(h.face.normal.z)
    };
  }
  const worldPos = (x, y, z) => new THREE.Vector3(x - half, y, z - half);

  let tool = 'break';
  let selected = B.GRASS;
  let hover = null;
  let needsPick = false;
  let pointer = { x: 0, y: 0 };

  function act(hit, forcePlace = false) {
    if (!hit) return;
    if (tool === 'break' && !forcePlace) {
      data[idx(hit.x, hit.y, hit.z)] = B.AIR;
      burst(worldPos(hit.x, hit.y, hit.z), hit.id, 12);
      rebuild();
      onEvent('break', { id: hit.id });
    } else {
      const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
      if (!inb(x, y, z) || data[idx(x, y, z)] !== B.AIR) return;
      data[idx(x, y, z)] = selected;
      burst(worldPos(x, y, z), selected, 5, 1.6);
      rebuild();
      onEvent('place', { id: selected });
    }
    hover = null;
    outline.visible = false;
  }

  // pointer interaction: click = act, drag = orbit
  let down = null;
  let dragAz = 0;
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, button: e.button, moved: false, lastX: e.clientX };
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    if (down) {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
      if (down.moved) { dragAz -= (e.clientX - down.lastX) * 0.006; }
      down.lastX = e.clientX;
    }
    needsPick = true;
  });
  const endPress = (e) => {
    if (down && !down.moved && e.type === 'pointerup') {
      const hit = pick(e.clientX, e.clientY);
      act(hit, down.button === 2);
    }
    down = null;
  };
  canvas.addEventListener('pointerup', endPress);
  canvas.addEventListener('pointercancel', endPress);
  canvas.addEventListener('pointerleave', () => { hover = null; outline.visible = false; });

  // time of day -----------------------------------------------------------------------
  let tod = 0.2;           // 0 sunrise, .25 noon, .5 sunset, .75 midnight
  let todTarget = null;
  const PHASES = { sunrise: 0.02, day: 0.25, noon: 0.25, sunset: 0.47, dusk: 0.47, night: 0.75, midnight: 0.75 };
  const sunDir = new THREE.Vector3();
  let nightFactor = 0;

  function applyTime() {
    const a = tod * Math.PI * 2;
    const s = Math.sin(a);
    sunDir.set(Math.cos(a) * 0.9, s, 0.42).normalize();
    const day = smoothstep(-0.05, 0.3, s);
    const moon = smoothstep(0.04, 0.4, -s);
    nightFactor = 1 - smoothstep(-0.16, 0.08, s);

    const lightPos = s >= 0 ? sunDir.clone() : sunDir.clone().multiplyScalar(-1);
    sun.position.copy(lightPos.multiplyScalar(90)).add(target);
    sun.intensity = s >= 0 ? day * 2.6 : moon * 0.55;
    sun.color.setRGB(...(s >= 0 ? [1, lerp(0.62, 0.97, day), lerp(0.4, 0.92, day)] : [0.55, 0.65, 1]));
    hemi.intensity = lerp(0.42, 0.78, day);
    hemi.color.setRGB(lerp(0.35, 0.82, day), lerp(0.42, 0.91, day), lerp(0.7, 1, day));
    lampLight.intensity = nightFactor * 55;

    sunMesh.position.copy(sunDir).multiplyScalar(160).add(target);
    moonMesh.position.copy(sunDir).multiplyScalar(-160).add(target);
    sunMesh.lookAt(target); moonMesh.lookAt(target);
    sunMesh.visible = s > -0.2;
    moonMesh.visible = s < 0.2;

    const g = Math.max(0.2, day);
    cloudMat.color.setRGB(lerp(0.18, 1, g), lerp(0.2, 1, g), lerp(0.3, 1, g));

    const sky = skyAt(s);
    hero.style.setProperty('--sky-top', css(sky.top));
    hero.style.setProperty('--sky-bot', css(sky.bot));
    hero.style.setProperty('--night', nightFactor.toFixed(3));
  }
  lampLight.position.set(0.5, 27, 1.5);

  // camera ------------------------------------------------------------------------------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let shake = 0;
  let pop = 0;           // 0..1 build-in animation
  let elapsed = 0;
  let width = 1, height = 1;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Push the island to the right on wide screens so the title has room.
    if (width > 980) camera.setViewOffset(width, height, -width * 0.2, 0, width, height);
    else camera.clearViewOffset();
    camera.fov = width < 700 ? 52 : 38;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  // main loop -----------------------------------------------------------------------------
  let running = false;
  let raf = 0;
  let last = 0;
  let fps = 60, frames = 0, fpsClock = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    elapsed += dt;
    frames++; fpsClock += dt;
    if (fpsClock >= 0.5) { fps = frames / fpsClock; frames = 0; fpsClock = 0; }

    // time of day
    if (todTarget !== null) {
      let diff = (todTarget - tod + 1) % 1;
      const step = 0.3 * dt;
      if (diff <= step) { tod = todTarget; todTarget = null; } else tod = (tod + step) % 1;
    } else if (!reduceMotion) {
      tod = (tod + dt / 240) % 1;
    }
    applyTime();

    // camera orbit
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    const orbit = reduceMotion ? 0.6 : elapsed * 0.045;
    const az = orbit + dragAz + mouse.x * 0.22 + 0.5;
    const R = 82;
    const camY = 38 - mouse.y * 4;
    shake *= 0.9;
    camera.position.set(
      Math.cos(az) * R + (Math.random() - 0.5) * shake,
      camY + Math.sin(elapsed * 0.4) * 0.6 + (Math.random() - 0.5) * shake,
      Math.sin(az) * R + (Math.random() - 0.5) * shake
    );
    camera.lookAt(target);

    // island pop-in
    if (pop < 1) {
      pop = Math.min(1, pop + dt * 1.6);
      const e = 1 - Math.pow(1 - pop, 3);
      island.scale.setScalar(0.55 + 0.45 * e);
      island.position.y = (1 - e) * -14;
    }
    clouds.rotation.y += dt * 0.006;

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.v.y -= 14 * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.rotation.x += dt * 6; p.m.rotation.z += dt * 5;
      p.m.scale.setScalar(Math.max(0.01, Math.min(1, p.life * 2)));
      if (p.life <= 0) { island.remove(p.m); p.m.material.dispose(); particles.splice(i, 1); }
    }

    // hover
    if (needsPick && !down?.moved) {
      needsPick = false;
      hover = pick(pointer.x, pointer.y);
      if (hover) {
        outline.visible = true;
        outline.position.set(hover.x - half, hover.y, hover.z - half);
      } else outline.visible = false;
      canvas.style.cursor = hover ? 'crosshair' : 'grab';
    }

    renderer.render(scene, camera);
  }

  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()), { threshold: 0.02 });
  io.observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  applyTime();
  renderer.render(scene, camera);

  // public api ------------------------------------------------------------------------------
  return {
    setTool: (t) => { tool = t; },
    getTool: () => tool,
    setBlock: (id) => { selected = id; },
    setTime(name) {
      const v = typeof name === 'number' ? name : PHASES[name];
      if (v === undefined) return false;
      todTarget = v;
      return true;
    },
    getTime: () => ({ tod, night: nightFactor }),
    regenerate(seed = Math.floor(Math.random() * 100000)) {
      data = generate(seed);
      rebuild();
      pop = 0;
      hover = null; outline.visible = false;
      onEvent('regenerate', { seed });
      return seed;
    },
    explode() {
      // Find a random surface block and blast a crater around it.
      const r = Math.random;
      let cx = 0, cy = 0, cz = 0, found = false;
      for (let tries = 0; tries < 60 && !found; tries++) {
        cx = 6 + Math.floor(r() * (N - 12)); cz = 6 + Math.floor(r() * (N - 12));
        for (let y = H - 1; y > 0; y--) {
          const id = data[idx(cx, y, cz)];
          if (id && id !== B.WATER) { cy = y; found = true; break; }
        }
      }
      if (!found) return;
      const rad = 4.2;
      for (let dz = -5; dz <= 5; dz++) for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
        if (Math.hypot(dx, dy, dz) > rad + r() * 0.8) continue;
        const x = cx + dx, y = cy + dy, z = cz + dz;
        if (!inb(x, y, z)) continue;
        const id = data[idx(x, y, z)];
        if (!id) continue;
        if (r() < 0.12) burst(worldPos(x, y, z), id, 2, 6);
        data[idx(x, y, z)] = B.AIR;
      }
      burst(worldPos(cx, cy, cz), B.GLOW, 18, 8);
      shake = 1.6;
      rebuild();
      onEvent('explode', {});
    },
    info: () => ({ fps, blocks: blockCount, drawn: meshes.reduce((a, m) => a + m.count, 0), tod, cam: camera.position.clone() })
  };
}
