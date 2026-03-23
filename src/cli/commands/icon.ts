import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { getIconSizes, getAllPlatforms } from '../../core/icons.js';

export function createIconCommand(): Command {
  const cmd = new Command('icon');

  cmd
    .description('Resize icon to all platform sizes')
    .argument('<input>', 'Path to source icon (1024x1024 recommended)')
    .option('-p, --platform <platform>', 'Target platform (ios, android, web, favicon, all)', 'all')
    .option('-o, --output <dir>', 'Output directory', './icons')
    .option('--prefix <prefix>', 'Filename prefix', '')
    .option('--format <format>', 'Output format (png, webp)', 'png')
    .action(async (input: string, options: { platform: string; output: string; prefix: string; format: string }) => {
      const spinner = ora('Generating icons...').start();

      try {
        if (!existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const metadata = await sharp(input).metadata();
        if (metadata.width !== metadata.height) {
          spinner.warn(chalk.yellow('Warning: Input icon is not square. Results may be distorted.'));
        }

        const sizes = getIconSizes(options.platform);
        const platforms = options.platform === 'all' ? getAllPlatforms() : [options.platform];

        for (const platform of platforms) {
          const platformDir = join(options.output, platform);
          if (!existsSync(platformDir)) {
            mkdirSync(platformDir, { recursive: true });
          }
        }

        let generated = 0;
        for (const iconSize of sizes) {
          const platformDir = join(options.output, iconSize.platform);
          const filename = options.prefix
            ? `${options.prefix}-${iconSize.filename}`
            : iconSize.filename;

          const outputPath = join(platformDir, filename);

          spinner.text = `Generating ${iconSize.platform}/${filename} (${iconSize.size}x${iconSize.size})...`;

          const sharpInstance = sharp(input).resize(iconSize.size, iconSize.size, {
            fit: 'cover',
            kernel: sharp.kernel.lanczos3,
          });

          if (options.format === 'webp') {
            await sharpInstance.webp({ quality: 90 }).toFile(outputPath.replace(/\.png$/, '.webp'));
          } else {
            await sharpInstance.png({ compressionLevel: 9 }).toFile(outputPath);
          }

          generated++;
        }

        spinner.succeed(
          chalk.green(`Generated ${chalk.bold(generated)} icons across ${chalk.bold(platforms.length)} platform(s) → ${chalk.cyan(options.output)}`)
        );

        // Summary table
        console.log('');
        for (const platform of platforms) {
          const platformSizes = sizes.filter(s => s.platform === platform);
          console.log(chalk.dim(`  ${platform}: ${platformSizes.map(s => `${s.size}px`).join(', ')}`));
        }
        console.log('');
      } catch (error) {
        spinner.fail(chalk.red(`Failed to generate icons: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
