// Stop 4A: Charybdis the Whirlpool (Dead-End Hallway out of Kitchen)
// Spinning 3D ocean vortex on the hallway floor; tapping prompts user to put in earplugs & turn around

export default {
  id: 'whirlpool',
  stepNumber: 'STOP IV-A OF V',
  title: 'Charybdis: The Whirlpool',
  location: '📍 End of the Kitchen Hallway (Dead End)',
  instruction: 'Angle your camera toward the floor at the end of the hallway and TAP the spinning Whirlpool!',
  afterTapTitle: '🌊 Dead End! Grab Earplugs & Turn Around!',
  afterTapText:
    'Charybdis blocks the passage ahead! Grab a pair of physical EARPLUGS right here, put them in your ears (Beeswax of Odysseus style), and TURN AROUND 180° to walk back through the L-shaped Siren’s Strait!',
  nextButtonText: 'Earplugs In — Turn Around for The Sirens →',
  defaultTransform: { x: 0, y: -1.1, z: -2.8, scale: 1.25, rotY: 0 },

  createScene(THREE) {
    const root = new THREE.Group();
    const interactables = [];

    // Tilt the vortex slightly toward the viewer so its depth is visible on the hallway floor
    const vortexGroup = new THREE.Group();
    vortexGroup.rotation.x = 0.32;
    root.add(vortexGroup);

    // Concentric funnel rings descending into the abyss
    const rings = [];
    const ringCount = 9;
    for (let i = 0; i < ringCount; i++) {
      const t = i / (ringCount - 1);
      const radius = 0.22 + (1 - t) * 1.05;
      const depth = -t * 0.85;
      const color = new THREE.Color().setHSL(0.54 - t * 0.06, 0.9, 0.62 - t * 0.42);
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: i % 2 === 1,
        transparent: true,
        opacity: 0.88 - t * 0.25,
      });
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.055 * (1 - t * 0.4), 12, 36),
        mat
      );
      torus.rotation.x = Math.PI / 2;
      torus.position.y = depth;
      vortexGroup.add(torus);
      rings.push(torus);
      interactables.push(torus);
    }

    // Invisible tap target disk across the top of the whirlpool so tapping anywhere on it works easily
    const hitDisk = new THREE.Mesh(
      new THREE.CircleGeometry(1.3, 24),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.01, side: THREE.DoubleSide })
    );
    hitDisk.rotation.x = -Math.PI / 2;
    vortexGroup.add(hitDisk);
    interactables.push(hitDisk);

    // Mini Greek Shipwreck spinning around the rim of the whirlpool
    const shipGroup = new THREE.Group();
    vortexGroup.add(shipGroup);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x704828, roughness: 0.7 });
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.48, 6), woodMat);
    hull.rotation.z = Math.PI / 2;
    hull.position.set(0.85, 0.08, 0);
    shipGroup.add(hull);

    const sail = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xf5ebd6, side: THREE.DoubleSide })
    );
    sail.position.set(0.85, 0.25, 0);
    shipGroup.add(sail);

    // Sea spray particles
    const sprayCount = 70;
    const sprayGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(sprayCount * 3);
    for (let i = 0; i < sprayCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.2 + Math.random() * 1.1;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.3) * 0.6;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    sprayGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const spray = new THREE.Points(
      sprayGeo,
      new THREE.PointsMaterial({ color: 0x88eeff, size: 0.06, transparent: true, opacity: 0.85 })
    );
    vortexGroup.add(spray);

    const seaLight = new THREE.PointLight(0x00ccff, 4.0, 6);
    seaLight.position.set(0, 0.6, 0.5);
    root.add(seaLight);

    root.userData = {
      vortexGroup,
      rings,
      shipGroup,
      spray,
      tapped: false,
    };

    return { root, interactables };
  },

  update(root, time, delta) {
    const d = root.userData;
    if (!d) return;

    const spinBoost = d.tapped ? 3.2 : 1.0;

    // Spin concentric rings faster toward the center
    d.rings.forEach((ring, i) => {
      ring.rotation.z += delta * (1.8 + i * 0.45) * spinBoost;
      if (d.tapped) {
        ring.position.y = -i * 0.08 + Math.sin(time * 8 + i) * 0.14;
      }
    });

    // Orbit the doomed Greek ship around the vortex
    d.shipGroup.rotation.y -= delta * 1.9 * spinBoost;
    d.shipGroup.rotation.z = Math.sin(time * 4) * 0.15;

    d.spray.rotation.y -= delta * 2.5 * spinBoost;
  },

  onTap(root, audio) {
    const d = root.userData;
    if (d) d.tapped = true;
    if (audio) audio.playWhirlpoolSurge();
  },
};
