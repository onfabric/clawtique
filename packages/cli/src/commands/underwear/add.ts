import { Args, Flags } from '@oclif/core';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';
import { spawn } from 'node:child_process';
import { confirm, select } from '@inquirer/prompts';
import { Listr } from 'listr2';
import type { PluginDef, UnderwearEntry } from '@clawset/core';
import { BaseCommand } from '../../base.js';
import { installUnderwear } from '../../lib/installer.js';

export default class UnderwearAdd extends BaseCommand {
  static summary = 'Add shared underwear (channel plugins, infrastructure)';

  static examples = [
    '<%= config.bin %> underwear add ./packages/underwear-waclaw',
    '<%= config.bin %> underwear add @clawset/underwear-waclaw',
  ];

  static args = {
    specifier: Args.string({
      description: 'Underwear package specifier (local path or package name)',
      required: false,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    'dry-run': Flags.boolean({
      description: 'Show what would change without applying',
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip confirmation prompts',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UnderwearAdd);
    await this.loadConfig();

    let specifier = args.specifier;

    // If no specifier, discover available underwear and prompt
    if (!specifier) {
      const state = await this.stateManager.load();
      const activeIds = new Set(Object.keys(state.underwear ?? {}));
      const available = (await this.discoverUnderwear()).filter((u) => !activeIds.has(u.id));
      if (available.length === 0) {
        this.error('No available underwear found.\nAll underwear may already be active, or provide a path: clawset underwear add ./path/to/underwear');
      }
      specifier = await select({
        message: 'Choose underwear to add',
        choices: available.map((u) => ({
          name: `${u.name} ${chalk.dim(`(${u.id})`)}`,
          value: u.path,
          description: u.description,
        })),
      });
    }

    // Load the underwear package
    this.log(`\nResolving ${chalk.cyan(specifier)}...`);
    const { underwear, packageName } = await installUnderwear(specifier);
    const resolved = underwear.resolve();

    this.log(`\n  ${chalk.bold(resolved.name)} ${chalk.dim(`v${resolved.version}`)}\n`);

    // Check if already added
    const state = await this.stateManager.load();
    if (state.underwear?.[resolved.id]) {
      this.error(`Underwear "${resolved.id}" is already active.\nRemove it first: clawset underwear remove ${resolved.id}`);
    }

    // Check which plugins need installing
    const pluginsToInstall: PluginDef[] = [];
    const pluginsPreExisting: PluginDef[] = [];
    for (const plugin of resolved.plugins) {
      if (await this.openclawDriver.pluginIsInstalled(plugin.id)) {
        pluginsPreExisting.push(plugin);
      } else {
        pluginsToInstall.push(plugin);
      }
    }

    // Show what will happen
    this.log(chalk.bold('Changes:'));
    for (const p of pluginsToInstall) {
      const setup = p.setupCommand ? 'requires setup' : '';
      this.log(`  ${chalk.green('+')} plugin: ${p.id} ${chalk.dim(`(${p.spec})`)}${setup ? ` ${chalk.dim(`[${setup}]`)}` : ''}`);
    }
    for (const p of pluginsPreExisting) {
      this.log(`  ${chalk.dim('~')} plugin: ${p.id} ${chalk.dim('(already installed — skipping)')}`);
    }
    this.log('');

    if (flags['dry-run']) {
      this.log(chalk.yellow('Dry run — no changes applied.'));
      return;
    }

    if (!flags.yes) {
      const proceed = await confirm({ message: 'Apply changes?', default: true });
      if (!proceed) {
        this.log('Aborted.');
        return;
      }
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

    await this.stateManager.lock();
    const snapshot = await this.gitManager.snapshot();

    try {
      const installedPlugins: string[] = [];

      // Install plugins
      if (pluginsToInstall.length > 0) {
        const installTask = new Listr([{
          title: 'Installing plugins',
          task: async () => {
            for (const plugin of pluginsToInstall) {
              await this.openclawDriver.pluginInstall(plugin.spec);
              installedPlugins.push(plugin.id);
            }
          },
        }], { concurrent: false });
        await installTask.run();

        // Run interactive setup commands outside Listr
        for (const plugin of pluginsToInstall) {
          if (!plugin.setupCommand) continue;
          this.log(`\n${chalk.bold(`Setting up ${plugin.id}...`)}`);
          if (plugin.setupNotes.length > 0) {
            this.log('');
            for (const note of plugin.setupNotes) {
              this.log(`  ${chalk.cyan('→')} ${note}`);
            }
          }
          this.log('');
          const [cmd, ...cmdArgs] = plugin.setupCommand.split(' ');
          await new Promise<void>((resolve, reject) => {
            const child = spawn(cmd, cmdArgs, { stdio: 'inherit' });
            child.on('close', (code: number) => {
              if (code === 0) resolve();
              else reject(new Error(`Plugin setup "${plugin.setupCommand}" exited with code ${code}`));
            });
            child.on('error', reject);
          });
        }

        // Restart gateway and wait for health
        this.log('');
        const restartTask = new Listr([{
          title: 'Restarting gateway',
          task: async () => {
            await this.openclawDriver.gatewayRestart();
            for (let i = 0; i < 10; i++) {
              await new Promise((r) => setTimeout(r, 2_000));
              const h = await this.openclawDriver.health();
              if (h.ok) return;
            }
            throw new Error('Gateway did not become healthy after restart');
          },
        }], { concurrent: false });
        await restartTask.run();
      }

      // Save state
      const entry: UnderwearEntry = {
        package: packageName,
        version: resolved.version,
        installedAt: new Date().toISOString(),
        applied: {
          plugins: resolved.plugins.map((p) => p.id),
          installedPlugins,
        },
      };
      if (!state.underwear) state.underwear = {};
      state.underwear[resolved.id] = entry;
      await this.stateManager.save(state);

      // Git commit
      const body = resolved.plugins.length > 0
        ? `plugins: ${resolved.plugins.map((p) => p.id).join(', ')}`
        : '';
      await this.gitManager.commit('feat', resolved.id, `underwear add v${resolved.version}`, body);

      this.log(`\n${chalk.green('✓')} Added underwear "${chalk.bold(resolved.name)}".`);
    } catch (err) {
      if (snapshot) await this.gitManager.rollback(snapshot);
      throw err;
    } finally {
      await this.stateManager.unlock();
    }
  }

  private async discoverUnderwear(): Promise<Array<{ id: string; name: string; description: string; path: string }>> {
    const results: Array<{ id: string; name: string; description: string; path: string }> = [];
    const packagesDir = join(process.cwd(), 'packages');
    if (!existsSync(packagesDir)) return results;

    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(packagesDir);

    for (const entry of entries) {
      if (!entry.startsWith('underwear-')) continue;
      const pkgJsonPath = join(packagesDir, entry, 'package.json');
      if (!existsSync(pkgJsonPath)) continue;

      try {
        const pkg = JSON.parse(await readFile(pkgJsonPath, 'utf-8'));
        if (pkg.clawset?.type !== 'underwear') continue;

        const uwPath = join(packagesDir, entry);
        const { underwear } = await installUnderwear(uwPath);
        const resolved = underwear.resolve();
        results.push({
          id: resolved.id,
          name: resolved.name,
          description: resolved.description ?? pkg.description ?? '',
          path: uwPath,
        });
      } catch {
        // Skip underwear that can't be loaded
      }
    }

    return results;
  }
}
