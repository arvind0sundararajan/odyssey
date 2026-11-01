// Stop 1: The Trojan Horse (360° Living Room Siege Scene)
// Surrounds the user in 360° with the fallen Christopher Nolan Trojan Horse,
// burning Troy siege pillars/braziers, scattered bronze spears, and 360° embers.

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

    const texLoader = new THREE.TextureLoader();
    const horseTex = texLoader.load('./assets/horse_nolan.jpg');
    horseTex.colorSpace = THREE.SRGBColorSpace;

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
          uniform sampler2D uMap;
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 texColor = texture2D(uMap, uv);
            float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
            vec3 pos = position;
            pos.z += luma * 0.25;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uTapFlare;
          varying vec2 vUv;

          void main() {
            vec4 tex = texture2D(uMap, vUv);
            float maxCh = max(max(tex.r, tex.g), tex.b);
            float alpha = smoothstep(0.018, 0.075, maxCh);
            if (alpha < 0.02) discard;

            vec3 col = tex.rgb;
            float distToHatch = distance(vUv, vec2(0.56, 0.48));
            float hatchMask = smoothstep(0.28, 0.02, distToHatch);
            float flicker = 1.0 + sin(uTime * 14.0) * 0.12 + cos(uTime * 23.0) * 0.08;
            col += vec3(1.0, 0.55, 0.15) * hatchMask * (0.12 * flicker + uTapFlare * 0.85);
            col *= (1.0 + uTapFlare * 0.35);

            gl_FragColor = vec4(col, alpha);
          }
        `,
      });
    }

    const horseMats = [];
    // Place the Trojan Horse at 0° (ahead) and 180° (behind) so whichever way you enter, it's in view
    [0, 180].forEach((deg) => {
      const mat = createHorseMaterial();
      horseMats.push(mat);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.36, 80, 45), mat);
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 3.3;
      mesh.position.set(Math.sin(rad) * dist, -0.15, -Math.cos(rad) * dist);
      mesh.lookAt(0, -0.15, 0);
      root.add(mesh);
      interactables.push(mesh);
    });

    // Place Burning Siege Pillars & Greek Spears at ±90° (left and right walls) to complete the 360° ring
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xc8963e, roughness: 0.35, metalness: 0.85 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x2b2623, roughness: 0.85 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });

    [-90, -48, 48, 90, -135, 135].forEach((deg) => {
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 3.1;
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(Math.sin(rad) * dist, -0.4, -Math.cos(rad) * dist);
      pillarGroup.lookAt(0, -0.4, 0);

      // Ruined stone siege column
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.5, 12), stoneMat);
      pillarGroup.add(col);
      interactables.push(col);

      // Bronze fire brazier bowl on top
      const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 12), bronzeMat);
      bowl.rotation.x = Math.PI;
      bowl.position.y = 0.82;
      pillarGroup.add(bowl);

      // Glowing flame orb
      const flame = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 1), flameMat);
      flame.position.y = 0.98;
      pillarGroup.add(flame);
      interactables.push(flame);

      root.add(pillarGroup);
    });

    // 360° Volumetric Embers & Ash drifting all around the room
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
      new THREE.PointsMaterial({ color: 0xff9933, size: 0.05, transparent: true, opacity: 0.85 })
    );
    root.add(embers);

    root.userData = {
      horseMats,
      embers,
      tapped: false,
      flare: 0,
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
