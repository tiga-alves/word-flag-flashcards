(function () {
  'use strict';
  const grid = document.getElementById('flags-grid');
  const input = document.getElementById('country-input');
  const next = document.getElementById('new-round');
  const status = document.getElementById('round-status');
  const counter = document.getElementById('filled-count');
  const keyOf = value => FlagGame.normalize(value).replace(/[^\p{L}]/gu, '');
  const gauge = document.getElementById('progress-gauge');
  const segments = document.getElementById('progress-segments');
  const gaugeCount = document.getElementById('gauge-count');
  const gaugeTotal = document.getElementById('gauge-total');
  const menu = document.getElementById('game-modes');
  const title = document.getElementById('game-title');
  const answerHint = document.getElementById('answer-hint');
  const shuffleButton = document.getElementById('shuffle-button');
  let shuffleEnabled = true;
  let mode = FlagModes[0];
  const modeButtons = [];
  let countries = [], previous = '', displayedScore = 0;
  function createProgressSegments() {
    segments.replaceChildren();
    const step = 360 / countries.length;
    const gap = Math.min(9, step * 0.18);
    gauge.classList.toggle('gauge--dense', countries.length > 15);
    gaugeCount.style.width = `${String(countries.length).length}ch`;
    const point = angle => [120 + 92 * Math.cos(angle * Math.PI / 180), 120 + 92 * Math.sin(angle * Math.PI / 180)].join(' ');
    countries.forEach((item, index) => {
      const segment = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      segment.setAttribute('class', 'gauge-segment');
      const start = -90 + index * step + gap;
      const end = -90 + (index + 1) * step - gap;
      for (const kind of ['track', 'fill']) {
        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('class', `gauge-${kind}`);
        arc.setAttribute('d', `M ${point(start)} A 92 92 0 ${end - start > 180 ? 1 : 0} 1 ${point(end)}`);
        arc.setAttribute('pathLength', '1');
        segment.append(arc);
      }
      item.segment = segment;
      segments.append(segment);
    });
    gauge.setAttribute('aria-valuemax', String(countries.length));
  }
  function updateDashboard() {
    const solved = countries.filter(item => item.solved);
    countries.forEach((item, index) => item.segment.classList.toggle('complete', index < solved.length));
    gauge.setAttribute('aria-valuenow', String(solved.length));
    gauge.setAttribute('aria-valuetext', `${solved.length} de ${countries.length} países completos`);
    gaugeTotal.textContent = `/${countries.length}`;
    const digit = document.createElement('span');
    digit.className = 'counter-digit';
    digit.textContent = String(solved.length);
    if (solved.length > displayedScore) {
      const leaving = document.createElement('span');
      leaving.className = 'counter-digit counter-digit--leaving';
      leaving.textContent = String(displayedScore);
      digit.className += ' counter-digit--entering';
      gaugeCount.replaceChildren(leaving, digit);
    } else {
      gaugeCount.replaceChildren(digit);
    }
    displayedScore = solved.length;
  }
  function completeCountry(item, revealed = false, refresh = true) {
    item.solved = true;
    item.revealed = revealed;
    item.card.classList.add(revealed ? 'revealed' : 'correct');
    item.feedback.textContent = item.country.name;
    item.note.textContent = revealed ? 'Resposta revelada' : '';
    if (!refresh) return;
    updateDashboard();
    const solved = countries.filter(country => country.solved).length;
    counter.textContent = `${solved} de ${countries.length} países completos`;
    status.textContent = '';
    if (!revealed) window.FlagAudio?.success();
    if (solved === countries.length) {
      const revealedCount = countries.filter(country => country.revealed).length;
      const correctCount = countries.length - revealedCount;
      status.textContent = `Rodada concluída! Acertos: ${correctCount} · Respostas reveladas: ${revealedCount}.`;
      input.disabled = true;
      document.getElementById('reveal-button').disabled = true;
      next.hidden = false;
      next.focus();
    }
  }
  function revealAll() {
    const pending = countries.filter(country => !country.solved);
    if (!pending.length) return;
    input.value = '';
    previous = '';
    answerHint.hidden = true;
    pending.forEach((item, index) => completeCountry(item, true, index === pending.length - 1));
  }
  function onInput(event) {
    if (event.isComposing || input.disabled) return;
    let prefix = 0, suffix = 0;
    while (prefix < previous.length && prefix < input.value.length && previous[prefix] === input.value[prefix]) prefix++;
    while (suffix < previous.length - prefix && suffix < input.value.length - prefix && previous[previous.length - suffix - 1] === input.value[input.value.length - suffix - 1]) suffix++;
    if (/\p{L}/u.test(input.value.slice(prefix, input.value.length - suffix))) window.FlagAudio?.type();
    previous = input.value;
    const value = keyOf(input.value);
    const match = value && countries.find(item => !item.solved && item.keys.includes(value));
    const ambiguous = match && countries.some(item => !item.solved && item !== match && item.keys.some(key => key.startsWith(value)));
    answerHint.hidden = !ambiguous;
    if (ambiguous && !event.confirm) return;
    if (match) {
      answerHint.hidden = true;
      input.value = '';
      previous = '';
      completeCountry(match);
    }
  }
  document.getElementById('reveal-button').addEventListener('click', revealAll);
  input.addEventListener('input', onInput);
  input.addEventListener('compositionend', () => onInput({ isComposing: false }));
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    const shortcutKey = /^[123]$/.test(event.key) ? event.key : /^(?:Digit|Numpad)([123])$/.exec(event.code ?? '')?.[1];
    const shortcut = { '1': revealAll, '2': toggleShuffle, '3': restartRound }[shortcutKey];
    if (shortcut && !event.shiftKey) {
      if (shortcutKey === '1' && input.disabled) return;
      event.preventDefault();
      if (!event.repeat) shortcut();
      return;
    }
    if (input.disabled) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (!(event.key.length === 1 && /[\p{L} -]/u.test(event.key)) && event.key !== 'Backspace') return;
    if (event.target.closest('button') && event.key === ' ') return;
    event.preventDefault();
    input.focus();
    const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
    if (event.key === 'Backspace') input.setRangeText('', start === end ? Math.max(0, start - 1) : start, end, 'end');
    else input.setRangeText(event.key, start, end, 'end');
    onInput({ isComposing: false });
  });
  function startRound() {
    const round = [];
    const pool = mode.codes ? FlagCountries.filter(country => mode.codes.includes(country.code)) : FlagCountries;
    for (const country of FlagGame.sample(pool, pool.length)) {
      const name = keyOf(country.name);
      if (mode.id === 'random' && round.some(other => name.startsWith(keyOf(other.name)) || keyOf(other.name).startsWith(name))) continue;
      round.push(country);
      if (mode.id === 'random' && round.length === 5) break;
    }
    renderRound(round);
  }
  function ordered(list, nameOf) {
    return shuffleEnabled ? FlagGame.sample(list, list.length) : [...list].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'pt-BR'));
  }
  function renderRound(round) {
    round = ordered(round, country => country.name);
    title.textContent = mode.name;
    document.title = mode.name;
    modeButtons.forEach(({ button, option }) => button.setAttribute('aria-pressed', String(option === mode)));
    grid.classList.toggle('flags-grid--collection', mode.id !== 'random');
    grid.scrollTop = 0;
    answerHint.hidden = true;
    countries = []; previous = ''; displayedScore = 0;
    input.value = ''; input.disabled = false; next.hidden = true;
    document.getElementById('reveal-button').disabled = false;
    status.textContent = ''; grid.replaceChildren();
    counter.textContent = `0 de ${round.length} países completos`;
    round.forEach((country, index) => {
      const card = document.createElement('div'); card.className = 'flag-card';
      card.style.setProperty('--card-index', index);
      const stage = document.createElement('div'); stage.className = 'flag-stage';
      const image = document.createElement('img'); image.alt = `Bandeira ${index + 1} da rodada`; image.draggable = false;
      image.loading = index < 15 ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => {
        if (!card.isConnected) return;
        stage.textContent = 'Bandeira indisponível';
        status.textContent = 'Não foi possível carregar uma bandeira. Tente uma nova rodada.';
        next.hidden = false;
      });
      image.src = country.flag; stage.append(image);
      const feedback = document.createElement('p'); feedback.className = 'feedback'; feedback.textContent = '…';
      const note = document.createElement('p'); note.className = 'feedback-note';
      card.append(stage, feedback, note); grid.append(card);
      countries.push({ country, card, image, feedback, note, solved: false, revealed: false, keys: [...new Set(country.answers.map(keyOf))] });
    });
    createProgressSegments();
    updateDashboard();
    input.focus({ preventScroll: true });
  }
  document.getElementById('game-form').addEventListener('submit', event => {
    event.preventDefault();
    onInput({ isComposing: false, confirm: true });
  });
  for (const option of FlagModes) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'mode-button';
    const label = document.createElement('span'); label.textContent = option.name;
    const count = document.createElement('span'); count.className = 'mode-count'; count.textContent = String(option.count);
    button.append(label, count);
    button.addEventListener('click', () => { if (mode !== option) { mode = option; startRound(); } });
    modeButtons.push({ button, option }); menu.append(button);
  }
  function toggleShuffle() {
    shuffleEnabled = !shuffleEnabled;
    shuffleButton.setAttribute('aria-pressed', String(shuffleEnabled));
    document.getElementById('shuffle-label').textContent = `Shuffle: ${shuffleEnabled ? 'ligado' : 'desligado'}`;
    countries = ordered(countries, item => item.country.name);
    grid.replaceChildren(...countries.map(item => item.card));
    countries.forEach((item, index) => {
      item.card.style.setProperty('--card-index', index);
      item.image.alt = `Bandeira ${index + 1} da rodada`;
      item.image.loading = index < 15 ? 'eager' : 'lazy';
    });
    createProgressSegments();
    updateDashboard();
  }
  function restartRound() {
    renderRound(countries.map(item => item.country));
  }
  shuffleButton.addEventListener('click', toggleShuffle);
  document.getElementById('restart-round').addEventListener('click', restartRound);
  next.addEventListener('click', startRound);
  startRound();
})();
