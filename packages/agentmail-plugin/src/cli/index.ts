import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { command as setupCommand } from './commands/setup';

const CLI_ROOT_COMMAND = 'agentmail';

export function registerCli(api: OpenClawPluginApi) {
  api.registerCli(
    ({ program, config, workspaceDir }) => {
      const cmd = program.command(CLI_ROOT_COMMAND).description('AgentMail CLI commands');

      setupCommand.register({ cmd, config, workspaceDir });

      api.logger.info('agentmail: registered cli commands');
    },
    { commands: [CLI_ROOT_COMMAND] },
  );
}
