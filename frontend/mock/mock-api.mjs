import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WebSocketServer } = require('../../backend/node_modules/ws');

const API_PORT = 3000;
const WS_PORT = 3001;
const PAGE_SIZE = 20;
const MINUTE = 60_000;

function uuidV7(ms = Date.now()) {
  const hex = Math.floor(ms).toString(16).padStart(12, '0') + randomBytes(10).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

const now = Date.now();
const me = { id: uuidV7(now - 9000 * MINUTE), name: 'João Marcos', nickname: 'joao' };
const ana = { id: uuidV7(now - 8000 * MINUTE), name: 'Ana Beatriz Lima', nickname: 'anabia' };
const rui = { id: uuidV7(now - 7000 * MINUTE), name: 'Rui Carvalho', nickname: 'ruic' };
const lia = { id: uuidV7(now - 6000 * MINUTE), name: 'Lia Fernandes', nickname: 'lia' };
const caio = { id: uuidV7(now - 5000 * MINUTE), name: 'Caio Ramos', nickname: 'caio' };
const bia = { id: uuidV7(now - 4000 * MINUTE), name: 'Beatriz Souza', nickname: 'bsouza' };
const users = [me, ana, rui, lia, caio, bia];

const chats = [];
const messages = new Map();
let loggedIn = false;

function addChat({ isGroup, title, participants, readOnly = false, createdAgo }) {
  const createdAt = now - createdAgo * MINUTE;
  const chat = {
    id: uuidV7(createdAt),
    isGroup,
    title,
    createdBy: me.id,
    createdAt: new Date(createdAt).toISOString(),
    readOnly,
    participants,
  };
  chats.push(chat);
  messages.set(chat.id, []);
  return chat;
}

function addMessage(chat, sender, content, ago) {
  const createdAt = now - ago * MINUTE;
  const message = {
    id: uuidV7(createdAt),
    content,
    createdAt: new Date(createdAt).toISOString(),
    sender: { id: sender.id, name: sender.name },
  };
  messages.get(chat.id).push(message);
  return message;
}

const project = addChat({
  isGroup: true,
  title: 'Projeto Flash',
  participants: [me, ana, rui, lia],
  createdAgo: 5000,
});
const scrollback = [
  [ana, 'Pessoal, vamos fechar o escopo da sprint?'],
  [rui, 'Bora. Eu fico com a parte do consumer.'],
  [me, 'Pego o front e a integração do WebSocket.'],
  [lia, 'Faço os testes de integração do auth.'],
  [ana, 'Fechado. Daily às 9h30 como sempre.'],
];
for (let index = 0; index < 30; index += 1) {
  const [sender, content] = scrollback[index % scrollback.length];
  addMessage(project, sender, content, 3 * 24 * 60 - index * 20);
}
addMessage(project, ana, 'Bom dia! Subi a branch do WebSocket ontem à noite.', 26 * 60);
addMessage(project, me, 'Vi agora. A reconexão com backoff ficou boa.', 26 * 60 - 5);
addMessage(project, rui, 'Rodei os testes de integração, tudo verde.', 50);
addMessage(project, lia, 'Alguém revisa o PR do consumer hoje?', 42);
addMessage(project, me, 'Eu reviso depois do almoço.', 40);
addMessage(
  project,
  ana,
  'Perfeito. Deixei dois comentários sobre o retry da fila, nada bloqueante.',
  12,
);
addMessage(project, me, 'Fechado, respondo lá.\nE já marco a reunião de quinta.', 3);

const withAna = addChat({ isGroup: false, title: null, participants: [me, ana], createdAgo: 4000 });
addMessage(withAna, me, 'Conseguiu ver o layout novo?', 40);
addMessage(withAna, ana, 'Vi sim, ficou bem mais limpo em preto e branco.', 35);
addMessage(withAna, ana, 'Te mando o link da call daqui a pouco', 30);

const withRui = addChat({ isGroup: false, title: null, participants: [me, rui], createdAgo: 3500 });
addMessage(withRui, rui, 'Rodou a migration aí?', 210);
addMessage(withRui, me, 'Valeu pela ajuda com a migration', 200);

const family = addChat({
  isGroup: true,
  title: 'Família',
  participants: [me, lia, caio],
  createdAgo: 3000,
});
addMessage(family, lia, 'Domingo almoço aqui em casa?', 1500);

const withCaio = addChat({
  isGroup: false,
  title: null,
  participants: [me, caio],
  readOnly: true,
  createdAgo: 2500,
});
addMessage(withCaio, caio, 'Até mais!', 4000);

addChat({ isGroup: false, title: null, participants: [me, lia], createdAgo: 2000 });

function toListItem(chat) {
  const list = messages.get(chat.id);
  const last = list.at(-1);
  const other = chat.participants.find((participant) => participant.id !== me.id);
  return {
    id: chat.id,
    isGroup: chat.isGroup,
    displayName: chat.isGroup ? chat.title : other.name,
    readOnly: chat.readOnly,
    lastMessage: last ? { id: last.id, content: last.content, sender: last.sender } : null,
  };
}

function sortKey(chat) {
  return messages.get(chat.id).at(-1)?.id ?? chat.id;
}

function paginate(items, cursor) {
  const start = cursor ? items.findIndex((item) => item.id === cursor) + 1 : 0;
  const page = items.slice(start, start + PAGE_SIZE);
  const hasMore = start + PAGE_SIZE < items.length;
  return { data: page, nextCursor: hasMore ? page.at(-1).id : null };
}

function matches(text, search) {
  return text.toLowerCase().includes(search.toLowerCase());
}

function createToken() {
  const payload = {
    sub: me.id,
    name: me.name,
    nickname: me.nickname,
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  };
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.mock`;
}

const sockets = new Set();

function broadcast(type, data) {
  const frame = JSON.stringify({ type, data });
  for (const socket of sockets) socket.send(frame);
}

const replies = [
  'Boa, combinado.',
  'Perfeito, obrigado!',
  'Já te respondo com calma.',
  'Faz sentido. Vou olhar isso.',
];

function publish(chat, sender, content) {
  const message = {
    id: uuidV7(),
    content,
    createdAt: new Date().toISOString(),
    sender: { id: sender.id, name: sender.name },
  };
  messages.get(chat.id).push(message);
  broadcast('message.published', { message: { ...message, chatId: chat.id } });
  setTimeout(
    () => broadcast('message.persisted', { message: { id: message.id, chatId: chat.id } }),
    700,
  );
  return message;
}

function scheduleReply(chat) {
  const others = chat.participants.filter((participant) => participant.id !== me.id);
  const sender = others[Math.floor(Math.random() * others.length)];
  const content = replies[Math.floor(Math.random() * replies.length)];
  setTimeout(() => publish(chat, sender, content), 1500);
}

function readBody(request) {
  return new Promise((resolve) => {
    let raw = '';
    request.on('data', (chunk) => (raw += chunk));
    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(body === undefined ? undefined : JSON.stringify(body));
}

function fail(response, status, type, message) {
  send(response, status, { error: { type, message } });
}

async function route(request, response, url) {
  const path = url.pathname.replace(/^\/api\/v1/, '');
  const method = request.method;
  const search = url.searchParams.get('search') ?? '';
  const cursor = url.searchParams.get('cursor') ?? undefined;

  if (method === 'GET' && path === '/health') return send(response, 200, { status: 'ok' });

  if (method === 'POST' && path === '/auth/login') {
    loggedIn = true;
    return send(response, 200, { accessToken: createToken() });
  }
  if (method === 'POST' && path === '/auth/refresh') {
    if (!loggedIn) return fail(response, 401, 'UnauthorizedError', 'Sessão expirada');
    return send(response, 200, { accessToken: createToken() });
  }
  if (method === 'POST' && path === '/auth/logout') {
    loggedIn = false;
    return send(response, 204);
  }
  if (method === 'POST' && path === '/users') return send(response, 201, me);

  const auth = request.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ')) return fail(response, 401, 'UnauthorizedError', 'Não autorizado');

  if (method === 'GET' && path === '/users') {
    const found = users.filter(
      (user) =>
        user.id !== me.id && (matches(user.name, search) || matches(user.nickname, search)),
    );
    return send(response, 200, paginate(found, cursor));
  }

  if (method === 'GET' && path === '/chats') {
    const list = [...chats]
      .sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
      .map(toListItem)
      .filter((item) => !search || matches(item.displayName, search));
    return send(response, 200, paginate(list, cursor));
  }

  if (method === 'POST' && path === '/chats/direct') {
    const { participantId } = await readBody(request);
    const other = users.find((user) => user.id === participantId);
    if (!other) return fail(response, 404, 'NotFoundError', 'Usuário não encontrado');
    const existing = chats.find(
      (chat) => !chat.isGroup && chat.participants.some((user) => user.id === participantId),
    );
    if (existing) return send(response, 200, existing);
    const chat = addChat({ isGroup: false, title: null, participants: [me, other], createdAgo: 0 });
    broadcast('chat.created', { chat });
    return send(response, 201, chat);
  }

  if (method === 'POST' && path === '/chats/groups') {
    const { title, participantIds = [] } = await readBody(request);
    const participants = [me, ...users.filter((user) => participantIds.includes(user.id))];
    const chat = addChat({ isGroup: true, title, participants, createdAgo: 0 });
    broadcast('chat.created', { chat });
    return send(response, 201, chat);
  }

  const chatMatch = path.match(/^\/chats\/([^/]+)(\/messages)?$/);
  const chat = chatMatch && chats.find((item) => item.id === chatMatch[1]);
  if (chatMatch && !chat) return fail(response, 404, 'NotFoundError', 'Chat não encontrado');

  if (chat && method === 'GET' && !chatMatch[2]) return send(response, 200, chat);

  if (chat && method === 'GET' && chatMatch[2]) {
    const list = [...messages.get(chat.id)].reverse();
    return send(response, 200, paginate(list, cursor));
  }

  if (chat && method === 'POST' && chatMatch[2]) {
    const { content = '' } = await readBody(request);
    if (chat.readOnly) {
      return fail(response, 403, 'ForbiddenError', 'Este chat está em modo somente leitura');
    }
    if (content.includes('/erro')) {
      return fail(response, 500, 'InternalError', 'Erro simulado');
    }
    const message = publish(chat, me, content);
    scheduleReply(chat);
    return send(response, 201, { id: message.id, createdAt: message.createdAt });
  }

  return fail(response, 404, 'NotFoundError', 'Rota não encontrada');
}

const api = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin) {
    response.setHeader('access-control-allow-origin', origin);
    response.setHeader('access-control-allow-credentials', 'true');
    response.setHeader('access-control-allow-headers', 'authorization,content-type');
    response.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  }
  if (request.method === 'OPTIONS') return send(response, 204);
  const url = new URL(request.url, `http://localhost:${API_PORT}`);
  await new Promise((resolve) => setTimeout(resolve, 150));
  try {
    await route(request, response, url);
  } catch {
    fail(response, 500, 'InternalError', 'Erro no mock');
  }
});

api.listen(API_PORT, () => console.log(`API mock em http://localhost:${API_PORT}/api/v1`));

const ws = new WebSocketServer({ port: WS_PORT });
ws.on('connection', (socket, request) => {
  const token = new URL(request.url, `ws://localhost:${WS_PORT}`).searchParams.get('token');
  if (!token) return socket.close(4001, 'Token ausente');
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
});
ws.on('listening', () => console.log(`WebSocket mock em ws://localhost:${WS_PORT}`));
