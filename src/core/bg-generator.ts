// Smart background generator for marketing screenshots
// Generates gradient backgrounds that contrast with app screenshots

import sharp from 'sharp';

export interface BackgroundOptions {
  width: number;
  height: number;
  gradientStart: string; // hex color
  gradientEnd: string;   // hex color
  direction?: 'vertical' | 'horizontal' | 'diagonal';
}

/**
 * Generate a gradient background as a PNG buffer.
 * Uses SVG → sharp rasterization (no canvas dependency).
 */
export async function generateGradientBackground(options: BackgroundOptions): Promise<Buffer> {
  const { width, height, gradientStart, gradientEnd, direction = 'vertical' } = options;

  let x1 = '0%', y1 = '0%', x2 = '0%', y2 = '100%';
  if (direction === 'horizontal') {
    x1 = '0%'; y1 = '0%'; x2 = '100%'; y2 = '0%';
  } else if (direction === 'diagonal') {
    x1 = '0%'; y1 = '0%'; x2 = '100%'; y2 = '100%';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="${gradientStart}" />
      <stop offset="100%" stop-color="${gradientEnd}" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
</svg>`;

  return sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toBuffer();
}

export interface SmartBackgroundResult {
  buffer: Buffer;
  strategy: string;
  gradientColors: [string, string];
  textColor: string;
}

/**
 * Generate a smart background that contrasts with the app screenshot.
 *
 * @param dominantColors - result from extractDominantColors()
 * @param width - output width
 * @param height - output height
 * @param brandColors - optional brand hex colors
 */
export async function generateSmartBackground(
  dominantColors: {
    avgLuminance: number;
    isDark: boolean;
    colors: Array<{ rgb: { r: number; g: number; b: number } }>;
  },
  width: number,
  height: number,
  brandColors?: string[],
): Promise<SmartBackgroundResult> {
  // Import color math inline to avoid dependency issues
  // These are pure math functions inlined for self-containment
  const hexToRgb = (hex: string) => {
    const c = hex.replace('#', '');
    return {
      r: parseInt(c.substring(0, 2), 16),
      g: parseInt(c.substring(2, 4), 16),
      b: parseInt(c.substring(4, 6), 16),
    };
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    const rr = r / 255, gg = g / 255, bb = b / 255;
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    const delta = max - min;
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max - min);
      if (max === rr) h = ((gg - bb) / delta + (gg < bb ? 6 : 0)) * 60;
      else if (max === gg) h = ((bb - rr) / delta + 2) * 60;
      else h = ((rr - gg) / delta + 4) * 60;
    }
    return { h, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    const ss = s / 100, ll = l / 100;
    if (ss === 0) {
      const v = Math.round(ll * 255);
      return `#${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}`;
    }
    const hueToRgb = (p: number, q: number, t: number) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    const hn = h / 360;
    const r = Math.round(hueToRgb(p, q, hn + 1 / 3) * 255);
    const g = Math.round(hueToRgb(p, q, hn) * 255);
    const b = Math.round(hueToRgb(p, q, hn - 1 / 3) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const { isDark } = dominantColors;
  let gradientStart: string;
  let gradientEnd: string;
  let textColor: string;
  let strategy: string;

  if (brandColors && brandColors.length >= 1) {
    const brand = hexToRgb(brandColors[0]);
    const brandHsl = rgbToHsl(brand.r, brand.g, brand.b);

    if (isDark) {
      // Dark app → vibrant brand gradient
      gradientStart = hslToHex(brandHsl.h, Math.min(100, brandHsl.s * 1.3), Math.min(70, brandHsl.l + 15));
      gradientEnd = hslToHex((brandHsl.h + 30) % 360, Math.min(100, brandHsl.s * 1.1), Math.max(20, brandHsl.l - 10));
      textColor = '#FFFFFF';
      strategy = 'vibrant-brand-gradient';
    } else {
      // Light app → deep dark brand gradient
      gradientStart = hslToHex(brandHsl.h, Math.min(80, brandHsl.s * 0.9), Math.max(10, brandHsl.l - 35));
      gradientEnd = hslToHex((brandHsl.h + 20) % 360, Math.min(60, brandHsl.s * 0.7), Math.max(5, brandHsl.l - 50));
      textColor = '#FFFFFF';
      strategy = 'dark-brand-gradient';
    }
  } else {
    // No brand: use complementary
    const primary = dominantColors.colors[0]?.rgb ?? { r: 128, g: 128, b: 128 };
    const hsl = rgbToHsl(primary.r, primary.g, primary.b);
    const compHue = (hsl.h + 180) % 360;

    if (isDark) {
      gradientStart = hslToHex(compHue, 60, 55);
      gradientEnd = hslToHex((compHue + 30) % 360, 50, 40);
      textColor = '#FFFFFF';
      strategy = 'complementary-light';
    } else {
      gradientStart = hslToHex(compHue, 50, 20);
      gradientEnd = hslToHex((compHue + 30) % 360, 40, 12);
      textColor = '#FFFFFF';
      strategy = 'complementary-dark';
    }
  }

  const buffer = await generateGradientBackground({
    width,
    height,
    gradientStart,
    gradientEnd,
    direction: 'diagonal',
  });

  return {
    buffer,
    strategy,
    gradientColors: [gradientStart, gradientEnd],
    textColor,
  };
}
