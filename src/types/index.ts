/**
 * Platform icon size definitions for app store assets.
 */

export interface IconSize {
  name: string;
  size: number;
  platform: string;
  filename: string;
}

export interface SplashSize {
  name: string;
  width: number;
  height: number;
  platform: string;
  filename: string;
}

export interface DeviceFrame {
  name: string;
  device: string;
  width: number;
  height: number;
  screenX: number;
  screenY: number;
  screenWidth: number;
  screenHeight: number;
  borderRadius: number;
}

export interface ASOMetadata {
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  shortDescription?: string;
  promotionalText?: string;
}

export interface LocalizedMetadata {
  locale: string;
  metadata: ASOMetadata;
}

export interface BatchConfig {
  icon?: {
    input: string;
    platforms?: string[];
    output?: string;
  };
  splash?: {
    input: string;
    platforms?: string[];
    output?: string;
    background?: string;
  };
  frame?: {
    inputs: string[];
    device?: string;
    output?: string;
  };
  meta?: {
    appName: string;
    appDescription: string;
    category?: string;
    locales?: string[];
  };
  text?: Array<{
    input: string;
    text: string;
    position?: string;
    color?: string;
    fontSize?: number;
    output?: string;
  }>;
}

export interface ScreenForgeConfig {
  aiProvider?: 'gemini' | 'openai';
  apiKey?: string;
  defaultOutput?: string;
  defaultPlatform?: string;
}

export type Platform = 'ios' | 'android' | 'web' | 'favicon' | 'all';
export type TextPosition = 'top' | 'center' | 'bottom';
export type SplashPlatform = 'ios' | 'android' | 'all';
