# Flash Chat

Chat em tempo real com WebSocket e persistência assíncrona via RabbitMQ. Os usuários se cadastram, buscam outros usuários pelo nome ou nickname, criam conversas diretas ou em grupo e trocam mensagens.

> Projeto em desenvolvimento. Hoje existem o cadastro, o login e a busca de usuários. Chats, mensagens, o servidor WebSocket e o consumer de persistência ainda estão por vir.

## Arquitetura

São três processos que só se comunicam pelo RabbitMQ:

| Processo | Responsabilidade | Status |
|---|---|---|
| **API** (Express) | Cadastro, login, busca de usuários, criação de chats, envio e leitura de mensagens. É a única que publica mensagens. | em andamento |
| **Servidor WebSocket** | Somente de saída: entrega as mensagens aos participantes conectados. | a fazer |
| **Consumer de persistência** | Grava as mensagens no Postgres e avisa o remetente quando a mensagem foi persistida. | a fazer |

Fluxo de envio de uma mensagem:

```
cliente ──POST /chats/:id/messages──▶ API ──publish (confirm)──▶ exchange fanout
                                                                   ├─▶ fila persist ─▶ Consumer ─▶ Postgres
                                                                   └─▶ fila por instância WS ─▶ participantes conectados
```

A API valida tudo antes de publicar e só responde depois da confirmação do broker. A mensagem passa por três estados para o remetente: **Pending** (enviada pelo cliente), **Published** (aceita pelo broker) e **Persisted** (gravada no banco).

## Stack

- Node.js 24 + TypeScript
- Express 5, Zod, tsyringe
- PostgreSQL 16 + TypeORM
- RabbitMQ 4.1
- Redis 7 (cache)
- Pino (logs), Swagger (documentação da API)
- Vitest + Testcontainers (testes)

## Pré-requisitos

- [nvm](https://github.com/nvm-sh/nvm) (a versão do Node está em `.nvmrc`)
- [Yarn](https://yarnpkg.com/)
- Docker e Docker Compose

## Como rodar

```bash
nvm use
yarn install

cp .env.example .env
# preencha DB_*, RABBITMQ_* e os segredos JWT_SECRET e JWT_REFRESH_SECRET (mínimo de 32 caracteres)

docker compose up -d postgres redis rabbitmq
yarn migration:run
yarn dev
```

| Serviço | Endereço |
|---|---|
| API | http://localhost:3000/api/v1 |
| Swagger | http://localhost:3000/docs |
| Health check | http://localhost:3000/health |
| Painel do RabbitMQ | http://localhost:15672 |

## Endpoints

| Método | Rota | Autenticada | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/users` | não | Cadastro de usuário |
| `GET` | `/api/v1/users` | sim | Busca de usuários por nome ou nickname |
| `POST` | `/api/v1/auth/login` | não | Login (devolve access token e refresh token) |
| `POST` | `/api/v1/auth/refresh` | não | Renova os tokens |

## Scripts

| Comando | Descrição |
|---|---|
| `yarn dev` | API em modo watch |
| `yarn build` | Compila para `dist/` |
| `yarn start` | Roda a versão compilada |
| `yarn test` | Testes unitários |
| `yarn test:integration` | Testes de integração (sobe um Postgres com Testcontainers, precisa do Docker) |
| `yarn lint` / `yarn lint:fix` | ESLint |
| `yarn migration:generate src/infra/database/migrations/<Nome>` | Gera uma migration a partir das entities |
| `yarn migration:run` / `yarn migration:revert` | Aplica ou desfaz migrations |

## Estrutura

```
src/
├─ infra/      adaptadores técnicos: HTTP, banco, cache, logger, container de DI
├─ modules/    um diretório por módulo de domínio (auth, users, chats, messages)
├─ shared/     código transversal: env, erros, enums, docs, utilitários
└─ tests/      setup dos testes unitários e de integração
```

Cada módulo é organizado em `entity/`, `repository/` e `usecase/<ação>/` (schema, use case, controller e teste).
