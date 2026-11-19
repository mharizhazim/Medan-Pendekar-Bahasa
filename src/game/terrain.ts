import { LocationId } from '../types/game';

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY?: number;
}

export interface CircleCollider {
  x: number;
  z: number;
  radius: number;
}

export const WORLD_BOUNDS = 102;

/**
 * Returns the exact ground / staircase / bridge elevation at any (x, z) coordinate.
 */
export function groundHeightAt(x: number, z: number): number {
  // 1. Istana Puncak Mustafar mountain plateau (north)
  // Plateau: x in [-26, 26], z in [-105, -64] => y = 8.0
  if (x >= -26 && x <= 26 && z <= -64 && z >= -106) {
    return 8.0;
  }

  // Tangga Batu Diraja (grand stone staircase leading up to Istana)
  // x in [-7, 7], z from -38 (y=0) to -64 (y=8.0)
  if (x >= -7.2 && x <= 7.2 && z < -38 && z > -64) {
    const t = (-38 - z) / (-38 - -64); // 0 at bottom (-38), 1 at top (-64)
    const steps = 16;
    const stepped = Math.floor(t * steps) / steps;
    return Math.max(0, Math.min(8.0, stepped * 8.0 + 0.25));
  }

  // Mountain cliff slopes flanking the staircase (if player tries to walk around staircase)
  if (z < -58 && z > -66 && Math.abs(x) <= 28 && Math.abs(x) > 7.2) {
    const t = (-58 - z) / 8;
    return Math.max(0, Math.min(8.0, t * 8.0));
  }

  // 2. Wooden Bridge over West River (between Hub/Rimba and Perkampungan Nusantara)
  // River channel runs around z = 12 for x < 0, bridge is at x in [-24, -14], z in [7, 17]
  if (x >= -24 && x <= -14 && z >= 6 && z <= 18) {
    return 0.45;
  }

  // 3. Suspension Bridge into Lembah Pendekar
  // River/stream channel around x = 20 for z > 10, bridge at x in [14, 26], z in [24, 32]
  if (x >= 14 && x <= 26 && z >= 24 && z <= 32) {
    return 0.5;
  }

  // Gentle depressed riverbed when wading in shallow water
  if (x < -4 && z > 8 && z < 16) {
    return -0.35;
  }
  if (x > 16 && x < 24 && z > 8 && z < 60) {
    return -0.35;
  }

  return 0;
}

/**
 * Determines which of the 5 named game locations the player is currently exploring.
 */
export function getCurrentLocation(x: number, z: number): {
  id: LocationId | 'dataran_permulaan';
  name: string;
  difficulty: string;
} {
  if (z <= -58 && Math.abs(x) <= 30) {
    return {
      id: 'istana_puncak_mustafar',
      name: 'ISTANA PUNCAK MUSTAFAR',
      difficulty: 'PALING TINGGI',
    };
  }
  if (x < -16 && z <= 8) {
    return {
      id: 'rimba_warisan',
      name: 'RIMBA WARISAN',
      difficulty: 'MUDAH',
    };
  }
  if (x > 16 && z <= 8) {
    return {
      id: 'gua_seribu_misteri',
      name: 'GUA SERIBU MISTERI',
      difficulty: 'RENDAH KE SEDERHANA',
    };
  }
  if (x < -10 && z > 10) {
    return {
      id: 'perkampungan_nusantara',
      name: 'PERKAMPUNGAN NUSANTARA',
      difficulty: 'SEDERHANA',
    };
  }
  if (x > 12 && z > 10) {
    return {
      id: 'lembah_pendekar',
      name: 'LEMBAH PENDEKAR',
      difficulty: 'SEDERHANA KE TINGGI',
    };
  }
  return {
    id: 'dataran_permulaan',
    name: 'DATARAN AWANG KENIT',
    difficulty: 'ZON SELAMAT',
  };
}

/**
 * Resolves circle-vs-box and circle-vs-circle collisions with smooth sliding.
 */
export function resolveCollisions(
  pos: { x: number; y: number; z: number },
  radius: number,
  boxes: BoxCollider[],
  circles: CircleCollider[],
): void {
  // World perimeter clamp
  pos.x = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, pos.x));
  pos.z = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, pos.z));

  // Prevent walking directly up steep Istana cliff wall unless on stairs
  if (pos.z < -62 && pos.z > -66 && Math.abs(pos.x) > 7.0 && Math.abs(pos.x) < 28 && pos.y < 6.5) {
    pos.z = -62;
  }

  for (const b of boxes) {
    if (b.maxY !== undefined && pos.y >= b.maxY) continue;
    const closestX = Math.max(b.minX, Math.min(pos.x, b.maxX));
    const closestZ = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
    const dx = pos.x - closestX;
    const dz = pos.z - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      if (dist > 0.0001) {
        const overlap = radius - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
      } else {
        // Inside AABB fallback: push out along shortest axis
        const left = Math.abs(pos.x - b.minX);
        const right = Math.abs(b.maxX - pos.x);
        const top = Math.abs(pos.z - b.minZ);
        const bottom = Math.abs(b.maxZ - pos.z);
        const minPen = Math.min(left, right, top, bottom);
        if (minPen === left) pos.x = b.minX - radius;
        else if (minPen === right) pos.x = b.maxX + radius;
        else if (minPen === top) pos.z = b.minZ - radius;
        else pos.z = b.maxZ + radius;
      }
    }
  }

  for (const c of circles) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const minDist = radius + c.radius;
    const distSq = dx * dx + dz * dz;
    if (distSq < minDist * minDist && distSq > 0.00001) {
      const dist = Math.sqrt(distSq);
      const overlap = minDist - dist;
      pos.x += (dx / dist) * overlap;
      pos.z += (dz / dist) * overlap;
    }
  }
}
