import { 
  FighterId, 
  ArenaId, 
  GameMode, 
  Difficulty, 
  CombatEntity, 
  ReplayFrame, 
  ReplayInputEvent, 
  ReplayHitEvent, 
  MatchReplayData 
} from '../../types/combat';

const REPLAY_STORAGE_KEY = 'octacombat_saved_replays_v1';
const MAX_SAVED_REPLAYS = 5;

export class ReplayRecorder {
  private static instance: ReplayRecorder | null = null;

  private isRecording = false;
  private startTime = 0;
  private lastSampleTime = 0;
  private sampleInterval = 1 / 30; // 30 fps sampling

  private matchMetadata: {
    id: string;
    p1Id: FighterId;
    p2Id: FighterId;
    arenaId: ArenaId;
    gameMode: GameMode;
    difficulty: Difficulty;
  } | null = null;

  private frames: ReplayFrame[] = [];
  private inputLog: ReplayInputEvent[] = [];
  private pendingHit: ReplayHitEvent | undefined = undefined;
  private lastReplay: MatchReplayData | null = null;

  public static getInstance(): ReplayRecorder {
    if (!ReplayRecorder.instance) {
      ReplayRecorder.instance = new ReplayRecorder();
    }
    return ReplayRecorder.instance;
  }

  public startRecording(
    p1Id: FighterId,
    p2Id: FighterId,
    arenaId: ArenaId,
    gameMode: GameMode,
    difficulty: Difficulty
  ) {
    this.isRecording = true;
    this.startTime = performance.now() / 1000;
    this.lastSampleTime = 0;
    this.frames = [];
    this.inputLog = [];
    this.pendingHit = undefined;

    this.matchMetadata = {
      id: `replay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      p1Id,
      p2Id,
      arenaId,
      gameMode,
      difficulty,
    };
  }

  public getElapsedTime(): number {
    if (!this.isRecording) return 0;
    return performance.now() / 1000 - this.startTime;
  }

  public recordInput(
    player: 'p1' | 'p2',
    type: 'action' | 'movement',
    label: string,
    key?: string
  ) {
    if (!this.isRecording) return;
    const time = this.getElapsedTime();
    this.inputLog.push({
      time: Math.round(time * 100) / 100,
      player,
      type,
      label,
      key,
    });
  }

  public recordHit(hit: ReplayHitEvent) {
    if (!this.isRecording) return;
    this.pendingHit = hit;
  }

  public captureFrame(
    p1: CombatEntity,
    p2: CombatEntity,
    timer: number,
    round: number,
    roundState: string,
    announcement?: { main: string; sub?: string } | null
  ) {
    if (!this.isRecording) return;
    const now = this.getElapsedTime();

    // Sample at 30 fps interval
    if (now - this.lastSampleTime < this.sampleInterval) {
      return;
    }
    this.lastSampleTime = now;

    const frame: ReplayFrame = {
      timestamp: Math.round(now * 100) / 100,
      timer,
      round,
      roundState,
      announcement: announcement ? { ...announcement } : null,
      p1: {
        x: Math.round(p1.position.x * 100) / 100,
        y: Math.round(p1.position.y * 100) / 100,
        facing: p1.facing,
        hp: Math.round(p1.hp),
        energy: Math.round(p1.energy),
        action: p1.action,
        actionTimer: Math.round(p1.actionTimer * 100) / 100,
        actionDuration: Math.round(p1.actionDuration * 100) / 100,
        comboCount: p1.comboCount,
        comboDamage: p1.comboDamage,
        isBlocking: p1.isBlocking,
      },
      p2: {
        x: Math.round(p2.position.x * 100) / 100,
        y: Math.round(p2.position.y * 100) / 100,
        facing: p2.facing,
        hp: Math.round(p2.hp),
        energy: Math.round(p2.energy),
        action: p2.action,
        actionTimer: Math.round(p2.actionTimer * 100) / 100,
        actionDuration: Math.round(p2.actionDuration * 100) / 100,
        comboCount: p2.comboCount,
        comboDamage: p2.comboDamage,
        isBlocking: p2.isBlocking,
      },
      hit: this.pendingHit,
    };

    this.frames.push(frame);
    this.pendingHit = undefined;
  }

  public finalizeMatch(
    winnerId: FighterId,
    isPlayerWinner: boolean,
    p1RoundsWon: number,
    p2RoundsWon: number
  ): MatchReplayData | null {
    if (!this.isRecording || !this.matchMetadata) return this.lastReplay;
    this.isRecording = false;

    const totalDuration = this.getElapsedTime();

    const replayData: MatchReplayData = {
      id: this.matchMetadata.id,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      p1Id: this.matchMetadata.p1Id,
      p2Id: this.matchMetadata.p2Id,
      arenaId: this.matchMetadata.arenaId,
      gameMode: this.matchMetadata.gameMode,
      difficulty: this.matchMetadata.difficulty,
      winnerId,
      isPlayerWinner,
      totalDuration: Math.round(totalDuration * 10) / 10,
      p1RoundsWon,
      p2RoundsWon,
      inputLog: [...this.inputLog],
      frames: [...this.frames],
    };

    this.lastReplay = replayData;
    this.persistReplay(replayData);

    return replayData;
  }

  private persistReplay(replay: MatchReplayData) {
    try {
      const existing = this.getSavedReplays();
      // Keep most recent ones
      const updated = [replay, ...existing.filter((r) => r.id !== replay.id)].slice(0, MAX_SAVED_REPLAYS);
      localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Replay local storage quota exceeded or unavailable:', e);
    }
  }

  public getSavedReplays(): MatchReplayData[] {
    try {
      const raw = localStorage.getItem(REPLAY_STORAGE_KEY);
      if (!raw) return this.lastReplay ? [this.lastReplay] : [];
      return JSON.parse(raw);
    } catch {
      return this.lastReplay ? [this.lastReplay] : [];
    }
  }

  public getLastReplay(): MatchReplayData | null {
    if (this.lastReplay) return this.lastReplay;
    const saved = this.getSavedReplays();
    return saved.length > 0 ? saved[0] : null;
  }
}
