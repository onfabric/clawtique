import { Args, Flags } from '@oclif/core';
import chalk from 'chalk';
import { BaseCommand } from '#base.ts';
import type { DressJson } from '#core/index.ts';
import { buildAutoVars, injectVars } from '#lib/compile.ts';
import { createRegistryProvider } from '#lib/registry.ts';

export default class Params extends BaseCommand {
  static override summary = 'View or update params for an active dress';

  static override examples = [
    '<%= config.bin %> params fitness-coach',
    '<%= config.bin %> params tech-bro-digest --set tech-bro-digest.sources="Hacker News, Reddit"',
  ];

  static override args = {
    id: Args.string({
      description: 'Dress ID',
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    set: Flags.string({
      description: 'Set a param (skill.key=value)',
      multiple: true,
    }),
    json: Flags.boolean({
      description: 'Output as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Params);
    await this.loadConfig();

    const state = await this.stateManager.load();
    const entry = this.stateManager.getDressEntry(state, args.id);

    if (!entry) {
      this.error(`Dress "${args.id}" is not active.`);
    }

    // View mode
    if (!flags.set || flags.set.length === 0) {
      if (flags.json) {
        this.log(JSON.stringify(entry.params, null, 2));
        return;
      }

      const paramEntries = Object.entries(entry.params);
      if (paramEntries.length === 0) {
        this.log(`\nDress "${args.id}" has no params.\n`);
        return;
      }

      // Try to fetch dress metadata for richer display
      let dress: DressJson | undefined;
      try {
        const registry = createRegistryProvider(process.cwd(), this.clawtiquePaths.cache);
        dress = await registry.getDressJson(args.id);
      } catch {
        // Fall back to raw display if registry unavailable
      }

      this.log(`\n${chalk.bold(args.id)} params:\n`);
      for (const [skillId, skillParams] of paramEntries) {
        const paramValues = Object.entries(skillParams as Record<string, unknown>);
        if (paramValues.length === 0) continue;
        const skillMeta = dress?.skills[skillId];
        if (skillMeta) {
          this.log(`  ${chalk.bold(skillMeta.name)} ${chalk.dim(`(${skillId})`)}`);
          this.log(`  ${chalk.dim(skillMeta.description)}`);
        } else {
          this.log(`  ${chalk.dim(skillId)}:`);
        }
        for (const [key, value] of paramValues) {
          const paramMeta = skillMeta?.params[key];
          const meta = paramMeta
            ? ` ${chalk.dim(`(${paramMeta.type}, default: ${JSON.stringify(paramMeta.default)})`)}`
            : '';
          this.log(`    ${key}: ${chalk.yellow(JSON.stringify(value))}${meta}`);
          if (paramMeta?.description) {
            this.log(`      ${chalk.dim(paramMeta.description)}`);
          }
        }
        this.log('');
      }
      return;
    }

    // Update mode — params are namespaced by skill: "skill.paramName=value"
    const updates: Record<string, Record<string, unknown>> = {};
    for (const s of flags.set) {
      const eqIdx = s.indexOf('=');
      if (eqIdx === -1) {
        this.error(`Invalid param format: "${s}". Use skill.key=value.`);
      }
      const fullKey = s.slice(0, eqIdx);
      const rawValue = s.slice(eqIdx + 1);
      const dotIdx = fullKey.indexOf('.');
      if (dotIdx === -1) {
        this.error(
          `Invalid param key: "${fullKey}". Use skill.key format (e.g. tech-bro-digest.sources).`,
        );
      }
      const skillId = fullKey.slice(0, dotIdx);
      const paramKey = fullKey.slice(dotIdx + 1);

      let value: unknown;
      try {
        value = JSON.parse(rawValue);
      } catch {
        if (rawValue.includes(',')) {
          value = rawValue.split(',').map((s) => s.trim());
        } else {
          value = rawValue;
        }
      }

      if (!updates[skillId]) updates[skillId] = {};
      updates[skillId][paramKey] = value;
    }

    // Show diff
    this.log(chalk.bold('\nParam changes:\n'));
    for (const [skillId, skillUpdates] of Object.entries(updates)) {
      for (const [key, newVal] of Object.entries(skillUpdates)) {
        const oldParams = (entry.params[skillId] ?? {}) as Record<string, unknown>;
        const oldVal = oldParams[key];
        this.log(
          `  ${chalk.yellow('~')} ${skillId}.${key}: ${chalk.red(JSON.stringify(oldVal))} → ${chalk.green(JSON.stringify(newVal))}`,
        );
      }
    }
    this.log('');

    // Apply
    await this.stateManager.lock();
    try {
      // Merge updates into state
      for (const [skillId, skillUpdates] of Object.entries(updates)) {
        const existing = (entry.params[skillId] ?? {}) as Record<string, unknown>;
        entry.params[skillId] = { ...existing, ...skillUpdates };
      }
      state.dresses[args.id] = entry;
      await this.stateManager.save(state);

      // Re-compile affected bundled skills with new params
      let recompiled = false;
      try {
        const registry = createRegistryProvider(process.cwd(), this.clawtiquePaths.cache);
        const dress = await registry.getDressJson(args.id);
        const autoVars = buildAutoVars(dress);
        const affectedSkillIds = Object.keys(updates);

        for (const skillId of affectedSkillIds) {
          const skillDef = dress.skills[skillId];
          if (!skillDef || skillDef.source === 'clawhub') continue;

          const rawContent = await registry.getSkillContent(args.id, skillId);
          const mergedParams = (entry.params[skillId] ?? {}) as Record<string, unknown>;
          const injectionVars: Record<string, string> = {
            ...autoVars,
            'skill.name': skillDef.name,
            'skill.description': skillDef.description,
          };
          for (const [key, value] of Object.entries(mergedParams)) {
            injectionVars[key] = Array.isArray(value) ? value.join(', ') : String(value);
          }

          const compiled = injectVars(rawContent, injectionVars);
          const unresolved = compiled.match(/\{\{[^}]+\}\}/g);
          if (unresolved) {
            this.warn(
              `Unresolved placeholders in skill "${skillId}": ${[...new Set(unresolved)].join(', ')}`,
            );
          }
          await this.openclawDriver.skillCopyBundled(skillId, compiled);
        }
        recompiled = true;
      } catch (err) {
        this.warn(
          'Could not re-compile skills (registry unavailable?).\n' +
            '  To apply, run: clawtique undress ' +
            args.id +
            ' && clawtique dress ' +
            args.id,
        );
      }

      const changedKeys = Object.entries(updates)
        .flatMap(([s, p]) => Object.keys(p).map((k) => `${s}.${k}`))
        .join(', ');
      await this.gitManager.commit('refactor', args.id, `update params: ${changedKeys}`);

      if (recompiled) {
        this.log(`${chalk.green('✓')} Params updated and skills re-compiled.`);
      } else {
        this.log(`${chalk.green('✓')} Params updated.`);
      }
    } finally {
      await this.stateManager.unlock();
    }
  }
}
