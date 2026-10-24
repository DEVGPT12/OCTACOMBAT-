import * as THREE from 'three';
import { FighterDefinition, ActionState } from '../../types/combat';

/**
 * Procedural Articulated 3D Composite Fighter Model
 * Assembled from 10+ distinct structural parts with individual kinematics
 * and materials for authentic fighting animations.
 */
export class FighterModel {
  public group: THREE.Group;
  public fighterDef: FighterDefinition;
  public isPlayer: boolean;

  // Key joints for articulation
  private hips: THREE.Group;
  private spine: THREE.Group;
  private chest: THREE.Group;
  private head: THREE.Group;
  private leftShoulder: THREE.Group;
  private rightShoulder: THREE.Group;
  private leftElbow: THREE.Group;
  private rightElbow: THREE.Group;
  private leftHand: THREE.Group;
  private rightHand: THREE.Group;
  private leftHipJoint: THREE.Group;
  private rightHipJoint: THREE.Group;
  private leftKnee: THREE.Group;
  private rightKnee: THREE.Group;
  private shadowMesh: THREE.Mesh;
  private auraRing: THREE.Mesh | null = null;
  private specialAuraMesh: THREE.Mesh;

  // Materials list for disposal & hit flash
  private materials: THREE.Material[] = [];
  private baseColors: Map<THREE.MeshStandardMaterial, THREE.Color> = new Map();
  private isFlashing = false;
  private flashTimer = 0;

  constructor(fighterDef: FighterDefinition, isPlayer: boolean) {
    this.fighterDef = fighterDef;
    this.isPlayer = isPlayer;
    this.group = new THREE.Group();

    // 1. Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    this.group.add(this.shadowMesh);
    this.materials.push(shadowMat);

    // Color definitions
    const primaryCol = new THREE.Color(fighterDef.primaryColor);
    const secondaryCol = new THREE.Color(fighterDef.secondaryColor);
    const accentCol = new THREE.Color(fighterDef.accentColor);
    const skinCol = fighterDef.id === 'razor' ? new THREE.Color(0xb5815d) :
                     fighterDef.id === 'octav' ? new THREE.Color(0x8d5524) :
                     fighterDef.id === 'maya' ? new THREE.Color(0x9a6538) :
                     new THREE.Color(0xd7a27a);

    // Shared reusable PBR materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinCol,
      roughness: 0.65,
      metalness: 0.05,
    });
    const suitMat = new THREE.MeshStandardMaterial({
      color: secondaryCol,
      roughness: 0.8,
      metalness: 0.2,
    });
    const armorMat = new THREE.MeshStandardMaterial({
      color: primaryCol,
      roughness: 0.35,
      metalness: 0.7,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentCol,
      roughness: 0.2,
      metalness: 0.9,
      emissive: primaryCol,
      emissiveIntensity: 0.3,
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: primaryCol,
      roughness: 0.4,
      metalness: 0.5,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: secondaryCol.clone().multiplyScalar(0.7),
      roughness: 0.7,
      metalness: 0.3,
    });

    [skinMat, suitMat, armorMat, accentMat, gloveMat, bootMat].forEach(m => {
      this.materials.push(m);
      this.baseColors.set(m, m.color.clone());
    });

    // 2. Articulation Hierarchy
    this.hips = new THREE.Group();
    this.hips.position.y = 1.0;
    this.group.add(this.hips);

    // Pelvis mesh
    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.25, 8);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, suitMat);
    pelvisMesh.castShadow = true;
    this.hips.add(pelvisMesh);

    // Belt / Sash
    const beltGeo = new THREE.TorusGeometry(0.25, 0.04, 6, 12);
    const beltMesh = new THREE.Mesh(beltGeo, accentMat);
    beltMesh.rotation.x = Math.PI / 2;
    this.hips.add(beltMesh);

    // Spine & Torso
    this.spine = new THREE.Group();
    this.spine.position.y = 0.15;
    this.hips.add(this.spine);

    this.chest = new THREE.Group();
    this.chest.position.y = 0.25;
    this.spine.add(this.chest);

    // Chest mesh (torso)
    const chestGeo = new THREE.BoxGeometry(0.52, 0.45, 0.32);
    const chestMesh = new THREE.Mesh(chestGeo, suitMat);
    chestMesh.castShadow = true;
    this.chest.add(chestMesh);

    // Armor plate / Hoodie vest / Gi lapel
    const chestPlateGeo = new THREE.BoxGeometry(0.48, 0.38, 0.08);
    const chestPlateMesh = new THREE.Mesh(chestPlateGeo, armorMat);
    chestPlateMesh.position.z = 0.15;
    chestPlateMesh.castShadow = true;
    this.chest.add(chestPlateMesh);

    // Glowing Octagon Chest Emblem
    const emblemGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 8);
    const emblemMat = new THREE.MeshStandardMaterial({
      color: primaryCol,
      emissive: primaryCol,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });
    this.materials.push(emblemMat);
    const emblemMesh = new THREE.Mesh(emblemGeo, emblemMat);
    emblemMesh.rotation.x = Math.PI / 2;
    emblemMesh.position.set(0, 0.06, 0.2);
    this.chest.add(emblemMesh);

    // Head & Neck
    this.head = new THREE.Group();
    this.head.position.y = 0.38;
    this.chest.add(this.head);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.12, 8);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    this.head.add(neckMesh);

    // Head base
    const headGeo = new THREE.SphereGeometry(0.18, 12, 10);
    headGeo.scale(1, 1.15, 1.05);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 0.16;
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Facial features: readable eyes, brow ridge and jaw detail improve the
    // silhouette at the normal fight-camera distance.
    const faceDarkMat = new THREE.MeshStandardMaterial({
      color: 0x171923, roughness: 0.45, metalness: 0.15,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: accentCol, emissive: accentCol, emissiveIntensity: 0.65,
      roughness: 0.25, metalness: 0.2,
    });
    const browGeo = new THREE.BoxGeometry(0.095, 0.025, 0.035);
    const eyeGeo = new THREE.SphereGeometry(0.018, 8, 6);
    for (const side of [-1, 1]) {
      const brow = new THREE.Mesh(browGeo, faceDarkMat);
      brow.position.set(side * 0.065, 0.205, 0.157);
      brow.rotation.z = side * -0.12;
      this.head.add(brow);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(side * 0.064, 0.17, 0.169);
      this.head.add(eye);
    }
    this.materials.push(faceDarkMat, eyeMat);

    // Layered collar and diagonal chest harness give each fighter a stronger,
    // less toy-like combat silhouette while retaining their palette.
    const collarGeo = new THREE.CylinderGeometry(0.13, 0.16, 0.11, 8);
    const collar = new THREE.Mesh(collarGeo, armorMat);
    collar.position.set(0, 0.28, 0);
    this.chest.add(collar);

    const strapGeo = new THREE.BoxGeometry(0.075, 0.42, 0.045);
    const strap = new THREE.Mesh(strapGeo, accentMat);
    strap.position.set(0.13, 0.015, 0.19);
    strap.rotation.z = -0.35;
    strap.rotation.y = -0.12;
    this.chest.add(strap);

    // Distinct character accessories / hair
    this.buildCharacterHeadgear(primaryCol, secondaryCol, accentCol);

    // Arms - Left & Right
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(0.35, 0.18, 0);
    this.chest.add(this.leftShoulder);

    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(-0.35, 0.18, 0);
    this.chest.add(this.rightShoulder);

    this.leftElbow = this.buildArm(this.leftShoulder, 1, skinMat, armorMat, gloveMat);
    this.rightElbow = this.buildArm(this.rightShoulder, -1, skinMat, armorMat, gloveMat);

    // Store hands for animation
    this.leftHand = this.leftElbow.children[1] as THREE.Group;
    this.rightHand = this.rightElbow.children[1] as THREE.Group;

    // Legs - Left & Right
    this.leftHipJoint = new THREE.Group();
    this.leftHipJoint.position.set(0.16, -0.1, 0);
    this.hips.add(this.leftHipJoint);

    this.rightHipJoint = new THREE.Group();
    this.rightHipJoint.position.set(-0.16, -0.1, 0);
    this.hips.add(this.rightHipJoint);

    this.leftKnee = this.buildLeg(this.leftHipJoint, suitMat, armorMat, bootMat);
    this.rightKnee = this.buildLeg(this.rightHipJoint, suitMat, armorMat, bootMat);

    // Special move aura effect sphere
    const auraGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: primaryCol,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    this.materials.push(auraMat);
    this.specialAuraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.specialAuraMesh.position.y = 1.0;
    this.group.add(this.specialAuraMesh);
  }

  private buildCharacterHeadgear(primaryCol: THREE.Color, secondaryCol: THREE.Color, accentCol: THREE.Color) {
    const id = this.fighterDef.id;

    if (id === 'octav') {
      // Dreads & Red Hood trim
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
      this.materials.push(hairMat);
      for (let i = 0; i < 9; i++) {
        const dreadGeo = new THREE.CylinderGeometry(0.035, 0.02, 0.22, 5);
        const dread = new THREE.Mesh(dreadGeo, hairMat);
        const angle = (i / 9) * Math.PI * 1.5 - Math.PI * 0.75;
        dread.position.set(Math.sin(angle) * 0.16, 0.26, Math.cos(angle) * 0.14 - 0.02);
        dread.rotation.x = 0.2;
        dread.rotation.z = -Math.sin(angle) * 0.4;
        this.head.add(dread);
      }
      // Red martial headband
      const bandGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.05, 12);
      const bandMat = new THREE.MeshStandardMaterial({ color: primaryCol, roughness: 0.5 });
      this.materials.push(bandMat);
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.22;
      this.head.add(band);

    } else if (id === 'zen') {
      // Samurai topknot bun
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
      this.materials.push(hairMat);
      const bunGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const bun = new THREE.Mesh(bunGeo, hairMat);
      bun.position.set(0, 0.36, -0.08);
      this.head.add(bun);
      // Topknot ribbon
      const ribbonGeo = new THREE.BoxGeometry(0.04, 0.18, 0.02);
      const ribbonMat = new THREE.MeshStandardMaterial({ color: primaryCol, roughness: 0.4 });
      this.materials.push(ribbonMat);
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.position.set(0, 0.32, -0.14);
      ribbon.rotation.x = -0.3;
      this.head.add(ribbon);

    } else if (id === 'kai') {
      // Ninja cowl & face mask
      const cowlGeo = new THREE.SphereGeometry(0.2, 10, 10);
      const cowlMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });
      this.materials.push(cowlMat);
      const cowl = new THREE.Mesh(cowlGeo, cowlMat);
      cowl.position.y = 0.18;
      this.head.add(cowl);

      // Glowing red ninja eye slit
      const eyeVisorGeo = new THREE.BoxGeometry(0.24, 0.04, 0.05);
      const eyeMat = new THREE.MeshStandardMaterial({ color: primaryCol, emissive: primaryCol, emissiveIntensity: 1.2 });
      this.materials.push(eyeMat);
      const visor = new THREE.Mesh(eyeVisorGeo, eyeMat);
      visor.position.set(0, 0.18, 0.18);
      this.head.add(visor);

    } else if (id === 'luna') {
      // High purple ponytail
      const hairMat = new THREE.MeshStandardMaterial({ color: primaryCol, roughness: 0.4 });
      this.materials.push(hairMat);
      const ponyBase = new THREE.SphereGeometry(0.09, 8, 8);
      const pony = new THREE.Mesh(ponyBase, hairMat);
      pony.position.set(0, 0.32, -0.12);
      this.head.add(pony);

      const tailGeo = new THREE.CylinderGeometry(0.05, 0.02, 0.45, 6);
      const tail = new THREE.Mesh(tailGeo, hairMat);
      tail.position.set(0, 0.14, -0.25);
      tail.rotation.x = -0.6;
      this.head.add(tail);

    } else if (id === 'spectre') {
      // Deep dark cowl hood with glowing blue eyes
      const hoodGeo = new THREE.SphereGeometry(0.26, 12, 10);
      const hoodMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.95 });
      this.materials.push(hoodMat);
      const hood = new THREE.Mesh(hoodGeo, hoodMat);
      hood.position.y = 0.18;
      this.head.add(hood);

      // Piercing glowing cyan eyes
      const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      this.materials.push(eyeMat);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(0.07, 0.16, 0.19);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(-0.07, 0.16, 0.19);
      this.head.add(eyeL);
      this.head.add(eyeR);

      // Floating mystic ring behind
      const ringGeo = new THREE.TorusGeometry(0.65, 0.03, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
      this.materials.push(ringMat);
      this.auraRing = new THREE.Mesh(ringGeo, ringMat);
      this.auraRing.position.set(0, 0.1, -0.2);
      this.chest.add(this.auraRing);

    } else if (id === 'volt') {
      // Spiky anime cyberpunk hair & cyber eye implant
      const hairMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, emissive: 0xca8a04, emissiveIntensity: 0.4 });
      this.materials.push(hairMat);
      for (let i = 0; i < 7; i++) {
        const spikeGeo = new THREE.ConeGeometry(0.05, 0.22, 5);
        const spike = new THREE.Mesh(spikeGeo, hairMat);
        const a = (i / 7) * Math.PI - Math.PI / 2;
        spike.position.set(Math.sin(a) * 0.14, 0.32, Math.cos(a) * 0.1);
        spike.rotation.z = -Math.sin(a) * 0.6;
        spike.rotation.x = -0.3;
        this.head.add(spike);
      }
      // Glowing cyber visor
      const cyberVisorGeo = new THREE.BoxGeometry(0.2, 0.04, 0.06);
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      this.materials.push(visorMat);
      const cyberVisor = new THREE.Mesh(cyberVisorGeo, visorMat);
      cyberVisor.position.set(0, 0.16, 0.17);
      this.head.add(cyberVisor);

    } else {
      // Razor / Maya standard stylized hair
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1610, roughness: 0.85 });
      this.materials.push(hairMat);
      const capGeo = new THREE.SphereGeometry(0.19, 8, 8);
      const cap = new THREE.Mesh(capGeo, hairMat);
      cap.position.set(0, 0.19, -0.02);
      this.head.add(cap);
    }
  }

  private buildArm(
    parentShoulder: THREE.Group,
    side: number,
    skinMat: THREE.Material,
    armorMat: THREE.Material,
    gloveMat: THREE.Material
  ): THREE.Group {
    // Shoulder pauldron
    const pauldronGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const pauldron = new THREE.Mesh(pauldronGeo, armorMat);
    parentShoulder.add(pauldron);

    // Upper arm
    const upperArmGeo = new THREE.CylinderGeometry(0.075, 0.07, 0.32, 8);
    const upperArm = new THREE.Mesh(upperArmGeo, skinMat);
    upperArm.position.y = -0.16;
    upperArm.castShadow = true;
    parentShoulder.add(upperArm);

    // Elbow Joint
    const elbowJoint = new THREE.Group();
    elbowJoint.position.y = -0.32;
    parentShoulder.add(elbowJoint);

    // Forearm / Gauntlet
    const forearmGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.3, 8);
    const forearm = new THREE.Mesh(forearmGeo, armorMat);
    forearm.position.y = -0.15;
    forearm.castShadow = true;
    elbowJoint.add(forearm);

    // Clenched fist / boxing glove
    const fistJoint = new THREE.Group();
    fistJoint.position.y = -0.3;
    elbowJoint.add(fistJoint);

    const fistGeo = new THREE.BoxGeometry(0.12, 0.14, 0.12);
    const fist = new THREE.Mesh(fistGeo, gloveMat);
    fist.castShadow = true;
    fistJoint.add(fist);

    return elbowJoint;
  }

  private buildLeg(
    parentHip: THREE.Group,
    suitMat: THREE.Material,
    armorMat: THREE.Material,
    bootMat: THREE.Material
  ): THREE.Group {
    // Thigh
    const thighGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.45, 8);
    const thigh = new THREE.Mesh(thighGeo, suitMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    parentHip.add(thigh);

    // Knee joint
    const kneeJoint = new THREE.Group();
    kneeJoint.position.y = -0.45;
    parentHip.add(kneeJoint);

    // Shin / Knee guard
    const shinGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.44, 8);
    const shin = new THREE.Mesh(shinGeo, armorMat);
    shin.position.y = -0.22;
    shin.castShadow = true;
    kneeJoint.add(shin);

    // Combat Boot
    const bootGeo = new THREE.BoxGeometry(0.13, 0.14, 0.26);
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.set(0, -0.45, 0.06);
    boot.castShadow = true;
    kneeJoint.add(boot);

    return kneeJoint;
  }

  /**
   * Applies white hit flash on impacts for crisp fighting game feedback
   */
  public triggerHitFlash() {
    this.isFlashing = true;
    this.flashTimer = 0.09;
    this.materials.forEach(mat => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.color.setHex(0xffffff);
        mat.emissive.setHex(0xffffff);
        mat.emissiveIntensity = 0.8;
      }
    });
  }

  /**
   * Kinematic Posing & Smooth Animation Engine
   * Updates bone rotations, posture, and kinetic weight based on current fighter state
   */
  public update(delta: number, action: ActionState, timer: number, duration: number, facing: number) {
    // 1. Handle hit flash decay
    if (this.isFlashing) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.isFlashing = false;
        this.materials.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            const baseCol = this.baseColors.get(mat);
            if (baseCol) {
              mat.color.copy(baseCol);
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0;
            }
          }
        });
      }
    }

    // Facing direction
    this.group.rotation.y = facing === 1 ? Math.PI / 2 : -Math.PI / 2;

    // Ethereal rings rotation for Spectre
    if (this.auraRing) {
      this.auraRing.rotation.z += delta * 2;
    }

    // Normalized move progress [0..1]
    const progress = Math.min(1, Math.max(0, timer / Math.max(0.01, duration)));

    // Reset base positions
    this.hips.position.y = 1.0;
    this.hips.rotation.set(0, 0, 0);
    this.chest.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);

    // Default Martial Arts Guard Stance (Tekken / SF style)
    const breath = Math.sin(Date.now() * 0.005) * 0.03;
    const bounce = Math.abs(Math.sin(Date.now() * 0.006)) * 0.04;

    switch (action) {
      case 'idle': {
        this.hips.position.y = 1.0 - bounce;
        this.chest.position.y = 0.25 + breath;
        
        // Guard pose
        this.leftShoulder.rotation.set(0.6, 0.4, 0.2);
        this.leftElbow.rotation.set(-1.4, 0, 0);

        this.rightShoulder.rotation.set(0.8, -0.3, -0.3);
        this.rightElbow.rotation.set(-1.6, 0, 0);

        this.leftHipJoint.rotation.set(-0.15, 0.1, 0.05);
        this.leftKnee.rotation.set(0.3, 0, 0);

        this.rightHipJoint.rotation.set(0.1, -0.1, -0.05);
        this.rightKnee.rotation.set(0.2, 0, 0);
        break;
      }

      case 'walk_forward': {
        const walkCycle = Math.sin(Date.now() * 0.012);
        this.hips.position.y = 1.0 + Math.abs(walkCycle) * 0.05;
        this.chest.rotation.x = 0.1; // Forward lean

        this.leftHipJoint.rotation.set(-walkCycle * 0.6, 0, 0);
        this.leftKnee.rotation.set(Math.max(0, walkCycle * 0.7), 0, 0);

        this.rightHipJoint.rotation.set(walkCycle * 0.6, 0, 0);
        this.rightKnee.rotation.set(Math.max(0, -walkCycle * 0.7), 0, 0);

        this.leftShoulder.rotation.set(walkCycle * 0.4 + 0.4, 0.2, 0);
        this.rightShoulder.rotation.set(-walkCycle * 0.4 + 0.4, -0.2, 0);
        break;
      }

      case 'walk_backward': {
        const walkCycle = Math.sin(Date.now() * 0.01);
        this.chest.rotation.x = -0.08; // Defensive backward lean

        this.leftHipJoint.rotation.set(walkCycle * 0.4, 0, 0);
        this.leftKnee.rotation.set(Math.max(0, -walkCycle * 0.5), 0, 0);

        this.rightHipJoint.rotation.set(-walkCycle * 0.4, 0, 0);
        this.rightKnee.rotation.set(Math.max(0, walkCycle * 0.5), 0, 0);

        // High defensive guard
        this.leftShoulder.rotation.set(0.9, 0.3, 0.2);
        this.leftElbow.rotation.set(-1.7, 0, 0);
        this.rightShoulder.rotation.set(1.0, -0.3, -0.2);
        this.rightElbow.rotation.set(-1.8, 0, 0);
        break;
      }

      case 'crouch':
      case 'block': {
        this.hips.position.y = 0.72; // Deep stance
        this.leftHipJoint.rotation.set(-0.8, 0.2, 0);
        this.leftKnee.rotation.set(1.3, 0, 0);
        this.rightHipJoint.rotation.set(-0.7, -0.2, 0);
        this.rightKnee.rotation.set(1.2, 0, 0);

        // Crossed forearm shield block
        this.leftShoulder.rotation.set(1.2, 0.6, 0.4);
        this.leftElbow.rotation.set(-2.0, 0, 0);
        this.rightShoulder.rotation.set(1.2, -0.6, -0.4);
        this.rightElbow.rotation.set(-2.0, 0, 0);
        break;
      }

      case 'jump': {
        this.hips.position.y = 1.0;
        this.leftHipJoint.rotation.set(-0.6, 0.1, 0);
        this.leftKnee.rotation.set(0.9, 0, 0);
        this.rightHipJoint.rotation.set(-0.4, -0.1, 0);
        this.rightKnee.rotation.set(0.8, 0, 0);
        this.leftShoulder.rotation.set(-0.4, 0.3, 0.6);
        this.rightShoulder.rotation.set(-0.4, -0.3, -0.6);
        break;
      }

      case 'attack_light': {
        // Fast direct jab: extension and quick snap-back
        const ext = Math.sin(progress * Math.PI);
        this.chest.rotation.y = ext * 0.35;
        this.leftShoulder.rotation.set(1.5, 0, 0);
        this.leftElbow.rotation.set(-0.2 - (1 - ext) * 1.3, 0, 0);
        this.rightShoulder.rotation.set(0.8, -0.3, -0.2);
        this.rightElbow.rotation.set(-1.6, 0, 0);
        break;
      }

      case 'attack_heavy': {
        // Heavy overhand smash: windup then explosive power strike
        let phase = progress < 0.3 ? progress / 0.3 : (progress - 0.3) / 0.7;
        if (progress < 0.3) {
          // Windup pullback
          this.chest.rotation.y = -phase * 0.5;
          this.rightShoulder.rotation.set(2.2 * phase, -0.4, -0.5);
          this.rightElbow.rotation.set(-1.8, 0, 0);
        } else {
          // Explosive delivery
          const strike = Math.sin((1 - phase) * Math.PI * 0.5);
          this.chest.rotation.y = 0.5 * (1 - phase);
          this.rightShoulder.rotation.set(1.4, 0.2, 0);
          this.rightElbow.rotation.set(-0.15, 0, 0);
        }
        break;
      }

      case 'attack_kick': {
        // Roundhouse kick: plant left leg, whip right leg
        const kickSwing = Math.sin(progress * Math.PI);
        this.chest.rotation.y = kickSwing * 0.6;
        this.chest.rotation.z = -kickSwing * 0.25;

        this.leftHipJoint.rotation.set(-0.2, 0, 0);
        this.leftKnee.rotation.set(0.3, 0, 0);

        this.rightHipJoint.rotation.set(1.4 * kickSwing, -0.3, kickSwing * 0.8);
        this.rightKnee.rotation.set(Math.max(0, (1 - kickSwing) * 1.2), 0, 0);
        break;
      }

      case 'attack_air': {
        // Flying dive kick
        this.chest.rotation.x = 0.4;
        this.rightHipJoint.rotation.set(1.6, 0, 0.2);
        this.rightKnee.rotation.set(0.1, 0, 0);
        this.leftHipJoint.rotation.set(-0.5, 0, -0.2);
        this.leftKnee.rotation.set(1.2, 0, 0);
        break;
      }

      case 'attack_special': {
        // High-energy cinematic Super Move
        const p = progress;
        // Pulse special aura
        const auraMat = this.specialAuraMesh.material as THREE.MeshBasicMaterial;
        auraMat.opacity = Math.sin(p * Math.PI) * 0.5;
        this.specialAuraMesh.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.6);

        if (p < 0.35) {
          // Gather power stance
          this.hips.position.y = 0.8;
          this.leftShoulder.rotation.set(1.6, 0.8, 0.8);
          this.rightShoulder.rotation.set(1.6, -0.8, -0.8);
          this.chest.rotation.x = -0.3;
        } else {
          // Double palm / energy surge blast!
          this.hips.position.y = 0.9;
          this.leftShoulder.rotation.set(1.5, 0.15, 0);
          this.leftElbow.rotation.set(-0.1, 0, 0);
          this.rightShoulder.rotation.set(1.5, -0.15, 0);
          this.rightElbow.rotation.set(-0.1, 0, 0);
          this.chest.rotation.x = 0.2;
        }
        break;
      }

      case 'hit_light': {
        // Quick head and chest recoil
        const recoil = Math.sin(progress * Math.PI);
        this.chest.rotation.x = -recoil * 0.3;
        this.head.rotation.x = -recoil * 0.4;
        break;
      }

      case 'hit_heavy': {
        // Heavy impact stagger backwards
        const recoil = Math.sin(progress * Math.PI);
        this.chest.rotation.x = -recoil * 0.6;
        this.chest.rotation.y = recoil * 0.3;
        this.head.rotation.x = -recoil * 0.7;
        this.leftShoulder.rotation.set(-0.4, 0.5, 0.8);
        this.rightShoulder.rotation.set(-0.4, -0.5, -0.8);
        break;
      }

      case 'knockdown': {
        // Fall backwards onto ground
        const fall = Math.min(1, progress * 2.5);
        this.hips.position.y = Math.max(0.18, 1.0 - fall * 0.82);
        this.group.rotation.x = fall * (Math.PI / 2);
        break;
      }

      case 'getup': {
        const rise = progress;
        this.hips.position.y = 0.2 + rise * 0.8;
        this.group.rotation.x = (1 - rise) * (Math.PI / 2);
        break;
      }

      case 'victory': {
        // Raised fist & triumphant roar
        this.hips.position.y = 1.0;
        this.chest.rotation.x = -0.1;
        this.rightShoulder.rotation.set(3.0, 0, 0); // Arm straight up in air
        this.rightElbow.rotation.set(0, 0, 0);
        this.leftShoulder.rotation.set(0.6, -0.4, -0.3);
        break;
      }

      case 'defeat': {
        // Fallen on ground
        this.hips.position.y = 0.18;
        this.group.rotation.x = Math.PI / 2;
        break;
      }
    }

    if (action !== 'attack_special') {
      const auraMat = this.specialAuraMesh.material as THREE.MeshBasicMaterial;
      if (auraMat.opacity > 0) auraMat.opacity = 0;
    }
  }

  public dispose() {
    this.materials.forEach(mat => mat.dispose());
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
