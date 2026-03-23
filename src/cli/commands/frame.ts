import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { join, basename, extname, dirname } from 'node:path';
import { getDeviceFrame, listDeviceFrames, generateFrameSVG } from '../../core/frames.js';

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
    .action(async (input: string, options: { device: string; output?: string; list?: boolean; shadow?: boolean; background: string }) => {
      if (options.list) {
        console.log(chalk.bold('\n📱 Available device frames:\n'));
        for (const frame of listDeviceFrames()) {
          console.log(`  ${chalk.cyan(frame.device.padEnd(20))} ${frame.name} (${frame.screenWidth}x${frame.screenHeight})`);
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

        const outputPath = options.output || join(
          '.',
          `${basename(input, extname(input))}-framed${extname(input) || '.png'}`
        );

        const outputDir = dirname(outputPath);
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        // Resize screenshot to fit device screen
        const resizedScreenshot = await sharp(input)
          .resize(frame.screenWidth, frame.screenHeight, {
            fit: 'cover',
          })
          .toBuffer();

        // Generate device frame SVG
        const frameSvg = generateFrameSVG(frame);
        const frameSvgBuffer = Buffer.from(frameSvg);

        // Composite: frame + screenshot
        await sharp(frameSvgBuffer)
          .resize(frame.width, frame.height)
          .composite([
            {
              input: resizedScreenshot,
              left: frame.screenX,
              top: frame.screenY,
            },
          ])
          .png()
          .toFile(outputPath);

        spinner.succeed(
          chalk.green(`Device frame added: ${chalk.cyan(frame.name)} → ${chalk.cyan(outputPath)}`)
        );
      } catch (error) {
        spinner.fail(chalk.red(`Failed to add device frame: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
