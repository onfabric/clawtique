---
name: Set reminder
description: Parses the user's reminder request, determines timing, and creates a cron job on OpenClaw.
---

# Set Reminder

The user wants to be reminded about something. Your job is to understand what, when, and how often — then create the appropriate cron job on OpenClaw.

## Step 1: Load user context

1. Read `~/.openclaw/workspace/USER.md` for the user's profile
2. Read today's and yesterday's daily memory for recent context
3. Determine the user's **timezone** from their profile, location, or recent activity. If you cannot determine it, ask.

## Step 2: Parse the reminder

From the user's message, extract:
- **What**: The reminder message (what they want to be reminded about)
- **When**: The date/time or schedule for the reminder
- **Recurrence**: Whether this is a one-time or recurring reminder

Examples:
- "Remind me to call the dentist tomorrow at 10am" → one-time, specific date/time
- "Remind me every Monday at 9am to submit my weekly report" → recurring, weekly
- "Remind me in 2 hours to check the oven" → one-time, relative time
- "Remind me every day at 8pm to take my vitamins" → recurring, daily

If the request is ambiguous (e.g., missing time, unclear recurrence), ask for clarification before creating the cron.

## Step 3: Build the cron command

### For recurring reminders

Use a **5-field cron expression** with the user's IANA timezone:

```
openclaw cron add \
  --name "[custom-personal-reminder] <short description>" \
  --cron "<cron-expression>" \
  --timezone "<IANA timezone>" \
  --message "<reminder message to deliver>" \
  --session isolated \
  --announce \
  --channel waclaw \
  --thinking low \
  --timeout-seconds 120 \
  --exact
```

Cron expression guide:
- `0 9 * * 1` = every Monday at 9:00
- `0 20 * * *` = every day at 20:00
- `30 8 * * 1-5` = weekdays at 8:30
- `0 9 1 * *` = 1st of every month at 9:00

### For one-time reminders

Use an **ISO 8601 timestamp** with `--at`:

```
openclaw cron add \
  --name "[custom-personal-reminder] <short description>" \
  --at "<ISO 8601 timestamp>" \
  --message "<reminder message — see below for self-removal instructions>" \
  --session isolated \
  --announce \
  --channel waclaw \
  --thinking low \
  --timeout-seconds 120 \
  --exact
```

**Critical for one-time reminders:** The `--message` must include self-removal instructions so the cron job cleans up after firing. Structure the message like this:

```
Deliver this reminder to the user: "<the actual reminder text>"

After delivering the reminder, remove this cron job by running:
1. Run `openclaw cron list --json` to find the job with name starting with "[custom-personal-reminder]" that matches this reminder
2. Run `openclaw cron rm <job-id>` with the matching job's ID

This is a one-time reminder and must be deleted after delivery.
```

## Step 4: Execute

Run the constructed `openclaw cron add` command in the shell.

## Step 5: Confirm

Tell the user their reminder has been set. Include:
- What they'll be reminded about
- When (in their local time)
- Whether it's one-time or recurring
- A note that they can ask you to list or remove reminders anytime

## Step 6: Update daily memory

In today's daily memory under **## {{memory.dailyMemorySection}}**, log:
- What reminder was created
- The schedule (human-readable)
- Whether it's one-time or recurring

## Rules

- The `--name` must always start with `[custom-personal-reminder]` — this prefix is how we identify reminders created by this dress
- The `--channel` is always `waclaw` — never ask the user which channel to use
- Always convert times to the user's timezone when building the cron expression or ISO timestamp
- For relative times ("in 2 hours"), calculate the absolute time from now
- Keep the reminder message clear and actionable — the user should immediately understand what they need to do when they receive it
