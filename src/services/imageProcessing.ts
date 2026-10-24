import { CornerPoints, FilterType, Point } from '../types/scanner';

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
};

/**
 * Compresses an image to a maximum dimension (default 1600px) and outputs JPEG
 */
export async function compressImage(
  source: File | Blob | string,
  maxDimension = 1600,
  quality = 0.88
): Promise<{ dataUrl: string; width: number; height: number }> {
  let srcUrl = '';
  let shouldRevoke = false;

  if (typeof source === 'string') {
    srcUrl = source;
  } else {
    srcUrl = URL.createObjectURL(source);
    shouldRevoke = true;
  }

  try {
    const img = await loadImage(srcUrl);
    let { width, height } = img;

    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return { dataUrl, width, height };
  } finally {
    if (shouldRevoke) {
      URL.revokeObjectURL(srcUrl);
    }
  }
}

/**
 * Calculates distance between two 2D points
 */
function dist(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Perspective unwarp using Heckbert unit square to quadrilateral mapping
 * S0: tl, S1: tr, S2: br, S3: bl
 */
export async function applyPerspectiveWarp(
  sourceDataUrl: string,
  corners: CornerPoints
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImage(sourceDataUrl);
  const srcW = img.width;
  const srcH = img.height;

  // Denormalize points if they are in 0..1 range
  const p0: Point = { x: corners.tl.x * srcW, y: corners.tl.y * srcH };
  const p1: Point = { x: corners.tr.x * srcW, y: corners.tr.y * srcH };
  const p2: Point = { x: corners.br.x * srcW, y: corners.br.y * srcH };
  const p3: Point = { x: corners.bl.x * srcW, y: corners.bl.y * srcH };

  // Calculate target dimensions from corner edge lengths
  const topDist = dist(p0, p1);
  const bottomDist = dist(p3, p2);
  const leftDist = dist(p0, p3);
  const rightDist = dist(p1, p2);

  let targetW = Math.round(Math.max(topDist, bottomDist));
  let targetH = Math.round(Math.max(leftDist, rightDist));

  // Cap dimensions to avoid memory issues (max 1600px)
  const maxDim = 1600;
  if (targetW > maxDim || targetH > maxDim) {
    const scale = maxDim / Math.max(targetW, targetH);
    targetW = Math.round(targetW * scale);
    targetH = Math.round(targetH * scale);
  }

  // Fallback to min dimensions
  targetW = Math.max(targetW, 100);
  targetH = Math.max(targetH, 100);

  // Draw source image to offscreen canvas to sample pixels
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) throw new Error('Could not get source canvas context');
  srcCtx.drawImage(img, 0, 0);
  const srcImgData = srcCtx.getImageData(0, 0, srcW, srcH);
  const srcPixels = srcImgData.data;

  // Create target canvas
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = targetW;
  dstCanvas.height = targetH;
  const dstCtx = dstCanvas.getContext('2d');
  if (!dstCtx) throw new Error('Could not get target canvas context');
  const dstImgData = dstCtx.createImageData(targetW, targetH);
  const dstPixels = dstImgData.data;

  // Heckbert Projective Mapping Coefficients: Unit Square -> Quad (p0, p1, p2, p3)
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const sx = p0.x - p1.x + p2.x - p3.x;

  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const sy = p0.y - p1.y + p2.y - p3.y;

  const det = dx1 * dy2 - dy1 * dx2;

  let a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;

  if (Math.abs(det) < 1e-6 || (Math.abs(sx) < 1e-6 && Math.abs(sy) < 1e-6)) {
    // Affine mapping fallback
    a = p1.x - p0.x;
    b = p3.x - p0.x;
    c = p0.x;
    d = p1.y - p0.y;
    e = p3.y - p0.y;
    f = p0.y;
    g = 0;
    h = 0;
  } else {
    g = (sx * dy2 - sy * dx2) / det;
    h = (dx1 * sy - dy1 * sx) / det;
    a = p1.x - p0.x + g * p1.x;
    b = p3.x - p0.x + h * p3.x;
    c = p0.x;
    d = p1.y - p0.y + g * p1.y;
    e = p3.y - p0.y + h * p3.y;
    f = p0.y;
  }

  // Iterate over destination pixels and map back to source
  const invW = 1 / targetW;
  const invH = 1 / targetH;

  for (let y = 0; y < targetH; y++) {
    const v = y * invH;
    const dstRowOffset = y * targetW * 4;

    for (let x = 0; x < targetW; x++) {
      const u = x * invW;

      // Projective formula
      const denom = g * u + h * v + 1;
      const srcX = (a * u + b * v + c) / denom;
      const srcY = (d * u + e * v + f) / denom;

      // Bilinear interpolation in source image
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const y1 = Math.min(y0 + 1, srcH - 1);

      const dstIdx = dstRowOffset + (x * 4);

      if (x0 < 0 || x0 >= srcW || y0 < 0 || y0 >= srcH) {
        dstPixels[dstIdx] = 255;
        dstPixels[dstIdx + 1] = 255;
        dstPixels[dstIdx + 2] = 255;
        dstPixels[dstIdx + 3] = 255;
        continue;
      }

      const wx = srcX - x0;
      const wy = srcY - y0;
      const w00 = (1 - wx) * (1 - wy);
      const w10 = wx * (1 - wy);
      const w01 = (1 - wx) * wy;
      const w11 = wx * wy;

      const idx00 = (y0 * srcW + x0) * 4;
      const idx10 = (y0 * srcW + x1) * 4;
      const idx01 = (y1 * srcW + x0) * 4;
      const idx11 = (y1 * srcW + x1) * 4;

      const r = Math.round(w00 * srcPixels[idx00] + w10 * srcPixels[idx10] + w01 * srcPixels[idx01] + w11 * srcPixels[idx11]);
      const gCol = Math.round(w00 * srcPixels[idx00 + 1] + w10 * srcPixels[idx10 + 1] + w01 * srcPixels[idx01 + 1] + w11 * srcPixels[idx11 + 1]);
      const bCol = Math.round(w00 * srcPixels[idx00 + 2] + w10 * srcPixels[idx10 + 2] + w01 * srcPixels[idx01 + 2] + w11 * srcPixels[idx11 + 2]);

      dstPixels[dstIdx] = r;
      dstPixels[dstIdx + 1] = gCol;
      dstPixels[dstIdx + 2] = bCol;
      dstPixels[dstIdx + 3] = 255;
    }
  }

  dstCtx.putImageData(dstImgData, 0, 0);
  const dataUrl = dstCanvas.toDataURL('image/jpeg', 0.9);
  return { dataUrl, width: targetW, height: targetH };
}

/**
 * Rotate an image by degrees (90, 180, 270)
 */
export async function rotateImage(dataUrl: string, degrees: number): Promise<{ dataUrl: string; width: number; height: number }> {
  const normDeg = ((degrees % 360) + 360) % 360;
  if (normDeg === 0) {
    const img = await loadImage(dataUrl);
    return { dataUrl, width: img.width, height: img.height };
  }

  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const is90or270 = normDeg === 90 || normDeg === 270;
  canvas.width = is90or270 ? img.height : img.width;
  canvas.height = is90or270 ? img.width : img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normDeg * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return { dataUrl: rotatedDataUrl, width: canvas.width, height: canvas.height };
}

/**
 * Apply filters (original, color, bw, grayscale, lighten, dark, noise) + brightness and contrast
 */
export async function processImageFilters(
  dataUrl: string,
  filter: FilterType,
  brightness = 0, // -100 to 100
  contrast = 0    // -100 to 100
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImage(dataUrl);
  const width = img.width;
  const height = img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  // Calculate contrast factor
  // factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  const c = Math.max(-100, Math.min(100, contrast));
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));
  const bOffset = (Math.max(-100, Math.min(100, brightness)) / 100) * 128;

  // Helper clamp
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));

  if (filter === 'bw') {
    // High-clarity document binarization with Otsu-like adaptive threshold
    let sumLuminance = 0;
    const grayValues = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < len; i += 4, p++) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayValues[p] = lum;
      sumLuminance += lum;
    }
    const avgLum = sumLuminance / (width * height);
    // Bias slightly lower to preserve thin pencil/ink strokes
    const threshold = Math.max(80, Math.min(180, avgLum * 0.95 + bOffset));

    for (let i = 0, p = 0; i < len; i += 4, p++) {
      const gVal = grayValues[p];
      const binary = gVal < threshold ? 0 : 255;
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
    }
  } else if (filter === 'grayscale') {
    for (let i = 0; i < len; i += 4) {
      let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Apply contrast and brightness
      gray = contrastFactor * (gray - 128) + 128 + bOffset;
      const finalVal = clamp(gray);
      data[i] = finalVal;
      data[i + 1] = finalVal;
      data[i + 2] = finalVal;
    }
  } else if (filter === 'color') {
    // Document Color Boost: Boost contrast and slightly increase ink sharpness
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Document boost: stretch paper whites and deepen shadows
      r = r > 190 ? clamp(r * 1.08) : r < 70 ? clamp(r * 0.9) : r;
      g = g > 190 ? clamp(g * 1.08) : g < 70 ? clamp(g * 0.9) : g;
      b = b > 190 ? clamp(b * 1.08) : b < 70 ? clamp(b * 0.9) : b;

      // Apply brightness & contrast
      r = clamp(contrastFactor * (r - 128) + 128 + bOffset);
      g = clamp(contrastFactor * (g - 128) + 128 + bOffset);
      b = clamp(contrastFactor * (b - 128) + 128 + bOffset);

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  } else if (filter === 'lighten') {
    // Lighten paper background (gamma curve)
    for (let i = 0; i < len; i += 4) {
      let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Gamma curve toward white
      gray = Math.pow(gray / 255, 0.72) * 255 + 25;
      gray = contrastFactor * (gray - 128) + 128 + bOffset;
      const finalVal = clamp(gray);
      data[i] = finalVal;
      data[i + 1] = finalVal;
      data[i + 2] = finalVal;
    }
  } else if (filter === 'dark') {
    // Dark/Deep scan mode for faint pencil / receipts
    for (let i = 0; i < len; i += 4) {
      let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Darken midtones and emphasize dark strokes
      gray = Math.pow(gray / 255, 1.35) * 255;
      gray = (contrastFactor * 1.25) * (gray - 128) + 128 + bOffset;
      const finalVal = clamp(gray);
      data[i] = finalVal;
      data[i + 1] = finalVal;
      data[i + 2] = finalVal;
    }
  } else if (filter === 'noise') {
    // 3x3 Smoothing / Denoise filter for sensor noise
    const copyData = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let rSum = 0, gSum = 0, bSum = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * width + (x + kx)) * 4;
            rSum += copyData[nIdx];
            gSum += copyData[nIdx + 1];
            bSum += copyData[nIdx + 2];
          }
        }

        let r = rSum / 9;
        let g = gSum / 9;
        let b = bSum / 9;

        r = clamp(contrastFactor * (r - 128) + 128 + bOffset);
        g = clamp(contrastFactor * (g - 128) + 128 + bOffset);
        b = clamp(contrastFactor * (b - 128) + 128 + bOffset);

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
      }
    }
  } else {
    // 'original' - still apply brightness/contrast if specified
    if (brightness !== 0 || contrast !== 0) {
      for (let i = 0; i < len; i += 4) {
        data[i] = clamp(contrastFactor * (data[i] - 128) + 128 + bOffset);
        data[i + 1] = clamp(contrastFactor * (data[i + 1] - 128) + 128 + bOffset);
        data[i + 2] = clamp(contrastFactor * (data[i + 2] - 128) + 128 + bOffset);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const processedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return { dataUrl: processedDataUrl, width, height };
}

/**
 * Creates a quick preview thumbnail (e.g. 180px)
 */
export async function createThumbnail(dataUrl: string, maxDim = 180): Promise<string> {
  const img = await loadImage(dataUrl);
  let w = img.width;
  let h = img.height;

  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.75);
}
