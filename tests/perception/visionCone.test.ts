import { describe, expect, it } from "vitest";
import { createGridMap, worldToCell } from "../../src/domain/model/grid";
import { evaluateVision } from "../../src/domain/perception/perception";
import { computeVisionCone } from "../../src/domain/perception/visionCone";

const OPEN_MAP = createGridMap(8, 8, []);

describe("computeVisionCone", () => {
  it("builds an unobstructed sector where every vertex reaches the range", () => {
    const observer = { x: 40, y: 40 };
    const cone = computeVisionCone({
      map: OPEN_MAP,
      tileSize: 10,
      observer,
      facing: { x: 1, y: 0 },
      range: 30,
      fieldOfViewRadians: Math.PI / 2,
    });

    expect(cone.length).toBeGreaterThan(17);
    expect(cone[0]).toEqual(observer);
    for (const vertex of cone.slice(1)) {
      const distance = Math.hypot(vertex.x - observer.x, vertex.y - observer.y);
      expect(distance).toBeCloseTo(30, 9);
      const angle = Math.atan2(vertex.y - observer.y, vertex.x - observer.x);
      expect(Math.abs(angle)).toBeLessThanOrEqual(Math.PI / 4 + 1e-9);
    }
  });

  it("stops the cone at a wall in front of the observer", () => {
    const wallCells = Array.from({ length: 8 }, (_, y) => ({ x: 5, y }));
    const map = createGridMap(8, 8, wallCells);
    const observer = { x: 45, y: 40 };
    const cone = computeVisionCone({
      map,
      tileSize: 10,
      observer,
      facing: { x: 1, y: 0 },
      range: 40,
      fieldOfViewRadians: Math.PI / 2,
    });

    expect(cone.length).toBeGreaterThan(17);
    for (const vertex of cone.slice(1)) {
      expect(vertex.x).toBeLessThanOrEqual(50 + 1e-6);
    }
    const forward = cone
      .slice(1)
      .reduce((best, vertex) => (
        Math.abs(vertex.y - observer.y) < Math.abs(best.y - observer.y) ? vertex : best
      ));
    expect(forward.x).toBeCloseTo(50, 6);
    expect(Math.hypot(forward.x - observer.x, forward.y - observer.y)).toBeCloseTo(5, 6);
  });

  it("does not cross a wall that makes evaluateVision report occluded", () => {
    const wallCells = Array.from({ length: 8 }, (_, y) => ({ x: 5, y }));
    const map = createGridMap(8, 8, wallCells);
    const observer = { x: 45, y: 40 };
    const target = { x: 75, y: 40 };
    const facing = { x: 1, y: 0 };

    const vision = evaluateVision({
      map,
      tileSize: 10,
      observer,
      facing,
      target,
      range: 40,
      fieldOfViewRadians: Math.PI / 2,
    });
    expect(vision.reason).toBe("occluded");

    const cone = computeVisionCone({
      map,
      tileSize: 10,
      observer,
      facing,
      range: 40,
      fieldOfViewRadians: Math.PI / 2,
    });
    const targetDistance = Math.hypot(target.x - observer.x, target.y - observer.y);
    const forward = cone
      .slice(1)
      .reduce((best, vertex) => (
        Math.abs(vertex.y - observer.y) < Math.abs(best.y - observer.y) ? vertex : best
      ));
    expect(
      Math.hypot(forward.x - observer.x, forward.y - observer.y),
    ).toBeLessThan(targetDistance);
  });

  it("applies the conservative corner rule used by evaluateVision", () => {
    const map = createGridMap(8, 8, [{ x: 2, y: 1 }]);
    const observer = { x: 15, y: 15 };
    const facing = { x: 1, y: 1 };
    const target = { x: 45, y: 45 };

    expect(evaluateVision({
      map,
      tileSize: 10,
      observer,
      facing,
      target,
      range: 50,
      fieldOfViewRadians: Math.PI / 2,
    }).reason).toBe("occluded");

    const cone = computeVisionCone({
      map,
      tileSize: 10,
      observer,
      facing,
      range: 50,
      fieldOfViewRadians: Math.PI / 2,
    });
    const targetDistance = Math.hypot(target.x - observer.x, target.y - observer.y);
    const cornerDirection = Math.atan2(target.y - observer.y, target.x - observer.x);
    const nearest = cone.slice(1).reduce((best, vertex) => {
      const angle = Math.atan2(vertex.y - observer.y, vertex.x - observer.x);
      const bestAngle = Math.atan2(best.y - observer.y, best.x - observer.x);
      return Math.abs(angle - cornerDirection) < Math.abs(bestAngle - cornerDirection)
        ? vertex
        : best;
    });
    const nearestDistance = Math.hypot(nearest.x - observer.x, nearest.y - observer.y);
    expect(nearestDistance).toBeLessThan(targetDistance);
    expect(nearestDistance).toBeCloseTo(Math.hypot(5, 5), 6);
    expect(
      worldToCell(nearest, 10),
    ).not.toEqual({ x: 2, y: 1 });
  });

  it("returns an empty cone for a blocked observer, zero facing or zero range", () => {
    const blockedMap = createGridMap(8, 8, [{ x: 1, y: 1 }]);
    expect(computeVisionCone({
      map: blockedMap,
      tileSize: 10,
      observer: { x: 15, y: 15 },
      facing: { x: 1, y: 0 },
      range: 30,
      fieldOfViewRadians: Math.PI / 2,
    })).toEqual([]);
    expect(computeVisionCone({
      map: OPEN_MAP,
      tileSize: 10,
      observer: { x: 40, y: 40 },
      facing: { x: 0, y: 0 },
      range: 30,
      fieldOfViewRadians: Math.PI / 2,
    })).toEqual([]);
    expect(computeVisionCone({
      map: OPEN_MAP,
      tileSize: 10,
      observer: { x: 40, y: 40 },
      facing: { x: 1, y: 0 },
      range: 0,
      fieldOfViewRadians: Math.PI / 2,
    })).toEqual([]);
  });

  it("rejects invalid numeric configuration", () => {
    const base = {
      map: OPEN_MAP,
      tileSize: 10,
      observer: { x: 40, y: 40 },
      facing: { x: 1, y: 0 },
      range: 30,
      fieldOfViewRadians: Math.PI / 2,
    };
    expect(() => computeVisionCone({ ...base, range: Number.NaN })).toThrow(
      "Vision configuration",
    );
    expect(() => computeVisionCone({ ...base, tileSize: 0 })).toThrow(
      "Vision configuration",
    );
    expect(() => computeVisionCone({ ...base, fieldOfViewRadians: Math.PI * 3 })).toThrow(
      "Vision configuration",
    );
    expect(() => computeVisionCone({
      ...base,
      observer: { x: Number.POSITIVE_INFINITY, y: 40 },
    })).toThrow("Vector components");
  });
});
