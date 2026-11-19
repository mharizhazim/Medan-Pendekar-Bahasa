import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';

export interface RajaMustafarRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  kerisMesh: THREE.Group;
  shieldMesh: THREE.Group;
  auraRing: THREE.Mesh;
}

export interface TabungRig {
  group: THREE.Group;
  lidPivot: THREE.Group;
  glowLight: THREE.PointLight;
  beaconMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
}

export interface MonsterRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  eyeMeshes: THREE.Mesh[];
}

function makeContactShadow(radius = 0.7): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 20);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x090d0a,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = 0.03;
  return m;
}

export function createRajaMustafarRig(
  textures: ProceduralTexturePack,
): RajaMustafarRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);
  group.add(makeContactShadow(0.72));

  // Shared materials with varied roughness/metalness
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd99b66,
    roughness: 0.72,
    metalness: 0.04,
  });
  const royalRedMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.58,
    metalness: 0.08,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.24,
    metalness: 0.88,
  });
  const songketMat = new THREE.MeshStandardMaterial({
    map: textures.songketGold,
    roughness: 0.45,
    metalness: 0.35,
  });
  const darkBootMat = new THREE.MeshStandardMaterial({
    color: 0x291d16,
    roughness: 0.82,
    metalness: 0.1,
  });

  // Legs (Bottom-center pivot: feet touch y=0)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.22, 0.76, 0);
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.22, 0.76, 0);

  const legGeo = new THREE.BoxGeometry(0.34, 0.62, 0.36);
  const bootGeo = new THREE.BoxGeometry(0.37, 0.16, 0.44);

  const lLeg = new THREE.Mesh(legGeo, royalRedMat);
  lLeg.position.y = -0.31;
  lLeg.castShadow = true;
  const lBoot = new THREE.Mesh(bootGeo, darkBootMat);
  lBoot.position.set(0, -0.68, 0.03);
  lBoot.castShadow = true;
  leftLegPivot.add(lLeg, lBoot);

  const rLeg = new THREE.Mesh(legGeo, royalRedMat);
  rLeg.position.y = -0.31;
  rLeg.castShadow = true;
  const rBoot = new THREE.Mesh(bootGeo, darkBootMat);
  rBoot.position.set(0, -0.68, 0.03);
  rBoot.castShadow = true;
  rightLegPivot.add(rLeg, rBoot);

  bodyGroup.add(leftLegPivot, rightLegPivot);

  // Torso (Baju Melayu + Samping Songket + Pending Emas)
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.78, 0.46),
    royalRedMat,
  );
  torso.position.y = 1.15;
  torso.castShadow = true;
  bodyGroup.add(torso);

  const samping = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.34, 0.51),
    songketMat,
  );
  samping.position.y = 0.88;
  samping.castShadow = true;
  bodyGroup.add(samping);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.1, 0.53),
    goldMat,
  );
  belt.position.y = 1.03;
  bodyGroup.add(belt);

  // Royal Collar (Cekak Musang) + Gold Chest Trim
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.12, 0.36),
    goldMat,
  );
  collar.position.y = 1.56;
  bodyGroup.add(collar);

  const chestMedallion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.05, 8),
    goldMat,
  );
  chestMedallion.rotation.x = Math.PI / 2;
  chestMedallion.position.set(0, 1.32, 0.25);
  bodyGroup.add(chestMedallion);

  // Head & Royal Tengkolok
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.62, 0);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.66, 0.66), skinMat);
  head.position.y = 0.33;
  head.castShadow = true;
  headGroup.add(head);

  // Eyes, Brows & Smile
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  [-0.14, 0.14].forEach((ex) => {
    const eyeW = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.04), eyeWhiteMat);
    eyeW.position.set(ex, 0.36, 0.33);
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.05), pupilMat);
    pupil.position.set(ex, 0.36, 0.34);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), pupilMat);
    brow.position.set(ex, 0.45, 0.335);
    headGroup.add(eyeW, pupil, brow);
  });
  const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.04), pupilMat);
  mustache.position.set(0, 0.22, 0.335);
  headGroup.add(mustache);

  // Tengkolok Diraja (3-part folded royal Malay headdress)
  const tengkolokBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.22, 0.74),
    songketMat,
  );
  tengkolokBase.position.y = 0.68;
  tengkolokBase.castShadow = true;
  headGroup.add(tengkolokBase);

  const tengkolokFold = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.38, 4),
    songketMat,
  );
  tengkolokFold.position.set(0.08, 0.88, 0);
  tengkolokFold.rotation.y = Math.PI / 4;
  tengkolokFold.rotation.z = -0.18;
  tengkolokFold.castShadow = true;
  headGroup.add(tengkolokFold);

  const tengkolokCrest = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.09, 0),
    goldMat,
  );
  tengkolokCrest.position.set(0, 0.72, 0.39);
  headGroup.add(tengkolokCrest);

  bodyGroup.add(headGroup);

  // Arms
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.58, 1.46, 0);
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.58, 1.46, 0);

  const sleeveGeo = new THREE.BoxGeometry(0.28, 0.52, 0.3);
  const handGeo = new THREE.BoxGeometry(0.24, 0.22, 0.26);
  const cuffGeo = new THREE.BoxGeometry(0.3, 0.08, 0.32);

  const lSleeve = new THREE.Mesh(sleeveGeo, royalRedMat);
  lSleeve.position.y = -0.22;
  lSleeve.castShadow = true;
  const lCuff = new THREE.Mesh(cuffGeo, goldMat);
  lCuff.position.y = -0.45;
  const lHand = new THREE.Mesh(handGeo, skinMat);
  lHand.position.y = -0.56;
  leftArmPivot.add(lSleeve, lCuff, lHand);

  const rSleeve = new THREE.Mesh(sleeveGeo, royalRedMat);
  rSleeve.position.y = -0.22;
  rSleeve.castShadow = true;
  const rCuff = new THREE.Mesh(cuffGeo, goldMat);
  rCuff.position.y = -0.45;
  const rHand = new THREE.Mesh(handGeo, skinMat);
  rHand.position.y = -0.56;
  rightArmPivot.add(rSleeve, rCuff, rHand);

  // Keris Diraja in Right Hand
  const kerisMesh = new THREE.Group();
  kerisMesh.position.set(0, -0.62, 0.16);
  kerisMesh.rotation.x = Math.PI / 2.2;
  const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), goldMat);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.12), goldMat);
  guard.position.y = 0.12;
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.9,
  });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 0.04), bladeMat);
  blade.position.y = 0.44;
  kerisMesh.add(hilt, guard, blade);
  rightArmPivot.add(kerisMesh);

  // Perisai Warisan on Left Forearm
  const shieldMesh = new THREE.Group();
  shieldMesh.position.set(-0.2, -0.38, 0.08);
  shieldMesh.rotation.y = -Math.PI / 2;
  const shieldWoodMat = new THREE.MeshStandardMaterial({
    map: textures.carvedWood,
    roughness: 0.65,
    metalness: 0.12,
  });
  const shieldBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.32, 0.08, 6),
    shieldWoodMat,
  );
  shieldBody.rotation.x = Math.PI / 2;
  const shieldBoss = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    goldMat,
  );
  shieldBoss.position.z = 0.05;
  shieldMesh.add(shieldBody, shieldBoss);
  leftArmPivot.add(shieldMesh);

  bodyGroup.add(leftArmPivot, rightArmPivot);

  // Pelindung Ajaib Golden Aura Ring
  const auraRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.05, 8, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.85,
    }),
  );
  auraRing.rotation.x = Math.PI / 2;
  auraRing.position.y = 0.15;
  auraRing.visible = false;
  group.add(auraRing);

  return {
    group,
    bodyGroup,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    kerisMesh,
    shieldMesh,
    auraRing,
  };
}

export function createNpcModel(
  variant: 'awang' | 'badang' | 'penduduk',
  textures: ProceduralTexturePack,
): THREE.Group {
  const g = new THREE.Group();
  g.add(makeContactShadow(variant === 'awang' ? 0.5 : 0.65));

  const skinMat = new THREE.MeshStandardMaterial({
    color: variant === 'badang' ? 0xc28452 : 0xdba06d,
    roughness: 0.72,
  });
  const clothColor =
    variant === 'awang' ? 0x059669 : variant === 'badang' ? 0x1d4ed8 : 0xd97706;
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothColor,
    roughness: 0.6,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.8,
  });
  const songketMat = new THREE.MeshStandardMaterial({
    map: textures.songketGold,
    roughness: 0.5,
  });

  const scale = variant === 'awang' ? 0.76 : variant === 'badang' ? 1.15 : 0.96;
  const inner = new THREE.Group();
  inner.scale.setScalar(scale);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.3, 0.65, 0.32);
  const lLeg = new THREE.Mesh(legGeo, clothMat);
  lLeg.position.set(-0.19, 0.325, 0);
  lLeg.castShadow = true;
  const rLeg = new THREE.Mesh(legGeo, clothMat);
  rLeg.position.set(0.19, 0.325, 0);
  rLeg.castShadow = true;
  inner.add(lLeg, rLeg);

  // Torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.76, 0.44),
    clothMat,
  );
  torso.position.y = 1.03;
  torso.castShadow = true;
  inner.add(torso);

  const sash = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.22, 0.48),
    songketMat,
  );
  sash.position.y = 0.78;
  inner.add(sash);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.24, 0.62, 0.24);
  const lArm = new THREE.Mesh(armGeo, clothMat);
  lArm.position.set(-0.54, 1.04, 0);
  const rArm = new THREE.Mesh(armGeo, clothMat);
  rArm.position.set(0.54, 1.04, 0);
  inner.add(lArm, rArm);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.62, 0.62), skinMat);
  head.position.y = 1.74;
  head.castShadow = true;
  inner.add(head);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  [-0.13, 0.13].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.04), eyeMat);
    eye.position.set(ex, 1.78, 0.31);
    inner.add(eye);
  });

  // Headgear + props
  if (variant === 'awang') {
    // Songkok + glowing Jarum Emas staff
    const songkok = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.24, 0.66),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 }),
    );
    songkok.position.y = 2.12;
    inner.add(songkok);

    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.03, 1.5, 6),
      goldMat,
    );
    staff.position.set(0.62, 1.0, 0.2);
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9,
      }),
    );
    orb.position.set(0.62, 1.8, 0.2);
    inner.add(staff, orb);
  } else if (variant === 'badang') {
    const headband = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.14, 0.68),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 }),
    );
    headband.position.y = 1.98;
    inner.add(headband);
  } else {
    // Selendang tudung / scarf
    const scarf = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.34, 0.68),
      songketMat,
    );
    scarf.position.y = 1.94;
    inner.add(scarf);
  }

  g.add(inner);
  return g;
}

export function createMonsterRig(
  variant: 'hutan' | 'batu' | 'gua' | 'lembah' | 'istana',
): MonsterRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);
  group.add(makeContactShadow(1.05));

  const palette: Record<
    typeof variant,
    { body: number; accent: number; eye: number }
  > = {
    hutan: { body: 0x2d5a27, accent: 0x65a30d, eye: 0xfacc15 },
    gua: { body: 0x4c1d95, accent: 0xa855f7, eye: 0x22d3ee },
    batu: { body: 0x57534e, accent: 0xf97316, eye: 0xfef08a },
    lembah: { body: 0x0f766e, accent: 0x14b8a6, eye: 0xfde047 },
    istana: { body: 0x1e293b, accent: 0xf59e0b, eye: 0xef4444 },
  };
  const colors = palette[variant];

  const mainMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.78,
    metalness: variant === 'istana' ? 0.65 : 0.15,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: colors.accent,
    roughness: 0.35,
    metalness: variant === 'istana' ? 0.8 : 0.25,
    emissive: colors.accent,
    emissiveIntensity: variant === 'gua' ? 0.45 : 0.15,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: colors.eye });

  // Heavy blocky legs
  const legGeo = new THREE.BoxGeometry(0.45, 0.85, 0.45);
  const lLeg = new THREE.Mesh(legGeo, mainMat);
  lLeg.position.set(-0.38, 0.425, 0);
  lLeg.castShadow = true;
  const rLeg = new THREE.Mesh(legGeo, mainMat);
  rLeg.position.set(0.38, 0.425, 0);
  rLeg.castShadow = true;
  bodyGroup.add(lLeg, rLeg);

  // Broad torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.25, 0.9), mainMat);
  torso.position.y = 1.45;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Chest core crystal/emblem
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), accentMat);
  core.position.set(0, 1.45, 0.48);
  bodyGroup.add(core);

  // Head & horns/spikes
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.82), mainMat);
  head.position.y = 2.42;
  head.castShadow = true;
  bodyGroup.add(head);

  const lHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 4), accentMat);
  lHorn.position.set(-0.36, 3.0, 0);
  lHorn.rotation.z = 0.25;
  const rHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 4), accentMat);
  rHorn.position.set(0.36, 3.0, 0);
  rHorn.rotation.z = -0.25;
  bodyGroup.add(lHorn, rHorn);

  // Glowing eyes
  const eyeMeshes: THREE.Mesh[] = [];
  [-0.2, 0.2].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.06), eyeMat);
    eye.position.set(ex, 2.48, 0.42);
    bodyGroup.add(eye);
    eyeMeshes.push(eye);
  });

  // Heavy articulated arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.92, 1.9, 0);
  const lArmMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 1.15, 0.44),
    mainMat,
  );
  lArmMesh.position.y = -0.45;
  lArmMesh.castShadow = true;
  const lFist = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.35, 0.48),
    accentMat,
  );
  lFist.position.y = -1.0;
  leftArm.add(lArmMesh, lFist);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.92, 1.9, 0);
  const rArmMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 1.15, 0.44),
    mainMat,
  );
  rArmMesh.position.y = -0.45;
  rArmMesh.castShadow = true;
  const rFist = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.35, 0.48),
    accentMat,
  );
  rFist.position.y = -1.0;
  rightArm.add(rArmMesh, rFist);

  bodyGroup.add(leftArm, rightArm);

  return { group, bodyGroup, leftArm, rightArm, eyeMeshes };
}

export function createTabungPitisRig(textures: ProceduralTexturePack): TabungRig {
  const group = new THREE.Group();
  group.add(makeContactShadow(1.1));

  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.carvedWood,
    roughness: 0.62,
    metalness: 0.12,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.22,
    metalness: 0.88,
  });

  // Carved stone plinth
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.22, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.88 }),
  );
  plinth.position.y = 0.11;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Chest base
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 1.05), woodMat);
  base.position.y = 0.58;
  base.castShadow = true;
  group.add(base);

  // Gold side bands
  [-0.62, 0.62].forEach((bx) => {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.76, 1.1),
      goldMat,
    );
    band.position.set(bx, 0.58, 0);
    group.add(band);
  });

  // Kupang Emblem on front
  const emblem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12),
    goldMat,
  );
  emblem.rotation.x = Math.PI / 2;
  emblem.position.set(0, 0.66, 0.55);
  group.add(emblem);

  // Hinged Lid Pivot at back edge (z = -0.52, y = 0.94)
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.94, -0.52);

  const lidBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.54, 0.36, 1.08),
    woodMat,
  );
  lidBox.position.set(0, 0.18, 0.52);
  lidBox.castShadow = true;
  lidPivot.add(lidBox);

  const lidArch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 1.52, 8, 1, false, 0, Math.PI),
    goldMat,
  );
  lidArch.rotation.z = Math.PI / 2;
  lidArch.position.set(0, 0.36, 0.52);
  lidPivot.add(lidArch);

  group.add(lidPivot);

  // Glowing golden inner treasure light + tall beacon ray
  const glowLight = new THREE.PointLight(0xfbbf24, 2.2, 9);
  glowLight.position.set(0, 1.4, 0);
  group.add(glowLight);

  const beaconMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.42, 16, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  beaconMesh.position.y = 8.4;
  group.add(beaconMesh);

  const ringMesh = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.28, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    }),
  );
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.05;
  group.add(ringMesh);

  return { group, lidPivot, glowLight, beaconMesh, ringMesh };
}

export function createRumahPanggung(textures: ProceduralTexturePack): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.carvedWood,
    roughness: 0.72,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x7c2d12,
    roughness: 0.85,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.45,
  });

  // 4 Stilts
  const stiltGeo = new THREE.BoxGeometry(0.35, 1.6, 0.35);
  [
    [-2.4, -1.8],
    [2.4, -1.8],
    [-2.4, 1.8],
    [2.4, 1.8],
  ].forEach(([sx, sz]) => {
    const stilt = new THREE.Mesh(stiltGeo, woodMat);
    stilt.position.set(sx, 0.8, sz);
    stilt.castShadow = true;
    g.add(stilt);
  });

  // Raised Floor & Veranda
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.28, 4.8), woodMat);
  floor.position.y = 1.6;
  floor.castShadow = true;
  floor.receiveShadow = true;
  g.add(floor);

  // Main House Body
  const walls = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.5, 4.0), woodMat);
  walls.position.y = 2.95;
  walls.castShadow = true;
  g.add(walls);

  // Window with Batik/Gold Frame
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.0, 0.12),
    trimMat,
  );
  win.position.set(1.2, 3.0, 2.02);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.9, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 }),
  );
  door.position.set(-1.1, 2.65, 2.02);
  g.add(win, door);

  // Pitched Malay Roof (2 slanted prisms via rotated boxes / cone)
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.4, 2.4, 4),
    roofMat,
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 5.35;
  roof.castShadow = true;
  g.add(roof);

  // Front wooden stairs
  for (let i = 0; i < 4; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.25, 0.45),
      woodMat,
    );
    step.position.set(-1.1, 0.2 + i * 0.4, 2.8 - i * 0.35);
    g.add(step);
  }

  return g;
}

export function createWauBulan(): THREE.Group {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 8), poleMat);
  pole.position.y = 2.6;
  g.add(pole);

  const wauGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
  const wauRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
  const wauTeal = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.5 });

  const wings = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.75, 0.08), wauRed);
  wings.position.set(0, 4.4, 0.15);
  const crescent = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.18, 6, 12, Math.PI),
    wauGold,
  );
  crescent.rotation.z = Math.PI;
  crescent.position.set(0, 3.6, 0.15);
  const centerDiamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.45, 0),
    wauTeal,
  );
  centerDiamond.scale.set(1, 1.4, 0.2);
  centerDiamond.position.set(0, 4.4, 0.18);
  g.add(wings, crescent, centerDiamond);
  return g;
}

export function createFloatingLabelSprite(
  title: string,
  subtitle?: string,
  bgHex = '#1f1209',
  borderHex = '#f59e0b',
  titleColor = '#fef3c7',
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = subtitle ? 144 : 104;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Rounded backdrop box
  const pad = 10;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const r = 18;
  ctx.fillStyle = bgHex;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.lineTo(pad + w - r, pad);
  ctx.quadraticCurveTo(pad + w, pad, pad + w, pad + r);
  ctx.lineTo(pad + w, pad + h - r);
  ctx.quadraticCurveTo(pad + w, pad + h, pad + w - r, pad + h);
  ctx.lineTo(pad + r, pad + h);
  ctx.quadraticCurveTo(pad, pad + h, pad, pad + h - r);
  ctx.lineTo(pad, pad + r);
  ctx.quadraticCurveTo(pad, pad, pad + r, pad);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.lineWidth = 5;
  ctx.strokeStyle = borderHex;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 34px "Outfit", sans-serif';
  ctx.fillText(
    title,
    canvas.width / 2,
    subtitle ? canvas.height * 0.36 : canvas.height * 0.5,
  );

  if (subtitle) {
    ctx.fillStyle = '#fde68a';
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subtitle, canvas.width / 2, canvas.height * 0.72);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(subtitle ? 4.4 : 3.8, subtitle ? 1.24 : 0.85, 1);
  return sprite;
}

export interface WalkingVillagerRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
}

export function createWalkingVillagerRig(
  clothHex: number,
  headgearHex: number,
  textures: ProceduralTexturePack,
): WalkingVillagerRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);
  group.add(makeContactShadow(0.55));

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdba06d, roughness: 0.72 });
  const clothMat = new THREE.MeshStandardMaterial({ color: clothHex, roughness: 0.65 });
  const sarongMat = new THREE.MeshStandardMaterial({
    map: textures.songketGold,
    roughness: 0.55,
  });
  const hatMat = new THREE.MeshStandardMaterial({ color: headgearHex, roughness: 0.65 });

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.65, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.65, 0);

  const legGeo = new THREE.BoxGeometry(0.24, 0.62, 0.26);
  const lMesh = new THREE.Mesh(legGeo, clothMat);
  lMesh.position.y = -0.31;
  lMesh.castShadow = true;
  leftLeg.add(lMesh);
  const rMesh = new THREE.Mesh(legGeo, clothMat);
  rMesh.position.y = -0.31;
  rMesh.castShadow = true;
  rightLeg.add(rMesh);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.4), clothMat);
  torso.position.y = 1.0;
  torso.castShadow = true;

  const kain = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.28, 0.44), sarongMat);
  kain.position.y = 0.74;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.54, 0.54), skinMat);
  head.position.y = 1.62;
  head.castShadow = true;

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  [-0.12, 0.12].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.04), eyeMat);
    eye.position.set(ex, 1.65, 0.27);
    bodyGroup.add(eye);
  });

  const hat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.58), hatMat);
  hat.position.y = 1.94;

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 1.28, 0);
  const lArmM = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.56, 0.22), clothMat);
  lArmM.position.y = -0.25;
  leftArm.add(lArmM);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.46, 1.28, 0);
  const rArmM = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.56, 0.22), clothMat);
  rArmM.position.y = -0.25;
  rightArm.add(rArmM);

  bodyGroup.add(leftLeg, rightLeg, torso, kain, head, hat, leftArm, rightArm);
  return { group, bodyGroup, leftArm, rightArm, leftLeg, rightLeg };
}

export interface SmallAnimalRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  legs: THREE.Mesh[];
  species: 'ayam' | 'kancil' | 'tupai' | 'itik';
}

export function createSmallAnimalRig(
  species: 'ayam' | 'kancil' | 'tupai' | 'itik',
): SmallAnimalRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);
  group.add(makeContactShadow(species === 'kancil' ? 0.45 : 0.3));

  const legs: THREE.Mesh[] = [];

  if (species === 'ayam' || species === 'itik') {
    const bodyCol = species === 'ayam' ? 0xfef3c7 : 0xf8fafc;
    const beakCol = 0xf97316;
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.7 });
    const beakMat = new THREE.MeshStandardMaterial({ color: beakCol, roughness: 0.5 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.52), bodyMat);
    body.position.y = 0.36;
    body.castShadow = true;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), bodyMat);
    head.position.set(0, 0.62, 0.22);

    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.16), beakMat);
    beak.position.set(0, 0.6, 0.38);

    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.24, 0.18),
      new THREE.MeshStandardMaterial({
        color: species === 'ayam' ? 0x991b1b : 0x0d9488,
        roughness: 0.7,
      }),
    );
    tail.position.set(0, 0.5, -0.3);

    if (species === 'ayam') {
      const comb = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.1, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xdc2626 }),
      );
      comb.position.set(0, 0.78, 0.22);
      bodyGroup.add(comb);
    }

    [-0.1, 0.1].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), beakMat);
      leg.position.set(lx, 0.11, 0);
      bodyGroup.add(leg);
      legs.push(leg);
    });

    bodyGroup.add(body, head, beak, tail);
  } else if (species === 'kancil') {
    const furMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.75 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.85), furMat);
    torso.position.y = 0.56;
    torso.castShadow = true;

    const neckHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.36), furMat);
    neckHead.position.set(0, 0.88, 0.38);

    const earL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), bellyMat);
    earL.position.set(-0.11, 1.1, 0.34);
    const earR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), bellyMat);
    earR.position.set(0.11, 1.1, 0.34);

    [
      [-0.14, 0.28],
      [0.14, 0.28],
      [-0.14, -0.28],
      [0.14, -0.28],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.38, 0.09), furMat);
      leg.position.set(lx, 0.19, lz);
      bodyGroup.add(leg);
      legs.push(leg);
    });

    bodyGroup.add(torso, neckHead, earL, earR);
  } else {
    // Tupai (Squirrel)
    const furMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.78 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.44), furMat);
    body.position.y = 0.24;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), furMat);
    head.position.set(0, 0.38, 0.24);
    const bushyTail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.22), tailMat);
    bushyTail.position.set(0, 0.44, -0.28);
    bushyTail.rotation.x = -0.35;

    [-0.08, 0.08].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.06), furMat);
      leg.position.set(lx, 0.07, 0.1);
      bodyGroup.add(leg);
      legs.push(leg);
    });

    bodyGroup.add(body, head, bushyTail);
  }

  return { group, bodyGroup, legs, species };
}

