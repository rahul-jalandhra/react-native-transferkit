import { describe, expect, it } from '@jest/globals';
import { parseSSEEventBlock } from '../stream/hooks/useSSEStream';

describe('parseSSEEventBlock', () => {
  it('parses standard single data line SSE event and auto-parses JSON', () => {
    const block = 'data: {"token": "hello"}\n';
    const parsed = parseSSEEventBlock(block);
    expect(parsed).toEqual({
      event: undefined,
      data: '{"token": "hello"}',
      json: { token: 'hello' },
      id: undefined,
      retry: undefined,
    });
  });

  it('parses OpenAI / Claude style JSON payloads', () => {
    const block =
      'event: message\ndata: {"choices": [{"delta": {"content": "World"}}]}\nid: evt-123\n';
    const parsed = parseSSEEventBlock(block);
    expect(parsed).toEqual({
      event: 'message',
      data: '{"choices": [{"delta": {"content": "World"}}]}',
      json: { choices: [{ delta: { content: 'World' } }] },
      id: 'evt-123',
      retry: undefined,
    });
  });

  it('handles spaces and retry fields', () => {
    const block = 'retry: 5000\ndata: test value\n';
    const parsed = parseSSEEventBlock(block);
    expect(parsed).toEqual({
      event: undefined,
      data: 'test value',
      json: undefined,
      id: undefined,
      retry: 5000,
    });
  });

  it('ignores comments starting with colon', () => {
    const block = ': ping comment\ndata: actual data\n';
    const parsed = parseSSEEventBlock(block);
    expect(parsed).toEqual({
      event: undefined,
      data: 'actual data',
      json: undefined,
      id: undefined,
      retry: undefined,
    });
  });

  it('returns null for empty blocks', () => {
    expect(parseSSEEventBlock('')).toBeNull();
    expect(parseSSEEventBlock('   \n  ')).toBeNull();
  });
});
