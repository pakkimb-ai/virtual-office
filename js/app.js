import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const HKT = "2026-10-30 23:55 HKT";

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
const camHome = new THREE.Vector3(10.2, 10.8, 12.2);
camera.position.copy(camHome);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
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

const gltfLoader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();
const modelCache = {};

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

function canvasTex(draw, w = 256, h = 256) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function tileTex() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#D8D4CC";
    ctx.fillRect(0, 0, w, h);
    const tile = 64;
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const even = (x / tile + y / tile) % 2 === 0;
        ctx.fillStyle = even ? "#EEEAE2" : "#C8C4BC";
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        ctx.strokeStyle = "rgba(120,110,100,0.45)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, tile - 2, tile - 2);
      }
    }
  });
}
function wallTex() {
  const t = canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#F3E7D7";
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = "rgba(196,165,116,0.12)";
      ctx.fillRect(x, 0, 2, h);
      ctx.fillStyle = "rgba(255,252,245,0.25)";
      ctx.fillRect(x + 3, 0, 12, h);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 2.2);
  return t;
}
function daySkyTex() {
  return canvasTex((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#A8D8F0");
    g.addColorStop(0.4, "#C8E8F8");
    g.addColorStop(0.7, "#FFE0B8");
    g.addColorStop(1, "#FFC890");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,245,200,0.95)";
    ctx.beginPath();
    ctx.arc(200, 48, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(120,170,130,0.35)";
    ctx.beginPath();
    ctx.moveTo(0, 130);
    ctx.quadraticCurveTo(80, 100, 160, 125);
    ctx.quadraticCurveTo(210, 140, 256, 120);
    ctx.lineTo(256, 160);
    ctx.lineTo(0, 160);
    ctx.fill();
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
  }, 256, 160);
}
function curtainTex() {
  return canvasTex((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(255,250,240,0.92)");
    g.addColorStop(0.15, "rgba(255,248,235,0.55)");
    g.addColorStop(0.5, "rgba(255,252,245,0.35)");
    g.addColorStop(0.85, "rgba(255,248,235,0.55)");
    g.addColorStop(1, "rgba(255,250,240,0.92)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // lace scallops
    ctx.strokeStyle = "rgba(200,180,150,0.45)";
    ctx.lineWidth = 2;
    for (let y = 8; y < 40; y += 10) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) {
        ctx.quadraticCurveTo(x + 8, y + 6, x + 16, y);
      }
      ctx.stroke();
    }
    // soft folds
    for (let x = 12; x < w; x += 28) {
      ctx.fillStyle = "rgba(180,160,130,0.12)";
      ctx.fillRect(x, 0, 6, h);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(x + 8, 0, 4, h);
    }
  }, 128, 256);
}
function clockFaceTex() {
  return canvasTex((ctx) => {
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
  }, 128, 128);
}
function boardTex() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#F7F4EE";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#C4A574";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, w - 8, h - 8);
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
  }, 256, 192);
}
function checklistTex() {
  return canvasTex((ctx) => {
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
  }, 128, 160);
}
function frameArtTex(hue) {
  return canvasTex((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hue},45%,78%)`);
    g.addColorStop(1, `hsl(${hue + 40},40%,62%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.4, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(80,60,40,0.25)";
    ctx.fillRect(20, h * 0.62, w - 40, 12);
    ctx.fillRect(30, h * 0.74, w - 60, 8);
  }, 128, 128);
}
/** IDE / code screen */
function ideScreenTex() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#1e2430";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2a3344";
    ctx.fillRect(0, 0, 36, h);
    ctx.fillStyle = "#5B8DEF";
    ctx.fillRect(8, 16, 20, 8);
    ctx.fillStyle = "#6BCB77";
    ctx.fillRect(8, 32, 20, 8);
    ctx.fillStyle = "#F78FB3";
    ctx.fillRect(8, 48, 20, 8);
    ctx.fillStyle = "#252d3c";
    ctx.fillRect(36, 0, w - 36, 18);
    ctx.fillStyle = "#8ab4f8";
    ctx.font = "10px monospace";
    ctx.fillText("app.js  ×", 48, 13);
    const lines = [
      ["#5B8DEF", "async "],
      ["#fff", "function "],
      ["#F78FB3", "buildOffice"],
      ["#fff", "() {"],
    ];
    let x = 48;
    ctx.font = "11px monospace";
    lines.forEach(([c, t]) => {
      ctx.fillStyle = c;
      ctx.fillText(t, x, 40);
      x += ctx.measureText(t).width;
    });
    ctx.fillStyle = "#6BCB77";
    ctx.fillText("  await loadKayKit();", 48, 58);
    ctx.fillStyle = "#c8d0e0";
    ctx.fillText("  placeDesks();", 48, 74);
    ctx.fillStyle = "#FF8A1F";
    ctx.fillText("  // curtains + UI", 48, 90);
    ctx.fillStyle = "#c8d0e0";
    ctx.fillText("  render();", 48, 106);
    ctx.fillStyle = "#fff";
    ctx.fillText("}", 48, 122);
  }, 256, 160);
}
/** Document / writing screen */
function docScreenTex() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#f7f2e8";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#e8e0d0";
    ctx.fillRect(0, 0, w, 22);
    ctx.fillStyle = "#4a3428";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("開場白 · draft", 12, 15);
    ctx.fillStyle = "#6a5a4a";
    ctx.font = "11px sans-serif";
    ["歡迎返辦公室——", "萬聖節主題，撳工位", "睇大家做緊咩。", "", "「稿未定，字先穩。」"].forEach((t, i) => {
      ctx.fillText(t, 16, 44 + i * 18);
    });
    ctx.fillStyle = "#6BCB77";
    ctx.fillRect(w - 28, h - 28, 16, 16);
  }, 256, 160);
}
/** Design palette screen */
function designScreenTex() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#2a2030";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("色板", 12, 20);
    const cols = ["#5B8DEF", "#6BCB77", "#F78FB3", "#9B5CFF", "#FF8A1F", "#F0C9A0"];
    cols.forEach((c, i) => {
      const x = 16 + (i % 3) * 76;
      const y = 36 + Math.floor(i / 3) * 56;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 64, 44);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.strokeRect(x, y, 64, 44);
    });
  }, 256, 160);
}
/** Cut — left timeline */
function timelineScreenTex() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2a2a38";
    ctx.fillRect(0, 0, 40, h);
    ctx.fillStyle = "#9B5CFF";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("V1", 10, 28);
    ctx.fillText("V2", 10, 58);
    ctx.fillText("A1", 10, 88);
    ctx.fillStyle = "#333348";
    for (let y = 14; y < h; y += 30) ctx.fillRect(40, y, w - 40, 22);
    const clips = [
      [50, 18, 70, 14, "#FF8A1F"],
      [130, 18, 50, 14, "#5B8DEF"],
      [60, 48, 90, 14, "#6BCB77"],
      [160, 48, 40, 14, "#F78FB3"],
      [55, 78, 110, 14, "#9B5CFF"],
      [80, 108, 60, 14, "#FF8A1F"],
    ];
    clips.forEach(([x, y, ww, hh, c]) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, ww, hh);
    });
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 0);
    ctx.lineTo(120, h);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "9px monospace";
    ctx.fillText("00:12  timeline", 48, h - 8);
  }, 256, 144);
}
/** Cut — right preview */
function previewScreenTex() {
  return canvasTex((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#3a2060");
    g.addColorStop(1, "#1a3048");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#F78FB3";
    ctx.fillRect(30, 28, 80, 50);
    ctx.fillStyle = "#5B8DEF";
    ctx.fillRect(130, 40, 70, 45);
    ctx.fillStyle = "#6BCB77";
    ctx.beginPath();
    ctx.arc(100, 90, 22, 0, Math.PI * 2);
    ctx.fill();
    // waveform
    ctx.strokeStyle = "#FF8A1F";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 20; x < w - 20; x += 4) {
      const y = 120 + Math.sin(x * 0.12) * 10 + Math.sin(x * 0.05) * 6;
      if (x === 20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("PREVIEW", 90, 22);
  }, 256, 144);
}
function checklistBoardTex() {
  return checklistTex();
}

function restyleToToon(root, tintHex = null) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const next = mats.map((m) => {
      const map = m.map || null;
      if (map) {
        map.colorSpace = THREE.SRGBColorSpace;
        map.needsUpdate = true;
      }
      const col = tintHex != null ? tintHex : m.color?.getHex?.() ?? 0xffffff;
      const mat = new THREE.MeshToonMaterial({
        color: col,
        map,
        transparent: m.transparent,
        opacity: m.opacity ?? 1,
        side: m.side ?? THREE.FrontSide,
      });
      return mat;
    });
    obj.material = next.length === 1 ? next[0] : next;
  });
}

async function loadKay(name) {
  const key = "kay:" + name;
  if (!modelCache[key]) {
    const gltf = await gltfLoader.loadAsync(`assets/kaykit/${name}.gltf`);
    restyleToToon(gltf.scene);
    modelCache[key] = gltf.scene;
  }
  return modelCache[key].clone(true);
}
async function loadKen(name) {
  const key = "ken:" + name;
  if (!modelCache[key]) {
    const gltf = await gltfLoader.loadAsync(`assets/kenney/${name}.glb`);
    restyleToToon(gltf.scene);
    modelCache[key] = gltf.scene;
  }
  return modelCache[key].clone(true);
}

function placeModel(model, parent, x, y, z, scale = 1, rotY = 0) {
  model.scale.setScalar(scale);
  model.position.set(x, y, z);
  model.rotation.y = rotY;
  parent.add(model);
  return model;
}

function tintModel(model, hex) {
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => {
      if (m.color) m.color.setHex(hex);
    });
  });
}

function addScreenPlane(parent, map, x, y, z, w = 0.5, h = 0.32) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map, toneMapped: false })
  );
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

// —— Room shell ——
const floorMap = tileTex();
floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
floorMap.repeat.set(5, 4.5);
const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 14), toon(0xffffff, floorMap));
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

rbox(16, 0.28, 0.18, 0xc4a574, 0, 0.32, -6.65, scene, 0.04);
rbox(0.18, 0.28, 14, 0xc4a574, -7.7, 0.32, 0, scene, 0.04);
rbox(0.18, 0.28, 14, 0xc4a574, 7.7, 0.32, 0, scene, 0.04);

const rugOuter = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.05, 48), toon(0xc89060));
rugOuter.position.set(0, 0.2, 0.35);
rugOuter.receiveShadow = true;
scene.add(rugOuter);
const rug = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.06, 48), toon(0xf0c9a0));
rug.position.set(0, 0.225, 0.35);
rug.receiveShadow = true;
scene.add(rug);
const rugIn = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.065, 48), toon(0xffe0c0));
rugIn.position.set(0, 0.24, 0.35);
scene.add(rugIn);

// Window + curtains
rbox(4.4, 3.0, 0.18, 0xfff8ec, -1.9, 3.1, -6.62, scene, 0.06);
rbox(4.5, 0.12, 0.12, 0xc4a574, -1.9, 4.55, -6.5, scene, 0.03);
rbox(4.5, 0.12, 0.12, 0xc4a574, -1.9, 1.65, -6.5, scene, 0.03);
rbox(0.12, 2.9, 0.12, 0xc4a574, -4.05, 3.1, -6.5, scene, 0.03);
rbox(0.12, 2.9, 0.12, 0xc4a574, 0.25, 3.1, -6.5, scene, 0.03);
rbox(0.1, 2.6, 0.08, 0xc4a574, -1.9, 3.1, -6.5, scene, 0.02);
rbox(3.95, 0.1, 0.08, 0xc4a574, -1.9, 3.1, -6.5, scene, 0.02);
const skyPane = new THREE.Mesh(
  new THREE.PlaneGeometry(3.85, 2.5),
  new THREE.MeshBasicMaterial({ map: daySkyTex() })
);
skyPane.position.set(-1.9, 3.1, -6.48);
scene.add(skyPane);
rbox(4.3, 0.1, 0.28, 0xc4a574, -1.9, 1.6, -6.4, scene, 0.04);

// Lace / cloth curtains (pulled to sides)
const cTex = curtainTex();
function curtainPanel(x) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 2.7),
    new THREE.MeshToonMaterial({
      map: cTex,
      color: 0xfff8ec,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  m.position.set(x, 3.05, -6.42);
  scene.add(m);
  // rod ring
  cyl(0.04, 0.04, 0.06, 0xc4a574, x, 4.42, -6.42, scene, 10);
}
curtainPanel(-3.55);
curtainPanel(-0.25);
// curtain rod
rbox(4.6, 0.06, 0.06, 0xc4a574, -1.9, 4.45, -6.42, scene, 0.02);

// Wall clock (larger / clearer)
const clockBody = cyl(0.48, 0.48, 0.12, 0xc4a574, 1.9, 4.05, -6.55, scene, 24);
clockBody.rotation.x = Math.PI / 2;
const clockFace = new THREE.Mesh(
  new THREE.CircleGeometry(0.4, 32),
  new THREE.MeshBasicMaterial({ map: clockFaceTex() })
);
clockFace.position.set(1.9, 4.05, -6.46);
scene.add(clockFace);

// Cut wall preview (with UI texture)
rbox(1.7, 1.05, 0.08, 0x3a4050, 5.0, 3.5, -6.55, scene, 0.04);
const wallPreview = new THREE.Mesh(
  new THREE.PlaneGeometry(1.5, 0.88),
  new THREE.MeshBasicMaterial({ map: previewScreenTex(), toneMapped: false })
);
wallPreview.position.set(5.0, 3.5, -6.48);
scene.add(wallPreview);
rbox(0.15, 0.08, 0.08, 0x9b5cff, 5.0, 2.9, -6.5, scene, 0.02);

// Tiny Halloween bat hangers (accent only)
function batHang(x, y) {
  const g = new THREE.Group();
  const wing = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 3),
    toon(0x3a2a38)
  );
  wing.position.set(-0.1, 0, 0);
  wing.rotation.z = 0.4;
  g.add(wing);
  const wing2 = wing.clone();
  wing2.position.x = 0.1;
  wing2.rotation.z = -0.4;
  g.add(wing2);
  sphere(0.05, 0x3a2a38, 0, 0, 0.02, g);
  g.position.set(x, y, -6.55);
  scene.add(g);
}
batHang(3.2, 4.5);
batHang(3.55, 4.25);

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
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
}
standingWhiteboard(5.9, -5.35, -0.35);

function waterCooler(x, z) {
  const g = new THREE.Group();
  rbox(0.58, 1.1, 0.52, 0xf5f2ea, 0, 0.72, 0, g, 0.1);
  rbox(0.42, 0.38, 0.05, 0xe8e4dc, 0, 0.58, 0.28, g, 0.04);
  cyl(0.05, 0.05, 0.04, 0xff8a1f, -0.1, 0.72, 0.3, g, 10);
  cyl(0.05, 0.05, 0.04, 0x5b8def, 0.1, 0.72, 0.3, g, 10);
  const jug = cyl(0.24, 0.22, 0.58, 0x6ec8f0, 0, 1.55, 0, g, 20);
  jug.material = new THREE.MeshToonMaterial({ color: 0x6ec8f0, transparent: true, opacity: 0.88 });
  cyl(0.09, 0.11, 0.12, 0xa0dcf5, 0, 1.88, 0, g, 12);
  g.position.set(x, 0, z);
  scene.add(g);
}
waterCooler(6.65, -3.5);

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

function villager(parent, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.62, 0.38, 3, 0.12), toon(color));
  body.position.y = 0.78;
  body.castShadow = true;
  g.add(body);
  sphere(0.38, 0xffe0c0, 0, 1.42, 0, g);
  sphere(0.11, color, -0.28, 1.62, 0, g);
  sphere(0.11, color, 0.28, 1.62, 0, g);
  sphere(0.055, 0x2a1f14, -0.12, 1.45, 0.32, g);
  sphere(0.055, 0x2a1f14, 0.12, 1.45, 0.32, g);
  sphere(0.055, 0xff9aa8, -0.22, 1.35, 0.28, g, 0.55);
  sphere(0.055, 0xff9aa8, 0.22, 1.35, 0.28, g, 0.55);
  rbox(0.16, 0.1, 0.22, 0x4a3428, -0.14, 0.12, 0.05, g, 0.04);
  rbox(0.16, 0.1, 0.22, 0x4a3428, 0.14, 0.12, 0.05, g, 0.04);
  g.position.set(0, 0, 1.05);
  parent.add(g);
  return g;
}

function clapboard(g, x, y, z) {
  const cg = new THREE.Group();
  rbox(0.42, 0.28, 0.05, 0x2a2a2a, 0, 0, 0, cg, 0.02);
  for (let i = 0; i < 3; i++) rbox(0.34, 0.025, 0.02, 0xfff8ec, 0, -0.06 + i * 0.07, 0.03, cg, 0.01);
  rbox(0.44, 0.08, 0.05, 0x2a2a2a, 0, 0.2, 0, cg, 0.02);
  for (let i = 0; i < 4; i++) {
    rbox(0.09, 0.06, 0.02, i % 2 === 0 ? 0xfff8ec : 0x2a2a2a, -0.15 + i * 0.1, 0.2, 0.03, cg, 0.01);
  }
  cg.position.set(x, y, z);
  cg.rotation.y = -0.4;
  g.add(cg);
}
function colorFan(g, x, y, z) {
  [0xff8a1f, 0xf78fb3, 0x5b8def, 0x6bcb77, 0x9b5cff, 0xffe066].forEach((col, i) => {
    const wedge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.08), toon(col));
    const a = -0.7 + i * 0.28;
    wedge.position.set(x + Math.cos(a) * 0.12, y, z + Math.sin(a) * 0.12);
    wedge.rotation.y = -a;
    g.add(wedge);
  });
}
function walkie(g, x, y, z) {
  rbox(0.16, 0.28, 0.1, 0x5a6070, x, y, z, g, 0.04);
  cyl(0.025, 0.025, 0.18, 0x3a4050, x, y + 0.22, z, g, 8);
  sphere(0.035, 0xff8a1f, x + 0.05, y + 0.06, z + 0.05, g);
}
function deskCup(g, x, y, z) {
  cyl(0.07, 0.06, 0.12, 0xfff8ec, x, y, z, g, 12);
}

async function kenMonitor(parent, x, y, z, screenMap, scale = 0.22) {
  const mon = await loadKen("computerScreen");
  placeModel(mon, parent, x, y, z, scale, 0);
  // Kenney screen ~2.94 tall × 3.93 wide; place UI on front face
  const sh = 2.94 * scale;
  const sw = 3.927 * scale * 0.72;
  addScreenPlane(parent, screenMap, x, y + sh * 0.55, z + 0.55 * scale, sw, sh * 0.62);
  return mon;
}

async function deskSet(id, x, z, label) {
  const p = people[id];
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  // KayKit desk (table_medium_long ≈ office desk)
  const desk = await loadKay("table_medium_long");
  placeModel(desk, g, 0, 0.18, 0, 0.72, 0);

  // KayKit chair tinted to role color
  const chair = await loadKay("chair_A");
  tintModel(chair, p.color);
  placeModel(chair, g, 0, 0.18, 1.15, 1.05, Math.PI);

  const topY = 0.95;

  if (id === "ai") {
    await kenMonitor(g, -0.35, topY, -0.35, ideScreenTex(), 0.2);
    await kenMonitor(g, 0.4, topY, -0.35, ideScreenTex(), 0.2);
    const kb = await loadKen("computerKeyboard");
    placeModel(kb, g, 0.05, topY, 0.15, 0.22, 0);
    const mouse = await loadKen("computerMouse");
    placeModel(mouse, g, 0.55, topY, 0.2, 0.25, 0);
    deskCup(g, 0.75, topY + 0.07, 0.35);
    const plant = await loadKay("cactus_small_A");
    placeModel(plant, g, -0.75, topY, 0.25, 0.45, 0);
  } else if (id === "write") {
    const lamp = await loadKay("lamp_table");
    placeModel(lamp, g, 0.55, topY, -0.25, 0.45, 0);
    const lampL = new THREE.PointLight(0xffe8c0, 0.35, 2.5);
    lampL.position.set(0.55, topY + 0.4, -0.15);
    g.add(lampL);
    const books = await loadKay("book_set");
    placeModel(books, g, -0.35, topY, 0.05, 0.7, 0.3);
    // paper stack
    rbox(0.45, 0.02, 0.35, 0xfff8ec, 0.1, topY + 0.02, 0.15, g, 0.01);
    rbox(0.42, 0.02, 0.33, 0xf0e8d8, 0.12, topY + 0.04, 0.16, g, 0.01);
    deskCup(g, -0.7, topY + 0.07, 0.32);
    // small doc screen leaning
    rbox(0.55, 0.4, 0.04, 0x5a6070, 0.15, topY + 0.28, -0.35, g, 0.03);
    addScreenPlane(g, docScreenTex(), 0.15, topY + 0.28, -0.32, 0.48, 0.32);
  } else if (id === "design") {
    rbox(0.78, 0.055, 0.58, 0x5a6070, 0.05, topY + 0.03, 0.05, g, 0.05);
    addScreenPlane(g, designScreenTex(), 0.05, topY + 0.08, 0.05, 0.64, 0.4);
    // rotate flat on desk — use slightly tilted board
    colorFan(g, -0.55, topY + 0.04, -0.15);
    const plant = await loadKay("cactus_medium_A");
    placeModel(plant, g, 0.7, topY, -0.25, 0.4, 0);
    deskCup(g, -0.7, topY + 0.07, 0.3);
  } else if (id === "cut") {
    await kenMonitor(g, -0.4, topY, -0.32, timelineScreenTex(), 0.2);
    await kenMonitor(g, 0.45, topY, -0.32, previewScreenTex(), 0.2);
    clapboard(g, -0.7, topY + 0.18, 0.25);
    // headphones (simple)
    cyl(0.12, 0.12, 0.04, 0x3a4050, 0.7, topY + 0.08, 0.25, g, 12);
    rbox(0.28, 0.04, 0.04, 0x3a4050, 0.7, topY + 0.18, 0.25, g, 0.02);
    cyl(0.05, 0.05, 0.08, 0x9b5cff, 0.56, topY + 0.1, 0.25, g, 10);
    cyl(0.05, 0.05, 0.08, 0x9b5cff, 0.84, topY + 0.1, 0.25, g, 10);
    deskCup(g, 0.15, topY + 0.07, 0.35);
  } else if (id === "grok") {
    const mini = new THREE.Mesh(
      new RoundedBoxGeometry(0.55, 0.7, 0.06, 2, 0.03),
      toon(0xffffff, checklistBoardTex())
    );
    mini.position.set(-0.15, topY + 0.42, -0.28);
    mini.castShadow = true;
    g.add(mini);
    rbox(0.08, 0.35, 0.08, 0xc4a574, -0.15, topY + 0.18, -0.22, g, 0.03);
    walkie(g, 0.45, topY + 0.16, 0.15);
    deskCup(g, 0.7, topY + 0.07, 0.32);
    const plant = await loadKay("cactus_small_A");
    placeModel(plant, g, -0.7, topY, 0.25, 0.4, 0);
  }

  // mini pumpkin
  sphere(0.1, 0xff8b3d, 0.78, topY + 0.09, 0.4, g, 0.85);
  rbox(0.035, 0.05, 0.035, 0x5a9a3a, 0.78, topY + 0.18, 0.4, g, 0.01);

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

async function decorateWalls() {
  // picture frames
  const f1 = await loadKay("pictureframe_medium");
  placeModel(f1, scene, -5.2, 3.2, -6.55, 1.1, 0);
  addScreenPlane(scene, frameArtTex(30), -5.2, 3.35, -6.48, 0.55, 0.7);

  const f2 = await loadKay("pictureframe_small_A");
  placeModel(f2, scene, -4.4, 2.6, -6.55, 1.0, 0);
  addScreenPlane(scene, frameArtTex(200), -4.4, 2.7, -6.48, 0.35, 0.42);

  const f3 = await loadKay("pictureframe_large_A");
  placeModel(f3, scene, 3.0, 3.0, -6.55, 0.9, 0);
  addScreenPlane(scene, frameArtTex(280), 3.0, 3.15, -6.48, 0.7, 0.85);

  // wall plant shelf
  const shelf = await loadKay("shelf_A_small");
  placeModel(shelf, scene, 0.9, 2.4, -6.5, 1.0, 0);
  const plant = await loadKay("cactus_small_A");
  placeModel(plant, scene, 0.7, 2.55, -6.45, 0.55, 0);
  const plant2 = await loadKay("cactus_medium_A");
  placeModel(plant2, scene, 1.15, 2.55, -6.45, 0.4, 0.4);

  // corner bookcase / cabinet
  const cab = await loadKay("cabinet_small");
  placeModel(cab, scene, -6.5, 0.18, -5.2, 1.1, 0.4);
  const books = await loadKay("book_set");
  placeModel(books, scene, -6.5, 1.2, -5.2, 0.8, 0.4);

  // standing lamp
  const lamp = await loadKay("lamp_standing");
  placeModel(lamp, scene, -6.4, 0.18, 3.8, 1.0, 0);

  // floor plants
  const p1 = await loadKay("cactus_medium_A");
  placeModel(p1, scene, -6.5, 0.18, 4.5, 1.2, 0);
  const p2 = await loadKay("cactus_medium_A");
  placeModel(p2, scene, 6.5, 0.18, 4.2, 1.1, 0.5);
}

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

(async function boot() {
  try {
    await decorateWalls();
    await deskSet("grok", -3.6, -1.6, "Grok Bot");
    await deskSet("ai", 0.2, -2.9, "AI開發");
    await deskSet("design", 3.7, -1.3, "設計");
    await deskSet("write", -2.8, 2.55, "寫作");
    await deskSet("cut", 2.9, 2.65, "剪片");
  } catch (err) {
    console.error("Asset load failed", err);
  }
})();
