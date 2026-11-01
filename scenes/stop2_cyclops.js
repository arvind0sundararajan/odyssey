// Stop 2: Polyphemus the Cyclops (Christopher Nolan IMAX Photorealistic VFX Edition)
// Renders a life-sized photorealistic Cyclops emerging from the dark room with 2.5D relief,
// glowing central eye shader, and blinding crimson explosion when his eye is tapped.

export default {
  id: 'cyclops',
  stepNumber: 'STOP II OF V',
  title: 'Polyphemus the Cyclops',
  location: '📍 The Dark Room (The Cave)',
  instruction: 'Aim into the dark room to reveal the giant Cyclops. TAP his glowing central eye!',
  afterTapTitle: '👁️ The Cyclops is Blinded!',
  afterTapText:
    '"NOBODY HAS BLINDED ME!" Polyphemus thrashingly rolls back the cave boulder. Escape to the Kitchen! (Ask someone along the way: What is your most irrational fear?)',
  nextButtonText: 'Escape to the Kitchen →',
  defaultTransform: { x: 0, y: 0.1, z: -2.9, scale: 1.35, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const texLoader = new THREE.TextureLoader();
    const cyclopsTex = texLoader.load('./assets/cyclops_nolan.jpg');
    cyclopsTex.colorSpace = THREE.SRGBColorSpace;

    const cyclopsShaderMat = new THREE.ShaderMaterial({
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

          // 2.5D sculptural depth relief (nose, brow, central eye, and pauldrons protrude toward viewer)
          vec3 pos = position;
          float centerBoost = smoothstep(0.55, 0.0, distance(uv, vec2(0.5, 0.58))) * 0.22;
          pos.z += luma * 0.26 + centerBoost;

          // Breathing heave motion
          pos.y += sin(uTime * 2.0) * 0.035 * uv.y;
          pos.z += sin(uTime * 2.0) * 0.04 * (1.0 - uv.y);

          // Violent thrashing when blinded
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

          // Alpha key out pure black background + soft vignette fade along bottom & side edges
          float bgAlpha = smoothstep(0.02, 0.085, maxCh);
          float bottomFade = smoothstep(0.0, 0.18, vUv.y);
          float sideFade = smoothstep(0.0, 0.09, vUv.x) * smoothstep(1.0, 0.91, vUv.x);
          float topFade = smoothstep(1.0, 0.94, vUv.y);
          float alpha = bgAlpha * bottomFade * sideFade * topFade;

          if (alpha < 0.02) discard;

          vec3 col = tex.rgb;

          // Central Eye UV is at (0.50, 0.715)
          vec2 eyeUv = vec2(0.50, 0.715);
          float distToEye = distance(vUv, eyeUv);

          // Subtle menacing amber pulse in the iris before tapping
          float irisGlow = smoothstep(0.085, 0.01, distToEye);
          float pulse = 0.5 + 0.5 * sin(uTime * 4.5);
          col += vec3(0.9, 0.25, 0.05) * irisGlow * (0.25 + 0.25 * pulse);

          // When tapped (blinded): searing crimson-orange fire erupts across the eye
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

    // 4:3 portrait-wide aspect ratio matching the Cyclops bust
    const meshGeo = new THREE.PlaneGeometry(3.1, 2.32, 96, 72);
    const cyclopsMesh = new THREE.Mesh(meshGeo, cyclopsShaderMat);
    root.add(cyclopsMesh);
    interactables.push(cyclopsMesh);

    // Glowing Eye Target Reticle right over his central eye (UV 0.50, 0.715 -> Y = +0.50)
    const eyeTarget = new THREE.Mesh(
      new THREE.RingGeometry(0.19, 0.23, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff3300,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
      })
    );
    eyeTarget.position.set(0, 0.50, 0.42);
    root.add(eyeTarget);
    interactables.push(eyeTarget);

    // 3D Sparks / Blood Embers that burst out of the eye when tapped
    const sparkCount = 80;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkVel = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = 0;
      sparkPos[i * 3 + 1] = 0.50;
      sparkPos[i * 3 + 2] = 0.38;
      sparkVel.push({
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.3) * 2.0,
        vz: 0.5 + Math.random() * 1.8,
      });
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparks = new THREE.Points(
      sparkGeo,
      new THREE.PointsMaterial({
        color: 0xff3300,
        size: 0.065,
        transparent: true,
        opacity: 0.0,
      })
    );
    root.add(sparks);

    root.userData = {
      cyclopsShaderMat,
      eyeTarget,
      sparks,
      sparkVel,
      tapped: false,
      blindProgress: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    d.cyclopsShaderMat.uniforms.uTime.value = time;

    // Pulse eye target ring
    const s = 1 + Math.sin(time * 5.0) * 0.14;
    d.eyeTarget.scale.set(s, s, 1);

    if (d.tapped) {
      d.blindProgress = Math.min(1.0, d.blindProgress + delta * 3.0);
      d.cyclopsShaderMat.uniforms.uBlinded.value = d.blindProgress;

      // Explode sparks outward from the blinded eye
      d.sparks.material.opacity = 0.95;
      const pos = d.sparks.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const v = d.sparkVel[i];
        let x = pos.getX(i) + v.vx * delta;
        let y = pos.getY(i) + v.vy * delta;
        let z = pos.getZ(i) + v.vz * delta;
        if (z > 2.2 || y < -1.2) {
          x = 0;
          y = 0.50;
          z = 0.38;
        }
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) {
      d.tapped = true;
      d.eyeTarget.visible = false;
    }
    if (audio) audio.playCyclopsRoar();
  },
};
