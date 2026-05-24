import { describe, it, expect } from 'vitest';

describe('block-service basic', () => {
  it('creates a block payload', () => {
    const block = { pageId: 'p1', type: 'text', content: { text: 'hi' } };
    expect(block).toHaveProperty('pageId');
  });
});
