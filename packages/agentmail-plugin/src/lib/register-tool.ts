import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { TSchema } from '@sinclair/typebox';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';

/**
 * Type-safe version of `api.registerTool` that ensures the `execute` function gets the correct parameter types.
 */
export function registerTool<TParameters extends TSchema = TSchema>(
  api: OpenClawPluginApi,
  tool: AgentTool<TParameters, unknown>,
): void {
  api.registerTool(tool);
}
