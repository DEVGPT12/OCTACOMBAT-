import * as THREE from 'three';
import { 
  MatchReplayData, 
  ReplayFrame, 
  ReplayInputEvent,
  FighterDefinition,
  ArenaDefinition
} from '../../types/combat';
import { FIGHTERS, ARENAS } from '../constants';
import { FighterModel } from './FighterModel';
import { ArenaBuilder } from './ArenaBuilder';
import { soundEngine } from '../../audio/soundEngine';

export interface ReplayEngineCallbacks {
  onFrameUpdate: (
    frame: ReplayFrame, 
    frameIdx: number, 
    totalFrames: number, 
    progress: number, 
    recentInputs: ReplayInputEvent[]
  ) => void;
  onReplayComplete: () => void;
}

export class ReplayEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private canvasMount: HTMLDivElement;

  public replayData: MatchReplayData;
  public p1Def: FighterDefinition;
  public p2Def: FighterDefinition;
  public arenaDef: ArenaDefinition;

  public p1Model: FighterModel;
  public p2Model: FighterModel;
  public arena: ArenaBuilder;

  private isPlaying: boolean = true;
  private currentFrameIndex: number = 0;
  private playbackSpeed: number = 1.0; // 0.5, 1.0, 2.0
  private frameId: number = 0;
  private lastTime: number = 0;
  private subFrameTime: number = 0;

  private callbacks: ReplayEngineCallbacks;
  private activeParticles: { mesh: THREE.Mesh; life: number; maxLife: number; vel: THREE.Vector3 }[] = [];

  constructor(
    canvasMount: HTMLDivElement,
    replayData: MatchReplayData,
    callbacks: ReplayEngineCallbacks
  ) {
    this.canvasMount = canvasMount;
    this.replayData = replayData;
    this.callbacks = callbacks;

    this.p1Def = FIGHTERS[replayData.p1Id];
    this.p2Def = FIGHTERS[replayData.p2Id];
    this.arenaDef = ARENAS[replayData.arenaId];

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.arenaDef.skyColor);
    this.scene.fog = new THREE.Fog(this.arenaDef.fogColor, 12, 38);

    const aspect = canvasMount.clientWidth / canvasMount.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 2.2, 7.8);

    // 2. WebGL Renderer
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

    // 3. 3D Arena and Fighter models
    this.arena = new ArenaBuilder(this.arenaDef);
    this.scene.add(this.arena.group);

    this.p1Model = new FighterModel(this.p1Def, true);
    this.p2Model = new FighterModel(this.p2Def, false);
    this.scene.add(this.p1Model.group);
    this.scene.add(this.p2Model.group);

    this.applyFrame(0);
    this.startLoop();
  }

  public setPlaying(play: boolean) {
    this.isPlaying = play;
  }

  public togglePlay(): boolean {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  public setSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  public getSpeed(): number {
    return this.playbackSpeed;
  }

  public seekProgress(progress: number) {
    if (!this.replayData.frames.length) return;
    const targetIdx = Math.floor(progress * (this.replayData.frames.length - 1));
    this.seekIndex(targetIdx);
  }

  public seekIndex(index: number) {
    const clamped = Math.max(0, Math.min(this.replayData.frames.length - 1, index));
    this.currentFrameIndex = clamped;
    this.subFrameTime = 0;
    this.applyFrame(clamped, false);
  }

  public stepFrame(direction: 1 | -1) {
    this.isPlaying = false;
    this.seekIndex(this.currentFrameIndex + direction);
  }

  private startLoop() {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop = () => {
    const now = performance.now();
    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    delta = Math.min(delta, 0.05);

    if (this.isPlaying && this.replayData.frames.length > 0) {
      // Nominal frame duration at 30fps = 0.0333s
      const frameDuration = 0.0333 / this.playbackSpeed;
      this.subFrameTime += delta;

      while (this.subFrameTime >= frameDuration) {
        this.subFrameTime -= frameDuration;
        this.currentFrameIndex++;

        if (this.currentFrameIndex >= this.replayData.frames.length) {
          this.currentFrameIndex = this.replayData.frames.length - 1;
          this.isPlaying = false;
          this.callbacks.onReplayComplete();
          break;
        }

        this.applyFrame(this.currentFrameIndex, true);
      }
    }

    this.arena.update(delta);
    this.updateParticles(delta);
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);

    this.frameId = requestAnimationFrame(this.loop);
  };

  private applyFrame(index: number, triggerAudio: boolean = false) {
    const frame = this.replayData.frames[index];
    if (!frame) return;

    // Apply P1 Transform & Animation
    this.p1Model.group.position.set(frame.p1.x, frame.p1.y, 0);
    this.p1Model.update(
      0.033, 
      frame.p1.action, 
      frame.p1.actionTimer, 
      frame.p1.actionDuration, 
      frame.p1.facing
    );

    // Apply P2 Transform & Animation
    this.p2Model.group.position.set(frame.p2.x, frame.p2.y, 0);
    this.p2Model.update(
      0.033, 
      frame.p2.action, 
      frame.p2.actionTimer, 
      frame.p2.actionDuration, 
      frame.p2.facing
    );

    // Sound & Hit FX on recorded hit events
    if (triggerAudio && frame.hit) {
      if (frame.hit.isBlocked) {
        soundEngine.playBlock();
        this.spawnHitSparks(frame.hit.x, frame.hit.y, '#38bdf8');
      } else {
        const hitType = frame.hit.type === 'special' ? 'heavy' : frame.hit.type;
        soundEngine.playHit(hitType);
        if (frame.hit.type === 'special') {
          soundEngine.playSpecial(this.p1Def.id);
        }
        this.spawnHitSparks(frame.hit.x, frame.hit.y, frame.hit.color || '#facc15');
        if (frame.hit.type === 'heavy' || frame.hit.type === 'special') {
          this.p2Model.triggerHitFlash();
          this.p1Model.triggerHitFlash();
        }
      }
    }

    // Recent Inputs around this timestamp
    const t = frame.timestamp;
    const recentInputs = this.replayData.inputLog.filter(
      (inp) => inp.time >= t - 2.5 && inp.time <= t + 0.1
    );

    const progress = this.replayData.frames.length > 1
      ? index / (this.replayData.frames.length - 1)
      : 0;

    this.callbacks.onFrameUpdate(
      frame,
      index,
      this.replayData.frames.length,
      progress,
      recentInputs
    );
  }

  private updateCamera() {
    const frame = this.replayData.frames[this.currentFrameIndex];
    if (!frame) return;

    const midX = (frame.p1.x + frame.p2.x) / 2;
    const dist = Math.abs(frame.p1.x - frame.p2.x);

    const targetZ = Math.max(6.8, Math.min(9.8, 5.8 + dist * 0.45));
    const targetX = midX * 0.6;
    const targetY = 2.1 + Math.max(frame.p1.y, frame.p2.y) * 0.25;

    this.camera.position.x += (targetX - this.camera.position.x) * 0.15;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.15;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.15;
    this.camera.lookAt(midX * 0.8, 1.4, 0);
  }

  private spawnHitSparks(x: number, y: number, colorHex: string) {
    const col = new THREE.Color(colorHex);
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.SphereGeometry(0.06, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + 1.2,
        (Math.random() - 0.5) * 1.5
      );

      this.scene.add(mesh);
      this.activeParticles.push({
        mesh,
        life: 0,
        maxLife: 0.22,
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
        p.vel.y -= 9.8 * delta;
        p.mesh.scale.setScalar(1 - p.life / p.maxLife);
      }
    }
  }

  public handleResize() {
    if (!this.canvasMount) return;
    const w = this.canvasMount.clientWidth;
    const h = this.canvasMount.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public dispose() {
    if (this.frameId) cancelAnimationFrame(this.frameId);

    this.activeParticles.forEach((p) => {
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
