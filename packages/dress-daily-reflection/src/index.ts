import { defineDress, z, cronFromTime } from '@clawset/core';

export default defineDress({
  id: 'daily-reflection',
  name: 'Daily Reflection',
  version: '1.0.0',
  description: 'End-of-day reflection — capture what mattered and set tomorrow\'s intentions.',

  params: {
    reflectionTime: {
      description: 'When to send the reflection prompt (HH:MM)',
      schema: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
      default: '23:00',
    },
    timezone: {
      description: 'Your timezone (IANA format, e.g. Europe/Rome)',
      schema: z.string().min(1),
      default: 'UTC',
    },
    activeDays: {
      description: 'Days to send the reflection (comma-separated: mon,tue,...)',
      schema: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).min(1),
      default: ['mon', 'tue', 'wed', 'thu', 'fri'] as ('mon' | 'tue' | 'wed' | 'thu' | 'fri')[],
    },
  },

  requires: {
    skills: ['daily-reflection'],
    underwear: ['waclaw'],
  },

  crons: (p) => [
    {
      id: 'daily-reflection',
      name: 'Daily reflection and tomorrow bullets',
      schedule: cronFromTime(p.reflectionTime, p.activeDays, p.timezone),
      skill: 'daily-reflection',
      channel: 'waclaw',
    },
  ],

  memory: {
    dailySections: ['Reflections'],
    reads: [],
  },

  heartbeat: [],

  files: {
    skills: {
      'daily-reflection': './skills/daily-reflection.md',
    },
  },
});
