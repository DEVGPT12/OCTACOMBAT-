import * as THREE from 'three';
import { ArenaDefinition } from '../../types/combat';

/**
 * Procedural 3D Arena Builder
 * Constructs rich, stylized fighting environments with dynamic PBR lighting,
 * neon architectural landmarks, and zero external asset dependencies.
 */
export class ArenaBuilder {
  public group: THREE.Group;
  public arenaDef: ArenaDefinition;
  private disposables: (THREE.Material | THREE.BufferGeometry | THREE.Texture)[] = [];
  public dynamicLights: THREE.Light[] = [];
  public particleSystem: THREE.Points | null = null;

  constructor(arenaDef: ArenaDefinition) {
    this.arenaDef = arenaDef;
    this.group = new THREE.Group();
    this.build();
  }

  private build() {
    this.buildGround();
    this.buildLighting();

    switch (this.arenaDef.id) {
      case 'temple':
        this.buildTempleArena();
        break;
      case 'city':
        this.buildCityArena();
        break;
      case 'cyberbase':
        this.buildCyberBaseArena();
        break;
      case 'volcano':
        this.buildVolcanoArena();
        break;
    }

    this.buildAtmosphericParticles();
  }

  private buildGround() {
    // 1. Procedural Octagon Arena Texture on Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Base ground tile
      ctx.fillStyle = this.arenaDef.id === 'volcano' ? '#1c1917' :
                      this.arenaDef.id === 'cyberbase' ? '#0f172a' :
                      this.arenaDef.id === 'city' ? '#111827' : '#18181b';
      ctx.fillRect(0, 0, 1024, 1024);

      // Grid tiles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 1024; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1024);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1024, i);
        ctx.stroke();
      }

      // Iconic OCTACOMBAT Octagonal Combat Ring
      ctx.save();
      ctx.translate(512, 512);
      ctx.strokeStyle = this.arenaDef.id === 'volcano' ? '#f97316' :
                        this.arenaDef.id === 'cyberbase' ? '#06b6d4' :
                        this.arenaDef.id === 'city' ? '#ec4899' : '#ef4444';
      ctx.lineWidth = 14;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 24;

      ctx.beginPath();
      const radius = 380;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 - Math.PI / 8;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner subtle Octagon ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const innerRadius = 240;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 - Math.PI / 8;
        const x = innerRadius * Math.cos(angle);
        const y = innerRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Center Octacombat Logo Symbol
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OCTACOMBAT', 0, 0);

      ctx.restore();
    }

    const groundTex = new THREE.CanvasTexture(canvas);
    groundTex.colorSpace = THREE.SRGBColorSpace;
    this.disposables.push(groundTex);

    const groundGeo = new THREE.PlaneGeometry(36, 36);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.65,
      metalness: 0.25,
    });
    this.disposables.push(groundGeo, groundMat);

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  private buildLighting() {
    // 1. Cool / Warm Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(
      this.arenaDef.skyColor,
      this.arenaDef.groundColor,
      0.65
    );
    this.group.add(hemiLight);

    // 2. Key Directional Shadow Light (Red/Warm Tone)
    const keyLight = new THREE.DirectionalLight(this.arenaDef.keyLight, 2.2);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.bias = -0.0005;
    this.group.add(keyLight);
    this.dynamicLights.push(keyLight);

    // 3. Accent Rim Light (Cool/Electric Cyan/Blue)
    const rimLight = new THREE.DirectionalLight(this.arenaDef.accentLight, 1.8);
    rimLight.position.set(-8, 9, -6);
    this.group.add(rimLight);
    this.dynamicLights.push(rimLight);
  }

  private buildTempleArena() {
    // Neo-Tokyo Torii Gate
    const toriiMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.35,
      metalness: 0.4,
      emissive: 0x991b1b,
      emissiveIntensity: 0.2,
    });
    this.disposables.push(toriiMat);

    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.4, 9, 12);
    this.disposables.push(pillarGeo);

    const leftPillar = new THREE.Mesh(pillarGeo, toriiMat);
    leftPillar.position.set(-6, 4.5, -8);
    leftPillar.castShadow = true;
    this.group.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, toriiMat);
    rightPillar.position.set(6, 4.5, -8);
    rightPillar.castShadow = true;
    this.group.add(rightPillar);

    // Top beams
    const beamGeo = new THREE.BoxGeometry(15, 0.7, 0.8);
    this.disposables.push(beamGeo);
    const mainBeam = new THREE.Mesh(beamGeo, toriiMat);
    mainBeam.position.set(0, 8.8, -8);
    this.group.add(mainBeam);

    const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(13, 0.45, 0.6), toriiMat);
    lowerBeam.position.set(0, 7.5, -8);
    this.group.add(lowerBeam);

    // Giant Glowing Moon in Backdrop
    const moonGeo = new THREE.CircleGeometry(6, 32);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    this.disposables.push(moonGeo, moonMat);
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(0, 14, -18);
    this.group.add(moon);

    // Cherry Blossom Trees (Left & Right)
    this.buildCherryBlossomTree(-9, -4);
    this.buildCherryBlossomTree(9, -4);

    // Japanese Lanterns with Point Lights
    [-4, 4].forEach(x => {
      const lanternGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xff2222,
        emissive: 0xff2222,
        emissiveIntensity: 0.8,
      });
      this.disposables.push(lanternGeo, lanternMat);
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(x, 4, -7.8);
      this.group.add(lantern);

      const pLight = new THREE.PointLight(0xff3333, 1.5, 6);
      pLight.position.set(x, 3.8, -7.5);
      this.group.add(pLight);
      this.dynamicLights.push(pLight);
    });
  }

  private buildCherryBlossomTree(x: number, z: number) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.25,
      roughness: 0.7,
    });
    this.disposables.push(trunkMat, foliageMat);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 5, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 2.5, z);
    this.group.add(trunk);

    // Foliage clusters
    for (let i = 0; i < 4; i++) {
      const clusterGeo = new THREE.SphereGeometry(1.4 + Math.random() * 0.4, 8, 8);
      const cluster = new THREE.Mesh(clusterGeo, foliageMat);
      cluster.position.set(
        x + (Math.random() - 0.5) * 1.5,
        4.5 + Math.random() * 1.5,
        z + (Math.random() - 0.5) * 1.5
      );
      this.group.add(cluster);
    }
  }

  private buildCityArena() {
    // Cyberpunk towers with glowing neon windows
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.6 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    this.disposables.push(buildingMat, windowMat);

    for (let i = -4; i <= 4; i++) {
      const h = 12 + Math.abs(i) * 3;
      const bGeo = new THREE.BoxGeometry(3.5, h, 4);
      const bMesh = new THREE.Mesh(bGeo, buildingMat);
      bMesh.position.set(i * 4.2, h / 2, -12);
      this.group.add(bMesh);

      // Neon sign on top
      const signMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xec4899 : 0x3b82f6,
      });
      this.disposables.push(signMat);
      const signGeo = new THREE.BoxGeometry(2.8, 0.4, 0.2);
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(i * 4.2, h - 1, -9.8);
      this.group.add(sign);
    }
  }

  private buildCyberBaseArena() {
    // High-tech hangar arches & glowing core
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    this.disposables.push(metalMat, neonCyan);

    for (let z = -10; z <= 6; z += 5) {
      const archGeo = new THREE.TorusGeometry(8, 0.35, 8, 24, Math.PI);
      const arch = new THREE.Mesh(archGeo, metalMat);
      arch.position.set(0, 0, z);
      this.group.add(arch);

      const stripGeo = new THREE.TorusGeometry(8.1, 0.08, 6, 24, Math.PI);
      const strip = new THREE.Mesh(stripGeo, neonCyan);
      strip.position.set(0, 0, z);
      this.group.add(strip);
    }
  }

  private buildVolcanoArena() {
    // Magma crags & glowing fissures
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
    const magmaMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    this.disposables.push(rockMat, magmaMat);

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = 11 * Math.cos(angle);
      const z = 11 * Math.sin(angle);
      const cragGeo = new THREE.ConeGeometry(2, 6 + Math.random() * 3, 6);
      const crag = new THREE.Mesh(cragGeo, rockMat);
      crag.position.set(x, 2, z);
      this.group.add(crag);
    }
  }

  private buildAtmosphericParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.disposables.push(geometry);

    const pColor = this.arenaDef.id === 'temple' ? 0xf472b6 : // Cherry blossom petals
                   this.arenaDef.id === 'volcano' ? 0xf97316 : // Embers
                   0x38bdf8; // Neon dust

    const material = new THREE.PointsMaterial({
      color: pColor,
      size: 0.15,
      transparent: true,
      opacity: 0.65,
    });
    this.disposables.push(material);

    this.particleSystem = new THREE.Points(geometry, material);
    this.group.add(this.particleSystem);
  }

  public update(delta: number) {
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= delta * 0.8; // gently fall
        positions[i] += Math.sin(Date.now() * 0.001 + i) * delta * 0.3; // drift
        if (positions[i + 1] < 0) {
          positions[i + 1] = 12;
        }
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
  }

  public dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}
