import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createNpcModel, createRajaMustafarRig } from '../game/models';
import { createProceduralTextures } from '../game/textures';

interface MenuDiorama3DProps {
  victoryMode?: boolean;
}

export function MenuDiorama3D({ victoryMode = false }: MenuDiorama3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let frameId = 0;

    const isSoftwareGl = (() => {
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
    })();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const skyHex = victoryMode ? 0x1e1b4b : 0x7dd3fc;
    scene.background = new THREE.Color(skyHex);
    scene.fog = new THREE.FogExp2(skyHex, 0.022);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.2, 120);
    camera.position.set(0, 3.2, 9.4);
    camera.lookAt(0, 1.4, -1.5);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const textures = createProceduralTextures(renderer);

    // 3-Point Lighting
    const hemi = new THREE.HemisphereLight(
      victoryMode ? 0xfde68a : 0xdbeafe,
      0x14532d,
      0.85,
    );
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1c9, 1.5);
    sun.position.set(10, 16, 12);
    sun.castShadow = !isSoftwareGl;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xfbbf24, 0.6);
    rim.position.set(-10, 8, -10);
    scene.add(rim);

    // Ground & River
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(42, 32),
      new THREE.MeshStandardMaterial({ map: textures.grass, roughness: 0.9 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.6, 0.35, 16),
      new THREE.MeshStandardMaterial({
        map: textures.palaceFloor,
        roughness: 0.35,
      }),
    );
    dais.position.set(0, 0.175, 0);
    dais.receiveShadow = true;
    scene.add(dais);

    const river = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.1, 4),
      new THREE.MeshStandardMaterial({ map: textures.water, roughness: 0.15 }),
    );
    river.position.set(0, 0.04, -7);
    scene.add(river);

    // Backdrop Istana Melayu & Gerbang Batu
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const palaceMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.5,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.5,
    });

    const palaceBase = new THREE.Mesh(
      new THREE.BoxGeometry(14, 5.5, 6),
      palaceMat,
    );
    palaceBase.position.set(0, 2.75, -16);
    const palaceRoof = new THREE.Mesh(
      new THREE.ConeGeometry(10.5, 4.2, 4),
      roofMat,
    );
    palaceRoof.rotation.y = Math.PI / 4;
    palaceRoof.position.set(0, 7.6, -16);
    scene.add(palaceBase, palaceRoof);

    [-3.6, 3.6].forEach((gx) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.4, 1.1), goldMat);
      col.position.set(gx, 2.2, -11);
      scene.add(col);
    });
    const gateBeam = new THREE.Mesh(
      new THREE.BoxGeometry(8.6, 1.0, 1.2),
      roofMat,
    );
    gateBeam.position.set(0, 4.8, -11);
    scene.add(gateBeam);

    // Tropical Trees & Mountains
    const mtnMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.92,
    });
    [-16, 16, -26, 26].forEach((mx, i) => {
      const mtn = new THREE.Mesh(
        new THREE.ConeGeometry(9, 14 + (i % 2) * 5, 5),
        mtnMat,
      );
      mtn.position.set(mx, 6, -26);
      scene.add(mtn);
    });

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x6b4226,
      roughness: 0.9,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.78,
    });
    [-8, -5.5, 6, 9].forEach((tx, idx) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.5, 3, 6),
        trunkMat,
      );
      trunk.position.set(tx, 1.5, -5 - (idx % 2) * 4);
      const leaf = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.7, 0),
        leafMat,
      );
      leaf.position.set(tx, 3.6, -5 - (idx % 2) * 4);
      scene.add(trunk, leaf);
    });

    // Raja Mustafar & Awang Kenit hero showcase
    const raja = createRajaMustafarRig(textures);
    raja.group.position.set(-0.6, 0.35, 0.4);
    raja.bodyGroup.rotation.y = 0.25;
    raja.auraRing.visible = victoryMode;
    scene.add(raja.group);

    const awang = createNpcModel('awang', textures);
    awang.position.set(1.65, 0.35, 1.1);
    awang.rotation.y = -0.45;
    scene.add(awang);

    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();

      raja.bodyGroup.position.y = Math.sin(t * 2.1) * 0.04;
      raja.rightArmPivot.rotation.x = victoryMode
        ? -1.2 + Math.sin(t * 4) * 0.25
        : -0.25 + Math.sin(t * 1.5) * 0.08;
      raja.auraRing.rotation.z = t * 1.6;
      awang.position.y = 0.35 + Math.abs(Math.sin(t * 2.8)) * 0.08;
      textures.water.offset.x = (t * 0.15) % 1;

      camera.position.x = Math.sin(t * 0.32) * 1.1;
      camera.lookAt(0.2, 1.45, -1.5);

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => {
      if (disposed) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
          else if (m.material) m.material.dispose();
        }
      });
      Object.values(textures).forEach((tex) => tex.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [victoryMode]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />;
}
