import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { join, basename, extname, dirname } from 'node:path';
import { getDeviceFrame, listDeviceFrames, generateFrameSVG } from '../../core/frames.js';
import { getTemplate, getTemplateNames } from '../../core/templates.js';
import { getBadge, getBadgeNames, createBadgeSvg } from '../../core/badges.js';

function parseGradientSpec(spec: string): { from: string; to: string } {
  const fromMatch = spec.match(/from:(#[0-9a-fA-F]{3,8})/);
  const toMatch = spec.match(/to:(#[0-9a-fA-F]{3,8})/);
  return {
    from: fromMatch?.[1] || '#667eea',
    to: toMatch?.[1] || '#764ba2',
  };
}

function generateGradientBackgroundSvg(width: number, height: number, gradient: { from: string; to: string }): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradient.from};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradient.to};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
</svg>`;
}

export function createFrameCommand(): Command {
  const cmd = new Command('frame');

  cmd
    .description('Add device frame around screenshot')
    .argument('<input>', 'Path to screenshot image')
    .option('-d, --device <device>', 'Device frame (iphone-15-pro, pixel-8, etc.)', 'iphone-15-pro')
    .option('-o, --output <path>', 'Output file path')
    .option('--list', 'List available device frames')
    .option('--shadow', 'Add drop shadow to frame')
    .option('-b, --background <color>', 'Background color', 'transparent')
    .option('--template <name>', `Marketing template (${getTemplateNames().join(', ')})`)
    .option('--badge <name>', `Add badge overlay (${getBadgeNames().join(', ')})`)
    .option('--badge-position <pos>', 'Badge position (top-left, top-right, bottom-center)', 'top-right')
    .option('--gradient <spec>', 'Gradient background behind device frame (format: from:#color,to:#color)')
    .action(async (input: string, options: {
      device: string;
      output?: string;
      list?: boolean;
      shadow?: boolean;
      background: string;
      template?: string;
      badge?: string;
      badgePosition: string;
      gradient?: string;
    }) => {
      if (options.list) {
        console.log(chalk.bold('\n📱 Available device frames:\n'));
        for (const frame of listDeviceFrames()) {
          console.log(`  ${chalk.cyan(frame.device.padEnd(20))} ${frame.name} (${frame.screenWidth}x${frame.screenHeight})`);
        }
        console.log(chalk.bold('\n🎨 Available marketing templates:\n'));
        for (const name of getTemplateNames()) {
          const tpl = getTemplate(name)!;
          console.log(`  ${chalk.cyan(name.padEnd(20))} ${tpl.description}`);
        }
        console.log(chalk.bold('\n🏷️  Available badges:\n'));
        for (const name of getBadgeNames()) {
          console.log(`  ${chalk.cyan(name)}`);
        }
        console.log('');
        return;
      }

      const spinner = ora('Adding device frame...').start();

      try {
        if (!existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const frame = getDeviceFrame(options.device);
        if (!frame) {
          spinner.fail(chalk.red(`Unknown device: ${options.device}. Use --list to see available devices.`));
          process.exit(1);
        }

        // Resolve template settings
        const template = options.template ? getTemplate(options.template) : undefined;
        if (options.template && !template) {
          spinner.fail(chalk.red(`Unknown template: ${options.template}. Available: ${getTemplateNames().join(', ')}`));
          process.exit(1);
        }

        // Resolve gradient — template gradient takes precedence unless explicitly specified
        let gradientSpec: { from: string; to: string } | undefined;
        if (options.gradient) {
          gradientSpec = parseGradientSpec(options.gradient);
        } else if (template?.gradient) {
          gradientSpec = template.gradient;
        }

        const outputPath = options.output || join(
          '.',
          `${basename(input, extname(input))}-framed${extname(input) || '.png'}`
        );

        const outputDir = dirname(outputPath);
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        // Resize screenshot to fit device screen without cropping
        const resizedScreenshot = await sharp(input)
          .resize(frame.screenWidth, frame.screenHeight, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 1 },
          })
          .toBuffer();

        // Generate device frame SVG
        const frameSvg = generateFrameSVG(frame);
        const frameSvgBuffer = Buffer.from(frameSvg);

        // Build the framed device image
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

        // If gradient background, create a larger canvas with gradient behind the device
        let finalImage: sharp.Sharp;
        if (gradientSpec) {
          const canvasWidth = Math.round(frame.width * 1.15);
          const canvasHeight = Math.round(frame.height * 1.1);
          const bgSvg = generateGradientBackgroundSvg(canvasWidth, canvasHeight, gradientSpec);
          const deviceLeft = Math.round((canvasWidth - frame.width) / 2);
          const deviceTop = Math.round((canvasHeight - frame.height) / 2);

          finalImage = sharp(Buffer.from(bgSvg))
            .resize(canvasWidth, canvasHeight)
            .composite([
              {
                input: framedDevice,
                left: deviceLeft,
                top: deviceTop,
              },
            ]);
        } else {
          finalImage = sharp(framedDevice);
        }

        // Apply badge overlay if specified
        if (options.badge) {
          const badge = getBadge(options.badge);
          if (!badge) {
            spinner.fail(chalk.red(`Unknown badge: ${options.badge}. Available: ${getBadgeNames().join(', ')}`));
            process.exit(1);
          }

          const imgMeta = await finalImage.metadata();
          const imgWidth = imgMeta.width || frame.width;
          const imgHeight = imgMeta.height || frame.height;
          const position = options.badgePosition as 'top-left' | 'top-right' | 'bottom-center';
          const badgeSvg = createBadgeSvg(badge, position, imgWidth, imgHeight);

          // We need to render to buffer first, then composite badge
          const baseBuffer = await finalImage.png().toBuffer();
          finalImage = sharp(baseBuffer).composite([
            {
              input: Buffer.from(badgeSvg),
              left: 0,
              top: 0,
            },
          ]);
        }

        await finalImage.png().toFile(outputPath);

        spinner.succeed(
          chalk.green(`Device frame added: ${chalk.cyan(frame.name)} → ${chalk.cyan(outputPath)}`)
        );

        if (template) {
          console.log(chalk.dim(`  Template: ${template.name} — ${template.description}`));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to add device frame: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
