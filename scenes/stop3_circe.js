// Stop 3: Circe & Her Enchanted Stew (Christopher Nolan IMAX Photorealistic VFX Edition)
// Renders Circe standing behind her steaming hammered-bronze cauldron with 2.5D relief,
// animated glowing cauldron vapor, and 3D rising potion embers.

const BEAST_OUTCOMES = [
  '🐗 A Wild Golden Boar — bold, unstoppable near the snack table.',
  '🐺 A Wine-Dark Sea Wolf — loyal to the pack, howling at 1 AM.',
  '🦁 A Mycenaean Lion — majestic, guarding the bar.',
  '🦉 Athena’s Midnight Owl — observant, plotting the next side-quest.',
];

export default {
  id: 'circe',
  stepNumber: 'STOP III OF V',
  title: 'Circe & The Enchanted Stew',
  location: '📍 The Kitchen',
  instruction: 'Aim your camera in the kitchen to see Circe at her cauldron. TAP the glowing stew!',
  afterTapTitle: '🔮 Circe’s Spell Takes Hold!',
  getAfterTapText() {
    const beast = BEAST_OUTCOMES[Math.floor(Math.random() * BEAST_OUTCOMES.length)];
    return `Circe’s stew transforms you into: ${beast}\n\nWhile in the kitchen, ask someone nearby: "If you could only eat ONE meal for a 10-year voyage at sea, what are you picking?" Then head down the dead-end hallway off the kitchen!`;
  },
  nextButtonText: 'Head Down the Kitchen Hallway →',
  defaultTransform: { x: 0, y: -0.05, z: -2.8, scale: 1.25, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const texLoader = new THREE.TextureLoader();
    const circeTex = texLoader.load('./assets/circe_nolan.jpg');
    circeTex.colorSpace = THREE.SRGBColorSpace;

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
        uniform sampler2D uMap;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec4 texColor = texture2D(uMap, uv);
          float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

          vec3 pos = position;
          // 2.5D sculptural depth relief for Circe and the cauldron rim
          pos.z += luma * 0.24;
          // Subtle swaying motion for steam & robes
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

          // Alpha key out #000000 background + soft bottom fade
          float bgAlpha = smoothstep(0.018, 0.08, maxCh);
          float bottomFade = smoothstep(0.0, 0.08, vUv.y);
          float alpha = bgAlpha * bottomFade;
          if (alpha < 0.02) discard;

          vec3 col = tex.rgb;

          // Cauldron rim glow at UV (0.50, 0.28)
          float distToStew = distance(vUv * vec2(1.0, 1.6), vec2(0.50, 0.44));
          float stewGlow = smoothstep(0.32, 0.02, distToStew);
          float shimmer = 0.5 + 0.5 * sin(uTime * 5.0 + vUv.x * 12.0);
          col += vec3(0.75, 0.22, 1.0) * stewGlow * (0.18 + 0.18 * shimmer + uSpellActive * 0.85);

          // Magical emerald-violet aura flare when tapped
          if (uSpellActive > 0.01) {
            float wave = 0.5 + 0.5 * sin(uTime * 10.0 - distance(vUv, vec2(0.5, 0.35)) * 18.0);
            col += vec3(0.45, 0.15, 0.9) * wave * uSpellActive * 0.45;
          }

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const meshGeo = new THREE.PlaneGeometry(3.2, 2.4, 96, 72);
    const circeMesh = new THREE.Mesh(meshGeo, circeShaderMat);
    root.add(circeMesh);
    interactables.push(circeMesh);

    // Pulsing Golden/Violet Reticle over the simmering stew pot
    const stewTarget = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.27, 32),
      new THREE.MeshBasicMaterial({
        color: 0xd966ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      })
    );
    stewTarget.position.set(0, -0.45, 0.32);
    root.add(stewTarget);
    interactables.push(stewTarget);

    // 3D Enchanted Potion Sparks rising from the cauldron
    const count = 65;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.4;
      pos[i * 3 + 1] = -0.5 + Math.random() * 1.6;
      pos[i * 3 + 2] = 0.2 + Math.random() * 0.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xdf80ff,
        size: 0.05,
        transparent: true,
        opacity: 0.85,
      })
    );
    root.add(particles);

    root.userData = {
      circeShaderMat,
      stewTarget,
      particles,
      tapped: false,
      spellProgress: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    d.circeShaderMat.uniforms.uTime.value = time;

    const s = 1 + Math.sin(time * 4.5) * 0.14;
    d.stewTarget.scale.set(s, s, 1);

    const pos = d.particles.geometry.attributes.position;
    const speed = d.tapped ? 1.4 : 0.45;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + delta * speed * (0.6 + (i % 3) * 0.3);
      let x = pos.getX(i) + Math.sin(time * 2.5 + i) * delta * 0.22;
      if (y > 1.15) {
        y = -0.52;
        x = (Math.random() - 0.5) * 1.1;
      }
      pos.setY(i, y);
      pos.setX(i, x);
    }
    pos.needsUpdate = true;

    if (d.tapped) {
      d.spellProgress = Math.min(1.0, d.spellProgress + delta * 2.5);
      d.circeShaderMat.uniforms.uSpellActive.value = d.spellProgress;
    }
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) {
      d.tapped = true;
      d.stewTarget.visible = false;
    }
    if (audio) audio.playMagicChime();
  },
};
