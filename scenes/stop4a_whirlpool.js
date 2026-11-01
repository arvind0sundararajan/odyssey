// Stop 4A: Charybdis the Whirlpool (One Large Whirlpool at the End of the Hallway)
import { loadSolidCutoutTexture } from './cutout.js';

export default {
  id: 'whirlpool',
  stepNumber: 'STOP IV-A OF V',
  title: 'Charybdis: The Whirlpool',
  location: '📍 End of the Kitchen Hallway',
  instruction: 'Look toward the end of the hallway.',
  afterTapTitle: '🌊 Dead End! Grab Earplugs & Turn Around',
  afterTapText:
    'Charybdis blocks the passage ahead. Put in a pair of physical earplugs right here and turn around to walk back through the hallway.',
  nextButtonText: 'Earplugs In — Turn Around →',
  defaultTransform: { x: 0, y: -0.65, z: -2.8, scale: 1.3, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const whirlpoolTex = loadSolidCutoutTexture(THREE, './assets/whirlpool_nolan.jpg', {
      threshold: 16,
    });

    const whirlpoolShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: whirlpoolTex },
        uTime: { value: 0 },
        uSurge: { value: 0.0 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float uTime;
        uniform float uSurge;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float dist = distance(uv, vec2(0.5, 0.5));
          float funnel = -smoothstep(0.38, 0.0, dist) * 0.45;
          float waves = sin(dist * 22.0 - uTime * 5.0) * 0.04;
          pos.z += funnel + waves + uSurge * sin(dist * 18.0 - uTime * 12.0) * 0.14;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uTime;
        uniform float uSurge;
        varying vec2 vUv;
        void main() {
          vec2 center = vec2(0.485, 0.49);
          vec2 d = vUv - center;
          float r = length(d);
          float speed = 0.25 + uSurge * 0.6;
          float angle = atan(d.y, d.x) + sin(uTime * 1.5) * 0.08 * smoothstep(0.48, 0.05, r);
          float twist = uTime * speed * smoothstep(0.45, 0.06, r) * 0.35;
          vec2 swirledUv = center + vec2(cos(angle + twist), sin(angle + twist)) * r;

          vec4 tex = texture2D(uMap, clamp(swirledUv, 0.01, 0.99));
          float radialMask = smoothstep(0.48, 0.34, r);
          float alpha = tex.a * radialMask;
          if (alpha < 0.04) discard;

          vec3 col = tex.rgb;
          if (uSurge > 0.01) {
            float foamRing = smoothstep(0.28, 0.14, abs(r - 0.24));
            col += vec3(0.3, 0.75, 0.95) * foamRing * uSurge * 0.45;
          }
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    // ONE single large Whirlpool tilted on the hallway floor
    const whirlpoolMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 2.25, 48, 36),
      whirlpoolShaderMat
    );
    whirlpoolMesh.rotation.x = -0.35;
    root.add(whirlpoolMesh);
    interactables.push(whirlpoolMesh);

    root.userData = {
      whirlpoolShaderMat,
      tapped: false,
      surge: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    if (d.tapped) {
      d.surge = Math.min(1.0, d.surge + delta * 2.5);
    }
    d.whirlpoolShaderMat.uniforms.uTime.value = time;
    d.whirlpoolShaderMat.uniforms.uSurge.value = d.surge;
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playWhirlpoolSurge();
  },
};
