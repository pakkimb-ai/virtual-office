import test from "node:test";
import assert from "node:assert/strict";
import {
  BOT_IDS,
  LINE_MAX,
  SILENT_MS,
  STALE_WORKING_MS,
  StatusStore,
} from "../src/status-store.js";
import { handleStatusRequest } from "../src/index.js";

test("thresholds match the gate A contract", () => {
  assert.equal(STALE_WORKING_MS, 10 * 60 * 1000);
  assert.equal(SILENT_MS, 45 * 60 * 1000);
  assert.deepEqual(BOT_IDS, ["grok", "ai", "design", "write"]);
  assert.equal(LINE_MAX, 20);
});

test("upsert stores the contract fields and stamps updatedAt", () => {
  const store = new StatusStore();
  const saved = store.upsert(
    { id: "ai", state: "working", line: "  寫緊閘 A  " },
    "2026-11-05T07:00:00.000Z"
  );
  assert.equal(saved.ok, true);
  assert.deepEqual(saved.row, {
    id: "ai",
    state: "working",
    line: "寫緊閘 A",
    updatedAt: "2026-11-05T07:00:00.000Z",
  });
  assert.equal(store.get("design"), null);
  assert.deepEqual(store.all(), [saved.row]);
});

test("rejects bad id, bad state, and lines over 20 characters", () => {
  const store = new StatusStore();
  assert.equal(store.upsert({ id: "captain", state: "idle", line: "得閒" }, "t").ok, false);
  assert.equal(store.upsert({ id: "grok", state: "busy", line: "忙" }, "t").error.error, "bad_state");
  const long = "一二三四五六七八九十十一十二十三十四十五六";
  assert.equal([...long].length, 21);
  assert.equal(
    store.upsert({ id: "grok", state: "idle", line: long }, "t").error.error,
    "line_too_long"
  );
  const twenty = [...long].slice(0, 20).join("");
  assert.equal(store.upsert({ id: "grok", state: "done", line: twenty }, "t").ok, true);
  assert.equal(store.get("grok").line, twenty);
});

test("HTTP POST then GET round-trips all four bots", async () => {
  const store = new StatusStore();
  const now = () => new Date("2026-11-05T08:00:00.000Z");
  const posts = [
    ["grok", "working", "對齊閘 A"],
    ["write", "waiting", "等 Pak 拍板"],
    ["design", "idle", "得閒"],
    ["ai", "error", "測試失敗"],
  ];
  for (const [id, state, line] of posts) {
    const result = await handleStatusRequest(
      new Request("http://status.local/api/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, state, line }),
      }),
      store,
      {},
      now
    );
    assert.equal(result.response.status, 200);
    assert.equal(result.persist, true);
    const row = await result.response.json();
    assert.equal(row.id, id);
    assert.equal(row.state, state);
    assert.equal(row.line, line);
    assert.equal(row.updatedAt, "2026-11-05T08:00:00.000Z");
  }

  const got = await handleStatusRequest(
    new Request("http://status.local/api/status"),
    store,
    {},
    now
  );
  assert.equal(got.response.status, 200);
  const body = await got.response.json();
  assert.equal(body.serverTime, "2026-11-05T08:00:00.000Z");
  assert.equal(body.staleAfterMs, STALE_WORKING_MS);
  assert.equal(body.silentAfterMs, SILENT_MS);
  assert.deepEqual(
    body.statuses.map((row) => row.id),
    ["grok", "ai", "design", "write"]
  );

  const one = await handleStatusRequest(
    new Request("http://status.local/api/status/write"),
    store,
    {},
    now
  );
  assert.equal((await one.response.json()).state, "waiting");
});

test("POST requires the bearer token only when STATUS_TOKEN is set", async () => {
  const store = new StatusStore();
  const req = () =>
    new Request("http://status.local/api/status", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong",
      },
      body: JSON.stringify({ id: "ai", state: "done", line: "搞掂" }),
    });
  const open = await handleStatusRequest(req(), store, {});
  assert.equal(open.response.status, 200);

  const locked = new StatusStore();
  const denied = await handleStatusRequest(req(), locked, { STATUS_TOKEN: "s3cret" });
  assert.equal(denied.response.status, 401);
  assert.equal(locked.all().length, 0);

  const allowed = await handleStatusRequest(
    new Request("http://status.local/api/status", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer s3cret",
      },
      body: JSON.stringify({ id: "ai", state: "done", line: "搞掂" }),
    }),
    locked,
    { STATUS_TOKEN: "s3cret" }
  );
  assert.equal(allowed.response.status, 200);
});

test("load ignores corrupt rows and keeps the four ids", () => {
  const store = new StatusStore();
  store.load({
    ai: { id: "ai", state: "working", line: "寫緊", updatedAt: "2026-11-05T00:00:00.000Z" },
    nope: { id: "nope", state: "idle", line: "x", updatedAt: "2026-11-05T00:00:00.000Z" },
    design: { id: "design", state: "nope", line: "x", updatedAt: "2026-11-05T00:00:00.000Z" },
  });
  assert.deepEqual(store.all().map((row) => row.id), ["ai"]);
});
