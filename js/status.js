/**
 * Gate A status client. Pure helpers are unit-tested; startStatusFeed is browser-only.
 * Contract row: { id, state, line, updatedAt }.
 */

export const BOT_IDS = ["grok", "ai", "design", "write"];

export const BOT_LABEL = {
  grok: "隊長",
  write: "策劃",
  design: "設計",
  ai: "開發",
};

export const STATE_LABEL = {
  working: "做緊",
  waiting: "等緊",
  done: "搞掂",
  error: "出錯",
  idle: "得閒",
};

/** working with no update for this long is treated as stale. */
export const STALE_WORKING_MS = 10 * 60 * 1000;

/** No update at all for this long surfaces a light heartbeat warning. */
export const SILENT_MS = 45 * 60 * 1000;

export function resolveStatusApi(href, configValue = "") {
  const url = new URL(href, "http://localhost");
  const fromQuery = url.searchParams.get("api");
  const raw = (fromQuery && fromQuery.trim()) || (configValue && String(configValue).trim()) || "";
  if (!raw) return "";
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return "";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
  return parsed.origin + parsed.pathname.replace(/\/$/, "");
}

export function goalForState(state) {
  if (state === "working" || state === "waiting" || state === "error") return "desk";
  if (state === "idle" || state === "done") return "idle";
  return null;
}

export function decorateStatus(row, serverNowMs, windows = {}) {
  const staleMs = windows.staleAfterMs ?? STALE_WORKING_MS;
  const silentMs = windows.silentAfterMs ?? SILENT_MS;
  const updated = Date.parse(row.updatedAt);
  const ageMs = Number.isFinite(updated) ? serverNowMs - updated : Number.POSITIVE_INFINITY;
  return {
    id: row.id,
    state: row.state,
    line: typeof row.line === "string" ? row.line : "",
    updatedAt: row.updatedAt,
    ageMs,
    stale: row.state === "working" && ageMs > staleMs,
    silent: ageMs > silentMs,
  };
}

export function warningLines(views) {
  const lines = [];
  for (const view of views) {
    if (!view) continue;
    const name = BOT_LABEL[view.id] || view.id;
    if (view.silent) lines.push(`${name}超過 45 分鐘冇心跳`);
    else if (view.stale) lines.push(`${name}超過 10 分鐘冇更新`);
  }
  return lines;
}

export function badgeView(view, legacyBusy) {
  if (!view) {
    return { text: legacyBusy ? "忙緊" : "得閒", kind: legacyBusy ? "busy" : "idle" };
  }
  if (view.silent) return { text: "冇心跳", kind: "stale" };
  if (view.stale) return { text: "冇更新", kind: "stale" };
  const kind =
    view.state === "error" ? "error" : view.state === "idle" || view.state === "done" ? "idle" : "busy";
  return { text: STATE_LABEL[view.state] || "—", kind };
}

export function lampFor(view) {
  if (!view) return { color: 0xff8a1f, busy: true };
  if (view.state === "error") return { color: 0xe85d4c, busy: true };
  if (view.state === "working" || view.state === "waiting") {
    return { color: view.stale ? 0xc4a574 : 0xff8a1f, busy: !view.stale };
  }
  return { color: 0x6bcb77, busy: false };
}

/** 2D segment vs axis-aligned box. Used to walk around a desk, not as a navmesh. */
export function segmentHitsAabb(x0, z0, x1, z1, minX, maxX, minZ, maxZ) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dz, dz];
  const q = [x0 - minX, maxX - x0, z0 - minZ, maxZ - z0];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
  }
  return true;
}

export function worldFromLocal(groupX, groupZ, rot, lx, lz) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return [groupX + lx * c + lz * s, groupZ - lx * s + lz * c];
}

export function localFromWorld(groupX, groupZ, rot, wx, wz) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const dx = wx - groupX;
  const dz = wz - groupZ;
  return [dx * c - dz * s, dx * s + dz * c];
}

/** Rug the open desks still ring. Center of the layout is the rug center. */
export const RUG_RADIUS = 3.5;

/** Desk center stays this far outside the rug, same as the open work area today. */
export const RUG_DESK_GAP = 1.2;

/**
 * Clearance is measured with the larger desk box (tabletop plus a margin).
 * Walking uses the tighter tabletop so a chair pose is not inside the solid.
 */
export const DESK_CLEAR_HALF = { hx: 1.2, hz: 0.82 };
export const DESK_SOLID_HALF = { hx: 1.05, hz: 0.7 };

/** Body radius used to inflate solids. A path centerline stays this far off the glass. */
export const AGENT_RADIUS = 0.22;

export const WALK_BOUNDS = { minX: -9.9, maxX: 10.2, minZ: -8.15, maxZ: 8.55 };

/**
 * Northeast glass office. Outer frame is 4.5 (X) by 3.5 (Z), against the
 * +X/+Z corner. The south wall faces the rug and is the one with the door.
 */
export const GLASS_OFFICE = { minX: 6.05, maxX: 10.55, minZ: 5.45, maxZ: 8.95 };

/** Narrow opening in the south glass wall. Outward normal is -Z, toward the rug. */
export const OFFICE_DOOR = { minX: 7.62, maxX: 8.97 };

/** Captain desk inside the office. rot 0 puts the chair on +Z, facing -Z (door and rug). */
export const CAPTAIN_DESK = { x: 8.3, z: 7.2, rot: 0 };

/**
 * Southwest lounge. Two sofa seats and one stool face the rug; the fourth
 * spot is a close pouf still inside the lounge, never back on the rug edge.
 * Yaw 0 looks +Z. Values are turned toward the rug without spinning off the seat.
 */
export const LOUNGE = {
  seats: [
    { id: "sofa-w", x: -8.75, z: -7.52, yaw: 0.28 },
    { id: "sofa-e", x: -7.45, z: -7.52, yaw: 0.42 },
    { id: "stool", x: -9.7, z: -6.32, yaw: 0.9 },
  ],
  overflow: { id: "overflow", x: -6.05, z: -6.48, yaw: 0.78 },
  sofa: { x: -8.1, z: -7.62, w: 3.05, d: 1.15 },
  rug: { x: -8.05, z: -6.85, w: 4.7, d: 2.35 },
};

const GLASS_T = 0.08;
const SEAT_HALF = 0.38;

export function openDeskDistance(rugRadius = RUG_RADIUS) {
  return (rugRadius + RUG_DESK_GAP) * Math.SQRT1_2;
}

export function deskAnchor(id, rugRadius = RUG_RADIUS) {
  const d = openDeskDistance(rugRadius);
  if (id === "ai") return { x: -d, z: d, rot: 0 };
  if (id === "design") return { x: d, z: d, rot: 0 };
  if (id === "write") return { x: -d, z: -d, rot: Math.PI };
  if (id === "grok") return { x: CAPTAIN_DESK.x, z: CAPTAIN_DESK.z, rot: CAPTAIN_DESK.rot };
  return null;
}

/** Where the character stands to work: local (0, 1) in the desk group. */
export function chairWorld(id, rugRadius = RUG_RADIUS) {
  const desk = deskAnchor(id, rugRadius);
  const [x, z] = worldFromLocal(desk.x, desk.z, desk.rot, 0, 1);
  return { x, z };
}

export function loungeSpots() {
  return [...LOUNGE.seats, LOUNGE.overflow];
}

export function yawToward(x, z, tx = 0, tz = 0) {
  return Math.atan2(tx - x, tz - z);
}

export function aabbDistance(a, b) {
  const dx = Math.max(a.minX - b.maxX, b.minX - a.maxX, 0);
  const dz = Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ, 0);
  return Math.hypot(dx, dz);
}

function halfBox(x, z, hx, hz) {
  return { minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz };
}

export function deskClearAabb(id) {
  const d = deskAnchor(id);
  const { hx, hz } = DESK_CLEAR_HALF;
  return halfBox(d.x, d.z, hx, hz);
}

export function glassWallRects() {
  const o = GLASS_OFFICE;
  const door = OFFICE_DOOR;
  const t = GLASS_T;
  return [
    { minX: o.minX, maxX: o.maxX, minZ: o.maxZ - t, maxZ: o.maxZ + t, kind: "glass" },
    { minX: o.minX - t, maxX: o.minX + t, minZ: o.minZ, maxZ: o.maxZ, kind: "glass" },
    { minX: o.maxX - t, maxX: o.maxX + t, minZ: o.minZ, maxZ: o.maxZ, kind: "glass" },
    { minX: o.minX, maxX: door.minX, minZ: o.minZ - t, maxZ: o.minZ + t, kind: "glass" },
    { minX: door.maxX, maxX: o.maxX, minZ: o.minZ - t, maxZ: o.minZ + t, kind: "glass" },
  ];
}

function sofaBackRect() {
  const s = LOUNGE.sofa;
  return {
    minX: s.x - s.w / 2,
    maxX: s.x + s.w / 2,
    minZ: s.z - s.d / 2,
    maxZ: s.z - s.d / 2 + 0.2,
    kind: "sofa",
  };
}

function loungeFootprints() {
  const s = LOUNGE.sofa;
  const sofa = {
    minX: s.x - s.w / 2,
    maxX: s.x + s.w / 2,
    minZ: s.z - s.d / 2,
    maxZ: s.z + s.d / 2,
  };
  const seats = loungeSpots()
    .filter((spot) => spot.id === "stool" || spot.id === "overflow")
    .map((spot) => halfBox(spot.x, spot.z, 0.42, 0.42));
  const rug = halfBox(LOUNGE.rug.x, LOUNGE.rug.z, LOUNGE.rug.w / 2, LOUNGE.rug.d / 2);
  return [sofa, ...seats, rug];
}

export function loungeClearance(deskId) {
  const desk = deskClearAabb(deskId);
  let gap = Infinity;
  for (const foot of loungeFootprints()) gap = Math.min(gap, aabbDistance(desk, foot));
  return gap;
}

/** Props that sit in the walkable floor and should not be crossed. */
function furnitureRects() {
  return [
    { minX: 9.65, maxX: 10.7, minZ: -7.15, maxZ: -6.45, kind: "cabinet" },
    { minX: -9.7, maxX: -9.1, minZ: -0.15, maxZ: 0.45, kind: "copier" },
    { minX: 9.2, maxX: 9.85, minZ: -0.6, maxZ: 0.05, kind: "copier" },
    { minX: 9.25, maxX: 10.45, minZ: 0.65, maxZ: 1.6, kind: "table" },
    { minX: -3.15, maxX: -1.25, minZ: -7.95, maxZ: -7.2, kind: "board" },
    { minX: 6.95, maxX: 7.7, minZ: -8.2, maxZ: -7.4, kind: "cooler" },
  ];
}

export function solidBlockers() {
  const desks = BOT_IDS.map((id) => {
    const d = deskAnchor(id);
    const { hx, hz } = DESK_SOLID_HALF;
    return { ...halfBox(d.x, d.z, hx, hz), kind: "desk" };
  });
  const seats = loungeSpots().map((spot) => ({
    ...halfBox(spot.x, spot.z, SEAT_HALF, SEAT_HALF),
    kind: "seat",
  }));
  return [...desks, ...glassWallRects(), sofaBackRect(), ...seats, ...furnitureRects()];
}

function containsPoint(box, x, z) {
  return x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ;
}

function inflate(box, r) {
  return {
    minX: box.minX - r,
    maxX: box.maxX + r,
    minZ: box.minZ - r,
    maxZ: box.maxZ + r,
  };
}

function segmentHitsAny(x0, z0, x1, z1, boxes) {
  for (const b of boxes) {
    if (segmentHitsAabb(x0, z0, x1, z1, b.minX, b.maxX, b.minZ, b.maxZ)) return true;
  }
  return false;
}

const CELL = 0.25;

/**
 * Walk from (x0, z0) to (x1, z1) without crossing glass, desks, or the sofa.
 * The solid that contains the destination (the seat being sat on) is omitted
 * so the last step can land on the cushion. Returns world waypoints, last one
 * exactly the goal.
 */
function pathIsClear(points, x, z, firstBoxes, restBoxes = firstBoxes) {
  for (let i = 0; i < points.length; i++) {
    const boxes = i === 0 ? firstBoxes : restBoxes;
    if (segmentHitsAny(x, z, points[i].x, points[i].z, boxes)) return false;
    x = points[i].x;
    z = points[i].z;
  }
  return true;
}

export function routeAround(x0, z0, x1, z1, blockers = solidBlockers()) {
  // The seat being sat on contains the start, so the first step may leave it.
  // Every later step still treats that seat as solid, along with glass and desks.
  const boxes = [];
  const occupied = [];
  for (const b of blockers) {
    if (containsPoint(b, x1, z1)) continue;
    const inflated = inflate(b, AGENT_RADIUS);
    if (b.kind === "seat" && containsPoint(b, x0, z0)) occupied.push(inflated);
    else boxes.push(inflated);
  }
  const routeBoxes = occupied.length ? boxes.concat(occupied) : boxes;
  if (!segmentHitsAny(x0, z0, x1, z1, boxes)) return [{ x: x1, z: z1 }];

  const { minX, maxX, minZ, maxZ } = WALK_BOUNDS;
  const cols = Math.floor((maxX - minX) / CELL);
  const rows = Math.floor((maxZ - minZ) / CELL);
  const blocked = new Uint8Array(cols * rows);
  const cx = (c) => minX + (c + 0.5) * CELL;
  const cz = (r) => minZ + (r + 0.5) * CELL;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (routeBoxes.some((b) => containsPoint(b, cx(c), cz(r)))) blocked[r * cols + c] = 1;
    }
  }

  function nearestFree(x, z) {
    let sc = Math.floor((x - minX) / CELL);
    let sr = Math.floor((z - minZ) / CELL);
    if (sc < 0) sc = 0;
    else if (sc >= cols) sc = cols - 1;
    if (sr < 0) sr = 0;
    else if (sr >= rows) sr = rows - 1;
    if (!blocked[sr * cols + sc]) return [sc, sr];
    for (let rad = 1; rad < 14; rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad) continue;
          const c = sc + dc;
          const r = sr + dr;
          if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
          if (!blocked[r * cols + c]) return [c, r];
        }
      }
    }
    return null;
  }

  const neigh = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  function seek(sx, sz) {
    const startCell = nearestFree(sx, sz);
    const goalCell = nearestFree(x1, z1);
    if (!startCell || !goalCell) return null;
    const [c0, r0] = startCell;
    const [c1, r1] = goalCell;
    const startI = r0 * cols + c0;
    const goalI = r1 * cols + c1;
    const open = [startI];
    const gScore = new Float64Array(cols * rows);
    const fScore = new Float64Array(cols * rows);
    gScore.fill(Infinity);
    fScore.fill(Infinity);
    gScore[startI] = 0;
    const came = new Int32Array(cols * rows);
    came.fill(-1);
    const inOpen = new Uint8Array(cols * rows);
    inOpen[startI] = 1;
    const heur = (i) => {
      const c = i % cols;
      const r = (i / cols) | 0;
      return Math.hypot(c - c1, r - r1);
    };
    fScore[startI] = heur(startI);
    let found = false;
    while (open.length) {
      let best = 0;
      for (let i = 1; i < open.length; i++) if (fScore[open[i]] < fScore[open[best]]) best = i;
      const cur = open[best];
      open.splice(best, 1);
      inOpen[cur] = 0;
      if (cur === goalI) {
        found = true;
        break;
      }
      const c = cur % cols;
      const r = (cur / cols) | 0;
      for (const [dc, dr] of neigh) {
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const ni = nr * cols + nc;
        if (blocked[ni]) continue;
        if (dc !== 0 && dr !== 0 && (blocked[r * cols + nc] || blocked[nr * cols + c])) continue;
        const step = dc !== 0 && dr !== 0 ? 1.4142 : 1;
        const tent = gScore[cur] + step;
        if (tent < gScore[ni]) {
          came[ni] = cur;
          gScore[ni] = tent;
          fScore[ni] = tent + heur(ni);
          if (!inOpen[ni]) {
            open.push(ni);
            inOpen[ni] = 1;
          }
        }
      }
    }
    if (!found) return null;
    const rev = [];
    let i = goalI;
    while (i >= 0) {
      const c = i % cols;
      const r = (i / cols) | 0;
      rev.push({ x: cx(c), z: cz(r) });
      if (i === startI) break;
      i = came[i];
    }
    rev.reverse();
    const raw = [{ x: sx, z: sz }, ...rev, { x: x1, z: z1 }];
    const out = [];
    let anchor = 0;
    while (anchor < raw.length - 1) {
      let far = -1;
      for (let j = raw.length - 1; j > anchor; j--) {
        if (!segmentHitsAny(raw[anchor].x, raw[anchor].z, raw[j].x, raw[j].z, routeBoxes)) {
          far = j;
          break;
        }
      }
      if (far < 0) return null;
      out.push(raw[far]);
      anchor = far;
    }
    return out;
  }

  // Step off the chair before turning the corner, so the first leg does not clip the desk.
  const starts = [{ x: x0, z: z0 }];
  for (const dist of [0.42, 0.75]) {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const x = x0 + Math.sin(a) * dist;
      const z = z0 + Math.cos(a) * dist;
      if (x < minX || x > maxX || z < minZ || z > maxZ) continue;
      if (routeBoxes.some((b) => containsPoint(b, x, z))) continue;
      if (segmentHitsAny(x0, z0, x, z, boxes)) continue;
      starts.push({ x, z });
    }
  }
  for (const start of starts) {
    const path = seek(start.x, start.z);
    if (!path) continue;
    const stitched = start.x === x0 && start.z === z0 ? path : [start, ...path];
    if (pathIsClear(stitched, x0, z0, boxes, routeBoxes)) return stitched;
  }
  return [{ x: x0, z: z0 }];
}

/**
 * Three lounge seats, then one overflow pouf. Previous seats stick so a poll
 * does not shuffle everyone. Overflow is only used once the three seats are full.
 */
export function assignLoungeSeats(idleIds, previous = {}) {
  const slots = loungeSpots().map((s) => s.id);
  const order = [...idleIds].sort((a, b) => BOT_IDS.indexOf(a) - BOT_IDS.indexOf(b));
  const next = {};
  const used = new Set();
  for (const id of order) {
    const prev = previous[id];
    if (prev && slots.includes(prev) && !used.has(prev)) {
      next[id] = prev;
      used.add(prev);
    }
  }
  for (const id of order) {
    if (next[id]) continue;
    const free = slots.find((s) => !used.has(s));
    next[id] = free;
    used.add(free);
  }
  return next;
}

/**
 * Subscribe to the status board. Polling is the reliable path; WebSocket
 * pushes the same snapshot shape as GET /api/status. No base means no motion.
 */
export function startStatusFeed({ apiBase, onUpdate }) {
  const base = (apiBase || "").replace(/\/$/, "");
  if (!base || typeof fetch !== "function") {
    if (typeof console !== "undefined") {
      console.info("虛擬辦公室：未設定狀態 API（加 ?api=https://<worker>）");
    }
    return () => {};
  }

  let closed = false;
  let ws = null;
  let warned = false;
  const timer = setInterval(poll, 5000);
  poll();
  connectWs();

  async function poll() {
    try {
      const res = await fetch(base + "/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      warned = false;
      onUpdate(data);
    } catch {
      if (!warned && typeof console !== "undefined") {
        console.warn("虛擬辦公室：狀態 API 連唔到");
        warned = true;
      }
    }
  }

  function connectWs() {
    if (closed || typeof WebSocket !== "function") return;
    const wsBase = base.replace(/^http/i, "ws");
    try {
      ws = new WebSocket(wsBase + "/api/status/ws");
    } catch {
      return;
    }
    ws.onmessage = (ev) => {
      try {
        onUpdate(JSON.parse(ev.data));
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => {
      ws = null;
      if (!closed) setTimeout(connectWs, 4000);
    };
  }

  return () => {
    closed = true;
    clearInterval(timer);
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
  };
}
