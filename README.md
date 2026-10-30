<img src="assets/icon.svg" width="64" height="64" alt="">

# Alex Voxel — voxel-themed developer portfolio

A personal developer page inspired by voxel sandbox games. Plain HTML/CSS/JS (ES modules) plus a vendored copy of
[Three.js](https://threejs.org) r160 — no build step, no framework, no image assets (every texture is generated in code).

## Run it

ES modules need a web server (opening `index.html` via `file://` won't work):

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## What's in it

- **Interactive 3D hero** — a procedurally generated floating island with a cabin, trees, a pond and ores.
  Drag to orbit, click to break blocks, right-click (or *Place* tool) to build, change the time of day,
  generate a new world, or press **TNT**. Real shadows, day/night cycle, stars and a lit cabin at night.
- **Dig down through the layers** — Surface → Dirt (about) → Stone (skills inventory) → Deepslate (projects as
  "advancements") → Deep dark (experience timeline) → Bedrock (contact chat) → Lava footer.
- **Game HUD** — depth meter (Y level), XP bar tied to scroll progress, hotbar navigation (keys `1`–`6`),
  achievement toasts, `F3` debug overlay.
- **Chat contact form** with slash commands: `/help`, `/time set night`, `/seed`, `/tnt`, `/hire`, `/clear`.
- Easter egg: the Konami code. Respects `prefers-reduced-motion`; works on touch devices.

## Make it yours

- Name, bio, projects, experience, links: `index.html`
- Skills, soft skills, roles, splash texts, e-mail address: top of `js/main.js`
- World generation (island shape, trees, cabin): `generate()` in `js/world.js`
- Block textures: `js/textures.js`

Created in [T3 Code](https://t3.codes).
