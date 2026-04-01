export type {
  CronJson,
  DressJson,
  PluginDef,
  Requires,
  SecretDef,
  SkillJson,
  SkillParam,
  SkillTrigger,
  Weekday,
} from '#core/schemas/dress-json.ts';
export {
  cronJsonSchema,
  dressIdSchema,
  dressJsonSchema,
  pluginDefSchema,
  requiresSchema,
  secretDefSchema,
  semverSchema,
  skillJsonSchema,
  skillParamSchema,
  skillTriggerSchema,
} from '#core/schemas/dress-json.ts';
export type { LingerieJson } from '#core/schemas/lingerie-json.ts';
export {
  configEntrySchema,
  configParamSchema,
  configPropertySchema,
  configSetupSchema,
  lingerieJsonSchema,
} from '#core/schemas/lingerie-json.ts';
export type {
  PersonalityFile,
  PersonalityJson,
  ResolvedPersonality,
} from '#core/schemas/personality-json.ts';
export {
  PERSONALITY_AUTO_VARS,
  PERSONALITY_FILES,
  personalityJsonSchema,
} from '#core/schemas/personality-json.ts';
export type {
  RegistryDressEntry,
  RegistryIndex,
  RegistryLingerieEntry,
} from '#core/schemas/registry.ts';
export { registryIndexSchema } from '#core/schemas/registry.ts';
export type {
  AppliedCron,
  AppliedState,
  ClawtiqueConfig,
  DressEntry,
  LingerieApplied,
  LingerieEntry,
  PersonalityEntry,
  StateFile,
} from '#core/schemas/state.ts';
export {
  appliedCronSchema,
  appliedStateSchema,
  clawtiqueConfigSchema,
  dressEntrySchema,
  lingerieAppliedSchema,
  lingerieEntrySchema,
  personalityEntrySchema,
  stateFileSchema,
} from '#core/schemas/state.ts';

// ---------------------------------------------------------------------------
// Resolved types — intermediate representations after compilation
// These are never parsed from JSON; they're constructed in-memory
// ---------------------------------------------------------------------------

import type { PluginDef, SecretDef } from '#core/schemas/dress-json.ts';

export interface CronDef {
  id: string;
  name: string;
  schedule: string;
  skill: string;
  channel?: string;
}

export interface ResolvedDress {
  id: string;
  name: string;
  version: string;
  description: string;
  requires: {
    plugins: PluginDef[];
    skills: string[];
    dresses: Record<string, string>;
    optionalDresses: Record<string, string>;
    lingerie: string[];
  };
  secrets: Record<string, SecretDef>;
  crons: CronDef[];
  dailyMemorySection?: string;
  files: { skills: Record<string, unknown>; templates: string[] };
  workspace: string[];
}
