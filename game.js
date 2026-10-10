(function (root) {
  'use strict';
  function normalize(value) {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, ' ');
  }
  function sample(countries, count = 5, random = Math.random) {
    if (count > countries.length || count < 0) throw new RangeError('Quantidade inválida de países.');
    const pool = [...countries];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }
  function grade(countries, answers) {
    const results = countries.map((country, index) => {
      const answer = normalize(answers[index] ?? '');
      return { country, correct: answer !== '' && country.answers.some(accepted => normalize(accepted) === answer) };
    });
    return { results, score: results.filter(result => result.correct).length };
  }
  root.FlagGame = Object.freeze({ normalize, sample, grade });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FlagGame;
})(globalThis);
