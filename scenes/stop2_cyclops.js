// Stop 2: Polyphemus the Cyclops (One Large Life-Sized Cyclops in the Dark Cave)
import { loadSolidCutoutTexture } from './cutout.js';

export default {
  id: 'cyclops',
  stepNumber: 'STOP II OF V',
  title: 'Polyphemus the Cyclops',
  location: '📍 The Dark Room',
  instruction: 'Look into the dark cave.',
  afterTapTitle: '👁️ The Cyclops is Blinded!',
  afterTapText:
    '"NOBODY HAS BLINDED ME!" Polyphemus rolls back the cave boulder in his rage. Escape to the Kitchen.',
  nextButtonText: 'Escape to the Kitchen →',
  defaultTransform: { x: 0, y: 0.1, z: -2.8, scale: 1.35, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const cyclopsTex = loadSolidCutoutTexture(THREE, './assets/cyclops_nolan.jpg', {
      threshold: 18,
      keepBottom: true,
    });

    const cyclopsShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: cyclopsTex },
        uTime: { value: 0 },
        uBlinded: { value: 0.0 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float uTime;
        uniform float uBlinded;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.y += sin(uTime * 2.0) * 0.03 * uv.y;
          if (uBlinded > 0.01) {
            pos.x += sin(uTime * 32.0 + uv.y * 6.0) * 0.07 * uBlinded;
            pos.y += cos(uTime * 27.0) * 0.04 * uBlinded;
          }
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uTime;
        uniform float uBlinded;
        varying vec2 vUv;
        void main() {
          vec4 tex = texture2D(uMap, vUv);
          float bottomFade = smoothstep(0.0, 0.14, vUv.y);
          float sideFade = smoothstep(0.0, 0.07, vUv.x) * smoothstep(1.0, 0.93, vUv.x);
          float alpha = tex.a * bottomFade * sideFade;
          if (alpha < 0.04) discard;

          vec3 col = tex.rgb;
          vec2 eyeUv = vec2(0.50, 0.715);
          float distToEye = distance(vUv, eyeUv);
          float irisGlow = smoothstep(0.085, 0.01, distToEye);
          float pulse = 0.5 + 0.5 * sin(uTime * 4.5);
          col += vec3(0.9, 0.25, 0.05) * irisGlow * (0.25 + 0.25 * pulse);

          if (uBlinded > 0.01) {
            float strikeGlow = smoothstep(0.22, 0.0, distToEye);
            float flicker = 0.75 + 0.25 * sin(uTime * 28.0);
            col = mix(col, vec3(1.0, 0.12, 0.02) * 1.8 * flicker, strikeGlow * uBlinded);
            col += vec3(1.0, 0.7, 0.2) * smoothstep(0.06, 0.0, distToEye) * uBlinded;
          }
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    // ONE single large life-sized Cyclops
    const cyclopsMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.55, 32, 32), cyclopsShaderMat);
    root.add(cyclopsMesh);
    interactables.push(cyclopsMesh);

    root.userData = {
      cyclopsShaderMat,
      tapped: false,
      blindProgress: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    if (d.tapped) {
      d.blindProgress = Math.min(1.0, d.blindProgress + delta * 3.0);
    }
    d.cyclopsShaderMat.uniforms.uTime.value = time;
    d.cyclopsShaderMat.uniforms.uBlinded.value = d.blindProgress;
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playCyclopsRoar();
  },
};
