import { defineDress } from '@clawset/core';

export default defineDress({
  id: 'ontology',
  name: 'Knowledge Graph',
  version: '1.0.0',
  description: 'Maintains a personal knowledge graph via the ontology skill from ClawHub.',

  requires: {
    skills: ['ontology'],
    underwear: ['waclaw'],
    // No files.skills entry → installed from ClawHub via `openclaw skills install ontology`
  },

  crons: [
    {
      id: 'graph-update',
      name: 'Daily knowledge graph update',
      schedule: '0 23 * * *',
      skill: 'ontology',
      channel: 'waclaw',
    },
  ],

  memory: {
    dailySections: ['Knowledge Graph'],
    reads: [],
  },

  heartbeat: [
    'If new facts or relationships were mentioned in conversations, note them for the next ontology update.',
  ],

  files: {
    // No bundled skills — ontology comes from ClawHub
  },
});
