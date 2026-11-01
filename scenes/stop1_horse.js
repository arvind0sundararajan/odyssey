// Stop 1: The Fallen Trojan Horse (One Large Horse in the Living Room)
import { loadSolidCutoutTexture } from './cutout.js';

export default {
  id: 'horse',
  stepNumber: 'STOP I OF V',
  title: 'The Trojan Horse',
  location: '📍 Living Room',
  instruction: 'Look around the living room.',
  afterTapTitle: '⚔️ The Hatch Opens',
  afterTapText: 'Greek warriors slip out from the belly of the horse into the shadows. Continue your voyage into the dark cave.',
  nextButtonText: 'Head to the Dark Room →',
  defaultTransform: { x: 0, y: -0.15, z: -3.2, scale: 1.35, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const horseTex = loadSolidCutoutTexture(THREE, './assets/horse_nolan.jpg', {
      threshold: 20,
    });

    const horseShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: horseTex },
        uTime: { value: 0 },
        uTapFlare: { value: 0.0 },
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
        uniform float uTapFlare;
        varying vec2 vUv;

        void main() {
          vec4 tex = texture2D(uMap, vUv);
          if (tex.a < 0.05) discard;

          vec3 col = tex.rgb;
          float distToHatch = distance(vUv, vec2(0.56, 0.48));
          float hatchMask = smoothstep(0.28, 0.02, distToHatch);
          float flicker = 1.0 + sin(uTime * 14.0) * 0.12 + cos(uTime * 23.0) * 0.08;
          col += vec3(1.0, 0.55, 0.15) * hatchMask * (0.14 * flicker + uTapFlare * 0.85);
          col *= (1.0 + uTapFlare * 0.35);

          gl_FragColor = vec4(col, tex.a);
        }
      `,
    });

    // ONE single large Trojan Horse
    const horseMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.48, 16, 16), horseShaderMat);
    root.add(horseMesh);
    interactables.push(horseMesh);

    // Subtle embers drifting from the hatch
    const emberCount = 55;
    const emberGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.35) * 1.8;
      positions[i * 3 + 1] = (Math.random() - 0.3) * 1.3;
      positions[i * 3 + 2] = 0.1 + Math.random() * 0.5;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const embers = new THREE.Points(
      emberGeo,
      new THREE.PointsMaterial({ color: 0xff9933, size: 0.045, transparent: true, opacity: 0.85 })
    );
    root.add(embers);

    root.userData = {
      horseShaderMat,
      embers,
      tapped: false,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    d.horseShaderMat.uniforms.uTime.value = time;
    if (d.tapped) {
      d.horseShaderMat.uniforms.uTapFlare.value = 0.55 + Math.sin(time * 8.0) * 0.2;
    }

    const pos = d.embers.geometry.attributes.position;
    const speed = d.tapped ? 1.35 : 0.38;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + delta * speed * (0.5 + (i % 4) * 0.25);
      if (y > 1.1) y = -0.4;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playHorseCreak();
  },
};
