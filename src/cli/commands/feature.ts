import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function parseGradient(spec: string): { from: string; to: string } {
  const fromMatch = spec.match(/from:(#[0-9a-fA-F]{3,8})/);
  const toMatch = spec.match(/to:(#[0-9a-fA-F]{3,8})/);
  return {
    from: fromMatch?.[1] || '#667eea',
    to: toMatch?.[1] || '#764ba2',
  };
}

function generateFeatureGraphicSvg(
  width: number,
  height: number,
  gradient: { from: string; to: string },
  title?: string,
  subtitle?: string,
): string {
  let titleSvg = '';
  let subtitleSvg = '';

  if (title) {
    const titleY = subtitle ? height - 120 : height - 80;
    titleSvg = `<text x="${width / 2}" y="${titleY}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="48" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeXml(title)}</text>`;
  }

  if (subtitle) {
    const subtitleY = height - 60;
    subtitleSvg = `<text x="${width / 2}" y="${subtitleY}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="28" font-weight="300" fill="rgba(255,255,255,0.9)" text-anchor="middle">${escapeXml(subtitle)}</text>`;
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradient.from};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradient.to};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  ${titleSvg}
  ${subtitleSvg}
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createFeatureCommand(): Command {
  const cmd = new Command('feature');

  cmd
    .description('Generate Play Store feature graphic (1024×500)')
    .argument('<logo>', 'Path to logo/icon image')
    .option('-t, --title <text>', 'Title text centered below logo')
    .option('-s, --subtitle <text>', 'Subtitle text below title')
    .option('--gradient <spec>', 'Gradient background (format: from:#color,to:#color)', 'from:#667eea,to:#764ba2')
    .option('-o, --output <path>', 'Output file path', 'feature-graphic.png')
    .action(async (logo: string, options: { title?: string; subtitle?: string; gradient: string; output: string }) => {
      const spinner = ora('Generating feature graphic...').start();

      try {
        if (!existsSync(logo)) {
          spinner.fail(chalk.red(`Logo file not found: ${logo}`));
          process.exit(1);
        }

        const width = 1024;
        const height = 500;
        const gradient = parseGradient(options.gradient);

        const outputDir = dirname(options.output);
        if (outputDir !== '.' && !existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        // Generate gradient background with text as SVG
        const bgSvg = generateFeatureGraphicSvg(width, height, gradient, options.title, options.subtitle);
        const bgBuffer = Buffer.from(bgSvg);

        // Resize logo to fit ~200px height, centered in upper portion
        const logoMaxHeight = 200;
        const resizedLogo = await sharp(logo)
          .resize({ height: logoMaxHeight, fit: 'inside', withoutEnlargement: true })
          .toBuffer();

        const logoMeta = await sharp(resizedLogo).metadata();
        const logoLeft = Math.round((width - (logoMeta.width || 0)) / 2);
        // Position logo in upper-center area; push up if there's text below
        const logoTop = options.title
          ? Math.round((height - logoMaxHeight - 120) / 2)
          : Math.round((height - (logoMeta.height || 0)) / 2);

        await sharp(bgBuffer)
          .resize(width, height)
          .composite([
            {
              input: resizedLogo,
              left: Math.max(0, logoLeft),
              top: Math.max(20, logoTop),
            },
          ])
          .png()
          .toFile(options.output);

        spinner.succeed(
          chalk.green(`Feature graphic generated → ${chalk.cyan(options.output)} (${width}×${height})`)
        );
      } catch (error) {
        spinner.fail(chalk.red(`Failed to generate feature graphic: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
