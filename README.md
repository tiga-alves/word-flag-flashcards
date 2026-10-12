# Volta ao mundo

Jogo de bandeiras em português. Cinco países distintos por rodada, digitação livre e validação instantânea.

## Como abrir

Dê dois cliques em **index.html** para abrir no navegador. Mantenha os arquivos e a pasta **assets** juntos. Não precisa instalar nada, iniciar servidor ou ter internet.

Digite o nome de qualquer país das cinco bandeiras. A área de resposta mostra somente as letras digitadas; use Backspace, Delete ou seleção de texto para corrigir. Ao acertar, aparece apenas o nome sob a bandeira e o campo fica pronto para o próximo país. Acentos, espaços e hífens são opcionais. Os nomes alternativos cadastrados também são aceitos, como Qatar, Benin, Bósnia, EUA e Holanda. Se a resposta também for o começo do nome de outro país pendente, pressione Enter para confirmar ou continue digitando.

Pressione **1**, mesmo com o campo de resposta focado, ou clique em **1 Revelar todas** para mostrar de uma vez os nomes completos de todas as bandeiras ainda pendentes. Os acertos já realizados são preservados; as demais respostas ficam marcadas como reveladas e a rodada termina.

Pressione **2** ou use o botão **Shuffle**, que começa ligado e alterna entre ordem embaralhada e ordem alfabética em português. Trocar essa opção reorganiza as bandeiras atuais e preserva os acertos, as respostas reveladas e o progresso. Com shuffle desligado, a rodada de cinco bandeiras continua escolhendo cinco países aleatórios, exibidos em ordem alfabética.

Pressione **3** ou use **Reiniciar**, que fica sempre disponível e zera a rodada com os mesmos países, respeitando a opção de shuffle, sem recarregar a página. Os atalhos **2** e **3** funcionam também após concluir a rodada e com o campo de resposta focado. Segurar uma tecla não repete a ação; combinações com modificadores e composição de texto são ignoradas. **Nova rodada** inicia uma nova seleção; nos modos de continente e mundo, mantém o conjunto completo do modo.

O progresso acompanha os países completos, incluindo respostas reveladas. Na rodada aleatória, tem cinco segmentos preenchidos no sentido horário e um contador de 0/5 até 5/5. Ao completar a rodada, o resumo separa os acertos e as respostas reveladas. Clique em **Nova rodada** para jogar novamente.

O globo roxo de pontos gira ao fundo com brilhos individuais. A preferência por movimento reduzido diminui a velocidade, sem desligar a animação solicitada; abas ocultas pausam a renderização. Sons e todos os recursos funcionam offline.

## Catálogo e imagens

`countries.js` contém os 193 membros da ONU e os dois Estados observadores, Palestina e Vaticano. Cada registro inclui código ISO, nome, respostas aceitas e caminho da imagem. Não inclui territórios dependentes ou outros Estados.

As bandeiras SVG são da coleção [flag-icons](https://github.com/lipis/flag-icons), versão 7.3.2, sob licença MIT, preservada em `assets/flags/LICENSE.txt`. As imagens usam o formato 4:3 da coleção, que padroniza algumas proporções originais. Todas ficam no projeto; nenhum recurso externo é carregado durante o jogo.

## Design system

Abra `design-system.html` para ver cores, tipografia, espaçamentos e componentes. Os tokens e controles compartilhados estão em `design-system.css`; decisões e regras de uso estão em `DESIGN-SYSTEM.md`. O jogo usa essa mesma base visual.

Referência atual: Monkeytype, adaptada a um tema claro no jogo. O código fonte completo baixado está na pasta `design system`, com a licença original preservada. Essa pasta é somente referência; o jogo usa a fonte local em `assets/fonts` e não precisa executar ou instalar o Monkeytype.

No GitHub, essa referência é um submódulo fixado na versão utilizada. Para baixar também o código do Monkeytype, clone este projeto com `git clone --recurse-submodules <URL-do-repositório>`. Em uma cópia já clonada, execute `git submodule update --init`. O jogo funciona mesmo sem baixar o submódulo.

## Verificação e manutenção

Com Node.js disponível, execute `node --test tests/*.test.cjs` para verificar catálogo, imagens, normalização, sorteio e pontuação.

`node scripts/download-flags.cjs` baixa novamente as bandeiras e a licença. Esse comando exige internet e serve apenas para manutenção; não é necessário para jogar.

O fundo prioriza WebGL e possui um modo Canvas adaptativo para ambientes sem aceleração. A geometria pré-calculada fica em `globe-data.js`; mantenha esse arquivo junto aos demais arquivos do jogo. Para regenerá-la, execute `node scripts/build-globe-data.cjs`.

Use **↑** e **↓** para mudar o modo de jogo na ordem do menu, inclusive com o campo de resposta focado ou após concluir a rodada. As setas param no primeiro e no último modo, sem reiniciar nesses limites. Mudar de modo inicia uma nova rodada e mantém a preferência de shuffle.

Modos de jogo: o menu lateral oferece 5 bandeiras aleatórias, África, Ásia,
Europa, América do Norte (incluindo América Central e Caribe), América do Sul,
Oceania e todas as 195 bandeiras. Cada continente inclui todos os países da
região; mudar de modo inicia uma nova rodada. Nos modos de continente e mundo, as bandeiras ficam em um carrossel horizontal:
cada acerto sai após o feedback e as próximas deslizam da direita para a esquerda.
É possível rolar a faixa para consultar outras bandeiras. Ao concluir ou revelar
a rodada, todas ficam disponíveis para revisão. O modo de 5 bandeiras mantém
a exibição fixa. As imagens são carregadas conforme necessário. Nomes ambíguos, como Guiné e Sudão,
podem ser confirmados com Enter quando outro nome ainda começa pelo mesmo texto;
os demais acertos continuam instantâneos.
