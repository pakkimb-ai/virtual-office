import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const people = {
  grok: {
    name: "Grok Bot",
    role: "隊長",
    status: "busy",
    motto: "對齊完先開下一檔。",
    task: "對齊大家進度同下一版優先。",
    done: "定咗真 3D＋動森方向。",
    color: 0xff8a1f,
    updated: "2026-10-30 22:45 HKT",
  },
  ai: {
    name: "AI開發人員",
    role: "開發",
    status: "busy",
    motto: "可開先上，再執細節。",
    task: "跟 ACNH reference 重做辦公室外觀。",
    done: "上線可拖轉 3D 辦公室。",
    color: 0x5b8def,
    updated: "2026-10-30 22:45 HKT",
  },
  design: {
    name: "設計助手",
    role: "設計",
    status: "busy",
    motto: "色先定，版面就跟。",
    task: "動森色板同工位層級。",
    done: "交咗橙紫 token 同道具清單。",
    color: 0xf78fb3,
    updated: "2026-10-30 22:45 HKT",
  },
  write: {
    name: "寫作助手",
    role: "寫作",
    status: "busy",
    motto: "稿未定，字先穩。",
    task: "執緊開場白",
    done: "務實開場白已交",
    color: 0x6bcb77,
    updated: "2026-10-30 22:45 HKT",
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
    updated: "2026-10-30 22:45 HKT",
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
scene.background = new THREE.Color(0xa8d8ea);
scene.fog = new THREE.Fog(0xa8d8ea, 30, 58);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
// ~38° elevated look at rug center, four walls in frame
const camHome = new THREE.Vector3(10.5, 11.2, 12.5);
camera.position.copy(camHome);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.9, 0.3);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 8;
controls.maxDistance = 26;
document.getElementById("btnReset").onclick = () => {
  camera.position.copy(camHome);
  controls.target.set(0, 0.9, 0.3);
  controls.update();
};

scene.add(new THREE.AmbientLight(0xfff6ea, 1.05));
scene.add(new THREE.HemisphereLight(0xfff2dc, 0xc8dcc8, 0.6));
const sun = new THREE.DirectionalLight(0xffe2b8, 0.9);
sun.position.set(5, 15, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
scene.add(sun);
const warmWin = new THREE.PointLight(0xffa050, 0.45, 18);
warmWin.position.set(-2.2, 3.2, -4.5);
scene.add(warmWin);

function tileTex() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#E4E0D8";
  ctx.fillRect(0, 0, 256, 256);
  const tile = 64;
  for (let y = 0; y < 256; y += tile) {
    for (let x = 0; x < 256; x += tile) {
      const shade = ((x / tile + y / tile) % 2 === 0) ? "#EAE6DE" : "#DED9D0";
      ctx.fillStyle = shade;
      ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
      ctx.strokeStyle = "rgba(160,150,140,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 4.5);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function wallTex() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#F3E7D7";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(196,165,116,0.08)";
  for (let i = 0; i < 30; i++) {
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
function sunsetTex() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 160);
  g.addColorStop(0, "#F7B26A");
  g.addColorStop(0.45, "#FF9A5C");
  g.addColorStop(0.75, "#FF7A3A");
  g.addColorStop(1, "#E86840");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 160);
  // soft sun disc
  ctx.fillStyle = "rgba(255,240,180,0.9)";
  ctx.beginPath();
  ctx.arc(190, 55, 28, 0, Math.PI * 2);
  ctx.fill();
  // faint bats
  ctx.fillStyle = "rgba(55,35,50,0.45)";
  function bat(bx, by, s) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx - 10 * s, by - 6 * s, bx - 16 * s, by + 2 * s);
    ctx.quadraticCurveTo(bx - 6 * s, by - 2 * s, bx, by + 3 * s);
    ctx.quadraticCurveTo(bx + 6 * s, by - 2 * s, bx + 16 * s, by + 2 * s);
    ctx.quadraticCurveTo(bx + 10 * s, by - 6 * s, bx, by);
    ctx.fill();
  }
  bat(60, 70, 1);
  bat(110, 50, 0.7);
  bat(145, 90, 0.85);
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

// —— Room shell ——
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

// Round rug #F0C9A0 — clearer contrast ring
const rugOuter = new THREE.Mesh(
  new THREE.CylinderGeometry(3.55, 3.55, 0.055, 48),
  toon(0xd4a070)
);
rugOuter.position.set(0, 0.21, 0.35);
rugOuter.receiveShadow = true;
scene.add(rugOuter);
const rug = new THREE.Mesh(
  new THREE.CylinderGeometry(3.25, 3.25, 0.065, 48),
  toon(0xf0c9a0)
);
rug.position.set(0, 0.23, 0.35);
rug.receiveShadow = true;
scene.add(rug);
const rugIn = new THREE.Mesh(
  new THREE.CylinderGeometry(2.35, 2.35, 0.07, 48),
  toon(0xffe0c0)
);
rugIn.position.set(0, 0.24, 0.35);
scene.add(rugIn);

// —— Big back window: warm sunset + faint bats ——
rbox(4.2, 2.9, 0.16, 0xfff8ec, -1.8, 3.05, -6.62, scene, 0.06);
rbox(0.12, 2.55, 0.1, 0xc4a574, -1.8, 3.05, -6.52, scene, 0.03); // mullion
rbox(3.85, 0.12, 0.1, 0xc4a574, -1.8, 3.05, -6.52, scene, 0.03);
const skyPane = new THREE.Mesh(
  new THREE.PlaneGeometry(3.7, 2.4),
  new THREE.MeshBasicMaterial({ map: sunsetTex() })
);
skyPane.position.set(-1.8, 3.05, -6.48);
scene.add(skyPane);

// Wall clock
const clockBody = cyl(0.42, 0.42, 0.1, 0xc4a574, 1.6, 3.9, -6.55, scene, 24);
clockBody.rotation.x = Math.PI / 2;
const clockFace = new THREE.Mesh(
  new THREE.CircleGeometry(0.36, 32),
  new THREE.MeshBasicMaterial({ map: clockFaceTex() })
);
clockFace.position.set(1.6, 3.9, -6.48);
scene.add(clockFace);

// Corner whiteboard (Raymond-style standing)
function standingWhiteboard(x, z, rotY = 0) {
  const g = new THREE.Group();
  // board
  const board = new THREE.Mesh(
    new RoundedBoxGeometry(1.6, 1.15, 0.08, 2, 0.04),
    toon(0xffffff, boardTex())
  );
  board.position.set(0, 1.55, 0);
  board.castShadow = true;
  g.add(board);
  // wood frame edge
  rbox(1.7, 0.08, 0.1, 0xc4a574, 0, 2.15, 0, g, 0.03);
  rbox(1.7, 0.08, 0.1, 0xc4a574, 0, 0.95, 0, g, 0.03);
  // easel legs
  rbox(0.08, 1.5, 0.08, 0xc4a574, -0.55, 0.75, 0.15, g, 0.03);
  rbox(0.08, 1.5, 0.08, 0xc4a574, 0.55, 0.75, 0.15, g, 0.03);
  rbox(0.08, 1.35, 0.08, 0xc4a574, 0, 0.7, -0.2, g, 0.03);
  rbox(1.2, 0.06, 0.35, 0xc4a574, 0, 0.95, 0.05, g, 0.03); // tray
  // markers on tray
  rbox(0.06, 0.05, 0.18, 0x5b8def, -0.25, 1.01, 0.08, g, 0.02);
  rbox(0.06, 0.05, 0.18, 0xff8a1f, -0.1, 1.01, 0.08, g, 0.02);
  rbox(0.06, 0.05, 0.18, 0x6bcb77, 0.05, 1.01, 0.08, g, 0.02);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
}
standingWhiteboard(5.8, -5.4, -0.35);

// Water cooler (Raymond-style)
function waterCooler(x, z) {
  const g = new THREE.Group();
  // body
  rbox(0.55, 1.05, 0.5, 0xe8e4dc, 0, 0.7, 0, g, 0.08);
  // front panel
  rbox(0.4, 0.35, 0.06, 0x5b8def, 0, 0.55, 0.26, g, 0.04);
  // spigots
  cyl(0.04, 0.04, 0.12, 0x888888, -0.1, 0.85, 0.28, g, 8);
  cyl(0.04, 0.04, 0.12, 0xff8a1f, 0.1, 0.85, 0.28, g, 8);
  // drip tray
  rbox(0.35, 0.05, 0.2, 0xc4a574, 0, 0.38, 0.28, g, 0.03);
  // water jug on top
  const jug = cyl(0.22, 0.2, 0.55, 0xb8e8ff, 0, 1.5, 0, g, 20);
  jug.material = new THREE.MeshToonMaterial({
    color: 0xb8e8ff,
    transparent: true,
    opacity: 0.85,
  });
  // jug neck
  cyl(0.08, 0.1, 0.12, 0xd0f0ff, 0, 1.82, 0, g, 12);
  // cup dispenser hint
  rbox(0.18, 0.25, 0.18, 0xfff8ec, 0.28, 1.05, 0.05, g, 0.04);
  g.position.set(x, 0, z);
  scene.add(g);
}
waterCooler(6.6, -3.6);

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
plant(-6.3, -4.8);

// Floor pumpkins (small, corner only)
function pumpkin(x, z, s = 1) {
  sphere(0.38 * s, 0xff8b3d, x, 0.4 * s, z, scene, 0.85);
  rbox(0.1 * s, 0.18 * s, 0.1 * s, 0x5a9a3a, x, 0.68 * s, z, scene, 0.03);
}
pumpkin(-5.8, -5.5, 1.0);
pumpkin(5.2, 4.5, 0.75);

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
  // accent strip
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

function villager(parent, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.55, 0.7, 0.4, 3, 0.12),
    toon(color)
  );
  body.position.y = 0.85;
  body.castShadow = true;
  g.add(body);
  sphere(0.32, 0xffe0c0, 0, 1.45, 0, g);
  sphere(0.1, color, -0.22, 1.65, 0, g);
  sphere(0.1, color, 0.22, 1.65, 0, g);
  sphere(0.05, 0x2a1f14, -0.1, 1.48, 0.28, g);
  sphere(0.05, 0x2a1f14, 0.1, 1.48, 0.28, g);
  sphere(0.05, 0xff9aa8, -0.18, 1.38, 0.26, g, 0.6);
  sphere(0.05, 0xff9aa8, 0.18, 1.38, 0.26, g, 0.6);
  g.position.set(0, 0, 1.05);
  parent.add(g);
  return g;
}

/** Dual monitor with stands + glowing panels */
function dualMonitors(g, yBase, zBack, wide = false) {
  const span = wide ? 0.55 : 0.42;
  [-span, span].forEach((ox, i) => {
    // stand base
    rbox(0.28, 0.04, 0.22, 0x5a6070, ox, yBase, zBack + 0.05, g, 0.03);
    // neck
    rbox(0.06, 0.28, 0.06, 0x5a6070, ox, yBase + 0.16, zBack, g, 0.02);
    // bezel
    const bezel = rbox(0.62, 0.42, 0.06, 0x3a4050, ox, yBase + 0.42, zBack - 0.02, g, 0.04);
    // glowing screen
    const screen = new THREE.Mesh(
      new RoundedBoxGeometry(0.52, 0.32, 0.03, 2, 0.02),
      new THREE.MeshToonMaterial({
        color: i === 0 ? 0x9fe0ff : 0xb8ffd0,
        emissive: i === 0 ? 0x4aa0c8 : 0x3a9050,
        emissiveIntensity: 0.45,
      })
    );
    screen.position.set(ox, yBase + 0.42, zBack + 0.02);
    g.add(screen);
    void bezel;
  });
}

/** Clapboard / slate */
function clapboard(g, x, y, z) {
  const cg = new THREE.Group();
  // body
  rbox(0.42, 0.28, 0.05, 0x2a2a2a, 0, 0, 0, cg, 0.02);
  // white lines
  for (let i = 0; i < 3; i++) {
    rbox(0.34, 0.025, 0.02, 0xfff8ec, 0, -0.06 + i * 0.07, 0.03, cg, 0.01);
  }
  // hinged top stick with chevrons
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

/** Color fan (small wedges) */
function colorFan(g, x, y, z) {
  const colors = [0xff8a1f, 0xf78fb3, 0x5b8def, 0x6bcb77, 0x9b5cff, 0xffe066];
  colors.forEach((col, i) => {
    const wedge = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04, 0.08),
      toon(col)
    );
    const a = -0.7 + i * 0.28;
    wedge.position.set(x + Math.cos(a) * 0.12, y, z + Math.sin(a) * 0.12);
    wedge.rotation.y = -a;
    wedge.castShadow = true;
    g.add(wedge);
  });
  // pivot pin
  cyl(0.03, 0.03, 0.06, 0xc4a574, x, y + 0.02, z, g, 8);
}

/** Walkie / radio */
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

function deskSet(id, x, z, label) {
  const p = people[id];
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  // Office Desk — ivory top #FFF8EC + wood legs #C4A574
  rbox(1.85, 0.14, 1.05, 0xfff8ec, 0, 0.88, 0, g, 0.08);
  // apron
  rbox(1.75, 0.1, 0.95, 0xc4a574, 0, 0.78, 0, g, 0.04);
  [
    [-0.78, -0.4],
    [0.78, -0.4],
    [-0.78, 0.4],
    [0.78, 0.4],
  ].forEach(([lx, lz]) => {
    rbox(0.12, 0.78, 0.12, 0xc4a574, lx, 0.39, lz, g, 0.04);
  });

  // Modern Chair — seat + rounded back in role color
  rbox(0.72, 0.12, 0.68, p.color, 0, 0.52, 1.05, g, 0.1);
  // cushion top lighter
  rbox(0.62, 0.08, 0.58, 0xfff8ec, 0, 0.6, 1.05, g, 0.08);
  // round back
  const backRest = new THREE.Mesh(
    new RoundedBoxGeometry(0.7, 0.65, 0.12, 3, 0.1),
    toon(p.color)
  );
  backRest.position.set(0, 0.95, 1.32);
  backRest.castShadow = true;
  g.add(backRest);
  // chair legs
  [
    [-0.28, 0.82],
    [0.28, 0.82],
    [-0.28, 1.25],
    [0.28, 1.25],
  ].forEach(([lx, lz]) => {
    rbox(0.08, 0.45, 0.08, 0xc4a574, lx, 0.28, lz, g, 0.03);
  });

  const topY = 0.96;

  if (id === "ai") {
    dualMonitors(g, topY, -0.32, false);
    // keyboard
    rbox(0.7, 0.04, 0.28, 0x5a6070, 0, topY + 0.03, 0.18, g, 0.03);
    rbox(0.6, 0.015, 0.2, 0x3a4050, 0, topY + 0.055, 0.18, g, 0.01);
    deskCup(g, -0.7, topY + 0.07, 0.3);
    deskPlant(g, 0.72, topY + 0.06, -0.15);
  } else if (id === "write") {
    // manuscript stack
    rbox(0.55, 0.03, 0.42, 0xfff8ec, -0.15, topY + 0.03, 0.05, g, 0.02);
    rbox(0.52, 0.03, 0.4, 0xf0e8d8, -0.12, topY + 0.06, 0.06, g, 0.02);
    rbox(0.5, 0.03, 0.38, 0xfff8ec, -0.1, topY + 0.09, 0.05, g, 0.02);
    // pen
    rbox(0.04, 0.04, 0.28, 0x5b8def, 0.25, topY + 0.04, 0.15, g, 0.015);
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
    // drawing tablet
    rbox(0.75, 0.05, 0.55, 0x5a6070, 0.05, topY + 0.03, 0.05, g, 0.05);
    rbox(0.62, 0.02, 0.44, 0xf5e8ff, 0.05, topY + 0.07, 0.05, g, 0.02);
    // stylus
    rbox(0.03, 0.03, 0.22, 0xf78fb3, 0.45, topY + 0.05, 0.28, g, 0.01);
    colorFan(g, -0.55, topY + 0.04, -0.15);
    deskCup(g, -0.7, topY + 0.07, 0.3);
    deskPlant(g, 0.7, topY + 0.06, -0.25);
  } else if (id === "cut") {
    dualMonitors(g, topY, -0.3, true);
    clapboard(g, -0.55, topY + 0.18, 0.25);
    // timeline strip on desk
    rbox(0.9, 0.03, 0.12, 0x3a4050, 0.15, topY + 0.03, 0.28, g, 0.02);
    rbox(0.2, 0.02, 0.08, 0xff8a1f, -0.15, topY + 0.05, 0.28, g, 0.01);
    rbox(0.15, 0.02, 0.08, 0x6bcb77, 0.1, topY + 0.05, 0.28, g, 0.01);
    deskCup(g, 0.7, topY + 0.07, 0.3);
    deskPlant(g, -0.75, topY + 0.06, -0.2);
  } else if (id === "grok") {
    // small checklist whiteboard on desk stand
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

  // mini pumpkin accent — desk corner only
  sphere(0.11, 0xff8b3d, 0.72, topY + 0.1, 0.38, g, 0.85);
  rbox(0.04, 0.06, 0.04, 0x5a9a3a, 0.72, topY + 0.2, 0.38, g, 0.01);

  // status lamp
  const lampCol = p.status === "busy" ? 0xff8a1f : 0x6bcb77;
  const bulb = sphere(0.11, lampCol, 0.7, 1.45, -0.38, g);
  bulb.material.emissive = new THREE.Color(lampCol);
  bulb.material.emissiveIntensity = 0.7;
  const light = new THREE.PointLight(lampCol, 0.4, 3.5);
  light.position.set(0.7, 1.45, -0.38);
  g.add(light);

  const vill = villager(g, p.color);
  floaters.push({ group: g, vill, busy: p.status === "busy", bulb });

  const plate = nameplate(label, p.color);
  plate.position.set(0, 2.2, 0.25);
  g.add(plate);

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 2.5, 2.3),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(0, 1.15, 0.35);
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
