import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { confirm, input } from '@inquirer/prompts';
import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import type { ClawtiqueConfig, PluginDef } from '#core/index.ts';
import { clawtiqueConfigSchema } from '#core/schemas/state.ts';
import { GitManager } from '#lib/git.ts';
import { LocalOpenClawDriver } from '#lib/openclaw.ts';
import {
  type ClawtiquePaths,
  getClawtiquePaths,
  getOpenClawPaths,
  type OpenClawPaths,
} from '#lib/paths.ts';
import { StateManager } from '#lib/state.ts';

export abstract class BaseCommand extends Command {
  static override baseFlags = {
    'clawtique-dir': Flags.string({
      description: 'Path to clawtique directory',
      env: 'CLAWTIQUE_DIR',
    }),
  };

  protected clawtiquePaths!: ClawtiquePaths;
  protected openclawPaths!: OpenClawPaths;
  protected stateManager!: StateManager;
  protected gitManager!: GitManager;
  protected openclawDriver!: LocalOpenClawDriver;

  protected async loadConfig(): Promise<ClawtiqueConfig> {
    const { flags } = await this.parse(this.constructor as typeof BaseCommand);
    this.clawtiquePaths = getClawtiquePaths(flags['clawtique-dir']);

    if (!existsSync(this.clawtiquePaths.config)) {
      this.error('Clawtique is not initialized.\nRun: clawtique init');
    }

    const raw = await readFile(this.clawtiquePaths.config, 'utf-8');
    const config = clawtiqueConfigSchema.parse(JSON.parse(raw));

    this.openclawPaths = getOpenClawPaths(config.openclawDir);
    this.stateManager = new StateManager(this.clawtiquePaths);
    this.gitManager = new GitManager(this.clawtiquePaths.root);
    this.openclawDriver = new LocalOpenClawDriver({
      skillsDir: this.openclawPaths.skills,
    });

    return config;
  }

  /**
   * Run setup for a plugin: display notes, run setupCommand or interactive
   * config schema prompts. Call this after `pluginInstall`.
   *
   * @param failOnSetupError — if true, `this.error()` on non-zero exit;
   *   if false, prompt user to confirm whether setup succeeded.
   */
  protected async setupPlugin(plugin: PluginDef, failOnSetupError = false): Promise<void> {
    if (plugin.setupNotes.length > 0) {
      this.log('');
      for (const note of plugin.setupNotes) {
        this.log(`  ${chalk.cyan('→')} ${note}`);
      }
    }

    if (plugin.setupCommand) {
      this.log(`\n${chalk.bold(`Setting up ${plugin.id}...`)}\n`);
      const [cmd, ...cmdArgs] = plugin.setupCommand.split(' ');
      const exitCode = await new Promise<number>((resolve, reject) => {
        const child = spawn(cmd!, cmdArgs, { stdio: 'inherit' });
        child.on('close', (code: number) => resolve(code));
        child.on('error', reject);
      });
      if (exitCode !== 0) {
        if (failOnSetupError) {
          this.error(`Plugin setup "${plugin.setupCommand}" failed (exit code ${exitCode}).`);
        }
        const cont = await confirm({
          message: `Setup exited with code ${exitCode}. Did it complete successfully?`,
          default: true,
        });
        if (!cont) {
          throw new Error(`Plugin setup "${plugin.setupCommand}" failed (exit code ${exitCode})`);
        }
      }
    } else {
      const schema = await this.openclawDriver.pluginConfigSchema(plugin.id);
      if (schema && Object.keys(schema.properties).length > 0) {
        this.log(`\n${chalk.bold(`Configuring ${plugin.id}...`)}\n`);
        for (const [key, prop] of Object.entries(schema.properties)) {
          const isRequired = schema.required.includes(key);
          const label = prop.description || key;
          const suffix = isRequired ? '' : ' (optional)';
          const value = await input({ message: `${label}${suffix}:` });
          if (value) {
            await this.openclawDriver.configSet(`${schema.configPrefix}.${key}`, value);
          } else if (isRequired) {
            this.error(`Required config "${key}" was not provided.`);
          }
        }
      }
    }
  }
}
