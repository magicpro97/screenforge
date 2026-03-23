import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ScreenForgeConfig } from '../types/index.js';

const CONFIG_DIR = join(homedir(), '.screenforge');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export async function loadConfig(): Promise<ScreenForgeConfig> {
  ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const data = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as ScreenForgeConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(config: ScreenForgeConfig): Promise<void> {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export async function setConfigValue(key: string, value: string): Promise<void> {
  const config = await loadConfig();
  (config as Record<string, string>)[key] = value;
  await saveConfig(config);
}

export async function getConfigValue(key: string): Promise<string | undefined> {
  const config = await loadConfig();
  return (config as Record<string, string | undefined>)[key];
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
