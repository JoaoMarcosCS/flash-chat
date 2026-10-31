# Flash Chat: roadmap do frontend

Este documento lista as telas, os contratos da API e do WebSocket e as funcionalidades que o frontend precisa implementar. Ele não trata de design nem de estrutura de pastas.

Use os termos do glossário (`../CONTEXT.md`) na interface e no código: User, Participant, Chat, Direct Chat, Group, Initiator, Message, Sender, Message Status (Pending, Published, Persisted), Delivery, Read-only, Last Message, Active, Deactivated, Nickname. Na interface, os textos aparecem em português; no código, use os termos em inglês.

## Visão geral

- API HTTP: `http://localhost:3000/api/v1` (porta `API_PORT` do backend).
- WebSocket: `ws://localhost:3001?token=<access token>` (porta `WS_PORT`). Ele só envia eventos ao cliente e ignora o que o cliente manda.
- O CORS da API libera `http://localhost:5173`, a porta padrão do Vite. Se o frontend usar outra porta, ela precisa entrar no `white-list.ts` do backend.
- Todos os erros da API têm o formato `{ "error": { "type": string, "message": string } }`. As mensagens já vêm em português e podem ser mostradas direto ao usuário.
- Datas chegam como strings ISO 8601 (`createdAt`).
- Ids são UUIDv7. Como eles crescem com o tempo, ordenar por id é o mesmo que ordenar por criação.
- Toda rota autenticada recebe o header `Authorization: Bearer <access token>`.

## Fase 1: autenticação e sessão

### Como a sessão funciona

- O login devolve o access token no corpo e grava o refresh token num cookie `httpOnly` chamado `refreshToken`. O cookie vale 7 dias, tem `SameSite=Strict` e `Path=/api/v1/auth`. O JavaScript não consegue ler esse cookie, e isso é intencional.
- O access token vale 15 minutos e fica só na memória (estado da aplicação). Nunca grave o access token em `localStorage` nem em `sessionStorage`.
- As chamadas a `/auth/login`, `/auth/refresh` e `/auth/logout` precisam de `credentials: 'include'` (no fetch) ou `withCredentials: true` (no axios). Sem isso, o navegador não envia nem grava o cookie.
- O refresh token é trocado a cada uso. Cada chamada ao refresh invalida o cookie anterior e grava um novo. Por isso:
  - Só pode existir um refresh em andamento por vez. Se várias requisições recebem `401` ao mesmo tempo, todas esperam o mesmo refresh, em vez de cada uma chamar o seu. Dois refresh simultâneos com o mesmo cookie fazem um deles falhar com `401`, e a sessão daquela aba cai.
  - Com várias abas abertas, o cookie é compartilhado entre elas. Para evitar que duas abas façam refresh no mesmo instante, use `navigator.locks.request('refresh', ...)` em volta do refresh.
- Não existe rota "quem sou eu". Os dados do User logado (id, Name e Nickname) vêm do próprio access token. Decodifique o payload do JWT (base64 da segunda parte) e leia `sub` (id), `name`, `nickname` e `exp`. Não é preciso validar a assinatura no cliente.

### Contratos

`POST /users` (cadastro, sem autenticação)

- Corpo: `{ name, nickname, email, password }`.
- `201`: `{ id, name, nickname, status }`. O cadastro não faz login: depois dele, chame o login.
- `400`, com a primeira mensagem de validação. As regras, para validar também no formulário:
  - Name: 3 a 255 caracteres; só letras (com ou sem acento), espaço, hífen e apóstrofo; começa e termina com letra; sem emojis. Espaços repetidos viram um só.
  - Nickname: 3 a 50 caracteres; só letras, números, `_` e `.`; começa com letra ou número; não termina com `.`; não tem `..`.
  - Email: formato válido, até 255 caracteres, sem emojis.
  - Senha: 6 a 15 caracteres, com ao menos uma letra maiúscula, uma minúscula, um número e um símbolo, sem emojis.
- `409`: "E-mail já cadastrado" ou "Nickname já cadastrado". A comparação não diferencia maiúsculas.

`POST /auth/login`

- Corpo: `{ email, password }`.
- `200`: `{ accessToken }`, com o cookie `refreshToken` gravado.
- `400`: "E-mail inválido", "Senha é obrigatória" ou "Senha deve ter no máximo 15 caracteres".
- `401`: "Credenciais inválidas". O mesmo erro vale para User Deactivated.

`POST /auth/refresh`

- Sem corpo. Usa o cookie.
- `200`: `{ accessToken }`, com um cookie novo gravado.
- `401`: "Token inválido". Acontece sem cookie, com cookie vencido ou já usado, depois de um logout ou com o User Deactivated. O cookie é apagado, e o cliente deve ir para a tela de login.

`POST /auth/logout`

- Sem corpo e sem Bearer. Usa o cookie.
- `204`, sempre, mesmo sem cookie. A rota encerra só a sessão deste navegador e apaga o cookie.
- O access token continua válido até expirar. Ao sair, descarte-o da memória e feche o WebSocket.

### Telas e funcionalidades

- [ ] Inicialização da aplicação: chamar `POST /auth/refresh`. Com `200`, a sessão está restaurada; guarde o access token e abra a lista de Chats. Com `401`, mostre o login. Isso faz o usuário continuar logado depois de recarregar a página.
- [ ] Tela de cadastro, com validação dos campos no formulário seguindo as regras acima e exibição das mensagens da API (`400` e `409`). Depois do `201`, fazer o login com o mesmo email e senha.
- [ ] Tela de login. Em caso de `401`, mostrar "Credenciais inválidas".
- [ ] Cliente HTTP:
  - envia o Bearer em toda rota autenticada;
  - ao receber `401` numa rota autenticada, faz um refresh (único, compartilhado) e repete a requisição uma vez;
  - se o refresh falhar, limpa o estado e vai para o login.
- [ ] Renovação proativa: antes do `exp` do access token (por exemplo, 1 minuto antes), fazer o refresh, para o WebSocket e as requisições não esbarrarem em token vencido.
- [ ] Logout: chamar `POST /auth/logout`, limpar o estado, fechar o WebSocket e voltar ao login.
- [ ] Respostas `429` ("Muitas requisições. Tente novamente mais tarde.") e `5xx` ganham uma mensagem genérica de erro.

## Fase 2: lista de Chats

### Contratos

`GET /chats?search=&cursor=&limit=`

- `search`: opcional. Vazio lista tudo; senão precisa de ao menos 2 caracteres (letras e números) e no máximo 100. Busca pelo title do Group e pelo Name ou Nickname do outro Participant do Direct Chat, por prefixo de palavra.
- `cursor`: o `nextCursor` da página anterior. `limit`: de 1 a 100, padrão 20.
- `200`:

  ```json
  {
    "data": [
      {
        "id": "uuid",
        "isGroup": false,
        "displayName": "Bruno Lima",
        "readOnly": false,
        "lastMessage": { "id": "uuid", "content": "até 100 caracteres", "sender": { "id": "uuid", "name": "Ana Souza" } }
      }
    ],
    "nextCursor": "uuid ou null"
  }
  ```

- `displayName` é o title no Group e o Name do outro Participant no Direct Chat.
- `lastMessage` é `null` num Chat sem Messages. O `content` vem truncado em 100 caracteres.
- A ordem é pela Last Message mais recente. Um Chat vazio entra pela data de criação.
- `400`: "Busca deve ter no mínimo 2 caracteres", "Busca deve ter no máximo 100 caracteres", "Cursor inválido" ou mensagens de limite.

### Funcionalidades

- [ ] Lista de Chats com rolagem infinita (`nextCursor`). Para cada Chat: `displayName`, prévia da Last Message com o nome do Sender ("Você" quando o Sender é o User logado) e indicação de Read-only.
- [ ] Campo de busca com debounce. A busca só é enviada com 2 caracteres ou mais. Ao limpar, volta à lista completa.
- [ ] Estado vazio, para quando o User ainda não tem Chats.
- [ ] Atualização em tempo real (detalhes na fase 5):
  - `chat.created` coloca o Chat no topo da lista;
  - `message.published` atualiza a prévia e move o Chat para o topo;
  - se o `chatId` do evento ainda não estiver carregado, busque o Chat com `GET /chats/:id` e coloque-o no topo.

## Fase 3: iniciar Chats

### Contratos

`GET /users?search=&cursor=&limit=`

- `search`: obrigatório, de 2 a 100 caracteres. Busca por Name e Nickname, por prefixo de palavra.
- `200`: `{ data: [{ id, name, nickname, status }], nextCursor }`. Nunca devolve o próprio User nem Users Deactivated.
- `400`: "Busca é obrigatória", "Busca deve ter no mínimo 2 caracteres" e afins.

`POST /chats/direct`

- Corpo: `{ participantId }`.
- `201`: Direct Chat criado. `200`: o Direct Chat já existia (get-or-create). O corpo das duas respostas é o mesmo `Chat`:

  ```json
  {
    "id": "uuid",
    "isGroup": false,
    "title": null,
    "createdBy": "uuid",
    "createdAt": "ISO",
    "readOnly": false,
    "participants": [{ "id": "uuid", "name": "Ana Souza", "nickname": "ana" }]
  }
  ```

  Os `participants` vêm em ordem alfabética de Name e incluem o próprio User.
- `400`: "Participant inválido" ou "Não é possível incluir a si mesmo".
- `404`: "Usuário não encontrado". Acontece com User inexistente ou com User Deactivated sem Direct Chat anterior. Se o Direct Chat com o User Deactivated já existia, a resposta é `200`, com o Chat Read-only.

`POST /chats/groups`

- Corpo: `{ title, participantIds }`. O `participantIds` traz de 2 a 49 Users, sem o próprio User, que entra sozinho como Initiator. O Group fica com 3 a 50 Participants.
- O title tem de 1 a 100 caracteres, sem quebras de linha nem tabulação. Espaços nas pontas são removidos e espaços repetidos viram um só.
- `201`: `Chat` com `isGroup: true`.
- `400`: "Título é obrigatório", "Título deve ter no máximo 100 caracteres", "Título não pode conter quebras de linha ou tabulações", "Group deve ter de 3 a 50 Participants", "Participants repetidos" ou "Participant inválido".
- `404`: "Usuário não encontrado", quando algum User não existe ou está Deactivated.

### Telas e funcionalidades

- [ ] Nova conversa: busca de Users com rolagem infinita. Ao escolher um User, chamar `POST /chats/direct` e abrir o Chat devolvido, seja `201` ou `200`.
- [ ] Novo Group: campo de title e seleção de 2 a 49 Users pela mesma busca. O botão de criar só fica habilitado com o title preenchido e com a quantidade certa de Users. Depois do `201`, abrir o Group.
- [ ] Os Chats criados aparecem para os outros Participants pelo evento `chat.created`. Quem cria não precisa esperar o evento: já tem o Chat na resposta.

## Fase 4: Chat aberto e Messages

### Contratos

`GET /chats/:id`

- `200`: o `Chat` (mesmo formato da fase 3), com a lista de Participants.
- `404`: "Chat não encontrado", quando o Chat não existe ou o User não é Participant. `400`: "Chat inválido".

`GET /chats/:id/messages?cursor=&limit=`

- `limit`: de 1 a 100, padrão 20.
- `200`: `{ data: [{ id, content, createdAt, sender: { id, name } }], nextCursor }`, da Message mais recente para a mais antiga. Toda Message do histórico já é Persisted.
- `404`: "Chat não encontrado". `400`: "Chat inválido" ou "Cursor inválido".
- Um Chat Read-only continua com o histórico disponível.

`POST /chats/:id/messages`

- Corpo: `{ content }`, de 1 a 1000 caracteres sem contar os espaços nas pontas.
- `201`: `{ id, createdAt }`. A Message foi aceita pelo broker (Published). Ela ainda não está gravada no histórico.
- Erros:
  - `400`: "Chat inválido", "Mensagem é obrigatória" ou "Mensagem deve ter no máximo 1000 caracteres";
  - `401`: "Token inválido", quando o Sender foi desativado;
  - `403`: "Chat somente leitura";
  - `404`: "Chat não encontrado";
  - `503`: "Não foi possível enviar a mensagem, tente novamente". Nada foi gravado, então o reenvio é seguro.

### Telas e funcionalidades

- [ ] Tela do Chat:
  - cabeçalho com o `displayName` (Name do outro Participant no Direct Chat, title no Group);
  - no Group, acesso à lista de Participants, que vem do `GET /chats/:id`.
- [ ] Histórico com rolagem para cima carregando páginas antigas (`nextCursor`), mantendo a posição da rolagem ao inserir as Messages antigas.
- [ ] Messages do próprio User e dos outros com aparência diferente. No Group, mostre o Name do Sender.
- [ ] Campo de envio com contador ou limite de 1000 caracteres. O botão fica desabilitado com o campo vazio ou só com espaços.
- [ ] Chat Read-only: o campo de envio fica desabilitado, com um aviso de que o outro Participant foi desativado. O histórico continua visível. Se o `POST` responder `403`, marque o Chat como Read-only.
- [ ] Message Status, visível só para o Sender e só nas Messages que ele acabou de enviar:
  - Pending: do clique em enviar até a resposta do `POST`. A Message aparece na hora, com um id temporário do cliente.
  - Published: depois do `201`. Troque o id temporário pelo `id` da resposta e use o `createdAt` da resposta.
  - Persisted: quando chega o evento `message.persisted` com esse `id`.
  - As Messages carregadas do histórico não mostram status.
- [ ] Falha no envio (`503`, erro de rede ou `5xx`): a Message que estava Pending fica marcada como não enviada, com opção de reenviar ou descartar. O backend não define essa interface: ela é uma decisão do frontend.

## Fase 5: tempo real (WebSocket)

### Protocolo

- Conexão: `new WebSocket('ws://localhost:3001?token=' + accessToken)`. Sem token, ou com token inválido, a conexão é recusada com `401` e o evento `close` dispara sem abrir.
- Quando o access token expira, o servidor fecha a conexão com o código `4001` ("Token expirado"). O cliente faz o refresh e reconecta com o token novo.
- Toda mensagem recebida é um JSON `{ "type": "<evento>", "data": { ... } }`:

| type | data | Quem recebe |
|---|---|---|
| `chat.created` | `{ chat: Chat }` (mesmo formato do `POST /chats/direct`) | todos os Participants do Chat novo |
| `message.published` | `{ message: { id, chatId, content, createdAt, sender: { id, name } } }` | todos os Participants, inclusive o Sender |
| `message.persisted` | `{ message: { id, chatId } }` | só o Sender |

- O servidor não guarda eventos de quem está desconectado. O que acontece com o User offline não chega depois pelo WebSocket.

### Funcionalidades

- [ ] Abrir a conexão depois do login (ou da restauração da sessão) e fechar no logout.
- [ ] Reconexão:
  - no fechamento com `4001`, fazer o refresh e reconectar;
  - em quedas de rede ou de servidor, reconectar com espera crescente (por exemplo 1s, 2s, 4s, até 30s).
- [ ] Depois de cada reconexão, recarregar a primeira página da lista de Chats e as Messages mais recentes do Chat aberto. Isso recupera o que chegou enquanto a conexão estava fora.
- [ ] `chat.created`: inserir o Chat no topo da lista, sem duplicar se ele já estiver lá. Calcular o `displayName` como na lista: title no Group, Name do outro Participant no Direct Chat.
- [ ] `message.published`:
  - se o Chat estiver aberto, acrescentar a Message no fim do histórico;
  - em qualquer caso, atualizar a prévia da Last Message e mover o Chat para o topo da lista;
  - não duplicar Messages: use o `id` como chave. O Sender também recebe a própria Message por aqui, e ela pode chegar antes da resposta do `POST`. Quando a resposta chegar com um `id` que já está na lista, descarte a cópia Pending e mantenha uma só. Se a Message do evento é do próprio User e ainda não está na lista, ela pode ter sido enviada por outra aba ou aparelho: mostre-a normalmente.
- [ ] `message.persisted`: marcar a Message com esse `id` como Persisted. Se o evento chegar antes da resposta do `POST`, guarde o `id` e aplique o status quando a Message receber esse `id`.
- [ ] Indicação discreta de "conectando" ou "sem conexão" enquanto o WebSocket estiver fechado.

## Fora do escopo do backend atual

O frontend não deve oferecer estas funcionalidades, porque a API não tem suporte:

- editar ou apagar Messages;
- adicionar ou remover Participants, renomear Group;
- busca de Messages dentro de um Chat (adiada no backend);
- confirmação de leitura, "digitando" e presença (online/offline);
- editar perfil, trocar senha, desativar a conta;
- "sair de todos os aparelhos".

## Pontos do backend que afetam o frontend

- O rate limit da API é de 100 requisições a cada 15 minutos por IP, para todas as rotas juntas. Com rolagem infinita, busca e envio de Messages, esse limite estoura rápido. Antes de usar o frontend de verdade, esse valor precisa ser revisto no backend (`rate-limit.config.ts`).
- O `Secure` do cookie só é ligado com `ENVIRONMENT=production`. Em produção, a API e o frontend precisam estar em HTTPS.
- O Redis falha em silêncio: se ele estiver fora do ar no login, a sessão não é gravada, e o refresh seguinte responde `401`. Para o frontend, isso aparece como "fui deslogado" e se resolve com um novo login.
