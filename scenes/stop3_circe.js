// Stop 3: Circe's Enchanted Stew (The Kitchen)
// Floating bronze cauldron bubbling with purple potion & floating animal spirits

const BEAST_OUTCOMES = [
  '🐗 A Wild Golden Boar — bold, unstoppable near the snack table.',
  '🐺 A Wine-Dark Sea Wolf — loyal to the pack, howling at 1 AM.',
  '🦁 A Mycenaean Lion — majestic, guarding the bar.',
  '🦉 Athena’s Midnight Owl — observant, plotting the next side-quest.',
];

export default {
  id: 'circe',
  stepNumber: 'STOP III OF V',
  title: 'Circe’s Enchanted Stew',
  location: '📍 The Kitchen',
  instruction: 'Find Circe’s simmering cauldron in the kitchen. TAP the bubbling stew to taste the potion!',
  afterTapTitle: '🔮 Circe’s Spell Takes Hold!',
  getAfterTapText() {
    const beast = BEAST_OUTCOMES[Math.floor(Math.random() * BEAST_OUTCOMES.length)];
    return `The stew transforms you into: ${beast}\n\nWhile in the kitchen, ask someone nearby: "If you could only eat ONE meal for a 10-year voyage at sea, what are you picking?" Then head down the dead-end hallway off the kitchen!`;
  },
  nextButtonText: 'Head Down the Kitchen Hallway (The Whirlpool) →',
  defaultTransform: { x: 0, y: -0.35, z: -2.6, scale: 1.15, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const bronzeDark = new THREE.MeshStandardMaterial({
      color: 0x3b2d22,
      roughness: 0.4,
      metalness: 0.85,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf4c44e,
      roughness: 0.25,
      metalness: 0.9,
    });

    // Cauldron Belly
    const cauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 28, 20, 0, Math.PI * 2, 0.28, Math.PI * 0.72),
      bronzeDark
    );
    root.add(cauldron);
    interactables.push(cauldron);

    // Ornate Gold Lip Rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.055, 14, 36), goldMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.48;
    root.add(rim);
    interactables.push(rim);

    // Side Ring Handles
    [-0.66, 0.66].forEach((hx) => {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 10, 24), goldMat);
      handle.position.set(hx, 0.25, 0);
      root.add(handle);
    });

    // Glowing Bubbling Stew Surface inside Cauldron
    const stewMat = new THREE.MeshBasicMaterial({
      color: 0xb829ff,
      side: THREE.DoubleSide,
    });
    const stewSurface = new THREE.Mesh(new THREE.CircleGeometry(0.58, 32), stewMat);
    stewSurface.rotation.x = -Math.PI / 2;
    stewSurface.position.y = 0.45;
    root.add(stewSurface);
    interactables.push(stewSurface);

    // Wooden Stirring Ladle resting in the stew
    const ladleMat = new THREE.MeshStandardMaterial({ color: 0x734822, roughness: 0.7 });
    const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.1, 10), ladleMat);
    ladle.position.set(0.22, 0.75, 0);
    ladle.rotation.z = -0.45;
    root.add(ladle);
    interactables.push(ladle);

    // Rising Potion Bubbles & Enchanted Runes
    const bubbleGroup = new THREE.Group();
    root.add(bubbleGroup);
    const bubbles = [];
    for (let i = 0; i < 18; i++) {
      const bMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xd966ff : 0x33ffcc,
        transparent: true,
        opacity: 0.85,
      });
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.045 + (i % 4) * 0.02, 12, 12),
        bMat
      );
      b.position.set(
        (Math.random() - 0.5) * 0.85,
        0.5 + Math.random() * 1.1,
        (Math.random() - 0.5) * 0.85
      );
      bubbleGroup.add(b);
      bubbles.push(b);
    }

    // Orbiting Spectral Rings above the stew
    const orbitGroup = new THREE.Group();
    orbitGroup.position.y = 0.95;
    root.add(orbitGroup);

    const runeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.015, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x33ffcc, transparent: true, opacity: 0.7 })
    );
    runeRing.rotation.x = Math.PI / 2.3;
    orbitGroup.add(runeRing);

    const purpleLight = new THREE.PointLight(0xc433ff, 4.5, 6);
    purpleLight.position.set(0, 0.9, 0.6);
    root.add(purpleLight);

    root.userData = {
      stewMat,
      ladle,
      bubbles,
      orbitGroup,
      purpleLight,
      tapped: false,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    // Stirring ladle motion
    const speed = d.tapped ? 6.0 : 1.8;
    d.ladle.position.x = Math.cos(time * speed) * 0.22;
    d.ladle.position.z = Math.sin(time * speed) * 0.22;
    d.ladle.rotation.z = -0.35 + Math.sin(time * speed) * 0.18;

    // Orbiting magic rings
    d.orbitGroup.rotation.y = time * (d.tapped ? 3.5 : 0.9);
    d.orbitGroup.rotation.z = Math.sin(time * 1.2) * 0.2;

    // Rising bubbles
    d.bubbles.forEach((b, idx) => {
      b.position.y += delta * (d.tapped ? 1.8 : 0.55) * (1 + (idx % 3) * 0.3);
      b.position.x += Math.sin(time * 3 + idx) * delta * 0.15;
      if (b.position.y > 1.85) {
        b.position.y = 0.46;
      }
    });

    if (d.tapped) {
      d.stewMat.color.setHSL((time * 0.6) % 1.0, 0.95, 0.6);
      d.purpleLight.intensity = 7.5 + Math.sin(time * 15) * 2.0;
    }
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playMagicChime();
  },
};
