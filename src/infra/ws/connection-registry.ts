import { WebSocket } from 'ws';

export class ConnectionRegistry {
  private sockets = new Map<string, Set<WebSocket>>();

  add(userId: string, socket: WebSocket): void {
    const sockets = this.sockets.get(userId) ?? new Set<WebSocket>();

    sockets.add(socket);
    this.sockets.set(userId, sockets);
  }

  remove(userId: string, socket: WebSocket): void {
    const sockets = this.sockets.get(userId);

    if (!sockets) {
      return;
    }

    sockets.delete(socket);

    if (sockets.size === 0) {
      this.sockets.delete(userId);
    }
  }

  count(userId: string): number {
    return this.sockets.get(userId)?.size ?? 0;
  }

  send(userIds: string[], frame: string): number {
    let sent = 0;

    for (const userId of new Set(userIds)) {
      for (const socket of this.sockets.get(userId) ?? []) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(frame);
          sent++;
        }
      }
    }

    return sent;
  }
}
