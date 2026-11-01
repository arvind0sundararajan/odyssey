// Stop 4A: Charybdis the Whirlpool (360° Maelstrom Surround Scene)
// Uses Outer-Border Flood-Fill Cutout so the dark ocean water & abyss inside the whirlpool
// are 100% solid opaque even in lit rooms!

import { loadSolidCutoutTexture } from './cutout.js';

export default {
  id: 'whirlpool',
  is360: true,
  stepNumber: 'STOP IV-A OF V',
  title: 'Charybdis: The Whirlpool',
  location: '📍 End of the Kitchen Hallway (Dead End)',
  instruction: 'Look around & down—you are inside the 360° Charybdis Whirlpool! TAP the churning vortex!',
  afterTapTitle: '🌊 Dead End! Grab Earplugs & Turn Around!',
  afterTapText:
    'Charybdis blocks the passage ahead! Grab a pair of physical EARPLUGS right here, put them in your ears, and TURN AROUND 180° to walk back through the L-shaped hallway!',
  nextButtonText: 'Earplugs In — Turn Around →',
  defaultTransform: { x: 0, y: 0, z: 0, scale: 1.0, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const whirlpoolTex = loadSolidCutoutTexture(THREE, './assets/whirlpool_nolan.jpg', {
      threshold: 16,
    });

    function createWhirlpoolMaterial() {
      return new THREE.ShaderMaterial({
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
    }

    const mats = [];

    const floorMat = createWhirlpoolMaterial();
    mats.push(floorMat);
    const floorVortex = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2, 64, 64), floorMat);
    floorVortex.rotation.x = -Math.PI / 2;
    floorVortex.position.y = -1.35;
    root.add(floorVortex);
    interactables.push(floorVortex);

    [0, 90, 180, 270].forEach((deg) => {
      const mat = createWhirlpoolMaterial();
      mats.push(mat);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.25, 48, 36), mat);
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 2.9;
      mesh.position.set(Math.sin(rad) * dist, -0.55, -Math.cos(rad) * dist);
      mesh.lookAt(0, -0.1, 0);
      root.add(mesh);
      interactables.push(mesh);
    });

    const sprayCount = 150;
    const sprayGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(sprayCount * 3);
    for (let i = 0; i < sprayCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * 2.4;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    sprayGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const spray = new THREE.Points(
      sprayGeo,
      new THREE.PointsMaterial({ color: 0xaeeeff, size: 0.055, transparent: true, opacity: 0.8 })
    );
    root.add(spray);

    root.userData = {
      mats,
      spray,
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

    d.mats.forEach((m) => {
      m.uniforms.uTime.value = time;
      m.uniforms.uSurge.value = d.surge;
    });

    d.spray.rotation.y = -time * (d.tapped ? 2.2 : 0.75);
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playWhirlpoolSurge();
  },
};
