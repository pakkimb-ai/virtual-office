import test from "node:test";
import assert from "node:assert/strict";
import {
  SILENT_MS as CLIENT_SILENT,
  STALE_WORKING_MS as CLIENT_STALE,
} from "../js/status.js";
import {
  SILENT_MS as WORKER_SILENT,
  STALE_WORKING_MS as WORKER_STALE,
} from "../worker/src/status-store.js";
import {
  badgeView,
  buildSpots,
  decorateStatus,
  goalForState,
  resolveStatusApi,
  segmentHitsAabb,
  warningLines,
} from "../js/status.js";

test("client and worker use the same stale windows", () => {
  assert.equal(CLIENT_STALE, WORKER_STALE);
  assert.equal(CLIENT_SILENT, WORKER_SILENT);
});

test("goal table matches gate A", () => {
  assert.equal(goalForState("working"), "desk");
  assert.equal(goalForState("waiting"), "desk");
  assert.equal(goalForState("error"), "desk");
  assert.equal(goalForState("idle"), "idle");
  assert.equal(goalForState("done"), "idle");
  assert.equal(goalForState("busy"), null);
});

test("working goes stale after 10 minutes; silence warns after 45", () => {
  const t0 = Date.parse("2026-11-05T00:00:00.000Z");
  const fresh = decorateStatus(
    { id: "ai", state: "working", line: "寫緊", updatedAt: new Date(t0).toISOString() },
    t0 + 9 * 60 * 1000
  );
  assert.equal(fresh.stale, false);
  assert.equal(fresh.silent, false);

  const stale = decorateStatus(
    { id: "ai", state: "working", line: "寫緊", updatedAt: new Date(t0).toISOString() },
    t0 + 10 * 60 * 1000 + 1
  );
  assert.equal(stale.stale, true);
  assert.equal(stale.silent, false);
  assert.equal(goalForState(stale.state), "desk");

  const quiet = decorateStatus(
    { id: "grok", state: "done", line: "搞掂", updatedAt: new Date(t0).toISOString() },
    t0 + 45 * 60 * 1000 + 1
  );
  assert.equal(quiet.stale, false);
  assert.equal(quiet.silent, true);
  assert.deepEqual(warningLines([stale, quiet]), [
    "開發超過 10 分鐘冇更新",
    "隊長超過 45 分鐘冇心跳",
  ]);
  assert.equal(badgeView(stale, true).text, "冇更新");
  assert.equal(badgeView(quiet, true).text, "冇心跳");
  assert.equal(badgeView(null, true).text, "忙緊");
});

test("api override accepts http(s) origins only", () => {
  assert.equal(resolveStatusApi("http://127.0.0.1:4173/?api=http://127.0.0.1:8787"), "http://127.0.0.1:8787");
  assert.equal(
    resolveStatusApi("https://pakkimb-ai.github.io/virtual-office/?v=18a1", "https://office.example.workers.dev/"),
    "https://office.example.workers.dev"
  );
  assert.equal(resolveStatusApi("https://pakkimb-ai.github.io/virtual-office/", ""), "");
  assert.equal(resolveStatusApi("http://localhost/?api=javascript:alert(1)"), "");
});

test("rug-edge idle spots clear the four desks", () => {
  const rugRadius = 3.5;
  const deskD = (rugRadius + 1.2) * Math.SQRT1_2;
  const desks = [
    ["ai", -deskD, deskD, 0],
    ["design", deskD, deskD, 0],
    ["write", -deskD, -deskD, Math.PI],
    ["grok", deskD, -deskD, Math.PI],
  ];
  const spots = desks.map(([id, groupX, groupZ, groupRotY]) => {
    const spot = buildSpots({
      groupX,
      groupZ,
      groupRotY,
      charX: 0,
      charZ: 1,
      rugRadius,
    });
    assert.ok(spot, id);
    const hx = 1.2;
    const hz = 0.82;
    assert.equal(
      segmentHitsAabb(0, 1, spot.sideX, spot.sideZ, -hx, hx, -hz, hz),
      false,
      id + " side leg"
    );
    assert.equal(
      segmentHitsAabb(spot.sideX, spot.sideZ, spot.idleX, spot.idleZ, -hx, hx, -hz, hz),
      false,
      id + " idle leg"
    );
    const radius = Math.hypot(spot.idleWorldX, spot.idleWorldZ);
    assert.ok(Math.abs(radius - (rugRadius - 0.18)) < 0.02, id + " radius " + radius);
    assert.ok(radius < rugRadius, id);
    return { id, spot };
  });

  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) {
      const a = spots[i].spot;
      const b = spots[j].spot;
      const d = Math.hypot(a.idleWorldX - b.idleWorldX, a.idleWorldZ - b.idleWorldZ);
      assert.ok(d > 1.5, spots[i].id + " vs " + spots[j].id + " = " + d);
    }
  }
});
