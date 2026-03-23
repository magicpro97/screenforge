import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, setConfigValue, getConfigPath } from '../../core/config.js';

export function createConfigCommand(): Command {
  const cmd = new Command('config');
  cmd.description('Configure ScreenForge settings');

  cmd
    .command('set')
    .description('Set a configuration value')
    .argument('<key>', 'Config key (aiProvider, apiKey, defaultOutput, defaultPlatform)')
    .argument('<value>', 'Config value')
    .action(async (key: string, value: string) => {
      const validKeys = ['aiProvider', 'apiKey', 'defaultOutput', 'defaultPlatform'];

      if (!validKeys.includes(key)) {
        console.log(chalk.red(`Unknown config key: ${key}`));
        console.log(chalk.dim(`Valid keys: ${validKeys.join(', ')}`));
        process.exit(1);
      }

      if (key === 'aiProvider' && !['gemini', 'openai'].includes(value)) {
        console.log(chalk.red(`Invalid AI provider: ${value}. Use "gemini" or "openai".`));
        process.exit(1);
      }

      await setConfigValue(key, value);
      console.log(chalk.green(`✅ Set ${chalk.bold(key)} = ${key === 'apiKey' ? chalk.dim('****' + value.slice(-4)) : chalk.cyan(value)}`));
    });

  cmd
    .command('list')
    .description('Show current configuration')
    .action(async () => {
      const config = await loadConfig();
      const entries = Object.entries(config);

      console.log(chalk.bold('\n⚙️  ScreenForge Configuration\n'));
      console.log(chalk.dim(`Config file: ${getConfigPath()}\n`));

      if (entries.length === 0) {
        console.log(chalk.dim('  No configuration set. Use "screenforge config set <key> <value>" to configure.'));
      } else {
        for (const [key, value] of entries) {
          const displayValue = key === 'apiKey'
            ? chalk.dim('****' + String(value).slice(-4))
            : chalk.cyan(String(value));
          console.log(`  ${chalk.bold(key.padEnd(20))} ${displayValue}`);
        }
      }

      console.log('');
      console.log(chalk.dim('Available keys: aiProvider, apiKey, defaultOutput, defaultPlatform'));
      console.log('');
    });

  return cmd;
}
