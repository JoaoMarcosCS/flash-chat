import { describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { ConnectionRegistry } from './connection-registry';

const makeSocket = (readyState: number = WebSocket.OPEN) =>
  ({ readyState, send: vi.fn() }) as unknown as WebSocket;

describe('ConnectionRegistry', () => {
  it('should send to every open socket of each user once', () => {
    const registry = new ConnectionRegistry();
    const [phone, laptop, other] = [makeSocket(), makeSocket(), makeSocket()];
    registry.add('ana', phone);
    registry.add('ana', laptop);
    registry.add('bruno', other);

    const sent = registry.send(['ana', 'ana'], 'frame');

    expect(sent).toBe(2);
    expect(phone.send).toHaveBeenCalledWith('frame');
    expect(laptop.send).toHaveBeenCalledTimes(1);
    expect(other.send).not.toHaveBeenCalled();
  });

  it('should skip sockets that are not open and users without sockets', () => {
    const registry = new ConnectionRegistry();
    const closing = makeSocket(WebSocket.CLOSING);
    registry.add('ana', closing);

    expect(registry.send(['ana', 'carla'], 'frame')).toBe(0);
    expect(closing.send).not.toHaveBeenCalled();
  });

  it('should forget the user when the last socket is removed', () => {
    const registry = new ConnectionRegistry();
    const [phone, laptop] = [makeSocket(), makeSocket()];
    registry.add('ana', phone);
    registry.add('ana', laptop);

    registry.remove('ana', phone);
    expect(registry.count('ana')).toBe(1);

    registry.remove('ana', laptop);
    expect(registry.count('ana')).toBe(0);
  });
});
