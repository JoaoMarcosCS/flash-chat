# Product

<!-- impeccable:product-schema 1 -->

Fatos marcados com (inferido) vieram do repositório e ainda não foram confirmados pelo autor.

## Platform

web

## Users

Users cadastrados que conversam em tempo real com outros Users, no computador e no celular. O trabalho deles é encontrar alguém pelo Nickname, abrir um Direct Chat ou criar um Group e trocar Messages sem esperar. (inferido)

O projeto é um estudo de arquitetura de mensageria (Next.js, NestJS, broker de mensagens, WebSocket). Quem avalia o produto também olha a qualidade da interface e o comportamento em tempo real. (inferido)

## Product Purpose

Chat em tempo real entre Users cadastrados: um User encontra outros Users, inicia Chats e troca Messages que são entregues na hora e persistidas de forma assíncrona. Sucesso é a Message aparecer para todos os Participants conectados logo após o envio, com o Sender acompanhando o caminho dela (Pending, Published, Persisted) e nenhuma Message se perder quando a conexão cai.

## Positioning

A entrega acontece antes da persistência. O Sender vê o Message Status de cada Message própria, coisa que mensageiros comuns escondem. Essa visibilidade do caminho da Message é o que distingue o produto. (inferido)

## Operating Context

- Lista de Chats separada por tipo (Direct Chats e Groups), ordenada pela Last Message, com busca.
- Chat aberto com histórico paginado para cima e Messages novas chegando pelo WebSocket.
- Criação de Direct Chat pela busca de Users e criação de Group com título e 3 a 50 Participants.
- No celular, a lista e o Chat ocupam a tela inteira, um de cada vez. O socket pode ficar suspenso com a aba em segundo plano e reconecta quando ela volta.

## Capabilities and Constraints

- Termos do domínio definidos em `../CONTEXT.md` (User, Nickname, Name, Participant, Chat, Direct Chat, Group, Read-only, Message, Message Status, Sender). A interface usa esses termos e evita os sinônimos listados lá.
- Message é imutável: de 1 a 1000 caracteres, sem edição nem exclusão.
- Participants são definidos na criação do Chat e nunca mudam. Group não tem dono nem admin.
- Direct Chat com um User Deactivated fica Read-only: abre, mostra o histórico, não aceita Messages.
- Message com falha no envio pode ser reenviada ou descartada.
- Não existem e não podem aparecer: chamadas, vídeo, Status, anexos, emojis, contador de não lidas, presença, confirmação de leitura e foto de perfil.
- Mensagens de erro da API já vêm em português.

## Brand Commitments

- Nome Flash Chat. Marca: o ícone `Zap` do lucide em branco sobre quadrado preto arredondado (`src/components/layout/brand.tsx` e `src/app/icon.svg`).
- Tom sério e minimalista. Interface em português do Brasil.

## Evidence on Hand

- Referência de layout: `Interface de Conversas em Tons Pastel.png` (só a estrutura de mensageiro clássico; a paleta pastel não vale).
- Servidor de mock em `mock/` para desenvolvimento local.
- Não há depoimentos, métricas de uso, clientes ou capturas oficiais. Nada disso deve ser inventado.

## Product Principles

- A conversa vem primeiro: nada na interface compete com as Messages.
- Estado honesto: o Sender sempre sabe se a Message saiu, chegou ao histórico ou falhou, e o que fazer quando falhou.
- Só o que a API oferece: a interface não sugere recursos que não existem.
- Funciona igual no celular, com conexão instável.

## Accessibility & Inclusion

Contraste mínimo de 4,5:1 para texto (o `muted-foreground` foi escolhido com 6,4:1 sobre branco). Estados não dependem de cor, porque a paleta é só preto e branco: erro é borda, ícone e texto. (inferido)
