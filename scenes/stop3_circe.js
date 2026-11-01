// Stop 3: Circe & Her Enchanted Stew (One Large Scene in the Kitchen)
import { loadSolidCutoutTexture } from './cutout.js';

const BEAST_OUTCOMES = [
  '🐗 A Wild Golden Boar',
  '🐺 A Wine-Dark Sea Wolf',
  '🦁 A Mycenaean Lion',
  '🦉 Athena’s Midnight Owl',
];

export default {
  id: 'circe',
  stepNumber: 'STOP III OF V',
  title: 'Circe’s Enchanted Stew',
  location: '📍 The Kitchen',
  instruction: 'Look around the kitchen.',
  afterTapTitle: '🔮 Circe’s Spell Takes Hold',
  getAfterTapText() {
    const beast = BEAST_OUTCOMES[Math.floor(Math.random() * BEAST_OUTCOMES.length)];
    return `Circe’s stew transforms you into: ${beast}.\n\nContinue down the hallway out of the kitchen.`;
  },
  nextButtonText: 'Head Down the Kitchen Hallway →',
  defaultTransform: { x: 0, y: -0.05, z: -2.7, scale: 1.25, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const circeTex = loadSolidCutoutTexture(THREE, './assets/circe_nolan.jpg', {
      threshold: 18,
      keepBottom: true,
    });

    const circeShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: circeTex },
        uTime: { value: 0 },
        uSpellActive: { value: 0.0 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uTime;
        uniform float uSpellActive;
        varying vec2 vUv;
        void main() {
          vec4 tex = texture2D(uMap, vUv);
          float bottomFade = smoothstep(0.0, 0.08, vUv.y);
          float alpha = tex.a * bottomFade;
          if (alpha < 0.04) discard;

          vec3 col = tex.rgb;
          float distToStew = distance(vUv * vec2(1.0, 1.6), vec2(0.50, 0.44));
          float stewGlow = smoothstep(0.32, 0.02, distToStew);
          float shimmer = 0.5 + 0.5 * sin(uTime * 5.0 + vUv.x * 12.0);
          col += vec3(0.75, 0.22, 1.0) * stewGlow * (0.18 + 0.18 * shimmer + uSpellActive * 0.85);

          if (uSpellActive > 0.01) {
            float wave = 0.5 + 0.5 * sin(uTime * 10.0 - distance(vUv, vec2(0.5, 0.35)) * 18.0);
            col += vec3(0.45, 0.15, 0.9) * wave * uSpellActive * 0.45;
          }
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    // ONE single large Circe & Cauldron
    const circeMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4, 16, 16), circeShaderMat);
    root.add(circeMesh);
    interactables.push(circeMesh);

    root.userData = {
      circeShaderMat,
      tapped: false,
      spellProgress: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    if (d.tapped) {
      d.spellProgress = Math.min(1.0, d.spellProgress + delta * 2.5);
    }
    d.circeShaderMat.uniforms.uTime.value = time;
    d.circeShaderMat.uniforms.uSpellActive.value = d.spellProgress;
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playMagicChime();
  },
};
