// Recorre dist/**/*.html y confirma que todo href/src interno resuelve a un archivo real
// del build. Es la prueba automatizada de R1.2 y R4.3 (no reintroducir páginas rotas).
import fg from 'fast-glob';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

function isInternal(url) {
  if (!url) return false;
  return (
    url.startsWith('/') &&
    !url.startsWith('//') &&
    !url.startsWith('/@') // vite/dev artifacts, no deberían aparecer en dist pero por las dudas
  );
}

function resolveToFile(urlPath) {
  const clean = urlPath.split('#')[0].split('?')[0];
  if (!clean) return null;
  if (/\.[a-z0-9]+$/i.test(clean)) {
    // tiene extensión (imagen, pdf, css, etc.)
    return path.join(DIST_DIR, decodeURIComponent(clean));
  }
  // ruta de página: Astro (build.format "directory") -> /foo/ -> foo/index.html
  const withoutTrailingSlash = clean.endsWith('/') ? clean.slice(0, -1) : clean;
  return path.join(DIST_DIR, decodeURIComponent(withoutTrailingSlash), 'index.html');
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('No existe dist/. Corré "npm run build" primero.');
    process.exit(1);
  }

  const files = await fg('**/*.html', { cwd: DIST_DIR });
  const broken = [];
  let checked = 0;

  for (const relPath of files) {
    const abs = path.join(DIST_DIR, relPath);
    const html = fs.readFileSync(abs, 'utf-8');
    const $ = cheerio.load(html);

    const urls = new Set();
    $('a[href]').each((_, el) => urls.add($(el).attr('href')));
    $('img[src]').each((_, el) => urls.add($(el).attr('src')));
    $('link[href]').each((_, el) => urls.add($(el).attr('href')));

    for (const url of urls) {
      if (!isInternal(url)) continue;
      checked++;
      const target = resolveToFile(url);
      if (!fs.existsSync(target)) {
        broken.push({ from: relPath, url, target: path.relative(DIST_DIR, target) });
      }
    }
  }

  console.log(`Archivos HTML revisados: ${files.length}`);
  console.log(`Enlaces/recursos internos revisados: ${checked}`);

  if (broken.length) {
    console.log(`\n${broken.length} ENLACES ROTOS:`);
    for (const b of broken) {
      console.log(`  - en ${b.from}: "${b.url}" -> no existe ${b.target}`);
    }
    process.exit(1);
  }

  console.log('\n0 enlaces rotos.');
}

main();
