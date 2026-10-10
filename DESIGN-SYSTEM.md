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
