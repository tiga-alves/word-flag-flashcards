# Design system — referência Monkeytype

O jogo usa como referência o [Monkeytype](https://github.com/monkeytypegame/monkeytype), com o tema Serika Dark, fonte Roboto Mono e controles discretos. A implementação do jogo continua em HTML, CSS e JavaScript locais, sem instalação ou servidor.

## Código fonte baixado

O repositório completo, com histórico raso, está na pasta **design system**. Origem: https://github.com/monkeytypegame/monkeytype. Commit baixado: `cbaa65cce81a95eb753308cece40ea8c34a20787`.

A licença original GPL-3.0 foi preservada em `design system/LICENSE`. Nenhuma dependência do Monkeytype foi instalada e nenhum script do repositório foi executado. A pasta serve para consulta; o jogo não depende dela em tempo de execução.

Arquivos consultados:

- `design system/frontend/storybook/stories/storybook-theme.css`: valores do tema Serika Dark.
- `design system/frontend/src/styles/core.scss`: fonte, raio e organização do layout.
- `design system/frontend/src/styles/inputs.scss` e `buttons.scss`: campos escuros, caret, estados e transições discretas.

Os componentes locais foram escritos para o jogo, sem importar o aplicativo Monkeytype. A fonte Roboto Mono Regular foi copiada para `assets/fonts`, com a licença SIL OFL preservada em `assets/fonts/OFL.txt`.

## Direção visual

Fundo grafite, texto claro e destaque amarelo. Sem hero de marketing, menus ou decoração adicional. Cinco bandeiras em cores originais, cada uma com um campo diretamente editável. Uma ação principal por etapa: Conferir respostas, depois Nova rodada.

## Tokens

| Uso | Token | Valor |
| --- | --- | --- |
| Fundo | `--ds-bg` | `#323437` |
| Superfície e campos | `--ds-surface` | `#2c2e31` |
| Texto | `--ds-text` | `#d1d0c5` |
| Texto secundário | `--ds-text-secondary` | `#b0b2b5` |
| Placeholder | `--ds-text-muted` | `#a3a5a8` |
| Ação e caret | `--ds-action` | `#e2b714` |
| Hover da ação | `--ds-action-hover` | `#d1d0c5` |
| Foco | `--ds-focus` | `#e2b714` |
| Borda neutra | `--ds-border` | `#646669` |
| Divisores | `--ds-divider` | `#484b50` |
| Acerto | `--ds-success-700` | `#91c795` |
| Erro | `--ds-error-700` | `#f0838e` |

Fundo, superfície, destaque, texto e raio vêm da referência consultada. Placeholders e resultados foram clareados para melhorar o contraste sobre o fundo escuro. Não usar o cinza discreto original para textos essenciais. A escala primitiva `--ds-gray-*` permanece disponível para consulta; o jogo usa os tokens semânticos.

## Tipografia e espaçamento

Roboto Mono Regular local, com alternativas Consolas e monospace. Título do jogo em 24 px; respostas e instrução em 16 px; ajuda em 14 px; feedback curto em 12 px. Sem fontes externas durante o jogo.

Espaçamento em múltiplos de 4 px. Gaps de 24 px no desktop; 16–24 px no celular. Container de 1120 px; margens de 32 px no desktop e 16–24 px no celular. Cinco colunas no desktop e duas abaixo de 760 px.

Campos e botões com altura mínima de 48 px, raio de 8 px e sem sombras. Campos escuros sem borda aparente em repouso, com foco amarelo visível. Bandeiras preservam a proporção e cores dos arquivos locais.

## Componentes

| Componente | Classe | Estados |
| --- | --- | --- |
| Ação principal | `.ds-button` | padrão, hover, foco, disabled |
| Ação secundária | `.ds-button.ds-button--secondary` | padrão, hover, foco, disabled |
| Campo | `.ds-input` | editável, foco, disabled, sucesso, erro |
| Label | `.ds-label` | associado por `for` e `id` |
| Ajuda | `.ds-help` | neutra, `--success`, `--error` |
| Painel opcional | `.ds-panel` | agrupamento discreto |
| Status | `.ds-badge` | neutro, `--success`, `--error` |

Carregar `design-system.css` antes de `styles.css`. Os controles compartilhados ficam no primeiro; layout e resultados específicos do jogo, no segundo. Abra `design-system.html` para consultar os exemplos.

## Interação e acessibilidade

O cursor começa no primeiro campo. Tab segue a ordem visual. Enter avança entre campos e, no último, confere a rodada. Não há checkbox ou etapa de ativação. Após conferir, a única ação principal visível é Nova rodada, que recebe o foco.

Labels visualmente ocultos continuam associados aos campos. Foco de 2 px com afastamento de 3 px. Feedback inclui texto além de cor, e a pontuação é anunciada por `role="status"`. Transições respeitam movimento reduzido. O jogo permanece offline e sem API externa.

## Atualização do jogo: tema claro e teclado

A página do jogo agora sobrescreve os tokens em `styles.css`: fundo #f7f5ef, texto #292a27, destaque #926b07 e acerto #28653c. A página de exemplos preserva a referência original escura.

Cinco bandeiras compactas compartilham um único conjunto de letras, com largura máxima de 650 px. Um campo nativo transparente recebe nomes em qualquer ordem, com edição pelo teclado e validação imediata, sem clicar nas letras. Acentos, espaços e hífens são opcionais. Rodadas evitam nomes em que um país seja prefixo de outro para não interromper a digitação do nome maior.

Letras usadas ficam discretas e retornam ao apagar; um acerto remove suas letras e anima a bandeira. As animações respeitam `prefers-reduced-motion`. `audio.js` sintetiza sons curtos de digitação e um acorde de acerto usando Web Audio, iniciado somente após interação, com botão para silenciar. Nenhum áudio é baixado.

## Referência visual atual: painéis claros

O jogo adota o dashboard enviado como referência: fundo cinza #daddde, painéis brancos com bordas discretas e raio de 11 px, títulos em sans-serif, texto escuro e etiquetas verdes para acertos. A área principal mantém as cinco bandeiras, letras compartilhadas e digitação sem caixa. A coluna lateral mostra progresso semicircular e descobertas da rodada; ambos acompanham os acertos e reiniciam na nova rodada. A fonte monoespaçada fica restrita às letras e à digitação. O layout vira uma coluna no celular.

## Tipografia atual

Os dois painéis de ajuda abaixo do desafio foram removidos. A interface inteira usa Inter Variable local, incluindo letras, digitação e botões, com licença SIL OFL em `assets/fonts/Inter-LICENSE.txt`. A referência tipográfica é o site da Stripe, que usa Söhne; Inter é a alternativa livre escolhida para este projeto. Nenhuma fonte remota é carregada pelo jogo.

## Interface simplificada e globo de fundo

A interface mantém marca, bandeiras, letras compartilhadas, campo de digitação e progresso da rodada. Foram removidos os rótulos auxiliares marcados na referência, título interno do desafio, card de descobertas, etiqueta de validação e botão de som. Contador e ajuda de teclado continuam disponíveis para leitores de tela.

O fundo usa um canvas decorativo local, sem receber cliques, com globo de pontos em rosa, violeta e azul. Painéis quase opacos mantêm a leitura do jogo. A animação respeita movimento reduzido e pausa em abas ocultas.

## Progresso horário e resposta livre

O título é “5 bandeiras aleatórias”. A resposta usa um único campo nativo no lugar das letras embaralhadas. Acertos mostram somente o nome do país, sem mensagem adicional no rodapé. O círculo tem cinco arcos separados, preenchidos em ordem horária independentemente da ordem das bandeiras acertadas. O centro exibe o contador /5, com transição vertical ascendente em cada incremento e retorno a zero na nova rodada.

O globo mantém rotação contínua, um gradiente violeta/lavanda e brilho de quatro pontas em cada ponto, com fases individuais. Como solicitado, a preferência de movimento reduzido suaviza a rotação e as transições, sem congelar o globo ou o contador. O canvas pausa em abas ocultas.

## Desempenho do fundo e das interações

O globo usa WebGL quando disponível: geometria pré-calculada, textura de brilhos reutilizada e uma chamada de desenho por quadro. O modo Canvas alternativo reutiliza sprites, descarta pontos fora da tela e adapta a densidade ao orçamento de desenho. A resolução do fundo é limitada a três milhões de pixels físicos; eventos de redimensionamento são agrupados e abas ocultas pausam a animação.

A digitação permanece nativa. As chaves dos países são normalizadas uma vez por rodada, e inserções ou colagens geram no máximo um toque de áudio por evento. O contador usa transform/opacity em sua própria camada; o desenho do arco leva cerca de 360 ms.

Verificação local: `node scripts/benchmark-globe.cjs` mede a renderização Canvas com `@napi-rs/canvas` do runtime de desenvolvimento. É uma comparação do componente, não uma medição de FPS ou de latência do navegador. `node scripts/build-globe-data.cjs` regenera `globe-data.js` a partir dos contornos em `assets/globe-land.json`.
