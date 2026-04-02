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

## Step 3: Create the cron

### For recurring reminders

```
openclaw cron add \
  --name "[custom-personal-reminder] <short description>" \
  --cron "<cron-expression>" \
  --tz "<IANA timezone>" \
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

Note: `--exact` disables stagger and is only valid with `--cron`, never with `--at`.

### For one-time reminders

Use either a **relative duration** or an **ISO 8601 timestamp** with `--at`:

```
openclaw cron add \
  --name "[custom-personal-reminder] <short description>" \
  --at "<duration or ISO timestamp>" \
  --tz "<IANA timezone>" \
  --message "<reminder message to deliver>" \
  --session isolated \
  --announce \
  --channel waclaw \
  --thinking low \
  --timeout-seconds 120 \
  --delete-after-run
```

For `--at`, accepted formats:
- Relative duration: `10m`, `2h`, `1h30m` (no `+` prefix)
- ISO 8601 without offset: `2026-04-03T10:00:00` (requires `--tz` to interpret)
- ISO 8601 with offset: `2026-04-03T10:00:00+02:00` (self-contained)

The `--delete-after-run` flag ensures the job is automatically cleaned up after it fires. Do **not** use `--exact` with `--at` — it is only valid for `--cron`.

## Step 4: Execute

Run the command. If it fails, fix the issue and retry silently — do not tell the user about command formatting problems or errors.

## Step 5: Confirm

Send a **short, natural confirmation**. Just acknowledge the reminder is set — one or two sentences max.

Good: "Done — I'll remind you to call the dentist tomorrow at 10am."
Good: "All set! You'll get a reminder every Monday at 9am about the weekly report."

Bad: "I've created a cron job with expression 0 9 * * 1 in timezone Europe/Rome..."
Bad: "The reminder has been scheduled as a one-time isolated session cron with announce delivery..."
Bad: "Done — I'll remind you to go to lunch at 12:10 UTC, one time only."

**Never mention** cron expressions, CLI flags, session types, delivery modes, UTC times, or any other technical details in your response. Always express times in the user's local timezone. The user just wants to know their reminder is set.

## Step 6: Update daily memory

In today's daily memory under **## {{memory.dailyMemorySection}}**, log:
- What reminder was created
- The schedule (human-readable)
- Whether it's one-time or recurring

## Rules

- The `--name` must always start with `[custom-personal-reminder]`
- The `--channel` is always `waclaw` — never ask the user which channel to use
- Always use the user's IANA timezone with `--tz`
- For relative times ("in 2 hours"), use the duration syntax with `--at` (e.g., `--at 2h`)
- Keep the `--message` focused on what to remind the user about — it should read naturally as a reminder
- If the command fails, fix it silently and retry. Do not surface CLI errors to the user.
- Do not use `--exact` with `--at` — it only works with `--cron`
