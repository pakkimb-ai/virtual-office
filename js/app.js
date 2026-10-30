import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const people = {
  grok: {
    name: "Grok Bot",
    role: "隊長",
    status: "busy",
    motto: "對齊完先再開下一檔。",
    task: "對齊大家進度同下一版優先。",
    done: "定咗真 3D＋動森方向。",
    color: 0xffb347,
    updated: "2026-10-30 22:40 HKT",
  },
  ai: {
    name: "AI開發人員",
    role: "開發",
    status: "busy",
    motto: "可開先上，再執細節。",
    task: "跟 ACNH reference 重做辦公室外觀。",
    done: "上線可拖轉 3D 辦公室。",
    color: 0x7ec8ff,
    updated: "2026-10-30 22:40 HKT",
  },
  design: {
    name: "設計助手",
    role: "設計",
    status: "busy",
    motto: "色先定，版面就跟。",
    task: "動森色板同工位層級。",
    done: "交咗橙紫 token 同道具清單。",
    color: 0xb58cff,
    updated: "2026-10-30 22:40 HKT",
  },
  write: {
    name: "寫作助手",
    role: "寫作",
    status: "busy",
    motto: "稿未定，字先穩。",
    task: "執緊開場白同狀態短句。",
    done: "交咗務實開場白＋口頭禪。",
    color: 0xff9ec8,
    updated: "2026-10-30 22:40 HKT",
  },
  cut: {
    name: "剪片助手",
    role: "剪片",
    status: "idle",
    motto: "素材齊，先剪一條睇。",
    task: "得閒喺工位等你。",
    done: "Showreel 試版已交，等反饋。",
    color: 0x6fd6a0,
    link: "https://www.youtube.com/results?search_query=animal+crossing+halloween",
    updated: "2026-10-30 22:40 HKT",
  },
};

const host = document.getElementById("canvasHost");
const dlg = document.getElementById("deskDialog");
const els = {
  name: document.getElementById("dlgName"),
  badge: document.getElementById("dlgBadge"),
  role: document.getElementById("dlgRole"),
  motto: document.getElementById("dlgMotto"),
  task: document.getElementById("dlgTask"),
  done: document.getElementById("dlgDone"),
  updated: document.getElementById("dlgUpdated"),
  link: document.getElementById("dlgLink"),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd4ea);
scene.fog = new THREE.Fog(0x9fd4ea, 28, 55);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
const camHome = new THREE.Vector3(11, 10, 13);
camera.position.copy(camHome);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.2, 0);
controls.maxPolarAngle = Math.PI * 0.45;
controls.minDistance = 8;
controls.maxDistance = 26;
document.getElementById("btnReset").onclick = () => {
  camera.position.copy(camHome);
  controls.target.set(0, 1.2, 0);
  controls.update();
};

scene.add(new THREE.AmbientLight(0xfff5e6, 0.95));
scene.add(new THREE.HemisphereLight(0xfff0d0, 0xb8dcc0, 0.55));
const sun = new THREE.DirectionalLight(0xffe8c8, 0.85);
sun.position.set(6, 16, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
scene.add(sun);
const lampOrange = new THREE.PointLight(0xff8b3d, 0.35, 20);
lampOrange.position.set(-3, 3.5, 2);
scene.add(lampOrange);

function woodTex() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#e8c89a";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = y % 64 === 0 ? "#d4b07e" : "#efd2a8";
    ctx.fillRect(0, y, 256, 30);
    ctx.strokeStyle = "rgba(120,80,40,0.18)";
    ctx.beginPath();
    ctx.moveTo(0, y + 30);
    ctx.lineTo(256, y + 30);
    ctx.stroke();
    for (let x = (y % 64 === 0 ? 0 : 64); x < 256; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 30);
      ctx.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function wallTex() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff3df";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(255,180,120,0.12)";
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function toon(color, map = null) {
  return new THREE.MeshToonMaterial({ color, map });
}
function rbox(w, h, d, color, x, y, z, parent = scene, radius = 0.08) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(w, h, d, 3, radius),
    typeof color === "number" ? toon(color) : color
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function sphere(r, color, x, y, z, parent = scene, sy = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 14), toon(color));
  m.position.set(x, y, z);
  m.scale.y = sy;
  m.castShadow = true;
  parent.add(m);
  return m;
}

// Room shell
const floorMat = toon(0xffffff, woodTex());
const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 14), floorMat);
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const wMat = toon(0xffffff, wallTex());
const back = new THREE.Mesh(new THREE.BoxGeometry(16, 5.2, 0.35), wMat);
back.position.set(0, 2.6, -6.85);
back.receiveShadow = true;
scene.add(back);
const left = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.2, 14), wMat);
left.position.set(-7.9, 2.6, 0);
scene.add(left);
const right = left.clone();
right.position.x = 7.9;
scene.add(right);

// Baseboard
rbox(16, 0.25, 0.2, 0xc48a4a, 0, 0.3, -6.65, scene, 0.04);
rbox(0.2, 0.25, 14, 0xc48a4a, -7.7, 0.3, 0, scene, 0.04);
rbox(0.2, 0.25, 14, 0xc48a4a, 7.7, 0.3, 0, scene, 0.04);

// Round rug
const rug = new THREE.Mesh(
  new THREE.CylinderGeometry(3.2, 3.2, 0.06, 32),
  toon(0xffc089)
);
rug.position.set(0, 0.22, 0.4);
rug.receiveShadow = true;
scene.add(rug);
const rugIn = new THREE.Mesh(
  new THREE.CylinderGeometry(2.4, 2.4, 0.07, 32),
  toon(0xffe0b8)
);
rugIn.position.set(0, 0.23, 0.4);
scene.add(rugIn);

// Night window (AC style framed window)
rbox(3.6, 2.6, 0.15, 0xf5e6d0, -2.2, 3.0, -6.62, scene, 0.06);
rbox(3.1, 2.1, 0.08, 0x2a3350, -2.2, 3.0, -6.55, scene, 0.04);
// moon
sphere(0.35, 0xfff0b0, -1.5, 3.4, -6.48);
sphere(0.12, 0xffffff, -2.8, 3.6, -6.48);
sphere(0.08, 0xffffff, -3.1, 3.2, -6.48);
// cute bats outside
rbox(0.35, 0.08, 0.08, 0x3a2a55, -2.6, 2.5, -6.45, scene, 0.03);
rbox(0.35, 0.08, 0.08, 0x3a2a55, -1.5, 2.7, -6.45, scene, 0.03);

// Wall TV for cut
rbox(2.8, 1.8, 0.18, 0xf5e6d0, 3.2, 3.0, -6.62, scene, 0.06);
const tv = rbox(2.3, 1.35, 0.1, 0x2a3340, 3.2, 3.0, -6.5, scene, 0.04);
tv.material = new THREE.MeshToonMaterial({
  color: 0x2a3340,
  emissive: 0xff8b3d,
  emissiveIntensity: 0.25,
});

// Plants
function plant(x, z) {
  const g = new THREE.Group();
  rbox(0.45, 0.4, 0.45, 0xe07050, 0, 0.35, 0, g, 0.1);
  sphere(0.45, 0x5ecf7a, 0, 0.95, 0, g, 1.1);
  sphere(0.28, 0x7adf90, 0.25, 1.15, 0.1, g);
  g.position.set(x, 0, z);
  scene.add(g);
}
plant(-6.5, 4.5);
plant(6.5, 4.2);
plant(-6.3, -4.8);

// Pumpkins (cute, not scary)
function pumpkin(x, z, s = 1) {
  sphere(0.38 * s, 0xff8b3d, x, 0.4 * s, z, scene, 0.85);
  rbox(0.1 * s, 0.18 * s, 0.1 * s, 0x5a9a3a, x, 0.68 * s, z, scene, 0.03);
}
pumpkin(-5.8, -5.5, 1.15);
pumpkin(5.6, -5.2, 0.9);
pumpkin(5.9, 3.6, 0.7);

const clickables = [];
const floaters = [];

function nameplate(text) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff6e8";
  roundRect(ctx, 8, 10, 240, 44, 16); ctx.fill();
  ctx.strokeStyle = "#4a3428"; ctx.lineWidth = 4;
  roundRect(ctx, 8, 10, 240, 44, 16); ctx.stroke();
  ctx.fillStyle = "#4a3428";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(1.7, 0.42, 1);
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

function villager(parent, color) {
  const g = new THREE.Group();
  // body
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.55, 0.7, 0.4, 3, 0.12),
    toon(color)
  );
  body.position.y = 0.85;
  body.castShadow = true;
  g.add(body);
  // head
  const head = sphere(0.32, 0xffe0c0, 0, 1.45, 0, g);
  // ears
  sphere(0.1, color, -0.22, 1.65, 0, g);
  sphere(0.1, color, 0.22, 1.65, 0, g);
  // eyes
  sphere(0.05, 0x2a1f14, -0.1, 1.48, 0.28, g);
  sphere(0.05, 0x2a1f14, 0.1, 1.48, 0.28, g);
  // blush
  sphere(0.05, 0xff9aa8, -0.18, 1.38, 0.26, g, 0.6);
  sphere(0.05, 0xff9aa8, 0.18, 1.38, 0.26, g, 0.6);
  g.position.set(0, 0, 0.95);
  parent.add(g);
  return g;
}

function deskSet(id, x, z, label) {
  const p = people[id];
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  // chubby desk
  rbox(1.7, 0.18, 1.0, 0xf0d0a0, 0, 0.85, 0, g, 0.1);
  [[-0.7, -0.38], [0.7, -0.38], [-0.7, 0.38], [0.7, 0.38]].forEach(([lx, lz]) => {
    rbox(0.14, 0.8, 0.14, 0xd4a06a, lx, 0.4, lz, g, 0.05);
  });
  // chair
  rbox(0.7, 0.45, 0.7, p.color, 0, 0.45, 0.95, g, 0.12);
  rbox(0.7, 0.55, 0.14, p.color, 0, 0.9, 1.22, g, 0.08);

  // role props (simplified cute)
  if (id === "ai") {
    rbox(0.7, 0.5, 0.08, 0x4a5060, -0.35, 1.25, -0.3, g, 0.05);
    rbox(0.55, 0.35, 0.04, 0x9fe0ff, -0.35, 1.25, -0.25, g, 0.03);
    rbox(0.7, 0.5, 0.08, 0x4a5060, 0.4, 1.25, -0.25, g, 0.05);
    rbox(0.55, 0.35, 0.04, 0xb8ffd0, 0.4, 1.25, -0.2, g, 0.03);
    rbox(0.85, 0.06, 0.3, 0x5a6070, 0, 0.96, 0.15, g, 0.04);
    sphere(0.1, 0xc48a4a, -0.55, 0.98, 0.3, g);
  } else if (id === "write") {
    rbox(0.65, 0.05, 0.5, 0xfff8ec, 0, 0.96, 0.05, g, 0.04);
    rbox(0.08, 0.35, 0.08, 0xffd090, 0.55, 1.15, -0.25, g, 0.03);
    sphere(0.16, 0xffe0a8, 0.55, 1.38, -0.25, g);
    sphere(0.1, 0xe8c090, -0.5, 0.98, 0.25, g);
  } else if (id === "design") {
    rbox(0.8, 0.05, 0.55, 0x5a6070, 0.1, 0.96, 0.05, g, 0.05);
    rbox(0.68, 0.02, 0.45, 0xf5e8ff, 0.1, 0.99, 0.05, g, 0.02);
    rbox(0.08, 0.1, 0.08, 0xff8b3d, -0.55, 0.98, -0.15, g, 0.02);
    rbox(0.08, 0.1, 0.08, 0xb58cff, -0.42, 0.98, -0.15, g, 0.02);
    rbox(0.08, 0.1, 0.08, 0x6fd6a0, -0.29, 0.98, -0.15, g, 0.02);
  } else if (id === "cut") {
    rbox(1.1, 0.5, 0.08, 0x4a5060, 0, 1.25, -0.28, g, 0.05);
    rbox(0.95, 0.35, 0.04, 0xffb07a, 0, 1.28, -0.22, g, 0.03);
    rbox(0.45, 0.12, 0.35, 0x5a6070, -0.5, 0.98, 0.2, g, 0.06);
  } else if (id === "grok") {
    rbox(0.8, 0.7, 0.08, 0xf5e6d0, -0.15, 1.3, -0.28, g, 0.06);
    rbox(0.65, 0.55, 0.05, 0xfff8ec, -0.15, 1.3, -0.22, g, 0.04);
    sphere(0.14, 0x6a7080, 0.5, 1.0, 0.1, g);
  }
  // mini pumpkin accent
  sphere(0.12, 0xff8b3d, 0.65, 0.98, 0.35, g, 0.85);

  // status lamp
  const lampCol = p.status === "busy" ? 0xff8b3d : 0x6fd6a0;
  const bulb = sphere(0.12, lampCol, 0.55, 1.35, -0.35, g);
  bulb.material.emissive = new THREE.Color(lampCol);
  bulb.material.emissiveIntensity = 0.7;
  const light = new THREE.PointLight(lampCol, 0.4, 3.5);
  light.position.set(0.55, 1.35, -0.35);
  g.add(light);

  const vill = villager(g, p.color);
  floaters.push({ group: g, vill, busy: p.status === "busy", bulb });

  const plate = nameplate(label);
  plate.position.set(0, 2.15, 0.2);
  g.add(plate);

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 2.4, 2.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(0, 1.1, 0.3);
  hit.userData = { id };
  g.add(hit);
  clickables.push(hit);

  scene.add(g);
}

deskSet("grok", -3.6, -1.6, "Grok Bot");
deskSet("ai", 0.2, -2.8, "AI開發");
deskSet("design", 3.7, -1.3, "設計");
deskSet("write", -2.8, 2.5, "寫作");
deskSet("cut", 2.9, 2.6, "剪片");

function openPerson(id) {
  const p = people[id];
  if (!p) return;
  els.name.textContent = p.name;
  els.role.textContent = p.role;
  els.motto.textContent = "「" + p.motto + "」";
  els.task.textContent = p.task;
  els.done.textContent = p.done;
  els.updated.textContent = "更新：" + p.updated;
  els.badge.textContent = p.status === "busy" ? "忙緊" : "得閒";
  els.badge.className = "badge " + (p.status === "busy" ? "busy" : "idle");
  if (p.link) {
    els.link.hidden = false;
    els.link.href = p.link;
  } else {
    els.link.hidden = true;
  }
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
  floaters.forEach((f, i) => {
    if (f.busy) {
      f.group.position.y = Math.sin(t * 2 + i) * 0.04;
      f.bulb.material.emissiveIntensity = 0.45 + Math.sin(t * 3 + i) * 0.3;
    }
  });
  controls.update();
  renderer.render(scene, camera);
}
animate();
