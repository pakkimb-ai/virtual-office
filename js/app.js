import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const people = {
  grok: {
    name: "Grok Bot",
    role: "隊長",
    status: "busy",
    task: "喺度執緊嘢，陣間先傾～（對齊大家進度）",
    updated: "2026-10-30 21:55 HKT",
  },
  ai: {
    name: "AI開發人員",
    role: "開發",
    status: "busy",
    task: "喺度執緊嘢，陣間先傾～（3D 辦公室同枱面擺設）",
    updated: "2026-10-30 21:55 HKT",
  },
  design: {
    name: "設計助手",
    role: "設計",
    status: "busy",
    task: "喺度執緊嘢，陣間先傾～（動森風色板同造型）",
    updated: "2026-10-30 21:55 HKT",
  },
  write: {
    name: "寫作助手",
    role: "寫作",
    status: "busy",
    task: "執緊開場白同狀態短句。",
    updated: "2026-10-30 21:55 HKT",
  },
  cut: {
    name: "剪片助手",
    role: "剪片",
    status: "idle",
    task: "得閒喺工位等你。（Showreel 41s ready）",
    updated: "2026-10-30 21:55 HKT",
  },
};

const ORANGE = 0xff7a29;
const PURPLE = 0x9b6dff;
const CREAM = 0xf5f0e8;
const BUSY = 0xff7a29;
const IDLE = 0x5ecf9a;
const WOOD = 0xe0b07a;
const WOOD2 = 0xc48a4a;

const host = document.getElementById("canvasHost");
const dlg = document.getElementById("deskDialog");
const nameEl = document.getElementById("dlgName");
const badgeEl = document.getElementById("dlgBadge");
const roleEl = document.getElementById("dlgRole");
const taskEl = document.getElementById("dlgTask");
const updatedEl = document.getElementById("dlgUpdated");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcbb8e8);
scene.fog = new THREE.Fog(0xcbb8e8, 22, 48);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(10, 9, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
host.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);
controls.maxPolarAngle = Math.PI * 0.46;
controls.minDistance = 7;
controls.maxDistance = 24;

scene.add(new THREE.AmbientLight(0xfff0e0, 0.85));
const sun = new THREE.DirectionalLight(0xffe6c8, 0.9);
sun.position.set(8, 14, 6);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xffe8d0, 0x9b6dff, 0.45));
const warm = new THREE.PointLight(ORANGE, 0.5, 28);
warm.position.set(-2, 3, 2);
scene.add(warm);

function toon(color, emissive = 0x000000, ei = 0) {
  return new THREE.MeshToonMaterial({ color, emissive, emissiveIntensity: ei });
}

function box(w, h, d, color, x, y, z, parent = scene, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    toon(color, opts.emissive ?? 0, opts.ei ?? 0)
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function round(r, color, x, y, z, parent = scene, sy = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), toon(color));
  m.position.set(x, y, z);
  m.scale.y = sy;
  m.castShadow = true;
  parent.add(m);
  return m;
}

// Room — cream floor, soft lavender walls (AC daytime-ish + Halloween tint)
box(16, 0.4, 14, 0xf0e2c8, 0, 0, 0);
box(16, 4.5, 0.4, 0xe8d8f8, 0, 2.25, -6.7);
box(0.4, 4.5, 14, 0xddd0f0, -7.8, 2.25, 0);
box(0.4, 4.5, 14, 0xd8c8ec, 7.8, 2.25, 0);
box(7, 0.08, 5, 0xffe0b8, 0, 0.24, 0.3); // rug

// Wall TV for cut preview
box(3.2, 2.0, 0.15, 0x2a1f14, 2.2, 2.6, -6.45);
box(2.8, 1.6, 0.12, 0x1a2030, 2.2, 2.6, -6.35, scene, {
  emissive: ORANGE,
  ei: 0.2,
});

// Cute pumpkins & bats
function pumpkin(x, z, s = 1) {
  round(0.42 * s, ORANGE, x, 0.42 * s, z, scene, 0.85);
  box(0.1 * s, 0.2 * s, 0.1 * s, 0x4a8a3a, x, 0.72 * s, z);
}
pumpkin(-6.2, -5.2, 1.2);
pumpkin(6.0, -4.8, 0.9);
pumpkin(-5.5, 4.5, 0.75);

const bats = [];
function bat(x, y, z) {
  const g = new THREE.Group();
  round(0.12, 0x3a2a55, 0, 0, 0, g);
  box(0.5, 0.06, 0.22, 0x4a3a6a, -0.3, 0, 0, g);
  box(0.5, 0.06, 0.22, 0x4a3a6a, 0.3, 0, 0, g);
  g.position.set(x, y, z);
  scene.add(g);
  bats.push(g);
}
bat(-2.5, 3.8, -5);
bat(1.5, 3.5, -4.2);

const clickables = [];

function labelSprite(text) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 80;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(245,240,232,0.95)";
  roundRect(ctx, 20, 16, 280, 48, 24);
  ctx.fill();
  ctx.strokeStyle = "#5a3d82";
  ctx.lineWidth = 5;
  roundRect(ctx, 20, 16, 280, 48, 24);
  ctx.stroke();
  ctx.fillStyle = "#2a1f14";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 160, 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(2.1, 0.52, 1);
  return sp;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function baseDesk(parent) {
  box(1.6, 0.16, 0.95, WOOD, 0, 0.82, 0, parent);
  [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].forEach(([lx, lz]) => {
    box(0.12, 0.78, 0.12, WOOD2, lx, 0.39, lz, parent);
  });
  // chubby chair
  box(0.62, 0.5, 0.62, PURPLE, 0, 0.42, 0.85, parent);
  box(0.62, 0.55, 0.12, 0x7a52cc, 0, 0.85, 1.08, parent);
}

function lamp(parent, status) {
  const col = status === "busy" ? BUSY : IDLE;
  const bulb = round(0.15, col, 0.55, 1.25, -0.15, parent);
  bulb.material.emissive = new THREE.Color(col);
  bulb.material.emissiveIntensity = 0.9;
  const light = new THREE.PointLight(col, 0.55, 4);
  light.position.set(0.55, 1.25, -0.15);
  parent.add(light);
  return bulb;
}

function propsFor(id, parent) {
  if (id === "ai") {
    // monitor + keyboard + laptop
    box(0.9, 0.55, 0.08, 0x2a2a35, 0, 1.25, -0.25, parent);
    box(0.75, 0.42, 0.04, 0x7ec8ff, 0, 1.25, -0.2, parent, { emissive: 0x2266aa, ei: 0.35 });
    box(0.2, 0.35, 0.12, 0x444450, 0, 0.98, -0.15, parent);
    box(0.85, 0.05, 0.3, 0x333340, 0, 0.92, 0.15, parent); // keyboard
    box(0.55, 0.04, 0.38, 0x555566, -0.45, 0.95, 0.05, parent); // laptop base
    box(0.55, 0.35, 0.03, 0x88ccee, -0.45, 1.12, -0.12, parent, { emissive: 0x225577, ei: 0.25 });
  } else if (id === "write") {
    // paper stack + pen + desk lamp + coffee
    box(0.45, 0.08, 0.55, CREAM, -0.25, 0.95, 0, parent);
    box(0.42, 0.06, 0.52, 0xfff8e8, -0.22, 1.02, 0.02, parent);
    box(0.4, 0.05, 0.5, CREAM, -0.2, 1.08, 0.04, parent);
    box(0.04, 0.04, 0.35, 0x2a1f14, 0.25, 0.95, 0.1, parent); // pen
    box(0.08, 0.35, 0.08, 0xffd090, 0.5, 1.1, -0.25, parent); // lamp pole
    round(0.16, 0xffe0a0, 0.5, 1.32, -0.25, parent);
    round(0.12, 0xc48a4a, 0.35, 0.98, 0.28, parent); // coffee
    box(0.08, 0.1, 0.08, CREAM, 0.35, 1.08, 0.28, parent);
  } else if (id === "design") {
    // tablet + color swatches
    box(0.7, 0.04, 0.5, 0x333340, 0.1, 0.94, 0.05, parent);
    box(0.62, 0.02, 0.42, 0xf0e8ff, 0.1, 0.97, 0.05, parent);
    box(0.06, 0.08, 0.06, ORANGE, -0.55, 0.96, -0.2, parent);
    box(0.06, 0.08, 0.06, PURPLE, -0.45, 0.96, -0.2, parent);
    box(0.06, 0.08, 0.06, 0x5ecf9a, -0.35, 0.96, -0.2, parent);
    box(0.06, 0.08, 0.06, 0xffd166, -0.25, 0.96, -0.2, parent);
    box(0.05, 0.28, 0.05, 0x888899, 0.45, 1.05, 0.2, parent); // stylus
  } else if (id === "cut") {
    // dual screens + clapper
    box(0.7, 0.45, 0.06, 0x2a2a35, -0.35, 1.2, -0.25, parent);
    box(0.55, 0.32, 0.03, 0xff9955, -0.35, 1.2, -0.2, parent, { emissive: ORANGE, ei: 0.3 });
    box(0.7, 0.45, 0.06, 0x2a2a35, 0.4, 1.2, -0.2, parent);
    box(0.55, 0.32, 0.03, 0x66aadd, 0.4, 1.2, -0.15, parent, { emissive: 0x226688, ei: 0.3 });
    box(0.4, 0.06, 0.28, 0x1a1a1a, 0, 0.95, 0.2, parent); // clapper base
    box(0.4, 0.05, 0.08, CREAM, 0, 1.0, 0.05, parent);
  } else if (id === "grok") {
    // clipboard / board + walkie
    box(0.55, 0.7, 0.05, WOOD2, -0.35, 1.25, -0.2, parent);
    box(0.45, 0.58, 0.03, CREAM, -0.35, 1.25, -0.16, parent);
    round(0.14, 0x555566, 0.4, 1.0, 0.15, parent); // walkie body
    box(0.05, 0.22, 0.05, 0x333340, 0.4, 1.2, 0.15, parent); // antenna
    box(0.35, 0.08, 0.35, PURPLE, 0.15, 0.95, -0.25, parent); // sticky notes block
  }
}

function makeDesk(id, x, z, label) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  baseDesk(g);
  propsFor(id, g);
  const bulb = lamp(g, people[id].status);
  const sp = labelSprite(label);
  sp.position.set(0, 1.75, 0);
  g.add(sp);
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.9, 1.9),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.y = 0.9;
  hit.userData = { id };
  g.add(hit);
  clickables.push(hit);
  scene.add(g);
  return { bulb, status: people[id].status };
}

const deskMeta = [
  makeDesk("grok", -3.5, -1.5, "Grok Bot"),
  makeDesk("ai", 0.3, -2.6, "AI開發"),
  makeDesk("design", 3.6, -1.2, "設計"),
  makeDesk("write", -2.6, 2.4, "寫作"),
  makeDesk("cut", 2.8, 2.5, "剪片"),
];

function openPerson(id) {
  const p = people[id];
  if (!p) return;
  nameEl.textContent = p.name;
  roleEl.textContent = p.role;
  taskEl.textContent = p.task;
  updatedEl.textContent = "更新：" + p.updated;
  badgeEl.textContent = p.status === "busy" ? "忙緊" : "得閒";
  badgeEl.className = "badge " + (p.status === "busy" ? "busy" : "idle");
  dlg.showModal?.() || dlg.setAttribute("open", "");
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let moved = false;
renderer.domElement.addEventListener("pointerdown", () => { moved = false; });
renderer.domElement.addEventListener("pointermove", () => { moved = true; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (moved) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickables, false);
  if (hits[0]?.object?.userData?.id) openPerson(hits[0].object.userData.id);
});

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
resize();
addEventListener("resize", resize);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  bats.forEach((b, i) => {
    b.position.y = 3.4 + Math.sin(t * 1.3 + i) * 0.2;
  });
  deskMeta.forEach((d, i) => {
    if (d.status === "busy") d.bulb.material.emissiveIntensity = 0.55 + Math.sin(t * 2.8 + i) * 0.3;
  });
  controls.update();
  renderer.render(scene, camera);
}
animate();
