// Smart Outer-Border Flood-Fill Alpha Cutout Utility
// Removes ONLY the black background connected to the outer edges of the image,
// keeping 100% of dark shadows, hair, charred wood, and armor INSIDE the subject completely opaque!

export function loadSolidCutoutTexture(THREE, url, options = {}) {
  const {
    threshold = 22,       // RGB brightness threshold for outer black background (0..255)
    featherRadius = 3,    // Soft edge anti-aliasing + dark ambient halo
    keepBottom = false,
  } = options;

  const texture = new THREE.Texture();
  texture.colorSpace = THREE.SRGBColorSpace;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const w = img.width;
    const h = img.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const total = w * h;

    // 1 = outer background pixel connected to image border
    const visited = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;

    function isDarkBg(idx) {
      const p = idx * 4;
      return data[p] <= threshold && data[p + 1] <= threshold && data[p + 2] <= threshold;
    }

    function pushIfBg(x, y) {
      const idx = y * w + x;
      if (!visited[idx] && isDarkBg(idx)) {
        visited[idx] = 1;
        queue[tail++] = idx;
      }
    }

    // Seed flood-fill from top, left, right, and (optionally) bottom borders
    for (let x = 0; x < w; x++) {
      pushIfBg(x, 0);
      if (!keepBottom) pushIfBg(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      pushIfBg(0, y);
      pushIfBg(w - 1, y);
    }

    // Fast BFS flood-fill across connected dark background pixels
    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % w;
      const cy = (curr - cx) / w;

      if (cx > 0) pushIfBg(cx - 1, cy);
      if (cx < w - 1) pushIfBg(cx + 1, cy);
      if (cy > 0) pushIfBg(cx, cy - 1);
      if (cy < h - 1) pushIfBg(cx, cy + 1);
    }

    // Apply alpha: outer flood-filled background becomes transparent (0),
    // while ALL interior pixels (including pitch-black hair, wood shadows, abyss) stay 100% opaque (255)!
    for (let i = 0; i < total; i++) {
      const p = i * 4;
      if (visited[i]) {
        data[p + 3] = 0;
      } else {
        // Boost contrast & richness slightly so it pops in medium room lighting
        data[p] = Math.min(255, Math.round(data[p] * 1.08));
        data[p + 1] = Math.min(255, Math.round(data[p + 1] * 1.08));
        data[p + 2] = Math.min(255, Math.round(data[p + 2] * 1.08));
        data[p + 3] = 255;
      }
    }

    // Soft 2px edge feathering so cutout silhouette edges look smooth, not jagged
    if (featherRadius > 0) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          if (!visited[i]) {
            const hasBgNeighbor =
              visited[i - 1] || visited[i + 1] || visited[i - w] || visited[i + w];
            if (hasBgNeighbor) {
              data[i * 4 + 3] = 175;
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    texture.image = canvas;
    texture.needsUpdate = true;
  };
  img.src = url;
  return texture;
}
