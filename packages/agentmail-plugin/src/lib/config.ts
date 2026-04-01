import type { OpenClawConfig, OpenClawPluginConfigSchema } from 'openclaw/plugin-sdk';

export const PLUGIN_ID = 'agentmail';

type AgentMailPluginConfig = {
  apiKey: string;
  inboxId: string;
  emailAddress: string;
};

export function parseConfig(raw: unknown): AgentMailPluginConfig {
  const cfg =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  return {
    apiKey: cfg.apiKey as string,
    inboxId: cfg.inboxId as string,
    emailAddress: cfg.emailAddress as string,
  };
}

export const configSchema: OpenClawPluginConfigSchema = {
  jsonSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      apiKey: { type: 'string' },
      inboxId: { type: 'string' },
      emailAddress: { type: 'string' },
    },
  },
  parse: parseConfig,
};

export function saveAgentMailPluginConfig(
  config: OpenClawConfig,
  pluginConfig: AgentMailPluginConfig,
): void {
  config.plugins = config.plugins || {};
  config.plugins.entries = config.plugins.entries || {};

  config.plugins.entries[PLUGIN_ID] = {
    enabled: true,
    config: pluginConfig,
  };

  saveOpenClawConfig(config);
}

function saveOpenClawConfig(config: OpenClawConfig): void {
  const fs = require('node:fs') as typeof import('node:fs');
  const os = require('node:os') as typeof import('node:os');
  const path = require('node:path') as typeof import('node:path');

  const configDir = path.join(os.homedir(), '.openclaw');
  fs.mkdirSync(configDir, { recursive: true });

  const configPath = path.join(configDir, 'openclaw.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
