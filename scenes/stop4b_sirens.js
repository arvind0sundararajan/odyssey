// Stop 4B: The Sirens & Jagged Rocks (Walking back through the L-Shaped Hallway)
// Jagged sea rocks on either side & glowing ethereal Sirens emitting hypnotic sonic rings

export default {
  id: 'sirens',
  stepNumber: 'STOP IV-B OF V',
  title: 'The Siren’s Strait',
  location: '📍 The L-Shaped Hallway (Keep Earplugs In!)',
  instruction:
    'Walk back through both segments of the L-shaped hallway aiming your camera around the rocks. TAP the glowing Sirens to resist their song!',
  afterTapTitle: '🎶 You Resisted the Siren Song!',
  afterTapText:
    'Your earplugs worked! As you step back out into the Living Room, ask the first person you see: "What is the ultimate guilty-pleasure song that would make you crash your ship into the rocks?"',
  nextButtonText: 'Step Back into the Living Room (Ithaca) →',
  defaultTransform: { x: 0, y: -0.1, z: -3.5, scale: 1.1, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x263238,
      roughness: 0.85,
      metalness: 0.15,
    });

    // Jagged Sea Stacks / Rocks lining both sides of the hallway
    const rockPositions = [
      [-1.15, -0.75, 0.4, 0.55],
      [1.15, -0.7, 0.3, 0.5],
      [-0.95, -0.65, -0.8, 0.62],
      [1.05, -0.68, -0.9, 0.58],
    ];
    rockPositions.forEach(([rx, ry, rz, rScale]) => {
      const rock = new THREE.Mesh(new THREE.ConeGeometry(rScale, rScale * 2.3, 6), rockMat);
      rock.position.set(rx, ry, rz);
      rock.rotation.z = rx < 0 ? -0.18 : 0.18;
      root.add(rock);
      interactables.push(rock);
    });

    // Helper to create an ethereal glowing Winged Siren figure
    function createSiren(xOffset, yOffset, zOffset) {
      const siren = new THREE.Group();
      siren.position.set(xOffset, yOffset, zOffset);

      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x66ffee,
        transparent: true,
        opacity: 0.88,
      });
      const wingMat = new THREE.MeshBasicMaterial({
        color: 0xff77dd,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      });

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), glowMat);
      head.position.y = 0.52;
      siren.add(head);
      interactables.push(head);

      // Crown / Halo
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 24), wingMat);
      halo.position.y = 0.58;
      siren.add(halo);

      // Torso / Flowing Gown
      const torso = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.92, 16), glowMat);
      torso.position.y = -0.05;
      siren.add(torso);
      interactables.push(torso);

      // Left & Right Feathered Siren Wings
      const wingGeo = new THREE.PlaneGeometry(0.75, 0.48);
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(-0.42, 0.25, -0.05);
      wingL.rotation.z = 0.35;
      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.set(0.42, 0.25, -0.05);
      wingR.rotation.z = -0.35;
      siren.add(wingL, wingR);
      interactables.push(wingL, wingR);

      siren.userData = { wingL, wingR };
      return siren;
    }

    const sirenMain = createSiren(0, 0.25, 0);
    const sirenLeft = createSiren(-0.95, 0.45, -0.65);
    sirenLeft.scale.setScalar(0.78);
    const sirenRight = createSiren(0.95, 0.4, -0.7);
    sirenRight.scale.setScalar(0.78);

    root.add(sirenMain, sirenLeft, sirenRight);

    // Expanding Hypnotic Soundwave Rings pulsing toward the viewer
    const waveRings = [];
    for (let i = 0; i < 4; i++) {
      const waveMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x55ffee : 0xff66cc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const wave = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.3, 32), waveMat);
      wave.position.set(0, 0.25, i * 0.45);
      root.add(wave);
      waveRings.push(wave);
      interactables.push(wave);
    }

    const sirenLight = new THREE.PointLight(0x44ffdd, 4.0, 7);
    sirenLight.position.set(0, 0.5, 1.0);
    root.add(sirenLight);

    root.userData = {
      sirens: [sirenMain, sirenLeft, sirenRight],
      waveRings,
      sirenLight,
      tapped: false,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    // Gentle hovering & wing flapping of the 3 Sirens
    d.sirens.forEach((s, idx) => {
      s.position.y = (idx === 0 ? 0.25 : 0.42) + Math.sin(time * 2.2 + idx * 1.5) * 0.14;
      const flap = Math.sin(time * (d.tapped ? 12 : 3.8) + idx) * 0.38;
      s.userData.wingL.rotation.y = flap;
      s.userData.wingR.rotation.y = -flap;
    });

    // Propagate hypnotic sonic rings toward the viewer
    d.waveRings.forEach((wave, idx) => {
      const progress = ((time * (d.tapped ? 1.8 : 0.65) + idx * 0.25) % 1.0);
      const scale = 0.5 + progress * 3.5;
      wave.scale.set(scale, scale, 1);
      wave.position.z = progress * 1.8;
      wave.material.opacity = (1.0 - progress) * 0.8;
      if (d.tapped) {
        wave.material.color.setHex(0xffd700);
      }
    });
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playSirenChord();
  },
};
