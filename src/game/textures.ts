import * as THREE from 'three';

export interface ProceduralTexturePack {
  grass: THREE.CanvasTexture;
  stonePath: THREE.CanvasTexture;
  carvedWood: THREE.CanvasTexture;
  songketGold: THREE.CanvasTexture;
  water: THREE.CanvasTexture;
  caveRock: THREE.CanvasTexture;
  palaceFloor: THREE.CanvasTexture;
  paddyField: THREE.CanvasTexture;
}

function configureTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(
  renderer: THREE.WebGLRenderer,
): ProceduralTexturePack {
  const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

  // 1. Tropical Grass with pixelated Roblox-style mosaic variation
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = 128;
  grassCanvas.height = 128;
  const gCtx = grassCanvas.getContext('2d')!;
  gCtx.fillStyle = '#3b8c3b';
  gCtx.fillRect(0, 0, 128, 128);
  const grassPalette = ['#347d34', '#439c43', '#2e7232', '#4da846', '#3b8c3b'];
  for (let y = 0; y < 128; y += 8) {
    for (let x = 0; x < 128; x += 8) {
      gCtx.fillStyle = grassPalette[(x * 7 + y * 13) % grassPalette.length];
      gCtx.fillRect(x, y, 8, 8);
    }
  }
  const grass = configureTexture(grassCanvas, 28, 28, maxAniso);

  // 2. Stone Path / Tanah Batu
  const stoneCanvas = document.createElement('canvas');
  stoneCanvas.width = 128;
  stoneCanvas.height = 128;
  const sCtx = stoneCanvas.getContext('2d')!;
  sCtx.fillStyle = '#9b876a';
  sCtx.fillRect(0, 0, 128, 128);
  const stoneColors = ['#8c7759', '#a69376', '#7d694c', '#b3a082'];
  for (let y = 0; y < 128; y += 16) {
    for (let x = 0; x < 128; x += 16) {
      sCtx.fillStyle = stoneColors[(x * 3 + y * 5) % stoneColors.length];
      sCtx.fillRect(x + 1, y + 1, 14, 14);
    }
  }
  const stonePath = configureTexture(stoneCanvas, 8, 8, maxAniso);

  // 3. Carved Malay Wood (Ukiran Kayu Cengal)
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 128;
  woodCanvas.height = 128;
  const wCtx = woodCanvas.getContext('2d')!;
  wCtx.fillStyle = '#6e4122';
  wCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) {
    wCtx.fillStyle = y % 32 === 0 ? '#5c351a' : '#7a4927';
    wCtx.fillRect(0, y, 128, 14);
    wCtx.fillStyle = '#472711';
    wCtx.fillRect(0, y + 14, 128, 2);
  }
  // Malay floral motif accents
  wCtx.strokeStyle = '#c8963e';
  wCtx.lineWidth = 2;
  for (let x = 16; x < 128; x += 32) {
    wCtx.strokeRect(x - 6, 10, 12, 12);
    wCtx.strokeRect(x - 6, 74, 12, 12);
  }
  const carvedWood = configureTexture(woodCanvas, 2, 2, maxAniso);

  // 4. Songket Royal Gold & Crimson Pattern
  const songketCanvas = document.createElement('canvas');
  songketCanvas.width = 128;
  songketCanvas.height = 128;
  const sgCtx = songketCanvas.getContext('2d')!;
  sgCtx.fillStyle = '#991b1b';
  sgCtx.fillRect(0, 0, 128, 128);
  sgCtx.fillStyle = '#f59e0b';
  for (let y = 0; y < 128; y += 16) {
    for (let x = 0; x < 128; x += 16) {
      // Diamond pucuk rebung motif
      sgCtx.beginPath();
      sgCtx.moveTo(x + 8, y + 2);
      sgCtx.lineTo(x + 14, y + 8);
      sgCtx.lineTo(x + 8, y + 14);
      sgCtx.lineTo(x + 2, y + 8);
      sgCtx.closePath();
      sgCtx.fill();
    }
  }
  const songketGold = configureTexture(songketCanvas, 2, 2, maxAniso);

  // 5. River Water Texture
  const waterCanvas = document.createElement('canvas');
  waterCanvas.width = 128;
  waterCanvas.height = 128;
  const waCtx = waterCanvas.getContext('2d')!;
  waCtx.fillStyle = '#0ea5e9';
  waCtx.fillRect(0, 0, 128, 128);
  waCtx.fillStyle = '#38bdf8';
  for (let y = 0; y < 128; y += 16) {
    waCtx.fillRect((y * 3) % 96, y, 36, 6);
  }
  waCtx.fillStyle = '#7dd3fc';
  for (let y = 8; y < 128; y += 24) {
    waCtx.fillRect((y * 5) % 88, y, 22, 4);
  }
  const water = configureTexture(waterCanvas, 6, 6, maxAniso);

  // 6. Cave Stone & Crystal Flecks
  const caveCanvas = document.createElement('canvas');
  caveCanvas.width = 128;
  caveCanvas.height = 128;
  const cCtx = caveCanvas.getContext('2d')!;
  cCtx.fillStyle = '#3f3b4a';
  cCtx.fillRect(0, 0, 128, 128);
  const cavePal = ['#353140', '#4c4759', '#2c2836', '#575166'];
  for (let y = 0; y < 128; y += 16) {
    for (let x = 0; x < 128; x += 16) {
      cCtx.fillStyle = cavePal[(x + y * 3) % cavePal.length];
      cCtx.fillRect(x, y, 15, 15);
    }
  }
  cCtx.fillStyle = '#a855f7';
  cCtx.fillRect(24, 24, 6, 6);
  cCtx.fillStyle = '#22d3ee';
  cCtx.fillRect(88, 72, 6, 6);
  const caveRock = configureTexture(caveCanvas, 3, 3, maxAniso);

  // 7. Istana Royal Floor (Marmar & Emas)
  const palaceCanvas = document.createElement('canvas');
  palaceCanvas.width = 128;
  palaceCanvas.height = 128;
  const pCtx = palaceCanvas.getContext('2d')!;
  pCtx.fillStyle = '#fef3c7';
  pCtx.fillRect(0, 0, 128, 128);
  pCtx.fillStyle = '#fde68a';
  pCtx.fillRect(0, 0, 64, 64);
  pCtx.fillRect(64, 64, 64, 64);
  pCtx.strokeStyle = '#d97706';
  pCtx.lineWidth = 3;
  pCtx.strokeRect(2, 2, 124, 124);
  const palaceFloor = configureTexture(palaceCanvas, 6, 6, maxAniso);

  // 8. Sawah Padi (Paddy Field)
  const paddyCanvas = document.createElement('canvas');
  paddyCanvas.width = 128;
  paddyCanvas.height = 128;
  const pdCtx = paddyCanvas.getContext('2d')!;
  pdCtx.fillStyle = '#84cc16';
  pdCtx.fillRect(0, 0, 128, 128);
  pdCtx.fillStyle = '#eab308';
  for (let y = 0; y < 128; y += 12) {
    pdCtx.fillRect(0, y, 128, 4);
  }
  const paddyField = configureTexture(paddyCanvas, 4, 4, maxAniso);

  return {
    grass,
    stonePath,
    carvedWood,
    songketGold,
    water,
    caveRock,
    palaceFloor,
    paddyField,
  };
}
