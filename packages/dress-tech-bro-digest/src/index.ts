import { defineDress, z, cronFromTime } from '@clawset/core';

export default defineDress({
  id: 'tech-bro-digest',
  name: 'Tech Bro Digest',
  version: '1.0.0',
  description: 'Daily digest of tech news from configurable sources and topics.',

  params: {
    sources: {
      description: 'News sources to search (comma-separated)',
      schema: z.string().min(1),
      default: 'Product Hunt, Hacker News',
    },
    topics: {
      description: 'Topics to focus on (comma-separated)',
      schema: z.string().min(1),
      default: 'AI agents, Startups',
    },
    digestTime: {
      description: 'When to send the digest (HH:MM)',
      schema: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
      default: '08:00',
    },
    timezone: {
      description: 'Your timezone (IANA format, e.g. Europe/Rome)',
      schema: z.string().min(1),
      default: 'UTC',
    },
  },

  requires: {
    skills: ['tech-bro-digest'],
    underwear: ['waclaw'],
  },

  crons: (p) => [
    {
      id: 'tech-bro-digest',
      name: `${p.topics} digest`,
      schedule: cronFromTime(p.digestTime, ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], p.timezone),
      skill: 'tech-bro-digest',
      channel: 'waclaw',
    },
  ],

  memory: {
    dailySections: [],
    reads: [],
  },

  heartbeat: [],

  files: {
    skills: {
      'tech-bro-digest': {
        path: './skills/tech-bro-digest.md',
        vars: (p) => ({
          sources: p.sources,
          topics: p.topics,
        }),
      },
    },
  },
});
