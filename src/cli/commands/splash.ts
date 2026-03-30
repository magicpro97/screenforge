import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getSplashSizes } from '../../core/splashes.js';

export function createSplashCommand(): Command {
  const cmd = new Command('splash');

  cmd
    .description('Generate splash screens for all device sizes')
    .argument('<input>', 'Path to source image or logo')
    .option('-p, --platform <platform>', 'Target platform (ios, android, all)', 'all')
    .option('-o, --output <dir>', 'Output directory', './splashes')
    .option('-b, --background <color>', 'Background color (hex)', '#ffffff')
    .option('--contain', 'Fit image inside splash (default: cover)')
    .option('--padding <percent>', 'Padding around logo in percent', '20')
    .action(async (input: string, options: { platform: string; output: string; background: string; contain?: boolean; padding: string }) => {
      const spinner = ora('Generating splash screens...').start();

      try {
        if (!existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const sizes = getSplashSizes(options.platform);
        const outputDir = options.output;

        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        const paddingParsed = parseInt(options.padding);
        if (isNaN(paddingParsed) || paddingParsed < 0 || paddingParsed > 50) {
          console.error(chalk.red('Error: padding must be a number between 0 and 50'));
          process.exit(1);
        }
        const padding = paddingParsed / 100;

        let generated = 0;
        for (const splash of sizes) {
          const platformDir = join(outputDir, splash.platform);
          if (!existsSync(platformDir)) {
            mkdirSync(platformDir, { recursive: true });
          }

          const outputPath = join(platformDir, splash.filename);
          spinner.text = `Generating ${splash.name} (${splash.width}x${splash.height})...`;

          const logoMaxWidth = Math.round(splash.width * (1 - padding * 2));
          const logoMaxHeight = Math.round(splash.height * (1 - padding * 2));

          const resizedLogo = await sharp(input)
            .resize(logoMaxWidth, logoMaxHeight, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .toBuffer();

          await sharp({
            create: {
              width: splash.width,
              height: splash.height,
              channels: 4,
              background: options.background,
            },
          })
            .composite([
              {
                input: resizedLogo,
                gravity: 'center',
              },
            ])
            .png({ compressionLevel: 9 })
            .toFile(outputPath);

          generated++;
        }

        spinner.succeed(
          chalk.green(`Generated ${chalk.bold(generated)} splash screens → ${chalk.cyan(outputDir)}`)
        );

        console.log('');
        const platforms = [...new Set(sizes.map(s => s.platform))];
        for (const platform of platforms) {
          const platformSizes = sizes.filter(s => s.platform === platform);
          console.log(chalk.dim(`  ${platform}: ${platformSizes.map(s => `${s.width}x${s.height}`).join(', ')}`));
        }
        console.log('');
      } catch (error) {
        spinner.fail(chalk.red(`Failed to generate splash screens: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
