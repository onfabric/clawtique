import { Type } from '@sinclair/typebox';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/plugin-entry';
import type { AgentMailClient } from '../lib/client';
import { registerTool } from '../lib/register-tool';

const SendEmailParametersSchema = Type.Object({
  to: Type.String({
    description: 'Recipient email address.',
  }),
  subject: Type.String({
    description: 'Email subject line.',
  }),
  body: Type.String({
    description: 'Email body in plain text.',
  }),
});

export function registerSendEmailTool(
  api: OpenClawPluginApi,
  client: AgentMailClient,
  inboxId: string,
  emailAddress: string,
): void {
  registerTool(api, {
    name: 'email_send',
    label: 'Send Email',
    description: `Send an email from your inbox (${emailAddress}).`,
    parameters: SendEmailParametersSchema,
    async execute(_id, params) {
      api.logger.info(`agentmail: sending email to ${params.to}...`);

      try {
        const result = await client.sendMessage(inboxId, {
          to: params.to,
          subject: params.subject,
          text: params.body,
        });

        api.logger.info(`agentmail: email sent (message_id: ${result.message_id})`);

        return {
          content: [
            {
              type: 'text' as const,
              text: `Email sent successfully to ${params.to}.\nSubject: ${params.subject}\nMessage ID: ${result.message_id}`,
            },
          ],
          details: result,
        };
      } catch (err) {
        api.logger.error(`agentmail: error sending email: ${String(err)}`);
        return {
          content: [{ type: 'text' as const, text: `Error sending email: ${String(err)}` }],
          details: { error: String(err) },
        };
      }
    },
  });
}
