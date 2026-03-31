// Dominant color extraction from images using k-means clustering
// Requires sharp (already a screenforge dependency)

import sharp from 'sharp';

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
}

export interface ColorAnalysisResult {
  colors: ExtractedColor[];
  avgLuminance: number;
  isDark: boolean;
  width: number;
  height: number;
}

interface Point {
  r: number;
  g: number;
  b: number;
}

function distance(a: Point, b: Point): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

/** Simple k-means clustering on RGB pixels */
function kMeans(pixels: Point[], k: number, maxIter: number = 20): { centroids: Point[]; counts: number[] } {
  if (pixels.length === 0) return { centroids: [], counts: [] };
  if (pixels.length <= k) {
    return {
      centroids: pixels.slice(),
      counts: pixels.map(() => 1),
    };
  }

  // Initialize centroids evenly from sorted pixels
  const step = Math.floor(pixels.length / k);
  let centroids: Point[] = [];
  for (let i = 0; i < k; i++) {
    centroids.push({ ...pixels[i * step] });
  }

  let assignments = new Int32Array(pixels.length);
  let counts = new Array(k).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign each pixel to nearest centroid
    counts.fill(0);
    let changed = false;
    for (let i = 0; i < pixels.length; i++) {
      let minDist = Infinity;
      let best = 0;
      for (let c = 0; c < k; c++) {
        const d = distance(pixels[i], centroids[c]);
        if (d < minDist) {
          minDist = d;
          best = c;
        }
      }
      if (assignments[i] !== best) changed = true;
      assignments[i] = best;
      counts[best]++;
    }

    if (!changed) break;

    // Recalculate centroids
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0 }));
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c].r += pixels[i].r;
      sums[c].g += pixels[i].g;
      sums[c].b += pixels[i].b;
    }
    centroids = sums.map((s, i) => {
      if (counts[i] === 0) return centroids[i];
      return {
        r: Math.round(s.r / counts[i]),
        g: Math.round(s.g / counts[i]),
        b: Math.round(s.b / counts[i]),
      };
    });
  }

  return { centroids, counts };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** sRGB relative luminance (WCAG 2.1) */
function luminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Extract dominant colors from an image using k-means clustering.
 * Resizes to 100×100 for speed, then clusters RGB pixels.
 */
export async function extractDominantColors(
  imagePath: string,
  k: number = 5,
): Promise<ColorAnalysisResult> {
  // Resize to small dimensions for fast processing
  const { data, info } = await sharp(imagePath)
    .resize(100, 100, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Get original dimensions
  const meta = await sharp(imagePath).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;

  // Convert raw buffer to pixel array
  const pixels: Point[] = [];
  for (let i = 0; i < data.length; i += 3) {
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }

  // Run k-means
  const { centroids, counts } = kMeans(pixels, k);
  const totalPixels = pixels.length;

  // Calculate average luminance
  let totalLum = 0;
  for (const px of pixels) {
    totalLum += luminance(px.r, px.g, px.b);
  }
  const avgLuminance = totalLum / totalPixels;

  // Sort by frequency (most dominant first)
  const indexed = centroids.map((c, i) => ({ centroid: c, count: counts[i] }));
  indexed.sort((a, b) => b.count - a.count);

  const colors: ExtractedColor[] = indexed.map(({ centroid, count }) => ({
    hex: rgbToHex(centroid.r, centroid.g, centroid.b),
    rgb: { r: centroid.r, g: centroid.g, b: centroid.b },
    percentage: Math.round((count / totalPixels) * 1000) / 10,
  }));

  return {
    colors,
    avgLuminance: Math.round(avgLuminance * 10000) / 10000,
    isDark: avgLuminance < 0.2,
    width,
    height,
  };
}
