@AGENTS.md

# Flash Chat: frontend

Next.js 16 (App Router) + React 19 + Tailwind 4 + TanStack Query + Zustand. Os contratos da API e do WebSocket, as telas e a ordem das fases estão em `ROADMAP.md`. Leia antes de implementar qualquer tela. Os termos do domínio seguem o `../CONTEXT.md`.

## Comandos

Use o Node da `.nvmrc` (`nvm use`) e o yarn.

```bash
cp .env.example .env.local   # uma vez
yarn dev                      # porta 5173, a liberada no CORS da API
yarn build
yarn lint / yarn lint:fix
yarn format
```

## Estrutura de pastas

```
src/
├─ proxy.ts                 o middleware do Next 16 (o arquivo middleware.ts está deprecado)
├─ app/                     só rotas: page.tsx e layout.tsx finos, que importam de modules/
│  ├─ (public)/             login, register
│  └─ (private)/            layout com SessionGate + RealtimeConnector + AppShell
│     ├─ chats/             Direct Chats: layout com a lista ao lado; page (vazio), [id], new
│     ├─ groups/            Groups: layout com a lista ao lado; page (vazio), [id], new
│     └─ profile/           Perfil: edição dos dados do User e desativação da conta
├─ modules/<módulo>/        auth, users, chats, messages, realtime
│  ├─ components/           componentes do módulo
│  ├─ hooks/                use-<ação>-mutation.ts, use-<ação>-query.ts, use-<ação>-form.ts
│  ├─ schema/               <ação>.schema.ts (Zod + tipo inferido), espelho do schema da API
│  ├─ service/              <ação>.request.ts, uma função por rota da API
│  ├─ interface/            <nome>.interface.ts, tipos das respostas
│  ├─ store/                <nome>.store.ts, estado zustand exclusivo do módulo
│  └─ <apoio>/              helpers exclusivos (auth/session, chats/cache, chats/display, realtime/socket)
├─ components/
│  ├─ common/               RenderIf, RenderItems, EmptyState, FormError, InfiniteScrollTrigger
│  ├─ layout/               AppShell, Brand, PanelHeader
│  └─ ui/                   Button (e buttonClassName), Input, Field, Avatar, Spinner
├─ hooks/                   hooks genéricos (use-debounced-value)
├─ lib/                     api.ts (autenticado), public-api.ts, funções puras
├─ stores/                  session.store.ts
├─ providers/               <nome>.provider.tsx
└─ environment/env.ts       variáveis NEXT_PUBLIC_* validadas com Zod
```

Um módulo importa de outro só o que for público (componente, hook, tipo ou função de cache). `components/`, `lib/` e `stores/` não importam de `modules/`. As exceções são `lib/api.ts` (usa o `refreshSession`) e `components/layout/app-shell.tsx` (logout e indicador de conexão).

## Renderização

- Condicional: `<RenderIf shouldRender={...} fallback={...}>`. Use no lugar de `cond && <X />` e de ternários no JSX. O `shouldRender` aceita qualquer valor e decide pela veracidade.
- Lista: `<RenderItems items={...} getKey={(item) => item.id} empty={...}>{(item, index) => ...}</RenderItems>`. Ele não cria wrapper: o `<ul>` ou `<div>` fica com quem chama. A `key` vem sempre do `getKey`, nunca do índice.
- Listas paginadas usam `useInfiniteQuery` + `flattenPages` + `<InfiniteScrollTrigger>` no fim.

## Sessão

- O access token fica só na memória (`stores/session.store.ts`). Nunca o grave em `localStorage`, `sessionStorage` ou cookie.
- O refresh token é um cookie `httpOnly` com `path=/api/v1/auth`, invisível para o JavaScript e para o `proxy.ts`. Por isso o front grava um cookie marcador sem segredo (`flash-chat.session=1`) em todo `startSession` e o apaga no `endSession`.
- O `proxy.ts` só olha o marcador: rota privada sem marcador vai para `/login`, e `/login` ou `/register` com marcador vão para `/chats`. A validação de verdade é o `SessionGate` do layout `(private)`, que chama `refreshSession()` quando a sessão ainda não foi restaurada e manda para `/login` se falhar.
- `refreshSession()` é único por aba (promise compartilhada) e por navegador (`navigator.locks`), porque o refresh token é trocado a cada uso. O `useProactiveRefresh` renova 1 minuto antes do `exp`.
- `lib/api.ts` envia o Bearer e, num `401`, faz o refresh e repete a requisição uma vez. As rotas de `/auth/*` e o `POST /users` usam `lib/public-api.ts`, que não tem interceptors.
- `startSession(accessToken)` é o único jeito de entrar numa sessão (login e refresh). Ele lê `sub`, `name`, `nickname` e `exp` do payload do JWT.
- `useEndSession()` (auth) é a limpeza do cliente: `endSession`, `queryClient.clear()` e o `live-messages.store`. Vale para o logout, para a desativação da conta e para o fechamento `4003` do WebSocket.
- Nada da área `(private)` é renderizado no servidor, porque o `SessionGate` espera a sessão no navegador. Por isso o `next.config.ts` usa `experimental.instantInsights.validationLevel: 'manual-warning'`: com o padrão, o Next acusa "Could not validate that a segment in your UI has instant navigation" em toda rota privada. Só os segmentos com `export const instant = true` são validados.

## Messages e tempo real

- O histórico vem do `useMessagesQuery` (`['messages', chatId]`). As Messages enviadas nesta aba e as recebidas pelo WebSocket ficam no `live-messages.store`. O `useChatMessages` junta as duas listas pelo `id` (a cópia ao vivo vence) e ordena da mais recente para a mais antiga.
- A lista de Messages é `flex-col-reverse`: o DOM vai da mais recente para a mais antiga, a rolagem começa no fim e as páginas antigas entram no topo sem pular.
- Message Status: `pending` (id temporário do cliente, `clientId`), `published` (id da resposta), `persisted` (evento) e `failed` (reenviar ou descartar). Toda Message do histórico é `persisted`, porque sai do Postgres. O ícone só aparece nas Messages do próprio usuário. A `key` é `clientId ?? id`, para a troca de id não remontar o balão.
- `403` no envio remove a Message e marca o Chat como Read-only (`markChatReadOnly`).
- `modules/realtime`: `RealtimeSocket` conecta com o access token da store, reconecta com espera de 1s a 30s, faz refresh quando o token venceu e, depois de cada reconexão, invalida `['chats']` e `['messages']`. Os eventos passam por `handleRealtimeEvent`, que atualiza o cache de chats (`modules/chats/cache`) e o `live-messages.store`.
- A lista de Chats é separada por tipo (`GET /chats?type=direct|group`, chave `['chats', type, search]`). A lista sem busca de cada tipo (`['chats', type, '']`) é atualizada direto no cache; as buscas são invalidadas.
- Uma Message `published` cujo id já veio no histórico (que sai do Postgres) aparece como `persisted`, porque o `message.persisted` pode se perder com o socket suspenso no celular. O `RealtimeSocket` reconecta na hora quando a aba volta a ficar visível ou a rede volta.
- `user.deactivated` (`{ user: { id } }`) marca como Read-only os Direct Chats em cache com esse User (`applyUserDeactivated`) e invalida a lista de Direct Chats. Groups não mudam, porque a API não devolve o `status` dos Participants.
- O fechamento `4003` ("Usuário desativado") para o `RealtimeSocket` sem reconectar e encerra a sessão, mandando para `/login`.

## Design

Formato de mensageiro clássico (layout da referência `Interface de Conversas em Tons Pastel.png`): barra de navegação à esquerda, lista de Conversas, Chat aberto com balões. No celular, a lista e o Chat ocupam a tela inteira, um de cada vez.

Paleta só em preto e branco, tom sério e minimalista. Fonte Instrument Sans (pesos 400, 500 e 600; nada de bold pesado). Tokens em `src/app/globals.css`: `background` (#f5f5f5), `surface` (branco), `foreground` (preto), `muted` (#f0f0f0, hover e seleção), `muted-foreground` (#5c5c5c, 6,4:1 sobre branco), `border` (#e3e3e3), `inverse` e `inverse-foreground` (preenchimento preto com texto branco).

- O preto sólido (`bg-inverse`) é reservado para o que é do usuário ou a ação principal: balão próprio, botão de enviar, botão primário, marca. Não use em avatar, selo ou decoração.
- Balão próprio: `bg-inverse`, à direita, canto inferior direito de 4px. Balão dos outros: `bg-surface` com `border`, à esquerda; no Group, com avatar e Name do Sender em `font-semibold`.
- Sem cor de erro: estado de erro é borda preta, ícone `CircleAlert` e texto. Message com falha vira balão branco com contorno tracejado.
- Seleção e item ativo: `bg-muted` com barra preta de 2px à esquerda.
- Raios por hierarquia: controles `rounded-lg`, balões 18px, avatar e botão de ícone redondos. Sem sombra, exceto o painel de Participants.
- Botões encolhem para 0,97 ao clicar (`active:scale-[0.97]`, curva `ease-out-strong`). Sem animação de entrada em lista ou balão.
- O ícone da aba (`src/app/icon.svg`) é o mesmo do `Brand`: o `Zap` do lucide em branco sobre quadrado preto arredondado. Se o `Brand` mudar, atualize o SVG junto.
- Sem avatar com foto: o `Avatar` mostra as iniciais em cinza claro ou contornado (fixo por id, `getUserTone`); Group é contornado em preto com o ícone.
- Não existem na API e não aparecem na interface: chamadas, vídeo, Status, anexos, emojis, contador de não lidas, presença e confirmação de leitura.

## Estilo

- Arquivos em kebab-case (`session-gate.tsx`, `session.store.ts`, `refresh.request.ts`). Componentes em PascalCase, como `function`, com props tipadas numa `interface`.
- Prettier igual ao do backend (aspas simples, `;`, trailing comma, largura 100).
- Sem comentários no código e sem `console`.
- Mensagens da API já vêm em português: mostre com `getApiErrorMessage(error)` (que troca `429` e `5xx` por uma mensagem genérica).
