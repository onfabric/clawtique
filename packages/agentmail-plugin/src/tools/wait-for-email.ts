import { Type } from '@sinclair/typebox';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/plugin-entry';
import type { AgentMailClient } from '../lib/client';
import { registerTool } from '../lib/register-tool';

const DEFAULT_TIMEOUT = 120;
const DEFAULT_POLL_INTERVAL = 5;

const WaitForEmailParametersSchema = Type.Object({
  timeout_seconds: Type.Optional(
    Type.Number({
      description: 'Maximum time to wait for the email in seconds.',
      minimum: 5,
      maximum: 300,
      default: DEFAULT_TIMEOUT,
    }),
  ),
  poll_interval_seconds: Type.Optional(
    Type.Number({
      description: 'How often to check for new emails in seconds.',
      minimum: 2,
      maximum: 30,
      default: DEFAULT_POLL_INTERVAL,
    }),
  ),
  from_filter: Type.Optional(
    Type.String({
      description: 'Only match emails from this sender (substring match on the from field).',
    }),
  ),
  subject_filter: Type.Optional(
    Type.String({
      description: 'Only match emails whose subject contains this string (case-insensitive).',
    }),
  ),
});

export function registerWaitForEmailTool(
  api: OpenClawPluginApi,
  client: AgentMailClient,
  inboxId: string,
): void {
  registerTool(api, {
    name: 'email_wait',
    label: 'Wait for Email',
    description:
      'Poll the inbox until a new email arrives that matches the optional filters. ' +
      'Useful for waiting for verification codes, confirmation emails, or responses.',
    parameters: WaitForEmailParametersSchema,
    async execute(_id, params) {
      const timeout = (params.timeout_seconds || DEFAULT_TIMEOUT) * 1000;
      const interval = (params.poll_interval_seconds || DEFAULT_POLL_INTERVAL) * 1000;
      const startTime = new Date().toISOString();
      const deadline = Date.now() + timeout;

      api.logger.info(
        `agentmail: waiting for email (timeout: ${timeout / 1000}s, interval: ${interval / 1000}s)...`,
      );

      while (Date.now() < deadline) {
        try {
          const result = await client.listMessages(inboxId, {
            after: startTime,
            limit: 10,
          });

          for (const msg of result.items) {
            const fromMatch =
              !params.from_filter ||
              msg.from.toLowerCase().includes(params.from_filter.toLowerCase());
            const subjectMatch =
              !params.subject_filter ||
              msg.subject.toLowerCase().includes(params.subject_filter.toLowerCase());

            if (fromMatch && subjectMatch) {
              // Found a match — fetch full content
              const full = await client.getMessage(inboxId, msg.message_id);
              const body = full.extracted_text ?? full.text ?? full.html ?? '(no content)';

              api.logger.info(`agentmail: found matching email from ${msg.from}: ${msg.subject}`);

              return {
                content: [
                  {
                    type: 'text' as const,
                    text: [
                      `Email received!`,
                      `From: ${full.from}`,
                      `Subject: ${full.subject}`,
                      `Date: ${new Date(full.timestamp).toLocaleString()}`,
                      `Message ID: ${full.message_id}`,
                      '',
                      body,
                    ].join('\n'),
                  },
                ],
                details: full,
              };
            }
          }
        } catch (err) {
          api.logger.warn(`agentmail: poll error: ${String(err)}`);
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      api.logger.warn('agentmail: timed out waiting for email');

      return {
        content: [
          {
            type: 'text' as const,
            text: `Timed out after ${timeout / 1000} seconds waiting for an email${params.from_filter ? ` from "${params.from_filter}"` : ''}${params.subject_filter ? ` with subject containing "${params.subject_filter}"` : ''}.`,
          },
        ],
        details: { timed_out: true },
      };
    },
  });
}
