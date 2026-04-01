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
    .description('Configure AgentMail — save API key and select or create an inbox')
    .action(async () => {
      console.log('\n⚙️  AgentMail Setup\n');
      console.log('Get your API key from: https://console.agentmail.to\n');

      const apiKey = await prompt('Enter your AgentMail API key (am_...): ');
      if (!apiKey) {
        console.error('\n❌ No API key provided. Setup cancelled.');
        process.exit(1);
      }

      const client = createAgentMailClient(apiKey);

      // Try to list existing inboxes — inbox-scoped keys can list but not create
      let inboxId = '';
      let emailAddress = '';

      try {
        const { items } = await client.listInboxes({ limit: 10 });

        if (items.length === 1) {
          // Single inbox — use it automatically
          inboxId = items[0]!.inbox_id;
          emailAddress = items[0]!.email;
          console.log(`\n📬 Found inbox: ${emailAddress}`);
        } else if (items.length > 1) {
          // Multiple inboxes — let user pick
          console.log('\nExisting inboxes:\n');
          for (let i = 0; i < items.length; i++) {
            console.log(`  ${i + 1}. ${items[i]!.email}`);
          }
          console.log(`  ${items.length + 1}. Create a new inbox`);

          const choice = await prompt(`\nSelect an inbox (1-${items.length + 1}): `);
          const idx = Number.parseInt(choice, 10) - 1;

          if (idx >= 0 && idx < items.length) {
            inboxId = items[idx]!.inbox_id;
            emailAddress = items[idx]!.email;
          }
          // else: fall through to create a new inbox
        }
      } catch {
        // listInboxes failed — try creating one
      }

      // Create a new inbox if none was selected
      if (!inboxId) {
        const username = await prompt('Preferred email username (leave blank for random): ');

        console.log('\nCreating inbox...');
        try {
          const inbox = await client.createInbox(username ? { username } : undefined);
          inboxId = inbox.inbox_id;
          emailAddress = inbox.email;
          console.log(`\n📬 Inbox created: ${emailAddress}`);
        } catch (err) {
          const errMsg = String(err);
          if (errMsg.includes('403')) {
            console.error(
              '\n❌ Cannot create inbox — your API key may be inbox-scoped.\n' +
                '   Use an account-level API key from https://console.agentmail.to\n',
            );
          } else {
            console.error(`\n❌ Failed to create inbox: ${errMsg}`);
          }
          process.exit(1);
        }
      }

      saveAgentMailPluginConfig(config, { apiKey, inboxId, emailAddress });

      console.log(`\n✅ AgentMail configured: ${emailAddress}`);
      console.log('Restart the OpenClaw gateway to apply changes: openclaw gateway restart\n');
    });
}

export const command = {
  register,
};
