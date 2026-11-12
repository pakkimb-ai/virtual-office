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
  AGENT_RADIUS,
  BOT_IDS,
  CAPTAIN_DESK,
  DESK_CLEAR_HALF,
  GLASS_OFFICE,
  LOUNGE,
  OFFICE_DOOR,
  RUG_RADIUS,
  aabbDistance,
  assignLoungeSeats,
  badgeView,
  chairWorld,
  decorateStatus,
  deskAnchor,
  deskClearAabb,
  glassWallRects,
  goalForState,
  loungeClearance,
  loungeSpots,
  openDeskDistance,
  resolveStatusApi,
  routeAround,
  segmentHitsAabb,
  solidBlockers,
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

function hitsAny(x0, z0, x1, z1, boxes) {
  return boxes.some((b) => segmentHitsAabb(x0, z0, x1, z1, b.minX, b.maxX, b.minZ, b.maxZ));
}

function pathHits(start, points, boxes) {
  let x = start.x;
  let z = start.z;
  for (const p of points) {
    if (hitsAny(x, z, p.x, p.z, boxes)) return true;
    x = p.x;
    z = p.z;
  }
  return false;
}

test("glass office is the northeast 4.5 by 3.5 frame and clears the desks", () => {
  const w = GLASS_OFFICE.maxX - GLASS_OFFICE.minX;
  const d = GLASS_OFFICE.maxZ - GLASS_OFFICE.minZ;
  assert.ok(Math.abs(w - 4.5) < 1e-9, "width " + w);
  assert.ok(Math.abs(d - 3.5) < 1e-9, "depth " + d);
  assert.ok(GLASS_OFFICE.minX > 0 && GLASS_OFFICE.minZ > 0, "northeast of the rug");
  for (const id of ["ai", "design", "write"]) {
    const desk = deskClearAabb(id);
    const gap = aabbDistance(desk, GLASS_OFFICE);
    assert.ok(gap >= 1.2, id + " clearance " + gap);
  }
  const doorW = OFFICE_DOOR.maxX - OFFICE_DOOR.minX;
  assert.ok(doorW >= 1.1 && doorW <= 1.5, "narrow door " + doorW);
  assert.ok(OFFICE_DOOR.minX > GLASS_OFFICE.minX && OFFICE_DOOR.maxX < GLASS_OFFICE.maxX);
});

test("captain desk sits inside the office facing the door; the old spot is a walkway", () => {
  const desk = deskClearAabb("grok");
  const inset = 0.25;
  assert.ok(desk.minX > GLASS_OFFICE.minX + inset);
  assert.ok(desk.maxX < GLASS_OFFICE.maxX - inset);
  assert.ok(desk.minZ > GLASS_OFFICE.minZ + inset);
  assert.ok(desk.maxZ < GLASS_OFFICE.maxZ - inset);
  assert.equal(CAPTAIN_DESK.rot, 0);

  const chair = chairWorld("grok");
  const doorX = (OFFICE_DOOR.minX + OFFICE_DOOR.maxX) / 2;
  const doorZ = GLASS_OFFICE.minZ;
  const faceX = Math.sin(Math.PI);
  const faceZ = Math.cos(Math.PI);
  const dx = doorX - chair.x;
  const dz = doorZ - chair.z;
  const len = Math.hypot(dx, dz);
  const towardDoor = (faceX * dx + faceZ * dz) / len;
  assert.ok(towardDoor > 0.9, "faces the door " + towardDoor);
  assert.ok(Math.abs(chair.x - doorX) < 0.25, "lined up with the door");

  const oldD = openDeskDistance();
  const old = { x: oldD, z: -oldD };
  assert.ok(Math.hypot(CAPTAIN_DESK.x - old.x, CAPTAIN_DESK.z - old.z) > 3);
  const glass = glassWallRects();
  assert.equal(hitsAny(old.x, old.z, old.x, old.z, glass), false);
  assert.equal(containsSolid(old.x, old.z), false);
});

function containsSolid(x, z) {
  return solidBlockers().some((b) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ);
}

test("lounge seats clear every desk and stay off the rug edge", () => {
  for (const id of BOT_IDS) {
    const gap = loungeClearance(id);
    assert.ok(gap >= 1.2, id + " lounge clearance " + gap);
  }
  const spots = loungeSpots();
  assert.equal(spots.length, 4);
  assert.deepEqual(
    spots.map((s) => s.id),
    ["sofa-w", "sofa-e", "stool", "overflow"]
  );
  for (const spot of spots) {
    const radius = Math.hypot(spot.x, spot.z);
    assert.ok(radius > RUG_RADIUS + 2, spot.id + " radius " + radius);
    assert.ok(spot.x < -5.5 && spot.z < -5.5, spot.id + " southwest");
    const fx = Math.sin(spot.yaw);
    const fz = Math.cos(spot.yaw);
    const len = radius;
    const dot = (fx * -spot.x + fz * -spot.z) / len;
    assert.ok(dot > 0.55, spot.id + " faces the rug " + dot);
  }
  const sofa = LOUNGE.sofa;
  assert.equal(sofa.w > 2 && sofa.d < 1.2, true);
});

test("glass is solid except the door, and routes stay out of it", () => {
  const glass = glassWallRects();
  const throughDoor = hitsAny(8.3, 4.6, 8.3, 6.4, glass);
  const throughPane = hitsAny(9.7, 4.6, 9.7, 6.4, glass);
  assert.equal(throughDoor, false);
  assert.equal(throughPane, true);

  const blockers = solidBlockers();
  const solids = blockers.filter((b) => b.kind !== "seat");
  for (const id of BOT_IDS) {
    const chair = chairWorld(id);
    assert.equal(containsSolid(chair.x, chair.z), false, id + " chair starts inside a solid");
    for (const spot of loungeSpots()) {
      const path = routeAround(chair.x, chair.z, spot.x, spot.z, blockers);
      assert.ok(path.length >= 1, id + " to " + spot.id);
      const last = path[path.length - 1];
      assert.ok(Math.hypot(last.x - spot.x, last.z - spot.z) < 1e-6);
      assert.equal(pathHits(chair, path, glass), false, id + " clips glass going to " + spot.id);
      assert.equal(pathHits(chair, path, solids), false, id + " clips a solid going to " + spot.id);
      const back = routeAround(spot.x, spot.z, chair.x, chair.z, blockers);
      const home = back[back.length - 1];
      assert.ok(Math.hypot(home.x - chair.x, home.z - chair.z) < 1e-6, id + " returns from " + spot.id);
      assert.ok(Math.hypot(home.x - spot.x, home.z - spot.z) > 1, id + " leaves " + spot.id);
      assert.equal(pathHits({ x: spot.x, z: spot.z }, back, glass), false, id + " clips glass going home");
      assert.equal(pathHits({ x: spot.x, z: spot.z }, back, solids), false, id + " clips a solid going home");
      const otherSeats = blockers.filter(
        (b) => b.kind === "seat" && (spot.x < b.minX || spot.x > b.maxX || spot.z < b.minZ || spot.z > b.maxZ)
      );
      assert.equal(
        pathHits({ x: spot.x, z: spot.z }, back, otherSeats),
        false,
        id + " clips another seat leaving " + spot.id
      );
    }
  }

  const chair = chairWorld("grok");
  const outside = { x: 4.2, z: 3.2 };
  const path = routeAround(chair.x, chair.z, outside.x, outside.z, blockers);
  let x = chair.x;
  let z = chair.z;
  let crossed = false;
  for (const p of path) {
    const wallZ = GLASS_OFFICE.minZ;
    if ((z - wallZ) * (p.z - wallZ) <= 0) {
      const t = (wallZ - z) / (p.z - z || 1e-9);
      const cx = x + (p.x - x) * t;
      assert.ok(cx > OFFICE_DOOR.minX + AGENT_RADIUS * 0.5, "door cross " + cx);
      assert.ok(cx < OFFICE_DOOR.maxX - AGENT_RADIUS * 0.5, "door cross " + cx);
      crossed = true;
    }
    x = p.x;
    z = p.z;
  }
  assert.equal(crossed, true);
});

test("idle and done share three lounge seats, overflow stays in the lounge", () => {
  const three = assignLoungeSeats(["design", "write", "ai"]);
  assert.deepEqual(new Set(Object.values(three)), new Set(["sofa-w", "sofa-e", "stool"]));

  const four = assignLoungeSeats(BOT_IDS);
  assert.equal(Object.keys(four).length, 4);
  assert.deepEqual(new Set(Object.values(four)), new Set(["sofa-w", "sofa-e", "stool", "overflow"]));
  const byId = Object.fromEntries(loungeSpots().map((s) => [s.id, s]));
  for (const id of BOT_IDS) {
    const spot = byId[four[id]];
    assert.ok(Math.hypot(spot.x, spot.z) > RUG_RADIUS + 2, id);
  }

  const kept = assignLoungeSeats(["ai", "grok"], { ai: "stool", grok: "sofa-e" });
  assert.equal(kept.ai, "stool");
  assert.equal(kept.grok, "sofa-e");

  const open = deskAnchor("ai");
  const design = deskAnchor("design");
  const write = deskAnchor("write");
  assert.ok(open.x < 0 && open.z > 0);
  assert.ok(design.x > 0 && design.z > 0);
  assert.ok(write.x < 0 && write.z < 0);
  assert.equal(DESK_CLEAR_HALF.hx, 1.2);
});
