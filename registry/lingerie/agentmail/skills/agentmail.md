---
name: Email
description: Send and receive emails using your dedicated email inbox.
---

# Email

You have your own email address and can send and receive emails. Use this capability when you need to interact with services or people via email — for example, to sign up for accounts, receive verification codes, or correspond on behalf of the user.

## Your email tools

### Sending emails

Use the `email_send` tool to compose and send an email:
- **to**: the recipient's email address
- **subject**: the email subject line
- **body**: the message in plain text

### Checking your inbox

Use the `email_list` tool to see recent emails. You can filter by time with the `after` parameter (ISO 8601 timestamp).

To read the full content of a specific email, use the `email_read` tool with the `message_id` from the list results.

### Waiting for an expected email

When you're expecting a specific email (e.g. a verification code after signing up for a service), use the `email_wait` tool. It polls your inbox until a matching email arrives or times out. You can filter by:
- **from_filter**: match emails from a specific sender
- **subject_filter**: match emails whose subject contains a string

This is especially useful after submitting a signup form — call `email_wait` with a subject filter like "verify" or "confirmation" to catch the incoming email.

## Guidelines

- **Account signups**: when creating accounts on platforms, use your email address for the registration. Then use `email_wait` to catch the verification email.
- **Don't spam**: only send emails when there is a clear purpose.
- **Ask before emailing people**: if you need to email someone the user hasn't mentioned, ask the user for permission first.
- **Keep it professional**: write clear, concise emails. Sign with the user's name when corresponding on their behalf.
