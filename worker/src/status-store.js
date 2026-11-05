/** Per-bot status board. Pure logic shared by the Worker and unit tests. */

export const BOT_IDS = ["grok", "ai", "design", "write"];

export const STATES = ["working", "waiting", "done", "error", "idle"];

/** `working` with no update for this long is stale. */
export const STALE_WORKING_MS = 10 * 60 * 1000;

/** Any state with no update for this long is a missed heartbeat. */
export const SILENT_MS = 45 * 60 * 1000;

export const LINE_MAX = 20;

export function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

export function validateStatus(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { status: 400, error: "bad_json" };
  }
  if (!BOT_IDS.includes(input.id)) {
    return { status: 400, error: "bad_id", allowed: BOT_IDS };
  }
  if (!STATES.includes(input.state)) {
    return { status: 400, error: "bad_state", allowed: STATES };
  }
  if (typeof input.line !== "string") {
    return { status: 400, error: "bad_line" };
  }
  const line = normalizeLine(input.line);
  if ([...line].length > LINE_MAX) {
    return { status: 400, error: "line_too_long", max: LINE_MAX };
  }
  return null;
}

export class StatusStore {
  constructor() {
    this.rows = new Map();
  }

  load(obj) {
    this.rows = new Map();
    if (!obj || typeof obj !== "object") return;
    for (const id of BOT_IDS) {
      const row = obj[id];
      if (!row || typeof row !== "object") continue;
      if (!STATES.includes(row.state)) continue;
      if (typeof row.line !== "string" || typeof row.updatedAt !== "string") continue;
      this.rows.set(id, {
        id,
        state: row.state,
        line: normalizeLine(row.line).slice(0, LINE_MAX),
        updatedAt: row.updatedAt,
      });
    }
  }

  dump() {
    return Object.fromEntries(this.rows);
  }

  upsert(input, updatedAt) {
    const error = validateStatus(input);
    if (error) return { ok: false, error };
    const row = {
      id: input.id,
      state: input.state,
      line: normalizeLine(input.line),
      updatedAt,
    };
    this.rows.set(row.id, row);
    return { ok: true, row };
  }

  get(id) {
    return this.rows.get(id) || null;
  }

  all() {
    const out = [];
    for (const id of BOT_IDS) {
      const row = this.rows.get(id);
      if (row) out.push(row);
    }
    return out;
  }
}
