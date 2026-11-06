---
name: Flash Chat
description: Mensageiro em tempo real, preto e branco, sério e minimalista.
colors:
  ink: "#000000"
  paper: "#ffffff"
  canvas: "#f5f5f5"
  wash: "#f0f0f0"
  graphite: "#5c5c5c"
  hairline: "#e3e3e3"
typography:
  headline:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  body-sm:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  caption:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  micro:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
rounded:
  control-inner: "6px"
  control: "8px"
  card: "12px"
  bubble: "18px"
  bubble-tail: "4px"
  composer: "22px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 20px"
  button-soft:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 14px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 14px"
  button-icon:
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "40px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
  bubble-own:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.bubble}"
    padding: "8px 14px"
  bubble-other:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "8px 14px"
  list-item-active:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
---

# Design System: Flash Chat

## Overview

Creative North Star: "O Caderno de Recados". Papel branco, tinta preta e nada mais. A interface é o suporte das Messages e some atrás delas: a única massa escura forte numa tela de Chat é o que o próprio User escreveu e o botão que envia.

Densidade média, no formato de mensageiro clássico: barra de navegação estreita, lista de Chats, Chat aberto com balões. Sem cor, a hierarquia vem do peso da fonte (400, 500, 600), do cinza do texto secundário e das superfícies brancas sobre o fundo cinza claro. A paleta pastel da imagem de referência foi descartada; dela só vale a estrutura.

Key Characteristics:
- Monocromático puro: preto, branco e quatro cinzas neutros, sem matiz.
- Plano: profundidade por borda fina e troca de superfície, não por sombra.
- Estado nunca depende de cor: erro é borda, ícone e texto.
- Movimento mínimo: só a resposta física do clique e transições de cor curtas.

## Colors

Uma tinta e um papel, com cinzas neutros só para separar camadas e rebaixar texto secundário.

### Primary
- Tinta (#000000): texto principal, balão próprio, botão primário, botão de enviar, marca, barra de seleção de 2px, anel de foco e contorno de erro. É também o token `inverse` quando vira preenchimento.

### Neutral
- Papel (#ffffff): superfícies de trabalho (barra de navegação, lista, cabeçalhos, composer, cards, balão dos outros) e texto sobre a tinta.
- Tela (#f5f5f5): fundo da página atrás das superfícies; aparece na área das Messages e em volta do card de login.
- Lavado (#f0f0f0): hover, item selecionado, trilho das abas, botão soft e um dos dois tons de avatar.
- Grafite (#5c5c5c): texto secundário, placeholders, horários, ícones em repouso. Contraste de 6,4:1 sobre papel.
- Fio (#e3e3e3): bordas de 1px, divisórias, separador de dia, contorno do balão dos outros.

### Named Rules
The Own Ink Rule. Preenchimento preto sólido é reservado para o que é do User ou para a ação principal da tela: balão próprio, enviar, botão primário, marca. Avatar, selo, contador ou decoração nunca usam preto sólido.

The No Hue Rule. Nenhuma cor com matiz entra na interface, nem para erro, sucesso ou aviso. Se um estado precisa de destaque, ele usa borda preta, ícone e texto.

## Typography

Body Font: Instrument Sans (com system-ui, sans-serif), carregada pelo `next/font`.

Character: uma grotesca única, neutra e um pouco estreita, que funciona em tamanho de interface. Pesos só 400, 500 e 600; nada de bold pesado.

### Hierarchy
- Headline (600, 22px, -0.02em): título da lista (Conversas, Grupos) e título das telas de login e cadastro.
- Title (600, 18px): nome do Chat no cabeçalho, título de tela de criação, título de diálogo e de painel.
- Body (400, 15px, 1.4): texto das Messages, inputs e composer.
- Body Small (400, 14px): prévia da Last Message, Nickname, descrições.
- Label (500, 14px ou 15px): nomes na lista, labels de campo, texto de botão.
- Caption (500, 12px): separador de dia, horário na lista, ajuda de campo.
- Micro (500, 11px): horário e Message Status dentro do balão, rótulos da barra de navegação.

### Named Rules
The Weight Not Size Rule. Hierarquia dentro de um bloco se resolve com peso e cinza, não com tamanhos novos. A escala acima é fechada.

## Layout

Três colunas no computador: barra de navegação de 72px, lista de Chats com 360px e o Chat aberto ocupando o resto. Abaixo de `md` (768px) a barra de navegação some, a lista vira tela cheia com abas no topo e o Chat abre por cima dela, um de cada vez, com botão de voltar no cabeçalho.

Cabeçalhos de painel têm 80px de altura e borda inferior. A área das Messages tem padding lateral de 12px no celular e 32px no computador; balões ocupam no máximo 78% da largura. Messages seguidas do mesmo Sender ficam a 4px; uma troca de Sender ou de dia abre 12px.

Ritmo de espaçamento em múltiplos de 4px. Gutters internos de 16px a 24px nos painéis e 12px nos itens de lista.

## Elevation & Depth

O sistema é plano. Camadas se separam por troca de superfície (papel sobre tela) e por borda de 1px no tom fio. A única sombra é a do painel de Participants, que desliza por cima do Chat: `-16px 0 40px -24px rgb(0 0 0 / 0.25)`. O diálogo de confirmação usa só o backdrop preto a 30%.

### Named Rules
The Flat By Default Rule. Nenhuma superfície em repouso tem sombra. Sombra só aparece num painel que se sobrepõe ao conteúdo.

## Shapes

Raio cresce com a hierarquia do objeto: controles a 8px (com o item interno das abas a 6px), cards e diálogos a 12px, balões a 18px com o canto do lado do Sender a 4px, composer a 22px, avatares e botões de ícone redondos. Checkbox de seleção de Participant a 5px.

Bordas são sempre de 1px. Message com falha troca a borda sólida por contorno tracejado preto.

## Components

### Buttons
- Shape: cantos de 8px; botões de ícone redondos (40px, ou 32px no tamanho pequeno).
- Primary: preenchimento tinta, texto papel, altura 44px (ou 36px no tamanho pequeno), peso 500.
- Hover / Focus: primário clareia para 85% de opacidade; soft vai para o tom fio; outline escurece a borda para tinta. Foco visível com contorno de 2px em tinta e 2px de afastamento.
- Active: encolhe para 0,97 com a curva `cubic-bezier(0.23, 1, 0.32, 1)` em 150ms.
- Soft, Outline, Ghost: soft em lavado, outline em papel com borda fio, ghost sem fundo e lavado no hover.
- Disabled: opacidade 40%, sem eventos de ponteiro.

### Inputs / Fields
- Style: papel, borda fio de 1px, cantos de 8px, altura 44px, texto de 15px.
- Focus: a borda passa para tinta, sem halo.
- Error: borda tinta, `CircleAlert` de 14px e texto do erro abaixo do campo, ligado por `aria-describedby`.
- Composer: cápsula de 22px que cresce com o conteúdo até 160px; contador de caracteres aparece só perto do limite.

### Navigation
- Barra lateral de 72px em papel, com marca no topo, itens de ícone sobre rótulo de 11px e, no pé, avatar do User e botão de sair.
- Item ativo em tinta com barra de 2px à esquerda; inativo em grafite, tinta no hover.
- No celular, abas segmentadas em trilho lavado: a ativa vira papel.

### List Items
- Linha com avatar de 48px, nome em peso 500, horário em caption à direita e prévia em uma linha truncada.
- Hover em lavado a 60%; ativo em lavado com a barra preta de 2px à esquerda.
- Chat Read-only leva um cadeado de 14px em grafite ao lado do nome.

### Message Bubble (signature component)
- Própria: tinta, à direita, canto inferior direito a 4px, horário e Message Status em papel a 65%.
- Dos outros: papel com borda fio, à esquerda, canto inferior esquerdo a 4px. No Group, avatar de 32px e Name do Sender em 13px peso 600 no primeiro balão da sequência.
- Message Status só nas próprias: relógio (Pending), um check (Published), dois checks (Persisted), alerta (falha).
- Falha: balão papel com contorno tracejado tinta e, abaixo, "Não enviada" com as ações Reenviar e Descartar.

### Avatar
- Iniciais em peso 500, sem foto. Dois tons fixos por id: lavado ou papel com anel fio. Group é papel com anel tinta e o ícone de pessoas.

## Do's and Don'ts

### Do:
- Do usar tinta sólida só no que é do User ou na ação principal (The Own Ink Rule).
- Do comunicar erro com borda tinta, ícone `CircleAlert` e texto, nunca com cor.
- Do manter a escala tipográfica fechada e resolver hierarquia com peso 500 ou 600 e grafite.
- Do separar camadas com papel sobre tela e bordas de 1px no tom fio.
- Do usar a curva `cubic-bezier(0.23, 1, 0.32, 1)` e durações de 150ms nas transições de estado.

### Don't:
- Don't usar qualquer cor com matiz, inclusive vermelho de erro ou verde de sucesso.
- Don't usar peso 700 ou maior.
- Don't colocar sombra em superfície em repouso; a exceção é o painel de Participants.
- Don't animar a entrada de itens de lista ou de balões.
- Don't mostrar recursos que a API não tem: chamadas, vídeo, anexos, emojis, contador de não lidas, presença, confirmação de leitura, foto de perfil.
- Don't preencher avatar, selo ou decoração com tinta sólida.
