/* Ferramenta de manutenção. Não é necessária para abrir ou jogar. */
const fs = require('node:fs/promises');
const path = require('node:path');
const countries = require('../countries.js');
const base = path.resolve(__dirname, '..');
const revision = 'v7.3.2';
const remote = `https://raw.githubusercontent.com/lipis/flag-icons/${revision}`;
async function download(relative, destination) {
  const response = await fetch(`${remote}/${relative}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${relative}: HTTP ${response.status}`);
  const body = await response.text();
  if (relative.endsWith('.svg') && (!body.includes('<svg') || /<script|<foreignObject|<image|<title|<desc|(?:href|src)\s*=\s*["'](?:https?:|\/\/)/i.test(body))) throw new Error(`SVG inválido ou com conteúdo externo: ${relative}`);
  await fs.writeFile(destination, body);
}
(async () => {
  await fs.mkdir(path.join(base, 'assets/flags'), { recursive: true });
  await download('LICENSE', path.join(base, 'assets/flags/LICENSE.txt'));
  let cursor = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (cursor < countries.length) {
      const country = countries[cursor++];
      await download(`flags/4x3/${country.code}.svg`, path.join(base, country.flag));
    }
  }));
  console.log(`${countries.length} bandeiras locais baixadas de flag-icons ${revision}.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
