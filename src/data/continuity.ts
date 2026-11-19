import { TABUNG_QUESTIONS } from './questions';
import { PlayerSaveData, QuestionProgress } from '../types/game';

export const SHARED_MJB_KEY = 'misi_jelajah_budaya_save';
export const MEDAN_SAVE_KEY = 'medan_pendekar_bahasa_save_v1';

export interface MjbSharedRecord {
  playerName?: string;
  kupang?: number;
  stagesCompleted?: number;
  ownedAvatars?: string[];
  avatar?: string;
}

export interface TransferPayload {
  game: 'MISI_JELAJAH_BUDAYA' | 'MEDAN_PENDEKAR_BAHASA';
  playerName: string;
  kupang: number;
  stagesCompleted: number;
  ownedAvatars: string[];
  checksum: string;
}

function computeChecksum(name: string, kupang: number, avatars: string[]): string {
  const raw = `${name.trim().toUpperCase()}|${kupang}|${avatars.join(',')}|NUSANTARA2026`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

export function encodeTransferCode(payload: Omit<TransferPayload, 'checksum'>): string {
  const checksum = computeChecksum(payload.playerName, payload.kupang, payload.ownedAvatars);
  const full: TransferPayload = { ...payload, checksum };
  const json = JSON.stringify(full);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `MJB-${b64}`;
}

export function verifyTransferCode(rawCode: string): {
  valid: boolean;
  hasRajaMustafar: boolean;
  playerName: string;
  kupang: number;
  message: string;
} {
  const code = rawCode.trim();
  if (!code) {
    return {
      valid: false,
      hasRajaMustafar: false,
      playerName: '',
      kupang: 0,
      message:
        'Gerbang masih terkunci! Anda perlu mendapatkan avatar Raja Mustafar dalam Misi Jelajah Budaya terlebih dahulu.',
    };
  }

  // Official structured short codes from Misi Jelajah Budaya
  const upper = code.toUpperCase();
  if (upper === 'MJB-RM-2026-MUSTAFAR' || upper === 'MJB-RAJAMUSTAFAR-SAH') {
    return {
      valid: true,
      hasRajaMustafar: true,
      playerName: 'Raja Mustafar',
      kupang: 50,
      message:
        'Selamat kembali, Raja Mustafar! Anda telah berjaya menguasai dunia budaya. Kini, pengembaraan baharu menanti anda di Medan Pendekar Bahasa.',
    };
  }

  // Test invalid / non-Raja Mustafar code from Misi Jelajah Budaya
  if (upper.startsWith('MJB-')) {
    const encodedPart = code.slice(4);
    try {
      const json = decodeURIComponent(escape(atob(encodedPart)));
      const parsed = JSON.parse(json) as TransferPayload;
      if (
        parsed &&
        typeof parsed.playerName === 'string' &&
        typeof parsed.kupang === 'number' &&
        Array.isArray(parsed.ownedAvatars)
      ) {
        const expected = computeChecksum(
          parsed.playerName,
          parsed.kupang,
          parsed.ownedAvatars,
        );
        if (parsed.checksum === expected) {
          const hasRM = parsed.ownedAvatars.some(
            (a) => a.toUpperCase() === 'RAJA_MUSTAFAR' || a.toUpperCase() === 'RAJA MUSTAFAR',
          );
          if (hasRM && (parsed.stagesCompleted ?? 3) >= 3) {
            return {
              valid: true,
              hasRajaMustafar: true,
              playerName: parsed.playerName || 'Raja Mustafar',
              kupang: Math.max(0, Math.floor(parsed.kupang)),
              message:
                'Selamat kembali, Raja Mustafar! Anda telah berjaya menguasai dunia budaya. Kini, pengembaraan baharu menanti anda di Medan Pendekar Bahasa.',
            };
          }
        }
      }
    } catch {
      // Not a base64 payload, falls through to locked error
    }
  }

  return {
    valid: false,
    hasRajaMustafar: false,
    playerName: '',
    kupang: 0,
    message:
      'Gerbang masih terkunci! Anda perlu mendapatkan avatar Raja Mustafar dalam Misi Jelajah Budaya terlebih dahulu.',
  };
}

export function checkSharedMjbStorage(): {
  found: boolean;
  hasRajaMustafar: boolean;
  playerName: string;
  kupang: number;
} {
  try {
    const raw = localStorage.getItem(SHARED_MJB_KEY);
    if (!raw) return { found: false, hasRajaMustafar: false, playerName: '', kupang: 0 };
    const data = JSON.parse(raw) as MjbSharedRecord;
    const avatars = Array.isArray(data.ownedAvatars)
      ? data.ownedAvatars
      : data.avatar
        ? [data.avatar]
        : [];
    const hasRM = avatars.some(
      (a) => a.toUpperCase() === 'RAJA_MUSTAFAR' || a.toUpperCase() === 'RAJA MUSTAFAR',
    );
    const stagesOk = data.stagesCompleted === undefined || data.stagesCompleted >= 3;
    return {
      found: true,
      hasRajaMustafar: hasRM && stagesOk,
      playerName: data.playerName || 'Raja Mustafar',
      kupang: typeof data.kupang === 'number' ? data.kupang : 50,
    };
  } catch {
    return { found: false, hasRajaMustafar: false, playerName: '', kupang: 0 };
  }
}

export function createInitialTabungStatus(): Record<number, QuestionProgress> {
  const status: Record<number, QuestionProgress> = {};
  for (const q of TABUNG_QUESTIONS) {
    status[q.id] = {
      solved: false,
      attempts: 0,
      everWrong: false,
      finalReviewPassed: false,
    };
  }
  return status;
}

export function createDefaultSave(playerName = 'Raja Mustafar', startingKupang = 50): PlayerSaveData {
  return {
    verified: true,
    playerName: playerName.trim() || 'Raja Mustafar',
    originGame: 'MISI JELAJAH BUDAYA',
    ownedAvatars: ['RAJA_MUSTAFAR'],
    kupang: startingKupang,
    xp: 0,
    hp: 100,
    maxHp: 100,
    rankIndex: 1,
    tabungStatus: createInitialTabungStatus(),
    defeatedMonsters: [],
    collectedBonusOrbs: [],
    inventory: {
      keris_diraja: 1,
      perisai_warisan: 1,
      ramuan_pemulih: 1,
      pelindung_ajaib: 0,
    },
    equippedWeapon: 'keris_diraja',
    equippedShield: true,
    shieldTurnsLeft: 0,
    panglimaAgungEarned: false,
    totalAttempts: 0,
    lastSavedAt: new Date().toISOString(),
  };
}

export function loadSavedGame(): PlayerSaveData | null {
  try {
    const raw = localStorage.getItem(MEDAN_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerSaveData;
    if (!parsed || !parsed.verified || !parsed.ownedAvatars?.includes('RAJA_MUSTAFAR')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function persistGame(data: PlayerSaveData): void {
  try {
    localStorage.setItem(
      MEDAN_SAVE_KEY,
      JSON.stringify({ ...data, lastSavedAt: new Date().toISOString() }),
    );
  } catch {
    // Ignore storage quota errors
  }
}
