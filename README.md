# Volta ao mundo

Jogo de bandeiras em português. Cinco países distintos por rodada, respostas digitadas e pontuação de 0 a 5.

## Como abrir

Dê dois cliques em **index.html** para abrir no navegador. Mantenha os arquivos e a pasta **assets** juntos. Não precisa instalar nada, iniciar servidor ou ter internet.

O primeiro campo já recebe o cursor ao abrir. Clique diretamente em qualquer campo para digitar, use Tab ou Enter para avançar e clique em **Conferir respostas** (ou pressione Enter no último campo). Respostas vazias contam como erro. A rodada termina após a conferência; clique em **Nova rodada** para jogar novamente.

Aceita nomes em português, sem diferenciar acentos, maiúsculas ou espaços extras. Também aceita variantes cadastradas, como EUA, Holanda e República Tcheca. Não usa correção aproximada: países com nomes parecidos continuam distintos.

## Catálogo e imagens

`countries.js` contém os 193 membros da ONU e os dois Estados observadores, Palestina e Vaticano. Cada registro inclui código ISO, nome, respostas aceitas e caminho da imagem. Não inclui territórios dependentes ou outros Estados.

As bandeiras SVG são da coleção [flag-icons](https://github.com/lipis/flag-icons), versão 7.3.2, sob licença MIT, preservada em `assets/flags/LICENSE.txt`. As imagens usam o formato 4:3 da coleção, que padroniza algumas proporções originais. Todas ficam no projeto; nenhum recurso externo é carregado durante o jogo.

## Design system

Abra `design-system.html` para ver cores, tipografia, espaçamentos e componentes. Os tokens e controles compartilhados estão em `design-system.css`; decisões e regras de uso estão em `DESIGN-SYSTEM.md`. O jogo usa essa mesma base visual.

Referência atual: Monkeytype / Serika Dark. O código fonte completo baixado está na pasta `design system`, com a licença original preservada. Essa pasta é somente referência; o jogo usa a fonte local em `assets/fonts` e não precisa executar ou instalar o Monkeytype.

No GitHub, essa referência é um submódulo fixado na versão utilizada. Para baixar também o código do Monkeytype, clone este projeto com `git clone --recurse-submodules <URL-do-repositório>`. Em uma cópia já clonada, execute `git submodule update --init`. O jogo funciona mesmo sem baixar o submódulo.

## Verificação e manutenção

Com Node.js disponível, execute `node --test tests/game.test.cjs` para verificar catálogo, imagens, normalização, sorteio e pontuação.

`node scripts/download-flags.cjs` baixa novamente as bandeiras e a licença. Esse comando exige internet e serve apenas para manutenção; não é necessário para jogar.
