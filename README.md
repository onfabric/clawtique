# clawtique

A wardrobe for your OpenClaw. Dress it up, take it off, no mess left behind.

OpenClaw is powerful out of the box, but setting it up for a specific goal — say, a fitness routine — means installing skills, wiring up cron jobs, defining memory sections, writing prompts, and making sure they all talk to each other. Then doing it again for the next thing. And hoping nothing breaks when you remove one.

openclawtique fixes this. You define a **dress** — a typed bundle of everything OpenClaw needs to do a job — and the CLI handles the rest. Install it, customize it, remove it cleanly. Your data stays, the config goes.

## Quick start

```bash
# Point openclawtique at your OpenClaw instance
clawtique init --openclaw-dir ~/.openclaw

# Try on a dress
clawtique dress ./packages/dress-fitness-coach

# See what's active
clawtique status

# Not working out? Take it off
clawtique undress fitness-coach
```

## What's a dress?

A dress is a self-contained package that bundles everything needed for a goal:

- **Skills** — what OpenClaw can do (e.g. read Oura Ring data)
- **Crons** — when it does it (e.g. every morning at 8am)
- **Memory sections** — where it writes what it learns (e.g. `## Fitness` in daily notes)
- **A guide** — how it should behave (tone, rules, what to pay attention to)
- **Secrets** — API keys it needs, prompted at install time
- **Heartbeat rules** — when to proactively check in

A dress can be as simple as a single cron job or as elaborate as a full coaching system with multiple schedules, data sources, and cross-references to other dresses.

## Personalization

Every dress can define parameters that you set when you put it on:

```
$ clawtique dress @clawtique/fitness-coach

  Fitness Coach v1.0.0

  ? When do you usually work out? (18:00) › 17:30
  ? Hours after workout to ask for feedback (2) › 1.5
  ? Your timezone (UTC) › Europe/Rome
  ? Days to schedule workouts (mon-fri) › mon, wed, fri

  + cron: Daily workout schedule (30 15 * * 1,3,5 UTC)
  + cron: Post-workout check-in (0 17 * * 1,3,5 UTC)
  + memory section: Fitness
  + guide: ~/.openclaw/dresses/fitness-coach/GUIDE.md
```

Cron schedules are computed from your answers — times are converted to UTC automatically. Change your mind later with `clawtique params`:

```bash
clawtique params fitness-coach --set workoutTime=18:00 --set workDays=mon,wed,fri,sat
```

## The rules

**Config is removed. Data stays.**

When you undress, openclawtique removes the cron jobs, skills, and guide files it installed. But everything OpenClaw wrote while wearing that dress — daily memory entries, logs, generated files — stays untouched. You never lose work.

**Dresses compose safely.**

Two dresses that both need the same plugin? It's installed once, removed only when nothing needs it anymore. Two dresses that claim the same memory section? openclawtique refuses and tells you exactly what conflicts.

**Everything is tracked.**

Every dress and undress is a git commit with a conventional message. `clawtique log` shows the full history. `clawtique rollback` undoes the last operation. You always know what changed and when.

## Writing a dress

A dress is a TypeScript file that calls `defineDress()`:

```typescript
import { defineDress, z, cronFromTime, addHours } from '@clawtique/core'

export default defineDress({
  id: 'fitness-coach',
  name: 'Fitness Coach',
  version: '1.0.0',
  description: 'Sends workout schedule and collects post-training feedback.',

  params: {
    workoutTime: {
      description: 'When do you usually work out? (HH:MM)',
      schema: z.string().regex(/^\d{2}:\d{2}$/),
      default: '18:00',
    },
    feedbackDelay: {
      description: 'Hours after workout to ask for feedback',
      schema: z.number().min(0.5).max(8),
      default: 2,
    },
    timezone: {
      description: 'Your timezone',
      schema: z.string(),
      default: 'UTC',
    },
    workDays: {
      description: 'Days to schedule workouts',
      schema: z.array(z.enum(['mon','tue','wed','thu','fri','sat','sun'])),
      default: ['mon', 'tue', 'wed', 'thu', 'fri'],
    },
  },

  requires: {
    skills: ['workout-planner'],
  },

  crons: (p) => [
    {
      id: 'workout-schedule',
      name: 'Daily workout schedule',
      schedule: cronFromTime(p.workoutTime, p.workDays, p.timezone),
      prompt: 'Send the user their workout plan for today...',
    },
    {
      id: 'workout-feedback',
      name: 'Post-workout check-in',
      schedule: cronFromTime(
        addHours(p.workoutTime, p.feedbackDelay),
        p.workDays,
        p.timezone,
      ),
      prompt: 'Ask how the workout went...',
    },
  ],

  memory: {
    dailySections: ['Fitness'],
  },

  files: {
    guide: './GUIDE.md',
  },
})
```

Everything is typed. If a cron references a param that doesn't exist, TypeScript catches it. If the schedule format is wrong, Zod catches it at build time. The `defineDress` function gives you full autocomplete for every field.

## CLI reference

| Command | What it does |
|---------|-------------|
| `clawtique init` | Point at an OpenClaw directory, set up state tracking |
| `clawtique dress <path>` | Install and activate a dress, prompting for params |
| `clawtique undress <id>` | Remove a dress's config, keep its data |
| `clawtique status` | List active dresses with their components and params |
| `clawtique params <id>` | View or update a dress's params |
| `clawtique diff` | Show everything openclawtique has applied |
| `clawtique doctor` | Health check — verify all files, crons, and connections |
| `clawtique log` | Git history of all dress/undress operations |
| `clawtique rollback` | Undo the last operation |

All mutating commands support `--dry-run`. All read commands support `--json`.

## How it works under the hood

openclawtique maintains a small git repository at `~/.clawtique/` that tracks:

- Which dresses are active and with what params
- What was applied to OpenClaw (crons, skills, plugins, memory sections, files)
- The full history of changes as conventional commits

When you dress or undress, openclawtique:

1. Merges all active dresses into a single desired state
2. Detects conflicts (duplicate memory sections, missing dependencies)
3. Diffs desired vs current and shows you exactly what will change
4. Applies the changes through the OpenClaw CLI
5. Commits the new state

Removing a dress recomputes the desired state without it. Shared dependencies (like a plugin used by two dresses) only get removed when nothing needs them anymore.

## Project structure

```
openclawtique/
├── packages/
│   ├── core/                    # Types, schemas, merge logic, utilities
│   ├── cli/                     # The clawtique CLI (oclif)
│   └── dress-fitness-coach/     # Example dress
```

## Development

```bash
# Install dependencies
bun install

# Build everything (core first, then the rest)
cd packages/core && bun run build
cd packages/dress-fitness-coach && bun run build
cd packages/cli && bun run build

# Run the CLI locally
node packages/cli/bin/run.js --help
```
