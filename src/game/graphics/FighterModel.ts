import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
  private importedRig: THREE.Group | null = null;
  private importedMixer: THREE.AnimationMixer | null = null;
  private importedClips: THREE.AnimationClip[] = [];
  private importedActions = new Map<string, THREE.AnimationAction>();
  private importedCurrentAction: string | null = null;
  private importedBones = new Map<string, THREE.Bone>();
  private importedSkinTone = new THREE.Color(0x8d5524);

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
    const chestGeo = new THREE.SphereGeometry(0.31, 20, 16);
    const chestMesh = new THREE.Mesh(chestGeo, suitMat);
    chestMesh.scale.set(0.92, 0.88, 0.68);
    chestMesh.castShadow = true;
    this.chest.add(chestMesh);

    // More human, comic-book anatomy: rounded chest, abdomen and neck forms
    // soften the old blocky silhouette while preserving the articulated rig.
    const anatomyMat = new THREE.MeshStandardMaterial({
      color: skinCol, roughness: 0.72, metalness: 0.02,
    });
    this.materials.push(anatomyMat);
    const pecGeo = new THREE.SphereGeometry(0.19, 14, 10);
    for (const side of [-1, 1]) {
      const pec = new THREE.Mesh(pecGeo, anatomyMat);
      pec.scale.set(1.08, 0.67, 0.58);
      pec.position.set(side * 0.125, 0.09, 0.165);
      pec.castShadow = true;
      this.chest.add(pec);
    }
    const absGeo = new THREE.SphereGeometry(0.105, 12, 10);
    for (let row = 0; row < 2; row++) {
      for (const side of [-1, 1]) {
        const ab = new THREE.Mesh(absGeo, anatomyMat);
        ab.scale.set(0.72, 0.8, 0.48);
        ab.position.set(side * 0.07, -0.12 - row * 0.115, 0.16);
        this.chest.add(ab);
      }
    }

    // Armor plate / Hoodie vest / Gi lapel
    // Split chest armor leaves the sculpted torso visible instead of hiding it
    // behind one flat rectangular plate.
    const chestPlateGeo = new THREE.BoxGeometry(0.19, 0.16, 0.055);
    for (const side of [-1, 1]) {
      const chestPlateMesh = new THREE.Mesh(chestPlateGeo, armorMat);
      chestPlateMesh.position.set(side * 0.14, 0.11, 0.19);
      chestPlateMesh.rotation.z = side * -0.18;
      chestPlateMesh.rotation.y = side * -0.12;
      chestPlateMesh.castShadow = true;
      this.chest.add(chestPlateMesh);
    }

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
    const headGeo = new THREE.SphereGeometry(0.18, 20, 16);
    headGeo.scale(0.94, 1.17, 1.02);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 0.16;
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Stylized human facial silhouette: nose bridge, ears and mouth line.
    const noseGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.scale.set(0.72, 1.35, 1.0);
    nose.position.set(0, 0.145, 0.177);
    this.head.add(nose);
    const earGeo = new THREE.SphereGeometry(0.045, 8, 8);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, skinMat);
      ear.scale.set(0.55, 1.0, 0.7);
      ear.position.set(side * 0.174, 0.16, 0.005);
      this.head.add(ear);
    }
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x3a1718, roughness: 0.9 });
    this.materials.push(mouthMat);
    const jawGeo = new THREE.SphereGeometry(0.115, 14, 10);
    const jaw = new THREE.Mesh(jawGeo, skinMat);
    jaw.scale.set(0.82, 0.52, 0.78);
    jaw.position.set(0, 0.075, 0.055);
    this.head.add(jaw);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.012, 0.018), mouthMat);
    mouth.position.set(0, 0.095, 0.17);
    this.head.add(mouth);

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

    // Graphic-novel costume layers: shoulder piping, waist sash and hanging gi panels.
    const trimMat = new THREE.MeshStandardMaterial({
      color: accentCol, roughness: 0.38, metalness: 0.35,
      emissive: accentCol, emissiveIntensity: 0.12,
    });
    this.materials.push(trimMat);
    for (const side of [-1, 1]) {
      const shoulderTrim = new THREE.Mesh(
        new THREE.TorusGeometry(0.105, 0.018, 6, 12, Math.PI),
        trimMat,
      );
      shoulderTrim.rotation.z = side === -1 ? Math.PI : 0;
      shoulderTrim.position.set(side * 0.35, 0.18, 0.005);
      this.chest.add(shoulderTrim);
    }
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.075, 0.36), accentMat);
    sash.position.set(0, -0.02, 0.015);
    this.hips.add(sash);
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.17, 0.31, 0.055),
        suitMat,
      );
      panel.position.set(side * 0.13, -0.22, 0.13);
      panel.rotation.z = side * -0.08;
      panel.castShadow = true;
      this.hips.add(panel);
      const piping = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.27, 0.012), trimMat);
      piping.position.set(side * 0.13, -0.22, 0.161);
      this.hips.add(piping);
    }

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

    // Distinctive high-contrast fighter silhouette and comic-book ink accents.
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x090b16, transparent: true, opacity: 0.48,
    });
    this.materials.push(outlineMat);
    const bootSoleGeo = new THREE.BoxGeometry(0.2, 0.045, 0.32);
    for (const side of [-1, 1]) {
      const sole = new THREE.Mesh(bootSoleGeo, outlineMat);
      sole.position.set(side * 0.16, 0.08, 0.09);
      this.group.add(sole);
    }

    // Load a real skinned humanoid rig with authored idle/walk animations.
    // Keep the procedural fighter as a resilient fallback if the CDN is unavailable.
    this.loadHumanoidRig(primaryCol, secondaryCol, accentCol, skinCol);
  }

  private loadHumanoidRig(primary: THREE.Color, secondary: THREE.Color, accent: THREE.Color, skin: THREE.Color) {
    const loader = new GLTFLoader();
    loader.load(
      'https://threejs.org/examples/models/gltf/Soldier.glb',
      (gltf) => {
        if (!this.group.parent && this.group.userData.disposed) return;
        const rig = gltf.scene;
        rig.name = 'OCTACOMBAT_IMPORTED_HUMANOID';
        // Keep the source rig's forward axis aligned with the combat stance.
        rig.scale.setScalar(1.25);
        rig.position.set(0, 0, 0);
        rig.traverse((node) => {
          if (node instanceof THREE.Bone) {
            this.importedBones.set(node.name.toLowerCase(), node);
          }
          if (node instanceof THREE.Mesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach((material) => {
              if (!(material instanceof THREE.MeshStandardMaterial)) return;
              const name = material.name.toLowerCase();
              if (name.includes('skin') || name.includes('face') || name.includes('body')) {
                material.color.copy(skin);
                material.roughness = 0.72;
              } else {
                // Character-specific palette instead of the demo soldier's default green.
                material.color.lerp(this.isPlayer ? primary : secondary, 0.72);
                material.metalness = Math.max(material.metalness, 0.18);
                material.roughness = Math.min(material.roughness, 0.72);
                if (name.includes('visor') || name.includes('glass')) {
                  material.emissive.copy(accent);
                  material.emissiveIntensity = 0.25;
                }
              }
            });
          }
        });
        // Original OCTACOMBAT ninja identity: fitted face mask, eye slit,
        // layered chest armor, shoulder guards and forearm wraps attached to the real rig.
        const armorMat = new THREE.MeshStandardMaterial({
          color: this.isPlayer ? 0x171923 : 0x111a2c,
          roughness: 0.34, metalness: 0.72,
        });
        const trimMat = new THREE.MeshStandardMaterial({
          color: accent, roughness: 0.28, metalness: 0.55,
          emissive: accent, emissiveIntensity: 0.22,
        });
        const clothMat = new THREE.MeshStandardMaterial({
          color: this.isPlayer ? 0x70151d : 0x123c78,
          roughness: 0.86, metalness: 0.04, side: THREE.DoubleSide,
        });
        this.materials.push(armorMat, trimMat, clothMat);
        const findBone = (...names: string[]) => {
          for (const name of names) {
            const found = this.importedBones.get(name.toLowerCase());
            if (found) return found;
          }
          return undefined;
        };
        const headBone = findBone('mixamorigHead', 'Head');
        if (headBone) {
          const hood = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), armorMat);
          hood.scale.set(1.05, 1.12, 1.0);
          hood.position.set(0, 0.025, -0.012);
          hood.castShadow = true;
          headBone.add(hood);
          const mask = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.075, 0.13), clothMat);
          mask.position.set(0, -0.055, 0.065);
          mask.castShadow = true;
          headBone.add(mask);
          const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.018, 0.012), trimMat);
          eyeSlit.position.set(0, -0.005, 0.111);
          headBone.add(eyeSlit);
          for (const side of [-1, 1]) {
            const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 0.06), armorMat);
            cheek.position.set(side * 0.078, -0.045, 0.035);
            cheek.rotation.z = side * -0.18;
            headBone.add(cheek);
          }
        }
        const spineBone = findBone('mixamorigSpine2', 'mixamorigSpine1', 'mixamorigSpine', 'Spine');
        if (spineBone) {
          const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.28, 0.09), armorMat);
          chestPlate.position.set(0, 0.055, 0.075);
          chestPlate.rotation.x = -0.08;
          chestPlate.castShadow = true;
          spineBone.add(chestPlate);
          const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.025, 0.012), trimMat);
          chestStripe.position.set(0, 0.07, 0.126);
          spineBone.add(chestStripe);
          const sash = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.11), clothMat);
          sash.position.set(0, -0.16, 0.025);
          spineBone.add(sash);
          const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.55), clothMat);
          cape.position.set(0, -0.22, -0.075);
          cape.rotation.x = 0.12;
          spineBone.add(cape);
        }
        for (const [boneNames, side] of [
          [['mixamorigLeftArm', 'LeftArm'], -1],
          [['mixamorigRightArm', 'RightArm'], 1],
        ] as const) {
          const armBone = findBone(...boneNames);
          if (!armBone) continue;
          const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), armorMat);
          shoulder.scale.set(1.1, 0.72, 0.9);
          shoulder.position.set(side * -0.025, 0.015, 0.005);
          shoulder.castShadow = true;
          armBone.add(shoulder);
          const armTrim = new THREE.Mesh(new THREE.TorusGeometry(0.067, 0.012, 6, 12), trimMat);
          armTrim.position.set(0, -0.17, 0.012);
          armTrim.rotation.x = Math.PI / 2;
          armBone.add(armTrim);
        }

        this.importedRig = rig;
        this.group.add(rig);
        // Hide only the old procedural body; retain the ground shadow and VFX.
        this.hips.visible = false;
        this.importedMixer = new THREE.AnimationMixer(rig);
        this.importedClips = gltf.animations;
        for (const clip of gltf.animations) {
          const key = clip.name.toLowerCase();
          if (key.includes('idle')) this.importedActions.set('idle', this.importedMixer.clipAction(clip));
          else if (key.includes('walk')) this.importedActions.set('walk', this.importedMixer.clipAction(clip));
          else if (key.includes('run')) this.importedActions.set('run', this.importedMixer.clipAction(clip));
        }
        this.playImportedAnimation('idle');
      },
      undefined,
      () => {
        // Offline/CDN failure leaves the existing procedural fighter fully playable.
      },
    );
  }

  private playImportedAnimation(name: string) {
    const next = this.importedActions.get(name) || this.importedActions.get('idle');
    if (!next || this.importedCurrentAction === name) return;
    next.reset().fadeIn(0.18).play();
    if (this.importedCurrentAction) {
      const previous = this.importedActions.get(this.importedCurrentAction);
      if (previous) previous.fadeOut(0.15);
    }
    this.importedCurrentAction = name;
  }

  private poseImportedRig(action: ActionState, progress: number) {
    const bone = (...names: string[]) => {
      for (const name of names) {
        const found = this.importedBones.get(name.toLowerCase());
        if (found) return found;
      }
      return undefined;
    };
    const lArm = bone('mixamorigLeftArm', 'LeftArm');
    const rArm = bone('mixamorigRightArm', 'RightArm');
    const lFore = bone('mixamorigLeftForeArm', 'LeftForeArm');
    const rFore = bone('mixamorigRightForeArm', 'RightForeArm');
    const lUpLeg = bone('mixamorigLeftUpLeg', 'LeftUpLeg');
    const rUpLeg = bone('mixamorigRightUpLeg', 'RightUpLeg');
    const lLeg = bone('mixamorigLeftLeg', 'LeftLeg');
    const rLeg = bone('mixamorigRightLeg', 'RightLeg');
    const spine = bone('mixamorigSpine', 'Spine');
    const head = bone('mixamorigHead', 'Head');
    // Small authored pose offsets on top of the rig's idle/walk animation.
    if (action === 'attack_light' || action === 'attack_heavy' || action === 'attack_special') {
      const strike = Math.sin(progress * Math.PI);
      if (rArm) { rArm.rotation.x -= strike * (action === 'attack_heavy' ? 1.7 : 1.25); rArm.rotation.z += strike * 0.15; }
      if (rFore) rFore.rotation.x -= strike * 0.85;
      if (spine) spine.rotation.y += strike * 0.28;
    } else if (action === 'attack_kick' || action === 'attack_air') {
      const kick = Math.sin(progress * Math.PI);
      if (rUpLeg) rUpLeg.rotation.x -= kick * 1.25;
      if (rLeg) rLeg.rotation.x += kick * 0.45;
      if (spine) spine.rotation.x -= kick * 0.18;
    } else if (action === 'block' || action === 'crouch') {
      if (lArm) lArm.rotation.x -= 0.6;
      if (rArm) rArm.rotation.x -= 0.6;
      if (lFore) lFore.rotation.x -= 0.7;
      if (rFore) rFore.rotation.x -= 0.7;
      if (action === 'crouch') { if (lUpLeg) lUpLeg.rotation.x += 0.45; if (rUpLeg) rUpLeg.rotation.x += 0.45; }
    } else if (action === 'hit_light' || action === 'hit_heavy') {
      if (spine) spine.rotation.x += action === 'hit_heavy' ? -0.45 : -0.2;
      if (head) head.rotation.x -= 0.2;
    } else if (action === 'victory') {
      if (rArm) rArm.rotation.z -= 2.4;
      if (rFore) rFore.rotation.x -= 0.5;
    } else if (action === 'defeat' || action === 'knockdown') {
      if (spine) spine.rotation.x -= 0.8;
    }
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
    const pauldronGeo = new THREE.SphereGeometry(0.145, 14, 10);
    const pauldron = new THREE.Mesh(pauldronGeo, armorMat);
    pauldron.scale.set(1.1, 0.82, 1.05);
    pauldron.position.y = 0.015;
    pauldron.castShadow = true;
    parentShoulder.add(pauldron);
    const pauldronRim = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 6, 16), gloveMat);
    pauldronRim.position.set(0, -0.015, 0.015);
    pauldronRim.rotation.x = Math.PI / 2;
    parentShoulder.add(pauldronRim);

    // Upper arm
    const upperArmGeo = new THREE.CapsuleGeometry(0.072, 0.22, 4, 8);
    const upperArm = new THREE.Mesh(upperArmGeo, skinMat);
    upperArm.position.y = -0.16;
    upperArm.castShadow = true;
    parentShoulder.add(upperArm);

    // Elbow Joint
    const elbowJoint = new THREE.Group();
    elbowJoint.position.y = -0.32;
    parentShoulder.add(elbowJoint);

    // Forearm / Gauntlet
    const forearmGeo = new THREE.CapsuleGeometry(0.064, 0.19, 4, 8);
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
    const knuckle = new THREE.Mesh(
      new THREE.SphereGeometry(0.064, 8, 6),
      gloveMat,
    );
    knuckle.scale.set(1, 0.72, 0.82);
    knuckle.position.set(0, -0.005, 0.052);
    fistJoint.add(knuckle);
    const wrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.018, 5, 10),
      armorMat,
    );
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = -0.22;
    elbowJoint.add(wrap);

    return elbowJoint;
  }

  private buildLeg(
    parentHip: THREE.Group,
    suitMat: THREE.Material,
    armorMat: THREE.Material,
    bootMat: THREE.Material
  ): THREE.Group {
    // Thigh
    const thighGeo = new THREE.CapsuleGeometry(0.105, 0.27, 5, 10);
    const thigh = new THREE.Mesh(thighGeo, suitMat);
    thigh.position.y = -0.22;
    thigh.scale.set(1.05, 1.0, 0.92);
    thigh.castShadow = true;
    parentHip.add(thigh);

    // Knee joint
    const kneeJoint = new THREE.Group();
    kneeJoint.position.y = -0.45;
    parentHip.add(kneeJoint);

    // Shin / Knee guard
    const shinGeo = new THREE.CapsuleGeometry(0.075, 0.26, 5, 10);
    const shin = new THREE.Mesh(shinGeo, armorMat);
    shin.position.y = -0.22;
    shin.castShadow = true;
    kneeJoint.add(shin);

    // Combat Boot
    const bootGeo = new THREE.BoxGeometry(0.16, 0.15, 0.3);
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

    // Facing direction: three-quarter view keeps the face visible to the arena camera.
    this.group.rotation.y = facing === 1 ? 1.18 : -1.18;

    if (this.importedMixer && this.importedRig) {
      const moving = action === 'walk_forward' || action === 'walk_backward';
      this.playImportedAnimation(moving ? 'walk' : 'idle');
      this.importedMixer.update(delta);
      // Keep the imported animation rig stable. The old procedural pose offsets
      // were accumulated every frame on top of the GLTF animation, twisting limbs
      // and making fighters lean or collapse. The animation mixer owns the skeleton.
    }

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
        this.leftShoulder.rotation.set(-1.5, 0, 0);
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
          this.rightShoulder.rotation.set(-2.2 * phase, -0.4, -0.5);
          this.rightElbow.rotation.set(-1.8, 0, 0);
        } else {
          // Explosive delivery
          const strike = Math.sin((1 - phase) * Math.PI * 0.5);
          this.chest.rotation.y = 0.5 * (1 - phase);
          this.rightShoulder.rotation.set(-1.4, 0.2, 0);
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

        this.rightHipJoint.rotation.set(-1.4 * kickSwing, -0.3, -kickSwing * 0.8);
        this.rightKnee.rotation.set(Math.max(0, (1 - kickSwing) * 1.2), 0, 0);
        break;
      }

      case 'attack_air': {
        // Flying dive kick
        this.chest.rotation.x = 0.4;
        this.rightHipJoint.rotation.set(-1.6, 0, -0.2);
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
          this.leftShoulder.rotation.set(-1.6, 0.8, 0.8);
          this.rightShoulder.rotation.set(-1.6, -0.8, -0.8);
          this.chest.rotation.x = -0.3;
        } else {
          // Double palm / energy surge blast!
          this.hips.position.y = 0.9;
          this.leftShoulder.rotation.set(-1.5, 0.15, 0);
          this.leftElbow.rotation.set(-0.1, 0, 0);
          this.rightShoulder.rotation.set(-1.5, -0.15, 0);
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
    this.group.userData.disposed = true;
    this.importedMixer?.stopAllAction();
    this.materials.forEach(mat => mat.dispose());
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
