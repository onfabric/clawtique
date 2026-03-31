import * as readline from 'node:readline';
import { createAgentMailClient } from '../../lib/client';
import { saveAgentMailPluginConfig } from '../../lib/config';
import type { CommandCtx } from '../types';

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(question, resolve);
  });

  rl.close();
  return answer.trim();
}

function register({ cmd, config }: CommandCtx) {
  cmd
    .command('setup')
    .description('Configure AgentMail — creates an email inbox for this agent')
    .action(async () => {
      console.log('\n⚙️  AgentMail Setup\n');
      console.log('Get your API key from: https://console.agentmail.to\n');

      const apiKey = await prompt('Enter your AgentMail API key (am_...): ');
      if (!apiKey) {
        console.error('\n❌ No API key provided. Setup cancelled.');
        return;
      }

      const username = await prompt('Preferred email username (leave blank for random): ');

      console.log('\nCreating inbox...');

      try {
        const client = createAgentMailClient(apiKey);
        const inbox = await client.createInbox(username ? { username } : undefined);

        console.log(`\n✅ Inbox created: ${inbox.email}`);
        console.log(`   Inbox ID: ${inbox.inbox_id}\n`);

        saveAgentMailPluginConfig(config, {
          apiKey,
          inboxId: inbox.inbox_id,
          emailAddress: inbox.email,
        });

        console.log('Configuration saved to ~/.openclaw/openclaw.json');
        console.log('Restart the OpenClaw gateway to apply changes: openclaw gateway restart\n');
      } catch (err) {
        console.error(`\n❌ Failed to create inbox: ${String(err)}`);
        console.error('Check your API key and try again.\n');
      }
    });
}

export const command = {
  register,
};
