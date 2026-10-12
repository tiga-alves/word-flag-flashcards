const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const countries = require('../countries.js');
const modes = require('../modes.js');
const { normalize, sample, grade } = require('../game.js');
const base = path.resolve(__dirname, '..');
const byCode = code => countries.find(country => country.code === code);

test('catálogo contém exatamente os 195 países esperados e SVGs locais seguros', () => {
  const expected = 'af al dz ad ao ag ar am au at az bs bh bd bb by be bz bj bt bo ba bw br bn bg bf bi cv kh cm ca cf td cl cn co km cg cd cr ci hr cu cy cz dk dj dm do ec eg sv gq er ee sz et fj fi fr ga gm ge de gh gr gd gt gn gw gy ht hn hu is in id ir iq ie il it jm jp jo kz ke ki kp kr kw kg la lv lb ls lr ly li lt lu mg mw my mv ml mt mh mr mu mx fm md mc mn me ma mz mm na nr np nl nz ni ne ng mk no om pk pw pa pg py pe ph pl pt qa ro ru rw kn lc vc ws sm st sa sn rs sc sl sg sk si sb so za ss es lk sd sr se ch sy tj tz th tl tg to tt tn tr tm tv ug ua ae gb us uy uz vu ve vn ye zm zw ps va'.split(' ');
  assert.equal(countries.length, 195);
  assert.deepEqual(countries.map(country => country.code).sort(), expected.sort());
  assert.equal(new Set(countries.map(country => country.code)).size, 195);
  for (const country of countries) {
    assert.ok(country.answers.includes(country.name));
    assert.equal(country.flag, `assets/flags/${country.code}.svg`);
    const svg = fs.readFileSync(path.join(base, country.flag), 'utf8');
    assert.match(svg, /<svg\b/);
    assert.match(svg, /<\/svg>\s*$/);
    assert.doesNotMatch(svg, /<script|<foreignObject|<image|<title|<desc|(?:href|src)\s*=\s*["'](?:https?:|\/\/)/i);
  }
  assert.match(fs.readFileSync(path.join(base, 'assets/flags/LICENSE.txt'), 'utf8'), /MIT License/);
});

test('normalização aceita caixa, acentos e espaços sem juntar nomes diferentes', () => {
  assert.equal(normalize('  SÃO   TOMÉ E PRÍNCIPE  '), 'sao tome e principe');
  assert.equal(normalize('Sui\u0301ça'), 'suica');
  assert.notEqual(normalize('Níger'), normalize('Nigéria'));
});

test('variantes comuns e distinção entre países', () => {
  const round = ['us', 'nl', 'cz', 'st', 'br'].map(byCode);
  assert.equal(grade(round, [' eUa ', 'HOLANDA', 'Republica Tcheca', 'sao  tome e principe', 'BRASIL']).score, 5);
  assert.equal(grade([byCode('gb')], ['Inglaterra']).score, 0);
  assert.equal(grade([byCode('cd')], ['Congo']).score, 0);
  assert.equal(grade([byCode('ne')], ['Nigéria']).score, 0);
  assert.equal(grade([byCode('gn')], ['Guiné-Bissau']).score, 0);
});

test('pontuações de zero a cinco e respostas vazias', () => {
  const round = countries.slice(0, 5);
  for (let score = 0; score <= 5; score++) {
    const answers = round.map((country, index) => index < score ? country.name : 'errado');
    assert.equal(grade(round, answers).score, score);
  }
  assert.equal(grade(round, ['', '  ', undefined, null]).score, 0);
});

test('sorteio sem repetições e sem alterar o catálogo', () => {
  const original = countries.map(country => country.code);
  for (let n = 0; n < 1000; n++) {
    const round = sample(countries);
    assert.equal(round.length, 5);
    assert.equal(new Set(round.map(country => country.code)).size, 5);
    assert.ok(round.every(country => countries.includes(country)));
  }
  const first = sample(countries, 5, () => 0);
  const second = sample(countries, 5, () => 0.9999);
  assert.notDeepEqual(first, second);
  assert.deepEqual(countries.map(country => country.code), original);
  assert.throws(() => sample(countries, 196), RangeError);
});

// Pequena fixture de DOM para testar os eventos reais do app sem dependências.
class Element {
  constructor(tag, document) {
    this.tag = tag; this.document = document; this.children = []; this.parent = null;
    this.style = { setProperty() {} }; this.events = {}; this.attributes = {}; this.value = ''; this.disabled = false;
    this.hidden = false; this.className = ''; this.textContent = '';
    this.classList = { toggle: (value, force) => { const classes = this.className.split(' ').filter(item => item && item !== value); if (force) classes.push(value); this.className = classes.join(' '); }, add: value => { this.className += ` ${value}`; } };
  }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; }
  setRangeText(value, start, end) { this.value = this.value.slice(0, start) + value + this.value.slice(end); this.selectionStart = this.selectionEnd = start + value.length; }
  append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
  replaceChildren(...children) { for (const child of this.children) child.parent = null; this.children = []; this.append(...children); }
  addEventListener(type, callback) { this.events[type] = callback; }
  setAttribute(key, value) { this.attributes[key] = value; if (key === 'class') this.className = value; }
  focus() { this.document.activeElement = this; }
  matches(selector) { return selector.startsWith('.') ? this.className.split(' ').includes(selector.slice(1)) : this.tag === selector; }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector); }
  get isConnected() { return this.parent !== null; }
}
function appFixture() {
  const timers = new Map();
  let timerId = 0;
  const elements = {};
  const document = { events: {}, addEventListener(type, callback) { this.events[type] = callback; }, getElementById: id => elements[id], createElement: tag => new Element(tag, document), createElementNS: (namespace, tag) => new Element(tag, document) };
  for (const [id, tag] of Object.entries({ 'batch-controls': 'div', 'batch-label': 'span', 'batch-previous': 'button', 'batch-next': 'button', 'shuffle-label': 'span', 'shuffle-button': 'button', 'restart-round': 'button', 'reveal-button': 'button', 'game-modes': 'div', 'game-title': 'h1', 'answer-hint': 'p', 'flags-grid': 'div', 'game-form': 'form', 'country-input': 'input', 'gauge-count': 'span', 'gauge-total': 'span', 'new-round': 'button', 'round-status': 'div', 'filled-count': 'p', 'progress-gauge': 'div', 'progress-segments': 'svg' })) elements[id] = new Element(tag, document);
  const deterministicGame = { normalize, grade, sample: (list, count = 5) => sample(list, count, () => 0.9999) };
  vm.runInNewContext(fs.readFileSync(path.join(base, 'app.js'), 'utf8'), { document, window: { setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); } }, FlagModes: modes, FlagCountries: countries, FlagGame: deterministicGame });
  return { elements, document, flushTimers() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); } };
}

test('app: digitação livre, edição e nomes corretos em qualquer ordem', () => {
  const { elements: el, document } = appFixture();
  const input = el['country-input'];
  const cards = el['flags-grid'].children;
  assert.equal(cards.length, 5);
  assert.equal(document.activeElement, input);
  input.value = 'a'; input.events.input({});
  assert.equal(input.value, 'a');
  input.value = ''; input.events.input({ inputType: 'deleteContentBackward' });
  assert.equal(input.value, '');
  input.value = 'pais errado'; input.events.input({});
  assert.equal(cards.filter(card => card.matches('.correct')).length, 0);
  input.value = ''; input.events.input({});
  [4, 2, 0, 3, 1].forEach((index, step) => {
    input.value = normalize(countries[index].name).replace(/[^\p{L}]/gu, '');
    input.events.input({});
    assert.ok(cards[index].matches('.correct'));
    assert.equal(cards[index].querySelector('.feedback').textContent, countries[index].name);
    if (step < 4) assert.equal(el['round-status'].textContent, '');
    else assert.match(el['round-status'].textContent, /Acertos: 5/);
    assert.equal(input.value, '');
    assert.equal(el['filled-count'].textContent, `${step + 1} de 5 países completos`);
  });
  assert.equal(input.disabled, true);
  assert.equal(el['new-round'].hidden, false);
  assert.equal(document.activeElement, el['new-round']);
  el['new-round'].events.click();
  assert.equal(input.disabled, false);
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
  assert.equal(el['new-round'].hidden, true);
});

test('progresso: cinco arcos horários, contador sobe a cada acerto e reinício', () => {
  const { elements: el } = appFixture();
  const ring = el['progress-segments'];
  const gauge = el['progress-gauge'];
  const input = el['country-input'];
  assert.equal(ring.children.length, 5);
  assert.equal(ring.querySelectorAll('.complete').length, 0);
  assert.equal(gauge.attributes['aria-valuemax'], '5');
  assert.equal(el['gauge-count'].children[0].textContent, '0');
  assert.equal(el['gauge-total'].textContent, '/5');
  const starts = ring.children.map(segment => {
    assert.equal(segment.children.length, 2);
    assert.equal(segment.children[0].attributes.d, segment.children[1].attributes.d);
    const match = segment.children[0].attributes.d.match(/^M ([\d.e+-]+) ([\d.e+-]+) A 92 92 0 0 1 /);
    assert.ok(match, 'Each stripe is a real circular arc');
    return (Math.atan2(Number(match[2]) - 120, Number(match[1]) - 120) * 180 / Math.PI + 360) % 360;
  });
  starts.forEach((angle, index) => assert.ok(Math.abs((starts[(index + 1) % 5] - angle + 360) % 360 - 72) < 0.001));
  [4, 1, 3, 0, 2].forEach((index, step) => {
    input.value = countries[index].name; input.events.input({});
    ring.children.forEach((segment, position) => assert.equal(segment.matches('.complete'), position <= step));
    assert.equal(ring.querySelectorAll('.complete').length, step + 1);
    assert.equal(gauge.attributes['aria-valuenow'], String(step + 1));
    assert.equal(el['gauge-count'].querySelector('.counter-digit--leaving').textContent, String(step));
    assert.equal(el['gauge-count'].querySelector('.counter-digit--entering').textContent, String(step + 1));
    input.value = countries[index].name; input.events.input({});
    assert.equal(ring.querySelectorAll('.complete').length, step + 1);
  });
  el['new-round'].events.click();
  assert.equal(ring.children.length, 5);
  assert.equal(ring.querySelectorAll('.complete').length, 0);
  assert.equal(gauge.attributes['aria-valuenow'], '0');
  assert.equal(el['gauge-count'].children.length, 1);
  assert.equal(el['gauge-count'].children[0].textContent, '0');
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  const panel = html.match(/<section class="panel progress-panel"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(panel, /solved-total|gauge-caption|round-number|remaining-total|class="metric"/);
  assert.match(panel, /class="sr-only" aria-live="polite"/);
  assert.match(html, /<h1 id="game-title">5 bandeiras aleatórias<\/h1>/);
  assert.doesNotMatch(html, /letter-pool|EXPLORAR \/ BANDEIRAS/);
});

test('app: envio não revela respostas e falha de imagem permite nova rodada', () => {
  const { elements: el } = appFixture();
  let prevented = false;
  el['game-form'].events.submit({ preventDefault() { prevented = true; } });
  assert.ok(prevented);
  assert.ok(el['flags-grid'].querySelectorAll('.feedback').every(feedback => feedback.textContent === '…'));
  el['flags-grid'].querySelector('img').events.error();
  assert.equal(el['new-round'].hidden, false);
  assert.match(el['round-status'].textContent, /Não foi possível carregar/);
  el['new-round'].events.click();
  assert.equal(el['round-status'].textContent, '');
});
test('página usa recursos locais e scripts clássicos compatíveis com file://', () => {
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  assert.match(html, /lang="pt-BR"/);
  assert.doesNotMatch(html, /(?:src|href)="(?:https?:|\/\/)|type="module"/);
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(fs.existsSync(path.join(base, match[1].split('?')[0])));
  for (const file of ['app.js', 'audio.js', 'game.js', 'countries.js']) {
    const source = fs.readFileSync(path.join(base, file), 'utf8');
    assert.doesNotMatch(source, /\bfetch\(|XMLHttpRequest|\bimport\s/);
    new vm.Script(source);
  }
});



test('áudio: inicia na digitação, gera notas e respeita silêncio', () => {
  let contexts = 0, notes = 0;
  const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} };
  class AudioContext {
    constructor() { contexts++; this.currentTime = 1; this.state = 'running'; }
    createOscillator() { return { frequency: param, connect() {}, start() { notes++; }, stop() {}, disconnect() {} }; }
    createGain() { return { gain: param, connect() {}, disconnect() {} }; }
  }
  const window = { AudioContext };
  const document = { readyState: 'complete', getElementById() { return null; } };
  vm.runInNewContext(fs.readFileSync(path.join(base, 'audio.js'), 'utf8'), { window, document });
  assert.equal(contexts, 0);
  window.FlagAudio.type();
  assert.equal(contexts, 1);
  assert.equal(notes, 2);
  window.FlagAudio.toggle();
  window.FlagAudio.success();
  assert.equal(notes, 2);
  window.FlagAudio.toggle();
  window.FlagAudio.success();
  assert.equal(notes, 5);
});


test('modos: continentes cobrem os 195 países exatamente uma vez', () => {
  const codes = modes.flatMap(mode => mode.codes || []);
  assert.equal(codes.length, 195);
  assert.equal(new Set(codes).size, 195);
  assert.deepEqual([...codes].sort(), countries.map(country => country.code).sort());
  assert.deepEqual(modes.map(mode => mode.count), [5, 54, 48, 44, 23, 12, 14, 195]);
});

test('menu: cada continente mostra todos os seus países e reinicia o progresso', () => {
  const { elements: el } = appFixture();
  const buttons = el['game-modes'].children;
  assert.equal(buttons.length, 8);
  modes.forEach((mode, index) => {
    buttons[index].events.click();
    assert.equal(el['flags-grid'].children.length, mode.count);
    assert.equal(el['game-title'].textContent, mode.name);
    assert.equal(buttons[index].attributes['aria-pressed'], 'true');
    assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
    assert.equal(el['progress-segments'].children.length, mode.count);
    assert.equal(el['gauge-total'].textContent, `/${mode.count}`);
    const images = el['flags-grid'].querySelectorAll('img');
    if (mode.codes) assert.deepEqual(images.map(img => img.src).sort(), mode.codes.map(code => `assets/flags/${code}.svg`).sort());
    const first = countries.find(country => country.flag === images[0].src);
    el['country-input'].value = first.name;
    el['country-input'].events.input({});
    el['game-form'].events.submit({ preventDefault() {} });
    assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '1');
  });
});

test('mundo: nomes com prefixos continuam digitáveis e todos os 195 podem ser concluídos', () => {
  const { elements: el } = appFixture();
  el['game-modes'].children[7].events.click();
  const input = el['country-input'];
  input.value = 'Guiné'; input.events.input({});
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
  assert.equal(el['answer-hint'].hidden, false);
  input.value = 'Guiné-Bissau'; input.events.input({});
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '1');
  assert.equal(el['answer-hint'].hidden, true);
  for (const country of countries.filter(country => country.code !== 'gw')) {
    input.value = country.name; input.events.input({});
    if (input.value) el['game-form'].events.submit({ preventDefault() {} });
  }
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '195');
  assert.equal(el['progress-segments'].querySelectorAll('.complete').length, 195);
  assert.equal(input.disabled, true);
  assert.equal(el['new-round'].hidden, false);
  el['game-modes'].children[0].events.click();
  assert.equal(input.disabled, false);
  assert.equal(el['flags-grid'].children.length, 5);
  assert.equal(el['new-round'].hidden, true);
});


test('app: aliases do catálogo são aceitos, preservando nomes maiores de outros países', () => {
  const { elements: el } = appFixture();
  el['game-modes'].children[7].events.click();
  const input = el['country-input'];
  for (const alias of ['Qatar', 'Benin', 'Bósnia', 'EUA', 'Holanda']) {
    input.value = alias; input.events.input({});
    assert.equal(input.value, '');
  }
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '5');
  input.value = 'Guiné'; input.events.input({});
  assert.equal(input.value, 'Guiné');
  assert.equal(el['answer-hint'].hidden, false);
  el['game-form'].events.submit({ preventDefault() {} });
  assert.equal(input.value, '');
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '6');
});

test('app: atalho 1 revela todas, preserva acertos e ignora repetição e modificadores', () => {
  const { elements: el, document } = appFixture();
  const input = el['country-input'];
  const cards = el['flags-grid'].children;
  const press = (options = {}) => {
    let prevented = false;
    document.events.keydown({ key: '1', target: input, preventDefault() { prevented = true; }, ...options });
    return prevented;
  };
  input.value = countries[0].name; input.events.input({});
  input.value = 'rascunho';
  for (const options of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { shiftKey: true }, { isComposing: true }]) assert.equal(press(options), false);
  assert.equal(press({ repeat: true }), true);
  assert.equal(input.value, 'rascunho');
  assert.equal(cards[1].querySelector('.feedback').textContent, '…');
  assert.equal(press(), true);
  assert.equal(input.value, '');
  assert.ok(cards[0].matches('.correct'));
  assert.equal(cards[0].matches('.revealed'), false);
  for (const [index, card] of cards.entries()) {
    assert.equal(card.querySelector('.feedback').textContent, countries[index].name);
    if (index > 0) {
      assert.ok(card.matches('.revealed'));
      assert.equal(card.matches('.correct'), false);
      assert.equal(card.querySelector('.feedback-note').textContent, 'Resposta revelada');
    }
  }
  assert.match(el['round-status'].textContent, /Acertos: 1 · Respostas reveladas: 4/);
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '5');
  assert.equal(input.disabled, true);
  assert.equal(el['reveal-button'].disabled, true);
  assert.equal(document.activeElement, el['new-round']);
  el['new-round'].events.click();
  assert.equal(el['reveal-button'].disabled, false);
  assert.equal(input.disabled, false);
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
  assert.ok(el['flags-grid'].children.every(card => !card.matches('.revealed')));
  assert.match(fs.readFileSync(path.join(base, 'index.html'), 'utf8'), /aria-keyshortcuts="1"/);
});

test('mundo: botão revela todos os 195 países e limpa aviso de nome ambíguo', () => {
  const { elements: el } = appFixture();
  el['game-modes'].children[7].events.click();
  el['country-input'].value = 'Guiné'; el['country-input'].events.input({});
  assert.equal(el['answer-hint'].hidden, false);
  el['reveal-button'].events.click();
  assert.equal(el['country-input'].value, '');
  assert.equal(el['answer-hint'].hidden, true);
  assert.equal(el['flags-grid'].querySelectorAll('.revealed').length, 195);
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '195');
  assert.match(el['round-status'].textContent, /Acertos: 0 · Respostas reveladas: 195/);
  const status = el['round-status'].textContent;
  el['reveal-button'].events.click();
  assert.equal(el['round-status'].textContent, status);
});


test('controles: shuffle ordena os mesmos países e preserva acertos e revelações', () => {
  const { elements: el } = appFixture();
  const originalCards = [...el['flags-grid'].children];
  const originalFlags = originalCards.map(card => card.querySelector('img').src).sort();
  el['country-input'].value = countries[0].name; el['country-input'].events.input({});
  const shuffle = el['shuffle-button'];
  shuffle.events.click();
  assert.equal(shuffle.attributes['aria-pressed'], 'false');
  const orderedCountries = countries.slice(0, 5).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  assert.deepEqual(el['flags-grid'].querySelectorAll('img').map(image => image.src), orderedCountries.map(country => country.flag));
  assert.ok(el['flags-grid'].children.includes(originalCards[0]));
  assert.ok(originalCards[0].matches('.correct'));
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '1');
  el['reveal-button'].events.click();
  const summary = el['round-status'].textContent;
  shuffle.events.click();
  assert.equal(shuffle.attributes['aria-pressed'], 'true');
  assert.equal(el['flags-grid'].querySelectorAll('.revealed').length, 4);
  assert.equal(el['flags-grid'].querySelectorAll('.correct').length, 1);
  assert.equal(el['country-input'].disabled, true);
  assert.equal(el['round-status'].textContent, summary);
  assert.deepEqual(el['flags-grid'].querySelectorAll('img').map(image => image.src).sort(), originalFlags);
});

test('reiniciar limpa a rodada atual e mantém países e preferência de shuffle', () => {
  const { elements: el } = appFixture();
  el['shuffle-button'].events.click();
  const flags = el['flags-grid'].querySelectorAll('img').map(image => image.src);
  el['country-input'].value = countries[0].name; el['country-input'].events.input({});
  el['country-input'].value = 'rascunho';
  el['restart-round'].events.click();
  assert.equal(el['country-input'].value, '');
  assert.equal(el['country-input'].disabled, false);
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
  assert.equal(el['flags-grid'].querySelectorAll('.correct').length, 0);
  assert.deepEqual(el['flags-grid'].querySelectorAll('img').map(image => image.src), flags);
  el['reveal-button'].events.click();
  el['restart-round'].events.click();
  assert.equal(el['reveal-button'].disabled, false);
  assert.equal(el['new-round'].hidden, true);
  assert.equal(el['round-status'].textContent, '');
  assert.equal(el['flags-grid'].querySelectorAll('.revealed').length, 0);
  assert.deepEqual(el['flags-grid'].querySelectorAll('img').map(image => image.src), flags);
  el['game-modes'].children[7].events.click();
  const alphabetic = [...countries].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  assert.deepEqual(el['flags-grid'].querySelectorAll('img').map(image => image.src), alphabetic.map(country => country.flag));
  el['restart-round'].events.click();
  assert.equal(el['flags-grid'].children.length, 195);
  assert.deepEqual(el['flags-grid'].querySelectorAll('img').map(image => image.src), alphabetic.map(country => country.flag));
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /id="shortcut-hint"/);
  assert.match(html, /id="restart-round"[^>]*>[\s\S]*?Reiniciar/);
});


test('atalhos 2 e 3 funcionam com campo focado e rodada concluída sem inserir números', () => {
  const { elements: el, document } = appFixture();
  const input = el['country-input'];
  const press = (key, options = {}) => {
    let prevented = false;
    document.events.keydown({ key, target: input, preventDefault() { prevented = true; }, ...options });
    return prevented;
  };
  input.value = 'rascunho';
  for (const key of ['2', '3']) {
    for (const options of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { shiftKey: true }, { isComposing: true }]) assert.equal(press(key, options), false);
    assert.equal(press(key, { repeat: true }), true);
    assert.equal(input.value, 'rascunho');
  }
  assert.equal(press('2'), true);
  assert.equal(input.value, 'rascunho');
  assert.equal(el['shuffle-button'].attributes['aria-pressed'], 'false');
  assert.equal(el['shuffle-label'].textContent, 'Shuffle: desligado');
  assert.equal(press('3'), true);
  assert.equal(input.value, '');
  assert.equal(document.activeElement, input);
  press('1');
  assert.equal(input.disabled, true);
  assert.equal(press('2'), true);
  assert.equal(el['shuffle-button'].attributes['aria-pressed'], 'true');
  assert.equal(input.disabled, true);
  assert.equal(press('3'), true);
  assert.equal(input.disabled, false);
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  assert.match(html, /aria-keyshortcuts="2"/);
  assert.match(html, /aria-keyshortcuts="3"/);
});


test('atalhos reconhecem códigos físicos Digit e Numpad mesmo sem event.key numérico', () => {
  for (const prefix of ['Digit', 'Numpad']) {
    const { elements: el, document } = appFixture();
    const input = el['country-input'];
    const press = (digit, options = {}) => {
      let prevented = false;
      document.events.keydown({ key: prefix === 'Numpad' ? { '1': 'End', '2': 'ArrowDown', '3': 'PageDown' }[digit] : 'Unidentified', code: `${prefix}${digit}`, target: input, preventDefault() { prevented = true; }, ...options });
      return prevented;
    };
    input.value = 'rascunho';
    assert.equal(press('2', { ctrlKey: true }), false);
    assert.equal(press('2', { isComposing: true }), false);
    assert.equal(press('2', { repeat: true }), true);
    assert.equal(input.value, 'rascunho');
    assert.equal(press('2'), true);
    assert.equal(el['shuffle-button'].attributes['aria-pressed'], 'false');
    assert.equal(input.value, 'rascunho');
    assert.equal(press('1'), true);
    assert.equal(input.disabled, true);
    assert.equal(el['flags-grid'].querySelectorAll('.revealed').length, 5);
    assert.equal(press('2'), true);
    assert.equal(el['shuffle-button'].attributes['aria-pressed'], 'true');
    assert.equal(press('3'), true);
    assert.equal(input.disabled, false);
    assert.equal(input.value, '');
    assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
  }
});

test('recursos CSS e JS usam a mesma versão para evitar mistura de cache', () => {
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  const resources = [...html.matchAll(/(?:src|href)="([^" ]+\.(?:css|js)(?:\?[^" ]*)?)"/g)].map(match => match[1]);
  assert.equal(resources.length, 9);
  assert.ok(resources.every(resource => resource.endsWith('?v=batch-keys-10')));
  assert.match(fs.readFileSync(path.join(base, 'styles.css'), 'utf8'), /font: 400 12px\/1\.6 var\(--ds-font\)/);
});


test('setas percorrem os oito modos, preservam shuffle e respeitam limites', () => {
  const { elements: el, document } = appFixture();
  const input = el['country-input'];
  const press = (key, options = {}) => {
    let prevented = false;
    document.events.keydown({ key, target: input, preventDefault() { prevented = true; }, ...options });
    return prevented;
  };
  input.value = countries[0].name; input.events.input({});
  const firstCards = [...el['flags-grid'].children];
  assert.equal(press('ArrowUp'), true);
  assert.deepEqual(el['flags-grid'].children, firstCards);
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '1');
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { isComposing: true }]) assert.equal(press('ArrowDown', options), false);
  assert.equal(press('ArrowDown', { repeat: true }), true);
  assert.equal(el['game-title'].textContent, modes[0].name);
  el['shuffle-button'].events.click();
  for (let index = 1; index < modes.length; index++) {
    input.value = 'rascunho';
    assert.equal(press('ArrowDown'), true);
    assert.equal(el['game-title'].textContent, modes[index].name);
    assert.equal(el['flags-grid'].children.length, modes[index].count);
    assert.equal(el['game-modes'].children[index].attributes['aria-pressed'], 'true');
    assert.equal(el['shuffle-button'].attributes['aria-pressed'], 'false');
    assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
    assert.equal(input.value, '');
    assert.equal(document.activeElement, input);
    const pool = modes[index].codes ? countries.filter(country => modes[index].codes.includes(country.code)) : countries;
    assert.deepEqual(el['flags-grid'].querySelectorAll('img').map(image => image.src), [...pool].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(country => country.flag));
  }
  el['reveal-button'].events.click();
  assert.equal(input.disabled, true);
  const finalCards = [...el['flags-grid'].children];
  assert.equal(press('ArrowDown'), true);
  assert.deepEqual(el['flags-grid'].children, finalCards);
  assert.equal(input.disabled, true);
  for (let index = modes.length - 2; index >= 0; index--) {
    assert.equal(press('ArrowUp'), true);
    assert.equal(el['game-title'].textContent, modes[index].name);
    assert.equal(input.disabled, false);
    assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
    assert.equal(el['shuffle-button'].attributes['aria-pressed'], 'false');
  }
  const cards = [...el['flags-grid'].children];
  el['game-modes'].children[0].events.click();
  assert.deepEqual(el['flags-grid'].children, cards);
  assert.match(fs.readFileSync(path.join(base, 'index.html'), 'utf8'), /aria-keyshortcuts="ArrowUp ArrowDown"/);
});


test('levas: mantém acertos até completar três linhas e cancela avanço ao reiniciar', () => {
  const { elements: el, flushTimers } = appFixture();
  el['game-modes'].children[1].events.click();
  const visible = () => el['flags-grid'].children.filter(card => !card.hidden);
  const first = visible();
  assert.equal(first.length, 15);
  function answer(card) {
    const country = countries.find(country => country.flag === card.children[0].children[0].src);
    el['country-input'].value = country.name;
    el['game-form'].events.submit({ preventDefault() {} });
  }
  first.slice(0, 14).forEach(answer);
  flushTimers();
  assert.deepEqual(visible(), first);
  answer(first[14]);
  assert.deepEqual(visible(), first);
  flushTimers();
  assert.equal(el['batch-label'].textContent, 'Leva 2 de 4');
  assert.ok(visible().every(card => !first.includes(card)));
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '15');
  visible().forEach(answer);
  el['restart-round'].events.click();
  flushTimers();
  assert.equal(el['batch-label'].textContent, 'Leva 1 de 4');
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '0');
});


test('setas horizontais navegam levas com campo focado, respeitam limites e modificadores', () => {
  const { elements: el, document } = appFixture();
  const input = el['country-input'];
  const press = (key, options = {}) => {
    let prevented = false;
    document.events.keydown({ key, target: input, preventDefault() { prevented = true; }, ...options });
    return prevented;
  };
  assert.equal(press('ArrowRight'), false);
  el['game-modes'].children[1].events.click();
  input.value = 'rascunho';
  assert.equal(press('ArrowLeft'), true);
  assert.equal(el['batch-label'].textContent, 'Leva 1 de 4');
  assert.equal(press('ArrowRight'), true);
  assert.equal(el['batch-label'].textContent, 'Leva 2 de 4');
  assert.equal(input.value, 'rascunho');
  assert.equal(document.activeElement, input);
  for (const options of [{ repeat: true }, { ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { isComposing: true }]) {
    press('ArrowRight', options);
    assert.equal(el['batch-label'].textContent, 'Leva 2 de 4');
  }
  press('ArrowLeft');
  assert.equal(el['batch-label'].textContent, 'Leva 1 de 4');
  for (let i = 0; i < 5; i++) press('ArrowRight');
  assert.equal(el['batch-label'].textContent, 'Leva 4 de 4');
  el['reveal-button'].events.click();
  press('ArrowLeft');
  assert.equal(el['batch-label'].textContent, 'Leva 3 de 4');
  assert.equal(el['progress-gauge'].attributes['aria-valuenow'], '54');
});
