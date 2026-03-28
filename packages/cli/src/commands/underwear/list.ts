import { Flags } from '@oclif/core';
import chalk from 'chalk';
import { BaseCommand } from '../../base.js';

export default class UnderwearList extends BaseCommand {
  static summary = 'List active underwear';

  static examples = ['<%= config.bin %> underwear list'];

  static flags = {
    ...BaseCommand.baseFlags,
    json: Flags.boolean({
      description: 'Output as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(UnderwearList);
    await this.loadConfig();

    const state = await this.stateManager.load();
    const entries = Object.entries(state.underwear ?? {});

    if (flags.json) {
      this.log(JSON.stringify(state.underwear ?? {}, null, 2));
      return;
    }

    if (entries.length === 0) {
      this.log('\nNo underwear active.');
      this.log(`Run ${chalk.cyan('clawset underwear add <specifier>')} to get started.\n`);
      return;
    }

    this.log(`\n${chalk.bold('Active Underwear')}\n`);

    for (const [id, entry] of entries) {
      this.log(
        `  ${chalk.cyan(id)} ${chalk.dim(`v${entry.version}`)} ` +
        chalk.dim(`(${entry.package})`),
      );

      if (entry.applied.plugins.length > 0) {
        this.log(`    plugins: ${entry.applied.plugins.join(', ')}`);
      }

      // Find which dresses depend on this underwear
      const dependants: string[] = [];
      for (const [dressId, dressEntry] of Object.entries(state.dresses)) {
        if ((dressEntry.applied.underwear ?? []).includes(id)) {
          dependants.push(dressId);
        }
      }
      if (dependants.length > 0) {
        this.log(`    used by: ${dependants.join(', ')}`);
      }

      this.log('');
    }

    this.log(chalk.dim(`  ${entries.length} underwear active`));
    this.log('');
  }
}
