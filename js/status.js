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

function worldFromLocal(groupX, groupZ, rot, lx, lz) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return [groupX + lx * c + lz * s, groupZ - lx * s + lz * c];
}

function localFromWorld(groupX, groupZ, rot, wx, wz) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const dx = wx - groupX;
  const dz = wz - groupZ;
  return [dx * c - dz * s, dx * s + dz * c];
}

function distToAabb(x, z, hx, hz) {
  const dx = Math.max(Math.abs(x) - hx, 0);
  const dz = Math.max(Math.abs(z) - hz, 0);
  return Math.hypot(dx, dz);
}

/**
 * Desk pose stays where the character already stands.
 * Idle pose is on the rug edge, beside the desk, so a straight leg does not
 * cut through the tabletop. One side step is used only when the direct
 * segment would hit the desk.
 */
export function buildSpots({
  groupX,
  groupZ,
  groupRotY,
  charX,
  charZ,
  rugRadius,
  deskHalfX = 1.2,
  deskHalfZ = 0.82,
}) {
  const edge = rugRadius - 0.18;
  let best = null;
  for (const sign of [1, -1]) {
    const sideX = sign * (deskHalfX + 0.5);
    const sideZ = Math.max(charZ, deskHalfZ + 0.36);
    if (segmentHitsAabb(charX, charZ, sideX, sideZ, -deskHalfX, deskHalfX, -deskHalfZ, deskHalfZ)) {
      continue;
    }
    const [swx, swz] = worldFromLocal(groupX, groupZ, groupRotY, sideX, sideZ);
    const base = Math.atan2(swx, swz);
    for (let step = 0; step <= 40; step++) {
      const hop = Math.ceil(step / 2);
      const delta = (step === 0 ? 0 : (step % 2 === 0 ? 1 : -1) * hop) * 0.035;
      if (Math.abs(delta) > 1.05) continue;
      const ang = base + delta;
      const iwx = Math.sin(ang) * edge;
      const iwz = Math.cos(ang) * edge;
      const [ilx, ilz] = localFromWorld(groupX, groupZ, groupRotY, iwx, iwz);
      if (distToAabb(ilx, ilz, deskHalfX, deskHalfZ) < 0.32) continue;
      if (segmentHitsAabb(sideX, sideZ, ilx, ilz, -deskHalfX, deskHalfX, -deskHalfZ, deskHalfZ)) {
        continue;
      }
      const [clx, clz] = localFromWorld(groupX, groupZ, groupRotY, 0, 0);
      const candidate = {
        sideX,
        sideZ,
        idleX: ilx,
        idleZ: ilz,
        idleRot: Math.atan2(clx - ilx, clz - ilz),
        idleWorldX: iwx,
        idleWorldZ: iwz,
        angleDelta: Math.abs(delta),
      };
      if (!best || candidate.angleDelta < best.angleDelta) best = candidate;
      if (candidate.angleDelta === 0) return candidate;
    }
  }
  return best;
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
