// Stop 5: Welcome Back to Ithaca (360° Golden Temple Colonnade)
// Surrounds the living room in 360° with 8 fluted marble & gold Greek columns,
// floating Golden Laurel Wreaths in all 4 cardinal directions, and 360° golden stardust.

export default {
  id: 'ithaca',
  is360: true,
  stepNumber: 'STOP V OF V — FINALE',
  title: 'Welcome Back to Ithaca!',
  location: '📍 The Living Room',
  instruction:
    'Pan 360° around the Palace of Ithaca and TAP any Golden Crown to claim your victory!',
  afterTapTitle: '🏛️ Welcome Back to Ithaca!',
  afterTapText:
    'You have completed the Odyssey! Go find Odysseus (your Host with the sword), take out your earplugs, grab a drink, and enjoy the party!',
  nextButtonText: '↻ Replay Odyssey from Stop I',
  defaultTransform: { x: 0, y: 0, z: 0, scale: 1.0, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.92,
    });
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf4f0e6,
      roughness: 0.45,
      metalness: 0.1,
    });

    // 8 Fluted Greek Columns in a full 360° circle around the room
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const dist = 3.4;
      const cx = Math.sin(a) * dist;
      const cz = -Math.cos(a) * dist;

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 16), marbleMat);
      col.position.set(cx, -0.1, cz);
      root.add(col);
      interactables.push(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.48), goldMat);
      cap.position.set(cx, 1.02, cz);
      root.add(cap);
    }

    // 4 Floating Golden Laurel Wreath Crowns at 0°, 90°, 180°, 270°
    const wreaths = [];
    const leafGeo = new THREE.ConeGeometry(0.08, 0.24, 6);

    [0, 90, 180, 270].forEach((deg) => {
      const rad = THREE.MathUtils.degToRad(deg);
      const dist = 2.6;
      const wreathGroup = new THREE.Group();
      wreathGroup.position.set(Math.sin(rad) * dist, 0.15, -Math.cos(rad) * dist);
      wreathGroup.lookAt(0, 0.15, 0);

      const mainRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 16, 48), goldMat);
      wreathGroup.add(mainRing);
      interactables.push(mainRing);

      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const leaf = new THREE.Mesh(leafGeo, goldMat);
        leaf.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0.04);
        leaf.rotation.z = a - Math.PI / 2;
        wreathGroup.add(leaf);
        interactables.push(leaf);
      }

      const hitDisk = new THREE.Mesh(
        new THREE.CircleGeometry(0.7, 24),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.01, side: THREE.DoubleSide })
      );
      wreathGroup.add(hitDisk);
      interactables.push(hitDisk);

      root.add(wreathGroup);
      wreaths.push(wreathGroup);
    });

    // 360° Shimmering Golden Victory Dust Particles
    const count = 160;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * 2.8;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.4;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xffe066, size: 0.065, transparent: true, opacity: 0.9 })
    );
    root.add(particles);

    const goldLight = new THREE.PointLight(0xffd700, 5.0, 10);
    goldLight.position.set(0, 0.6, 0);
    root.add(goldLight);

    root.userData = {
      wreaths,
      particles,
      goldLight,
      tapped: false,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    d.wreaths.forEach((w, idx) => {
      w.position.y = 0.15 + Math.sin(time * 2.0 + idx) * 0.08;
      if (d.tapped) {
        const s = 1 + Math.sin(time * 6) * 0.12;
        w.scale.set(s, s, s);
      }
    });

    d.particles.rotation.y += delta * (d.tapped ? 1.5 : 0.22);
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playVictoryFanfare();
  },
};
