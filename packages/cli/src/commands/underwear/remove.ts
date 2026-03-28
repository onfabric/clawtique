import { Args, Flags } from '@oclif/core';
import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import { Listr } from 'listr2';
import type { StateFile } from '@clawset/core';
import { BaseCommand } from '../../base.js';

export default class UnderwearRemove extends BaseCommand {
  static summary = 'Remove shared underwear (uninstalls plugins if no dress depends on it)';

  static examples = [
    '<%= config.bin %> underwear remove waclaw',
    '<%= config.bin %> underwear remove waclaw --dry-run',
  ];

  static args = {
    id: Args.string({
      description: 'Underwear ID to remove',
      required: false,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    'dry-run': Flags.boolean({
      description: 'Show what would change without applying',
      default: false,
    }),
    force: Flags.boolean({
      description: 'Skip dependency checks',
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip confirmation',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UnderwearRemove);
    await this.loadConfig();

    const state = await this.stateManager.load();
    const underwearEntries = Object.entries(state.underwear ?? {});

    let underwearId = args.id;

    // Interactive picker if no ID given
    if (!underwearId) {
      if (underwearEntries.length === 0) {
        this.error('No active underwear to remove.\nRun "clawset underwear list" to check.');
      }
      underwearId = await select({
        message: 'Choose underwear to remove',
        choices: underwearEntries.map(([id, entry]) => ({
          name: `${id} ${chalk.dim(`v${entry.version}`)}`,
          value: id,
        })),
      });
    }

    const entry = state.underwear?.[underwearId];
    if (!entry) {
      this.error(`Underwear "${underwearId}" is not active.\nRun "clawset underwear list" to see active underwear.`);
    }

    // Check for dependant dresses
    const dependants = this.findDependantDresses(state, underwearId);
    if (dependants.length > 0 && !flags.force) {
      this.log(chalk.yellow(`\nWarning: The following dresses depend on underwear "${underwearId}":`));
      for (const dep of dependants) {
        this.log(`  - ${dep}`);
      }
      this.log('');
      this.error(`Undress dependants first, or use --force.`);
    }

    // Determine what to remove
    const installedPluginSet = new Set(entry.applied.installedPlugins ?? []);
    const pluginsToRemove = entry.applied.plugins.filter((p) => installedPluginSet.has(p));
    const pluginsRetained = entry.applied.plugins.filter((p) => !installedPluginSet.has(p));

    // Show what will happen
    this.log(chalk.bold(`\nRemoving underwear "${underwearId}":\n`));

    for (const p of pluginsToRemove) {
      this.log(`  ${chalk.red('-')} plugin: ${p}`);
    }
    for (const p of pluginsRetained) {
      this.log(`  ${chalk.dim('~')} plugin: ${p} ${chalk.dim('(not installed by clawset — retained)')}`);
    }
    this.log('');

    if (flags['dry-run']) {
      this.log(chalk.yellow('Dry run — no changes applied.'));
      return;
    }

    // Verify openclaw is reachable
    const health = await this.openclawDriver.health();
    if (!health.ok) {
      this.error(
        `OpenClaw is not reachable.\n\n` +
        `  ${health.message || 'Could not connect to openclaw CLI.'}\n\n` +
        `Make sure openclaw is installed and accessible, then try again.`,
      );
    }

    if (!flags.yes) {
      const proceed = await confirm({ message: 'Proceed?', default: true });
      if (!proceed) {
        this.log('Aborted.');
        return;
      }
    }

    await this.stateManager.lock();
    const snapshot = await this.gitManager.snapshot();

    try {
      const tasks = new Listr([
        {
          title: 'Removing plugins',
          skip: () => pluginsToRemove.length === 0,
          task: async () => {
            for (const plugin of pluginsToRemove) {
              try {
                await this.openclawDriver.pluginUninstall(plugin);
              } catch {
                // Plugin may have been manually removed
              }
            }
          },
        },
        {
          title: 'Restarting gateway',
          skip: () => pluginsToRemove.length === 0,
          task: async () => {
            await this.openclawDriver.gatewayRestart();
          },
        },
        {
          title: 'Saving state',
          task: async () => {
            delete state.underwear[underwearId];
            await this.stateManager.save(state);
          },
        },
      ], { concurrent: false });

      await tasks.run();

      const body = [
        pluginsToRemove.length > 0 ? `removed plugins: ${pluginsToRemove.join(', ')}` : '',
        pluginsRetained.length > 0 ? `retained plugins: ${pluginsRetained.join(', ')}` : '',
      ].filter(Boolean).join('\n');

      await this.gitManager.commit('revert', underwearId, 'underwear remove', body);

      this.log(`\n${chalk.green('✓')} Removed underwear "${underwearId}".`);
    } catch (err) {
      if (snapshot) await this.gitManager.rollback(snapshot);
      throw err;
    } finally {
      await this.stateManager.unlock();
    }
  }

  private findDependantDresses(state: StateFile, underwearId: string): string[] {
    const dependants: string[] = [];
    for (const [dressId, entry] of Object.entries(state.dresses)) {
      if ((entry.applied.underwear ?? []).includes(underwearId)) {
        dependants.push(dressId);
      }
    }
    return dependants;
  }
}
