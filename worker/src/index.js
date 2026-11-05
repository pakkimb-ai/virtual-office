import {
  BOT_IDS,
  SILENT_MS,
  STALE_WORKING_MS,
  StatusStore,
} from "./status-store.js";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
  "access-control-max-age": "86400",
  "cache-control": "no-store",
};

function json(data, status = 200) {
  return new Response(data == null ? null : JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function authorized(req, env) {
  const token = env && env.STATUS_TOKEN;
  if (!token) return true;
  const header = req.headers.get("Authorization") || "";
  return header === `Bearer ${token}`;
}

function snapshot(store, now) {
  return {
    serverTime: now.toISOString(),
    staleAfterMs: STALE_WORKING_MS,
    silentAfterMs: SILENT_MS,
    statuses: store.all(),
  };
}

/**
 * HTTP contract for the status board.
 * `now` is injectable so tests can freeze time. WebSocket upgrade is handled
 * by the Durable Object, which calls this for ordinary HTTP.
 */
export async function handleStatusRequest(req, store, env, now = () => new Date()) {
  if (req.method === "OPTIONS") {
    return { response: new Response(null, { status: 204, headers: CORS }) };
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "status") {
    return { response: json({ error: "not_found" }, 404) };
  }
  if (parts.length > 3) {
    return { response: json({ error: "not_found" }, 404) };
  }

  const extra = parts[2] || "";
  const clock = now();

  if (req.method === "GET" && extra === "") {
    return { response: json(snapshot(store, clock)) };
  }

  if (req.method === "GET" && extra) {
    if (!BOT_IDS.includes(extra)) {
      return { response: json({ error: "bad_id", allowed: BOT_IDS }, 400) };
    }
    const row = store.get(extra);
    if (!row) return { response: json({ error: "not_found" }, 404) };
    return { response: json(row) };
  }

  if (req.method === "POST" && extra === "") {
    if (!authorized(req, env)) {
      return { response: json({ error: "unauthorized" }, 401) };
    }
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > 2048) {
      return { response: json({ error: "body_too_large" }, 413) };
    }
    let body;
    try {
      const text = await req.text();
      if (text.length > 2048) {
        return { response: json({ error: "body_too_large" }, 413) };
      }
      body = JSON.parse(text);
    } catch {
      return { response: json({ error: "bad_json" }, 400) };
    }
    const saved = store.upsert(body, clock.toISOString());
    if (!saved.ok) {
      const { status, ...body } = saved.error;
      return { response: json(body, status || 400) };
    }
    return {
      response: json(saved.row),
      persist: true,
      snapshot: snapshot(store, clock),
    };
  }

  return { response: json({ error: "method_not_allowed" }, 405) };
}

export function wantsSocket(req, url = new URL(req.url)) {
  const parts = url.pathname.split("/").filter(Boolean);
  const extra = parts[2] || "";
  return (
    parts[0] === "api" &&
    parts[1] === "status" &&
    (extra === "ws" || req.headers.get("Upgrade") === "websocket")
  );
}

export class StatusBoard {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.store = new StatusStore();
    this.sessions = new Set();
    this.ready = state.blockConcurrencyWhile(async () => {
      const saved = await state.storage.get("rows");
      if (saved) this.store.load(saved);
    });
  }

  broadcast(payload) {
    const text = JSON.stringify(payload);
    for (const socket of this.sessions) {
      try {
        socket.send(text);
      } catch {
        this.sessions.delete(socket);
      }
    }
  }

  acceptSocket() {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    this.sessions.add(server);
    server.addEventListener("close", () => this.sessions.delete(server));
    server.addEventListener("error", () => this.sessions.delete(server));
    server.send(JSON.stringify(snapshot(this.store, new Date())));
    return new Response(null, { status: 101, webSocket: client });
  }

  async fetch(req) {
    await this.ready;
    const url = new URL(req.url);
    if (wantsSocket(req, url) && (req.method === "GET" || req.headers.get("Upgrade") === "websocket")) {
      return this.acceptSocket();
    }
    const result = await handleStatusRequest(req, this.store, this.env);
    if (result.persist) {
      await this.state.storage.put("rows", this.store.dump());
      this.broadcast(result.snapshot);
    }
    return result.response;
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response("ok", {
        status: 200,
        headers: { ...CORS, "content-type": "text/plain; charset=utf-8" },
      });
    }
    if (url.pathname === "/api/status" || url.pathname.startsWith("/api/status/")) {
      const id = env.STATUS_BOARD.idFromName("office");
      const stub = env.STATUS_BOARD.get(id);
      return stub.fetch(req);
    }
    return json({ error: "not_found" }, 404);
  },
};
