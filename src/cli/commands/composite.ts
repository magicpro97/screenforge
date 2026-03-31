import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import sharp from 'sharp';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { parse } from 'yaml';
import { getDeviceFrame, generateFrameSVG } from '../../core/frames.js';
import { DeviceFrame } from '../../types/index.js';
import { extractDominantColors } from '../../core/color-analyzer.js';
import { generateSmartBackground } from '../../core/bg-generator.js';

// --- YAML config types ---

interface CompositeHeadline {
  [locale: string]: string;
}

interface CompositeItem {
  screenshot: string;
  background?: string; // optional when auto_background is true
  headline: CompositeHeadline;
  output: string;
}

interface CompositeDefaults {
  background_dir?: string;
  frame_scale: number;
  text_color: string;
  font_size: number;
  auto_background?: boolean;
  min_contrast_ratio?: number;
}

interface CompositePlatform {
  device: string;
  size: string;
  items: CompositeItem[];
}

interface CompositeConfig {
  brand: {
    name: string;
    colors: {
      primary: string;
      dark?: string;
      accent?: string;
      [key: string]: string | undefined;
    };
  };
  screenshots: {
    defaults: CompositeDefaults;
    [platform: string]: CompositePlatform | CompositeDefaults;
  };
  locales: string[];
  output_dir: string;
}

function parseSize(size: string): { width: number; height: number } {
  const [w, h] = size.split('x').map(Number);
  return { width: w, height: h };
}

function generateHeadlineSVG(
  text: string,
  canvasWidth: number,
  canvasHeight: number,
  options: { color: string; fontSize: number },
): string {
  const lines = text.split('\n');
  const lineHeight = options.fontSize * 1.3;
  const totalTextHeight = lines.length * lineHeight;
  const startY = canvasHeight * 0.05 + options.fontSize;

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const tspans = lines
    .map((line, i) => {
      const y = Math.round(startY + i * lineHeight);
      return `    <tspan x="${Math.round(canvasWidth / 2)}" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
  <style>
    .headline {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: ${options.fontSize}px;
      font-weight: 700;
      fill: ${options.color};
      text-anchor: middle;
      dominant-baseline: auto;
    }
  </style>
  <text class="headline">
${tspans}
  </text>
</svg>`;
}

async function frameScreenshot(
  screenshotPath: string,
  frame: DeviceFrame,
): Promise<Buffer> {
  const resizedScreenshot = await sharp(screenshotPath)
    .resize(frame.screenWidth, frame.screenHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .toBuffer();

  const frameSvg = generateFrameSVG(frame);
  const frameSvgBuffer = Buffer.from(frameSvg);

  return sharp(frameSvgBuffer)
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
}

export function createCompositeCommand(): Command {
  const cmd = new Command('composite');

  cmd
    .description('Compose marketing screenshots (background + device frame + headline text)')
    .argument('<config>', 'Path to YAML config file')
    .option('--dry-run', 'Show what would be generated without processing')
    .option('-o, --output <dir>', 'Override output directory')
    .option('--auto-bg', 'Auto-generate backgrounds based on screenshot colors')
    .action(async (configPath: string, options: { dryRun?: boolean; output?: string; autoBg?: boolean }) => {
      const spinner = ora('Reading composite config...').start();

      try {
        if (!existsSync(configPath)) {
          spinner.fail(chalk.red(`Config file not found: ${configPath}`));
          process.exit(1);
        }

        const configDir = dirname(resolve(configPath));
        const raw = readFileSync(configPath, 'utf-8');
        const config = parse(raw) as CompositeConfig;

        const defaults = config.screenshots.defaults;
        const locales = config.locales || ['en'];
        const outputBase = options.output || config.output_dir || './marketing';

        // Discover platforms (keys in screenshots that are not 'defaults')
        const platformKeys = Object.keys(config.screenshots).filter(k => k !== 'defaults');

        // Collect all jobs
        const jobs: Array<{
          locale: string;
          platform: string;
          item: CompositeItem;
          device: string;
          size: { width: number; height: number };
        }> = [];

        for (const platform of platformKeys) {
          const platConfig = config.screenshots[platform] as CompositePlatform;
          if (!platConfig.items || !platConfig.device || !platConfig.size) continue;

          const size = parseSize(platConfig.size);
          for (const item of platConfig.items) {
            for (const locale of locales) {
              if (!item.headline[locale]) continue;
              jobs.push({ locale, platform, item, device: platConfig.device, size });
            }
          }
        }

        spinner.succeed(chalk.green(`Composite config loaded — ${jobs.length} screenshot(s) to generate`));
        console.log('');

        // Summary
        console.log(chalk.bold('Plan:'));
        for (const platform of platformKeys) {
          const platConfig = config.screenshots[platform] as CompositePlatform;
          if (!platConfig.items) continue;
          console.log(`  📱 ${chalk.cyan(platform)}: ${platConfig.items.length} item(s) × ${locales.length} locale(s) → ${platConfig.device}`);
        }
        console.log(`  🌍 Locales: ${locales.join(', ')}`);
        console.log(`  📁 Output: ${outputBase}`);
        console.log('');

        if (options.dryRun) {
          console.log(chalk.bold('Files that would be generated:'));
          for (const job of jobs) {
            const outDir = join(outputBase, job.locale, job.platform);
            const outFile = join(outDir, `screenshot_${job.item.output}.png`);
            console.log(`  ${chalk.dim(outFile)}`);
          }
          console.log('');
          console.log(chalk.dim('Dry run complete. No files were processed.'));
          return;
        }

        // Process each job
        let completed = 0;
        for (const job of jobs) {
          const label = `[${job.locale}/${job.platform}] ${job.item.output}`;
          const jobSpinner = ora(`Compositing ${label}...`).start();

          try {
            const { width: canvasWidth, height: canvasHeight } = job.size;

            // 1. Resolve paths relative to config file
            const screenshotPath = resolve(configDir, job.item.screenshot);

            if (!existsSync(screenshotPath)) {
              jobSpinner.fail(chalk.red(`Screenshot not found: ${screenshotPath}`));
              continue;
            }

            // 2. Create canvas with background
            let background: Buffer;
            const useAutoBg = options.autoBg || defaults.auto_background;

            if (useAutoBg && !job.item.background) {
              // Auto-generate background from screenshot colors
              const colorAnalysis = await extractDominantColors(screenshotPath);
              const brandColorList = config.brand?.colors
                ? Object.values(config.brand.colors).filter((c): c is string => typeof c === 'string')
                : undefined;

              const smartBg = await generateSmartBackground(
                colorAnalysis,
                canvasWidth,
                canvasHeight,
                brandColorList,
              );
              background = smartBg.buffer;

              // Auto text color if set to 'auto'
              if (defaults.text_color === 'auto') {
                defaults.text_color = smartBg.textColor;
              }
            } else {
              // Use specified background file
              const bgDir = defaults.background_dir ? resolve(configDir, defaults.background_dir) : configDir;
              const bgFile = job.item.background || '';
              const bgPath = resolve(bgDir, bgFile);

              if (!existsSync(bgPath)) {
                jobSpinner.fail(chalk.red(`Background not found: ${bgPath}. Use --auto-bg or specify a background.`));
                continue;
              }
              background = await sharp(bgPath)
                .resize(canvasWidth, canvasHeight, { fit: 'cover' })
                .png()
                .toBuffer();
            }

            // 3. Frame the screenshot
            const frame = getDeviceFrame(job.device);
            if (!frame) {
              jobSpinner.fail(chalk.red(`Unknown device: ${job.device}`));
              continue;
            }

            const framedBuffer = await frameScreenshot(screenshotPath, frame);

            // 4. Scale framed device to frame_scale of canvas width
            const frameScale = defaults.frame_scale || 0.7;
            const scaledWidth = Math.round(canvasWidth * frameScale);
            const scaledFramed = await sharp(framedBuffer)
              .resize(scaledWidth, null, { fit: 'inside' })
              .png()
              .toBuffer();

            const scaledMeta = await sharp(scaledFramed).metadata();
            const scaledHeight = scaledMeta.height || Math.round(canvasHeight * frameScale);

            // 5. Generate headline SVG
            const headlineText = job.item.headline[job.locale];
            const fontSize = defaults.font_size || 56;
            const textColor = defaults.text_color || '#FFFFFF';
            const headlineSvg = generateHeadlineSVG(headlineText, canvasWidth, canvasHeight, {
              color: textColor,
              fontSize,
            });

            // 6. Position: text at top (5%), framed device centered below
            const headlineLines = headlineText.split('\n').length;
            const textBlockHeight = canvasHeight * 0.05 + headlineLines * fontSize * 1.3 + fontSize * 0.5;
            const deviceTop = Math.round(textBlockHeight);
            const deviceLeft = Math.round((canvasWidth - scaledWidth) / 2);

            // Clamp device position to stay within canvas
            const clampedTop = Math.min(deviceTop, canvasHeight - scaledHeight);

            // 7. Composite everything
            const result = sharp(background)
              .composite([
                {
                  input: scaledFramed,
                  left: deviceLeft,
                  top: Math.max(0, clampedTop),
                },
                {
                  input: Buffer.from(headlineSvg),
                  left: 0,
                  top: 0,
                },
              ]);

            // 8. Save
            const outDir = join(outputBase, job.locale, job.platform);
            if (!existsSync(outDir)) {
              mkdirSync(outDir, { recursive: true });
            }
            const outFile = join(outDir, `screenshot_${job.item.output}.png`);
            await result.png().toFile(outFile);

            completed++;
            jobSpinner.succeed(chalk.green(`${label} → ${chalk.cyan(outFile)}`));
          } catch (error) {
            jobSpinner.fail(chalk.red(`${label} failed: ${(error as Error).message}`));
          }
        }

        console.log(chalk.bold.green(`\n✨ Composite complete: ${completed}/${jobs.length} screenshot(s) generated\n`));
      } catch (error) {
        spinner.fail(chalk.red(`Composite failed: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
