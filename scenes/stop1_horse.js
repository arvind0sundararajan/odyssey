// Stop 1: The Trojan Horse (Living Room Entrance)
// Large wooden horse lying on its side with an open side hatch & glowing embers

export default {
  id: 'horse',
  stepNumber: 'STOP I OF V',
  title: 'The Fallen Trojan Horse',
  location: '📍 Living Room Entrance',
  instruction: 'Aim your camera around the living room and TAP the Trojan Horse lying on its side.',
  afterTapTitle: '⚔️ The Hatch Opens!',
  afterTapText:
    'Greek warriors have slipped out into the apartment! Before heading into the dark cave, turn to someone nearby and ask: "What is the best concert or live event you have ever snuck into (or wish you were at)?"',
  nextButtonText: 'Head to the Dark Room (The Cyclops) →',
  defaultTransform: { x: 0, y: -0.4, z: -3.8, scale: 1.1, rotY: -0.35 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    // Horse assembly tilted on its side (rotZ ~ 78 deg so it lies on its side)
    const horseGroup = new THREE.Group();
    horseGroup.rotation.z = Math.PI * 0.43;
    horseGroup.rotation.x = 0.08;
    root.add(horseGroup);

    const woodMain = new THREE.MeshStandardMaterial({
      color: 0x6e4726,
      roughness: 0.78,
      metalness: 0.1,
    });
    const woodDark = new THREE.MeshStandardMaterial({
      color: 0x3d2512,
      roughness: 0.85,
      metalness: 0.15,
    });
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd4a24c,
      roughness: 0.35,
      metalness: 0.8,
    });

    // Hollowed torso barrel (planked)
    const bodyGeo = new THREE.CylinderGeometry(0.68, 0.72, 2.2, 12);
    bodyGeo.rotateZ(Math.PI / 2);
    const bodyMesh = new THREE.Mesh(bodyGeo, woodMain);
    horseGroup.add(bodyMesh);
    interactables.push(bodyMesh);

    // Wooden ribs/straps around torso
    for (let i = -0.85; i <= 0.85; i += 0.55) {
      const ribGeo = new THREE.TorusGeometry(0.71, 0.045, 8, 16);
      ribGeo.rotateY(Math.PI / 2);
      const rib = new THREE.Mesh(ribGeo, woodDark);
      rib.position.x = i;
      horseGroup.add(rib);
    }

    // Neck & Head
    const neckGroup = new THREE.Group();
    neckGroup.position.set(-1.05, 0.45, 0);
    neckGroup.rotation.z = 0.55;
    horseGroup.add(neckGroup);

    const neckMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.15, 0.52), woodMain);
    neckGroup.add(neckMesh);
    interactables.push(neckMesh);

    // Mane (bronze/dark wood crest)
    const maneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.12), bronzeMat);
    maneMesh.position.set(0.26, 0.05, 0);
    neckGroup.add(maneMesh);

    // Head snout
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 0.46), woodMain);
    headMesh.position.set(-0.28, 0.55, 0);
    headMesh.rotation.z = 0.35;
    neckGroup.add(headMesh);
    interactables.push(headMesh);

    // Glowing Trojan Horse Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), eyeMat);
    leftEye.position.set(-0.25, 0.65, 0.24);
    const rightEye = leftEye.clone();
    rightEye.position.z = -0.24;
    neckGroup.add(leftEye, rightEye);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.09, 0.28, 6);
    const earL = new THREE.Mesh(earGeo, woodDark);
    earL.position.set(0.05, 0.82, 0.16);
    const earR = earL.clone();
    earR.position.z = -0.16;
    neckGroup.add(earL, earR);

    // 4 Legs + Wheeled siege platform
    const legPositions = [
      [-0.75, -0.85, 0.42],
      [-0.75, -0.85, -0.42],
      [0.75, -0.85, 0.42],
      [0.75, -0.85, -0.42],
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.05, 0.22), woodDark);
      leg.position.set(lx, ly, lz);
      horseGroup.add(leg);
      interactables.push(leg);

      // Bronze wheel at foot
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 16), bronzeMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(lx, ly - 0.55, lz > 0 ? lz + 0.12 : lz - 0.12);
      horseGroup.add(wheel);
    });

    // Glowing Interior Cavity (visible on the side facing the camera)
    const cavityMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const cavity = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.62), cavityMat);
    cavity.position.set(0, 0.05, 0.71);
    horseGroup.add(cavity);
    interactables.push(cavity);

    // Side Hatch Door (hinged, already partially open, swings wide on tap)
    const hatchPivot = new THREE.Group();
    hatchPivot.position.set(0, -0.26, 0.72);
    hatchPivot.rotation.x = 0.65; // cracked open initially
    horseGroup.add(hatchPivot);

    const hatchDoor = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.64, 0.08), woodDark);
    hatchDoor.position.set(0, 0.32, 0);
    hatchPivot.add(hatchDoor);
    interactables.push(hatchDoor);

    // Rope ladder / spears sticking out of the open side
    const spearGroup = new THREE.Group();
    spearGroup.position.set(0, 0.05, 0.75);
    horseGroup.add(spearGroup);
    for (let s = -1; s <= 1; s++) {
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), bronzeMat);
      spear.rotation.x = Math.PI / 2 + s * 0.15;
      spear.rotation.z = s * 0.25;
      spear.position.set(s * 0.22, 0, 0.35);
      spearGroup.add(spear);
    }

    // Warm firelight inside the horse belly
    const fireLight = new THREE.PointLight(0xff6600, 3.5, 6);
    fireLight.position.set(0, 0.2, 1.1);
    root.add(fireLight);

    // Floating Embers Particle System
    const emberCount = 55;
    const emberGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.2;
      positions[i * 3 + 1] = (Math.random() - 0.2) * 1.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5 + 0.5;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xffaa33,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    root.add(embers);

    // Floating "TAP ME" Golden Ring Indicator above the open hatch
    const ringGeo = new THREE.RingGeometry(0.22, 0.28, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const tapRing = new THREE.Mesh(ringGeo, ringMat);
    tapRing.position.set(0.2, 0.15, 0.95);
    root.add(tapRing);
    interactables.push(tapRing);

    root.userData = {
      horseGroup,
      hatchPivot,
      spearGroup,
      fireLight,
      embers,
      tapRing,
      cavityMat,
      tapped: false,
      tapTime: 0,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    // Subtle breathing / settling motion
    d.horseGroup.position.y = Math.sin(time * 1.5) * 0.03;

    // Flickering interior firelight
    d.fireLight.intensity = (d.tapped ? 7.0 : 3.2) + Math.sin(time * 13.0) * 0.8;

    // Pulse tap ring
    const s = 1 + Math.sin(time * 4) * 0.15;
    d.tapRing.scale.set(s, s, 1);

    // Rise embers
    const pos = d.embers.geometry.attributes.position;
    const speed = d.tapped ? 1.4 : 0.45;
    for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + delta * speed * (0.6 + (i % 5) * 0.2);
        let x = pos.getX(i) + Math.sin(time * 2 + i) * delta * 0.2;
        if (y > 1.8) y = -0.5;
        pos.setY(i, y);
        pos.setX(i, x);
    }
    pos.needsUpdate = true;

    // If tapped, animate hatch swinging wide open & spears thrusting out
    if (d.tapped) {
      d.tapTime += delta;
      d.hatchPivot.rotation.x = Math.min(2.35, d.hatchPivot.rotation.x + delta * 4.5);
      d.spearGroup.position.z = Math.min(1.25, d.spearGroup.position.z + delta * 1.5);
      d.cavityMat.color.setHex(0xffcc33);
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
