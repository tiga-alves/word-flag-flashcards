const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const countries = require('../countries.js');
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
    this.events = {}; this.attributes = {}; this.value = ''; this.disabled = false;
    this.hidden = false; this.className = ''; this.textContent = '';
    this.classList = { add: value => { this.className += ` ${value}`; } };
  }
  append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
  replaceChildren(...children) { for (const child of this.children) child.parent = null; this.children = []; this.append(...children); }
  addEventListener(type, callback) { this.events[type] = callback; }
  setAttribute(key, value) { this.attributes[key] = value; }
  focus() { this.document.activeElement = this; }
  matches(selector) { return selector.startsWith('.') ? this.className.split(' ').includes(selector.slice(1)) : this.tag === selector; }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector); }
  get isConnected() { return this.parent !== null; }
}
function appFixture() {
  const elements = {};
  const document = { getElementById: id => elements[id], createElement: tag => new Element(tag, document) };
  for (const [id, tag] of Object.entries({ 'flags-grid': 'div', 'game-form': 'form', 'check-button': 'button', 'new-round': 'button', 'round-status': 'div', 'filled-count': 'p', 'round-number': 'span' })) elements[id] = new Element(tag, document);
  const deterministicGame = { normalize, grade, sample: list => sample(list, 5, () => 0.9999) };
  vm.runInNewContext(fs.readFileSync(path.join(base, 'app.js'), 'utf8'), { document, FlagCountries: countries, FlagGame: deterministicGame });
  return { elements, document };
}

test('app: cinco campos sem nomes revelados, conferência única e nova rodada', () => {
  const { elements: el, document } = appFixture();
  const grid = el['flags-grid'];
  const inputs = grid.querySelectorAll('input');
  assert.equal(inputs.length, 5);
  assert.ok(inputs.every(input => input.type === 'text' && !input.disabled));
  assert.equal(document.activeElement, inputs[0]);
  let enterPrevented = false;
  inputs[0].events.keydown({ key: 'Enter', preventDefault() { enterPrevented = true; } });
  assert.ok(enterPrevented);
  assert.equal(document.activeElement, inputs[1]);
  assert.equal(el['round-status'].children.length, 0);
  assert.equal(el['new-round'].hidden, true);
  grid.querySelectorAll('img').forEach((image, i) => {
    assert.equal(image.alt, `Bandeira ${i + 1} da rodada`);
    assert.equal(image.src, countries[i].flag);
    assert.equal(inputs[i].name, `answer-${i}`);
  });
  inputs.forEach((input, i) => { input.value = countries[i].name; });
  el['game-form'].events.input();
  assert.equal(el['filled-count'].textContent, '5 de 5 respostas preenchidas');
  let prevented = false;
  el['game-form'].events.submit({ preventDefault() { prevented = true; } });
  assert.ok(prevented);
  assert.ok(inputs.every(input => input.disabled));
  assert.equal(el['round-status'].children[0].textContent, 'Você acertou 5 de 5!');
  assert.equal(el['check-button'].disabled, true);
  assert.equal(el['check-button'].hidden, true);
  assert.equal(el['new-round'].hidden, false);
  assert.equal(document.activeElement, el['new-round']);
  inputs[0].value = 'errado';
  el['game-form'].events.submit({ preventDefault() {} });
  assert.equal(el['round-status'].children[0].textContent, 'Você acertou 5 de 5!');
  grid.querySelectorAll('.feedback').forEach((feedback, i) => assert.equal(feedback.children[1].textContent, countries[i].name));
  el['new-round'].events.click();
  assert.equal(el['round-number'].textContent, '02');
  assert.equal(el['filled-count'].textContent, '0 de 5 respostas preenchidas');
  assert.equal(el['check-button'].disabled, false);
  assert.equal(el['check-button'].hidden, false);
  assert.equal(el['new-round'].hidden, true);
  assert.ok(grid.querySelectorAll('input').every(input => !input.disabled && input.value === ''));
  assert.ok(grid.querySelectorAll('.feedback').every(feedback => feedback.children.length === 0));
  assert.equal(document.activeElement, grid.querySelector('input'));
});

test('app: vazios mostram resposta correta, falha de imagem impede conferência', () => {
  const { elements: el } = appFixture();
  el['game-form'].events.submit({ preventDefault() {} });
  assert.equal(el['round-status'].children[0].textContent, 'Você acertou 0 de 5!');
  assert.ok(el['flags-grid'].querySelectorAll('.feedback').every(feedback => feedback.children[0].textContent === '× Sem resposta'));
  el['new-round'].events.click();
  el['flags-grid'].querySelector('img').events.error();
  assert.equal(el['check-button'].disabled, true);
  assert.equal(el['new-round'].hidden, false);
  el['game-form'].events.submit({ preventDefault() {} });
  assert.equal(el['round-status'].children[0].textContent, 'Não foi possível carregar uma bandeira.');
});

test('página usa recursos locais e scripts clássicos compatíveis com file://', () => {
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  assert.match(html, /lang="pt-BR"/);
  assert.doesNotMatch(html, /(?:src|href)="(?:https?:|\/\/)|type="module"/);
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(fs.existsSync(path.join(base, match[1])));
  for (const file of ['app.js', 'game.js', 'countries.js']) {
    const source = fs.readFileSync(path.join(base, file), 'utf8');
    assert.doesNotMatch(source, /\bfetch\(|XMLHttpRequest|\bimport\s/);
    new vm.Script(source);
  }
});
