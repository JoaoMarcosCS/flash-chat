import { createServer, IncomingMessage, Server } from 'http';
import 'reflect-metadata';
import { Duplex } from 'stream';
import { WebSocket, WebSocketServer } from 'ws';
import { AccessTokenPayload, verifyAccessToken } from '@/modules/auth/token/token';
import { logger as baseLogger } from '@/infra/logger';
import { ConnectionRegistry } from './connection-registry';

const logger = baseLogger.child('WsServer');

export const TOKEN_EXPIRED_CLOSE_CODE = 4001;

const authenticate = (req: IncomingMessage): AccessTokenPayload | null => {
  const token = new URL(req.url ?? '', 'http://localhost').searchParams.get('token');

  return token ? verifyAccessToken(token) : null;
};

const reject = (socket: Duplex) => {
  socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
  socket.destroy();
};

export const createWsServer = (registry: ConnectionRegistry): Server => {
  const server = createServer((req, res) => {
    res.writeHead(426, { Connection: 'close' });
    res.end();
  });
  const wss = new WebSocketServer({ noServer: true });

  const onConnection = (socket: WebSocket, user: AccessTokenPayload) => {
    registry.add(user.id, socket);

    const expiration = setTimeout(
      () => socket.close(TOKEN_EXPIRED_CLOSE_CODE, 'Token expirado'),
      Math.max(user.expiresAt - Date.now(), 0),
    );

    socket.on('close', () => {
      clearTimeout(expiration);
      registry.remove(user.id, socket);
      logger.info('Connection closed', { userId: user.id });
    });

    socket.on('error', (error) => {
      logger.error('Connection error', { userId: user.id, error });
    });

    logger.info('Connection opened', { userId: user.id });
  };

  server.on('upgrade', (req, socket, head) => {
    socket.on('error', (error) => logger.error('Upgrade socket error', { error }));

    const user = authenticate(req);

    if (!user) {
      logger.warn('Connection rejected: missing or invalid token');
      reject(socket);
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => onConnection(ws, user));
  });

  return server;
};
