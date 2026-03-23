import { SplashSize } from '../types/index.js';

export const IOS_SPLASH_SIZES: SplashSize[] = [
  { name: 'iPhone 15 Pro Max', width: 1290, height: 2796, platform: 'ios', filename: 'splash-1290x2796.png' },
  { name: 'iPhone 15 Pro', width: 1179, height: 2556, platform: 'ios', filename: 'splash-1179x2556.png' },
  { name: 'iPhone 15', width: 1170, height: 2532, platform: 'ios', filename: 'splash-1170x2532.png' },
  { name: 'iPhone SE', width: 750, height: 1334, platform: 'ios', filename: 'splash-750x1334.png' },
  { name: 'iPad Pro 12.9"', width: 2048, height: 2732, platform: 'ios', filename: 'splash-2048x2732.png' },
  { name: 'iPad Pro 11"', width: 1668, height: 2388, platform: 'ios', filename: 'splash-1668x2388.png' },
  { name: 'iPad Air', width: 1640, height: 2360, platform: 'ios', filename: 'splash-1640x2360.png' },
  { name: 'iPad mini', width: 1488, height: 2266, platform: 'ios', filename: 'splash-1488x2266.png' },
];

export const ANDROID_SPLASH_SIZES: SplashSize[] = [
  { name: 'xxxhdpi Portrait', width: 1440, height: 3120, platform: 'android', filename: 'splash-1440x3120.png' },
  { name: 'xxhdpi Portrait', width: 1080, height: 2340, platform: 'android', filename: 'splash-1080x2340.png' },
  { name: 'xhdpi Portrait', width: 720, height: 1560, platform: 'android', filename: 'splash-720x1560.png' },
  { name: 'hdpi Portrait', width: 540, height: 1170, platform: 'android', filename: 'splash-540x1170.png' },
  { name: 'mdpi Portrait', width: 360, height: 780, platform: 'android', filename: 'splash-360x780.png' },
];

export function getSplashSizes(platform: string): SplashSize[] {
  switch (platform) {
    case 'ios':
      return IOS_SPLASH_SIZES;
    case 'android':
      return ANDROID_SPLASH_SIZES;
    case 'all':
      return [...IOS_SPLASH_SIZES, ...ANDROID_SPLASH_SIZES];
    default:
      return [...IOS_SPLASH_SIZES, ...ANDROID_SPLASH_SIZES];
  }
}
