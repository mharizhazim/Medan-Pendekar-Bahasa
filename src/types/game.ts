export type ScreenMode = 'gate' | 'menu' | 'playing' | 'victory';

export type LocationId =
  | 'rimba_warisan'
  | 'gua_seribu_misteri'
  | 'perkampungan_nusantara'
  | 'lembah_pendekar'
  | 'istana_puncak_mustafar';

export type EquipmentId =
  | 'keris_diraja'
  | 'perisai_warisan'
  | 'ramuan_pemulih'
  | 'pelindung_ajaib';

export interface EquipmentItem {
  id: EquipmentId;
  name: string;
  powerBonus: number;
  defenseBonus: number;
  description: string;
  effectText: string;
  consumable: boolean;
}

export interface TabungQuestion {
  id: number;
  locationId: LocationId;
  locationName: string;
  difficulty: string;
  storyTitle: string;
  passageBefore: string;
  passageAfter: string;
  choices: [string, string, string];
  answer: string;
  adjectiveType: string;
  explanation: string;
  wrongHint: string;
  nearMissHints: Record<string, string>;
  progressiveHints: string[];
  rewardKupang: number;
  position: [number, number]; // [x, z]
}

export interface MonsterSpec {
  id: string;
  locationId: LocationId;
  name: string;
  title: string;
  maxHp: number;
  attackPower: number;
  rewardKupang: number;
  rewardXp: number;
  rewardItem?: EquipmentId;
  position: [number, number];
  variant: 'hutan' | 'batu' | 'gua' | 'lembah' | 'istana';
}

export interface NpcSpec {
  id: string;
  name: string;
  role: string;
  locationLabel: string;
  position: [number, number];
  variant: 'awang' | 'badang' | 'penduduk';
  dialogues: string[];
}

export interface QuestionProgress {
  solved: boolean;
  attempts: number;
  everWrong: boolean;
  finalReviewPassed: boolean;
  lastSubmittedAnswer?: string;
}

export interface PlayerSaveData {
  verified: boolean;
  playerName: string;
  originGame: string;
  ownedAvatars: string[];
  kupang: number;
  xp: number;
  hp: number;
  maxHp: number;
  rankIndex: number;
  tabungStatus: Record<number, QuestionProgress>;
  defeatedMonsters: string[];
  collectedBonusOrbs: string[];
  inventory: Record<EquipmentId, number>;
  equippedWeapon: EquipmentId;
  equippedShield: boolean;
  shieldTurnsLeft: number;
  panglimaAgungEarned: boolean;
  totalAttempts: number;
  lastSavedAt: string;
}

export interface RankInfo {
  level: number;
  title: string;
  minXp: number;
  attackBonus: number;
}
