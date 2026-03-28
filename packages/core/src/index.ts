// Old schemas (still used by merge.ts, dresscode.ts, state.ts, openclaw.ts)
export {
  dressIdSchema,
  cronExpressionSchema,
  semverSchema,
  paramDefSchema,
  secretDefSchema,
  cronDefSchema,
  pluginDefSchema,
  memoryContractSchema,
  requiresSchema,
  dressFilesSchema,
  resolvedDressSchema,
  appliedCronSchema,
  appliedStateSchema,
  dressEntrySchema,
  lingerieDefSchema,
  lingerieAppliedSchema,
  lingerieEntrySchema,
  stateFileSchema,
  clawtiqueConfigSchema,
} from './schema.js';

export type {
  DressId,
  CronDef,
  PluginDef,
  MemoryContract,
  Requires,
  SecretDef,
  DressFiles,
  ResolvedDress,
  AppliedCron,
  AppliedState,
  DressEntry,
  LingerieDef,
  LingerieApplied,
  LingerieEntry,
  StateFile,
  ClawtiqueConfig,
} from './schema.js';

// DRESSCODE generation
export { generateDresscode } from './dresscode.js';

// Merge and diff
export { mergeDresses, diffState } from './merge.js';
export type { MergeConflict, DesiredState, StateDiff } from './merge.js';

// Dependency graph
export { DependencyGraph } from './graph.js';

// Memory utilities
export {
  wrapSection,
  extractSections,
  stripMarkers,
  removeSection,
  findDressMarkers,
  buildMemoryScaffold,
} from './memory.js';

// Cron utilities
export { cronFromTime, addHours } from './cron-utils.js';

// Driver interface
export type { OpenClawDriver, CronListEntry, PluginConfigSchema } from './driver.js';

// New JSON-based schemas
export {
  dressJsonSchema,
  cronJsonSchema,
  skillJsonSchema,
  skillParamSchema,
  lingerieJsonSchema,
  registryIndexSchema,
} from './schemas/index.js';

export type {
  DressJson,
  CronJson,
  SkillJson,
  SkillParam,
  Weekday,
  LingerieJson,
  RegistryIndex,
  RegistryDressEntry,
  RegistryLingerieEntry,
  DressEntry as DressEntryV2,
  LingerieEntry as LingerieEntryV2,
  StateFile as StateFileV2,
  ClawtiqueConfig as ClawtiqueConfigV2,
} from './schemas/index.js';
