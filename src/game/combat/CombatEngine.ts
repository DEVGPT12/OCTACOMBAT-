import * as THREE from 'three';
import { 
  CombatEntity, 
  FighterDefinition, 
  ArenaDefinition, 
  ActionState, 
  MoveData, 
  Difficulty,
  GameMode,
  ParticleEffect
} from '../../types/combat';
import { FIGHTERS } from '../constants';
import { FighterModel } from '../graphics/FighterModel';
import { ArenaBuilder } from '../graphics/ArenaBuilder';
import { CombatAI } from './CombatAI';
import { soundEngine } from '../../audio/soundEngine';
import { ReplayRecorder } from './ReplayRecorder';

export interface CombatEngineCallbacks {
  onStateUpdate: (p1: CombatEntity, p2: CombatEntity, timer: number, round: number, roundState: string) => void;
  onAnnounce: (msg: string, sub?: string) => void;
  onMatchEnd: (winnerId: string, isPlayerWinner: boolean) => void;
}

export class CombatEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private canvasMount: HTMLDivElement;

  public p1Def: FighterDefinition;
  public p2Def: FighterDefinition;
  public arenaDef: ArenaDefinition;
  public mode: GameMode;
  public difficulty: Difficulty;

  public p1: CombatEntity;
  public p2: CombatEntity;
  public p1Model: FighterModel;
  public p2Model: FighterModel;
  public arena: ArenaBuilder;
  private ai: CombatAI;

  public matchTimer: number = 80;
  public currentRound: number = 1;
  public roundState: 'intro' | 'countdown' | 'fight' | 'ko' | 'round_end' | 'match_end' = 'intro';
  public roundStateTimer: number = 0;
  private currentAnnouncement: { main: string; sub?: string } | null = null;

  private isRunning: boolean = false;
  private frameId: number = 0;
  private clock: THREE.Clock;
  private hitstopTimer: number = 0;
  private cameraShakeIntensity: number = 0;

  private callbacks: CombatEngineCallbacks;
  private activeParticles: { mesh: THREE.Mesh; life: number; maxLife: number; vel: THREE.Vector3 }[] = [];

  // Input states
  public keysHeld: Record<string, boolean> = {};

  constructor(
    canvasMount: HTMLDivElement,
    p1Def: FighterDefinition,
    p2Def: FighterDefinition,
    arenaDef: ArenaDefinition,
    mode: GameMode,
    difficulty: Difficulty,
    callbacks: CombatEngineCallbacks
  ) {
    this.canvasMount = canvasMount;
    this.p1Def = p1Def;
    this.p2Def = p2Def;
    this.arenaDef = arenaDef;
    this.mode = mode;
    this.difficulty = difficulty;
    this.callbacks = callbacks;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(arenaDef.skyColor);
    this.scene.fog = new THREE.Fog(arenaDef.fogColor, 18, 55);
    // Reliable fill lighting keeps the fighters readable on mobile screens,
    // even when an arena uses very dark materials or fog.
    this.scene.add(new THREE.HemisphereLight(0xdbeafe, 0x292033, 2.0));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    keyLight.position.set(-4, 9, 7);
    keyLight.castShadow = true;
    this.scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.8);
    rimLight.position.set(5, 5, -5);
    this.scene.add(rimLight);

    const aspect = canvasMount.clientWidth / canvasMount.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 2.0, 6.6);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvasMount.clientWidth, canvasMount.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    canvasMount.appendChild(this.renderer.domElement);

    // 3. Initialize Arena & Fighters
    this.arena = new ArenaBuilder(arenaDef);
    this.scene.add(this.arena.group);

    this.p1 = this.createEntity(p1Def, true, -2.5);
    this.p2 = this.createEntity(p2Def, false, 2.5);

    this.p1Model = new FighterModel(p1Def, true);
    this.p2Model = new FighterModel(p2Def, false);

    this.scene.add(this.p1Model.group);
    this.scene.add(this.p2Model.group);

    this.ai = new CombatAI(difficulty);
    this.clock = new THREE.Clock();

    // Start replay recording for this match
    ReplayRecorder.getInstance().startRecording(
      p1Def.id,
      p2Def.id,
      arenaDef.id,
      mode,
      difficulty
    );

    // Setup input listeners
    this.setupInputs();

    // Start round sequence
    this.startRoundIntro();
  }

  private createEntity(def: FighterDefinition, isPlayer: boolean, startX: number): CombatEntity {
    return {
      id: def.id,
      name: def.name,
      isPlayer,
      hp: 100,
      maxHp: 100,
      energy: this.mode === 'training' ? 100 : 25,
      maxEnergy: 100,
      position: { x: startX, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      facing: isPlayer ? 1 : -1,
      action: 'idle',
      actionTimer: 0,
      actionDuration: 0,
      currentMove: null,
      hasHitThisAttack: false,
      isGrounded: true,
      isBlocking: false,
      isHitStunned: false,
      hitStunTimer: 0,
      roundsWon: 0,
      comboCount: 0,
      comboTimer: 0,
      comboDamage: 0,
    };
  }

  private setupInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysHeld[e.code] = true;

    if (this.roundState !== 'fight') return;

    // Single key presses for attacks
    if (e.code === 'KeyJ' || e.code === 'KeyZ') {
      ReplayRecorder.getInstance().recordInput('p1', 'action', 'JAB RAPIDE', 'J');
      this.triggerPlayerAction('attack_light');
    } else if (e.code === 'KeyK' || e.code === 'KeyX') {
      ReplayRecorder.getInstance().recordInput('p1', 'action', 'POING LOURD', 'K');
      this.triggerPlayerAction('attack_heavy');
    } else if (e.code === 'KeyL' || e.code === 'KeyC') {
      ReplayRecorder.getInstance().recordInput('p1', 'action', 'COUP DE PIED', 'L');
      this.triggerPlayerAction('attack_kick');
    } else if (e.code === 'KeyU' || e.code === 'KeyV' || e.code === 'Space') {
      ReplayRecorder.getInstance().recordInput('p1', 'action', 'SUPER MOVE', 'ESPACE');
      this.triggerPlayerAction('attack_special');
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      ReplayRecorder.getInstance().recordInput('p1', 'movement', 'SAUT', 'W');
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      ReplayRecorder.getInstance().recordInput('p1', 'movement', 'GARDE / BAS', 'S');
    } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      ReplayRecorder.getInstance().recordInput('p1', 'movement', 'GAUCHE', 'A');
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      ReplayRecorder.getInstance().recordInput('p1', 'movement', 'DROITE', 'D');
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld[e.code] = false;
  };

  private handleWindowBlur = () => {
    this.keysHeld = {};
  };

  public triggerPlayerAction(action: string) {
    if (this.roundState !== 'fight') return;
    ReplayRecorder.getInstance().recordInput(
      'p1', 
      'action', 
      action.replace('attack_', '').toUpperCase(), 
      'TOUCH'
    );
    this.executeAction(this.p1, this.p1Def, action);
  }

  public setVirtualMovement(direction: 'left' | 'right' | 'up' | 'down' | 'none') {
    this.keysHeld['KeyA'] = direction === 'left';
    this.keysHeld['KeyD'] = direction === 'right';
    this.keysHeld['KeyW'] = direction === 'up';
    this.keysHeld['KeyS'] = direction === 'down';
    if (direction !== 'none') {
      ReplayRecorder.getInstance().recordInput('p1', 'movement', direction.toUpperCase(), 'JOYSTICK');
    }
  }

  private executeAction(entity: CombatEntity, def: FighterDefinition, action: string) {
    // If stunned or in recovery, ignore
    if (
      entity.isHitStunned || 
      entity.action === 'knockdown' || 
      entity.action === 'victory' || 
      entity.action === 'defeat'
    ) {
      return;
    }

    // Already attacking? Only allow cancelling if chaining combo
    if (entity.action.startsWith('attack_')) {
      return;
    }

    if (action === 'attack_light') {
      const move = def.moves.lightPunch;
      entity.action = 'attack_light';
      entity.actionTimer = 0;
      entity.actionDuration = move.duration;
      entity.currentMove = move;
      entity.hasHitThisAttack = false;
      soundEngine.playWhoosh('light');
    } else if (action === 'attack_heavy') {
      const move = def.moves.heavyPunch;
      entity.action = 'attack_heavy';
      entity.actionTimer = 0;
      entity.actionDuration = move.duration;
      entity.currentMove = move;
      entity.hasHitThisAttack = false;
      soundEngine.playWhoosh('heavy');
    } else if (action === 'attack_kick') {
      const move = def.moves.kick;
      entity.action = 'attack_kick';
      entity.actionTimer = 0;
      entity.actionDuration = move.duration;
      entity.currentMove = move;
      entity.hasHitThisAttack = false;
      soundEngine.playWhoosh('light');
    } else if (action === 'attack_air') {
      const move = def.moves.airKick;
      entity.action = 'attack_air';
      entity.actionTimer = 0;
      entity.actionDuration = move.duration;
      entity.currentMove = move;
      entity.hasHitThisAttack = false;
      soundEngine.playWhoosh('heavy');
    } else if (action === 'attack_special') {
      const move = def.moves.specialMove;
      if (entity.energy >= move.energyCost) {
        if (this.mode !== 'training') {
          entity.energy -= move.energyCost;
        }
        entity.action = 'attack_special';
        entity.actionTimer = 0;
        entity.actionDuration = move.duration;
        entity.currentMove = move;
        entity.hasHitThisAttack = false;
        soundEngine.playSpecial(def.id);
        this.cameraShakeIntensity = 0.35;
      }
    } else if (action === 'block') {
      entity.action = 'block';
      entity.isBlocking = true;
    } else if (action === 'jump' && entity.isGrounded) {
      entity.velocity.y = 8.5;
      entity.isGrounded = false;
      entity.action = 'jump';
    } else if (action === 'walk_forward') {
      entity.action = 'walk_forward';
    } else if (action === 'walk_backward') {
      entity.action = 'walk_backward';
    } else if (action === 'idle') {
      entity.action = 'idle';
      entity.isBlocking = false;
    }
  }

  private startRoundIntro() {
    this.roundState = 'intro';
    this.roundStateTimer = 0;
    this.matchTimer = 80;

    const roundText = this.currentRound === 1 ? 'ROUND 1' :
                      this.currentRound === 2 ? 'ROUND 2' : 'ROUND FINAL';
    this.currentAnnouncement = { main: roundText, sub: 'PRÉPAREZ-VOUS !' };
    soundEngine.playRoundAnnounce(this.currentRound === 1 ? 'round1' : 'round2');
    this.callbacks.onAnnounce(roundText, 'PRÉPAREZ-VOUS !');

    setTimeout(() => {
      this.roundState = 'countdown';
      this.currentAnnouncement = { main: 'FIGHT !', sub: 'AU COMBAT !' };
      soundEngine.playRoundAnnounce('fight');
      this.callbacks.onAnnounce('FIGHT !', 'AU COMBAT !');
      setTimeout(() => {
        this.roundState = 'fight';
        this.currentAnnouncement = null;
        this.callbacks.onAnnounce('');
        soundEngine.startArcadeMusic();
      }, 800);
    }, 1500);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  public pause() {
    this.isRunning = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
  }

  public resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.clock.start();
      this.loop();
    }
  }

  private loop = () => {
    if (!this.isRunning) return;

    let delta = this.clock.getDelta();
    // Clamp delta
    delta = Math.min(delta, 0.05);

    // Hitstop freeze frame handling
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= delta;
      // Still render the frozen frame with camera shake
      this.updateCamera(0);
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(this.loop);
      return;
    }

    this.update(delta);
    this.renderer.render(this.scene, this.camera);

    this.frameId = requestAnimationFrame(this.loop);
  };

  private update(delta: number) {
    // 1. Match timer in fight mode
    if (this.roundState === 'fight') {
      if (this.mode !== 'training') {
        this.matchTimer -= delta;
        if (this.matchTimer <= 0) {
          this.matchTimer = 0;
          this.handleTimeOver();
        }
      }

      // Update Player continuous inputs
      this.updatePlayerMovement(delta);

      // Update AI
      this.ai.update(delta, this.p2, this.p1, (action, move) => {
        ReplayRecorder.getInstance().recordInput(
          'p2', 
          'action', 
          action.replace('attack_', '').toUpperCase(), 
          'AI'
        );
        this.executeAction(this.p2, this.p2Def, action);
      });
    }

    // 2. Physics & State updates for both fighters
    this.updateAIMovement(delta);
    this.updateFighterPhysics(this.p1, this.p1Def, delta);
    this.updateFighterPhysics(this.p2, this.p2Def, delta);

    // Keep fighters from passing through one another or occupying the same space.
    const minimumSeparation = 0.82;
    const horizontalGap = this.p2.position.x - this.p1.position.x;
    if (Math.abs(horizontalGap) < minimumSeparation) {
      const direction = horizontalGap >= 0 ? 1 : -1;
      const correction = (minimumSeparation - Math.abs(horizontalGap)) * 0.5;
      this.p1.position.x -= direction * correction;
      this.p2.position.x += direction * correction;
    }

    // 3. Keep facing each other unless locked in forward attack
    if (!this.p1.action.startsWith('attack_')) {
      this.p1.facing = this.p1.position.x <= this.p2.position.x ? 1 : -1;
    }
    if (!this.p2.action.startsWith('attack_')) {
      this.p2.facing = this.p2.position.x <= this.p1.position.x ? 1 : -1;
    }

    // 4. Hitbox & Hurtbox Collision Detection
    this.checkHitboxes(this.p1, this.p1Def, this.p2, this.p2Model);
    this.checkHitboxes(this.p2, this.p2Def, this.p1, this.p1Model);

    // 5. Update Models 3D transforms & skeletal poses
    this.p1Model.group.position.set(this.p1.position.x, this.p1.position.y, this.p1.position.z);
    this.p1Model.update(delta, this.p1.action, this.p1.actionTimer, this.p1.actionDuration, this.p1.facing);

    this.p2Model.group.position.set(this.p2.position.x, this.p2.position.y, this.p2.position.z);
    this.p2Model.update(delta, this.p2.action, this.p2.actionTimer, this.p2.actionDuration, this.p2.facing);

    // 6. Arena & Particles
    this.arena.update(delta);
    this.updateParticles(delta);

    // 7. Dynamic Camera Tracking
    this.updateCamera(delta);

    // 8. Capture frame for Replay
    ReplayRecorder.getInstance().captureFrame(
      this.p1,
      this.p2,
      Math.ceil(this.matchTimer),
      this.currentRound,
      this.roundState,
      this.currentAnnouncement
    );

    // 9. Call UI callback
    this.callbacks.onStateUpdate(
      this.p1, 
      this.p2, 
      Math.ceil(this.matchTimer), 
      this.currentRound, 
      this.roundState
    );
  }

  private updatePlayerMovement(delta: number) {
    if (this.p1.isHitStunned || this.p1.action.startsWith('attack_')) return;

    const moveSpeed = 4.2 * (this.p1Def.stats.speed / 8);

    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) {
      // If moving away from opponent, guard!
      if (this.p1.facing === 1) {
        this.p1.action = 'walk_backward';
        this.p1.isBlocking = true;
      } else {
        this.p1.action = 'walk_forward';
        this.p1.isBlocking = false;
      }
      this.p1.position.x -= moveSpeed * delta;
    } else if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) {
      if (this.p1.facing === 1) {
        this.p1.action = 'walk_forward';
        this.p1.isBlocking = false;
      } else {
        this.p1.action = 'walk_backward';
        this.p1.isBlocking = true;
      }
      this.p1.position.x += moveSpeed * delta;
    } else if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) {
      this.p1.action = 'crouch';
      this.p1.isBlocking = true;
    } else if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) {
      if (this.p1.isGrounded) {
        this.p1.velocity.y = 8.8;
        this.p1.isGrounded = false;
        this.p1.action = 'jump';
      }
    } else if (this.p1.isGrounded) {
      this.p1.action = 'idle';
      this.p1.isBlocking = false;
    }
  }

  /** Move the CPU fighter every frame; AI decisions only choose its intent. */
  private updateAIMovement(delta: number) {
    const ai = this.p2;
    if (ai.isHitStunned || ai.action.startsWith('attack_') ||
        ai.action === 'knockdown' || ai.action === 'getup' ||
        ai.action === 'victory' || ai.action === 'defeat') return;

    const speed = 3.6 * (this.p2Def.stats.speed / 8);
    if (ai.action === 'walk_forward') {
      ai.position.x += ai.facing * speed * delta;
      ai.isBlocking = false;
    } else if (ai.action === 'walk_backward') {
      ai.position.x -= ai.facing * speed * delta;
      ai.isBlocking = true;
    } else if (ai.action === 'block' || ai.action === 'crouch') {
      ai.isBlocking = true;
    } else if (ai.action === 'idle') {
      ai.isBlocking = false;
    }
  }

  private updateFighterPhysics(entity: CombatEntity, def: FighterDefinition, delta: number) {
    // Gravity & Jump Arc
    if (!entity.isGrounded) {
      entity.velocity.y -= 22 * delta;
      entity.position.y += entity.velocity.y * delta;
      if (entity.position.y <= 0) {
        entity.position.y = 0;
        entity.velocity.y = 0;
        entity.isGrounded = true;
        if (entity.action === 'jump' || entity.action === 'attack_air') {
          entity.action = 'idle';
        }
      }
    }

    // Advance Action Timer
    if (entity.action.startsWith('attack_')) {
      entity.actionTimer += delta;
      if (entity.actionTimer >= entity.actionDuration) {
        entity.action = 'idle';
        entity.currentMove = null;
        entity.hasHitThisAttack = false;
      }
    }

    // Stun decay
    if (entity.isHitStunned) {
      entity.hitStunTimer -= delta;
      if (entity.hitStunTimer <= 0) {
        entity.isHitStunned = false;
        entity.action = 'idle';
      }
    }

    // Knockdown & getup
    if (entity.action === 'knockdown') {
      entity.actionTimer += delta;
      if (entity.actionTimer >= 0.8) {
        if (entity.hp > 0) {
          entity.action = 'getup';
          entity.actionTimer = 0;
          entity.actionDuration = 0.4;
        } else {
          entity.action = 'defeat';
        }
      }
    } else if (entity.action === 'getup') {
      entity.actionTimer += delta;
      if (entity.actionTimer >= entity.actionDuration) {
        entity.action = 'idle';
      }
    }

    // Combo timer decay
    if (entity.comboTimer > 0) {
      entity.comboTimer -= delta;
      if (entity.comboTimer <= 0) {
        entity.comboCount = 0;
        entity.comboDamage = 0;
      }
    }

    // Arena Bounds clamping
    const arenaBound = 6.2;
    entity.position.x = Math.max(-arenaBound, Math.min(arenaBound, entity.position.x));
  }

  private checkHitboxes(
    attacker: CombatEntity, 
    attackerDef: FighterDefinition, 
    defender: CombatEntity, 
    defenderModel: FighterModel
  ) {
    const move = attacker.currentMove;
    if (!move || attacker.hasHitThisAttack) return;

    // Check if attack is in active hit window
    if (attacker.actionTimer >= move.hitFrameTime && attacker.actionTimer <= move.hitFrameTime + 0.16) {
      // Calculate active strike position
      const hitX = attacker.position.x + attacker.facing * move.hitboxOffset.x;
      const hitY = attacker.position.y + move.hitboxOffset.y;

      // Defender hurtbox center
      const hurtX = defender.position.x;
      const hurtY = defender.position.y + 1.1;

      const dist = Math.hypot(hitX - hurtX, hitY - hurtY);

      if (dist <= move.hitboxRadius) {
        attacker.hasHitThisAttack = true;

        const isBlocked = defender.isBlocking || 
          (defender.action === 'walk_backward' && defender.isGrounded);

        if (isBlocked) {
          // Block deflection
          const chipDmg = Math.max(1, Math.round(move.damage * 0.15));
          defender.hp = Math.max(0, defender.hp - chipDmg);
          defender.position.x += attacker.facing * (move.knockback * 0.3);
          soundEngine.playBlock();
          this.spawnHitSparks(hitX, hitY, '#38bdf8');
          attacker.energy = Math.min(100, attacker.energy + 4);

          ReplayRecorder.getInstance().recordHit({
            type: move.type,
            x: hitX,
            y: hitY,
            color: '#38bdf8',
            isBlocked: true,
            damage: chipDmg,
          });
        } else {
          // Full Impact Hit!
          attacker.comboCount += 1;
          attacker.comboTimer = 1.3;
          const comboScale = Math.max(0.7, 1.0 - (attacker.comboCount - 1) * 0.08);
          const rawDamage = Math.round(move.damage * (attackerDef.stats.power / 8) * comboScale);
          const finalDamage = Math.max(2, Math.round(rawDamage / (defender.isPlayer ? 1 : 1)));

          defender.hp = Math.max(0, defender.hp - finalDamage);
          attacker.comboDamage += finalDamage;

          // Gain energy
          attacker.energy = Math.min(100, attacker.energy + move.energyGain);
          defender.energy = Math.min(100, defender.energy + move.energyGain * 0.5);

          // Knockback
          defender.position.x += attacker.facing * move.knockback;

          // Sound & Feedback
          soundEngine.playHit(move.type === 'special' ? 'heavy' : move.type);
          defenderModel.triggerHitFlash();
          this.spawnHitSparks(
            hitX, 
            hitY, 
            move.type === 'special' ? attackerDef.primaryColor : '#facc15'
          );

          ReplayRecorder.getInstance().recordHit({
            type: move.type,
            x: hitX,
            y: hitY,
            color: move.type === 'special' ? attackerDef.primaryColor : '#facc15',
            isBlocked: false,
            damage: finalDamage,
          });

          // Hitstop
          this.hitstopTimer = move.type === 'heavy' ? 0.06 :
                             move.type === 'special' ? 0.08 : 0.035;
          this.cameraShakeIntensity = move.type === 'special' ? 0.45 :
                                      move.type === 'heavy' ? 0.28 : 0.12;

          // Defender reaction state
          if (defender.hp <= 0) {
            this.handleKnockout(attacker, defender);
          } else if (move.type === 'heavy' || move.type === 'special' || !defender.isGrounded) {
            defender.action = 'knockdown';
            defender.actionTimer = 0;
            defender.isHitStunned = true;
            defender.hitStunTimer = move.staggerTime + 0.4;
          } else {
            defender.action = move.type === 'light' ? 'hit_light' : 'hit_heavy';
            defender.actionTimer = 0;
            defender.actionDuration = move.staggerTime;
            defender.isHitStunned = true;
            defender.hitStunTimer = move.staggerTime;
          }
        }
      }
    }
  }

  private handleKnockout(winner: CombatEntity, loser: CombatEntity) {
    this.roundState = 'ko';
    soundEngine.stopArcadeMusic();
    soundEngine.playRoundAnnounce('ko');
    this.callbacks.onAnnounce('K.O. !', `${winner.name} REMPORTE LE ROUND !`);

    loser.action = 'defeat';
    winner.action = 'victory';

    setTimeout(() => {
      winner.roundsWon += 1;
      if (winner.roundsWon >= 2) {
        this.roundState = 'match_end';
        const isPlayerWin = winner.isPlayer;
        ReplayRecorder.getInstance().finalizeMatch(
          winner.id,
          isPlayerWin,
          this.p1.roundsWon,
          this.p2.roundsWon
        );
        this.callbacks.onMatchEnd(winner.id, isPlayerWin);
      } else {
        // Next round
        this.currentRound += 1;
        this.p1.hp = 100;
        this.p2.hp = 100;
        this.p1.position.x = -2.5;
        this.p2.position.x = 2.5;
        this.p1.action = 'idle';
        this.p2.action = 'idle';
        this.p1Model.group.rotation.x = 0;
        this.p2Model.group.rotation.x = 0;
        this.startRoundIntro();
      }
    }, 2800);
  }

  private handleTimeOver() {
    this.roundState = 'ko';
    soundEngine.stopArcadeMusic();
    const p1Win = this.p1.hp > this.p2.hp;
    const winner = p1Win ? this.p1 : this.p2;
    const loser = p1Win ? this.p2 : this.p1;

    this.callbacks.onAnnounce('TEMPS ÉCOULÉ !', `${winner.name} L’EMPORTE AUX POINTS`);
    loser.action = 'defeat';
    winner.action = 'victory';

    setTimeout(() => {
      winner.roundsWon += 1;
      if (winner.roundsWon >= 2) {
        this.roundState = 'match_end';
        ReplayRecorder.getInstance().finalizeMatch(
          winner.id,
          winner.isPlayer,
          this.p1.roundsWon,
          this.p2.roundsWon
        );
        this.callbacks.onMatchEnd(winner.id, winner.isPlayer);
      } else {
        this.currentRound += 1;
        this.p1.hp = 100;
        this.p2.hp = 100;
        this.p1.position.x = -2.5;
        this.p2.position.x = 2.5;
        this.p1.action = 'idle';
        this.p2.action = 'idle';
        this.startRoundIntro();
      }
    }, 2500);
  }

  private spawnHitSparks(x: number, y: number, colorHex: string) {
    const sparkCount = 8;
    const col = new THREE.Color(colorHex);

    for (let i = 0; i < sparkCount; i++) {
      const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.05, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + 1.5,
        (Math.random() - 0.5) * 2
      );

      this.scene.add(mesh);
      this.activeParticles.push({
        mesh,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.15,
        vel,
      });
    }
  }

  private updateParticles(delta: number) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.activeParticles.splice(i, 1);
      } else {
        p.mesh.position.addScaledVector(p.vel, delta);
        p.vel.y -= 9.8 * delta; // particle gravity
        const scale = 1 - p.life / p.maxLife;
        p.mesh.scale.setScalar(scale);
      }
    }
  }

  private updateCamera(delta: number) {
    // Dynamic tracking: midpoint between fighters
    const midX = (this.p1.position.x + this.p2.position.x) / 2;
    const dist = Math.abs(this.p1.position.x - this.p2.position.x);

    // Target camera position
    const targetZ = Math.max(5.8, Math.min(8.6, 5.0 + dist * 0.38));
    const targetX = midX * 0.6;
    const targetY = 2.1 + Math.max(this.p1.position.y, this.p2.position.y) * 0.25;

    // Camera damping
    this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;

    // Apply Camera Shake
    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 1.8);
    }

    this.camera.lookAt(midX * 0.8, 1.4, 0);
  }

  public handleResize() {
    if (!this.canvasMount) return;
    const w = this.canvasMount.clientWidth;
    const h = this.canvasMount.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public resetMatch() {
    this.p1.hp = 100;
    this.p2.hp = 100;
    this.p1.energy = 25;
    this.p2.energy = 25;
    this.p1.roundsWon = 0;
    this.p2.roundsWon = 0;
    this.currentRound = 1;
    this.p1.position.x = -2.5;
    this.p2.position.x = 2.5;
    this.p1.action = 'idle';
    this.p2.action = 'idle';
    this.startRoundIntro();
  }

  public dispose() {
    this.isRunning = false;
    soundEngine.stopArcadeMusic();
    if (this.frameId) cancelAnimationFrame(this.frameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);

    this.activeParticles.forEach(p => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });

    this.p1Model.dispose();
    this.p2Model.dispose();
    this.arena.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
