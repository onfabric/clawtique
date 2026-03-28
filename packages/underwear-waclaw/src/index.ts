import { defineUnderwear } from '@clawset/core';

export default defineUnderwear({
  id: 'waclaw',
  name: 'WhatsApp (waclaw)',
  version: '1.0.0',
  description: 'WhatsApp channel plugin via waclaw proxy — shared across dresses that need WhatsApp messaging.',

  plugins: [
    {
      id: 'waclaw',
      spec: '@onfabric/waclaw-plugin',
      setupCommand: 'openclaw configure',
      setupNotes: [
        'During setup, select Channels > WhatsApp (waclaw)',
        'You will need a connector token from the waclaw admin API',
        'Optionally set a default outbound phone number (E.164 format, e.g. +12025550123)',
      ],
    },
  ],
});
