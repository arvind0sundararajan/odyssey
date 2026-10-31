// Stop 4A: Charybdis the Whirlpool (Christopher Nolan Practical Water VFX Edition)
// Renders a photorealistic churning ocean maelstrom on the hallway floor with 3D funnel
// depth displacement and live swirling vortex shader.

export default {
  id: 'whirlpool',
  stepNumber: 'STOP IV-A OF V',
  title: 'Charybdis: The Whirlpool',
  location: '📍 End of the Kitchen Hallway (Dead End)',
  instruction: 'Angle your camera toward the floor at the end of the hallway and TAP the churning Whirlpool!',
  afterTapTitle: '🌊 Dead End! Grab Earplugs & Turn Around!',
  afterTapText:
    'Charybdis blocks the passage ahead! Grab a pair of physical EARPLUGS right here, put them in your ears (Beeswax of Odysseus style), and TURN AROUND 180° to walk back through the L-shaped Siren’s Strait!',
  nextButtonText: 'Earplugs In — Turn Around for The Sirens →',
  defaultTransform: { x: 0, y: -0.75, z: -2.9, scale: 1.3, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const texLoader = new THREE.TextureLoader();
    const whirlpoolTex = texLoader.load('/assets/whirlpool_nolan.jpg');
    whirlpoolTex.colorSpace = THREE.SRGBColorSpace;

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
          // Deep 3D funnel sink in the center + churning wave crests
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
          // Subtle swirling vortex UV animation around the abyss center (0.48, 0.48)
          vec2 center = vec2(0.485, 0.49);
          vec2 d = vUv - center;
          float r = length(d);
          float speed = 0.22 + uSurge * 0.55;
          float angle = atan(d.y, d.x) + sin(uTime * 1.5) * 0.08 * smoothstep(0.48, 0.05, r);
          // Continuous slow swirl Twist near the rim/inner funnel
          float twist = uTime * speed * smoothstep(0.52, 0.08, r) * 0.35;
          vec2 swirledUv = center + vec2(cos(angle + twist), sin(angle + twist)) * r;

          vec4 tex = texture2D(uMap, clamp(swirledUv, 0.01, 0.99));
          float maxCh = max(max(tex.r, tex.g), tex.b);

          // Alpha key out outer black vignette +keep deep black abyss in the very center (r < 0.18)
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

    // Tilted slightly so it lies naturally along the hallway floor perspective
    const meshGeo = new THREE.PlaneGeometry(3.8, 2.2, 96, 64);
    const whirlpoolMesh = new THREE.Mesh(meshGeo, whirlpoolShaderMat);
    whirlpoolMesh.rotation.x = -0.38;
    root.add(whirlpoolMesh);
    interactables.push(whirlpoolMesh);

    // Sea spray mist particles rising from the maelstrom
    const sprayCount = 70;
    const sprayGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(sprayCount * 3);
    for (let i = 0; i < sprayCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 1.1;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.3) * 0.6;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.6;
    }
    sprayGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const spray = new THREE.Points(
      sprayGeo,
      new THREE.PointsMaterial({ color: 0xaeeeff, size: 0.045, transparent: true, opacity: 0.75 })
    );
    root.add(spray);

    root.userData = {
      whirlpoolShaderMat,
      spray,
      tapped: false,
      surge: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    d.whirlpoolShaderMat.uniforms.uTime.value = time;
    d.spray.rotation.y = -time * (d.tapped ? 2.4 : 0.85);

    if (d.tapped) {
      d.surge = Math.min(1.0, d.surge + delta * 2.5);
      d.whirlpoolShaderMat.uniforms.uSurge.value = d.surge;
    }
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playWhirlpoolSurge();
  },
};
