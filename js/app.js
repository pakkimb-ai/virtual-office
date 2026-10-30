import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const HKT = "2026-10-30 22:53 HKT";

const people = {
  grok: {
    name: "Grok Bot",
    role: "隊長",
    status: "busy",
    motto: "對齊完先開下一檔。",
    task: "對齊大家進度同下一版優先。",
    done: "定咗真 3D＋動森方向。",
    color: 0xff8a1f,
    updated: HKT,
  },
  ai: {
    name: "AI開發人員",
    role: "開發",
    status: "busy",
    motto: "可開先上，再執細節。",
    task: "跟 ACNH Office Wall 提升道具級像真度。",
    done: "上線可拖轉 3D 辦公室。",
    color: 0x5b8def,
    updated: HKT,
  },
  design: {
    name: "設計助手",
    role: "設計",
    status: "busy",
    motto: "色先定，版面就跟。",
    task: "動森色板同工位層級。",
    done: "交咗橙紫 token 同道具清單。",
    color: 0xf78fb3,
    updated: HKT,
  },
  write: {
    name: "寫作助手",
    role: "寫作",
    status: "busy",
    motto: "稿未定，字先穩。",
    task: "執緊開場白",
    done: "務實開場白已交",
    color: 0x6bcb77,
    updated: HKT,
  },
  cut: {
    name: "剪片助手",
    role: "剪片",
    status: "idle",
    motto: "素材齊，先剪一條睇。",
    task: "得閒喺工位等你。",
    done: "Showreel 試版已交，等反饋。",
    color: 0x9b5cff,
    link: "https://www.youtube.com/results?search_query=animal+crossing+halloween",
    updated: HKT,
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
scene.background = new THREE.Color(0xb8dff0);
scene.fog = new THREE.Fog(0xb8dff0, 32, 60);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
// ACNH room view ~35–40° elevated, rug center
const camHome = new THREE.Vector3(10.2, 10.8, 12.2);
camera.position.copy(camHome);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.85, 0.25);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 8;
controls.maxDistance = 26;
document.getElementById("btnReset").onclick = () => {
  camera.position.copy(camHome);
  controls.target.set(0, 0.85, 0.25);
  controls.update();
};

// Soft daytime ACNH indoor light
scene.add(new THREE.AmbientLight(0xfff8f0, 1.15));
scene.add(new THREE.HemisphereLight(0xe8f4ff, 0xd8e0d0, 0.55));
const sun = new THREE.DirectionalLight(0xfff0d8, 0.85);
sun.position.set(4, 16, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
scene.add(sun);
const winLight = new THREE.PointLight(0xffe8c8, 0.55, 20);
winLight.position.set(-2.0, 3.4, -4.2);
scene.add(winLight);
const fillL = new THREE.PointLight(0xfff5e8, 0.25, 16);
fillL.position.set(3, 3.5, 2);
scene.add(fillL);

function tileTex() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#D8D4CC";
  ctx.fillRect(0, 0, 256, 256);
  const tile = 64;
  for (let y = 0; y < 256; y += tile) {
    for (let x = 0; x < 256; x += tile) {
      const even = (x / tile + y / tile) % 2 === 0;
      ctx.fillStyle = even ? "#EEEAE2" : "#C8C4BC";
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
      ctx.strokeStyle = "rgba(120,110,100,0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, tile - 2, tile - 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 4.5);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** ACNH Office Wall — ivory with soft vertical panels */
function wallTex() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#F3E7D7";
  ctx.fillRect(0, 0, 256, 256);
  // vertical panel stripes
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = "rgba(196,165,116,0.12)";
    ctx.fillRect(x, 0, 2, 256);
    ctx.fillStyle = "rgba(255,252,245,0.25)";
    ctx.fillRect(x + 3, 0, 12, 256);
  }
  // soft paper grain
  ctx.fillStyle = "rgba(180,150,120,0.06)";
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 2.2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Soft daytime sky (Halloween bats as tiny accents only) */
function daySkyTex() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 160);
  g.addColorStop(0, "#A8D8F0");
  g.addColorStop(0.4, "#C8E8F8");
  g.addColorStop(0.7, "#FFE0B8");
  g.addColorStop(1, "#FFC890");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 160);
  // soft sun
  ctx.fillStyle = "rgba(255,245,200,0.95)";
  ctx.beginPath();
  ctx.arc(200, 48, 26, 0, Math.PI * 2);
  ctx.fill();
  // distant soft hills
  ctx.fillStyle = "rgba(120,170,130,0.35)";
  ctx.beginPath();
  ctx.moveTo(0, 130);
  ctx.quadraticCurveTo(80, 100, 160, 125);
  ctx.quadraticCurveTo(210, 140, 256, 120);
  ctx.lineTo(256, 160);
  ctx.lineTo(0, 160);
  ctx.fill();
  // tiny bats (season accent)
  ctx.fillStyle = "rgba(60,40,50,0.28)";
  function bat(bx, by, s) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx - 8 * s, by - 5 * s, bx - 14 * s, by + 1 * s);
    ctx.quadraticCurveTo(bx - 5 * s, by - 1 * s, bx, by + 2 * s);
    ctx.quadraticCurveTo(bx + 5 * s, by - 1 * s, bx + 14 * s, by + 1 * s);
    ctx.quadraticCurveTo(bx + 8 * s, by - 5 * s, bx, by);
    ctx.fill();
  }
  bat(55, 55, 0.7);
  bat(100, 40, 0.5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function clockFaceTex() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#FFF8EC";
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#C4A574";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#4a3428";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#4a3428";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.lineTo(64, 30);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.lineTo(88, 64);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function boardTex() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 192;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#F7F4EE";
  ctx.fillRect(0, 0, 256, 192);
  ctx.strokeStyle = "#C4A574";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 184);
  ctx.strokeStyle = "#5B8DEF";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, 50);
  ctx.lineTo(120, 45);
  ctx.lineTo(200, 70);
  ctx.stroke();
  ctx.strokeStyle = "#6BCB77";
  ctx.beginPath();
  ctx.moveTo(40, 100);
  ctx.lineTo(180, 110);
  ctx.stroke();
  ctx.fillStyle = "#FF8A1F";
  ctx.fillRect(40, 140, 50, 18);
  ctx.fillStyle = "#9B5CFF";
  ctx.fillRect(110, 138, 40, 20);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function checklistTex() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 160;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#FFF8EC";
  ctx.fillRect(0, 0, 128, 160);
  ctx.strokeStyle = "#C4A574";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 122, 154);
  ctx.fillStyle = "#4a3428";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("今日", 40, 28);
  const lines = ["✓ 對齊", "✓ 色板", "□ Props", "□ 交版"];
  ctx.font = "12px sans-serif";
  lines.forEach((t, i) => {
    ctx.fillStyle = i < 2 ? "#6BCB77" : "#4a3428";
    ctx.fillText(t, 18, 55 + i * 24);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function previewScreenTex() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 144;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 256, 144);
  g.addColorStop(0, "#2a1840");
  g.addColorStop(1, "#4a2060");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 144);
  // fake timeline bars
  ctx.fillStyle = "#FF8A1F";
  ctx.fillRect(20, 100, 60, 12);
  ctx.fillStyle = "#6BCB77";
  ctx.fillRect(90, 100, 40, 12);
  ctx.fillStyle = "#5B8DEF";
  ctx.fillRect(140, 100, 80, 12);
  ctx.fillStyle = "#F78FB3";
  ctx.fillRect(40, 40, 90, 45);
  ctx.fillStyle = "#9B5CFF";
  ctx.fillRect(140, 35, 70, 55);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("SHOWREEL", 80, 28);
  const t = new THREE.CanvasTexture(c);
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
function cyl(rt, rb, h, color, x, y, z, parent = scene, segs = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), toon(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// —— Room shell: Office Wall + Monochromatic tile ——
const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 14), toon(0xffffff, tileTex()));
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

// Baseboard wood #C4A574
rbox(16, 0.28, 0.18, 0xc4a574, 0, 0.32, -6.65, scene, 0.04);
rbox(0.18, 0.28, 14, 0xc4a574, -7.7, 0.32, 0, scene, 0.04);
rbox(0.18, 0.28, 14, 0xc4a574, 7.7, 0.32, 0, scene, 0.04);

// Layered round rugs — peach on tiles (clear contrast)
const rugOuter = new THREE.Mesh(
  new THREE.CylinderGeometry(3.6, 3.6, 0.05, 48),
  toon(0xc89060)
);
rugOuter.position.set(0, 0.2, 0.35);
rugOuter.receiveShadow = true;
scene.add(rugOuter);
const rug = new THREE.Mesh(
  new THREE.CylinderGeometry(3.3, 3.3, 0.06, 48),
  toon(0xf0c9a0)
);
rug.position.set(0, 0.225, 0.35);
rug.receiveShadow = true;
scene.add(rug);
const rugIn = new THREE.Mesh(
  new THREE.CylinderGeometry(2.4, 2.4, 0.065, 48),
  toon(0xffe0c0)
);
rugIn.position.set(0, 0.24, 0.35);
scene.add(rugIn);
// thin runner near front for lived-in density
const runner = new THREE.Mesh(
  new RoundedBoxGeometry(2.4, 0.04, 0.7, 2, 0.02),
  toon(0xd4a878)
);
runner.position.set(-4.2, 0.21, 4.8);
runner.receiveShadow = true;
scene.add(runner);

// —— Daytime back window (ACNH office) ——
rbox(4.4, 3.0, 0.18, 0xfff8ec, -1.9, 3.1, -6.62, scene, 0.06);
// outer wood frame
rbox(4.5, 0.12, 0.12, 0xc4a574, -1.9, 4.55, -6.5, scene, 0.03);
rbox(4.5, 0.12, 0.12, 0xc4a574, -1.9, 1.65, -6.5, scene, 0.03);
rbox(0.12, 2.9, 0.12, 0xc4a574, -4.05, 3.1, -6.5, scene, 0.03);
rbox(0.12, 2.9, 0.12, 0xc4a574, 0.25, 3.1, -6.5, scene, 0.03);
// mullions
rbox(0.1, 2.6, 0.08, 0xc4a574, -1.9, 3.1, -6.5, scene, 0.02);
rbox(3.95, 0.1, 0.08, 0xc4a574, -1.9, 3.1, -6.5, scene, 0.02);
const skyPane = new THREE.Mesh(
  new THREE.PlaneGeometry(3.85, 2.5),
  new THREE.MeshBasicMaterial({ map: daySkyTex() })
);
skyPane.position.set(-1.9, 3.1, -6.48);
scene.add(skyPane);
// soft sill
rbox(4.3, 0.1, 0.28, 0xc4a574, -1.9, 1.6, -6.4, scene, 0.04);

// Wall clock
const clockBody = cyl(0.42, 0.42, 0.1, 0xc4a574, 1.7, 3.95, -6.55, scene, 24);
clockBody.rotation.x = Math.PI / 2;
const clockFace = new THREE.Mesh(
  new THREE.CircleGeometry(0.36, 32),
  new THREE.MeshBasicMaterial({ map: clockFaceTex() })
);
clockFace.position.set(1.7, 3.95, -6.48);
scene.add(clockFace);

// Cut wall preview screen (job prop)
rbox(1.7, 1.05, 0.08, 0x3a4050, 5.0, 3.5, -6.55, scene, 0.04);
const preview = new THREE.Mesh(
  new THREE.PlaneGeometry(1.5, 0.88),
  new THREE.MeshBasicMaterial({ map: previewScreenTex() })
);
preview.position.set(5.0, 3.5, -6.48);
scene.add(preview);
rbox(0.15, 0.08, 0.08, 0x9b5cff, 5.0, 2.9, -6.5, scene, 0.02); // LED under

// Standing whiteboard (Raymond)
function standingWhiteboard(x, z, rotY = 0) {
  const g = new THREE.Group();
  const board = new THREE.Mesh(
    new RoundedBoxGeometry(1.7, 1.2, 0.09, 2, 0.05),
    toon(0xffffff, boardTex())
  );
  board.position.set(0, 1.6, 0);
  board.castShadow = true;
  g.add(board);
  rbox(1.8, 0.09, 0.11, 0xc4a574, 0, 2.22, 0, g, 0.03);
  rbox(1.8, 0.09, 0.11, 0xc4a574, 0, 0.98, 0, g, 0.03);
  rbox(0.09, 1.55, 0.09, 0xc4a574, -0.58, 0.78, 0.16, g, 0.03);
  rbox(0.09, 1.55, 0.09, 0xc4a574, 0.58, 0.78, 0.16, g, 0.03);
  rbox(0.09, 1.4, 0.09, 0xc4a574, 0, 0.72, -0.22, g, 0.03);
  rbox(1.25, 0.07, 0.38, 0xc4a574, 0, 0.98, 0.06, g, 0.03);
  rbox(0.06, 0.05, 0.2, 0x5b8def, -0.28, 1.05, 0.1, g, 0.02);
  rbox(0.06, 0.05, 0.2, 0xff8a1f, -0.12, 1.05, 0.1, g, 0.02);
  rbox(0.06, 0.05, 0.2, 0x6bcb77, 0.04, 1.05, 0.1, g, 0.02);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
}
standingWhiteboard(5.9, -5.35, -0.35);

/** Water cooler — blue jug on top, white body, orange buttons (ACNH) */
function waterCooler(x, z) {
  const g = new THREE.Group();
  // white body
  rbox(0.58, 1.1, 0.52, 0xf5f2ea, 0, 0.72, 0, g, 0.1);
  // front panel
  rbox(0.42, 0.38, 0.05, 0xe8e4dc, 0, 0.58, 0.28, g, 0.04);
  // orange + blue buttons
  cyl(0.05, 0.05, 0.04, 0xff8a1f, -0.1, 0.72, 0.3, g, 10);
  cyl(0.05, 0.05, 0.04, 0x5b8def, 0.1, 0.72, 0.3, g, 10);
  // spigots
  cyl(0.035, 0.035, 0.14, 0x888888, -0.1, 0.88, 0.3, g, 8);
  cyl(0.035, 0.035, 0.14, 0x888888, 0.1, 0.88, 0.3, g, 8);
  rbox(0.38, 0.05, 0.22, 0xc4a574, 0, 0.4, 0.3, g, 0.03);
  // blue water jug
  const jug = cyl(0.24, 0.22, 0.58, 0x6ec8f0, 0, 1.55, 0, g, 20);
  jug.material = new THREE.MeshToonMaterial({
    color: 0x6ec8f0,
    transparent: true,
    opacity: 0.88,
  });
  cyl(0.09, 0.11, 0.12, 0xa0dcf5, 0, 1.88, 0, g, 12);
  // water line inside hint
  cyl(0.2, 0.19, 0.02, 0xffffff, 0, 1.45, 0, g, 16);
  // cup stack
  rbox(0.2, 0.28, 0.2, 0xfff8ec, 0.3, 1.08, 0.05, g, 0.05);
  g.position.set(x, 0, z);
  scene.add(g);
}
waterCooler(6.65, -3.5);

// Optional fax / safe small props (office density)
function faxMachine(x, z) {
  const g = new THREE.Group();
  rbox(0.7, 0.22, 0.45, 0xe8e4dc, 0, 0.28, 0, g, 0.06);
  rbox(0.5, 0.08, 0.3, 0x5a6070, 0, 0.42, 0.02, g, 0.03);
  rbox(0.35, 0.02, 0.25, 0xfff8ec, 0, 0.47, 0.02, g, 0.01);
  cyl(0.04, 0.04, 0.03, 0xff8a1f, 0.22, 0.42, 0.15, g, 8);
  g.position.set(x, 0, z);
  scene.add(g);
}
faxMachine(-6.4, -5.5);

function miniSafe(x, z) {
  const g = new THREE.Group();
  rbox(0.55, 0.55, 0.45, 0x8a9098, 0, 0.4, 0, g, 0.06);
  rbox(0.42, 0.4, 0.04, 0x6a7078, 0, 0.42, 0.24, g, 0.03);
  cyl(0.05, 0.05, 0.04, 0xc4a574, 0.1, 0.42, 0.27, g, 10);
  g.position.set(x, 0, z);
  scene.add(g);
}
miniSafe(-6.5, -4.2);

// Corner plants
function plant(x, z, s = 1) {
  const g = new THREE.Group();
  rbox(0.45 * s, 0.4 * s, 0.45 * s, 0xe07050, 0, 0.35 * s, 0, g, 0.1);
  sphere(0.45 * s, 0x5ecf7a, 0, 0.95 * s, 0, g, 1.1);
  sphere(0.28 * s, 0x7adf90, 0.25 * s, 1.15 * s, 0.1 * s, g);
  g.position.set(x, 0, z);
  scene.add(g);
}
plant(-6.5, 4.5);
plant(6.5, 4.2);
plant(-6.3, -3.0);

// Floor pumpkins — tiny seasonal only
function pumpkin(x, z, s = 1) {
  sphere(0.32 * s, 0xff8b3d, x, 0.35 * s, z, scene, 0.85);
  rbox(0.08 * s, 0.14 * s, 0.08 * s, 0x5a9a3a, x, 0.58 * s, z, scene, 0.02);
}
pumpkin(-5.6, -5.6, 0.9);
pumpkin(5.4, 4.6, 0.65);

const clickables = [];
const floaters = [];

function nameplate(text, accent) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d");
  const hex = "#" + accent.toString(16).padStart(6, "0");
  ctx.fillStyle = "#fff6e8";
  roundRect(ctx, 8, 10, 240, 44, 16);
  ctx.fill();
  ctx.strokeStyle = hex;
  ctx.lineWidth = 5;
  roundRect(ctx, 8, 10, 240, 44, 16);
  ctx.stroke();
  ctx.fillStyle = "#4a3428";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 32);
  ctx.fillStyle = hex;
  ctx.fillRect(18, 48, 220, 5);
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

/** Big-head ACNH-ish villager */
function villager(parent, color) {
  const g = new THREE.Group();
  // body
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.52, 0.62, 0.38, 3, 0.12),
    toon(color)
  );
  body.position.y = 0.78;
  body.castShadow = true;
  g.add(body);
  // oversized head
  sphere(0.38, 0xffe0c0, 0, 1.42, 0, g);
  // ears
  sphere(0.11, color, -0.28, 1.62, 0, g);
  sphere(0.11, color, 0.28, 1.62, 0, g);
  // eyes
  sphere(0.055, 0x2a1f14, -0.12, 1.45, 0.32, g);
  sphere(0.055, 0x2a1f14, 0.12, 1.45, 0.32, g);
  // blush
  sphere(0.055, 0xff9aa8, -0.22, 1.35, 0.28, g, 0.55);
  sphere(0.055, 0xff9aa8, 0.22, 1.35, 0.28, g, 0.55);
  // feet
  rbox(0.16, 0.1, 0.22, 0x4a3428, -0.14, 0.12, 0.05, g, 0.04);
  rbox(0.16, 0.1, 0.22, 0x4a3428, 0.14, 0.12, 0.05, g, 0.04);
  g.position.set(0, 0, 1.15);
  parent.add(g);
  return g;
}

function dualMonitors(g, yBase, zBack, wide = false) {
  const span = wide ? 0.55 : 0.42;
  [-span, span].forEach((ox, i) => {
    rbox(0.3, 0.05, 0.24, 0x5a6070, ox, yBase, zBack + 0.06, g, 0.03);
    rbox(0.07, 0.3, 0.07, 0x5a6070, ox, yBase + 0.18, zBack, g, 0.02);
    rbox(0.68, 0.48, 0.07, 0x3a4050, ox, yBase + 0.48, zBack - 0.02, g, 0.05);
    const screen = new THREE.Mesh(
      new RoundedBoxGeometry(0.56, 0.36, 0.03, 2, 0.02),
      new THREE.MeshToonMaterial({
        color: i === 0 ? 0x9fe0ff : 0xb8ffd0,
        emissive: i === 0 ? 0x4aa0c8 : 0x3a9050,
        emissiveIntensity: 0.5,
      })
    );
    screen.position.set(ox, yBase + 0.48, zBack + 0.03);
    g.add(screen);
  });
}

/** Desktop Computer: tower + monitor + keyboard + mouse */
function desktopComputer(g, yBase, zBack) {
  // tower
  rbox(0.28, 0.55, 0.42, 0x5a6070, -0.72, yBase + 0.28, zBack + 0.05, g, 0.05);
  rbox(0.04, 0.08, 0.02, 0x6bcb77, -0.57, yBase + 0.45, zBack + 0.05, g, 0.01);
  rbox(0.18, 0.02, 0.02, 0x3a4050, -0.72, yBase + 0.15, zBack + 0.26, g, 0.01);
  // single large monitor (plus second via dual)
  dualMonitors(g, yBase, zBack, false);
  // keyboard
  rbox(0.72, 0.045, 0.28, 0x5a6070, 0.05, yBase + 0.03, 0.2, g, 0.03);
  rbox(0.62, 0.015, 0.2, 0x3a4050, 0.05, yBase + 0.055, 0.2, g, 0.01);
  // mouse
  rbox(0.1, 0.04, 0.14, 0x5a6070, 0.55, yBase + 0.03, 0.22, g, 0.03);
}

function clapboard(g, x, y, z) {
  const cg = new THREE.Group();
  rbox(0.42, 0.28, 0.05, 0x2a2a2a, 0, 0, 0, cg, 0.02);
  for (let i = 0; i < 3; i++) {
    rbox(0.34, 0.025, 0.02, 0xfff8ec, 0, -0.06 + i * 0.07, 0.03, cg, 0.01);
  }
  rbox(0.44, 0.08, 0.05, 0x2a2a2a, 0, 0.2, 0, cg, 0.02);
  for (let i = 0; i < 4; i++) {
    const col = i % 2 === 0 ? 0xfff8ec : 0x2a2a2a;
    rbox(0.09, 0.06, 0.02, col, -0.15 + i * 0.1, 0.2, 0.03, cg, 0.01);
  }
  cg.position.set(x, y, z);
  cg.rotation.y = -0.4;
  cg.rotation.x = -0.15;
  g.add(cg);
}

function colorFan(g, x, y, z) {
  const colors = [0xff8a1f, 0xf78fb3, 0x5b8def, 0x6bcb77, 0x9b5cff, 0xffe066];
  colors.forEach((col, i) => {
    const wedge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.08), toon(col));
    const a = -0.7 + i * 0.28;
    wedge.position.set(x + Math.cos(a) * 0.12, y, z + Math.sin(a) * 0.12);
    wedge.rotation.y = -a;
    wedge.castShadow = true;
    g.add(wedge);
  });
  cyl(0.03, 0.03, 0.06, 0xc4a574, x, y + 0.02, z, g, 8);
}

function walkie(g, x, y, z) {
  rbox(0.16, 0.28, 0.1, 0x5a6070, x, y, z, g, 0.04);
  cyl(0.025, 0.025, 0.18, 0x3a4050, x, y + 0.22, z, g, 8);
  sphere(0.035, 0xff8a1f, x + 0.05, y + 0.06, z + 0.05, g);
  rbox(0.08, 0.04, 0.02, 0x6bcb77, x, y - 0.02, z + 0.06, g, 0.01);
}

function deskCup(g, x, y, z) {
  cyl(0.07, 0.06, 0.12, 0xfff8ec, x, y, z, g, 12);
  cyl(0.055, 0.055, 0.02, 0xc4a574, x, y + 0.05, z, g, 10);
}

function deskPlant(g, x, y, z) {
  cyl(0.08, 0.07, 0.1, 0xe07050, x, y, z, g, 10);
  sphere(0.11, 0x5ecf7a, x, y + 0.14, z, g, 1.05);
}

/** ACNH Office Desk — ivory top, wood sides, visible drawers */
function officeDesk(g) {
  // top
  rbox(1.95, 0.12, 1.1, 0xfff8ec, 0, 0.9, 0, g, 0.09);
  // wood apron / side panels
  rbox(1.85, 0.55, 0.08, 0xc4a574, 0, 0.58, -0.48, g, 0.04); // back panel
  rbox(0.08, 0.55, 1.0, 0xc4a574, -0.9, 0.58, 0, g, 0.04);
  rbox(0.08, 0.55, 1.0, 0xc4a574, 0.9, 0.58, 0, g, 0.04);
  // front drawer block
  rbox(1.7, 0.42, 0.08, 0xd4b484, 0, 0.55, 0.48, g, 0.04);
  // drawer lines
  rbox(0.72, 0.02, 0.02, 0xa88858, -0.4, 0.55, 0.53, g, 0.005);
  rbox(0.72, 0.02, 0.02, 0xa88858, 0.4, 0.55, 0.53, g, 0.005);
  rbox(0.72, 0.02, 0.02, 0xa88858, -0.4, 0.68, 0.53, g, 0.005);
  rbox(0.72, 0.02, 0.02, 0xa88858, 0.4, 0.68, 0.53, g, 0.005);
  // handles
  rbox(0.12, 0.03, 0.04, 0x8a7040, -0.4, 0.61, 0.54, g, 0.01);
  rbox(0.12, 0.03, 0.04, 0x8a7040, 0.4, 0.61, 0.54, g, 0.01);
  // legs
  [
    [-0.82, -0.42],
    [0.82, -0.42],
    [-0.82, 0.42],
    [0.82, 0.42],
  ].forEach(([lx, lz]) => {
    rbox(0.12, 0.35, 0.12, 0xc4a574, lx, 0.2, lz, g, 0.04);
  });
}

/** Modern Office Chair — armrests, back, five-star caster base */
function modernChair(g, color) {
  // seat
  rbox(0.7, 0.12, 0.65, color, 0, 0.58, 1.15, g, 0.1);
  rbox(0.58, 0.06, 0.52, 0xfff8ec, 0, 0.66, 1.15, g, 0.08);
  // rounded back
  const backRest = new THREE.Mesh(
    new RoundedBoxGeometry(0.68, 0.72, 0.12, 3, 0.1),
    toon(color)
  );
  backRest.position.set(0, 1.05, 1.42);
  backRest.castShadow = true;
  g.add(backRest);
  // lumbar pad
  rbox(0.5, 0.28, 0.06, 0xfff8ec, 0, 0.95, 1.35, g, 0.06);
  // armrests
  rbox(0.08, 0.28, 0.08, 0xc4a574, -0.4, 0.78, 1.1, g, 0.03);
  rbox(0.08, 0.28, 0.08, 0xc4a574, 0.4, 0.78, 1.1, g, 0.03);
  rbox(0.1, 0.06, 0.35, color, -0.4, 0.94, 1.15, g, 0.04);
  rbox(0.1, 0.06, 0.35, color, 0.4, 0.94, 1.15, g, 0.04);
  // pedestal
  cyl(0.06, 0.08, 0.35, 0x8a9098, 0, 0.35, 1.15, g, 10);
  // five-star base
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = new THREE.Mesh(
      new RoundedBoxGeometry(0.5, 0.05, 0.08, 2, 0.02),
      toon(0x8a9098)
    );
    arm.position.set(Math.cos(a) * 0.18, 0.14, 1.15 + Math.sin(a) * 0.18);
    arm.rotation.y = -a;
    arm.castShadow = true;
    g.add(arm);
    // caster
    cyl(0.05, 0.05, 0.06, 0x5a6070, Math.cos(a) * 0.38, 0.08, 1.15 + Math.sin(a) * 0.38, g, 8);
  }
}

function deskSet(id, x, z, label) {
  const p = people[id];
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  officeDesk(g);
  modernChair(g, p.color);

  const topY = 0.97;

  if (id === "ai") {
    desktopComputer(g, topY, -0.3);
    deskCup(g, 0.75, topY + 0.07, 0.32);
    deskPlant(g, -0.35, topY + 0.06, -0.35);
  } else if (id === "write") {
    // document stack + formal paper
    rbox(0.55, 0.03, 0.42, 0xfff8ec, -0.15, topY + 0.03, 0.05, g, 0.02);
    rbox(0.52, 0.03, 0.4, 0xf0e8d8, -0.12, topY + 0.06, 0.06, g, 0.02);
    rbox(0.5, 0.03, 0.38, 0xfff8ec, -0.1, topY + 0.09, 0.05, g, 0.02);
    rbox(0.48, 0.015, 0.35, 0xe8e0d0, -0.08, topY + 0.115, 0.04, g, 0.01);
    // pen
    rbox(0.04, 0.04, 0.28, 0x5b8def, 0.28, topY + 0.04, 0.18, g, 0.015);
    // desk lamp
    rbox(0.22, 0.04, 0.22, 0xc4a574, 0.55, topY + 0.03, -0.28, g, 0.03);
    rbox(0.05, 0.35, 0.05, 0xc4a574, 0.55, topY + 0.22, -0.28, g, 0.02);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.18, 12, 1, true),
      new THREE.MeshToonMaterial({ color: 0xffe0a8, side: THREE.DoubleSide })
    );
    shade.position.set(0.55, topY + 0.45, -0.28);
    shade.rotation.x = Math.PI;
    g.add(shade);
    const lampL = new THREE.PointLight(0xffe8c0, 0.35, 2.5);
    lampL.position.set(0.55, topY + 0.35, -0.15);
    g.add(lampL);
    deskCup(g, -0.7, topY + 0.07, 0.32);
    deskPlant(g, 0.7, topY + 0.06, 0.25);
  } else if (id === "design") {
    rbox(0.78, 0.055, 0.58, 0x5a6070, 0.05, topY + 0.03, 0.05, g, 0.05);
    rbox(0.64, 0.02, 0.46, 0xf5e8ff, 0.05, topY + 0.07, 0.05, g, 0.02);
    rbox(0.03, 0.03, 0.22, 0xf78fb3, 0.48, topY + 0.05, 0.3, g, 0.01);
    colorFan(g, -0.55, topY + 0.04, -0.15);
    deskCup(g, -0.7, topY + 0.07, 0.3);
    deskPlant(g, 0.7, topY + 0.06, -0.25);
  } else if (id === "cut") {
    dualMonitors(g, topY, -0.28, true);
    clapboard(g, -0.55, topY + 0.18, 0.25);
    rbox(0.95, 0.03, 0.12, 0x3a4050, 0.15, topY + 0.03, 0.3, g, 0.02);
    rbox(0.22, 0.02, 0.08, 0xff8a1f, -0.15, topY + 0.05, 0.3, g, 0.01);
    rbox(0.16, 0.02, 0.08, 0x6bcb77, 0.12, topY + 0.05, 0.3, g, 0.01);
    deskCup(g, 0.7, topY + 0.07, 0.3);
    deskPlant(g, -0.75, topY + 0.06, -0.2);
  } else if (id === "grok") {
    const mini = new THREE.Mesh(
      new RoundedBoxGeometry(0.55, 0.7, 0.06, 2, 0.03),
      toon(0xffffff, checklistTex())
    );
    mini.position.set(-0.2, topY + 0.42, -0.28);
    mini.castShadow = true;
    g.add(mini);
    rbox(0.08, 0.35, 0.08, 0xc4a574, -0.2, topY + 0.18, -0.22, g, 0.03);
    rbox(0.25, 0.04, 0.18, 0xc4a574, -0.2, topY + 0.03, -0.18, g, 0.03);
    walkie(g, 0.45, topY + 0.16, 0.15);
    deskCup(g, 0.7, topY + 0.07, 0.32);
    deskPlant(g, -0.7, topY + 0.06, 0.25);
  }

  // mini pumpkin — desk corner accent only
  sphere(0.1, 0xff8b3d, 0.78, topY + 0.09, 0.4, g, 0.85);
  rbox(0.035, 0.05, 0.035, 0x5a9a3a, 0.78, topY + 0.18, 0.4, g, 0.01);

  // status lamp
  const lampCol = p.status === "busy" ? 0xff8a1f : 0x6bcb77;
  const bulb = sphere(0.11, lampCol, 0.72, 1.5, -0.4, g);
  bulb.material.emissive = new THREE.Color(lampCol);
  bulb.material.emissiveIntensity = 0.7;
  const light = new THREE.PointLight(lampCol, 0.4, 3.5);
  light.position.set(0.72, 1.5, -0.4);
  g.add(light);

  const vill = villager(g, p.color);
  floaters.push({ group: g, vill, busy: p.status === "busy", bulb });

  const plate = nameplate(label, p.color);
  plate.position.set(0, 2.25, 0.3);
  g.add(plate);

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.6, 2.4),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(0, 1.2, 0.4);
  hit.userData = { id };
  g.add(hit);
  clickables.push(hit);

  scene.add(g);
}

// Five stations around rug
deskSet("grok", -3.6, -1.6, "Grok Bot");
deskSet("ai", 0.2, -2.9, "AI開發");
deskSet("design", 3.7, -1.3, "設計");
deskSet("write", -2.8, 2.55, "寫作");
deskSet("cut", 2.9, 2.65, "剪片");

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
renderer.domElement.addEventListener("pointerdown", () => {
  moved = false;
});
renderer.domElement.addEventListener("pointermove", () => {
  moved = true;
});
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
  const w = host.clientWidth,
    h = host.clientHeight;
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
