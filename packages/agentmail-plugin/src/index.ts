import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { registerCli } from './cli';
import { createAgentMailClient } from './lib/client';
import { configSchema, PLUGIN_ID, parseConfig } from './lib/config';
import { registerListEmailsTool } from './tools/list-emails';
import { registerReadEmailTool } from './tools/read-email';
import { registerSendEmailTool } from './tools/send-email';
import { registerWaitForEmailTool } from './tools/wait-for-email';

export default definePluginEntry({
  id: PLUGIN_ID,
  name: 'AgentMail',
  description: 'Email send/receive via AgentMail',
  configSchema,
  register(api) {
    const cfg = parseConfig(api.pluginConfig);

    registerCli(api);

    const { apiKey, inboxId, emailAddress } = cfg;
    if (!apiKey || !inboxId) {
      api.logger.warn(
        'agentmail: apiKey and/or inboxId are not set. Run `openclaw agentmail setup` to configure the plugin.',
      );
      return;
    }

    const client = createAgentMailClient(apiKey);

    registerSendEmailTool(api, client, inboxId, emailAddress);
    registerListEmailsTool(api, client, inboxId);
    registerReadEmailTool(api, client, inboxId);
    registerWaitForEmailTool(api, client, inboxId);

    api.logger.info(`agentmail: registered tools (inbox: ${emailAddress})`);
  },
});
