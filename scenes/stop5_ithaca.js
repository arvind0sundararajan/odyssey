// Stop 5: Welcome Back to Ithaca (Back in the Living Room)
// Golden Greek Laurel Crown & Temple Beacon celebrating completion of The Apartment Odyssey

export default {
  id: 'ithaca',
  stepNumber: 'STOP V OF V — FINALE',
  title: 'Welcome Back to Ithaca!',
  location: '📍 The Living Room',
  instruction:
    'You survived the Trojan Horse, the Cyclops, Circe’s Stew, Charybdis, and the Sirens! TAP the Golden Crown of Ithaca to claim your victory!',
  afterTapTitle: '🏛️ Welcome Home to Ithaca, Hero!',
  afterTapText:
    'You have completed The Apartment Odyssey! Go find Odysseus (your Host with the sword) to celebrate, take out your earplugs, grab a drink, and enjoy the party!',
  nextButtonText: '↻ Replay Odyssey from Stop I',
  defaultTransform: { x: 0, y: 0, z: -3.0, scale: 1.2, rotY: 0 },

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

    // Two Fluted Greek Columns framing the Laurel Wreath
    [-1.1, 1.1].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 1.85, 16), marbleMat);
      col.position.set(cx, -0.1, -0.2);
      root.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.46), goldMat);
      cap.position.set(cx, 0.85, -0.2);
      root.add(cap);
    });

    // Floating Golden Laurel Wreath Crown in the center
    const wreathGroup = new THREE.Group();
    wreathGroup.position.set(0, 0.15, 0.15);
    root.add(wreathGroup);

    const mainRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 16, 48), goldMat);
    wreathGroup.add(mainRing);
    interactables.push(mainRing);

    // Golden Laurel Leaves around the wreath
    const leafGeo = new THREE.ConeGeometry(0.08, 0.24, 6);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const leaf = new THREE.Mesh(leafGeo, goldMat);
      leaf.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0.04);
      leaf.rotation.z = a - Math.PI / 2;
      wreathGroup.add(leaf);
      interactables.push(leaf);
    }

    // Invisible center disk for easy tapping
    const hitDisk = new THREE.Mesh(
      new THREE.CircleGeometry(0.65, 24),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.01, side: THREE.DoubleSide })
    );
    wreathGroup.add(hitDisk);
    interactables.push(hitDisk);

    // Shimmering Golden Victory Dust Particles
    const count = 80;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2.8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xffe066, size: 0.07, transparent: true, opacity: 0.9 })
    );
    root.add(particles);

    const goldLight = new THREE.PointLight(0xffd700, 5.0, 8);
    goldLight.position.set(0, 0.4, 1.4);
    root.add(goldLight);

    root.userData = {
      wreathGroup,
      particles,
      goldLight,
      tapped: false,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    d.wreathGroup.rotation.y += delta * (d.tapped ? 3.2 : 0.75);
    d.wreathGroup.position.y = 0.15 + Math.sin(time * 2.0) * 0.08;
    d.particles.rotation.y += delta * (d.tapped ? 1.5 : 0.25);

    if (d.tapped) {
      const s = 1 + Math.sin(time * 6) * 0.12;
      d.wreathGroup.scale.set(s, s, s);
      d.goldLight.intensity = 8.0 + Math.sin(time * 12) * 2.0;
    }
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playVictoryFanfare();
  },
};
