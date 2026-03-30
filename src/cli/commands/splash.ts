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
    .option('--gradient <spec>', 'Gradient background (format: from:#color,to:#color)')
    .action(async (input: string, options: { platform: string; output: string; background: string; contain?: boolean; padding: string; gradient?: string }) => {
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

          // Create background — gradient SVG or solid color
          let backgroundInput: sharp.Sharp;
          if (options.gradient) {
            const fromMatch = options.gradient.match(/from:(#[0-9a-fA-F]{3,8})/);
            const toMatch = options.gradient.match(/to:(#[0-9a-fA-F]{3,8})/);
            const gradFrom = fromMatch?.[1] || '#667eea';
            const gradTo = toMatch?.[1] || '#764ba2';
            const gradSvg = `<svg width="${splash.width}" height="${splash.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradFrom};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradTo};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${splash.width}" height="${splash.height}" fill="url(#splashGrad)" />
</svg>`;
            backgroundInput = sharp(Buffer.from(gradSvg)).resize(splash.width, splash.height);
          } else {
            backgroundInput = sharp({
              create: {
                width: splash.width,
                height: splash.height,
                channels: 4,
                background: options.background,
              },
            });
          }

          await backgroundInput
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
