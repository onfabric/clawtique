import type { PluginDef, UnderwearDef } from './schema.js';
import { underwearDefSchema } from './schema.js';

// ---------------------------------------------------------------------------
// Underwear input — what the underwear author writes
// ---------------------------------------------------------------------------

export interface UnderwearInput {
  id: string;
  name: string;
  version: string;
  description?: string;
  plugins: PluginDef[];
}

// ---------------------------------------------------------------------------
// Underwear — the validated object stored at runtime
// ---------------------------------------------------------------------------

export interface Underwear {
  readonly _input: UnderwearInput;

  /** Resolve to a fully validated underwear definition. */
  resolve(): UnderwearDef;
}

// ---------------------------------------------------------------------------
// defineUnderwear — factory function
// ---------------------------------------------------------------------------

export function defineUnderwear(input: UnderwearInput): Underwear {
  return {
    _input: input,

    resolve(): UnderwearDef {
      return underwearDefSchema.parse({
        id: input.id,
        name: input.name,
        version: input.version,
        description: input.description ?? '',
        plugins: input.plugins,
      });
    },
  };
}
