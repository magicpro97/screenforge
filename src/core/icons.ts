import { IconSize } from '../types/index.js';

export const IOS_ICON_SIZES: IconSize[] = [
  { name: 'App Store', size: 1024, platform: 'ios', filename: 'icon-1024.png' },
  { name: 'iPhone App @3x', size: 180, platform: 'ios', filename: 'icon-180.png' },
  { name: 'iPad Pro App @2x', size: 167, platform: 'ios', filename: 'icon-167.png' },
  { name: 'iPad App @2x', size: 152, platform: 'ios', filename: 'icon-152.png' },
  { name: 'iPhone App @2x', size: 120, platform: 'ios', filename: 'icon-120.png' },
  { name: 'iPhone Spotlight @3x', size: 87, platform: 'ios', filename: 'icon-87.png' },
  { name: 'iPad Spotlight @2x', size: 80, platform: 'ios', filename: 'icon-80.png' },
  { name: 'iPad App', size: 76, platform: 'ios', filename: 'icon-76.png' },
  { name: 'iPhone Spotlight @2x', size: 60, platform: 'ios', filename: 'icon-60.png' },
  { name: 'iPhone Settings @2x', size: 58, platform: 'ios', filename: 'icon-58.png' },
  { name: 'iPad Spotlight', size: 40, platform: 'ios', filename: 'icon-40.png' },
  { name: 'iPhone Settings', size: 29, platform: 'ios', filename: 'icon-29.png' },
  { name: 'iPhone Notification @2x', size: 20, platform: 'ios', filename: 'icon-20.png' },
];

export const ANDROID_ICON_SIZES: IconSize[] = [
  { name: 'Play Store', size: 512, platform: 'android', filename: 'icon-512.png' },
  { name: 'xxxhdpi', size: 432, platform: 'android', filename: 'icon-432.png' },
  { name: 'xxhdpi', size: 324, platform: 'android', filename: 'icon-324.png' },
  { name: 'xhdpi', size: 216, platform: 'android', filename: 'icon-216.png' },
  { name: 'hdpi', size: 162, platform: 'android', filename: 'icon-162.png' },
  { name: 'mdpi', size: 108, platform: 'android', filename: 'icon-108.png' },
];

export const WEB_ICON_SIZES: IconSize[] = [
  { name: 'PWA 512', size: 512, platform: 'web', filename: 'icon-512.png' },
  { name: 'PWA 384', size: 384, platform: 'web', filename: 'icon-384.png' },
  { name: 'PWA 256', size: 256, platform: 'web', filename: 'icon-256.png' },
  { name: 'PWA 192', size: 192, platform: 'web', filename: 'icon-192.png' },
  { name: 'Apple Touch', size: 180, platform: 'web', filename: 'apple-touch-icon.png' },
  { name: 'PWA 152', size: 152, platform: 'web', filename: 'icon-152.png' },
  { name: 'PWA 144', size: 144, platform: 'web', filename: 'icon-144.png' },
  { name: 'PWA 128', size: 128, platform: 'web', filename: 'icon-128.png' },
  { name: 'PWA 96', size: 96, platform: 'web', filename: 'icon-96.png' },
  { name: 'PWA 72', size: 72, platform: 'web', filename: 'icon-72.png' },
  { name: 'PWA 64', size: 64, platform: 'web', filename: 'icon-64.png' },
  { name: 'PWA 48', size: 48, platform: 'web', filename: 'icon-48.png' },
  { name: 'PWA 32', size: 32, platform: 'web', filename: 'icon-32.png' },
  { name: 'PWA 16', size: 16, platform: 'web', filename: 'icon-16.png' },
];

export const FAVICON_SIZES: IconSize[] = [
  { name: 'Favicon 48', size: 48, platform: 'favicon', filename: 'favicon-48.png' },
  { name: 'Favicon 32', size: 32, platform: 'favicon', filename: 'favicon-32.png' },
  { name: 'Favicon 16', size: 16, platform: 'favicon', filename: 'favicon-16.png' },
];

export function getIconSizes(platform: string): IconSize[] {
  switch (platform) {
    case 'ios':
      return IOS_ICON_SIZES;
    case 'android':
      return ANDROID_ICON_SIZES;
    case 'web':
      return WEB_ICON_SIZES;
    case 'favicon':
      return FAVICON_SIZES;
    case 'all':
      return [...IOS_ICON_SIZES, ...ANDROID_ICON_SIZES, ...WEB_ICON_SIZES, ...FAVICON_SIZES];
    default:
      return [...IOS_ICON_SIZES, ...ANDROID_ICON_SIZES, ...WEB_ICON_SIZES, ...FAVICON_SIZES];
  }
}

export function getAllPlatforms(): string[] {
  return ['ios', 'android', 'web', 'favicon'];
}
