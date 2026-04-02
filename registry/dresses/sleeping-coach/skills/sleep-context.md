---
name: Sleep context
description: Checks Oura Ring sleep data when the user mentions tiredness or sleep quality.
---

# Sleep Context

The user has mentioned feeling tired, poorly rested, or is asking about sleep. Before responding, pull their recent sleep data to give an informed answer.

## Step 1: Understand current context

1. Read `~/.openclaw/workspace/USER.md` for the user's profile and habits
2. Read recent daily memory files, especially **## {{memory.dailyMemorySection}}** sections, for sleep trends and prior reports

## Step 2: Fetch data

Call `oura_data` for today and yesterday with these endpoints:
- `daily_sleep` — sleep score and contributors
- `sleep` — detailed sleep periods (durations, timing)
- `daily_readiness` — readiness and recovery

## Step 3: Respond with context

Weave the sleep data naturally into your response:
- If they're tired, reference what the data shows (short sleep, low deep sleep, late bedtime)
- If they're asking about sleep quality, give a concise summary of recent trends
- Offer one actionable suggestion based on the data

## Step 4: Update state

In today's daily memory under **## {{memory.dailyMemorySection}}**: note that the user asked about sleep and any key data points you referenced. This helps future reports build on the conversation.

## What NOT to do

- Don't dump raw numbers — interpret them
- Don't be alarmist about one bad night
- Don't diagnose — suggest they see a professional for persistent issues
