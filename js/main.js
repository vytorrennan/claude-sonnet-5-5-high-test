import { buildTextures, blockIcon, toURL, HEART, AVATAR } from './textures.js';
import { createWorld, B } from './world.js';

document.documentElement.classList.add('js');

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===========================================================================
// CONTENT — edit these to make the page yours (more copy lives in index.html)
// ===========================================================================
const EMAIL = 'hello@example.dev';
const ROLES = ['web apps', 'game tools', 'rendering engines', 'developer tooling', 'open source', 'fast software'];
const SPLASHES = [
  'Hello, World!', 'Now with 100% more commits!', 'Compiles on my machine!', 'Also try Rust!', 'Ship it!',
  'git push --force (not really)', 'Works in production!', 'Powered by coffee!', 'Not a creeper!', 'Fully voxel-ized!',
  'Open to quests!', 'It’s dangerous to go alone!'
];

// [glyph, name, stack size, colour, text colour, lore]
const STACK = [
  ['TS', 'TypeScript', 64, '#3178c6', '#fff', 'My default language since 2016.'],
  ['JS', 'JavaScript', 64, '#f7df1e', '#111', 'Where it all began.'],
  ['RE', 'React', 56, '#20232a', '#61dafb', 'Hooks, Suspense and server components.'],
  ['SV', 'Svelte', 40, '#ff3e00', '#fff', 'Compiler-powered joy.'],
  ['CSS', 'CSS', 58, '#7e3fd8', '#fff', 'Grid, container queries and custom properties.'],
  ['3JS', 'Three.js', 48, '#111111', '#fff', 'You’re looking at it.'],
  ['GL', 'WebGL', 44, '#990000', '#fff', 'Shaders, instancing and happy GPUs.'],
  ['AX', 'Accessibility', 36, '#1b8a5a', '#fff', 'Accessible by default, not by audit.'],
  ['VT', 'Vite', 42, '#646cff', '#fff', 'Instant feedback loops.'],

  ['RS', 'Rust', 52, '#b7410e', '#fff', 'Fearless concurrency, fearless refactors.'],
  ['GO', 'Go', 44, '#00add8', '#00262e', 'Boring in the best way.'],
  ['PY', 'Python', 48, '#3776ab', '#ffd43b', 'Glue, data and quick experiments.'],
  ['NO', 'Node.js', 56, '#3c873a', '#fff', 'Event loops since 0.10.'],
  ['PG', 'PostgreSQL', 50, '#336791', '#fff', 'The answer is usually Postgres.'],
  ['RD', 'Redis', 32, '#d82c20', '#fff', 'Fast, and then faster.'],
  ['GQ', 'GraphQL', 30, '#e10098', '#fff', 'Ask for what you need.'],
  ['SQ', 'SQLite', 38, '#0f80cc', '#fff', 'The most deployed database on Earth.'],
  ['WA', 'WebAssembly', 34, '#654ff0', '#fff', 'Near-native speed in the browser.'],

  ['GIT', 'Git', 64, '#f05032', '#fff', 'Rebase interactive is a lifestyle.'],
  ['DK', 'Docker', 52, '#2496ed', '#fff', 'Works on every machine, eventually.'],
  ['K8', 'Kubernetes', 28, '#326ce5', '#fff', 'Yes, I can read the YAML.'],
  ['TF', 'Terraform', 34, '#7b42bc', '#fff', 'Infrastructure you can diff.'],
  ['NV', 'Neovim', 58, '#57a143', '#0a1a07', 'Main hand. Always.'],
  ['LX', 'Linux', 60, '#2b2b2b', '#ffd54a', 'Daily driver (btw).'],
  ['CI', 'CI / CD', 46, '#e8590c', '#fff', 'Green builds make me happy.'],
  ['AWS', 'Cloud', 30, '#ff9900', '#222', 'AWS, GCP and a lot of cost dashboards.'],
  ['AI', 'LLM tooling', 26, '#cc785c', '#fff', 'Prompts, tools and evals that actually ship.']
];
const SOFT = [
  ['grass', 'Curiosity', 64, 'Always digging into how things work.'],
  ['log', 'Mentoring', 48, 'Growing engineers is the best force multiplier.'],
  ['iron', 'Code review', 56, 'Kind, specific and fast.'],
  ['diamond', 'Systems design', 52, 'Boxes, arrows and honest trade-offs.'],
  ['gold', 'Writing', 40, 'Docs and design docs people actually read.'],
  ['emerald', 'Pairing', 44, 'Two heads, one keyboard.'],
  ['redstone', 'Debugging', 60, 'Reproduce, isolate, understand, fix.'],
  ['glow', 'Shipping', 64, 'Small steps, every day.'],
  ['tnt', 'Refactoring', 33, 'Controlled demolition only.']
];

// ===========================================================================
// Textures -> CSS variables and icons
// ===========================================================================
const tex = buildTextures();
const rootStyle = document.documentElement.style;
const url = (c) => `url(${toURL(c)})`;
rootStyle.setProperty('--tex-dirt', url(tex.dirt));
rootStyle.setProperty('--tex-stone', url(tex.stone));
rootStyle.setProperty('--tex-deepslate', url(tex.deepslate));
rootStyle.setProperty('--tex-bedrock', url(tex.bedrock));
rootStyle.setProperty('--tex-lava', url(tex.lava));
rootStyle.setProperty('--tex-grass-side', url(tex.grass_side));

const ICON_SRC = {
  grass: [tex.grass_top, tex.grass_side],
  dirt: [tex.dirt, tex.dirt],
  stone: [tex.stone, tex.stone],
  planks: [tex.planks, tex.planks],
  glow: [tex.glowstone, tex.glowstone],
  log: [tex.log_top, tex.log_side],
  iron: [tex.iron_ore, tex.iron_ore],
  diamond: [tex.diamond_ore, tex.diamond_ore],
  gold: [tex.gold_ore, tex.gold_ore],
  emerald: [tex.emerald_ore, tex.emerald_ore],
  redstone: [tex.redstone_ore, tex.redstone_ore],
  tnt: [tex.tnt_top, tex.tnt_side]
};
const iconCache = {};
const icon = (name) => (iconCache[name] ||= toURL(blockIcon(...ICON_SRC[name])));
const img = (name, cls) => {
  const el = document.createElement('img');
  el.src = icon(name); el.alt = ''; el.decoding = 'async';
  if (cls) el.className = cls;
  return el;
};

$('#brand-icon').src = icon('grass');
$('#tnt-icon').src = icon('tnt');
$$('#hotbar a').forEach((a) => a.prepend(img(a.dataset.icon)));
$$('.card[data-icon] .card-icon').forEach((el) => el.append(img(el.closest('.card').dataset.icon)));
$('#year').textContent = new Date().getFullYear();
$$('a[href^="mailto:"]').forEach((a) => (a.href = `mailto:${EMAIL}`));

// avatar + hearts
$('#avatar').getContext('2d').drawImage(AVATAR, 0, 0);
for (let i = 0; i < 10; i++) {
  const c = document.createElement('canvas');
  c.width = c.height = 7;
  c.getContext('2d').drawImage(HEART, 0, 0);
  $('#hearts').append(c);
}

// ===========================================================================
// Hero: stars, splash text, typed roles
// ===========================================================================
{
  const stars = $('#stars');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('i');
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 72}%;` +
      `width:${2 + Math.floor(Math.random() * 3)}px;height:${2 + Math.floor(Math.random() * 3)}px;` +
      `animation-delay:${(-Math.random() * 3).toFixed(2)}s;opacity:${(0.5 + Math.random() * 0.5).toFixed(2)}`;
    frag.append(s);
  }
  stars.append(frag);
}

const splashEl = $('#splash');
const randomSplash = () => { splashEl.textContent = SPLASHES[Math.floor(Math.random() * SPLASHES.length)]; };
randomSplash();

{
  const typed = $('#typed');
  if (reduceMotion) {
    let i = 0;
    setInterval(() => { typed.textContent = ROLES[++i % ROLES.length]; }, 2600);
  } else {
    let role = 0, chars = ROLES[0].length, deleting = true;
    const tick = () => {
      const word = ROLES[role];
      if (deleting) chars--; else chars++;
      typed.textContent = word.slice(0, chars);
      let delay = deleting ? 38 : 75;
      if (!deleting && chars === word.length) { deleting = true; delay = 1700; }
      else if (deleting && chars === 0) { deleting = false; role = (role + 1) % ROLES.length; delay = 280; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1800);
  }
}

// ===========================================================================
// Inventory
// ===========================================================================
const tier = (n) => (n >= 56 ? ['Diamond', 'lvl'] : n >= 44 ? ['Gold', ''] : n >= 30 ? ['Iron', ''] : ['Stone', '']);

function tip(name, meta, lore) {
  const t = document.createElement('span');
  t.className = 'tip';
  t.setAttribute('aria-hidden', 'true');
  const s = document.createElement('strong'); s.textContent = name;
  const e = document.createElement('em'); e.className = 'lvl'; e.textContent = meta;
  const l = document.createElement('small'); l.textContent = lore;
  t.append(s, e, l);
  return t;
}

function slot(child, name, count, meta, lore) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'slot';
  b.setAttribute('aria-label', `${name}. ${meta}. ${lore}`);
  const n = document.createElement('span');
  n.className = 'slot-count'; n.textContent = count;
  b.append(child, n, tip(name, meta, lore));
  return b;
}

{
  const inv = document.createElement('div');
  inv.className = 'inv-grid';
  for (const [glyph, name, count, bg, fg, lore] of STACK) {
    const g = document.createElement('span');
    g.className = 'slot-glyph';
    g.textContent = glyph;
    g.style.setProperty('--c', bg);
    g.style.setProperty('--fg', fg);
    inv.append(slot(g, name, count, `Mastery: ${tier(count)[0]}`, lore));
  }
  $('#inventory').append(inv);

  const hot = $('#inv-hotbar');
  hot.className = 'inv-grid';
  for (const [ic, name, count, lore] of SOFT) hot.append(slot(img(ic, 'slot-img'), name, count, `Mastery: ${tier(count)[0]}`, lore));

  // keep tooltips inside the viewport
  const place = (e) => {
    const s = e.currentTarget, t = $('.tip', s);
    t.style.translate = '0 0';
    const r = t.getBoundingClientRect();
    const m = 10;
    const dx = r.left < m ? m - r.left : r.right > innerWidth - m ? innerWidth - m - r.right : 0;
    t.style.translate = `${dx}px 0`;
  };
  $$('.slot').forEach((s) => { s.addEventListener('mouseenter', place); s.addEventListener('focus', place); });
}

// ===========================================================================
// Ore decoration in the underground layers
// ===========================================================================
{
  const ORES = { 'layer-stone': ['iron', 'redstone', 'iron'], 'layer-deepslate': ['diamond', 'gold', 'redstone', 'emerald'], 'layer-deep': ['diamond', 'emerald', 'diamond'] };
  const r = Math.random;
  for (const [cls, list] of Object.entries(ORES)) {
    const layer = $('.' + cls);
    const W = layer.clientWidth, Hh = layer.offsetHeight;
    const gutter = (W - Math.min(1120, W - 40)) / 2;
    const wide = gutter >= 90;
    const count = wide ? Math.max(4, Math.round(Hh / 260)) : 4;
    for (let i = 0; i < count; i++) {
      const name = list[Math.floor(r() * list.length)];
      let x, y;
      if (wide) {
        x = i % 2 ? W - gutter + 8 + r() * (gutter - 80) : 8 + r() * (gutter - 80);
        y = 30 + r() * (Hh - 120);
      } else {
        // narrow screens: only the empty padding band at the bottom of the layer
        x = r() * (W - 60);
        y = Hh - 20 - r() * 70;
      }
      const o = document.createElement('i');
      o.className = 'ore' + (name === 'diamond' || name === 'emerald' ? ' sparkle' : '');
      o.style.cssText = `left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;animation-delay:${(-r() * 3).toFixed(1)}s;`;
      o.style.backgroundImage = `url(${toURL(tex[name + '_ore'])})`;
      o.setAttribute('aria-hidden', 'true');
      layer.prepend(o);
    }
  }
}

// ===========================================================================
// Toasts / achievements
// ===========================================================================
const toasts = $('#toasts');
const unlocked = new Set();
function toast(title, text, iconName = 'grass') {
  const el = document.createElement('div');
  el.className = 'toast';
  const i = img(iconName);
  const d = document.createElement('div');
  const s = document.createElement('strong'); s.textContent = title;
  const t = document.createElement('span'); t.textContent = text;
  d.append(s, t);
  el.append(i, d);
  toasts.append(el);
  while (toasts.children.length > 2) toasts.firstElementChild.remove();
  setTimeout(() => el.remove(), 4300);
}
function achieve(key, text, iconName) {
  if (unlocked.has(key)) return;
  unlocked.add(key);
  toast('Advancement Made!', text, iconName);
}

// ===========================================================================
// 3D world
// ===========================================================================
const flash = $('#flash');
const boom = () => { flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); };
let broken = 0;
let world = null;

try {
  world = createWorld({
    canvas: $('#world'),
    hero: $('#home'),
    reduceMotion,
    onEvent(name) {
      if (name === 'break') {
        broken++;
        achieve('break', 'Miner — break your first block', 'iron');
        if (broken === 15) achieve('break15', 'Strip Miner — break 15 blocks', 'diamond');
      } else if (name === 'place') {
        achieve('place', 'Builder — place your first block', 'planks');
      } else if (name === 'explode') {
        boom();
        achieve('tnt', 'Cheeky — that wasn’t a decorative button', 'tnt');
      } else if (name === 'regenerate') {
        achieve('seed', 'Terraformer — generate a new world', 'grass');
        randomSplash();
      }
    }
  });
} catch (err) {
  console.warn('WebGL unavailable, showing the page without the 3D island.', err);
  $('#world').remove();
  $('.tools').remove();
}

if (world) {
  const toolBtns = $$('[data-tool]');
  const setTool = (t) => {
    world.setTool(t);
    toolBtns.forEach((b) => { const on = b.dataset.tool === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
  };
  toolBtns.forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));

  const PALETTE = [['grass', B.GRASS], ['dirt', B.DIRT], ['stone', B.STONE], ['planks', B.PLANKS], ['glow', B.GLOW]];
  const pal = $('#palette');
  PALETTE.forEach(([name, id], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = name[0].toUpperCase() + name.slice(1);
    b.setAttribute('aria-label', `Place ${name}`);
    b.setAttribute('aria-pressed', i === 0);
    b.append(img(name));
    b.addEventListener('click', () => {
      world.setBlock(id);
      $$('button', pal).forEach((x) => x.setAttribute('aria-pressed', x === b));
      setTool('place');
    });
    pal.append(b);
  });

  $$('[data-time]').forEach((b) => b.addEventListener('click', () => {
    world.setTime(b.dataset.time);
    if (b.dataset.time === 'night') achieve('night', 'Night Owl — it’s past bedtime', 'glow');
  }));
  $('#btn-seed').addEventListener('click', () => world.regenerate());
  $('#btn-tnt').addEventListener('click', () => world.explode());
}

// ===========================================================================
// Scroll: XP bar, depth meter, hotbar highlight, reveal
// ===========================================================================
const sections = $$('[data-layer]');
const hotLinks = $$('#hotbar a');
const xpFill = $('#xp-fill'), xpLevel = $('#xp-level');
const depthY = $('#depth-y'), depthLayer = $('#depth-layer');
let lastActive = null;
let depthNow = 64, layerNow = 'Surface', progressNow = 0;

function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progressNow = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  xpFill.style.width = (progressNow * 100).toFixed(1) + '%';
  xpLevel.textContent = Math.round(progressNow * 30);

  const mid = innerHeight * 0.5;
  let current = sections[0];
  for (const s of sections) {
    const r = s.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) {
      current = s;
      const t = (mid - r.top) / r.height;
      const from = +s.dataset.yFrom, to = +s.dataset.yTo;
      depthNow = Math.round(from + (to - from) * t);
      break;
    }
  }
  if (progressNow > 0.995) { current = sections[sections.length - 1]; depthNow = -64; }
  layerNow = current.dataset.layer;
  depthY.textContent = depthNow;
  depthLayer.textContent = layerNow;

  const id = current.id;
  if (id !== lastActive) {
    lastActive = id;
    hotLinks.forEach((a) => {
      const on = a.dataset.section === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    if (id === 'skills') achieve('stone', 'Spelunker — reach the stone layer', 'stone');
    if (id === 'projects') achieve('deep', 'Deep Diver — reach the deepslate', 'diamond');
    if (id === 'contact') achieve('bedrock', 'Rock Bottom — reach bedrock', 'redstone');
  }
}
let scrollRaf = 0;
addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; onScroll(); }); }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

// reveal + count-up
function countUp(el) {
  const target = +el.dataset.count, suffix = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
  const t0 = performance.now(), dur = 1400;
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased).toLocaleString('en-US') + (t === 1 ? suffix : '');
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(countUp);
    revealIO.unobserve(e.target);
  }
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal]').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 70}ms`;
  revealIO.observe(el);
});

// ===========================================================================
// Keyboard: 1-6 jump, F3 debug, Konami
// ===========================================================================
const debug = $('#debug');
const typing = () => /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kIdx = 0;

addEventListener('keydown', (e) => {
  if (e.key === 'F3') { e.preventDefault(); debug.hidden = !debug.hidden; return; }
  if (typing()) return;
  if (e.key >= '1' && e.key <= '6' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    hotLinks[+e.key - 1].click();
    return;
  }
  kIdx = e.key === konami[kIdx] ? kIdx + 1 : e.key === konami[0] ? 1 : 0;
  if (kIdx === konami.length) {
    kIdx = 0;
    achieve('konami', 'Cheat Code — you know the classics', 'tnt');
    if (world) { scrollTo({ top: 0, behavior: 'smooth' }); for (let i = 0; i < 4; i++) setTimeout(() => world.explode(), 500 + i * 450); }
  }
});

setInterval(() => {
  if (debug.hidden) return;
  const info = world?.info();
  const cam = info?.cam;
  const hh = info ? ((info.tod * 24 + 6) % 24) : 0;
  const clock = `${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor((hh % 1) * 60)).padStart(2, '0')}`;
  debug.textContent = [
    'Alex Voxel Portfolio 1.0 (vanilla JS / three r160)',
    info ? `${Math.round(info.fps)} fps  ·  blocks: ${info.blocks.toLocaleString('en-US')} (drawn ${info.drawn.toLocaleString('en-US')})` : 'WebGL: unavailable',
    cam ? `XYZ: ${cam.x.toFixed(2)} / ${cam.y.toFixed(2)} / ${cam.z.toFixed(2)}` : '',
    `Layer: ${layerNow}  ·  Y: ${depthNow}`,
    `Time: ${clock}  ·  Scroll: ${(progressNow * 100).toFixed(0)}%`,
    'Press F3 to close'
  ].filter(Boolean).join('\n');
}, 250);

// ===========================================================================
// Chat
// ===========================================================================
const log = $('#chat-log');
const form = $('#chat-form');
const input = $('#chat-input');

function line(cls, ...parts) {
  const p = document.createElement('p');
  if (cls) p.className = cls;
  for (const part of parts) p.append(part);
  log.append(p);
  while (log.children.length > 60) log.firstElementChild.remove();
  log.scrollTop = log.scrollHeight;
  return p;
}
const sys = (text, cls = 'c-sys') => line(cls, text);
const name = (text, cls = 'c-name') => { const s = document.createElement('span'); s.className = cls; s.textContent = text + ' '; return s; };

const COMMANDS = {
  help: () => {
    sys('[Server] Commands:');
    ['/time set <dawn|day|dusk|night>', '/seed', '/tnt', '/whoami', '/hire', '/clear'].forEach((c) => sys('  ' + c, 'c-ok'));
  },
  time: (args) => {
    const v = args[1];
    if (args[0] === 'set' && world?.setTime(v)) { sys(`[Server] Time set to ${v}.`, 'c-ok'); if (v === 'night') achieve('night', 'Night Owl — it’s past bedtime', 'glow'); }
    else sys('[Server] Usage: /time set <dawn|day|dusk|night>', 'c-err');
  },
  seed: () => { if (world) { const s = world.regenerate(); sys(`[Server] Generated a new world (seed ${s}).`, 'c-ok'); } else sys('[Server] No world to generate.', 'c-err'); },
  tnt: () => { if (world) { world.explode(); sys('[Server] Ssssss… boom.', 'c-err'); scrollTo({ top: 0, behavior: 'smooth' }); } },
  whoami: () => sys('[Server] Alex Voxel — Full-Stack Builder, level 27. Spawn: 2014.', 'c-ok'),
  hire: () => {
    const a = document.createElement('a'); a.href = `mailto:${EMAIL}`; a.textContent = EMAIL;
    line('c-ok', name('<Alex>', 'c-me'), 'Excellent choice. Write to me at ', a, '.');
  },
  gamemode: () => sys('[Server] Gamemode set to Creative. (You were always the creator.)', 'c-ok'),
  clear: () => { log.replaceChildren(); }
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  if (text.startsWith('/')) {
    const [cmd, ...args] = text.slice(1).split(/\s+/);
    line('', name('>', 'c-sys'), text);
    (COMMANDS[cmd.toLowerCase()] || (() => sys(`[Server] Unknown command: /${cmd}. Try /help`, 'c-err')))(args);
    return;
  }
  line('', name('<You>'), text);
  const a = document.createElement('a');
  a.textContent = 'click to send it by email';
  a.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Hello from your site')}&body=${encodeURIComponent(text)}`;
  line('c-sys', '[Server] Message ready — ', a, '.');
  achieve('chat', 'Social Butterfly — send a chat message', 'emerald');
});

// Welcome
if (innerWidth > 700) setTimeout(() => achieve('welcome', 'Hello, World! Drag the island, click a block.', 'grass'), 1400);
