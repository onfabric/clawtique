import { defineDress, z, cronFromTime } from '@clawset/core';

export default defineDress({
  id: 'daily-pill',
  name: 'Daily Pill',
  version: '1.0.0',
  description: 'One bookmark a day — the most relevant link for what you\'re working on right now.',

  params: {
    pillTime: {
      description: 'When to send the daily pill (HH:MM)',
      schema: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
      default: '10:00',
    },
    timezone: {
      description: 'Your timezone (IANA format, e.g. Europe/Rome)',
      schema: z.string().min(1),
      default: 'UTC',
    },
  },

  requires: {
    skills: ['daily-pill'],
    underwear: ['waclaw'],
  },

  crons: (p) => [
    {
      id: 'daily-pill',
      name: 'Daily pill',
      schedule: cronFromTime(p.pillTime, ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], p.timezone),
      skill: 'daily-pill',
      channel: 'waclaw',
    },
  ],

  memory: {
    dailySections: [],
    reads: [],
  },

  heartbeat: [],

  workspace: {
    'daily-pill/bookmarks.md': '# Bookmarks\n\nSaved links for the daily pill.\n',
    'daily-pill/pill-history.md': '# Pill History\n\nLog of past daily pills.\n',
  },

  files: {
    skills: {
      'daily-pill': './skills/daily-pill.md',
    },
  },
});
