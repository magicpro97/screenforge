#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createIconCommand } from './cli/commands/icon.js';
import { createSplashCommand } from './cli/commands/splash.js';
import { createFrameCommand } from './cli/commands/frame.js';
import { createMetaCommand } from './cli/commands/meta.js';
import { createTextCommand } from './cli/commands/text.js';
import { createBatchCommand } from './cli/commands/batch.js';
import { createCompositeCommand } from './cli/commands/composite.js';
import { createConfigCommand } from './cli/commands/config.js';
import { createFeatureCommand } from './cli/commands/feature.js';
import { createAnalyzeCommand } from './cli/commands/analyze.js';

const program = new Command();

program
  .name('screenforge')
  .description('📱 App Store Asset Generator CLI — icons, splash screens, device frames, ASO metadata')
  .version('1.0.0')
  .addHelpText('beforeAll', chalk.bold.cyan(`
  ╔═══════════════════════════════════════════╗
  ║          📱 ScreenForge v1.0.0            ║
  ║   App Store Asset Generator CLI           ║
  ╚═══════════════════════════════════════════╝
`));

program.addCommand(createIconCommand());
program.addCommand(createSplashCommand());
program.addCommand(createFrameCommand());
program.addCommand(createMetaCommand());
program.addCommand(createTextCommand());
program.addCommand(createBatchCommand());
program.addCommand(createCompositeCommand());
program.addCommand(createConfigCommand());
program.addCommand(createFeatureCommand());
program.addCommand(createAnalyzeCommand());

program.parse();
