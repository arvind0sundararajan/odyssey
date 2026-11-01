// Stop 3: Circe & Her Enchanted Stew (360° Kitchen Sanctum Scene)
// Surrounds the user in 360° with Circe at her steaming cauldron, golden Greek temple columns,
// and 360° swirling violet/emerald potion sparks.

const BEAST_OUTCOMES = [
  '🐗 A Wild Golden Boar — bold, unstoppable near the snack table.',
  '🐺 A Wine-Dark Sea Wolf — loyal to the pack, howling at 1 AM.',
  '🦁 A Mycenaean Lion — majestic, guarding the bar.',
  '🦉 Athena’s Midnight Owl — observant, plotting the next side-quest.',
];

export default {
  id: 'circe',
  is360: true,
  stepNumber: 'STOP III OF V',
  title: 'Circe & The Enchanted Stew',
  location: '📍 The Kitchen',
  instruction: 'Pan 360° around the kitchen to see Circe at her cauldron. TAP the glowing stew!',
  afterTapTitle: '🔮 Circe’s Spell Takes Hold!',
  getAfterTapText() {
    const beast = BEAST_OUTCOMES[Math.floor(Math.random() * BEAST_OUTCOMES.length)];
    return `Circe’s stew transforms you into: ${beast}\n\nWhile in the kitchen, ask someone nearby: "If you could only eat ONE meal for a 10-year voyage at sea, what are you picking?" Then head down the dead-end hallway off the kitchen!`;
  },
  nextButtonText: 'Head Down the Kitchen Hallway →',
  defaultTransform: { x: 0, y: 0, z: 0, scale: 1.0, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const texLoader = new THREE.TextureLoader();
    const circeTex = texLoader.load('./assets/circe_nolan.jpg');
    circeTex.colorSpace = THREE.SRGBColorSpace;

    function createCirceMaterial() {
      return new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: circeTex },
          uTime: { value: 0 },
          uSpellActive: { value: 0.0 },
        },
        transparent: true,
        depthWrite: true,
        side: THREE.DoubleSide,
        vertexShader: `
          uniform sampler2D uMap;
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 texColor = texture2D(uMap, uv);
            float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
            vec3 pos = position;
            pos.z += luma * 0.24;
            pos.x += sin(uTime * 1.6 + uv.y * 4.0) * 0.018 * uv.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uSpellActive;
          varying vec2 vUv;
          void main() {
            vec4 tex = texture2D(uMap, vUv);
            float maxCh = max(max(tex.r, tex.g), tex.b);
            float bgAlpha = smoothstep(0.018, 0.08, maxCh);
            float bottomFade = smoothstep(0.0, 0.08, vUv.y);
            float sideFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
            float alpha = bgAlpha * bottomFade * sideFade;
            if (alpha < 0.02) discard;

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
    }

    const circeMats = [];
    // Place Circe & Her Cauldron at 3 angles around 360° (0°, 120°, -120°) so she is visible in every direction
    [0, 120, -120].forEach((deg) => {
      const mat = createCirceMaterial();
      circeMats.push(mat);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4, 72, 54), mat);
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 2.85;
      mesh.position.set(Math.sin(rad) * dist, -0.05, -Math.cos(rad) * dist);
      mesh.lookAt(0, -0.05, 0);
      root.add(mesh);
      interactables.push(mesh);
    });

    // Place Enchanted Palace Columns & Glowing Orbs at ±60° and 180° between the cauldrons
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0x3a2d44, roughness: 0.5, metalness: 0.3 });
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xd966ff });
    [60, -60, 180].forEach((deg) => {
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 2.9;
      const colGroup = new THREE.Group();
      colGroup.position.set(Math.sin(rad) * dist, -0.2, -Math.cos(rad) * dist);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.9, 14), marbleMat);
      colGroup.add(col);
      interactables.push(col);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), orbMat);
      orb.position.y = 1.15;
      colGroup.add(orb);
      interactables.push(orb);
      root.add(colGroup);
    });

    // 360° Enchanted Potion Sparks surrounding the kitchen
    const count = 140;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * 2.5;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xdf80ff, size: 0.055, transparent: true, opacity: 0.85 })
    );
    root.add(particles);

    root.userData = {
      circeMats,
      particles,
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

    d.circeMats.forEach((m) => {
      m.uniforms.uTime.value = time;
      m.uniforms.uSpellActive.value = d.spellProgress;
    });

    d.particles.rotation.y = time * (d.tapped ? 1.2 : 0.22);
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playMagicChime();
  },
};
