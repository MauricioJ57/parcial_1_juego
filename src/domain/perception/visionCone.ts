import { isWalkable, worldToCell, type GridMap } from "../model/grid";
import { assertFiniteVector, type Vector2 } from "../model/vector";

export interface VisionConeQuery {
  readonly map: GridMap;
  readonly tileSize: number;
  readonly observer: Vector2;
  readonly facing: Vector2;
  readonly range: number;
  readonly fieldOfViewRadians: number;
}

const CORNER_TOLERANCE = 1e-9;
const MIN_RAYS = 16;
const MAX_RAYS = 240;
const RAY_SPACING_DIVISOR = 4;

export function computeVisionCone(query: VisionConeQuery): readonly Vector2[] {
  assertFiniteVector(query.observer);
  assertFiniteVector(query.facing);
  if (
    !Number.isFinite(query.tileSize)
    || query.tileSize <= 0
    || !Number.isFinite(query.range)
    || query.range < 0
    || !Number.isFinite(query.fieldOfViewRadians)
    || query.fieldOfViewRadians < 0
    || query.fieldOfViewRadians > Math.PI * 2
  ) {
    throw new Error("Vision configuration is invalid.");
  }

  const facingLength = Math.hypot(query.facing.x, query.facing.y);
  if (facingLength === 0 || query.range === 0) {
    return [];
  }

  const originCell = worldToCell({ x: query.observer.x, y: query.observer.y }, query.tileSize);
  if (!isWalkable(query.map, originCell)) {
    return [];
  }

  const baseAngle = Math.atan2(query.facing.y, query.facing.x);
  const halfFieldOfView = query.fieldOfViewRadians / 2;
  const arcLength = query.range * query.fieldOfViewRadians;
  const rawRays = Math.ceil(arcLength / (query.tileSize / RAY_SPACING_DIVISOR));
  const rays = Math.min(MAX_RAYS, Math.max(MIN_RAYS, rawRays + (rawRays % 2)));

  const vertices: Vector2[] = [{ x: query.observer.x, y: query.observer.y }];
  for (let index = 0; index <= rays; index += 1) {
    const angle = baseAngle - halfFieldOfView + (index / rays) * query.fieldOfViewRadians;
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const travelled = rayMaxDistance(
      query.map,
      query.tileSize,
      query.observer,
      direction,
      query.range,
    );
    vertices.push({
      x: query.observer.x + direction.x * travelled,
      y: query.observer.y + direction.y * travelled,
    });
  }
  return vertices;
}

function rayMaxDistance(
  map: GridMap,
  tileSize: number,
  origin: Vector2,
  direction: Vector2,
  maxDistance: number,
): number {
  const cell = worldToCell({ x: origin.x, y: origin.y }, tileSize);
  if (!isWalkable(map, cell)) {
    return 0;
  }

  const stepX = direction.x > 0 ? 1 : direction.x < 0 ? -1 : 0;
  const stepY = direction.y > 0 ? 1 : direction.y < 0 ? -1 : 0;
  let x = cell.x;
  let y = cell.y;
  let distance = 0;
  const boundaryX = stepX > 0 ? (x + 1) * tileSize : x * tileSize;
  const boundaryY = stepY > 0 ? (y + 1) * tileSize : y * tileSize;
  let distanceToX = stepX === 0
    ? Number.POSITIVE_INFINITY
    : (boundaryX - origin.x) / direction.x;
  let distanceToY = stepY === 0
    ? Number.POSITIVE_INFINITY
    : (boundaryY - origin.y) / direction.y;
  const stepSizeX = stepX === 0
    ? Number.POSITIVE_INFINITY
    : tileSize / Math.abs(direction.x);
  const stepSizeY = stepY === 0
    ? Number.POSITIVE_INFINITY
    : tileSize / Math.abs(direction.y);

  while (distance < maxDistance) {
    if (Math.abs(distanceToX - distanceToY) <= CORNER_TOLERANCE) {
      const cornerDistance = distanceToX;
      if (cornerDistance >= maxDistance) {
        return maxDistance;
      }
      if (
        !isWalkable(map, { x: x + stepX, y })
        || !isWalkable(map, { x, y: y + stepY })
      ) {
        return cornerDistance;
      }
      x += stepX;
      y += stepY;
      distance = cornerDistance;
      distanceToX += stepSizeX;
      distanceToY += stepSizeY;
    } else if (distanceToX < distanceToY) {
      if (distanceToX >= maxDistance) {
        return maxDistance;
      }
      x += stepX;
      distance = distanceToX;
      distanceToX += stepSizeX;
    } else {
      if (distanceToY >= maxDistance) {
        return maxDistance;
      }
      y += stepY;
      distance = distanceToY;
      distanceToY += stepSizeY;
    }

    if (!isWalkable(map, { x, y })) {
      return distance;
    }
  }
  return maxDistance;
}
