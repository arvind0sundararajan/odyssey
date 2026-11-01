// Stop 4B: The Sirens from Afar & Odysseus (Matt Damon) Tied to the Mast
// 360° cavernous sea stacks around the hallway + ONE Matt Damon tied to the mast

import { loadSolidCutoutTexture } from './cutout.js';

export default {
  id: 'sirens',
  is360: true,
  stepNumber: 'STOP IV-B OF V',
  title: 'The Siren’s Strait',
  location: '📍 The L-Shaped Hallway',
  instruction: 'Walk back through the hallway with your earplugs in and look around the rocks.',
  afterTapTitle: '🎶 You Survived the Sirens',
  afterTapText:
    'Your earplugs blocked the fatal song. Step back out into the Living Room to reach Ithaca.',
  nextButtonText: 'Step into the Living Room →',
  defaultTransform: { x: 0, y: 0.0, z: 0.0, scale: 1.0, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const rocksTex = loadSolidCutoutTexture(THREE, './assets/sirens_rocks_nolan.jpg', {
      threshold: 16,
      keepBottom: true,
    });
    const damonTex = loadSolidCutoutTexture(THREE, './assets/odysseus_mast_nolan.jpg', {
      threshold: 18,
      keepBottom: true,
    });

    function createRockShaderMaterial(phaseOffset = 0, flipX = 1.0, hideSirens = false) {
      return new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: rocksTex },
          uTime: { value: 0 },
          uPulse: { value: 0.0 },
          uPhase: { value: phaseOffset },
          uFlipX: { value: flipX },
          uHideSirens: { value: hideSirens ? 1.0 : 0.0 },
        },
        transparent: true,
        depthWrite: true,
        side: THREE.DoubleSide,
        vertexShader: `
          uniform float uFlipX;
          varying vec2 vUv;
          void main() {
            vUv = vec2(uFlipX < 0.0 ? 1.0 - uv.x : uv.x, uv.y);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uPulse;
          uniform float uPhase;
          uniform float uHideSirens;
          varying vec2 vUv;
          void main() {
            vec4 tex = texture2D(uMap, vUv);
            float bottomFade = smoothstep(0.0, 0.12, vUv.y);
            float alpha = tex.a * bottomFade;

            if (uHideSirens > 0.5) {
              float sirenRegion = smoothstep(0.24, 0.05, distance(vUv, vec2(0.5, 0.78)));
              alpha *= (1.0 - sirenRegion * 0.85);
            }

            if (alpha < 0.04) discard;

            vec3 col = tex.rgb;
            float distToSirens = distance(vUv, vec2(0.5, 0.78));
            float mistGlow = smoothstep(0.38, 0.02, distToSirens);
            float wave = 0.5 + 0.5 * sin(uTime * 3.8 + uPhase - distToSirens * 18.0);
            col += vec3(0.32, 0.62, 0.85) * mistGlow * (0.14 + 0.22 * wave + uPulse * 0.55);

            gl_FragColor = vec4(col, alpha);
          }
        `,
      });
    }

    const rockFormationsConfig = [
      { angleDeg: 0, dist: 3.6, y: 0.1, scaleX: 4.4, scaleY: 2.6, flip: 1.0, hideSirens: false },
      { angleDeg: -65, dist: 3.1, y: -0.05, scaleX: 4.0, scaleY: 2.5, flip: -1.0, hideSirens: true },
      { angleDeg: 65, dist: 3.2, y: 0.0, scaleX: 4.0, scaleY: 2.5, flip: 1.0, hideSirens: true },
      { angleDeg: -130, dist: 3.5, y: 0.12, scaleX: 4.2, scaleY: 2.6, flip: 1.0, hideSirens: false },
      { angleDeg: 130, dist: 3.3, y: -0.08, scaleX: 3.9, scaleY: 2.4, flip: -1.0, hideSirens: true },
      { angleDeg: 180, dist: 3.7, y: 0.05, scaleX: 4.3, scaleY: 2.5, flip: -1.0, hideSirens: false },
    ];

    const rockMaterials = [];

    rockFormationsConfig.forEach((cfg, idx) => {
      const mat = createRockShaderMaterial(idx * 1.3, cfg.flip, cfg.hideSirens);
      rockMaterials.push(mat);

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(cfg.scaleX, cfg.scaleY, 16, 16),
        mat
      );
      const rad = THREE.MathUtils.degToRad(cfg.angleDeg);
      mesh.position.set(
        Math.sin(rad) * cfg.dist,
        cfg.y,
        -Math.cos(rad) * cfg.dist
      );
      mesh.lookAt(0, cfg.y, 0);
      root.add(mesh);
      interactables.push(mesh);
    });

    // ONE single Matt Damon tied to the mast screaming
    const damonShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: damonTex },
        uTime: { value: 0 },
        uScream: { value: 0.0 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float uTime;
        uniform float uScream;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float strain = sin(uTime * (6.0 + uScream * 24.0)) * (0.012 + uScream * 0.035);
          pos.x += strain * uv.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uScream;
        varying vec2 vUv;
        void main() {
          vec4 tex = texture2D(uMap, vUv);
          float bottomFade = smoothstep(0.0, 0.1, vUv.y);
          float alpha = tex.a * bottomFade;
          if (alpha < 0.04) discard;

          vec3 col = tex.rgb * (1.0 + uScream * 0.32);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const damonMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.75, 2.33, 16, 16),
      damonShaderMat
    );
    const rad = THREE.MathUtils.degToRad(24);
    const dist = 2.35;
    damonMesh.position.set(Math.sin(rad) * dist, -0.08, -Math.cos(rad) * dist);
    damonMesh.lookAt(0, -0.08, 0);
    root.add(damonMesh);
    interactables.push(damonMesh);

    root.userData = {
      rockMaterials,
      damonShaderMat,
      tapped: false,
      screamIntensity: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    d.rockMaterials.forEach((m) => {
      m.uniforms.uTime.value = time;
    });
    d.damonShaderMat.uniforms.uTime.value = time;

    if (d.tapped) {
      d.screamIntensity = Math.min(1.0, d.screamIntensity + delta * 3.0);
      d.rockMaterials.forEach((m) => {
        m.uniforms.uPulse.value = d.screamIntensity;
      });
      d.damonShaderMat.uniforms.uScream.value = d.screamIntensity;
    }
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playSirenChord();
  },
};
