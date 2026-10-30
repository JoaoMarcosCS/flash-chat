import { describe, expect, it } from 'vitest';
import { toDelivery } from './ws-events.consumer';

describe('toDelivery', () => {
  it('should use participantIds as recipients and remove them from the frame', () => {
    expect(
      toDelivery('chat.created', { participantIds: ['ana', 'bruno'], chat: { id: 'c1' } }),
    ).toEqual({
      userIds: ['ana', 'bruno'],
      frame: { type: 'chat.created', data: { chat: { id: 'c1' } } },
    });
  });

  it.each([null, 'text', { chat: {} }, { participantIds: 'ana' }, { participantIds: [1] }])(
    'should return null for payload %j',
    (payload) => {
      expect(toDelivery('chat.created', payload)).toBeNull();
    },
  );
});
