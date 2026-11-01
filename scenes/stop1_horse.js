// Stop 1: The Trojan Horse (Christopher Nolan IMAX Photorealistic VFX Edition)
// Renders a high-res photorealistic charred-oak Trojan Horse with 2.5D relief displacement,
// alpha-keyed transparency over the live camera feed, flickering torchlight shader, & 3D embers.

export default {
  id: 'horse',
  stepNumber: 'STOP I OF V',
  title: 'The Fallen Trojan Horse',
  location: '📍 Living Room Entrance',
  instruction: 'Aim your camera around the living room and TAP the fallen Trojan Horse.',
  afterTapTitle: '⚔️ The Hatch Opens!',
  afterTapText:
    'Greek warriors have slipped out into the apartment! Before heading into the dark cave, turn to someone nearby and ask: "What is the best concert or live event you have ever snuck into (or wish you were at)?"',
  nextButtonText: 'Head to the Dark Room →',
  defaultTransform: { x: 0, y: -0.15, z: -3.4, scale: 1.25, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const texLoader = new THREE.TextureLoader();
    const horseTex = texLoader.load('./assets/horse_nolan.jpg');
    horseTex.colorSpace = THREE.SRGBColorSpace;

    // Custom GLSL Shader:
    // 1. Keys out the pure black background cleanly for AR transparency
    // 2. Uses luminance for subtle 2.5D vertex depth relief
    // 3. Animates flickering torchlight inside the open side hatch & flares on tap
    const horseShaderMat = new THREE.ShaderMaterial({
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
          // Subtle 2.5D sculptural relief toward the camera
          vec3 pos = position;
          pos.z += luma * 0.22;
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
          float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
          float maxCh = max(max(tex.r, tex.g), tex.b);

          // Smooth alpha key to remove the #000000 background while keeping dark charred timber
          float alpha = smoothstep(0.018, 0.075, maxCh);
          if (alpha < 0.02) discard;

          vec3 col = tex.rgb;

          // Dynamic torchlight flicker around the open side hatch (center-right UV region)
          float distToHatch = distance(vUv, vec2(0.56, 0.48));
          float hatchMask = smoothstep(0.28, 0.02, distToHatch);
          float flicker = 1.0 + sin(uTime * 14.0) * 0.12 + cos(uTime * 23.0) * 0.08;
          col += vec3(1.0, 0.55, 0.15) * hatchMask * (0.12 * flicker + uTapFlare * 0.85);

          // Overall warm rim boost when tapped
          col *= (1.0 + uTapFlare * 0.35);

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    // Subdivided plane for 2.5D sculptural depth (16:9 aspect ratio matching the 4K render)
    const horseGeo = new THREE.PlaneGeometry(4.2, 2.36, 96, 54);
    const horseMesh = new THREE.Mesh(horseGeo, horseShaderMat);
    root.add(horseMesh);
    interactables.push(horseMesh);

    // 3D Volumetric Embers & Ash drifting out of the open hatch
    const emberCount = 75;
    const emberGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.35) * 1.6;
      positions[i * 3 + 1] = (Math.random() - 0.3) * 1.2;
      positions[i * 3 + 2] = 0.15 + Math.random() * 0.65;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xff9933,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    root.add(embers);

    // Subtle pulsing golden reticle over the open hatch so guests know where to tap
    const tapRing = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.22, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffd700,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
    );
    tapRing.position.set(0.22, -0.02, 0.32);
    root.add(tapRing);
    interactables.push(tapRing);

    root.userData = {
      horseMesh,
      horseShaderMat,
      embers,
      tapRing,
      tapped: false,
      flare: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    d.horseShaderMat.uniforms.uTime.value = time;

    // Pulse the tap target ring
    const s = 1 + Math.sin(time * 4.0) * 0.14;
    d.tapRing.scale.set(s, s, 1);

    // Animate 3D embers rising out of the open hatch
    const pos = d.embers.geometry.attributes.position;
    const speed = d.tapped ? 1.35 : 0.38;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + delta * speed * (0.5 + (i % 4) * 0.25);
      let x = pos.getX(i) + Math.sin(time * 2.2 + i) * delta * 0.15;
      if (y > 1.1) {
        y = -0.35;
        x = 0.15 + (Math.random() - 0.5) * 0.65;
      }
      pos.setY(i, y);
      pos.setX(i, x);
    }
    pos.needsUpdate = true;

    if (d.tapped) {
      d.flare = Math.min(1.0, d.flare + delta * 2.5);
      d.horseShaderMat.uniforms.uTapFlare.value =
        0.55 + Math.sin(time * 8.0) * 0.2;
    }
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) {
      d.tapped = true;
      d.tapRing.visible = false;
    }
    if (audio) audio.playHorseCreak();
  },
};
