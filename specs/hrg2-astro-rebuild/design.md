# Design — Reconstrucción HRG2

## Stack
- **Astro** (SSG, sin framework de UI adicional — el sitio actual no tiene interactividad compleja que justifique React/Vue). Genera HTML estático puro, coherente con "catálogo sin backend".
- `@astrojs/sitemap` para R6.3.
- Node + `cheerio` + `fast-glob` como dependencias de dev-only para el script de migración (Fase B) — no forman parte del sitio final.

## Estructura de carpetas (`web/`)
```
web/
  astro.config.mjs
  package.json
  public/
    Img/              # copia 1:1 de la carpeta Img/ actual (sin Logoruben.png)
  scripts/
    migrate.mjs        # genera src/data/catalog.json a partir de ../productos/**/*.html
    check-links.mjs     # Fase E: valida hrefs/src del build contra el filesystem
  src/
    data/
      catalog.json      # generado, no editado a mano (excepto Valforte/LatynPlas, ver abajo)
    layouts/
      BaseLayout.astro
    components/
      Header.astro
      Footer.astro
      WhatsAppWidget.astro
      ProductCard.astro
      SearchFilter.astro
    styles/
      estilos.css        # portado tal cual desde la raíz del sitio actual
    pages/
      index.astro
      productos/
        [...slug].astro  # una sola ruta genera las ~1.025 páginas
    scripts/
      search.client.js   # puerto de filtros-buscador.js, ahora reutilizable en cualquier página
```

## Modelo de datos: `catalog.json`
Array plano de nodos. Cada nodo corresponde exactamente a un archivo `.html` del sitio actual bajo `productos/`.

```json
{
  "slug": "Instalables/campanas/campana-linea-murano",
  "type": "product",
  "title": "Campana Línea Murano",
  "description": "Construida en Acero Inoxidable Esmerilado y Vidrio Float templado gris plano...",
  "image": { "src": "/Img/SoncaHermanos/Campanas/Campana_linea_murano.jpg", "alt": "Campana Línea Murano" },
  "sku": null,
  "specs": {
    "headers": ["FRENTE", "PROFUNDO", "ALTO"],
    "rows": [["600","520","60"], ["750","520","60"], ["900","520","60"]]
  },
  "parent": "Instalables/campanas"
}
```

Para nodos `type: "listing"` (los actuales `index.html`), en vez de `description`/`specs`/`sku` se guarda `children: string[]` (slugs de los hijos, en el orden en que aparecían las tarjetas originales).

`slug` es la clave única y es literalmente el path público: la ruta final es `/productos/<slug>`. Esto satisface R1.3 por construcción.

### Extracción (`migrate.mjs`)
Por cada archivo `productos/**/*.html`:
1. `slug` = ruta relativa a `productos/`, sin extensión, con separadores `/` (normalizando `productos/Deco/Cerámica/...` tal cual, con acentos incluidos — igual que hoy).
2. `type` = `"listing"` si el nombre de archivo es `index.html`, si no `"product"`.
3. `title` = texto de `<title>`.
4. Si `listing`: recorrer cada `.card` dentro de `<main>`, extraer `img[src]`/`alt`, `.card-title`, `.card-text`, y el `href` del `<a>` (resuelto a slug relativo).
5. Si `product`: primer `<img>` dentro de `<main>` (src+alt), párrafos `<p>` de `<main>` fuera de tablas como `description` (unidos), primera `<table>` si existe → `specs`, patrón `SKU:` en el texto → `sku`.
6. `parent` = slug del directorio contenedor (para el link "volver").

Casos especiales resueltos a mano después de la extracción automática (no por el script):
- **Corrección respecto al `design.md` original**: al releer `productos/conexiones/LatynFlex/index.html` completo se confirmó que tampoco tiene contenido de producto — es un `<header>`/nav truncado, sin `<main>`, sin imagen, sin PDF, sin cierre `</body></html>`, y con `<title>Terminaciones - HRG2</title>` (mal etiquetado). Los 3 subnodos de Conexiones (`LatynFlex`, `LatynPlas`, `Valforte`) están rotos, no solo 2.
- El contenido real de estas 3 marcas sí existe: en `productos/conexiones/index.html`, que tiene tarjetas completas (imagen, descripción, link de descarga a PDF) para LatynFlex, LatynPlast y Valforte. `migrate.mjs` extrae esas 3 tarjetas de `conexiones/index.html` y las usa como fuente de datos para generar los nodos `Instalables/conexiones/LatynFlex`, `.../LatynPlas`, `.../Valforte` como fichas de producto simples (imagen + descripción + botón de descarga de PDF), en vez de intentar extraer de los archivos rotos. Satisface R4.1/R4.2/R4.3.

## Rutas
`src/pages/productos/[...slug].astro` con `getStaticPaths()`:
```js
export function getStaticPaths() {
  return catalog.map(node => ({
    params: { slug: node.slug },
    props: { node }
  }));
}
```
Dentro de la página: si `node.type === "listing"` renderiza la grilla de `ProductCard` (uno por `children`); si `"product"` renderiza la ficha de detalle (imagen grande, descripción, tabla de specs si existe, SKU si existe, botón "Volver a `parent`"). Esto satisface R2 y R3 con un único archivo de plantilla, cumpliendo el principio 3 de la constitución.

La home (`src/pages/index.astro`) no sale de `catalog.json` — replica manualmente las secciones curadas que ya tiene `index.html` hoy (una selección editorial de productos destacados por categoría), porque esa curaduría es intencional y no se puede derivar automáticamente del árbol completo.

## Layout y componentes
- `BaseLayout.astro` recibe `title`, `description`, `ogImage` como props y arma un único `<head>` (charset, viewport, title, meta description, OG, canonical con `Astro.url`, un solo link a Bootstrap 5.3.0 estable, un solo link a Font Awesome CDNJS, `estilos.css`). Resuelve R6.1, R6.2, R6.4, R8.1, R8.2, R8.3.
- `Header.astro` / `Footer.astro` / `WhatsAppWidget.astro`: mismo HTML/clases que hoy (para no tocar el diseño ya aprobado), pero como componentes reales renderizados server-side — no más `fetch` + `innerHTML` con un documento anidado.
- `ProductCard.astro`: una sola definición de tarjeta (imagen con `loading="lazy"` salvo `eager` explícito para la primera fila visible, título, texto, link) usada tanto en home como en listados — resuelve R7.1/R7.2 en un solo lugar.

## Buscador
`SearchFilter.astro` + `search.client.js`: mismo comportamiento que `filtros-buscador.js` actual (filtra `.producto` por texto de `.card-title` y por `data-categoria`), pero como script reutilizable. En la home sigue operando sobre las tarjetas curadas ya presentes en el DOM (no necesita cargar `catalog.json` completo en el cliente).

## SEO
- `@astrojs/sitemap` genera `sitemap.xml` automáticamente a partir de las rutas del build (R6.3).
- `robots.txt` estático en `public/robots.txt` apuntando a `/sitemap-index.xml`.
- `description` por página: para productos, primeras ~155 palabras de `description` extraída; para listados, texto fijo tipo "Catálogo de {title} — HRG2, materiales para obra."; para la home, la copy actual del hero.

## Verificación (Fase E)
`scripts/check-links.mjs`: después de `astro build`, recorre `dist/**/*.html`, extrae todos los `href`/`src` internos (no externos/CDN) y confirma que cada uno resuelve a un archivo real dentro de `dist/`. Falla el script (exit code ≠ 0) si encuentra alguno roto — esto es una prueba automatizada de R1.2 y R4.3, y evita reintroducir la clase de bug que motivó todo este proyecto.
