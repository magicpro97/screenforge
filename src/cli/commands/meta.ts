import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { generateMetadata, translateMetadata } from '../../core/ai.js';
import { ASOMetadata } from '../../types/index.js';

export function createMetaCommand(): Command {
  const cmd = new Command('meta');
  cmd.description('AI-powered ASO metadata generation and translation');

  cmd
    .command('generate')
    .description('Generate optimized app store metadata')
    .requiredOption('-n, --name <name>', 'App name')
    .requiredOption('-d, --description <desc>', 'Brief app description')
    .option('-c, --category <category>', 'App category')
    .option('-o, --output <file>', 'Save metadata to JSON file')
    .option('--platform <platform>', 'Target platform (appstore, playstore, both)', 'both')
    .option('--variants <count>', 'Generate multiple A/B test variants', '1')
    .action(async (options: { name: string; description: string; category?: string; output?: string; platform: string; variants: string }) => {
      const variantCount = Math.min(Math.max(parseInt(options.variants) || 1, 1), 3);

      const VARIANT_ANGLES = [
        'Focus on SOCIAL PROOF and community',
        'Focus on UNIQUE FEATURES and innovation',
        'Focus on EMOTIONAL BENEFITS and lifestyle improvement',
      ];

      const spinner = ora(`Generating ASO metadata${variantCount > 1 ? ` (${variantCount} A/B variants)` : ''} with AI...`).start();

      try {
        const variants: ASOMetadata[] = [];
        for (let i = 0; i < variantCount; i++) {
          const angle = variantCount > 1 ? VARIANT_ANGLES[i] : undefined;
          if (variantCount > 1) {
            spinner.text = `Generating variant ${i + 1}/${variantCount}${angle ? ` — ${angle}` : ''}...`;
          }
          const metadata = await generateMetadata(options.name, options.description, options.category, angle);
          variants.push(metadata);
        }

        spinner.succeed(chalk.green(`ASO metadata generated!${variantCount > 1 ? ` (${variantCount} variants)` : ''}\n`));

        for (let i = 0; i < variants.length; i++) {
          const metadata = variants[i];

          if (variantCount > 1) {
            console.log(chalk.bold.underline(`\n🔀 Variant ${i + 1}: ${VARIANT_ANGLES[i]}\n`));
          }

          console.log(chalk.bold('📱 Title:       ') + chalk.cyan(metadata.title));
          console.log(chalk.bold('📝 Subtitle:    ') + chalk.cyan(metadata.subtitle));
          console.log(chalk.bold('📖 Description: ') + chalk.dim(metadata.description.substring(0, 100) + '...'));
          console.log(chalk.bold('🔑 Keywords:    ') + chalk.yellow(metadata.keywords.join(', ')));

          if (metadata.shortDescription) {
            console.log(chalk.bold('📋 Short Desc:  ') + chalk.dim(metadata.shortDescription));
          }
          if (metadata.promotionalText) {
            console.log(chalk.bold('🎯 Promo Text:  ') + chalk.dim(metadata.promotionalText));
          }

          if (options.output) {
            const outputFile = variantCount > 1
              ? options.output.replace(/\.json$/, `-variant-${i + 1}.json`)
              : options.output;
            writeFileSync(outputFile, JSON.stringify(metadata, null, 2), 'utf-8');
            console.log(chalk.dim(`\nSaved to ${outputFile}`));
          }
        }

        console.log('');
      } catch (error) {
        spinner.fail(chalk.red(`Failed to generate metadata: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  cmd
    .command('translate')
    .description('Translate metadata to other languages')
    .requiredOption('-i, --input <file>', 'Input metadata JSON file')
    .requiredOption('-l, --locale <locale>', 'Target locale (e.g., es, fr, ja, ko, zh)')
    .option('-o, --output <file>', 'Save translated metadata to JSON file')
    .action(async (options: { input: string; locale: string; output?: string }) => {
      const spinner = ora(`Translating metadata to ${options.locale}...`).start();

      try {
        if (!existsSync(options.input)) {
          spinner.fail(chalk.red(`Input file not found: ${options.input}`));
          process.exit(1);
        }

        const metadata = JSON.parse(readFileSync(options.input, 'utf-8')) as ASOMetadata;
        const translated = await translateMetadata(metadata, options.locale);

        spinner.succeed(chalk.green(`Metadata translated to ${chalk.bold(options.locale)}!\n`));

        console.log(chalk.bold('📱 Title:       ') + chalk.cyan(translated.metadata.title));
        console.log(chalk.bold('📝 Subtitle:    ') + chalk.cyan(translated.metadata.subtitle));
        console.log(chalk.bold('🔑 Keywords:    ') + chalk.yellow(translated.metadata.keywords.join(', ')));
        console.log('');

        if (options.output) {
          writeFileSync(options.output, JSON.stringify(translated, null, 2), 'utf-8');
          console.log(chalk.dim(`Saved to ${options.output}`));
        } else {
          const defaultOutput = options.input.replace('.json', `-${options.locale}.json`);
          writeFileSync(defaultOutput, JSON.stringify(translated, null, 2), 'utf-8');
          console.log(chalk.dim(`Saved to ${defaultOutput}`));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to translate metadata: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return cmd;
}
