(function () {
  'use strict';
  const grid = document.getElementById('flags-grid');
  const form = document.getElementById('game-form');
  const checkButton = document.getElementById('check-button');
  const nextButton = document.getElementById('new-round');
  const status = document.getElementById('round-status');
  const counter = document.getElementById('filled-count');
  let round = [];
  let roundNumber = 0;
  let checked = false;
  let assetError = false;

  function setStatus(title, detail, result = false) {
    const heading = document.createElement('p');
    heading.className = `status-title${result ? ' result-title' : ''}`;
    heading.textContent = title;
    const description = document.createElement('p');
    description.textContent = detail;
    status.replaceChildren(heading, description);
  }

  function startRound(focus = false) {
    round = FlagGame.sample(FlagCountries);
    roundNumber++;
    checked = false;
    assetError = false;
    checkButton.disabled = false;
    checkButton.hidden = false;
    checkButton.textContent = 'Conferir respostas';
    nextButton.hidden = true;
    document.getElementById('round-number').textContent = String(roundNumber).padStart(2, '0');
    counter.textContent = '0 de 5 respostas preenchidas';
    status.replaceChildren();
    grid.replaceChildren();

    round.forEach((country, index) => {
      const card = document.createElement('div');
      card.className = 'flag-card';
      const stage = document.createElement('div');
      stage.className = 'flag-stage';
      const image = document.createElement('img');
      image.alt = `Bandeira ${index + 1} da rodada`;
      image.draggable = false;
      image.addEventListener('error', () => {
        if (!card.isConnected) return;
        assetError = true;
        checkButton.disabled = true;
        checkButton.hidden = true;
        nextButton.hidden = false;
        image.hidden = true;
        stage.textContent = 'Bandeira indisponível';
        setStatus('Não foi possível carregar uma bandeira.', 'Mantenha a pasta assets junto ao index.html ou tente uma nova rodada.');
      });
      image.src = country.flag;
      stage.append(image);
      const label = document.createElement('label');
      label.htmlFor = `answer-${index}`;
      label.textContent = `PAÍS ${String(index + 1).padStart(2, '0')}`;
      const input = document.createElement('input');
      input.id = label.htmlFor;
      input.name = `answer-${index}`;
      input.type = 'text';
      input.className = 'ds-input';
      input.placeholder = 'Nome do país';
      input.spellcheck = false;
      input.autocomplete = 'off';
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('aria-describedby', `feedback-${index}`);
      input.setAttribute('enterkeyhint', index < 4 ? 'next' : 'done');
      input.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.isComposing || checked) return;
        if (index < 4) {
          event.preventDefault();
          grid.querySelectorAll('input')[index + 1].focus();
        }
      });
      const feedback = document.createElement('p');
      feedback.id = `feedback-${index}`;
      feedback.className = 'feedback';
      card.append(stage, label, input, feedback);
      grid.append(card);
    });
    if (focus) grid.querySelector('input').focus();
  }

  form.addEventListener('input', () => {
    if (checked) return;
    const filled = [...grid.querySelectorAll('input')].filter(input => input.value.trim() !== '').length;
    counter.textContent = `${filled} de 5 respostas preenchidas`;
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (checked || assetError) return;
    checked = true;
    const inputs = [...grid.querySelectorAll('input')];
    const { results, score } = FlagGame.grade(round, inputs.map(input => input.value));
    results.forEach(({ country, correct }, index) => {
      const card = inputs[index].closest('.flag-card');
      card.classList.add(correct ? 'correct' : 'incorrect');
      inputs[index].disabled = true;
      const feedback = card.querySelector('.feedback');
      const verdict = document.createElement('span');
      verdict.textContent = correct ? '✓ Acertou!' : inputs[index].value.trim() ? '× Não foi dessa vez' : '× Sem resposta';
      const name = document.createElement('strong');
      name.textContent = country.name;
      feedback.replaceChildren(verdict, name);
    });
    const messages = ['Cada rodada é uma chance de descobrir novos países.', 'Um país reconhecido. Vamos explorar mais?', 'Dois países reconhecidos. Continue explorando!', 'Bom trabalho! Mais uma volta ao mundo?', 'Muito bem! Faltou só uma bandeira.', 'Volta ao mundo completa. Você acertou todas!'];
    setStatus(`Você acertou ${score} de 5!`, messages[score], true);
    counter.textContent = 'Rodada concluída';
    checkButton.disabled = true;
    checkButton.textContent = 'Respostas conferidas';
    checkButton.hidden = true;
    nextButton.hidden = false;
    nextButton.focus();
  });

  nextButton.addEventListener('click', () => startRound(true));
  startRound(true);
})();
