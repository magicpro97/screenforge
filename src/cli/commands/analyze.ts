import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'node:fs';
import { extractDominantColors } from '../../core/color-analyzer.js';

export function createAnalyzeCommand(): Command {
  const cmd = new Command('analyze');

  cmd
    .description('Analyze dominant colors of an image for smart background selection')
    .argument('<image>', 'Path to image file (screenshot or app capture)')
    .option('-k, --clusters <number>', 'Number of color clusters', '5')
    .option('--brand <colors...>', 'Brand colors (hex) to consider for background strategy')
    .option('--json', 'Output as JSON')
    .action(async (imagePath: string, options: { clusters: string; brand?: string[]; json?: boolean }) => {
      const spinner = ora('Analyzing image colors...').start();

      try {
        if (!existsSync(imagePath)) {
          spinner.fail(chalk.red(`Image not found: ${imagePath}`));
          process.exit(1);
        }

        const k = parseInt(options.clusters, 10);
        const result = await extractDominantColors(imagePath, k);

        spinner.succeed(chalk.green(`Analyzed ${result.width}×${result.height} image`));

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log('');
        console.log(chalk.bold('Dominant Colors:'));
        for (const color of result.colors) {
          const block = chalk.bgHex(color.hex)('  ');
          console.log(`  ${block} ${chalk.hex(color.hex)(color.hex)}  ${color.percentage}%  (R:${color.rgb.r} G:${color.rgb.g} B:${color.rgb.b})`);
        }

        console.log('');
        console.log(chalk.bold('Analysis:'));
        console.log(`  Average Luminance: ${result.avgLuminance}`);
        console.log(`  App Tone: ${result.isDark ? chalk.blue('Dark') : chalk.yellow('Light')}`);

        // Suggest background strategy
        console.log('');
        console.log(chalk.bold('Background Strategy:'));
        if (result.isDark) {
          console.log(`  ${chalk.green('→')} Dark app detected. Use ${chalk.cyan('vibrant/light gradient')} background.`);
          console.log(`  ${chalk.dim('  Avoid dark backgrounds to prevent dark-on-dark.')}`);
        } else {
          console.log(`  ${chalk.green('→')} Light app detected. Use ${chalk.cyan('dark/deep gradient')} background.`);
          console.log(`  ${chalk.dim('  Avoid light backgrounds to prevent light-on-light.')}`);
        }

        if (options.brand) {
          console.log(`  ${chalk.green('→')} Brand colors: ${options.brand.join(', ')}`);
          console.log(`  ${chalk.dim('  Use brand gradient for consistent marketing identity.')}`);
        }

        console.log('');
        console.log(chalk.dim('Tip: Use "screenforge composite --auto-bg" to auto-generate backgrounds.'));
      } catch (error) {
        spinner.fail(chalk.red(`Analysis failed: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
