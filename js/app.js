import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const people = {
  grok: {
    name: "Grok Bot",
    role: "隊長 · 統籌",
    status: "busy",
    task: "定範圍同優先；拉齊各職能",
    updated: "2026-10-30 21:50 HKT",
  },
  ai: {
    name: "AI開發人員",
    role: "網頁 · 3D 落地",
    status: "busy",
    task: "Three.js 萬聖節辦公室可拖轉初版",
    updated: "2026-10-30 21:50 HKT",
  },
  design: {
    name: "設計助手",
    role: "視覺 · 主題皮",
    status: "busy",
    task: "卡通色板／工位視覺方向",
    updated: "2026-10-30 21:50 HKT",
  },
  write: {
    name: "寫作助手",
    role: "文案 · 狀態語",
    status: "busy",
    task: "務實開場白同工位彈出文案",
    updated: "2026-10-30 21:50 HKT",
  },
  cut: {
    name: "剪片助手",
    role: "素材 · 剪接",
    status: "idle",
    task: "Showreel 試版 ready（41s／1080p）；片頭／轉場 TBD",
    updated: "2026-10-30 21:50 HKT",
  },
};

const NIGHT = 0x1a1224;
const FOG = 0x2b1f3d;
const ORANGE = 0xff7a29;
const PURPLE = 0x9b6dff;
const CREAM = 0xf5f0e8;
const BUSY = 0xff7a29;
const IDLE = 0x5ecf9a;
const WOOD = 0xc48a4a;
const WOOD_DARK = 0x8b5a2b;

const host = document.getElementById("canvasHost");
const dlg = document.getElementById("deskDialog");
const nameEl = document.getElementById("dlgName");
const badgeEl = document.getElementById("dlgBadge");
const roleEl = document.getElementById("dlgRole");
const taskEl = document.getElementById("dlgTask");
const updatedEl = document.getElementById("dlgUpdated");

const scene = new THREE.Scene();
scene.background = new THREE.Color(NIGHT);
scene.fog = new THREE.Fog(NIGHT, 18, 42);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(9, 8.5, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
host.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.6, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 6;
controls.maxDistance = 22;
controls.update();

scene.add(new THREE.AmbientLight(0xb8a0ff, 0.55));
const key = new THREE.DirectionalLight(0xffe0c0, 1.05);
key.position.set(6, 12, 4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
scene.add(key);
const fill = new THREE.PointLight(ORANGE, 0.55, 30);
fill.position.set(-3, 3, 2);
scene.add(fill);
const purpleGlow = new THREE.PointLight(PURPLE, 0.45, 28);
purpleGlow.position.set(4, 2.5, -3);
scene.add(purpleGlow);

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

function addBox(w, h, d, color, x, y, z, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Floor + walls (cartoon room)
const floor = addBox(14, 0.35, 12, 0x3a2758, 0, 0, 0);
floor.receiveShadow = true;
addBox(14, 4.2, 0.35, 0x2a1a42, 0, 2.1, -5.8);
addBox(0.35, 4.2, 12, 0x241533, -6.85, 2.1, 0);
addBox(0.35, 4.2, 12, 0x2e1c48, 6.85, 2.1, 0);

// Rug
addBox(6, 0.08, 4.5, 0x4a3168, 0, 0.22, 0.4, { roughness: 0.9 });

// Preview screen on back wall
const screen = addBox(2.6, 1.6, 0.12, 0x0e0a18, 1.2, 2.4, -5.55, {
  emissive: ORANGE,
  emissiveIntensity: 0.25,
});
const screenFrame = addBox(2.9, 1.9, 0.08, PURPLE, 1.2, 2.4, -5.62);

// Pumpkins
function pumpkin(x, z, s = 1) {
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.38 * s, 16, 12),
    mat(ORANGE, { roughness: 0.45 })
  );
  body.position.set(x, 0.45 * s, z);
  body.scale.y = 0.85;
  body.castShadow = true;
  scene.add(body);
  const stem = addBox(0.08 * s, 0.22 * s, 0.08 * s, 0x3d6b2e, x, 0.72 * s, z);
  return body;
}
pumpkin(-5.2, -4.2, 1.1);
pumpkin(5.1, -3.8, 0.85);
pumpkin(-4.6, 3.8, 0.7);

// Floating bats (simple)
function bat(x, y, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    mat(0x1a1224)
  );
  const wingL = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.06, 0.2),
    mat(0x2b1f3d)
  );
  wingL.position.set(-0.28, 0, 0);
  wingL.rotation.z = 0.35;
  const wingR = wingL.clone();
  wingR.position.x = 0.28;
  wingR.rotation.z = -0.35;
  g.add(body, wingL, wingR);
  g.position.set(x, y, z);
  scene.add(g);
  return g;
}
const bats = [bat(-2, 3.6, -4), bat(3.2, 3.2, -3.5), bat(0.5, 3.8, -2)];

const clickables = [];

function makeLabelTexture(text) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = "rgba(26,18,36,0.9)";
  roundRect(ctx, 8, 12, 240, 40, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(155,109,255,0.55)";
  ctx.lineWidth = 3;
  roundRect(ctx, 8, 12, 240, 40, 18);
  ctx.stroke();
  ctx.fillStyle = "#F5F0E8";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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

function desk(id, x, z, label) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { id };

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.14, 0.8),
    mat(WOOD, { roughness: 0.5 })
  );
  top.position.y = 0.78;
  top.castShadow = true;
  const legMat = mat(WOOD_DARK);
  [[-0.55, -0.28], [0.55, -0.28], [-0.55, 0.28], [0.55, 0.28]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.1), legMat);
    leg.position.set(lx, 0.36, lz);
    leg.castShadow = true;
    group.add(leg);
  });
  group.add(top);

  const chair = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.45, 0.55),
    mat(PURPLE, { roughness: 0.4 })
  );
  chair.position.set(0, 0.4, 0.75);
  chair.castShadow = true;
  group.add(chair);

  const p = people[id];
  const lampColor = p.status === "busy" ? BUSY : IDLE;
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 12),
    mat(lampColor, {
      emissive: lampColor,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    })
  );
  bulb.position.set(0.45, 1.15, 0);
  group.add(bulb);
  const light = new THREE.PointLight(lampColor, 0.65, 4.5);
  light.position.copy(bulb.position);
  group.add(light);

  const spriteMat = new THREE.SpriteMaterial({
    map: makeLabelTexture(label),
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(0, 1.55, 0);
  sprite.scale.set(1.8, 0.45, 1);
  group.add(sprite);

  // invisible hit box
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.y = 0.8;
  hit.userData = { id };
  group.add(hit);
  clickables.push(hit);

  scene.add(group);
  return { group, bulb, lampColor };
}

const desks = [
  desk("grok", -3.2, -1.2, "Grok Bot"),
  desk("ai", 0.2, -2.4, "AI開發"),
  desk("design", 3.4, -1.0, "設計"),
  desk("write", -2.4, 2.2, "寫作"),
  desk("cut", 2.6, 2.4, "剪片"),
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
  if (typeof dlg.showModal === "function") dlg.showModal();
  else dlg.setAttribute("open", "");
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let moved = false;

function setPointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.clientX ?? event.changedTouches?.[0]?.clientX;
  const clientY = event.clientY ?? event.changedTouches?.[0]?.clientY;
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener("pointerdown", () => {
  moved = false;
});
renderer.domElement.addEventListener("pointermove", () => {
  moved = true;
});
renderer.domElement.addEventListener("pointerup", (e) => {
  if (moved) return;
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickables, false);
  if (hits[0]?.object?.userData?.id) openPerson(hits[0].object.userData.id);
});

function resize() {
  const w = host.clientWidth;
  const h = host.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
resize();
window.addEventListener("resize", resize);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  bats.forEach((b, i) => {
    b.position.y = 3.2 + Math.sin(t * 1.4 + i) * 0.25;
    b.rotation.y = Math.sin(t * 0.8 + i) * 0.4;
  });
  desks.forEach((d, i) => {
    if (d.lampColor === BUSY) {
      d.bulb.material.emissiveIntensity = 0.55 + Math.sin(t * 3 + i) * 0.3;
    }
  });
  controls.update();
  renderer.render(scene, camera);
}
animate();
