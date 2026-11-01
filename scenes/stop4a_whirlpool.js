// Stop 4A: Charybdis the Whirlpool (360° Maelstrom Surround Scene)
// Surrounds the user in 360° at the hallway dead-end with a churning floor vortex below
// and swirling water maelstrom walls around them.

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

    const texLoader = new THREE.TextureLoader();
    const whirlpoolTex = texLoader.load('./assets/whirlpool_nolan.jpg');
    whirlpoolTex.colorSpace = THREE.SRGBColorSpace;

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
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uSurge;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 texColor = texture2D(uMap, uv);
            float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
            vec3 pos = position;
            float dist = distance(uv, vec2(0.5, 0.5));
            float funnel = -smoothstep(0.38, 0.0, dist) * 0.55;
            float waves = sin(dist * 24.0 - uTime * 5.0) * 0.045;
            pos.z += funnel + waves + luma * 0.12 + uSurge * sin(dist * 18.0 - uTime * 12.0) * 0.16;
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
            float speed = 0.28 + uSurge * 0.65;
            float angle = atan(d.y, d.x) + sin(uTime * 1.5) * 0.08 * smoothstep(0.48, 0.05, r);
            float twist = uTime * speed * smoothstep(0.52, 0.08, r) * 0.4;
            vec2 swirledUv = center + vec2(cos(angle + twist), sin(angle + twist)) * r;

            vec4 tex = texture2D(uMap, clamp(swirledUv, 0.01, 0.99));
            float maxCh = max(max(tex.r, tex.g), tex.b);
            float outerAlpha = smoothstep(0.02, 0.09, maxCh);
            float centerKeep = smoothstep(0.22, 0.12, r);
            float radialMask = smoothstep(0.50, 0.36, r);
            float alpha = max(outerAlpha, centerKeep) * radialMask;
            if (alpha < 0.02) discard;

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

    // 1. Giant Whirlpool directly on the floor beneath/around the user
    const floorMat = createWhirlpoolMaterial();
    mats.push(floorMat);
    const floorVortex = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2, 72, 72), floorMat);
    floorVortex.rotation.x = -Math.PI / 2;
    floorVortex.position.y = -1.35;
    root.add(floorVortex);
    interactables.push(floorVortex);

    // 2. Four 360° Angled Whirlpool Walls surrounding the user at 0°, 90°, 180°, 270°
    [0, 90, 180, 270].forEach((deg) => {
      const mat = createWhirlpoolMaterial();
      mats.push(mat);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.25, 64, 48), mat);
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 2.9;
      mesh.position.set(Math.sin(rad) * dist, -0.55, -Math.cos(rad) * dist);
      mesh.lookAt(0, -0.1, 0);
      root.add(mesh);
      interactables.push(mesh);
    });

    // 360° Sea Spray Vortex Particles spinning around the user
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
