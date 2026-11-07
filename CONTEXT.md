# Flash Chat

Chat em tempo real entre usuários cadastrados: um usuário encontra outros usuários, inicia chats com eles e troca mensagens que são entregues na hora e persistidas de forma assíncrona.

## Language

### Pessoas

**User**:
Pessoa cadastrada no Flash Chat, que pode ser encontrada por outros usuários e participar de chats. Existe independentemente de participar de algum chat. Entra no sistema com email e senha, que são privados. Pode editar o próprio Name, Nickname, email e senha, sempre confirmando a senha atual e seguindo as mesmas regras do cadastro. Trocar email ou senha não encerra as sessões já abertas.
_Avoid_: Conta, cliente, membro

**Active / Deactivated**:
Situação da conta de um User. Só um User Active consegue entrar no sistema. Um User Deactivated não aparece na busca e não pode ser incluído em novos Chats. A desativação não tem volta, e o email e o Nickname de um User Deactivated continuam ocupados: ninguém mais pode usá-los. Só o próprio User desativa a conta, confirmando a senha atual. Os Participants dos Chats dele ficam sabendo na hora, e ele perde o acesso em todas as abas abertas.
_Avoid_: Status (sozinho), bloqueado, banido, online/offline

**Nickname**:
Identificador público e único de um User. É por ele que outros Users encontram e reconhecem alguém sem ambiguidade.
_Avoid_: Username, handle, apelido, login

**Name**:
Nome de exibição de um User. Não é único.
_Avoid_: Nome completo, display name

**Participant**:
Um User na condição de integrante de um Chat específico. O mesmo User é Participant de cada Chat de que faz parte.
_Avoid_: Membro, integrante

### Conversas

**Chat**:
Conversa entre dois ou mais Participants. Um Chat sempre tem pelo menos dois Participants, definidos na criação e imutáveis depois: ninguém entra nem sai. Existe antes da primeira Message e aparece para todos os Participants assim que é criado, mesmo vazio.
_Avoid_: Conversa, sala, canal, thread

**Direct Chat**:
Chat com exatamente dois Participants. Continua sendo Direct Chat para sempre e nunca vira Group. Existe no máximo um Direct Chat por par de Users: iniciar uma conversa com quem já se tem um Direct Chat abre esse mesmo Chat. Não tem título: cada Participant o identifica pelo nome do outro.

**Read-only**:
Um Direct Chat em que um dos Participants está Deactivated. Ele continua na lista de Chats e pode ser aberto, com o histórico visível, mas não aceita novas Messages. Não é possível iniciar um Direct Chat novo com um User Deactivated; se o Direct Chat já existia, iniciá-lo de novo abre o existente. Groups nunca ficam Read-only: os Participants Active continuam conversando.
_Avoid_: Arquivado, bloqueado, congelado
_Avoid_: DM, conversa privada, 1:1

**Group**:
Chat de 3 a 50 Participants, criado explicitamente como Group. Tem um título obrigatório, definido na criação. O mesmo conjunto de Users pode ter vários Groups. Não existe dono nem admin: todos os Participants são iguais.

**Initiator**:
O Participant que criou o Chat. É só uma informação, usada para contar quem iniciou a conversa, e não dá nenhum privilégio sobre o Chat.
_Avoid_: Criador, dono, owner, admin
_Avoid_: Grupo de chat, sala

### Mensagens

**Message**:
Conteúdo enviado por um único User em um único Chat. Recebe identidade e horário no momento do envio, antes de ser publicada. O conteúdo tem de 1 a 1000 caracteres, sem contar os espaços nas pontas. Depois de Persisted, só o Sender pode editar ou apagar a Message, e só num Chat que não esteja Read-only. Não existe histórico de versões nem prazo para a mudança.
_Avoid_: Mensagem de chat, post

**Message Status**:
Etapa em que uma Message está no caminho até o histórico: Pending → Published → Persisted. Só o Sender vê. Os demais Participants só recebem Messages já Published e não veem status nenhum. É acompanhado em tempo real e não é guardado junto com a Message.
_Avoid_: Estado de leitura, visto

**Pending**:
Message Status de uma Message que o Sender enviou e que ainda não foi confirmada pelo broker de mensagens. Só existe no lado do Sender.
_Avoid_: Enviada, sent

**Published**:
Message Status de uma Message aceita e confirmada pelo broker de mensagens. Uma Message só é entregue aos Participants depois de Published.
_Avoid_: Enviada, salva

**Persisted**:
Message Status de uma Message gravada no histórico do Chat. Acontece de forma assíncrona, depois de Published. Toda Message do histórico é Persisted.
_Avoid_: Salva, armazenada

**Content Status**:
Situação do conteúdo de uma Message: Original, Edited ou Deleted. Fica guardado junto com a Message e todos os Participants veem. É independente do Message Status.
_Avoid_: Status (sozinho), versão

**Original**:
Content Status de uma Message que nunca foi editada nem apagada.

**Edited**:
Content Status de uma Message cujo conteúdo o Sender trocou. Guarda só o conteúdo atual e o horário da última edição. Uma Message Edited ainda pode ser editada de novo ou apagada.
_Avoid_: Alterada, modificada

**Deleted**:
Content Status de uma Message que o Sender apagou. A Message continua no histórico, na mesma posição, mas sem conteúdo, e não pode mais ser editada nem apagada. Se for a Last Message, o Chat mantém a posição na lista.
_Avoid_: Removida, excluída

**Delivery**:
Envio em tempo real de uma Message Published aos Participants conectados do Chat.
_Avoid_: Broadcast, push, envio

**Last Message**:
A Message Persisted mais recente de um Chat. Define a posição do Chat na lista do User: quem tem atividade mais recente aparece no topo, e um Chat vazio usa o momento da criação.
_Avoid_: Última atividade, preview

**Sender**:
O User que enviou uma Message. Toda Message tem exatamente um Sender.
_Avoid_: Autor, remetente, owner
