import { DeviceFrame } from '../types/index.js';

export const DEVICE_FRAMES: DeviceFrame[] = [
  {
    name: 'iPhone 15 Pro',
    device: 'iphone-15-pro',
    width: 1320,
    height: 2868,
    screenX: 21,
    screenY: 63,
    screenWidth: 1278,
    screenHeight: 2742,
    borderRadius: 55,
  },
  {
    name: 'iPhone 15',
    device: 'iphone-15',
    width: 1206,
    height: 2622,
    screenX: 18,
    screenY: 54,
    screenWidth: 1170,
    screenHeight: 2532,
    borderRadius: 50,
  },
  {
    name: 'iPhone SE',
    device: 'iphone-se',
    width: 806,
    height: 1572,
    screenX: 28,
    screenY: 119,
    screenWidth: 750,
    screenHeight: 1334,
    borderRadius: 0,
  },
  {
    name: 'iPad Pro 12.9"',
    device: 'ipad-pro-12',
    width: 2108,
    height: 2852,
    screenX: 30,
    screenY: 60,
    screenWidth: 2048,
    screenHeight: 2732,
    borderRadius: 20,
  },
  {
    name: 'Pixel 8',
    device: 'pixel-8',
    width: 1120,
    height: 2490,
    screenX: 20,
    screenY: 55,
    screenWidth: 1080,
    screenHeight: 2400,
    borderRadius: 45,
  },
  {
    name: 'Samsung Galaxy S24',
    device: 'galaxy-s24',
    width: 1120,
    height: 2460,
    screenX: 20,
    screenY: 50,
    screenWidth: 1080,
    screenHeight: 2340,
    borderRadius: 40,
  },
];

export function getDeviceFrame(device: string): DeviceFrame | undefined {
  return DEVICE_FRAMES.find(f => f.device === device);
}

export function listDeviceFrames(): DeviceFrame[] {
  return DEVICE_FRAMES;
}

export function generateFrameSVG(frame: DeviceFrame): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.width}" height="${frame.height}" viewBox="0 0 ${frame.width} ${frame.height}">
  <defs>
    <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Device body -->
  <rect x="0" y="0" width="${frame.width}" height="${frame.height}" rx="${frame.borderRadius + 10}" ry="${frame.borderRadius + 10}" fill="url(#frameGrad)" />
  <!-- Inner bezel -->
  <rect x="3" y="3" width="${frame.width - 6}" height="${frame.height - 6}" rx="${frame.borderRadius + 7}" ry="${frame.borderRadius + 7}" fill="#0f0f23" />
  <!-- Screen cutout -->
  <rect x="${frame.screenX}" y="${frame.screenY}" width="${frame.screenWidth}" height="${frame.screenHeight}" rx="${frame.borderRadius}" ry="${frame.borderRadius}" fill="#000000" />
</svg>`;
}
