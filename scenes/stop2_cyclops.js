// Stop 2: Polyphemus the Cyclops (360° Dark Cave Scene)
// Surrounds the user in 360° with jagged cave rock walls & Polyphemus looming in the cave.

export default {
  id: 'cyclops',
  is360: true,
  stepNumber: 'STOP II OF V',
  title: 'Polyphemus the Cyclops',
  location: '📍 The Dark Room (The Cave)',
  instruction: 'Pan 360° inside the cave to face the giant Cyclops. TAP his glowing central eye!',
  afterTapTitle: '👁️ The Cyclops is Blinded!',
  afterTapText:
    '"NOBODY HAS BLINDED ME!" Polyphemus thrashingly rolls back the cave boulder. Escape to the Kitchen! (Ask someone along the way: What is your most irrational fear?)',
  nextButtonText: 'Escape to the Kitchen →',
  defaultTransform: { x: 0, y: 0, z: 0, scale: 1.0, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const texLoader = new THREE.TextureLoader();
    const cyclopsTex = texLoader.load('./assets/cyclops_nolan.jpg');
    cyclopsTex.colorSpace = THREE.SRGBColorSpace;

    const rocksTex = texLoader.load('./assets/sirens_rocks_nolan.jpg');
    rocksTex.colorSpace = THREE.SRGBColorSpace;

    function createCyclopsMaterial() {
      return new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: cyclopsTex },
          uTime: { value: 0 },
          uBlinded: { value: 0.0 },
        },
        transparent: true,
        depthWrite: true,
        side: THREE.DoubleSide,
        vertexShader: `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uBlinded;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 texColor = texture2D(uMap, uv);
            float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
            vec3 pos = position;
            float centerBoost = smoothstep(0.55, 0.0, distance(uv, vec2(0.5, 0.58))) * 0.22;
            pos.z += luma * 0.26 + centerBoost;
            pos.y += sin(uTime * 2.0) * 0.035 * uv.y;
            if (uBlinded > 0.01) {
              pos.x += sin(uTime * 32.0 + uv.y * 6.0) * 0.08 * uBlinded;
              pos.y += cos(uTime * 27.0) * 0.05 * uBlinded;
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
            float maxCh = max(max(tex.r, tex.g), tex.b);
            float bgAlpha = smoothstep(0.02, 0.085, maxCh);
            float bottomFade = smoothstep(0.0, 0.18, vUv.y);
            float sideFade = smoothstep(0.0, 0.09, vUv.x) * smoothstep(1.0, 0.91, vUv.x);
            float topFade = smoothstep(1.0, 0.94, vUv.y);
            float alpha = bgAlpha * bottomFade * sideFade * topFade;
            if (alpha < 0.02) discard;

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
    }

    const cyclopsMats = [];
    // Place Polyphemus at 0° and 180° so whichever way you turn in the dark room, he looms before you
    [0, 180].forEach((deg) => {
      const mat = createCyclopsMaterial();
      cyclopsMats.push(mat);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.55, 80, 60), mat);
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 2.8;
      mesh.position.set(Math.sin(rad) * dist, 0.1, -Math.cos(rad) * dist);
      mesh.lookAt(0, 0.1, 0);
      root.add(mesh);
      interactables.push(mesh);
    });

    // Surround the sides (±65°, ±115°) with dark jagged cave rock walls in 360°
    const caveWallMat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: rocksTex } },
      transparent: true,
      depthWrite: false,
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
        varying vec2 vUv;
        void main() {
          vec4 tex = texture2D(uMap, vUv);
          float maxCh = max(max(tex.r, tex.g), tex.b);
          float sideFade = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
          float bottomFade = smoothstep(0.0, 0.15, vUv.y);
          float sirenMask = 1.0 - smoothstep(0.25, 0.05, distance(vUv, vec2(0.5, 0.78)));
          float alpha = smoothstep(0.015, 0.08, maxCh) * sideFade * bottomFade * sirenMask;
          if (alpha < 0.02) discard;
          // Warm dark cave tint
          vec3 col = tex.rgb * vec3(1.1, 0.75, 0.55);
          gl_FragColor = vec4(col, alpha * 0.9);
        }
      `,
    });

    [-65, 65, -115, 115].forEach((deg) => {
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 3.1;
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.5, 32, 24), caveWallMat);
      wall.position.set(Math.sin(rad) * dist, 0.0, -Math.cos(rad) * dist);
      wall.lookAt(0, 0.0, 0);
      root.add(wall);
      interactables.push(wall);
    });

    // 360° Red Cave Sparks / Dust
    const sparkCount = 120;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * 2.4;
      sparkPos[i * 3] = Math.cos(a) * r;
      sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      sparkPos[i * 3 + 2] = Math.sin(a) * r;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparks = new THREE.Points(
      sparkGeo,
      new THREE.PointsMaterial({ color: 0xff3300, size: 0.055, transparent: true, opacity: 0.75 })
    );
    root.add(sparks);

    root.userData = {
      cyclopsMats,
      sparks,
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

    d.cyclopsMats.forEach((m) => {
      m.uniforms.uTime.value = time;
      m.uniforms.uBlinded.value = d.blindProgress;
    });

    d.sparks.rotation.y = time * (d.tapped ? 1.5 : 0.15);
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playCyclopsRoar();
  },
};
