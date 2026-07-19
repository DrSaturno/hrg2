// Migra productos/**/*.html (sitio viejo) a web/src/data/catalog.json (sitio nuevo).
// Ver specs/hrg2-astro-rebuild/design.md para el modelo de datos y las reglas de extracción.
import fg from 'fast-glob';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTOS_DIR = path.resolve(__dirname, '../../productos');
const IMG_DIR = path.resolve(__dirname, '../../Img');
const OUT_FILE = path.resolve(__dirname, '../src/data/catalog.json');

const warnings = [];
const unresolvedCardRefs = []; // { listingSlug, currentDir, title }

function slugFromRelPath(relPath) {
  let noExt = relPath.replace(/\.html$/i, '');
  if (path.posix.basename(noExt).toLowerCase() === 'index') {
    noExt = path.posix.dirname(noExt);
    if (noExt === '.') noExt = '';
  }
  return noExt;
}

function parentOfSlug(slug) {
  if (!slug) return null;
  const dir = path.posix.dirname(slug);
  return dir === '.' ? null : dir;
}

function resolveHrefToSlug(href, currentDir) {
  if (!href) return null;
  const h = href.trim();
  if (
    h === '' ||
    h.startsWith('#') ||
    h.startsWith('http://') ||
    h.startsWith('https://') ||
    h.startsWith('mailto:') ||
    h.startsWith('tel:') ||
    h.startsWith('javascript:')
  )
    return null;

  const clean = h.split('#')[0].split('?')[0];
  if (!clean) return null;

  let resolved;
  if (clean.startsWith('/productos/')) {
    resolved = clean.slice('/productos/'.length);
  } else if (clean.startsWith('/')) {
    // absoluto pero fuera de /productos/ (ej. /index.html, /Img/...) -> no es un nodo del catálogo
    return null;
  } else {
    resolved = path.posix.normalize(path.posix.join(currentDir, clean));
  }

  if (!/\.html?$/i.test(resolved)) return null;
  return slugFromRelPath(resolved.replace(/^\.\//, ''));
}

// Corrige imágenes referenciadas con la extensión equivocada en el sitio viejo
// (ej. "termomoldeada17.jpg" en el HTML cuando el archivo real es "termomoldeada17.png").
const EXT_CANDIDATES = ['.jpg', '.jpeg', '.png', '.webp'];
function fixExtensionIfBroken(relFromImgRoot) {
  const abs = path.join(IMG_DIR, decodeURIComponent(relFromImgRoot));
  if (fs.existsSync(abs)) return relFromImgRoot;
  const ext = path.extname(abs);
  const base = abs.slice(0, -ext.length);
  for (const candidate of EXT_CANDIDATES) {
    if (fs.existsSync(base + candidate)) {
      warnings.push(`[imagen-corregida] ${relFromImgRoot} -> extensión real es "${candidate}"`);
      return relFromImgRoot.slice(0, -ext.length) + candidate;
    }
  }
  warnings.push(`[imagen-rota] ${relFromImgRoot} no existe con ninguna extensión conocida`);
  return relFromImgRoot;
}

function normalizeImgSrc(src) {
  if (!src) return null;
  const idx = src.indexOf('Img/');
  if (idx === -1) return src;
  const relFromImgRoot = src.slice(idx + 'Img/'.length);
  return '/Img/' + fixExtensionIfBroken(relFromImgRoot);
}

function extractCards($, root, currentDir) {
  const cards = [];
  root.find('.card').each((_, el) => {
    const $card = $(el);
    const img = $card.find('img').first();
    const title = $card.find('.card-title').first().text().trim();
    const text = $card.find('.card-text').first().text().trim();
    const linkEl = $card.find('a[href]').first();
    const href = linkEl.attr('href');
    const linkText = linkEl.text().trim();
    cards.push({
      title,
      description: text || null,
      image: { src: normalizeImgSrc(img.attr('src')), alt: (img.attr('alt') || title || '').trim() },
      href: href || null,
      linkText: linkText || null,
      slug: resolveHrefToSlug(href, currentDir),
    });
  });
  return cards;
}

async function main() {
  const files = await fg('**/*.html', { cwd: PRODUCTOS_DIR });
  files.sort();

  /** @type {Map<string, any>} */
  const nodes = new Map();

  for (const relPath of files) {
    const abs = path.join(PRODUCTOS_DIR, relPath);
    const html = fs.readFileSync(abs, 'utf-8');
    const $ = cheerio.load(html);
    const currentDir = path.posix.dirname(relPath.split(path.sep).join('/'));
    const slug = slugFromRelPath(relPath.split(path.sep).join('/'));

    const main = $('main').length ? $('main') : $('body');
    const title = $('title').first().text().trim() || $('h1').first().text().trim() || path.posix.basename(slug);

    // Una página es "listado" si envuelve su contenido en tarjetas .card que enlazan
    // a otras páginas .html (una o más) — el patrón usado consistentemente en todo el
    // sitio viejo para grillas de categoría/subcategoría, incluso cuando esa grilla
    // tiene un solo producto (ver adhesivos.html, cunas-niveladoras.html).
    const cardLinks = main.find('.card').toArray().filter((el) => {
      const href = $(el).find('a[href]').first().attr('href');
      if (!href) return false;
      const clean = href.split('?')[0].split('#')[0];
      return /\.html?$/i.test(clean);
    });
    const bodyText = main.text();
    const looksLikeEmptyListing =
      cardLinks.length === 0 && !main.find('img').first().attr('src') && /no hay productos|disculpas/i.test(bodyText);
    const isListing = cardLinks.length >= 1 || looksLikeEmptyListing;

    if (isListing) {
      const cards = extractCards($, main, currentDir);
      const children = [];
      for (const c of cards) {
        if (c.slug) {
          children.push(c.slug);
        } else {
          warnings.push(`[listing:${slug}] tarjeta "${c.title}" sin slug resoluble (href="${c.href}")`);
          unresolvedCardRefs.push({ listingSlug: slug, currentDir, title: c.title });
        }
      }
      let emptyMessage = null;
      if (cards.length === 0 && looksLikeEmptyListing) {
        emptyMessage = main.find('p').first().text().trim() || 'No hay productos disponibles en esta categoría por el momento.';
      }
      nodes.set(slug, {
        slug,
        type: 'listing',
        title,
        parent: parentOfSlug(slug),
        children,
        emptyMessage,
      });
    } else {
      const img = main.find('img').first();
      const paragraphs = [];
      main.find('p').each((_, el) => {
        const $p = $(el);
        if ($p.closest('table').length) return;
        const t = $p.text().trim();
        if (t && !/^SKU:/i.test(t)) paragraphs.push(t);
      });

      let sku = null;
      const skuMatch = main.text().match(/SKU:\s*([^\n]+)/i);
      if (skuMatch) sku = skuMatch[1].trim();

      let specs = null;
      const table = main.find('table').first();
      if (table.length) {
        // OJO: cheerio's .map() imita a jQuery y aplana arrays anidados (a diferencia de
        // Array.prototype.map). Se usa .toArray() + map nativo para no perder la
        // estructura fila->celdas.
        const rowCells = (trEl, selector) =>
          $(trEl).find(selector).toArray().map((cell) => $(cell).text().trim());

        let headers = table.find('thead th').toArray().map((el) => $(el).text().trim());
        let rows;
        if (headers.length) {
          rows = table.find('tbody tr').toArray().map((tr) => rowCells(tr, 'td'));
        } else {
          const allRows = table.find('tr').toArray().map((tr) => rowCells(tr, 'td,th'));
          headers = allRows[0] || [];
          rows = allRows.slice(1);
        }
        if (headers.length && rows.length) specs = { headers, rows };
      }

      if (!img.attr('src')) {
        warnings.push(`[product:${slug}] sin imagen principal`);
      }
      if (paragraphs.length === 0) {
        warnings.push(`[product:${slug}] sin descripción (posible página rota/incompleta)`);
      }

      nodes.set(slug, {
        slug,
        type: 'product',
        title,
        parent: parentOfSlug(slug),
        image: img.attr('src') ? { src: normalizeImgSrc(img.attr('src')), alt: (img.attr('alt') || title).trim() } : null,
        description: paragraphs.join('\n\n') || null,
        sku,
        specs,
      });
    }
  }

  // --- Reparación: cards cuyo link no resolvió a una página (ej. Vanitory 3 del sitio
  // viejo, cuyo botón "Ver Producto" apunta por error a la imagen en vez de a
  // vanitory3.html). Se busca un producto hermano (mismo directorio) cuyo slug,
  // normalizado, coincida con el título de la tarjeta.
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const ref of unresolvedCardRefs) {
    const wantedNorm = normalize(ref.title);
    const sibling = Array.from(nodes.values()).find(
      (n) => n.parent === ref.currentDir && normalize(path.posix.basename(n.slug)) === wantedNorm
    );
    if (sibling) {
      const listing = nodes.get(ref.listingSlug);
      if (listing && !listing.children.includes(sibling.slug)) {
        listing.children.push(sibling.slug);
        warnings.push(`[auto-corregido] "${ref.title}" en listado ${ref.listingSlug} -> ${sibling.slug}`);
      }
    }
  }

  // --- Correcciones puntuales: tarjetas del sitio viejo cuyo botón "Ver Producto"
  // apunta al hermano equivocado (copy-paste), dejando un producto real pero inalcanzable
  // desde cualquier listado. Detectadas por la validación de "parent" al final de este
  // script (un producto sin ningún listado que lo referencie como child).
  const knownOrphanFixes = [
    { listingSlug: 'Sanitarios/productos-sanitarios/Accesorios', childSlug: 'Sanitarios/productos-sanitarios/accesorios/accesorios31' },
    { listingSlug: 'Terminaciones/Perfiles-decorativos/perfiles-pisos/perfiles-pisos', childSlug: 'Terminaciones/Perfiles-decorativos/perfiles-pisos/pisos/pisos21' },
  ];
  for (const fix of knownOrphanFixes) {
    const listing = nodes.get(fix.listingSlug);
    if (listing && nodes.has(fix.childSlug) && !listing.children.includes(fix.childSlug)) {
      listing.children.push(fix.childSlug);
      warnings.push(`[auto-corregido] link roto del sitio viejo: ${fix.childSlug} agregado a ${fix.listingSlug}`);
    } else if (!listing) {
      warnings.push(`[knownOrphanFixes] no se encontró listado "${fix.listingSlug}" (¿cambió el slug?)`);
    }
  }

  // --- Caso especial: Conexiones (LatynFlex/LatynPlas/Valforte) ---
  // productos/conexiones/{LatynFlex,LatynPlas,Valforte}/index.html están rotos o vacíos
  // (ver specs/hrg2-astro-rebuild/design.md). El contenido real vive como tarjetas dentro
  // de productos/conexiones/index.html (imagen + descripción + link de descarga a PDF).
  // conexiones/index.html tiene <title>Categorias</title> (copiado por error de Categorias.html)
  // y sus 3 tarjetas enlazan a PDFs, no a páginas .html, así que el clasificador genérico
  // lo tipa como "product". Se reconstruye a mano como "listing" con los datos reales.
  if (nodes.has('conexiones')) {
    const $ = cheerio.load(fs.readFileSync(path.join(PRODUCTOS_DIR, 'conexiones/index.html'), 'utf-8'));
    const pdfCards = extractCards($, $('main'), 'conexiones');
    nodes.set('conexiones', {
      slug: 'conexiones',
      type: 'listing',
      title: 'Conexiones',
      parent: null,
      children: [],
      emptyMessage: null,
    });
    const conexionesListing = nodes.get('conexiones');
    const overrides = [
      { slug: 'conexiones/LatynFlex', match: 'latynflex' },
      { slug: 'conexiones/LatynPlas', match: 'latynplast' },
      { slug: 'conexiones/Valforte', match: 'valforte' },
    ];
    const newChildren = [];
    for (const o of overrides) {
      const card = pdfCards.find((c) => c.title.toLowerCase().replace(/\s+/g, '').includes(o.match));
      if (!card) {
        warnings.push(`[conexiones-override] no se encontró tarjeta para ${o.slug}`);
        continue;
      }
      const pdfHref = card.href && card.href.toLowerCase().endsWith('.pdf') ? card.href : null;
      nodes.set(o.slug, {
        slug: o.slug,
        type: 'product',
        title: card.title,
        parent: 'conexiones',
        image: card.image,
        description: card.description,
        sku: null,
        specs: null,
        pdf: pdfHref,
      });
      newChildren.push(o.slug);
    }
    conexionesListing.children = newChildren;
  } else {
    warnings.push('[conexiones-override] no se encontró el nodo "conexiones" (¿cambió la estructura?)');
  }

  // --- Corrección de "parent": se deriva de las relaciones children reales, no del
  // directorio. En el sitio viejo hay listados cuyo archivo vive DENTRO de su propia
  // carpeta con un nombre distinto de "index.html" (ej. Deco/Cerámica/nuevayork/nuevayork.html),
  // lo que hace que dirname(slug-del-hijo) no coincida con el slug real del listado.
  // Usar los children ya extraídos (verdad fundamental, viene de los href reales) evita
  // ese desfasaje en cualquier caso similar, conocido o no.
  for (const node of nodes.values()) {
    if (node.type !== 'listing') continue;
    for (const childSlug of node.children) {
      const child = nodes.get(childSlug);
      if (child) child.parent = node.slug;
    }
  }

  // --- Validación: todo child referenciado por un listing debe existir como nodo ---
  for (const node of nodes.values()) {
    if (node.type !== 'listing') continue;
    for (const childSlug of node.children) {
      if (!nodes.has(childSlug)) {
        warnings.push(`[listing:${node.slug}] referencia a slug inexistente "${childSlug}"`);
      }
    }
  }

  // --- Validación: todo nodo (salvo categorías raíz) debe tener un parent que exista ---
  for (const node of nodes.values()) {
    if (node.parent && !nodes.has(node.parent)) {
      warnings.push(`[${node.type}:${node.slug}] parent "${node.parent}" no existe como nodo (posible link de "volver" roto)`);
    }
  }

  const catalog = Array.from(nodes.values()).sort((a, b) => a.slug.localeCompare(b.slug));
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(catalog, null, 2), 'utf-8');

  const listingCount = catalog.filter((n) => n.type === 'listing').length;
  const productCount = catalog.filter((n) => n.type === 'product').length;
  console.log(`catalog.json generado: ${catalog.length} nodos (${listingCount} listados, ${productCount} productos)`);
  console.log(`Archivos HTML escaneados: ${files.length}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} advertencias:`);
    for (const w of warnings) console.log('  - ' + w);
  }
}

main();
