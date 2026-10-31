// The Apartment Odyssey — Core Pluggable WebAR Engine
import * as THREE from 'three';

import stop1Horse from './scenes/stop1_horse.js';
import stop2Cyclops from './scenes/stop2_cyclops.js';
import stop3Circe from './scenes/stop3_circe.js';
import stop4aWhirlpool from './scenes/stop4a_whirlpool.js';
import stop4bSirens from './scenes/stop4b_sirens.js';
import stop5Ithaca from './scenes/stop5_ithaca.js';

const STOPS = [
  stop1Horse,
  stop2Cyclops,
  stop3Circe,
  stop4aWhirlpool,
  stop4bSirens,
  stop5Ithaca,
];

// --- Procedural Web Audio Synthesizer (Zero External Audio Files Needed) ---
class OdysseyAudio {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, endFreq, duration, type = 'sine', gainVal = 0.25) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }
  playHorseCreak() {
    this.playTone(140, 65, 0.55, 'sawtooth', 0.22);
    setTimeout(() => this.playTone(220, 440, 0.4, 'triangle', 0.2), 180);
  }
  playCyclopsRoar() {
    this.playTone(110, 38, 0.9, 'sawtooth', 0.35);
    this.playTone(165, 45, 0.85, 'square', 0.2);
  }
  playMagicChime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, f * 1.02, 0.45, 'sine', 0.18), i * 90);
    });
  }
  playWhirlpoolSurge() {
    this.playTone(180, 390, 0.65, 'triangle', 0.25);
  }
  playSirenChord() {
    [440, 554.37, 659.25, 880].forEach((f) => {
      this.playTone(f, f * 1.05, 0.85, 'sine', 0.14);
    });
  }
  playVictoryFanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, f, 0.5, 'triangle', 0.24), i * 120);
    });
  }
}

const audio = new OdysseyAudio();

// --- State ---
let currentStopIndex = 0;
let savedPlacements = {};
let activeRoot = null;
let activeInteractables = [];
let hasTappedCurrentStop = false;

// Camera Look Angles (Gyroscope + Touch/Mouse Drag Fusion)
let yaw = 0;
let pitch = 0;
let gyroBaseAlpha = null;
let isPointerDown = false;
let lastPointerX = 0;
let lastPointerY = 0;
let pointerDownPos = { x: 0, y: 0 };

// --- Three.js Setup ---
const canvas = document.getElementById('ar-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.rotation.order = 'YXZ';

const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffe6b3, 2.2);
dirLight.position.set(2, 5, 3);
scene.add(dirLight);

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

// --- Load Saved Placements from Server ---
async function fetchPlacements() {
  try {
    const res = await fetch('/api/placements');
    if (res.ok) {
      savedPlacements = await res.json();
    }
  } catch (e) {
    console.warn('Using default scene placements:', e);
  }
}

function getTransformForStop(stop) {
  return {
    ...stop.defaultTransform,
    ...(savedPlacements[stop.id] || {}),
  };
}

function applyTransformToActiveRoot(t) {
  if (!activeRoot) return;
  activeRoot.position.set(Number(t.x), Number(t.y), Number(t.z));
  activeRoot.scale.setScalar(Number(t.scale));
  activeRoot.rotation.y = Number(t.rotY);
}

// --- Load a Stop Module ---
function loadStop(index) {
  currentStopIndex = ((index % STOPS.length) + STOPS.length) % STOPS.length;
  const stop = STOPS[currentStopIndex];
  hasTappedCurrentStop = false;

  // Reset camera look direction so each new stop starts right in front of the user
  yaw = 0;
  pitch = 0;
  gyroBaseAlpha = null;

  // Clean up previous 3D group
  if (activeRoot) {
    scene.remove(activeRoot);
    activeRoot = null;
  }
  activeInteractables = [];

  // Instantiate new 3D stop scene
  const created = stop.createScene(THREE);
  activeRoot = created.root;
  activeInteractables = created.interactables || [activeRoot];

  const t = getTransformForStop(stop);
  applyTransformToActiveRoot(t);
  scene.add(activeRoot);

  // Update HUD
  document.getElementById('step-badge').textContent = stop.stepNumber;
  document.getElementById('stop-title').textContent = stop.title;
  document.getElementById('stop-location').textContent = stop.location;
  document.getElementById('instruction-text').textContent = stop.instruction;
  document.getElementById('after-tap-box').classList.add('hidden');
  document.getElementById('next-stop-btn').textContent = stop.nextButtonText;

  // Progress dots
  const dotsContainer = document.getElementById('progress-dots');
  dotsContainer.innerHTML = '';
  STOPS.forEach((_, idx) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (idx === currentStopIndex ? ' active' : idx < currentStopIndex ? ' done' : '');
    dotsContainer.appendChild(dot);
  });

  // Sync Tuner UI
  syncTunerControls(stop, t);
}

// --- Handle Tapping the 3D Object ---
function triggerStopInteraction() {
  if (hasTappedCurrentStop) return;
  hasTappedCurrentStop = true;

  const stop = STOPS[currentStopIndex];
  if (stop.onTap) {
    stop.onTap(activeRoot, audio);
  }

  document.getElementById('after-tap-title').textContent = stop.afterTapTitle;
  const bodyText = stop.getAfterTapText ? stop.getAfterTapText() : stop.afterTapText;
  document.getElementById('after-tap-text').textContent = bodyText;
  document.getElementById('after-tap-box').classList.remove('hidden');
}

// --- Raycasting & Look Controls ---
canvas.addEventListener('pointerdown', (e) => {
  isPointerDown = true;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointermove', (e) => {
  if (!isPointerDown) return;
  const dx = e.clientX - lastPointerX;
  const dy = e.clientY - lastPointerY;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;

  yaw += dx * 0.005;
  pitch = Math.max(-Math.PI / 2.4, Math.min(Math.PI / 2.4, pitch + dy * 0.005));
});

window.addEventListener('pointerup', (e) => {
  if (!isPointerDown) return;
  isPointerDown = false;

  // If finger/mouse barely moved, treat as a TAP on the 3D scene
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist < 14 && activeRoot) {
    pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);

    const hits = raycaster.intersectObjects(activeInteractables, true);
    if (hits.length > 0) {
      triggerStopInteraction();
    }
  }
});

// --- Mobile Gyroscope Support ---
function enableGyroscope() {
  const handleOrientation = (e) => {
    if (e.alpha === null || isPointerDown) return;
    const alphaRad = THREE.MathUtils.degToRad(e.alpha);
    const betaRad = THREE.MathUtils.degToRad(e.beta || 90);
    if (gyroBaseAlpha === null) {
      gyroBaseAlpha = alphaRad;
    }
    yaw = alphaRad - gyroBaseAlpha;
    pitch = THREE.MathUtils.clamp(betaRad - Math.PI / 2, -Math.PI / 2.5, Math.PI / 2.5);
  };

  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    DeviceOrientationEvent.requestPermission()
      .then((state) => {
        if (state === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      })
      .catch(() => {});
  } else {
    window.addEventListener('deviceorientation', handleOrientation);
  }
}

// --- Start Camera Feed ---
async function startCamera() {
  const video = document.getElementById('camera-feed');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.info('Camera unavailable or denied; using atmospheric Aegean night backdrop.');
    video.style.display = 'none';
  }
}

// --- Tuner Controls (?tune=1 or ⚙️ Tune button) ---
const tunerPanel = document.getElementById('tuner-panel');
const stopSelect = document.getElementById('tuner-stop-select');
const inputs = {
  x: document.getElementById('tune-x'),
  y: document.getElementById('tune-y'),
  z: document.getElementById('tune-z'),
  scale: document.getElementById('tune-scale'),
  rotY: document.getElementById('tune-roty'),
};

function initTuner() {
  STOPS.forEach((s, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${idx + 1}. ${s.title}`;
    stopSelect.appendChild(opt);
  });

  stopSelect.addEventListener('change', () => {
    loadStop(Number(stopSelect.value));
  });

  Object.keys(inputs).forEach((key) => {
    inputs[key].addEventListener('input', () => {
      const stop = STOPS[currentStopIndex];
      const updated = {
        x: Number(inputs.x.value),
        y: Number(inputs.y.value),
        z: Number(inputs.z.value),
        scale: Number(inputs.scale.value),
        rotY: Number(inputs.rotY.value),
      };
      savedPlacements[stop.id] = updated;
      applyTransformToActiveRoot(updated);
      updateTunerLabels(updated);
    });
  });

  document.getElementById('recenter-btn').addEventListener('click', () => {
    yaw = 0;
    pitch = 0;
    gyroBaseAlpha = null;
  });

  document.getElementById('save-placement-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('save-status');
    statusEl.textContent = 'Saving...';
    try {
      const res = await fetch('/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedPlacements),
      });
      if (res.ok) {
        statusEl.textContent = '✅ Saved to placements.json!';
      } else {
        statusEl.textContent = '⚠️ Could not save';
      }
    } catch {
      statusEl.textContent = '⚠️ Offline save only';
    }
    setTimeout(() => (statusEl.textContent = ''), 2500);
  });

  document.getElementById('tune-toggle-btn').addEventListener('click', () => {
    tunerPanel.classList.toggle('hidden');
  });

  if (new URLSearchParams(window.location.search).get('tune') === '1') {
    tunerPanel.classList.remove('hidden');
  }
}

function syncTunerControls(stop, t) {
  stopSelect.value = currentStopIndex;
  inputs.x.value = t.x;
  inputs.y.value = t.y;
  inputs.z.value = t.z;
  inputs.scale.value = t.scale;
  inputs.rotY.value = t.rotY;
  updateTunerLabels(t);
}

function updateTunerLabels(t) {
  document.getElementById('val-x').textContent = Number(t.x).toFixed(2);
  document.getElementById('val-y').textContent = Number(t.y).toFixed(2);
  document.getElementById('val-z').textContent = Number(t.z).toFixed(2);
  document.getElementById('val-scale').textContent = Number(t.scale).toFixed(2);
  document.getElementById('val-roty').textContent = Number(t.rotY).toFixed(2);
}

// --- Offscreen Target Indicator ---
const tempVec = new THREE.Vector3();
const offscreenEl = document.getElementById('offscreen-indicator');

function checkOffscreenIndicator() {
  if (!activeRoot) return;
  const stop = STOPS[currentStopIndex];
  if (stop && stop.is360) {
    offscreenEl.classList.add('hidden');
    return;
  }
  tempVec.copy(activeRoot.position);
  tempVec.project(camera);
  const isBehind = tempVec.z > 1;
  const isOff = isBehind || Math.abs(tempVec.x) > 0.95 || Math.abs(tempVec.y) > 0.95;
  if (isOff) {
    offscreenEl.classList.remove('hidden');
    const dir = isBehind || tempVec.x < 0 ? '⬅️ Pan Left' : 'Pan Right ➡️';
    offscreenEl.textContent = `${dir} to find ${stop.title}`;
  } else {
    offscreenEl.classList.add('hidden');
  }
}

// --- Main Loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  const stop = STOPS[currentStopIndex];
  if (activeRoot && stop.update) {
    stop.update(activeRoot, elapsed, delta);
  }

  checkOffscreenIndicator();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- UI Initialization ---
document.getElementById('start-btn').addEventListener('click', async () => {
  audio.init();
  enableGyroscope();
  await startCamera();
  document.getElementById('splash-modal').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
});

document.getElementById('next-stop-btn').addEventListener('click', () => {
  loadStop(currentStopIndex + 1);
});

(async function boot() {
  initTuner();
  await fetchPlacements();
  loadStop(0);
  animate();
})();
