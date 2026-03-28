// Schemas and types
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
  underwearDefSchema,
  underwearAppliedSchema,
  underwearEntrySchema,
  stateFileSchema,
  clawsetConfigSchema,
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
  UnderwearDef,
  UnderwearApplied,
  UnderwearEntry,
  StateFile,
  ClawsetConfig,
} from './schema.js';

// DRESSCODE generation
export { generateDresscode } from './dresscode.js';

// Dress definition
export { defineDress } from './define-dress.js';
export type { ParamDef, InferParams, DressInput, Dress } from './define-dress.js';

// Underwear definition
export { defineUnderwear } from './define-underwear.js';
export type { UnderwearInput, Underwear } from './define-underwear.js';

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
export type { OpenClawDriver, CronListEntry } from './driver.js';

// Re-export zod for dress authors
export { z } from 'zod';
