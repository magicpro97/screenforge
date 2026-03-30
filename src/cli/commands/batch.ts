import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'yaml';
import { BatchConfig } from '../../types/index.js';

export function createBatchCommand(): Command {
  const cmd = new Command('batch');

  cmd
    .description('Batch process from YAML config')
    .argument('<config>', 'Path to YAML config file')
    .option('--dry-run', 'Show what would be done without processing')
    .action(async (configPath: string, options: { dryRun?: boolean }) => {
      const spinner = ora('Reading batch config...').start();

      try {
        if (!existsSync(configPath)) {
          spinner.fail(chalk.red(`Config file not found: ${configPath}`));
          process.exit(1);
        }

        const raw = readFileSync(configPath, 'utf-8');
        const config = parse(raw) as BatchConfig;

        spinner.succeed(chalk.green('Batch config loaded'));
        console.log('');

        const tasks: string[] = [];

        if (config.icon) {
          tasks.push(`📐 Icon generation: ${config.icon.input} → ${config.icon.platforms?.join(', ') || 'all platforms'}`);
        }
        if (config.splash) {
          tasks.push(`🌅 Splash screens: ${config.splash.input} → ${config.splash.platforms?.join(', ') || 'all platforms'}`);
        }
        if (config.frame) {
          tasks.push(`📱 Device frames: ${config.frame.inputs.length} screenshot(s) → ${config.frame.device || 'iphone-15-pro'}`);
        }
        if (config.meta) {
          tasks.push(`📝 ASO metadata: "${config.meta.appName}" → ${config.meta.locales?.join(', ') || 'en'}`);
        }
        if (config.text) {
          tasks.push(`✍️  Text overlays: ${config.text.length} image(s)`);
        }

        if (tasks.length === 0) {
          console.log(chalk.yellow('No tasks found in config file.'));
          return;
        }

        console.log(chalk.bold('Batch tasks:'));
        for (const task of tasks) {
          console.log(`  ${task}`);
        }
        console.log('');

        if (options.dryRun) {
          console.log(chalk.dim('Dry run complete. No files were processed.'));
          return;
        }

        // Execute tasks sequentially
        if (config.icon) {
          const iconSpinner = ora('Generating icons...').start();
          try {
            const { createIconCommand } = await import('./icon.js');
            const iconCmd = createIconCommand();
            await iconCmd.parseAsync([
              'node', 'screenforge', 'icon',
              config.icon.input,
              '-p', config.icon.platforms?.join(',') || 'all',
              '-o', config.icon.output || './icons',
            ]);
            iconSpinner.succeed(chalk.green('Icons generated'));
          } catch (error) {
            iconSpinner.fail(chalk.red(`Icon generation failed: ${(error as Error).message}`));
          }
        }

        if (config.splash) {
          const splashSpinner = ora('Generating splash screens...').start();
          try {
            const { createSplashCommand } = await import('./splash.js');
            const splashCmd = createSplashCommand();
            await splashCmd.parseAsync([
              'node', 'screenforge', 'splash',
              config.splash.input,
              '-p', config.splash.platforms?.join(',') || 'all',
              '-o', config.splash.output || './splashes',
              '-b', config.splash.background || '#ffffff',
            ]);
            splashSpinner.succeed(chalk.green('Splash screens generated'));
          } catch (error) {
            splashSpinner.fail(chalk.red(`Splash generation failed: ${(error as Error).message}`));
          }
        }

        if (config.frame) {
          const frameSpinner = ora('Adding device frames...').start();
          try {
            const { getDeviceFrame, generateFrameSVG } = await import('../../core/frames.js');
            const sharp = (await import('sharp')).default;
            const { existsSync: fileExists, mkdirSync: mkDir } = await import('node:fs');
            const { join: joinPath, basename: baseName, extname: extName, dirname: dirName } = await import('node:path');

            const device = config.frame.device || 'iphone-15-pro';
            const frame = getDeviceFrame(device);
            if (!frame) {
              frameSpinner.fail(chalk.red(`Unknown device: ${device}. Skipping frame tasks.`));
            } else {
              const outputDir = config.frame.output || './frames';
              if (!fileExists(outputDir)) {
                mkDir(outputDir, { recursive: true });
              }

              let framed = 0;
              for (const inputPath of config.frame.inputs) {
                if (!fileExists(inputPath)) {
                  console.log(chalk.yellow(`  ⚠ File not found, skipping: ${inputPath}`));
                  continue;
                }

                const resizedScreenshot = await sharp(inputPath)
                  .resize(frame.screenWidth, frame.screenHeight, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 1 },
                  })
                  .toBuffer();

                const frameSvg = generateFrameSVG(frame);
                const frameSvgBuffer = Buffer.from(frameSvg);

                const framedDevice = await sharp(frameSvgBuffer)
                  .resize(frame.width, frame.height)
                  .composite([
                    {
                      input: resizedScreenshot,
                      left: frame.screenX,
                      top: frame.screenY,
                    },
                  ])
                  .png()
                  .toBuffer();

                const outputPath = joinPath(
                  outputDir,
                  `${baseName(inputPath, extName(inputPath))}-framed.png`,
                );
                await sharp(framedDevice).toFile(outputPath);
                framed++;
              }

              frameSpinner.succeed(chalk.green(`Device frames added: ${framed}/${config.frame.inputs.length} screenshot(s)`));
            }
          } catch (error) {
            frameSpinner.fail(chalk.red(`Frame generation failed: ${(error as Error).message}`));
          }
        }

        if (config.meta) {
          spinner.warn(chalk.yellow(`meta tasks are not yet supported in batch mode. Skipping: ${config.meta.appName || 'meta'}`));
        }

        if (config.text) {
          spinner.warn(chalk.yellow(`text tasks are not yet supported in batch mode. Skipping: text`));
        }

        console.log(chalk.bold.green('\n✨ Batch processing complete!\n'));
      } catch (error) {
        spinner.fail(chalk.red(`Batch processing failed: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
