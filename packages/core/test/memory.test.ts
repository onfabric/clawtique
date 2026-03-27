import { describe, test, expect } from 'bun:test';
import { wrapSection, stripMarkers, removeSection } from '../src/memory.js';

describe('wrapSection', () => {
  test('wraps content in markers', () => {
    const result = wrapSection('fitness', '## Rules\n- Do stuff\n');
    expect(result).toContain('<!-- clawset:fitness:start -->');
    expect(result).toContain('<!-- clawset:fitness:end -->');
    expect(result).toContain('## Rules');
  });
});

describe('stripMarkers', () => {
  test('removes markers but keeps content', () => {
    const input = [
      '# HEARTBEAT.md',
      '',
      '<!-- clawset:fitness:start -->',
      '## fitness',
      '- nudge if late',
      '<!-- clawset:fitness:end -->',
    ].join('\n');

    const result = stripMarkers('fitness', input);
    expect(result).not.toContain('clawset:fitness');
    expect(result).toContain('## fitness');
    expect(result).toContain('- nudge if late');
  });
});

describe('removeSection', () => {
  test('removes markers AND content', () => {
    const input = [
      '# HEARTBEAT.md',
      '',
      '## Check-in',
      '- check stuff',
      '',
      '<!-- clawset:fitness:start -->',
      '',
      '## fitness',
      '- nudge if late',
      '',
      '<!-- clawset:fitness:end -->',
    ].join('\n');

    const result = removeSection('fitness', input);
    expect(result).not.toContain('clawset:fitness');
    expect(result).not.toContain('nudge if late');
    expect(result).toContain('# HEARTBEAT.md');
    expect(result).toContain('## Check-in');
    expect(result).toContain('- check stuff');
  });

  test('handles multiple sections from different dresses', () => {
    const input = [
      '# HEARTBEAT.md',
      '',
      '<!-- clawset:fitness:start -->',
      '- fitness rule',
      '<!-- clawset:fitness:end -->',
      '',
      '<!-- clawset:reading:start -->',
      '- reading rule',
      '<!-- clawset:reading:end -->',
    ].join('\n');

    const result = removeSection('fitness', input);
    expect(result).not.toContain('fitness rule');
    expect(result).toContain('<!-- clawset:reading:start -->');
    expect(result).toContain('- reading rule');
  });

  test('collapses excessive blank lines', () => {
    const input = [
      '# HEARTBEAT.md',
      '',
      '',
      '<!-- clawset:fitness:start -->',
      '- rule',
      '<!-- clawset:fitness:end -->',
      '',
      '',
      '## Other',
    ].join('\n');

    const result = removeSection('fitness', input);
    expect(result).not.toContain('\n\n\n');
  });
});
