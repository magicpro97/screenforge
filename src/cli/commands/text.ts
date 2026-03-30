import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { TextPosition } from '../../types/index.js';

function getTextSVG(
  text: string,
  width: number,
  height: number,
  options: {
    position: TextPosition;
    color: string;
    fontSize: number;
    fontFamily: string;
    strokeColor: string;
  },
): string {
  let y: number;
  switch (options.position) {
    case 'top':
      y = Math.round(height * 0.15);
      break;
    case 'bottom':
      y = Math.round(height * 0.85);
      break;
    case 'center':
    default:
      y = Math.round(height * 0.5);
      break;
  }

  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    .overlay-text {
      font-family: '${options.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${options.fontSize}px;
      font-weight: 700;
      fill: ${options.color};
      stroke: ${options.strokeColor};
      stroke-width: 2px;
      paint-order: stroke fill;
      text-anchor: middle;
      dominant-baseline: middle;
    }
  </style>
  <text x="${Math.round(width / 2)}" y="${y}" class="overlay-text">${escapedText}</text>
</svg>`;
}

function getMultiTextSVG(
  width: number,
  height: number,
  options: {
    title?: string;
    subtitle?: string;
    position: TextPosition;
    color: string;
    fontFamily: string;
    strokeColor: string;
  },
): string {
  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let baseY: number;
  switch (options.position) {
    case 'top':
      baseY = Math.round(height * 0.15);
      break;
    case 'bottom':
      baseY = Math.round(height * 0.85);
      break;
    case 'center':
    default:
      baseY = Math.round(height * 0.5);
      break;
  }

  const hasTitle = !!options.title;
  const hasSubtitle = !!options.subtitle;
  const gap = 16;
  const titleFontSize = 64;
  const subtitleFontSize = 36;

  // Adjust vertical positions so title+subtitle are centered around baseY
  let titleY = baseY;
  let subtitleY = baseY;
  if (hasTitle && hasSubtitle) {
    const totalHeight = titleFontSize + gap + subtitleFontSize;
    titleY = baseY - totalHeight / 2 + titleFontSize / 2;
    subtitleY = titleY + titleFontSize / 2 + gap + subtitleFontSize / 2;
  }

  const cx = Math.round(width / 2);
  let elements = '';

  if (hasTitle) {
    elements += `  <text x="${cx}" y="${Math.round(titleY)}" class="title-text">${escapeXml(options.title!)}</text>\n`;
  }
  if (hasSubtitle) {
    elements += `  <text x="${cx}" y="${Math.round(subtitleY)}" class="subtitle-text">${escapeXml(options.subtitle!)}</text>\n`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    .title-text {
      font-family: '${options.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${titleFontSize}px;
      font-weight: 700;
      fill: ${options.color};
      stroke: ${options.strokeColor};
      stroke-width: 2px;
      paint-order: stroke fill;
      text-anchor: middle;
      dominant-baseline: middle;
    }
    .subtitle-text {
      font-family: '${options.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${subtitleFontSize}px;
      font-weight: 300;
      fill: ${options.color};
      stroke: ${options.strokeColor};
      stroke-width: 1px;
      paint-order: stroke fill;
      text-anchor: middle;
      dominant-baseline: middle;
    }
  </style>
${elements}</svg>`;
}

export function createTextCommand(): Command {
  const cmd = new Command('text');

  cmd
    .description('Add text overlay on screenshot')
    .argument('<input>', 'Path to screenshot image')
    .argument('[text]', 'Text to overlay')
    .option('-p, --position <position>', 'Text position (top, center, bottom)', 'top')
    .option('-c, --color <color>', 'Text color', '#ffffff')
    .option('-s, --font-size <size>', 'Font size in pixels', '64')
    .option('--font <family>', 'Font family', 'Arial')
    .option('--stroke <color>', 'Text stroke color', '#00000080')
    .option('--title <text>', 'Title text (64px bold)')
    .option('--subtitle <text>', 'Subtitle text (36px light)')
    .option('-o, --output <path>', 'Output file path')
    .action(async (input: string, text: string | undefined, options: { position: TextPosition; color: string; fontSize: string; font: string; stroke: string; output?: string; title?: string; subtitle?: string }) => {
      const spinner = ora('Adding text overlay...').start();

      try {
        if (!existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const useMultiText = !!(options.title || options.subtitle);

        if (!useMultiText && !text) {
          spinner.fail(chalk.red('Either <text> argument or --title/--subtitle options are required'));
          process.exit(1);
        }

        const metadata = await sharp(input).metadata();
        const width = metadata.width || 1080;
        const height = metadata.height || 1920;

        let svgOverlay: string;

        if (useMultiText) {
          svgOverlay = getMultiTextSVG(width, height, {
            title: options.title,
            subtitle: options.subtitle,
            position: options.position,
            color: options.color,
            fontFamily: options.font,
            strokeColor: options.stroke,
          });
        } else {
          const fontSize = parseInt(options.fontSize);
          if (isNaN(fontSize) || fontSize <= 0) {
            console.error(chalk.red('Error: font-size must be a positive number'));
            process.exit(1);
          }

          svgOverlay = getTextSVG(text!, width, height, {
            position: options.position,
            color: options.color,
            fontSize,
            fontFamily: options.font,
            strokeColor: options.stroke,
          });
        }

        const outputPath = options.output || join(
          '.',
          `${basename(input, extname(input))}-text${extname(input) || '.png'}`
        );

        await sharp(input)
          .composite([
            {
              input: Buffer.from(svgOverlay),
              gravity: 'center',
            },
          ])
          .png()
          .toFile(outputPath);

        spinner.succeed(
          chalk.green(`Text overlay added → ${chalk.cyan(outputPath)}`)
        );
      } catch (error) {
        spinner.fail(chalk.red(`Failed to add text overlay: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
