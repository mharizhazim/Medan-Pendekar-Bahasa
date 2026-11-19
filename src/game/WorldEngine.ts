import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  BONUS_ORBS,
  MONSTERS,
  NPCS,
  TABUNG_QUESTIONS,
} from '../data/questions';
import { audioEngine } from './audio';
import {
  createFloatingLabelSprite,
  createMonsterRig,
  createNpcModel,
  createRajaMustafarRig,
  createRumahPanggung,
  createSmallAnimalRig,
  createTabungPitisRig,
  createWalkingVillagerRig,
  createWauBulan,
  MonsterRig,
  RajaMustafarRig,
  SmallAnimalRig,
  TabungRig,
  WalkingVillagerRig,
} from './models';
import {
  BoxCollider,
  CircleCollider,
  getCurrentLocation,
  groundHeightAt,
  resolveCollisions,
} from './terrain';
import { createProceduralTextures, ProceduralTexturePack } from './textures';

export interface NearbyInteraction {
  type: 'tabung' | 'npc' | 'monster';
  id: string | number;
  label: string;
  promptText: string;
}

export interface WorldTelemetry {
  x: number;
  z: number;
  yaw: number;
  locationId: string;
  locationName: string;
  difficulty: string;
  nearby: NearbyInteraction | null;
}

export interface WorldCallbacks {
  onTelemetry: (t: WorldTelemetry) => void;
  onOpenTabung: (tabungId: number) => void;
  onTalkNpc: (npcId: string) => void;
  onTriggerMonster: (monsterId: string) => void;
  onCollectOrb: (orbId: string, kupang: number, label: string) => void;
  onToggleInventory: () => void;
  onTogglePause: () => void;
}

// Pre-allocated math helpers (zero GC in animation loop)
const _moveDir = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _color = new THREE.Color();

export class WorldEngine {
  private container: HTMLElement;
  private callbacks: WorldCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private textures!: ProceduralTexturePack;
  private isSoftwareGl = false;
  private frameId = 0;
  private disposed = false;
  private paused = false;

  private clock = new THREE.Clock();
  private playerRig!: RajaMustafarRig;
  private playerPos = new THREE.Vector3(0, 0, 4);
  private playerVelY = 0;
  private playerYaw = Math.PI; // Facing -Z (north toward world)
  private isGrounded = true;
  private walkPhase = 0;
  private stepTimer = 0;

  // Camera orbit state
  private cameraYaw = Math.PI; // Behind player looking -Z
  private cameraPitch = 0.34;
  private cameraDistance = 9.5;
  private isDraggingCamera = false;
  private dragPointerId: number | null = null;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Input state
  private keys: Record<string, boolean> = {};
  private joystick = { x: 0, y: 0 };
  private touchRun = false;

  // World entities & colliders
  private boxColliders: BoxCollider[] = [];
  private circleColliders: CircleCollider[] = [];
  private tabungRigs = new Map<number, TabungRig>();
  private tabungSolved = new Set<number>();
  private monsterRigs = new Map<string, { rig: MonsterRig; baseX: number; baseZ: number }>();
  private defeatedMonsters = new Set<string>();
  private npcModels = new Map<string, THREE.Group>();
  private bonusOrbMeshes = new Map<string, THREE.Mesh>();
  private collectedOrbs = new Set<string>();

  // Animated environment pieces & roaming life
  private birds: { mesh: THREE.Group; centerX: number; centerZ: number; radius: number; speed: number; phase: number }[] = [];
  private butterflies: { mesh: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number }[] = [];
  private roamingVillagers: {
    rig: WalkingVillagerRig;
    waypoints: [number, number][];
    wpIndex: number;
    speed: number;
    phase: number;
  }[] = [];
  private roamingAnimals: {
    rig: SmallAnimalRig;
    centerX: number;
    centerZ: number;
    radiusX: number;
    radiusZ: number;
    speed: number;
    phase: number;
  }[] = [];
  private waterMeshes: THREE.Mesh[] = [];
  private waterfallDrops: THREE.Mesh[] = [];
  private torchLights: THREE.PointLight[] = [];

  private lastTelemetryAt = 0;
  private currentNearby: NearbyInteraction | null = null;
  private combatCooldownUntil = 0;

  constructor(container: HTMLElement, callbacks: WorldCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.init();
  }

  private detectSoftwareGl(): boolean {
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private init(): void {
    this.isSoftwareGl = this.detectSoftwareGl();

    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x88d4f7);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0x88d4f7, 0.0052);

    this.camera = new THREE.PerspectiveCamera(56, width / height, 0.2, 260);

    // Mandatory studio environment map for PBR gold/steel reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    pmremGenerator.dispose();

    this.textures = createProceduralTextures(this.renderer);

    this.setupLighting();
    this.buildWorldGeometry();
    this.buildCharactersAndObjectives();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.clock.start();
    this.tick();
  }

  private setupLighting(): void {
    const hemi = new THREE.HemisphereLight(0xcbeafe, 0x3f6212, 0.85);
    hemi.position.set(0, 60, 0);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff5d6, 1.45);
    sun.position.set(45, 72, 38);
    sun.castShadow = !this.isSoftwareGl;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 200;
    const d = 85;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0xbae6fd, 0.45);
    rim.position.set(-45, 32, -55);
    this.scene.add(rim);
  }

  private addBoxProp(
    mesh: THREE.Object3D,
    cx: number,
    cz: number,
    halfW: number,
    halfD: number,
    maxY?: number,
  ): void {
    this.scene.add(mesh);
    this.boxColliders.push({
      minX: cx - halfW,
      maxX: cx + halfW,
      minZ: cz - halfD,
      maxZ: cz + halfD,
      maxY,
    });
  }

  private buildWorldGeometry(): void {
    // 1. Extended Ground Plane (beyond playable perimeter so no void edge!)
    const groundMat = new THREE.MeshStandardMaterial({
      map: this.textures.grass,
      roughness: 0.9,
      metalness: 0.02,
    });
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(340, 340),
      groundMat,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Interconnected Stone Paths (Laluan Pengembaraan) offset +0.03 above ground
    const pathMat = new THREE.MeshStandardMaterial({
      map: this.textures.stonePath,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const addPathSegment = (x1: number, z1: number, x2: number, z2: number, width = 5.2) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const pathMesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.08, len),
        pathMat,
      );
      pathMesh.position.set((x1 + x2) / 2, 0.04, (z1 + z2) / 2);
      pathMesh.rotation.y = Math.atan2(dx, dz);
      pathMesh.receiveShadow = true;
      this.scene.add(pathMesh);
    };

    // Hub clearing
    const hubDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(11, 11.5, 0.1, 16),
      pathMat,
    );
    hubDisc.position.set(0, 0.04, 0);
    hubDisc.receiveShadow = true;
    this.scene.add(hubDisc);

    // Paths to all 5 locations
    addPathSegment(0, 0, -46, -32, 4.8); // Rimba Warisan
    addPathSegment(0, 0, 38, -26, 4.8); // Gua Seribu Misteri
    addPathSegment(0, 0, -19, 12, 4.6); // Toward West Bridge
    addPathSegment(-19, 12, -46, 42, 4.6); // Perkampungan Nusantara
    addPathSegment(0, 0, 14, 28, 4.6); // Toward Suspension Bridge
    addPathSegment(26, 28, 46, 40, 4.6); // Lembah Pendekar
    addPathSegment(0, 0, 0, -38, 6.0); // Toward Tangga Istana

    // 3. Rivers & Bridges
    const waterMat = new THREE.MeshStandardMaterial({
      map: this.textures.water,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    const westRiver = new THREE.Mesh(
      new THREE.BoxGeometry(102, 0.12, 7.5),
      waterMat,
    );
    westRiver.position.set(-55, 0.03, 12);
    this.scene.add(westRiver);
    this.waterMeshes.push(westRiver);

    const eastStream = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.12, 62),
      waterMat,
    );
    eastStream.position.set(20, 0.03, 38);
    this.scene.add(eastStream);
    this.waterMeshes.push(eastStream);

    const rimbaStream = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.12, 26),
      waterMat,
    );
    rimbaStream.position.set(-36, 0.03, -24);
    rimbaStream.rotation.y = 0.38;
    this.scene.add(rimbaStream);
    this.waterMeshes.push(rimbaStream);

    // Wooden Bridge West (x in [-24, -14], z in [6, 18])
    const woodMat = new THREE.MeshStandardMaterial({
      map: this.textures.carvedWood,
      roughness: 0.72,
    });
    const westBridge = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.36, 11.6),
      woodMat,
    );
    westBridge.position.set(-19, 0.28, 12);
    westBridge.receiveShadow = true;
    this.scene.add(westBridge);

    // Bridge railings
    [-23.6, -14.4].forEach((rx) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 11.6), woodMat);
      rail.position.set(rx, 0.9, 12);
      this.scene.add(rail);
    });

    // Suspension Bridge East (x in [14, 26], z in [24, 32])
    const suspBridge = new THREE.Mesh(
      new THREE.BoxGeometry(12.2, 0.34, 7.2),
      woodMat,
    );
    suspBridge.position.set(20, 0.34, 28);
    suspBridge.receiveShadow = true;
    this.scene.add(suspBridge);
    [24.5, 31.5].forEach((rz) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(12.2, 1.0, 0.32), woodMat);
      rail.position.set(20, 0.85, rz);
      this.scene.add(rail);
    });

    // 4. Hub Signposts (Papan Tanda Ukiran Kayu)
    const signCoords: [number, number, number][] = [
      [-6, -6, -0.6],
      [6, -6, 0.6],
      [-7, 6, 2.5],
      [7, 6, -2.5],
    ];
    signCoords.forEach(([sx, sz, rot]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 0.35), woodMat);
      post.position.set(sx, 1.1, sz);
      post.castShadow = true;
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.6, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 }),
      );
      board.position.set(sx, 1.85, sz);
      board.rotation.y = rot;
      this.scene.add(post, board);
    });

    // 5. LOCATION 1: RIMBA WARISAN (-44, -28)
    this.buildRimbaWarisan(woodMat);

    // 6. LOCATION 2: GUA SERIBU MISTERI (46, -34)
    this.buildGuaSeribuMisteri();

    // 7. LOCATION 3: PERKAMPUNGAN NUSANTARA (-46, 42)
    this.buildPerkampunganNusantara(woodMat);

    // 8. LOCATION 4: LEMBAH PENDEKAR (46, 38)
    this.buildLembahPendekar(woodMat);

    // 9. LOCATION 5: ISTANA PUNCAK MUSTAFAR (0, -78)
    this.buildIstanaPuncakMustafar(woodMat);

    // 10. Natural Perimeter Forest & Mountain Ridges + Instanced Foliage
    this.buildInstancedFoliageAndMountains();
  }

  private buildRimbaWarisan(woodMat: THREE.Material): void {
    // Giant Hero Pokok Warisan near Tabung 1 (-54, -44)
    const giantTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.9,
    });
    const giantLeafMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.78,
    });
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 2.2, 10, 8),
      giantTrunkMat,
    );
    trunk.position.set(-54, 5, -43.5);
    trunk.castShadow = true;
    this.addBoxProp(trunk, -54, -43.5, 1.8, 1.8);

    [
      [0, 10.5, 0, 5.2],
      [-2.8, 9.2, 1.5, 3.6],
      [2.8, 9.4, -1.5, 3.8],
    ].forEach(([ox, oy, oz, rad]) => {
      const canopy = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rad, 0),
        giantLeafMat,
      );
      canopy.position.set(-54 + ox, oy, -43.5 + oz);
      canopy.castShadow = true;
      this.scene.add(canopy);
    });

    // Pondok Kayu Tradisional (-40, -24)
    const pondok = new THREE.Group();
    pondok.position.set(-40, 0, -26);
    const pFloor = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 4.4), woodMat);
    pFloor.position.y = 0.55;
    pondok.add(pFloor);
    [
      [-1.8, -1.8],
      [1.8, -1.8],
      [-1.8, 1.8],
      [1.8, 1.8],
    ].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.0, 0.28), woodMat);
      pillar.position.set(px, 1.5, pz);
      pillar.castShadow = true;
      pondok.add(pillar);
    });
    const pRoof = new THREE.Mesh(
      new THREE.ConeGeometry(3.7, 2.0, 4),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }),
    );
    pRoof.rotation.y = Math.PI / 4;
    pRoof.position.y = 3.9;
    pRoof.castShadow = true;
    pondok.add(pRoof);
    this.addBoxProp(pondok, -40, -26, 2.2, 2.2);

    // Wildflowers & flying birds / butterflies
    const flowerColors = [0xf43f5e, 0xfacc15, 0xa855f7, 0xfb923c];
    for (let i = 0; i < 18; i++) {
      const fx = -58 + ((i * 19) % 34);
      const fz = -44 + ((i * 23) % 28);
      const stem = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.35, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x16a34a }),
      );
      stem.position.set(fx, 0.17, fz);
      const blossom = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.22, 0.28),
        new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length] }),
      );
      blossom.position.set(fx, 0.4, fz);
      this.scene.add(stem, blossom);
    }

    // Flying Birds
    const birdMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 });
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.5), birdMat);
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.22), birdMat);
      wingL.position.x = -0.35;
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.22), birdMat);
      wingR.position.x = 0.35;
      b.add(body, wingL, wingR);
      b.position.set(-45, 7 + i * 1.2, -30);
      this.scene.add(b);
      this.birds.push({
        mesh: b,
        centerX: -45,
        centerZ: -30,
        radius: 9 + i * 3,
        speed: 0.55 + i * 0.12,
        phase: i * 1.5,
      });
    }

    // Butterflies
    for (let i = 0; i < 6; i++) {
      const bf = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.06, 0.2),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfbbf24 : 0x38bdf8 }),
      );
      const bx = -52 + i * 4.5;
      const bz = -36 + (i % 3) * 5;
      bf.position.set(bx, 1.4, bz);
      this.scene.add(bf);
      this.butterflies.push({
        mesh: bf,
        baseX: bx,
        baseY: 1.4,
        baseZ: bz,
        phase: i * 1.2,
      });
    }
  }

  private buildGuaSeribuMisteri(): void {
    const caveMat = new THREE.MeshStandardMaterial({
      map: this.textures.caveRock,
      roughness: 0.88,
      metalness: 0.08,
    });
    const darkFloorMat = new THREE.MeshStandardMaterial({
      color: 0x272430,
      roughness: 0.92,
    });

    // Cave floor slab
    const caveFloor = new THREE.Mesh(
      new THREE.BoxGeometry(36, 0.14, 34),
      darkFloorMat,
    );
    caveFloor.position.set(48, 0.04, -36);
    caveFloor.receiveShadow = true;
    this.scene.add(caveFloor);

    // Cave outer mountain walls with open entrance facing (-X, +Z) toward (30, -20)
    const wallSpecs: [number, number, number, number, number][] = [
      // [cx, cz, width, height, depth]
      [48, -53, 36, 12, 4], // North back wall
      [66, -36, 4, 12, 34], // East side wall
      [31, -42, 4, 11, 22], // West upper wall (leaves entrance south of z=-31)
      [51, -20, 26, 11, 4], // South-east wall (leaves entrance west of x=38)
      // Winding interior partition pillars
      [46, -35, 3.5, 9, 9],
      [54, -31, 4, 9, 3.5],
    ];
    wallSpecs.forEach(([wx, wz, ww, wh, wd]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, wd), caveMat);
      m.position.set(wx, wh / 2, wz);
      m.castShadow = true;
      m.receiveShadow = true;
      this.addBoxProp(m, wx, wz, ww / 2, wd / 2);
    });

    // Cave roof canopy with high arches so third-person camera stays comfortable inside
    const roof = new THREE.Mesh(new THREE.BoxGeometry(38, 2.2, 36), caveMat);
    roof.position.set(49, 11.5, -36);
    this.scene.add(roof);

    // Entrance Archway
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(10, 2.5, 4), caveMat);
    archTop.position.set(34, 9.5, -24);
    this.scene.add(archTop);

    // Colorful glowing crystals & wall torches inside cave
    const crystalColors = [0xa855f7, 0x22d3ee, 0xf472b6, 0x34d399];
    const crystalSpots: [number, number][] = [
      [39, -46],
      [59, -47],
      [61, -35],
      [41, -30],
      [52, -25],
      [60, -26],
    ];
    crystalSpots.forEach(([cx, cz], idx) => {
      const col = crystalColors[idx % crystalColors.length];
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 2.4, 5),
        new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.65,
          roughness: 0.2,
          metalness: 0.3,
        }),
      );
      crystal.position.set(cx, 1.2, cz);
      crystal.rotation.z = (idx % 2 === 0 ? 1 : -1) * 0.15;
      this.scene.add(crystal);
      this.circleColliders.push({ x: cx, z: cz, radius: 0.7 });
    });

    // Torches
    const torchSpots: [number, number][] = [
      [34, -28],
      [43, -40],
      [56, -42],
    ];
    torchSpots.forEach(([tx, tz]) => {
      const stick = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 1.8, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x78350f }),
      );
      stick.position.set(tx, 1.2, tz);
      const flame = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.25, 0),
        new THREE.MeshBasicMaterial({ color: 0xfb923c }),
      );
      flame.position.set(tx, 2.2, tz);
      this.scene.add(stick, flame);

      const pl = new THREE.PointLight(0xf97316, 2.6, 16);
      pl.position.set(tx, 2.6, tz);
      this.scene.add(pl);
      this.torchLights.push(pl);
    });
  }

  private buildPerkampunganNusantara(woodMat: THREE.Material): void {
    // 2 Traditional Malay Rumah Panggung stilt houses
    const rumah1 = createRumahPanggung(this.textures);
    rumah1.position.set(-48, 0, 32);
    this.addBoxProp(rumah1, -48, 32, 3.0, 2.4);

    const rumah2 = createRumahPanggung(this.textures);
    rumah2.position.set(-60, 0, 44);
    rumah2.rotation.y = Math.PI / 2;
    this.addBoxProp(rumah2, -60, 44, 2.4, 3.0);

    // Sawah Padi (Paddy Fields)
    const paddyMat = new THREE.MeshStandardMaterial({
      map: this.textures.paddyField,
      roughness: 0.85,
    });
    const sawah1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 12), paddyMat);
    sawah1.position.set(-34, 0.05, 52);
    sawah1.receiveShadow = true;
    this.scene.add(sawah1);

    // Pasar Tradisional Stalls (Batik & Kuih)
    const batikMat = new THREE.MeshStandardMaterial({
      map: this.textures.songketGold,
      roughness: 0.55,
    });
    const stallCoords: [number, number][] = [
      [-48, 52],
      [-48, 44],
    ];
    stallCoords.forEach(([sx, sz]) => {
      const stall = new THREE.Group();
      stall.position.set(sx, 0, sz);
      const table = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.8), woodMat);
      table.position.y = 0.45;
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 2.4), batikMat);
      canopy.position.y = 2.6;
      [-1.5, 1.5].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.5, 0.18), woodMat);
        post.position.set(px, 1.25, 0);
        stall.add(post);
      });
      // Colorful kuih boxes
      [0xfbbf24, 0x22c55e, 0xf43f5e].forEach((kc, ki) => {
        const kuih = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.2, 0.45),
          new THREE.MeshStandardMaterial({ color: kc }),
        );
        kuih.position.set(-0.8 + ki * 0.8, 1.0, 0);
        stall.add(kuih);
      });
      stall.add(table, canopy);
      this.addBoxProp(stall, sx, sz, 1.7, 1.0);
    });

    // Wau Bulan monument
    const wau = createWauBulan();
    wau.position.set(-38, 0, 38);
    this.scene.add(wau);
    this.circleColliders.push({ x: -38, z: 38, radius: 0.6 });

    // Kompang & Gendang display rack
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.38, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 }),
    );
    drum.position.set(-44, 0.45, 42);
    this.scene.add(drum);
  }

  private buildLembahPendekar(woodMat: THREE.Material): void {
    // Gelanggang Seni Silat (48, 44)
    const arenaFloor = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.25, 14),
      new THREE.MeshStandardMaterial({
        map: this.textures.stonePath,
        roughness: 0.82,
      }),
    );
    arenaFloor.position.set(48, 0.12, 44);
    arenaFloor.receiveShadow = true;
    this.scene.add(arenaFloor);

    // 4 Carved Corner Pillars around Gelanggang Silat
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.8,
    });
    [
      [41.5, 37.5],
      [54.5, 37.5],
      [41.5, 50.5],
      [54.5, 50.5],
    ].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 4.2, 0.65), woodMat);
      pillar.position.set(px, 2.1, pz);
      pillar.castShadow = true;
      const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), goldMat);
      cap.position.set(px, 4.45, pz);
      this.addBoxProp(pillar, px, pz, 0.45, 0.45);
      this.scene.add(cap);
    });

    // Weapon Exhibition Rack + Gong
    const rack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 0.4), woodMat);
    rack.position.set(52, 0.9, 38.5);
    this.addBoxProp(rack, 52, 38.5, 1.6, 0.3);

    const gong = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 0.18, 16),
      goldMat,
    );
    gong.rotation.x = Math.PI / 2;
    gong.position.set(44, 1.6, 38.5);
    this.scene.add(gong);

    // Rocky Cliff & Air Terjun (Waterfall) at (64, 34)
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x57534e,
      roughness: 0.92,
    });
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(10, 16, 18), cliffMat);
    cliff.position.set(66, 8, 34);
    cliff.castShadow = true;
    this.addBoxProp(cliff, 66, 34, 5, 9);

    const waterfallRibbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 14, 4.2),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.85,
      }),
    );
    waterfallRibbon.position.set(60.8, 7, 34);
    this.scene.add(waterfallRibbon);

    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, 0.14, 16),
      new THREE.MeshStandardMaterial({
        map: this.textures.water,
        roughness: 0.15,
      }),
    );
    pool.position.set(57, 0.06, 34);
    this.scene.add(pool);
    this.waterMeshes.push(pool);

    // Animated waterfall drops
    for (let i = 0; i < 10; i++) {
      const drop = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.8, 0.35),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe }),
      );
      drop.position.set(60.4, (i * 1.4) % 14, 32.5 + (i % 4) * 0.9);
      this.scene.add(drop);
      this.waterfallDrops.push(drop);
    }

    // Bamboo Grove (InstancedMesh)
    const bambooGeo = new THREE.CylinderGeometry(0.16, 0.2, 6.5, 6);
    const bambooMat = new THREE.MeshStandardMaterial({
      color: 0x65a30d,
      roughness: 0.55,
    });
    const bambooCount = 32;
    const bambooInst = new THREE.InstancedMesh(bambooGeo, bambooMat, bambooCount);
    bambooInst.castShadow = true;
    let idx = 0;
    for (let i = 0; i < bambooCount; i++) {
      const bx = 30 + ((i * 11) % 28);
      const bz = 54 + ((i * 7) % 14);
      _pos.set(bx, 3.25, bz);
      _quat.identity();
      _scale.set(1, 0.85 + (i % 4) * 0.15, 1);
      _mat4.compose(_pos, _quat, _scale);
      bambooInst.setMatrixAt(idx++, _mat4);
      if (i % 3 === 0) this.circleColliders.push({ x: bx, z: bz, radius: 0.35 });
    }
    bambooInst.instanceMatrix.needsUpdate = true;
    bambooInst.computeBoundingSphere();
    this.scene.add(bambooInst);
  }

  private buildIstanaPuncakMustafar(woodMat: THREE.Material): void {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.88,
    });
    const palaceWallMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.55,
    });
    const royalFloorMat = new THREE.MeshStandardMaterial({
      map: this.textures.palaceFloor,
      roughness: 0.35,
      metalness: 0.15,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.22,
      metalness: 0.88,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.52,
    });

    // Mountain Plateau Block (y from 0 to 8.0)
    const plateau = new THREE.Mesh(
      new THREE.BoxGeometry(54, 8.0, 44),
      stoneMat,
    );
    plateau.position.set(0, 4.0, -85);
    plateau.receiveShadow = true;
    this.scene.add(plateau);

    // Palace Courtyard Royal Floor (y = 8.04)
    const courtyard = new THREE.Mesh(
      new THREE.BoxGeometry(46, 0.1, 38),
      royalFloorMat,
    );
    courtyard.position.set(0, 8.03, -84);
    courtyard.receiveShadow = true;
    this.scene.add(courtyard);

    // Grand 16-Step Tangga Batu Diraja (z from -38 to -64, y from 0 to 8)
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / steps;
      const stepH = t * 8.0;
      const stepZ = -38 - i * (26 / steps);
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(14, stepH, 26 / steps + 0.2),
        stoneMat,
      );
      step.position.set(0, stepH / 2, stepZ);
      step.receiveShadow = true;
      step.castShadow = true;
      this.scene.add(step);
    }

    // Staircase Balustrades
    [-7.3, 7.3].forEach((bx) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 2.2, 27),
        stoneMat,
      );
      rail.position.set(bx, 4.5, -51);
      rail.rotation.x = 0.295;
      this.addBoxProp(rail, bx, -51, 0.5, 13.5);
    });

    // Gerbang Diraja Archway at top of stairs (z = -65)
    [-5.5, 5.5].forEach((gx) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.8, 7.5, 1.8), goldMat);
      col.position.set(gx, 11.75, -65);
      col.castShadow = true;
      this.addBoxProp(col, gx, -65, 0.95, 0.95);
    });
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(13.5, 1.8, 2.0), roofMat);
    archBeam.position.set(0, 15.8, -65);
    const archCrest = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), goldMat);
    archCrest.position.set(0, 17.5, -65);
    this.scene.add(archBeam, archCrest);

    // Taman Bunga & Air Pancut Fountain at (-14, -76)
    const fountainBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.5, 0.8, 12),
      stoneMat,
    );
    fountainBase.position.set(-14, 8.4, -76);
    const fountainWater = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 0.2, 12),
      new THREE.MeshStandardMaterial({ map: this.textures.water, roughness: 0.15 }),
    );
    fountainWater.position.set(-14, 8.78, -76);
    const fountainSpire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.7, 2.4, 8),
      goldMat,
    );
    fountainSpire.position.set(-14, 9.6, -76);
    this.addBoxProp(fountainBase, -14, -76, 3.2, 3.2);
    this.scene.add(fountainWater, fountainSpire);

    // Balai Istana & Singgahsana (Throne Hall at z = -88..-98)
    const hallPillars: [number, number][] = [
      [-10, -82],
      [10, -82],
      [-10, -96],
      [10, -96],
    ];
    hallPillars.forEach(([px, pz]) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, 8.5, 1.4), woodMat);
      p.position.set(px, 12.25, pz);
      p.castShadow = true;
      this.addBoxProp(p, px, pz, 0.8, 0.8);
    });

    // Back Throne Wall + Palace Roof
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(24, 9, 1.6),
      palaceWallMat,
    );
    backWall.position.set(0, 12.5, -98);
    this.addBoxProp(backWall, 0, -98, 12, 0.9);

    const palaceRoof = new THREE.Mesh(
      new THREE.ConeGeometry(18, 6.5, 4),
      roofMat,
    );
    palaceRoof.rotation.y = Math.PI / 4;
    palaceRoof.position.set(0, 20.0, -89);
    palaceRoof.castShadow = true;
    this.scene.add(palaceRoof);

    // Singgahsana (Royal Throne) at (0, 8, -94)
    const dais = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 0.7, 4.4),
      new THREE.MeshStandardMaterial({ map: this.textures.songketGold, roughness: 0.45 }),
    );
    dais.position.set(0, 8.35, -94);
    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.4, 0.45), goldMat);
    throneBack.position.set(0, 10.4, -95.2);
    const throneSeat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.6), roofMat);
    throneSeat.position.set(0, 9.15, -94.3);
    this.addBoxProp(dais, 0, -94, 3.2, 2.2);
    this.scene.add(throneBack, throneSeat);
  }

  private buildInstancedFoliageAndMountains(): void {
    // Instanced Tropical Trees (> 70 trees around Rimba & world perimeter)
    const treePositions: [number, number, number][] = [];
    // Rimba Warisan dense grove
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const r = 18 + (i % 3) * 8;
      const tx = -46 + Math.cos(ang) * r;
      const tz = -30 + Math.sin(ang) * r;
      if (Math.hypot(tx - -54, tz - -38) > 6 && Math.hypot(tx, tz) > 14) {
        treePositions.push([tx, tz, 0.85 + (i % 4) * 0.12]);
      }
    }
    // Natural outer forest perimeter around [-104..104]
    for (let i = 0; i < 56; i++) {
      const t = (i / 56) * Math.PI * 2;
      const rad = 98 + (i % 2) * 6;
      const tx = Math.cos(t) * rad;
      const tz = Math.sin(t) * rad;
      // Skip right behind Istana plateau
      if (tz < -60 && Math.abs(tx) < 30) continue;
      treePositions.push([tx, tz, 0.95 + (i % 3) * 0.15]);
    }

    const trunkGeo = new THREE.CylinderGeometry(0.45, 0.65, 3.8, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
    const leafGeo = new THREE.DodecahedronGeometry(2.2, 0);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
    const leaves = new THREE.InstancedMesh(leafGeo, leafMat, treePositions.length);
    trunks.castShadow = true;
    leaves.castShadow = true;

    const greenTints = [0x15803d, 0x16a34a, 0x22c55e, 0x166534];
    treePositions.forEach(([tx, tz, sc], idx) => {
      _pos.set(tx, 1.9 * sc, tz);
      _quat.identity();
      _scale.set(sc, sc, sc);
      _mat4.compose(_pos, _quat, _scale);
      trunks.setMatrixAt(idx, _mat4);

      _pos.set(tx, 4.6 * sc, tz);
      _scale.set(sc, sc * 1.05, sc);
      _mat4.compose(_pos, _quat, _scale);
      leaves.setMatrixAt(idx, _mat4);

      _color.setHex(greenTints[idx % greenTints.length]);
      leaves.setColorAt(idx, _color);

      this.circleColliders.push({ x: tx, z: tz, radius: 0.85 * sc });
    });
    trunks.instanceMatrix.needsUpdate = true;
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    trunks.computeBoundingSphere();
    leaves.computeBoundingSphere();
    this.scene.add(trunks, leaves);

    // Distant Nusantara Mountain Peaks on horizon
    const mtnMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.95,
    });
    const mtnSpecs: [number, number, number, number][] = [
      [-115, -110, 32, 38],
      [-55, -125, 28, 44],
      [0, -135, 36, 52],
      [60, -125, 30, 42],
      [118, -105, 34, 38],
      [-125, 45, 30, 34],
      [125, 50, 32, 36],
    ];
    mtnSpecs.forEach(([mx, mz, mr, mh]) => {
      const mtn = new THREE.Mesh(new THREE.ConeGeometry(mr, mh, 6), mtnMat);
      mtn.position.set(mx, mh / 2 - 1, mz);
      this.scene.add(mtn);
    });
  }

  private buildCharactersAndObjectives(): void {
    // 1. Player: Raja Mustafar
    this.playerRig = createRajaMustafarRig(this.textures);
    this.playerRig.group.position.copy(this.playerPos);
    this.scene.add(this.playerRig.group);

    // 2. NPCs (Awang Kenit, Badang, Mak Cik Melur) + Floating Labels
    for (const npc of NPCS) {
      const model = createNpcModel(npc.variant, this.textures);
      const y = groundHeightAt(npc.position[0], npc.position[1]);
      model.position.set(npc.position[0], y, npc.position[1]);
      model.lookAt(0, y, 0);
      const npcLabel = createFloatingLabelSprite(
        npc.name,
        npc.role,
        '#0c2417',
        '#10b981',
        '#ecfdf5',
      );
      npcLabel.position.set(0, npc.variant === 'awang' ? 2.6 : 3.0, 0);
      npcLabel.scale.set(3.4, 0.96, 1);
      model.add(npcLabel);
      this.scene.add(model);
      this.npcModels.set(npc.id, model);
      this.circleColliders.push({ x: npc.position[0], z: npc.position[1], radius: 0.65 });
    }

    // 3. Five Tabung Pitis + Floating Labels
    for (const q of TABUNG_QUESTIONS) {
      const rig = createTabungPitisRig(this.textures);
      const y = groundHeightAt(q.position[0], q.position[1]);
      rig.group.position.set(q.position[0], y, q.position[1]);
      const tLabel = createFloatingLabelSprite(
        `TABUNG PITIS ${q.id}`,
        q.locationName,
        '#2b1605',
        '#fbbf24',
        '#fef3c7',
      );
      tLabel.position.set(0, 2.55, 0);
      tLabel.scale.set(3.5, 0.98, 1);
      rig.group.add(tLabel);
      this.scene.add(rig.group);
      this.tabungRigs.set(q.id, rig);
      this.circleColliders.push({ x: q.position[0], z: q.position[1], radius: 1.0 });
    }

    // 4. Five Raksasa with Clear Floating Labels
    for (const m of MONSTERS) {
      const rig = createMonsterRig(m.variant);
      const y = groundHeightAt(m.position[0], m.position[1]);
      rig.group.position.set(m.position[0], y, m.position[1]);
      const mLabel = createFloatingLabelSprite(
        m.name,
        `${m.title} · +${m.rewardKupang} Kupang`,
        '#450a0a',
        '#f87171',
        '#fef2f2',
      );
      mLabel.position.set(0, 4.15, 0);
      mLabel.scale.set(4.8, 1.35, 1);
      rig.group.add(mLabel);
      this.scene.add(rig.group);
      this.monsterRigs.set(m.id, {
        rig,
        baseX: m.position[0],
        baseZ: m.position[1],
      });
    }

    // 5. Hidden Bonus Kupang Orbs
    const orbGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 12);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.2,
    });
    for (const orb of BONUS_ORBS) {
      const m = new THREE.Mesh(orbGeo, orbMat);
      m.rotation.z = Math.PI / 2;
      const y = groundHeightAt(orb.position[0], orb.position[1]) + 1.0;
      m.position.set(orb.position[0], y, orb.position[1]);
      this.scene.add(m);
      this.bonusOrbMeshes.set(orb.id, m);
    }

    // 6. Roaming Orang Kampung & Pengawal Istana (keeps world lively!)
    const villagerSpecs: {
      cloth: number;
      hat: number;
      waypoints: [number, number][];
      speed: number;
    }[] = [
      // Dataran Permulaan strollers
      {
        cloth: 0x0f766e,
        hat: 0x111827,
        waypoints: [
          [-9, 3],
          [-4, 10],
          [8, 8],
          [9, -2],
        ],
        speed: 2.0,
      },
      {
        cloth: 0xd97706,
        hat: 0x7c2d12,
        waypoints: [
          [7, -10],
          [-7, -11],
          [-10, -2],
          [6, -3],
        ],
        speed: 1.85,
      },
      // Perkampungan Nusantara villagers
      {
        cloth: 0x059669,
        hat: 0x92400e,
        waypoints: [
          [-38, 30],
          [-53, 38],
          [-52, 48],
          [-39, 45],
        ],
        speed: 2.1,
      },
      {
        cloth: 0xb91c1c,
        hat: 0x1e293b,
        waypoints: [
          [-55, 50],
          [-42, 54],
          [-36, 42],
          [-46, 36],
        ],
        speed: 1.9,
      },
      {
        cloth: 0x1d4ed8,
        hat: 0x111827,
        waypoints: [
          [-26, 18],
          [-35, 28],
          [-27, 36],
          [-20, 22],
        ],
        speed: 2.2,
      },
      // Lembah Pendekar disciples
      {
        cloth: 0x0284c7,
        hat: 0x991b1b,
        waypoints: [
          [38, 36],
          [52, 36],
          [52, 50],
          [38, 50],
        ],
        speed: 2.3,
      },
      // Istana Puncak Mustafar guards
      {
        cloth: 0x991b1b,
        hat: 0xf59e0b,
        waypoints: [
          [-12, -72],
          [-12, -88],
          [-6, -88],
          [-6, -72],
        ],
        speed: 1.8,
      },
      {
        cloth: 0x991b1b,
        hat: 0xf59e0b,
        waypoints: [
          [12, -72],
          [12, -88],
          [6, -88],
          [6, -72],
        ],
        speed: 1.8,
      },
    ];

    villagerSpecs.forEach((vs, i) => {
      const rig = createWalkingVillagerRig(vs.cloth, vs.hat, this.textures);
      const [sx, sz] = vs.waypoints[0];
      rig.group.position.set(sx, groundHeightAt(sx, sz), sz);
      this.scene.add(rig.group);
      this.roamingVillagers.push({
        rig,
        waypoints: vs.waypoints,
        wpIndex: 1,
        speed: vs.speed,
        phase: i * 1.1,
      });
    });

    // 7. Roaming Small Animals (Ayam Kampung, Itik, Tupai, Kancil)
    const animalSpecs: {
      species: 'ayam' | 'kancil' | 'tupai' | 'itik';
      cx: number;
      cz: number;
      rx: number;
      rz: number;
      speed: number;
    }[] = [
      // Perkampungan chickens & ducks
      { species: 'ayam', cx: -45, cz: 36, rx: 4.5, rz: 3.5, speed: 0.75 },
      { species: 'ayam', cx: -52, cz: 46, rx: 4.0, rz: 4.0, speed: 0.85 },
      { species: 'ayam', cx: -40, cz: 48, rx: 3.5, rz: 4.5, speed: 0.65 },
      { species: 'itik', cx: -32, cz: 19, rx: 5.0, rz: 2.2, speed: 0.6 },
      { species: 'itik', cx: -28, cz: 21, rx: 4.0, rz: 2.0, speed: 0.7 },
      // Rimba Warisan squirrels & mousedeer
      { species: 'tupai', cx: -48, cz: -34, rx: 5.5, rz: 4.5, speed: 1.05 },
      { species: 'tupai', cx: -36, cz: -28, rx: 4.5, rz: 5.5, speed: 0.95 },
      { species: 'kancil', cx: -50, cz: -22, rx: 6.0, rz: 5.0, speed: 0.7 },
      // Dataran Permulaan & Lembah Pendekar kancil
      { species: 'kancil', cx: 10, cz: 6, rx: 4.5, rz: 4.0, speed: 0.72 },
      { species: 'kancil', cx: 40, cz: 42, rx: 5.0, rz: 4.5, speed: 0.68 },
      { species: 'tupai', cx: 34, cz: 50, rx: 4.0, rz: 3.5, speed: 1.0 },
      // Istana Taman Bunga kancil
      { species: 'kancil', cx: -16, cz: -84, rx: 4.0, rz: 4.5, speed: 0.62 },
    ];

    animalSpecs.forEach((as, i) => {
      const rig = createSmallAnimalRig(as.species);
      const y = groundHeightAt(as.cx, as.cz);
      rig.group.position.set(as.cx, y, as.cz);
      this.scene.add(rig.group);
      this.roamingAnimals.push({
        rig,
        centerX: as.cx,
        centerZ: as.cz,
        radiusX: as.rx,
        radiusZ: as.rz,
        speed: as.speed,
        phase: i * 1.4,
      });
    });

    // 8. Decorative Wooden Lantern Posts & Bushes along paths
    const lanternSpots: [number, number][] = [
      [-10, -8],
      [10, -8],
      [-24, -15],
      [22, -14],
      [-14, 12],
      [12, 22],
      [-6, -34],
      [6, -34],
    ];
    const postMat = new THREE.MeshStandardMaterial({
      map: this.textures.carvedWood,
      roughness: 0.75,
    });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.75,
    });
    lanternSpots.forEach(([lx, lz]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.26, 2.8, 0.26), postMat);
      post.position.set(lx, 1.4, lz);
      post.castShadow = true;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), lampMat);
      head.position.set(lx, 2.95, lz);
      this.scene.add(post, head);
      this.circleColliders.push({ x: lx, z: lz, radius: 0.3 });
    });

    const bushMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85 });
    const bushSpots: [number, number][] = [
      [-12, -2],
      [12, 2],
      [-18, -10],
      [18, -10],
      [-30, 38],
      [-42, 26],
      [30, 36],
      [42, 24],
      [-16, -70],
      [16, -70],
    ];
    bushSpots.forEach(([bx, bz], i) => {
      const by = groundHeightAt(bx, bz);
      const bush = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.85 + (i % 2) * 0.25, 0),
        bushMat,
      );
      bush.position.set(bx, by + 0.55, bz);
      bush.castShadow = true;
      this.scene.add(bush);
    });
  }

  // External state synchronization
  public syncProgressState(opts: {
    solvedTabungs: number[];
    defeatedMonsters: string[];
    collectedOrbs: string[];
    hasShield: boolean;
    hasAura: boolean;
  }): void {
    this.tabungSolved = new Set(opts.solvedTabungs);
    for (const [id, rig] of this.tabungRigs) {
      const solved = this.tabungSolved.has(id);
      rig.beaconMesh.visible = !solved;
      rig.ringMesh.visible = !solved;
      if (solved) {
        rig.lidPivot.rotation.x = -Math.PI * 0.55;
        rig.glowLight.intensity = 0.5;
      }
    }

    this.defeatedMonsters = new Set(opts.defeatedMonsters);
    for (const [id, entry] of this.monsterRigs) {
      entry.rig.group.visible = !this.defeatedMonsters.has(id);
    }

    this.collectedOrbs = new Set(opts.collectedOrbs);
    for (const [id, mesh] of this.bonusOrbMeshes) {
      mesh.visible = !this.collectedOrbs.has(id);
    }

    this.playerRig.shieldMesh.visible = opts.hasShield;
    this.playerRig.auraRing.visible = opts.hasAura;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.keys = {};
      this.joystick = { x: 0, y: 0 };
    }
  }

  public setCombatCooldown(ms: number): void {
    this.combatCooldownUntil = performance.now() + ms;
  }

  public setVirtualJoystick(x: number, y: number): void {
    this.joystick.x = x;
    this.joystick.y = y;
  }

  public setTouchRun(running: boolean): void {
    this.touchRun = running;
  }

  public triggerJump(): void {
    if (this.paused) return;
    if (this.isGrounded) {
      this.playerVelY = 10.5;
      this.isGrounded = false;
      audioEngine.playJump();
    }
  }

  public triggerInteract(): void {
    if (this.paused || !this.currentNearby) return;
    const target = this.currentNearby;
    if (target.type === 'tabung') {
      audioEngine.playChestOpen();
      this.callbacks.onOpenTabung(Number(target.id));
    } else if (target.type === 'npc') {
      this.callbacks.onTalkNpc(String(target.id));
    } else if (target.type === 'monster') {
      this.callbacks.onTriggerMonster(String(target.id));
    }
  }

  public rotateCameraBy(deltaYaw: number, deltaPitch = 0): void {
    this.cameraYaw -= deltaYaw;
    this.cameraPitch = THREE.MathUtils.clamp(
      this.cameraPitch + deltaPitch,
      0.12,
      1.05,
    );
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Ignore game movement keys while typing inside an input/textarea
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.code === 'Escape') {
      this.callbacks.onTogglePause();
      return;
    }
    if (e.code === 'KeyI' && !this.paused) {
      this.callbacks.onToggleInventory();
      return;
    }
    if (e.code === 'KeyE' && !this.paused) {
      this.triggerInteract();
      return;
    }
    if (e.code === 'Space' && !this.paused) {
      e.preventDefault();
      this.triggerJump();
    }
    this.keys[e.code] = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onPointerDown = (e: PointerEvent) => {
    audioEngine.unlock();
    this.isDraggingCamera = true;
    this.dragPointerId = e.pointerId;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDraggingCamera || e.pointerId !== this.dragPointerId) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.rotateCameraBy(dx * 0.006, dy * 0.004);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerId === this.dragPointerId) {
      this.isDraggingCamera = false;
      this.dragPointerId = null;
    }
  };

  private onWheel = (e: WheelEvent) => {
    this.cameraDistance = THREE.MathUtils.clamp(
      this.cameraDistance + e.deltaY * 0.008,
      5.5,
      16,
    );
  };

  private onResize = () => {
    if (!this.container || this.disposed) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('wheel', this.onWheel, { passive: true });
  }

  private tick = (): void => {
    if (this.disposed) return;

    const dt = Math.min(this.clock.getDelta(), 0.06);
    const elapsed = this.clock.getElapsedTime();

    if (!this.paused) {
      this.updatePlayer(dt, elapsed);
      this.updateEntities(dt, elapsed);
      this.checkProximityAndAutoTriggers(elapsed);
    }

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updatePlayer(dt: number, elapsed: number): void {
    // Camera orbit via Q / E? No, E is interact. Allow ArrowLeft/ArrowRight or mouse drag.
    if (this.keys['KeyQ']) this.rotateCameraBy(-1.8 * dt, 0);

    // Movement input relative to camera yaw
    let inputForward = 0;
    let inputRight = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputRight -= 1;

    // Merge virtual joystick (-1..1)
    if (Math.abs(this.joystick.x) > 0.1 || Math.abs(this.joystick.y) > 0.1) {
      inputRight += this.joystick.x;
      inputForward -= this.joystick.y; // up on screen = negative y = forward
    }

    const inputMag = Math.hypot(inputForward, inputRight);
    const isMoving = inputMag > 0.08;
    const isRunning =
      this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchRun;
    const speed = isRunning ? 12.2 : 7.4;

    if (isMoving) {
      // Forward vector from cameraYaw: (-sin(yaw), 0, -cos(yaw))
      // Right vector: (cos(yaw), 0, -sin(yaw))
      const sinY = Math.sin(this.cameraYaw);
      const cosY = Math.cos(this.cameraYaw);
      _moveDir.set(
        -sinY * inputForward + cosY * inputRight,
        0,
        -cosY * inputForward - sinY * inputRight,
      );
      if (_moveDir.lengthSq() > 0.0001) {
        _moveDir.normalize();
      }

      this.playerPos.x += _moveDir.x * speed * dt;
      this.playerPos.z += _moveDir.z * speed * dt;

      // Smoothly turn Raja Mustafar toward movement direction
      const targetYaw = Math.atan2(_moveDir.x, _moveDir.z);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * (1 - Math.exp(-12 * dt));
    }

    // Collisions
    resolveCollisions(
      this.playerPos,
      0.58,
      this.boxColliders,
      this.circleColliders,
    );

    // Gravity & Ground Elevation (stairs, bridges, plateau)
    const groundY = groundHeightAt(this.playerPos.x, this.playerPos.z);
    if (!this.isGrounded || this.playerPos.y > groundY + 0.05) {
      this.playerVelY -= 26 * dt;
      this.playerPos.y += this.playerVelY * dt;
      if (this.playerPos.y <= groundY) {
        this.playerPos.y = groundY;
        this.playerVelY = 0;
        this.isGrounded = true;
      }
    } else {
      // Smooth step climbing
      this.playerPos.y = THREE.MathUtils.damp(this.playerPos.y, groundY, 22, dt);
      this.playerVelY = 0;
      this.isGrounded = true;
    }

    this.playerRig.group.position.copy(this.playerPos);
    this.playerRig.bodyGroup.rotation.y = this.playerYaw;

    // Articulated Walk/Run/Idle/Jump Animation
    if (!this.isGrounded) {
      this.playerRig.leftLegPivot.rotation.x = 0.35;
      this.playerRig.rightLegPivot.rotation.x = -0.35;
      this.playerRig.leftArmPivot.rotation.x = -0.7;
      this.playerRig.rightArmPivot.rotation.x = -0.7;
    } else if (isMoving) {
      const freq = isRunning ? 13.5 : 8.5;
      const amp = isRunning ? 0.78 : 0.52;
      this.walkPhase += dt * freq;
      const s = Math.sin(this.walkPhase);
      this.playerRig.leftLegPivot.rotation.x = s * amp;
      this.playerRig.rightLegPivot.rotation.x = -s * amp;
      this.playerRig.leftArmPivot.rotation.x = -s * amp * 0.85;
      this.playerRig.rightArmPivot.rotation.x = s * amp * 0.85;
      this.playerRig.bodyGroup.position.y = Math.abs(Math.cos(this.walkPhase)) * 0.09;

      this.stepTimer += dt;
      const stepInterval = isRunning ? 0.25 : 0.38;
      if (this.stepTimer >= stepInterval) {
        this.stepTimer = 0;
        audioEngine.playFootstep(isRunning);
      }
    } else {
      const dampRate = 12;
      this.playerRig.leftLegPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.leftLegPivot.rotation.x,
        0,
        dampRate,
        dt,
      );
      this.playerRig.rightLegPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.rightLegPivot.rotation.x,
        0,
        dampRate,
        dt,
      );
      this.playerRig.leftArmPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.leftArmPivot.rotation.x,
        0,
        dampRate,
        dt,
      );
      this.playerRig.rightArmPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.rightArmPivot.rotation.x,
        0,
        dampRate,
        dt,
      );
      // Subtle breathing idle
      this.playerRig.bodyGroup.position.y = Math.sin(elapsed * 2.4) * 0.025;
    }

    if (this.playerRig.auraRing.visible) {
      this.playerRig.auraRing.rotation.z = elapsed * 1.8;
    }
  }

  private updateEntities(dt: number, elapsed: number): void {
    // Animate Tabung Pitis glow & ring
    for (const [id, rig] of this.tabungRigs) {
      if (!this.tabungSolved.has(id)) {
        rig.ringMesh.rotation.z = elapsed * 0.9;
        rig.glowLight.intensity = 1.8 + Math.sin(elapsed * 3.5 + id) * 0.5;
      }
    }

    // Animate Raksasa patrolling gently around their posts
    for (const [id, entry] of this.monsterRigs) {
      if (this.defeatedMonsters.has(id)) continue;
      const orbitAngle = elapsed * 0.55;
      const mx = entry.baseX + Math.cos(orbitAngle) * 2.2;
      const mz = entry.baseZ + Math.sin(orbitAngle) * 2.2;
      const my = groundHeightAt(mx, mz);
      entry.rig.group.position.set(mx, my, mz);
      entry.rig.bodyGroup.position.y = Math.abs(Math.sin(elapsed * 3.2)) * 0.14;
      entry.rig.leftArm.rotation.x = Math.sin(elapsed * 3.2) * 0.35;
      entry.rig.rightArm.rotation.x = -Math.sin(elapsed * 3.2) * 0.35;
      // Face Raja Mustafar if nearby
      const dist = Math.hypot(this.playerPos.x - mx, this.playerPos.z - mz);
      if (dist < 14) {
        entry.rig.bodyGroup.rotation.y = Math.atan2(
          this.playerPos.x - mx,
          this.playerPos.z - mz,
        );
      }
    }

    // Animate Bonus Orbs
    for (const [id, mesh] of this.bonusOrbMeshes) {
      if (this.collectedOrbs.has(id)) continue;
      mesh.rotation.y += dt * 2.4;
    }

    // Animate Birds & Butterflies
    for (const b of this.birds) {
      const ang = elapsed * b.speed + b.phase;
      b.mesh.position.x = b.centerX + Math.cos(ang) * b.radius;
      b.mesh.position.z = b.centerZ + Math.sin(ang) * b.radius;
      b.mesh.rotation.y = -ang;
    }
    for (const bf of this.butterflies) {
      bf.mesh.position.y = bf.baseY + Math.sin(elapsed * 3.5 + bf.phase) * 0.35;
      bf.mesh.position.x = bf.baseX + Math.cos(elapsed * 1.8 + bf.phase) * 0.8;
    }

    // Animate River Water UV scroll
    this.textures.water.offset.x = (elapsed * 0.18) % 1;
    this.textures.water.offset.y = (elapsed * 0.08) % 1;

    // Animate Waterfall Drops
    for (const drop of this.waterfallDrops) {
      drop.position.y -= dt * 9.5;
      if (drop.position.y < 0.2) drop.position.y = 13.8;
    }

    // Flicker Cave Torches
    this.torchLights.forEach((pl, idx) => {
      pl.intensity = 2.4 + Math.sin(elapsed * 10 + idx * 2) * 0.45;
    });

    // Animate Roaming Villagers along waypoints
    for (const v of this.roamingVillagers) {
      const target = v.waypoints[v.wpIndex];
      const vx = v.rig.group.position.x;
      const vz = v.rig.group.position.z;
      const dx = target[0] - vx;
      const dz = target[1] - vz;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.4) {
        v.wpIndex = (v.wpIndex + 1) % v.waypoints.length;
      } else {
        const step = Math.min(dist, v.speed * dt);
        const nx = vx + (dx / dist) * step;
        const nz = vz + (dz / dist) * step;
        const ny = groundHeightAt(nx, nz);
        v.rig.group.position.set(nx, ny, nz);

        const targetYaw = Math.atan2(dx, dz);
        let diff = targetYaw - v.rig.bodyGroup.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.rig.bodyGroup.rotation.y += diff * (1 - Math.exp(-8 * dt));

        const swing = Math.sin(elapsed * 6.5 + v.phase) * 0.45;
        v.rig.leftLeg.rotation.x = swing;
        v.rig.rightLeg.rotation.x = -swing;
        v.rig.leftArm.rotation.x = -swing * 0.8;
        v.rig.rightArm.rotation.x = swing * 0.8;
      }
    }

    // Animate Roaming Small Animals (trotting & hopping)
    for (const a of this.roamingAnimals) {
      const ang = elapsed * a.speed + a.phase;
      const ax = a.centerX + Math.cos(ang) * a.radiusX;
      const az = a.centerZ + Math.sin(ang) * a.radiusZ;
      const nextAng = ang + 0.05;
      const nax = a.centerX + Math.cos(nextAng) * a.radiusX;
      const naz = a.centerZ + Math.sin(nextAng) * a.radiusZ;
      const ay = groundHeightAt(ax, az);

      const hop =
        a.rig.species === 'tupai' || a.rig.species === 'ayam'
          ? Math.abs(Math.sin(elapsed * 7 + a.phase)) * 0.14
          : Math.abs(Math.sin(elapsed * 5 + a.phase)) * 0.06;

      a.rig.group.position.set(ax, ay + hop, az);
      a.rig.bodyGroup.rotation.y = Math.atan2(nax - ax, naz - az);

      a.rig.legs.forEach((leg, li) => {
        leg.rotation.x =
          Math.sin(elapsed * 10 + a.phase + li * Math.PI) * 0.4;
      });
    }
  }

  private checkProximityAndAutoTriggers(elapsed: number): void {
    // 1. Auto-collect hidden Kupang Orbs
    for (const orb of BONUS_ORBS) {
      if (this.collectedOrbs.has(orb.id)) continue;
      const dist = Math.hypot(
        this.playerPos.x - orb.position[0],
        this.playerPos.z - orb.position[1],
      );
      if (dist < 1.8) {
        this.collectedOrbs.add(orb.id);
        const mesh = this.bonusOrbMeshes.get(orb.id);
        if (mesh) mesh.visible = false;
        audioEngine.playCoin();
        this.callbacks.onCollectOrb(orb.id, orb.kupang, orb.label);
      }
    }

    // 2. Monster Encounter Proximity (auto-trigger if within 2.9m and not on cooldown)
    const now = performance.now();
    if (now > this.combatCooldownUntil) {
      for (const m of MONSTERS) {
        if (this.defeatedMonsters.has(m.id)) continue;
        const entry = this.monsterRigs.get(m.id);
        if (!entry) continue;
        const dist = Math.hypot(
          this.playerPos.x - entry.rig.group.position.x,
          this.playerPos.z - entry.rig.group.position.z,
        );
        if (dist < 2.8) {
          this.combatCooldownUntil = now + 4500;
          this.callbacks.onTriggerMonster(m.id);
          return;
        }
      }
    }

    // 3. Nearest Interactive Target (Tabung > Monster > NPC)
    let best: NearbyInteraction | null = null;
    let bestDist = Infinity;

    for (const q of TABUNG_QUESTIONS) {
      const d = Math.hypot(
        this.playerPos.x - q.position[0],
        this.playerPos.z - q.position[1],
      );
      if (d < 4.4 && d < bestDist) {
        bestDist = d;
        best = {
          type: 'tabung',
          id: q.id,
          label: `Tabung Pitis ${q.id} (${q.locationName})`,
          promptText: this.tabungSolved.has(q.id)
            ? 'TEKAN E UNTUK MELIHAT TABUNG PITIS (SELESAI)'
            : 'TEKAN E UNTUK MEMBUKA TABUNG PITIS',
        };
      }
    }

    if (!best) {
      for (const npc of NPCS) {
        const d = Math.hypot(
          this.playerPos.x - npc.position[0],
          this.playerPos.z - npc.position[1],
        );
        if (d < 4.2 && d < bestDist) {
          bestDist = d;
          best = {
            type: 'npc',
            id: npc.id,
            label: npc.name,
            promptText: `TEKAN E UNTUK BERBUAL DENGAN ${npc.name.toUpperCase()}`,
          };
        }
      }
    }

    if (!best) {
      for (const m of MONSTERS) {
        if (this.defeatedMonsters.has(m.id)) continue;
        const entry = this.monsterRigs.get(m.id);
        if (!entry) continue;
        const d = Math.hypot(
          this.playerPos.x - entry.rig.group.position.x,
          this.playerPos.z - entry.rig.group.position.z,
        );
        if (d < 5.5 && d < bestDist) {
          bestDist = d;
          best = {
            type: 'monster',
            id: m.id,
            label: m.name,
            promptText: `TEKAN E UNTUK CABARAN ${m.name}`,
          };
        }
      }
    }

    this.currentNearby = best;

    // Throttle React telemetry to ~12 Hz
    if (elapsed - this.lastTelemetryAt > 0.08) {
      this.lastTelemetryAt = elapsed;
      const loc = getCurrentLocation(this.playerPos.x, this.playerPos.z);
      audioEngine.setMode(
        loc.id === 'istana_puncak_mustafar' ? 'istana' : 'adventure',
      );
      this.callbacks.onTelemetry({
        x: this.playerPos.x,
        z: this.playerPos.z,
        yaw: this.playerYaw,
        locationId: loc.id,
        locationName: loc.name,
        difficulty: loc.difficulty,
        nearby: best,
      });
    }
  }

  private updateCamera(dt: number): void {
    const horizDist = Math.cos(this.cameraPitch) * this.cameraDistance;
    const vertDist = Math.sin(this.cameraPitch) * this.cameraDistance;

    _camDesired.set(
      this.playerPos.x + Math.sin(this.cameraYaw) * horizDist,
      this.playerPos.y + 1.8 + vertDist,
      this.playerPos.z + Math.cos(this.cameraYaw) * horizDist,
    );

    // Prevent camera from dipping below terrain / plateau
    const camGroundY = groundHeightAt(_camDesired.x, _camDesired.z);
    if (_camDesired.y < camGroundY + 1.3) {
      _camDesired.y = camGroundY + 1.3;
    }

    // Clamp camera inside outer world bounds
    _camDesired.x = THREE.MathUtils.clamp(_camDesired.x, -104, 104);
    _camDesired.z = THREE.MathUtils.clamp(_camDesired.z, -104, 104);

    // Smooth exponential damping
    const dampLambda = 11;
    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      _camDesired.x,
      dampLambda,
      dt,
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      _camDesired.y,
      dampLambda,
      dt,
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      _camDesired.z,
      dampLambda,
      dt,
    );

    _camLook.set(this.playerPos.x, this.playerPos.y + 1.55, this.playerPos.z);
    this.camera.lookAt(_camLook);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    const dom = this.renderer.domElement;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('wheel', this.onWheel);

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      } else if ((obj as THREE.Sprite).isSprite) {
        const sprite = obj as THREE.Sprite;
        if (sprite.material) {
          sprite.material.map?.dispose();
          sprite.material.dispose();
        }
      }
    });
    Object.values(this.textures).forEach((tex) => tex.dispose());
    this.renderer.dispose();
    if (dom.parentNode === this.container) {
      this.container.removeChild(dom);
    }
  }
}
