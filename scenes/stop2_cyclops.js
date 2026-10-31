// Stop 2: Polyphemus the Cyclops (The Dark Room)
// Life-sized looming Cyclops in a dark cave; tap his giant central eye to blind him

export default {
  id: 'cyclops',
  stepNumber: 'STOP II OF V',
  title: 'Polyphemus the Cyclops',
  location: '📍 The Dark Room (The Cave)',
  instruction: 'Aim into the dark room to reveal the giant Cyclops. TAP his glowing central eye!',
  afterTapTitle: '👁️ The Cyclops is Blinded!',
  afterTapText:
    '"NOBODY HAS BLINDED ME!" Polyphemus thrashingly rolls back the cave boulder. Escape to the Kitchen for Circe’s feast! (Ask someone along the way: What is your most irrational fear?)',
  nextButtonText: 'Escape to the Kitchen (Circe’s Stew) →',
  defaultTransform: { x: 0, y: 0.15, z: -3.2, scale: 1.35, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x5c4638,
      roughness: 0.72,
      metalness: 0.12,
    });
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x2b2726,
      roughness: 0.9,
      metalness: 0.08,
    });

    // Cave Archway / Stalactites framing the Cyclops
    const caveGroup = new THREE.Group();
    root.add(caveGroup);
    for (let i = 0; i < 9; i++) {
      const angle = (i / 8) * Math.PI;
      const rx = Math.cos(angle) * 1.65;
      const ry = Math.sin(angle) * 1.45 - 0.1;
      const boulder = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.38 + (i % 3) * 0.12, 1),
        rockMat
      );
      boulder.position.set(rx, ry, -0.35);
      caveGroup.add(boulder);
    }

    // Cyclops Head & Massive Shoulders Group
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // Broad muscular shoulders/chest
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 0.9), skinMat);
    shoulders.position.set(0, -0.95, -0.15);
    bodyGroup.add(shoulders);

    // Craggy Giant Head
    const headGeo = new THREE.DodecahedronGeometry(0.78, 2);
    headGeo.scale(0.92, 1.18, 0.95);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.15, 0);
    bodyGroup.add(headMesh);
    interactables.push(headMesh);

    // Heavy Brow Ridge over the single eye
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 0.35), skinMat);
    brow.position.set(0, 0.56, 0.58);
    brow.rotation.z = -0.05;
    bodyGroup.add(brow);

    // Snarling Jaw & Fangs
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.55), skinMat);
    jaw.position.set(0, -0.38, 0.32);
    bodyGroup.add(jaw);

    const fangMat = new THREE.MeshStandardMaterial({ color: 0xe8dec8, roughness: 0.3 });
    const fangL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 8), fangMat);
    fangL.position.set(-0.22, -0.18, 0.56);
    const fangR = fangL.clone();
    fangR.position.x = 0.22;
    bodyGroup.add(fangL, fangR);

    // THE GIANT CENTRAL EYE (Primary Interactive Target)
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(0, 0.24, 0.62);
    bodyGroup.add(eyeGroup);

    // Sclera (glowing warm amber-white so it stands out in dark rooms)
    const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffe8c2 });
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.29, 24, 24), scleraMat);
    sclera.scale.set(1.1, 0.95, 0.65);
    eyeGroup.add(sclera);
    interactables.push(sclera);

    // Fiery Orange-Red Iris
    const irisMat = new THREE.MeshBasicMaterial({ color: 0xff3b00 });
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), irisMat);
    iris.position.z = 0.192;
    eyeGroup.add(iris);
    interactables.push(iris);

    // Pitch Black Slit/Round Pupil
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050202 });
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), pupilMat);
    pupil.position.z = 0.196;
    eyeGroup.add(pupil);
    interactables.push(pupil);

    // Glowing Target Halo around the Eye
    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.33, 0.38, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff3300,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
    );
    targetRing.position.z = 0.21;
    eyeGroup.add(targetRing);
    interactables.push(targetRing);

    // Eerie Red Cave PointLight emanating from the Cyclops Eye
    const eyeLight = new THREE.PointLight(0xff3300, 4.0, 6);
    eyeLight.position.set(0, 0.25, 1.3);
    root.add(eyeLight);

    root.userData = {
      bodyGroup,
      eyeGroup,
      scleraMat,
      irisMat,
      pupil,
      targetRing,
      eyeLight,
      jaw,
      tapped: false,
      tapTimer: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    if (!d.tapped) {
      // Heavy menacing breathing & eye scanning the dark room
      d.bodyGroup.position.y = Math.sin(time * 1.8) * 0.06;
      d.bodyGroup.rotation.y = Math.sin(time * 0.8) * 0.14;
      d.eyeGroup.rotation.y = Math.sin(time * 2.1) * 0.22;
      d.eyeGroup.rotation.x = Math.cos(time * 1.5) * 0.12;

      const pulse = 1 + Math.sin(time * 5) * 0.12;
      d.targetRing.scale.set(pulse, pulse, 1);
    } else {
      // Blinded rage thrashing animation!
      d.tapTimer += delta;
      d.bodyGroup.rotation.y = Math.sin(time * 18) * 0.25;
      d.bodyGroup.rotation.z = Math.cos(time * 14) * 0.12;
      d.jaw.position.y = -0.45 + Math.sin(time * 20) * 0.05; // roaring jaw
      d.eyeGroup.scale.y = Math.max(0.08, d.eyeGroup.scale.y - delta * 2.5); // eye squinting shut
      d.scleraMat.color.setHex(0xff0000);
      d.irisMat.color.setHex(0xffffff);
      d.eyeLight.intensity = 8.0 + Math.sin(time * 30) * 3.0;
    }
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) {
      d.tapped = true;
      d.targetRing.visible = false;
    }
    if (audio) audio.playCyclopsRoar();
  },
};
