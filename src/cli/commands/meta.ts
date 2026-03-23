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
    .action(async (options: { name: string; description: string; category?: string; output?: string; platform: string }) => {
      const spinner = ora('Generating ASO metadata with AI...').start();

      try {
        const metadata = await generateMetadata(options.name, options.description, options.category);

        spinner.succeed(chalk.green('ASO metadata generated!\n'));

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
          writeFileSync(options.output, JSON.stringify(metadata, null, 2), 'utf-8');
          console.log(chalk.dim(`\nSaved to ${options.output}`));
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
