# 🏛️ The Apartment Odyssey — WebAR Walkthrough

An interactive 5-stop mobile WebAR walkthrough inspired by Homer's *The Odyssey*, built with **Three.js (WebGL)**, **DeviceOrientation Sensor Fusion**, **Raycasting**, **Web Audio API Procedural Synthesis**, and a zero-dependency **Python 3 Edge Server** designed to run on a Raspberry Pi (`luna`).

## 🗺️ The 5 Stops

1. **The Fallen Trojan Horse (`scenes/stop1_horse.js`)** — Living Room Entrance
2. **Polyphemus the Cyclops (`scenes/stop2_cyclops.js`)** — The Dark Room (Life-sized AR Cyclops)
3. **Circe’s Enchanted Stew (`scenes/stop3_circe.js`)** — The Kitchen
4. **Charybdis Whirlpool & The Sirens (`scenes/stop4a_whirlpool.js`, `scenes/stop4b_sirens.js`)** — Kitchen Dead-End Hallway (with physical earplugs) & L-Shaped Hallway Return
5. **Welcome Back to Ithaca (`scenes/stop5_ithaca.js`)** — Living Room Finale

## 🚀 Running Locally or on Raspberry Pi (`luna`)

```bash
python3 server.py 8080
```

- **Guest Experience:** `http://localhost:8080`
- **Live Room Placement Tuner:** `http://localhost:8080/?tune=1`
