// Stop 4B: The Sirens from Afar & Odysseus (Matt Damon) Tied to the Mast
// FULL 360° CAVERNOUS CORRIDOR: Surrounds the viewer in 360 degrees with jagged wet
// basalt sea stacks, swirling ocean mist, distant shadowy Sirens, and Matt Damon tied to the mast.

export default {
  id: 'sirens',
  is360: true,
  stepNumber: 'STOP IV-B OF V',
  title: 'The Siren’s Strait (360°)',
  location: '📍 The L-Shaped Hallway (Keep Earplugs In!)',
  instruction:
    'Pan 360° around the hallway! Jagged Siren sea stacks surround you on all sides—find Odysseus tied to the mast and TAP anywhere to brave the song!',
  afterTapTitle: '🎶 You Survived the Siren Song!',
  afterTapText:
    'Unlike Odysseus screaming at the mast, your earplugs saved you! As you step back into the Living Room, ask the first person you see: "What is the ultimate guilty-pleasure song that would make you crash your ship into the rocks?"',
  nextButtonText: 'Step Back into the Living Room (Ithaca) →',
  // Centered at (0, 0, 0) so the 360° ring of cavernous rocks surrounds the camera
  defaultTransform: { x: 0, y: 0.0, z: 0.0, scale: 1.0, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const texLoader = new THREE.TextureLoader();
    const rocksTex = texLoader.load('/assets/sirens_rocks_nolan.jpg');
    rocksTex.colorSpace = THREE.SRGBColorSpace;

    const damonTex = texLoader.load('/assets/odysseus_mast_nolan.jpg');
    damonTex.colorSpace = THREE.SRGBColorSpace;

    // Factory for a 2.5D cavernous rock formation shader material (with per-instance phase & flip)
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
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uPhase;
          uniform float uFlipX;
          varying vec2 vUv;
          void main() {
            vUv = vec2(uFlipX < 0.0 ? 1.0 - uv.x : uv.x, uv.y);
            vec4 tex = texture2D(uMap, vUv);
            float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
            vec3 pos = position;
            // Strong 2.5D cavernous rock protrusion toward the center of the hallway
            pos.z += luma * 0.45;
            pos.y += sin(uTime * 1.2 + uPhase + uv.x * 4.0) * 0.025;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
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
            float maxCh = max(max(tex.r, tex.g), tex.b);
            float sideFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
            float bottomFade = smoothstep(0.0, 0.14, vUv.y);
            float topFade = smoothstep(1.0, 0.92, vUv.y);
            float alpha = smoothstep(0.015, 0.08, maxCh) * sideFade * bottomFade * topFade;

            // On pure cavern rock walls, dim out the top-center winged silhouettes so only Pure Rocks show
            if (uHideSirens > 0.5) {
              float sirenRegion = smoothstep(0.24, 0.05, distance(vUv, vec2(0.5, 0.78)));
              alpha *= (1.0 - sirenRegion * 0.85);
            }

            if (alpha < 0.02) discard;

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

    // Place 6 Towering Cavernous Sea-Stack Formations all around the user in 360°!
    // Some feature the shadowy distant Sirens perched high in the mist; others are pure jagged cavern walls
    const rockFormationsConfig = [
      { angleDeg: 0, dist: 3.6, y: 0.1, scaleX: 4.4, scaleY: 2.6, flip: 1.0, hideSirens: false },   // Dead ahead: Main Siren Rocks
      { angleDeg: -58, dist: 3.1, y: -0.05, scaleX: 4.0, scaleY: 2.5, flip: -1.0, hideSirens: true }, // Left Hallway Wall Cavern Rocks
      { angleDeg: 58, dist: 3.2, y: 0.0, scaleX: 4.0, scaleY: 2.5, flip: 1.0, hideSirens: true },   // Right Hallway Wall Cavern Rocks
      { angleDeg: -120, dist: 3.5, y: 0.12, scaleX: 4.2, scaleY: 2.6, flip: 1.0, hideSirens: false }, // Rear-Left L-Bend Distant Sirens
      { angleDeg: 122, dist: 3.3, y: -0.08, scaleX: 3.9, scaleY: 2.4, flip: -1.0, hideSirens: true }, // Rear-Right Cavern Rocks
      { angleDeg: 180, dist: 3.7, y: 0.05, scaleX: 4.3, scaleY: 2.5, flip: -1.0, hideSirens: false }, // Behind you (180°): Sirens in the mist
    ];

    const rockMaterials = [];

    rockFormationsConfig.forEach((cfg, idx) => {
      const mat = createRockShaderMaterial(idx * 1.3, cfg.flip, cfg.hideSirens);
      rockMaterials.push(mat);

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(cfg.scaleX, cfg.scaleY, 64, 40),
        mat
      );
      const rad = THREE.MathUtils.degToRad(cfg.angleDeg);
      mesh.position.set(
        Math.sin(rad) * cfg.dist,
        cfg.y,
        -Math.cos(rad) * cfg.dist
      );
      // Face inward toward the viewer at (0, 0, 0)
      mesh.lookAt(0, cfg.y, 0);
      root.add(mesh);
      interactables.push(mesh);
    });

    // FOREGROUND ANCHOR: Matt Damon as Odysseus Tied to the Mast & Screaming
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
        uniform sampler2D uMap;
        uniform float uTime;
        uniform float uScream;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 tex = texture2D(uMap, uv);
          float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
          vec3 pos = position;
          pos.z += luma * 0.24;
          float strain = sin(uTime * (6.0 + uScream * 24.0)) * (0.014 + uScream * 0.04);
          pos.x += strain * uv.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uTime;
        uniform float uScream;
        varying vec2 vUv;
        void main() {
          vec4 tex = texture2D(uMap, vUv);
          float maxCh = max(max(tex.r, tex.g), tex.b);
          float bgAlpha = smoothstep(0.02, 0.085, maxCh);
          float bottomFade = smoothstep(0.0, 0.12, vUv.y);
          float topFade = smoothstep(1.0, 0.94, vUv.y);
          float leftFade = smoothstep(0.0, 0.06, vUv.x);
          float alpha = bgAlpha * bottomFade * topFade * leftFade;
          if (alpha < 0.02) discard;

          vec3 col = tex.rgb * (1.0 + uScream * 0.32);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const damonMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.75, 2.33, 72, 96),
      damonShaderMat
    );
    // Placed closer at ~22° right so as you look ahead or pan slightly right through the rock canyon, Matt Damon is right there screaming at the mast
    const damonAngle = THREE.MathUtils.degToRad(24);
    const damonDist = 2.35;
    damonMesh.position.set(
      Math.sin(damonAngle) * damonDist,
      -0.08,
      -Math.cos(damonAngle) * damonDist
    );
    damonMesh.lookAt(0, -0.08, 0);
    root.add(damonMesh);
    interactables.push(damonMesh);

    // 360° Swirling Sea Mist & Siren Sound Particles surrounding the hallway
    const mistCount = 140;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 2.6;
      mistPos[i * 3] = Math.cos(a) * r;
      mistPos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      mistPos[i * 3 + 2] = Math.sin(a) * r;
    }
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    const mistParticles = new THREE.Points(
      mistGeo,
      new THREE.PointsMaterial({
        color: 0x99ddff,
        size: 0.055,
        transparent: true,
        opacity: 0.65,
      })
    );
    root.add(mistParticles);

    root.userData = {
      rockMaterials,
      damonShaderMat,
      mistParticles,
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

    // Slowly swirl the 360° sea mist around the user
    d.mistParticles.rotation.y = time * (d.tapped ? 0.6 : 0.15);

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
