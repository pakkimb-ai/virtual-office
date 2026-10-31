import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";

const HKT = "2026-10-31 01:35 HKT";

const people = {
  grok: {
    name: "Grok Bot 隊長",
    role: "隊長／QC",
    status: "busy",
    motto: "對齊完、核對完，先開下一關。",
    task: "統籌、QC、審批同匯報。",
    done: "定咗四人崗位。",
    color: 0xff8a1f,
    updated: HKT,
  },
  ai: {
    name: "開發人員",
    role: "開發",
    status: "busy",
    motto: "可開先上，再執細節。",
    task: "全部程式編寫同開發落地。",
    done: "辦公室同工具站上線。",
    color: 0x5b8def,
    updated: HKT,
  },
  design: {
    name: "設計助手",
    role: "美術",
    status: "busy",
    motto: "2D／3D 先定風格再出稿。",
    task: "所有美術 2D／3D 創作。",
    done: "動森風色板同道具規格已交。",
    color: 0xf78fb3,
    updated: HKT,
  },
  write: {
    name: "策劃助手",
    role: "策劃",
    status: "busy",
    motto: "先定玩法，再落細節。",
    task: "企劃／level design／文案",
    done: "崗位文案框架已定。",
    color: 0x6bcb77,
    updated: HKT,
  },
};

const host = document.getElementById("canvasHost");
const dlg = document.getElementById("deskDialog");
const els = {
  name: document.getElementById("dlgName"),
  badge: document.getElementById("dlgBadge"),
  motto: document.getElementById("dlgMotto"),
  task: document.getElementById("dlgTask"),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8daf0);
scene.fog = new THREE.Fog(0xa8daf0, 48, 92);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
// ~38° above the horizon, front-right iso, far enough to hold the 22×18 room.
const CAM_ELEV = 37 * Math.PI / 180;
const CAM_AZ = 36 * Math.PI / 180;
const CAM_DIST = 14.5;
const camHome = new THREE.Vector3(
  Math.sin(CAM_AZ) * Math.cos(CAM_ELEV) * CAM_DIST,
  Math.sin(CAM_ELEV) * CAM_DIST + 0.45,
  Math.cos(CAM_AZ) * Math.cos(CAM_ELEV) * CAM_DIST
);
camera.position.copy(camHome);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.7, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 12;
controls.maxDistance = 46;
document.getElementById("btnReset").onclick = () => {
  camera.position.copy(camHome);
  controls.target.set(0, 0.7, 0);
  controls.update();
};

const hintEl = document.getElementById("hint");
if (hintEl) {
  setTimeout(() => hintEl.classList.add("hide"), 3000);
}

scene.add(new THREE.AmbientLight(0xfff8f0, 1.35));
scene.add(new THREE.HemisphereLight(0xe8f8ff, 0xd0e8c8, 0.7));
const sun = new THREE.DirectionalLight(0xfff2dc, 0.95);
sun.position.set(4, 16, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 70;
sun.shadow.camera.left = -16;
sun.shadow.camera.right = 16;
sun.shadow.camera.top = 16;
sun.shadow.camera.bottom = -16;
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
  return new THREE.MeshLambertMaterial({ color, map });
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

function woodFloorTex() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#D8D0C4";
    ctx.fillRect(0, 0, w, h);
    const plank = 28;
    for (let y = 0; y < h; y += plank) {
      const shade = 210 + ((y / plank) % 3) * 8;
      ctx.fillStyle = `rgb(${shade},${shade - 8},${shade - 20})`;
      ctx.fillRect(0, y + 1, w, plank - 2);
      ctx.strokeStyle = "rgba(140,130,115,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + plank);
      ctx.lineTo(w, y + plank);
      ctx.stroke();
      // subtle grain
      ctx.strokeStyle = "rgba(160,145,120,0.12)";
      for (let x = 8; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x + 18, y + plank - 4);
        ctx.stroke();
      }
    }
  });
}
function wallTex() {
  const t = canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#F7F2EA";
    ctx.fillRect(0, 0, w, h);
    // soft vertical panels
    for (let x = 0; x < w; x += 48) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(x + 2, 2, 42, h - 4);
      ctx.strokeStyle = "rgba(200,185,160,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, 2, 42, h - 4);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 2);
  return t;
}
function daySkyTex() {
  return canvasTex((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#7EC8E8");
    g.addColorStop(0.35, "#B0E0F5");
    g.addColorStop(0.65, "#D8F0C8");
    g.addColorStop(1, "#8BC96A");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,245,200,0.95)";
    ctx.beginPath();
    ctx.arc(200, 48, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(70,160,80,0.55)";
    ctx.beginPath();
    ctx.moveTo(0, 115);
    ctx.quadraticCurveTo(80, 85, 160, 110);
    ctx.quadraticCurveTo(210, 125, 256, 105);
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
/** ACNH-style colorful grass desktop wallpaper */
function grassDesktopTex() {
  return canvasTex((ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    sky.addColorStop(0, "#8EC8F0");
    sky.addColorStop(1, "#C8E8F8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.55);
    ctx.fillStyle = "#FFE8A0";
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.18, 18, 0, Math.PI * 2);
    ctx.fill();
    const hill = ctx.createLinearGradient(0, h * 0.4, 0, h);
    hill.addColorStop(0, "#6BD86A");
    hill.addColorStop(1, "#3E9A48");
    ctx.fillStyle = hill;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.55);
    ctx.quadraticCurveTo(w * 0.25, h * 0.42, w * 0.5, h * 0.52);
    ctx.quadraticCurveTo(w * 0.75, h * 0.62, w, h * 0.48);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    // flowers
    [[40, 110, "#F78FB3"], [90, 125, "#FF8A1F"], [150, 115, "#9B5CFF"], [200, 130, "#FFE066"]].forEach(([x, y, c]) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff8ec";
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, 256, 160);
}
function bookSpineTex(hue) {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = `hsl(${hue},55%,55%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(2, 0, 4, h);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, h * 0.3, w, 3);
    ctx.fillRect(0, h * 0.7, w, 2);
  }, 32, 64);
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
/** Shared / timeline UI (wall or desk) */
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
/** Shared preview UI */
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

function restyleLambert(root, tintHex = null) {
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
      const mat = new THREE.MeshLambertMaterial({
        color: col,
        map,
        transparent: !!m.transparent,
        opacity: m.opacity ?? 1,
        side: m.side ?? THREE.FrontSide,
        vertexColors: !!m.vertexColors,
        alphaTest: m.alphaTest || 0,
      });
      if (m.emissive) {
        mat.emissive = m.emissive.clone();
        mat.emissiveIntensity = m.emissiveIntensity ?? 1;
      }
      return mat;
    });
    obj.material = next.length === 1 ? next[0] : next;
  });
}

/** Clone scene graph AND each material so tint/restyle cannot pollute cache. */
function deepClone(model) {
  const root = model.clone(true);
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map((m) => (m ? m.clone() : m));
    } else if (obj.material) {
      obj.material = obj.material.clone();
    }
  });
  return root;
}

/** Uniformly scale so bounding-box height ≈ targetH (world units). */
function fitHeight(model, targetH) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  if (size.y < 1e-6) return model;
  const s = targetH / size.y;
  model.scale.multiplyScalar(s);
  return model;
}

/** Scale so bounding-box width ≈ targetW. */
function fitWidth(model, targetW) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  if (size.x < 1e-6) return model;
  model.scale.multiplyScalar(targetW / size.x);
  return model;
}

/** After scale, put model so its bbox min.y sits on yBase (local parent Y). */
function sitOn(model, yBase) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  model.position.y += yBase - box.min.y;
  return model;
}

async function loadKay(name) {
  const key = "kay:" + name;
  if (!modelCache[key]) {
    const gltf = await gltfLoader.loadAsync(`assets/kaykit/${name}.gltf`);
    restyleLambert(gltf.scene);
    modelCache[key] = gltf.scene;
  }
  return deepClone(modelCache[key]);
}
async function loadKen(name) {
  const key = "ken:" + name;
  if (!modelCache[key]) {
    const gltf = await gltfLoader.loadAsync(`assets/kenney/${name}.glb`);
    restyleLambert(gltf.scene);
    modelCache[key] = gltf.scene;
  }
  return deepClone(modelCache[key]);
}

/** Desk role → KayKit Adventurers file in assets/kaykit/chars/. */
const ADVENTURER = {
  ai: "Rogue", // 開發 #5b8def
  design: "Mage", // 美術 #f78fb3
  write: "Barbarian", // 策劃 #6bcb77
  grok: "Knight", // 隊長 #ff8a1f
};
/** Skull must clear the desktop by this much. Hats are not allowed to satisfy it. */
const HEAD_CLEARANCE = 0.35;
const KEEP_MESH = /_(ArmLeft|ArmRight|Body|Head|LegLeft|LegRight|Hat|Helmet|Cape)$/;
const charMixers = [];

/**
 * Skinned clone of one adventurer. The GLB ships every weapon at once;
 * those are removed so they cannot stack into a giant prop.
 */
async function loadAdventurer(file) {
  const key = "adv:" + file;
  if (!modelCache[key]) {
    const gltf = await gltfLoader.loadAsync(`assets/kaykit/chars/${file}.glb`);
    restyleLambert(gltf.scene);
    modelCache[key] = gltf;
  }
  const gltf = modelCache[key];
  const model = cloneSkeleton(gltf.scene);
  const drop = [];
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (!KEEP_MESH.test(obj.name)) drop.push(obj);
  });
  drop.forEach((obj) => obj.removeFromParent());
  const clip =
    THREE.AnimationClip.findByName(gltf.animations, "Unarmed_Idle") ||
    THREE.AnimationClip.findByName(gltf.animations, "Idle");
  let mixer = null;
  if (clip) {
    mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(clip).play();
    charMixers.push(mixer);
  }
  return { model, mixer };
}

/** Role tint as a flat Lambert color. The adventurer atlas has black bands that read as a black prop when multiplied. */
function tintChar(model, hex) {
  solidColor(model, hex);
}

/** World AABB. Skinned verts use the current pose; static meshes (hat, cape) use their bone matrix. */
function posedBox(root) {
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.visible || !obj.geometry) return;
    const pos = obj.geometry.attributes.position;
    if (!pos) return;
    if (obj.isSkinnedMesh) {
      for (let i = 0; i < pos.count; i++) {
        obj.getVertexPosition(i, v);
        v.applyMatrix4(obj.matrixWorld);
        box.expandByPoint(v);
      }
    } else {
      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      box.union(obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld));
    }
  });
  return box;
}

function sitFeet(model, floorY) {
  const box = posedBox(model);
  if (box.isEmpty()) return box;
  model.position.y += floorY - box.min.y;
  return box;
}

/**
 * World Y of the head mesh. The upper tail (hood tip, hair spike) is ignored
 * so a few high verts cannot pretend the skull is clear of the desk.
 * Returns { crown, max, min } where crown is the median.
 */
function headExtent(model) {
  model.updateMatrixWorld(true);
  const ys = [];
  const v = new THREE.Vector3();
  model.traverse((obj) => {
    if (!obj.isMesh || !obj.isSkinnedMesh || !/_Head$/.test(obj.name)) return;
    const pos = obj.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      obj.getVertexPosition(i, v);
      v.applyMatrix4(obj.matrixWorld);
      ys.push(v.y);
    }
  });
  if (!ys.length) return null;
  ys.sort((a, b) => a - b);
  const at = (t) => ys[Math.min(ys.length - 1, Math.floor(t * (ys.length - 1)))];
  return { min: at(0), crown: at(0.5), max: at(1) };
}

/**
 * Stand the character, then scale (feet stay on the floor) until the skull
 * crown is at least deskTopY + HEAD_CLEARANCE. Hat/helmet tips are not the crown.
 */
function placeAdventurer(model, parent, x, z, rotY, mixer, deskTopY) {
  model.scale.setScalar(1);
  model.position.set(x, 0, z);
  model.rotation.set(0, rotY, 0);
  parent.add(model);
  if (mixer) mixer.update(0);
  sitFeet(model, FLOOR_Y);

  const goal = deskTopY + HEAD_CLEARANCE;
  // One shot to the clearance, then a second pass after the feet are re-sat.
  // Identity scale is taller than the desk; the previous hat-tip fit was shorter.
  // Either way this lands the skull crown on deskTop + HEAD_CLEARANCE.
  for (let i = 0; i < 2; i++) {
    if (mixer) mixer.update(0);
    const head = headExtent(model);
    if (!head) break;
    const span = head.crown - FLOOR_Y;
    if (span < 1e-3) break;
    if (Math.abs(head.crown - goal) < 1e-3) break;
    model.scale.multiplyScalar((goal - FLOOR_Y) / span);
    sitFeet(model, FLOOR_Y);
  }
  if (mixer) mixer.update(0);
  const full = sitFeet(model, FLOOR_Y);
  const head = headExtent(model);
  return { full, head, goal };
}

function placeModel(model, parent, x, y, z, scale = 1, rotY = 0) {
  model.scale.setScalar(scale);
  model.position.set(x, y, z);
  model.rotation.y = rotY;
  parent.add(model);
  return model;
}

/** Place with target height; y is floor/surface the model should sit on. */
function placeFit(model, parent, x, y, z, targetH, rotY = 0) {
  model.scale.setScalar(1);
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  fitHeight(model, targetH);
  model.position.set(x, 0, z);
  model.rotation.y = rotY;
  parent.add(model);
  sitOn(model, y);
  return model;
}

function tintModel(model, hex) {
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => {
      if (m.color) m.color.setHex(hex);
      // drop dark atlas maps that read as black after tint
      if (m.map && hex != null) {
        // keep map for textured furniture; chair tint wants solid color
      }
    });
  });
}

/** Force light flat color (no map) — for mouse / dark atlas junk. */
function solidColor(model, hex) {
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const painted = mats.map((m) => new THREE.MeshLambertMaterial({
      color: hex,
      transparent: !!(m && m.transparent),
      opacity: m?.opacity ?? 1,
      side: m?.side ?? THREE.FrontSide,
    }));
    obj.material = painted.length === 1 ? painted[0] : painted;
  });
}

const FLOOR_Y = 0.18;

/** Hand-built light wood bookcase — never black GLTF. */
function lightBookcase(x, z, rotY = 0, H = 2.05, W = 1.15, D = 0.42) {
  const g = new THREE.Group();
  const wood = 0xe8d4b8;
  const ivory = 0xfff8ec;
  rbox(W, H, D, wood, 0, FLOOR_Y + H / 2, 0, g, 0.04);
  rbox(W - 0.06, H - 0.08, 0.04, ivory, 0, FLOOR_Y + H / 2, -D / 2 + 0.03, g, 0.02);
  const shelves = 4;
  for (let i = 0; i < shelves; i++) {
    const sy = FLOOR_Y + 0.28 + i * ((H - 0.4) / Math.max(shelves - 1, 1));
    rbox(W - 0.1, 0.05, D - 0.08, ivory, 0, sy, 0.02, g, 0.02);
    colorfulBooksOnShelf(g, 0, sy + 0.02, D * 0.1, 7 - (i % 2));
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
  return g;
}

/** Tiny bright potted plant (hand-built) — no black GLTF blobs. */
function tinyPot(parent, x, y, z, leaf = 0x5a9a3a, scale = 1) {
  const g = new THREE.Group();
  cyl(0.09 * scale, 0.07 * scale, 0.12 * scale, 0xfff8ec, 0, 0.06 * scale, 0, g, 12);
  cyl(0.08 * scale, 0.08 * scale, 0.03 * scale, 0xe8dcc8, 0, 0.12 * scale, 0, g, 12);
  sphere(0.11 * scale, leaf, 0, 0.22 * scale, 0, g, 1.1);
  sphere(0.07 * scale, 0x6bcb77, 0.06 * scale, 0.26 * scale, 0.04 * scale, g);
  sphere(0.06 * scale, leaf, -0.05 * scale, 0.24 * scale, -0.03 * scale, g);
  g.position.set(x, y, z);
  parent.add(g);
  return g;
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

// —— Room shell (22 × 18 footprint) ——
const ROOM_W = 22;
const ROOM_D = 18;
const HALF_W = ROOM_W / 2;
const HALF_D = ROOM_D / 2;
const WALL_T = 0.35;
const BACK_Z = -(HALF_D - 0.15); // wall center
const SIDE_X = HALF_W - 0.1;
const HUG_Z = BACK_Z + 0.32; // props just inside the back wall

const floorMap = woodFloorTex();
floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
floorMap.repeat.set(5.5, 7.7);
const floor = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.35, ROOM_D), toon(0xffffff, floorMap));
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const wMat = toon(0xffffff, wallTex());
const back = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 5.2, WALL_T), wMat);
back.position.set(0, 2.6, BACK_Z);
back.receiveShadow = true;
scene.add(back);
const left = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, 5.2, ROOM_D), wMat);
left.position.set(-SIDE_X, 2.6, 0);
scene.add(left);
const right = left.clone();
right.position.x = SIDE_X;
scene.add(right);

rbox(ROOM_W, 0.28, 0.18, 0xc4a574, 0, 0.32, BACK_Z + 0.2, scene, 0.04);
rbox(0.18, 0.28, ROOM_D, 0xc4a574, -SIDE_X + 0.2, 0.32, 0, scene, 0.04);
rbox(0.18, 0.28, ROOM_D, 0xc4a574, SIDE_X - 0.2, 0.32, 0, scene, 0.04);

// Center rug, diameter 7
const RUG_R = 3.5;
const rugOuter = new THREE.Mesh(new THREE.CylinderGeometry(RUG_R, RUG_R, 0.05, 48), toon(0xc89060));
rugOuter.position.set(0, 0.2, 0);
rugOuter.receiveShadow = true;
scene.add(rugOuter);
const rug = new THREE.Mesh(new THREE.CylinderGeometry(RUG_R - 0.28, RUG_R - 0.28, 0.06, 48), toon(0xf0c9a0));
rug.position.set(0, 0.225, 0);
rug.receiveShadow = true;
scene.add(rug);
const rugIn = new THREE.Mesh(new THREE.CylinderGeometry(RUG_R - 1.15, RUG_R - 1.15, 0.065, 48), toon(0xffe8d0));
rugIn.position.set(0, 0.24, 0);
scene.add(rugIn);
// softer outer ring (beige ACNH)
rugOuter.material = toon(0xd4a574);
rug.material = toon(0xf5d4b0);

// Windows + lace curtains on the wider back wall
const cTex = curtainTex();
function curtainPanel(x, z, w = 0.95, h = 2.7) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshLambertMaterial({
      map: cTex,
      color: 0xfff8ec,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  m.position.set(x, 3.05, z);
  scene.add(m);
  cyl(0.04, 0.04, 0.06, 0xc4a574, x, 4.42, z, scene, 10);
  return m;
}
function backWindow(cx, W = 4.8) {
  const z = BACK_Z;
  rbox(W, 3.0, 0.18, 0xfff8ec, cx, 3.1, z + 0.23, scene, 0.06);
  rbox(W + 0.1, 0.12, 0.12, 0xc4a574, cx, 4.55, z + 0.35, scene, 0.03);
  rbox(W + 0.1, 0.12, 0.12, 0xc4a574, cx, 1.65, z + 0.35, scene, 0.03);
  rbox(0.12, 2.9, 0.12, 0xc4a574, cx - W / 2 - 0.05, 3.1, z + 0.35, scene, 0.03);
  rbox(0.12, 2.9, 0.12, 0xc4a574, cx + W / 2 + 0.05, 3.1, z + 0.35, scene, 0.03);
  rbox(0.1, 2.6, 0.08, 0xc4a574, cx, 3.1, z + 0.35, scene, 0.02);
  rbox(W - 0.5, 0.1, 0.08, 0xc4a574, cx, 3.1, z + 0.35, scene, 0.02);
  const skyPane = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.55, 2.5),
    new THREE.MeshBasicMaterial({ map: daySkyTex() })
  );
  skyPane.position.set(cx, 3.1, z + 0.37);
  scene.add(skyPane);
  rbox(W - 0.15, 0.1, 0.28, 0xc4a574, cx, 1.6, z + 0.45, scene, 0.04);
  curtainPanel(cx - W / 2 + 0.55, z + 0.43);
  curtainPanel(cx + W / 2 - 0.55, z + 0.43);
  rbox(W + 0.25, 0.06, 0.06, 0xc4a574, cx, 4.45, z + 0.43, scene, 0.02);
}
backWindow(-6.4);
backWindow(2.6, 4.4);

// Left + right side windows (ACNH density — big daylight)
function sideWindow(wallX, zCenter, facing) {
  const depth = facing > 0 ? wallX - 0.12 : wallX + 0.12;
  const paneZ = zCenter;
  rbox(0.18, 2.6, 3.2, 0xfff8ec, wallX * 0.98, 3.0, paneZ, scene, 0.05);
  rbox(0.12, 0.1, 3.3, 0xc4a574, depth, 4.25, paneZ, scene, 0.03);
  rbox(0.12, 0.1, 3.3, 0xc4a574, depth, 1.75, paneZ, scene, 0.03);
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 2.2),
    new THREE.MeshBasicMaterial({ map: daySkyTex(), side: THREE.DoubleSide })
  );
  sky.position.set(depth, 3.0, paneZ);
  sky.rotation.y = facing > 0 ? -Math.PI / 2 : Math.PI / 2;
  scene.add(sky);
  // lace curtains pulled to edges
  const cL = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 2.4),
    new THREE.MeshLambertMaterial({
      map: cTex,
      color: 0xfff8ec,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  cL.position.set(depth + facing * 0.02, 2.95, paneZ - 1.1);
  cL.rotation.y = facing > 0 ? -Math.PI / 2 : Math.PI / 2;
  scene.add(cL);
  const cR = cL.clone();
  cR.position.z = paneZ + 1.1;
  scene.add(cR);
}
sideWindow(-(SIDE_X - 0.15), -2.2, -1);
sideWindow(SIDE_X - 0.15, 1.4, 1);

// Wall clock (larger / clearer) — on the back wall, clear of the windows
const clockBody = cyl(0.48, 0.48, 0.12, 0xc4a574, 6.6, 4.05, HUG_Z, scene, 24);
clockBody.rotation.x = Math.PI / 2;
const clockFace = new THREE.Mesh(
  new THREE.CircleGeometry(0.4, 32),
  new THREE.MeshBasicMaterial({ map: clockFaceTex() })
);
clockFace.position.set(6.6, 4.05, HUG_Z + 0.09);
scene.add(clockFace);

// Shared wall preview screen, right side of the back wall
rbox(1.7, 1.05, 0.08, 0x3a4050, 8.8, 3.5, HUG_Z, scene, 0.04);
const wallPreview = new THREE.Mesh(
  new THREE.PlaneGeometry(1.5, 0.88),
  new THREE.MeshBasicMaterial({ map: previewScreenTex(), toneMapped: false })
);
wallPreview.position.set(8.8, 3.5, HUG_Z + 0.07);
scene.add(wallPreview);
rbox(0.15, 0.08, 0.08, 0x9b5cff, 8.8, 2.9, HUG_Z + 0.05, scene, 0.02);

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
  g.position.set(x, y, HUG_Z);
  scene.add(g);
}
batHang(5.7, 4.5);
batHang(6.05, 4.25);

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
standingWhiteboard(-2.2, BACK_Z + 1.25, 0);

function waterCooler(x, z) {
  const g = new THREE.Group();
  rbox(0.58, 1.1, 0.52, 0xf5f2ea, 0, 0.72, 0, g, 0.1);
  rbox(0.42, 0.38, 0.05, 0xe8e4dc, 0, 0.58, 0.28, g, 0.04);
  cyl(0.05, 0.05, 0.04, 0xff8a1f, -0.1, 0.72, 0.3, g, 10);
  cyl(0.05, 0.05, 0.04, 0x5b8def, 0.1, 0.72, 0.3, g, 10);
  const jug = cyl(0.24, 0.22, 0.58, 0x6ec8f0, 0, 1.55, 0, g, 20);
  jug.material = new THREE.MeshLambertMaterial({ color: 0x6ec8f0, transparent: true, opacity: 0.88 });
  cyl(0.09, 0.11, 0.12, 0xa0dcf5, 0, 1.88, 0, g, 12);
  g.position.set(x, 0, z);
  scene.add(g);
}
waterCooler(7.3, BACK_Z + 1.05);

function pumpkin(x, z, s = 1) {
  sphere(0.32 * s, 0xff8b3d, x, 0.35 * s, z, scene, 0.85);
  rbox(0.08 * s, 0.14 * s, 0.08 * s, 0x5a9a3a, x, 0.58 * s, z, scene, 0.02);
}
pumpkin(-9.4, -7.6, 0.9);
pumpkin(9.2, 6.4, 0.65);

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
function deskCup(g, x, y, z, color = 0xfff8ec) {
  cyl(0.07, 0.06, 0.12, color, x, y, z, g, 12);
}
function paperStack(g, x, y, z) {
  rbox(0.28, 0.015, 0.22, 0xfff8ec, x, y, z, g, 0.01);
  rbox(0.26, 0.015, 0.2, 0xf0e8d8, x + 0.015, y + 0.018, z + 0.008, g, 0.01);
  rbox(0.25, 0.015, 0.19, 0xfff8ec, x - 0.008, y + 0.036, z - 0.008, g, 0.01);
}
function bookEnds(g, x, y, z) {
  rbox(0.06, 0.22, 0.16, 0xc4a574, x - 0.22, y + 0.11, z, g, 0.02);
  rbox(0.06, 0.22, 0.16, 0xc4a574, x + 0.22, y + 0.11, z, g, 0.02);
  rbox(0.12, 0.18, 0.14, 0x5b8def, x - 0.1, y + 0.09, z, g, 0.02);
  rbox(0.1, 0.2, 0.14, 0xf78fb3, x + 0.02, y + 0.1, z, g, 0.02);
  rbox(0.11, 0.16, 0.14, 0x6bcb77, x + 0.12, y + 0.08, z, g, 0.02);
}
/** iMac-style all-in-one with grass wallpaper */
function imac(g, x, y, z, screenMap = null, scale = 1) {
  const map = screenMap || grassDesktopTex();
  const sw = 0.72 * scale;
  const sh = 0.48 * scale;
  // silver chin + body
  rbox(sw + 0.06, sh + 0.1, 0.06, 0xe8e4dc, x, y + sh * 0.5, z, g, 0.03);
  addScreenPlane(g, map, x, y + sh * 0.52, z + 0.035, sw * 0.92, sh * 0.82);
  // chin bar
  rbox(sw * 0.35, 0.035, 0.04, 0xd0ccc4, x, y + 0.04, z + 0.02, g, 0.01);
  // stand
  rbox(0.12 * scale, 0.22 * scale, 0.06, 0xd8d4cc, x, y - 0.02, z - 0.02, g, 0.02);
  rbox(0.28 * scale, 0.04, 0.16 * scale, 0xd0ccc4, x, y - 0.12 * scale, z, g, 0.02);
}
function photocopier(x, z, rotY = 0) {
  const g = new THREE.Group();
  // desk-prop scale — ivory / light grey only
  rbox(0.42, 0.32, 0.36, 0xf7f4ee, 0, 0.3, 0, g, 0.05);
  rbox(0.36, 0.045, 0.3, 0xe8e4dc, 0, 0.48, 0, g, 0.02);
  rbox(0.16, 0.03, 0.2, 0xb0b4bc, -0.08, 0.52, 0.03, g, 0.015);
  rbox(0.1, 0.025, 0.09, 0xc8ccd4, 0.12, 0.51, 0.06, g, 0.015);
  rbox(0.24, 0.02, 0.14, 0xfff8ec, 0, 0.45, 0.2, g, 0.01);
  cyl(0.02, 0.02, 0.025, 0x5b8def, 0.14, 0.55, -0.08, g, 8);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
  return g;
}
function hangingIvy(x, y, z, w = 0.9) {
  const g = new THREE.Group();
  rbox(w, 0.06, 0.06, 0xc4a574, 0, 0, 0, g, 0.02);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 + (i % 3) * 0.02, 8, 8),
      toon(i % 2 === 0 ? 0x5a9a3a : 0x6bcb77)
    );
    leaf.position.set(-w * 0.4 + i * (w / 6), -0.12 - (i % 3) * 0.1, 0.04);
    leaf.scale.set(1.2, 0.55, 0.8);
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.position.set(x, y, z);
  scene.add(g);
  return g;
}
function colorfulBooksOnShelf(parent, x, y, z, count = 6) {
  const hues = [0xff8a1f, 0x5b8def, 0xf78fb3, 0x6bcb77, 0x9b5cff, 0xffe066, 0xe07050, 0x70c8e0];
  for (let i = 0; i < count; i++) {
    const h = 0.18 + (i % 3) * 0.045;
    rbox(0.055, h, 0.13, hues[i % hues.length], x + i * 0.075 - count * 0.035, y + h * 0.5, z, parent, 0.01);
  }
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

async function deskSet(id, x, z, label, rotY = 0) {
  const p = people[id];
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;

  // Desk: light wood top; legs on floor (~0.18); surface ~0.92
  const TOP_Y = 0.92;
  const desk = await loadKay("table_medium_long");
  placeFit(desk, g, 0, FLOOR_Y, 0, TOP_Y - FLOOR_Y, 0); // height ≈ 0.74 → top @ 0.92
  desk.updateMatrixWorld(true);
  const deskBox = new THREE.Box3().setFromObject(desk);
  const topY = deskBox.max.y - g.position.y; // local surface Y
  // ivory drawer fronts under the top
  const drawerY = FLOOR_Y + (topY - FLOOR_Y) * 0.45;
  rbox(0.5, 0.15, 0.04, 0xfff8ec, -0.32, drawerY, 0.38, g, 0.03);
  rbox(0.5, 0.15, 0.04, 0xfff8ec, 0.32, drawerY, 0.38, g, 0.03);
  cyl(0.025, 0.025, 0.035, 0xc4a574, -0.32, drawerY, 0.41, g, 8);
  cyl(0.025, 0.025, 0.035, 0xc4a574, 0.32, drawerY, 0.41, g, 8);

  // Chair height ≈ 0.9 × desk height (back near desk top, not towering)
  const chair = await loadKay("chair_A");
  solidColor(chair, p.color);
  placeFit(chair, g, 0, FLOOR_Y, 1.1, (topY - FLOOR_Y) * 0.92, Math.PI);

  // Shared per-desk density: lamp, papers, mug, keyboard, mini pumpkin
  const lamp = await loadKay("lamp_table");
  const lampX = id === "write" || id === "design" ? 0.58 : -0.62;
  placeFit(lamp, g, lampX, topY, -0.26, 0.42, 0);
  const lampL = new THREE.PointLight(0xffe8c0, 0.35, 2.4);
  lampL.position.set(lampX, topY + 0.35, -0.12);
  g.add(lampL);

  // smaller paper stacks
  paperStack(g, id === "grok" ? 0.32 : -0.12, topY + 0.015, 0.26);
  bookEnds(g, id === "ai" ? 0.62 : -0.5, topY, -0.05);
  deskCup(g, id === "design" ? -0.68 : 0.68, topY + 0.06, 0.32, p.color);

  // Keyboard width ≈ 0.7 × iMac screen (sw≈0.72 → kb≈0.5)
  const kb = await loadKen("computerKeyboard");
  kb.scale.setScalar(1);
  kb.position.set(0, 0, 0);
  fitWidth(kb, 0.5);
  g.add(kb);
  kb.position.set(0.02, 0, 0.18);
  sitOn(kb, topY);

  // Mouse: light grey/white — never pure black
  // hand-built light grey mouse — never Kenney black
  const mouse = new THREE.Group();
  const mouseBody = new THREE.Mesh(
    new RoundedBoxGeometry(0.09, 0.035, 0.13, 2, 0.02),
    new THREE.MeshLambertMaterial({ color: 0xece8e0 })
  );
  mouseBody.castShadow = true;
  mouse.add(mouseBody);
  const mouseBtn = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.01, 0.04),
    new THREE.MeshLambertMaterial({ color: 0xd0ccc4 })
  );
  mouseBtn.position.set(0, 0.02, -0.01);
  mouse.add(mouseBtn);
  mouse.position.set(0.42, topY + 0.02, 0.2);
  g.add(mouse);

  if (id === "ai") {
    imac(g, -0.22, topY + 0.16, -0.3, ideScreenTex(), 0.95);
    imac(g, 0.42, topY + 0.16, -0.3, grassDesktopTex(), 0.85);
    tinyPot(g, -0.72, topY, 0.18, 0x5a9a3a, 0.85);
  } else if (id === "write") {
    imac(g, 0.02, topY + 0.16, -0.3, docScreenTex(), 0.95);
    const books = await loadKay("book_set");
    placeFit(books, g, -0.5, topY, 0.05, 0.22, 0.25);
    tinyPot(g, -0.7, topY, -0.18, 0x6bcb77, 0.8);
  } else if (id === "design") {
    // drawing tablet — deep blue-grey, not dead black
    rbox(0.72, 0.035, 0.5, 0x3a4558, 0.02, topY + 0.025, 0.06, g, 0.04);
    rbox(0.76, 0.02, 0.54, 0x4a5568, 0.02, topY + 0.012, 0.06, g, 0.03); // bezel
    addScreenPlane(g, designScreenTex(), 0.02, topY + 0.05, 0.06, 0.6, 0.4);
    colorFan(g, -0.5, topY + 0.035, -0.18);
    imac(g, 0.52, topY + 0.14, -0.32, grassDesktopTex(), 0.7);
    tinyPot(g, -0.65, topY, -0.22, 0x4a8a3a, 0.9);
  } else if (id === "grok") {
    imac(g, 0.18, topY + 0.16, -0.3, checklistBoardTex(), 0.9);
    const mini = new THREE.Mesh(
      new RoundedBoxGeometry(0.4, 0.5, 0.045, 2, 0.03),
      toon(0xffffff, checklistBoardTex())
    );
    mini.position.set(-0.5, topY + 0.3, -0.22);
    mini.castShadow = true;
    g.add(mini);
    walkie(g, 0.5, topY + 0.14, 0.12);
    tinyPot(g, -0.72, topY, 0.2, 0x5a9a3a, 0.85);
  }

  // mini pumpkin on every desk
  sphere(0.1, 0xff8b3d, 0.82, topY + 0.09, 0.42, g, 0.85);
  rbox(0.035, 0.05, 0.035, 0x5a9a3a, 0.82, topY + 0.18, 0.42, g, 0.01);

  const lampCol = p.status === "busy" ? 0xff8a1f : 0x6bcb77;
  const bulb = sphere(0.1, lampCol, -0.82, 1.48, -0.35, g);
  bulb.material.emissive = new THREE.Color(lampCol);
  bulb.material.emissiveIntensity = 0.7;
  const light = new THREE.PointLight(lampCol, 0.35, 3.2);
  light.position.set(-0.82, 1.48, -0.35);
  g.add(light);

  // Stand on the floor just in front of the chair (chair is at z=1.1), facing the desk.
  const { model: vill, mixer } = await loadAdventurer(ADVENTURER[id]);
  tintChar(vill, p.color);
  const fit = placeAdventurer(vill, g, 0, 1.0, Math.PI, mixer, topY);
  floaters.push({ group: g, vill, busy: p.status === "busy", bulb });

  const plate = nameplate(label, p.color);
  plate.position.set(0, Math.max(2.25, fit.full.max.y + 0.28), 0.3);
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
  // picture frames — wood frame only; light art plane covers dark atlas phase
  async function wallFrame(name, x, y, z, targetH, artHue, artW, artH) {
    const f = await loadKay(name);
    // wood frame color; drop dark atlas so center never reads black
    solidColor(f, 0xc4a574);
    placeFit(f, scene, x, y, z, targetH, 0);
    f.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(f);
    const c = new THREE.Vector3();
    box.getCenter(c);
    // light "photo paper" inset — covers any leftover dark phase
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(artW * 1.05, artH * 1.05),
      new THREE.MeshBasicMaterial({ color: 0xfff8ec })
    );
    paper.position.set(x, c.y, HUG_Z + 0.05);
    scene.add(paper);
    addScreenPlane(scene, frameArtTex(artHue), x, c.y, HUG_Z + 0.07, artW, artH);
  }
  // Frames sit on the back wall, between and beside the windows — not over the rug.
  await wallFrame("pictureframe_medium", -9.5, 3.15, HUG_Z, 0.95, 30, 0.48, 0.6);
  await wallFrame("pictureframe_small_A", -8.6, 2.45, HUG_Z, 0.55, 200, 0.3, 0.36);
  await wallFrame("pictureframe_small_A", -1.5, 3.35, HUG_Z, 0.5, 50, 0.28, 0.32);
  await wallFrame("pictureframe_large_A", 5.15, 2.7, HUG_Z, 1.15, 280, 0.58, 0.72);
  await wallFrame("pictureframe_medium", -3.15, 2.35, HUG_Z, 0.8, 160, 0.4, 0.5);

  // hanging ivy over window sides + side walls
  hangingIvy(-8.6, 4.55, HUG_Z + 0.15, 0.7);
  hangingIvy(0.5, 4.55, HUG_Z + 0.15, 0.7);
  hangingIvy(4.6, 4.55, HUG_Z + 0.15, 0.7);
  hangingIvy(-SIDE_X + 0.35, 4.2, -3.2, 1.1);
  hangingIvy(SIDE_X - 0.35, 4.2, 2.2, 0.9);

  // window shelf under the right-hand back window
  rbox(1.1, 0.08, 0.28, 0xfff8ec, 2.6, 2.35, HUG_Z + 0.05, scene, 0.03);
  rbox(1.14, 0.04, 0.06, 0xc4a574, 2.6, 2.3, HUG_Z + 0.17, scene, 0.02);
  tinyPot(scene, 2.3, 2.39, HUG_Z + 0.1, 0x5a9a3a, 0.85);
  tinyPot(scene, 2.7, 2.39, HUG_Z + 0.1, 0x6bcb77, 0.7);
  tinyPot(scene, 3.0, 2.39, HUG_Z + 0.1, 0x4a8a3a, 0.75);

  // Light hand-built bookcases along the left wall
  lightBookcase(-SIDE_X + 0.48, -6.5, -Math.PI / 2, 2.05, 1.2, 0.45);
  lightBookcase(-SIDE_X + 0.48, -4.4, -Math.PI / 2, 2.05, 1.05, 0.42);
  tinyPot(scene, -SIDE_X + 0.45, 2.25, -6.35, 0x5a9a3a, 0.9);
  tinyPot(scene, -SIDE_X + 0.45, 2.25, -4.25, 0x6bcb77, 0.8);

  // right: low ivory cabinet hugging the wall
  rbox(0.95, 1.05, 0.5, 0xe8d4b8, SIDE_X - 0.72, FLOOR_Y + 0.525, -6.8, scene, 0.06);
  rbox(0.88, 0.04, 0.44, 0xfff8ec, SIDE_X - 0.72, FLOOR_Y + 0.55, -6.8, scene, 0.02);
  rbox(0.88, 0.04, 0.44, 0xfff8ec, SIDE_X - 0.72, FLOOR_Y + 0.95, -6.8, scene, 0.02);
  colorfulBooksOnShelf(scene, SIDE_X - 0.75, FLOOR_Y + 1.0, -6.65, 6);
  tinyPot(scene, SIDE_X - 0.72, FLOOR_Y + 1.1, -6.8, 0x5a9a3a, 0.85);
  rbox(0.7, 0.07, 0.24, 0xfff8ec, SIDE_X - 0.4, 2.2, -5.2, scene, 0.03);
  tinyPot(scene, SIDE_X - 0.4, 2.24, -5.2, 0x6bcb77, 0.7);

  // standing lamps — ivory paint, height ≤ ~1.85, in the side aisles
  try {
    const lamp = await loadKay("lamp_standing");
    solidColor(lamp, 0xfff0e0);
    placeFit(lamp, scene, -SIDE_X + 0.55, FLOOR_Y, 5.4, 1.85, 0);
  } catch (_) {}
  try {
    const lamp2 = await loadKay("lamp_standing");
    solidColor(lamp2, 0xfff0e0);
    placeFit(lamp2, scene, SIDE_X - 0.5, FLOOR_Y, 4.2, 1.8, Math.PI);
  } catch (_) {}

  // Corner plants: ONLY tiny hand-built — no pottedPlant / big cactus
  tinyPot(scene, -SIDE_X + 0.55, FLOOR_Y, 7.2, 0x5a9a3a, 1.6);
  tinyPot(scene, -SIDE_X + 1.05, FLOOR_Y, 7.55, 0x6bcb77, 1.2);
  tinyPot(scene, SIDE_X - 0.55, FLOOR_Y, 6.6, 0x4a8a3a, 1.5);
  tinyPot(scene, SIDE_X - 0.7, FLOOR_Y, -2.4, 0x5a9a3a, 1.35);

  // side table along the left wall
  rbox(0.7, 0.55, 0.5, 0xe8d4b8, -SIDE_X + 0.65, FLOOR_Y + 0.275, 1.6, scene, 0.06);
  rbox(0.72, 0.04, 0.52, 0xfff8ec, -SIDE_X + 0.65, FLOOR_Y + 0.56, 1.6, scene, 0.02);
  colorfulBooksOnShelf(scene, -SIDE_X + 0.65, FLOOR_Y + 0.58, 1.65, 4);
  deskCup(scene, -SIDE_X + 0.85, FLOOR_Y + 0.64, 1.75, 0xff8a1f);
}
function openPerson(id) {
  const p = people[id];
  if (!p) return;
  els.name.textContent = p.name;
  if (els.role) els.role.textContent = p.role;
  els.motto.textContent = "「" + p.motto + "」";
  els.task.textContent = p.task;
  els.badge.textContent = p.status === "busy" ? "忙緊" : "得閒";
  els.badge.className = "badge " + (p.status === "busy" ? "busy" : "idle");
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
  const dt = clock.getDelta();
  const t = clock.elapsedTime;
  charMixers.forEach((m) => m.update(dt));
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
    // Desk center sits 1.2 outside the rug (radius 3.5). Front is +Z.
    // Chairs stay on the outer side: front desks face -Z, back desks are turned around.
    const deskD = (RUG_R + 1.2) * Math.SQRT1_2;
    await deskSet("ai", -deskD, deskD, "開發", 0);
    await deskSet("design", deskD, deskD, "美術", 0);
    await deskSet("write", -deskD, -deskD, "策劃", Math.PI);
    await deskSet("grok", deskD, -deskD, "隊長", Math.PI);
    // photocopiers along the side walls, clear of the desks
    photocopier(-9.4, 0.15, 0.4);
    photocopier(9.5, -0.3, -0.45);
    // low table against the right wall — rug center stays clear
    try {
      const low = await loadKay("table_low");
      placeFit(low, scene, SIDE_X - 1.15, 0.18, 1.1, 0.45, -0.4);
      const books = await loadKay("book_set");
      placeFit(books, scene, SIDE_X - 1.2, 0.55, 1.05, 0.2, 0.2);
      deskCup(scene, SIDE_X - 0.95, 0.62, 1.25, 0xff8a1f);
    } catch (_) {}
    pumpkin(-8.6, 4.2, 0.7);
    pumpkin(8.4, -6.6, 0.55);
  } catch (err) {
    console.error("Asset load failed", err);
  }
})();
