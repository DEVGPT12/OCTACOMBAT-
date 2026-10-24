export type FighterId = 'octav' | 'zen' | 'kai' | 'luna' | 'razor' | 'maya' | 'spectre' | 'volt';

export type ArenaId = 'temple' | 'city' | 'cyberbase' | 'volcano';

export type GameMode = 'arcade' | 'training' | 'story' | 'survival';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface MoveData {
  id: string;
  name: string;
  nameFr: string;
  type: 'light' | 'heavy' | 'kick' | 'air' | 'special';
  damage: number;
  duration: number; // in seconds
  hitFrameTime: number; // point in time when hitbox is active
  hitboxRadius: number;
  hitboxOffset: { x: number; y: number; z: number };
  energyCost: number; // only for special
  energyGain: number; // awarded on hit
  knockback: number;
  staggerTime: number;
  description: string;
}

export interface FighterStats {
  speed: number;      // 1 to 10
  power: number;      // 1 to 10
  defense: number;    // 1 to 10
  energyRate: number; // 1 to 10
}

export interface FighterDefinition {
  id: FighterId;
  name: string;
  title: string;
  subtitle: string;
  slogan: string;
  bio: string;
  fightingStyle: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  stats: FighterStats;
  avatarUrl?: string; // we also provide a stylized procedural badge/icon
  moves: {
    lightPunch: MoveData;
    heavyPunch: MoveData;
    kick: MoveData;
    airKick: MoveData;
    specialMove: MoveData;
  };
}

export interface ArenaDefinition {
  id: ArenaId;
  name: string;
  subtitle: string;
  description: string;
  skyColor: string;
  groundColor: string;
  fogColor: string;
  ambientLight: string;
  keyLight: string;
  accentLight: string;
}

export type ActionState = 
  | 'idle'
  | 'walk_forward'
  | 'walk_backward'
  | 'crouch'
  | 'jump'
  | 'attack_light'
  | 'attack_heavy'
  | 'attack_kick'
  | 'attack_air'
  | 'attack_special'
  | 'block'
  | 'hit_light'
  | 'hit_heavy'
  | 'knockdown'
  | 'getup'
  | 'victory'
  | 'defeat';

export interface CombatEntity {
  id: FighterId;
  name: string;
  isPlayer: boolean;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  facing: 1 | -1; // 1 = facing right, -1 = facing left
  action: ActionState;
  actionTimer: number;
  actionDuration: number;
  currentMove: MoveData | null;
  hasHitThisAttack: boolean;
  isGrounded: boolean;
  isBlocking: boolean;
  isHitStunned: boolean;
  hitStunTimer: number;
  roundsWon: number;
  comboCount: number;
  comboTimer: number;
  comboDamage: number;
}

export interface ParticleEffect {
  id: number;
  type: 'hit_spark' | 'energy_burst' | 'block_shield' | 'fire_ember' | 'dust' | 'lightning';
  position: [number, number, number];
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface GameSettings {
  sfxVolume: number; // 0 to 1
  musicVolume: number; // 0 to 1
  quality: 'low' | 'high';
  touchControls: boolean;
  touchOpacity: number;
  difficulty: Difficulty;
  roundsToWin: number;
  roundDuration: number;
}

export interface ReplayInputEvent {
  time: number;
  player: 'p1' | 'p2';
  type: 'action' | 'movement';
  label: string;
  key?: string;
}

export interface ReplayFrameEntity {
  x: number;
  y: number;
  facing: 1 | -1;
  hp: number;
  energy: number;
  action: ActionState;
  actionTimer: number;
  actionDuration: number;
  comboCount: number;
  comboDamage: number;
  isBlocking: boolean;
}

export interface ReplayHitEvent {
  type: 'light' | 'heavy' | 'kick' | 'air' | 'special';
  x: number;
  y: number;
  color: string;
  isBlocked: boolean;
  damage: number;
}

export interface ReplayFrame {
  timestamp: number;
  timer: number;
  round: number;
  roundState: string;
  announcement?: { main: string; sub?: string } | null;
  p1: ReplayFrameEntity;
  p2: ReplayFrameEntity;
  hit?: ReplayHitEvent;
}

export interface MatchReplayData {
  id: string;
  date: string;
  p1Id: FighterId;
  p2Id: FighterId;
  arenaId: ArenaId;
  gameMode: GameMode;
  difficulty: Difficulty;
  winnerId: FighterId;
  isPlayerWinner: boolean;
  totalDuration: number;
  p1RoundsWon: number;
  p2RoundsWon: number;
  inputLog: ReplayInputEvent[];
  frames: ReplayFrame[];
}

