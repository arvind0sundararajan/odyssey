// Stop 1: The Trojan Horse (360° Living Room Siege Scene)
// Uses Outer-Border Flood-Fill Cutout so 100% of dark charred timbers inside the horse
// stay completely solid and opaque even in bright/medium apartment lighting!

import { loadSolidCutoutTexture } from './cutout.js';

export default {
  id: 'horse',
  is360: true,
  stepNumber: 'STOP I OF V',
  title: 'The Fallen Trojan Horse',
  location: '📍 Living Room',
  instruction: 'Pan 360° around the living room and TAP the fallen Trojan Horse.',
  afterTapTitle: '⚔️ The Hatch Opens!',
  afterTapText:
    'Greek warriors have slipped out into the apartment! Before heading into the dark cave, turn to someone nearby and ask: "What is the best concert or live event you have ever snuck into (or wish you were at)?"',
  nextButtonText: 'Head to the Dark Room →',
  defaultTransform: { x: 0, y: 0, z: 0, scale: 1.0, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const horseTex = loadSolidCutoutTexture(THREE, './assets/horse_nolan.jpg', {
      threshold: 20,
    });

    function createHorseMaterial() {
      return new THREE.ShaderMaterial({
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
    }

    const horseMats = [];
    [0, 180].forEach((deg) => {
      const mat = createHorseMaterial();
      horseMats.push(mat);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.36, 16, 16), mat);
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 3.3;
      mesh.position.set(Math.sin(rad) * dist, -0.15, -Math.cos(rad) * dist);
      mesh.lookAt(0, -0.15, 0);
      root.add(mesh);
      interactables.push(mesh);
    });

    // Burning Siege Pillars around ±90° to complete the 360° ring
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xc8963e, roughness: 0.35, metalness: 0.85 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x2b2623, roughness: 0.85 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });

    [-90, -48, 48, 90, -135, 135].forEach((deg) => {
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 3.1;
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(Math.sin(rad) * dist, -0.4, -Math.cos(rad) * dist);
      pillarGroup.lookAt(0, -0.4, 0);

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.5, 12), stoneMat);
      pillarGroup.add(col);
      interactables.push(col);

      const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 12), bronzeMat);
      bowl.rotation.x = Math.PI;
      bowl.position.y = 0.82;
      pillarGroup.add(bowl);

      const flame = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 1), flameMat);
      flame.position.y = 0.98;
      pillarGroup.add(flame);
      interactables.push(flame);

      root.add(pillarGroup);
    });

    // 360° Volumetric Embers
    const emberCount = 150;
    const emberGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 2.6;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.4;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const embers = new THREE.Points(
      emberGeo,
      new THREE.PointsMaterial({ color: 0xff9933, size: 0.055, transparent: true, opacity: 0.9 })
    );
    root.add(embers);

    root.userData = {
      horseMats,
      embers,
      tapped: false,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    d.horseMats.forEach((m) => {
      m.uniforms.uTime.value = time;
      if (d.tapped) {
        m.uniforms.uTapFlare.value = 0.55 + Math.sin(time * 8.0) * 0.2;
      }
    });

    const pos = d.embers.geometry.attributes.position;
    const speed = d.tapped ? 1.35 : 0.4;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + delta * speed * (0.5 + (i % 4) * 0.25);
      if (y > 1.4) y = -1.2;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    d.embers.rotation.y = time * 0.08;
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playHorseCreak();
  },
};
