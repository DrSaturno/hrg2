# Tasks — Reconstrucción HRG2

Cada tarea referencia el/los requirement(s) (`R#`) que satisface. Se marca `[x]` solo cuando su criterio de verificación se cumplió realmente, no cuando el código "debería" funcionar.

## Fase A — Scaffold
- [x] A1. Inicializar proyecto Astro en `web/`. *(infraestructura)* — Astro 4.16.19 pinned (Node instalado es 20.15.0; `create-astro` last y Astro 7 exigen Node ≥22.12, no disponibles en esta máquina).
- [x] A2. Instalar y configurar `@astrojs/sitemap` en `astro.config.mjs`. → R6.3
- [x] A3. Copiar `estilos.css` a `web/src/styles/estilos.css` sin modificar variables/paleta. → R3.2
- [x] A4. Copiar `Img/` a `web/public/Img/` excluyendo `Logoruben.png`. → R9.2
- [x] A5. Crear `BaseLayout.astro` (head único, props title/description/ogImage/canonical, una versión de Bootstrap, una fuente de Font Awesome). → R6.1, R6.2, R6.4, R8.1, R8.2, R8.3
- [x] A6. Crear `Header.astro`, `Footer.astro`, `WhatsAppWidget.astro` portando el HTML/clases de `header.html`/`footer.html`/`whatsapp.html`. → R1.1
- [x] A7. Crear `index.astro` con las secciones curadas actuales de la home, usando `BaseLayout` + `ProductCard`. → R1.1

**Verificación de fase**: ✅ `npm run dev` sirve la home en `localhost:4321`, header/footer/whatsapp widget visibles, estilos aplicados, 0 errores de consola, 0 404 de red, buscador probado vía JS (filtra correctamente).

## Fase B — Migración de datos
- [x] B1. Escribir `scripts/migrate.mjs` (extracción descrita en `design.md`). → R3.1, R2.1 — clasificación por contenido real (no por nombre de archivo: hay listados como `escobillas.html`/`Accesorios.html`/`nuevayork.html` que no se llaman `index.html`).
- [x] B2. Ejecutar el script contra `../productos/` y generar `web/src/data/catalog.json`. — 1021 nodos (75 listados, 946 productos) desde 1021 archivos `.html` bajo `productos/` (1025 totales del sitio − index/header/footer/whatsapp.html de la raíz).
- [x] B3. Completar los nodos de Conexiones. → R4.1, R4.2, R4.3 — corregido respecto al plan original: los 3 subarchivos (`LatynFlex`, `LatynPlas`, `Valforte`) están rotos, no solo 2 (ver nota en `design.md`). Los 3 se reconstruyen desde las tarjetas reales de `conexiones/index.html`.
- [x] B4. Validación. → R4 (cero regresión de contenido) — spot-check manual de 10 nodos (Instalables, Terminaciones a profundidad 6, Deco/Cerámica anidado, Sanitarios, Conexiones) contra el HTML original + validación automática de todo el catálogo (0 parents huérfanos, 0 children inexistentes, 0 slugs duplicados, 0 tablas de specs mal formadas).

**Verificación de fase**: ✅ 1021 nodos, consistencia estructural 100% verificada por script. Bugs adicionales del sitio viejo encontrados y corregidos durante la migración (no estaban en el análisis original): tarjeta "Vanitory 3" enlazaba a la imagen en vez de al producto; tarjeta "Percha" (accesorios31) y "Varilla en L" (pisos21) enlazaban al producto hermano equivocado, dejándolos inalcanzables; página `Deco/Guardas-y-terminaciones` es un estado vacío intencional ("no hay productos"), no un error.

## Fase C — Rutas dinámicas
- [x] C1. Crear `ProductCard.astro` (imagen `loading="lazy"` por defecto, prop `eager` para above-the-fold). → R7.1, R7.2 — hecho en Fase A, reutilizado aquí.
- [x] C2. Crear `src/pages/productos/[...slug].astro` con `getStaticPaths()` sobre `catalog.json`, plantilla listado (R2.1, R2.2) y plantilla producto (R3.1, R3.2, R3.3).
- [x] C3. Buscador en la home (`search.client.js`, hecho en Fase A). → R5.1, R5.2

**Verificación de fase**: ✅ `npm run build` generó **1022 páginas** (1021 nodos de `catalog.json` + home) sin errores de renderizado. Se ajustó `@astrojs/sitemap` de `^3.2.1` (resolvía a 3.7.3, incompatible con Astro 4.16 — `_routes.reduce` undefined en el hook `astro:build:done`) a la versión fija `3.1.6`, compatible. Navegado en vivo (dev server): home, ficha con tabla de specs (`Instalables/campanas/campana-linea-murano`), listado (`productos/conexiones`), las 3 fichas antes rotas de Conexiones, listado anidado (`Deco/Cerámica/nuevayork/nuevayork`), y el estado vacío (`Deco/Guardas-y-terminaciones`) — todos correctos, 0 errores de consola, 0 404 de red.

## Fase D — SEO y limpieza
- [x] D1. `description`/OG por página según reglas de `design.md`. → R6.1, R6.2 — hecho en `BaseLayout.astro` + `[...slug].astro` (Fase C).
- [x] D2. `public/robots.txt`. → R6.3 — apunta a `sitemap-index.xml` (generado por `@astrojs/sitemap` en el build).
- [x] D3. Favicon real (reemplaza el 404 de `favicon.ico` detectado en el análisis) — se usa el logo real (`/Img/logoruben2.png`) en vez del favicon genérico del scaffold de Astro.
- [x] D4. Confirmar que no se copió `config/`, `css/bootstrap.min.css`, `js/main.js` al proyecto nuevo. → R9.1, R9.3 — confirmado, no existen en `web/`.
- [x] D5. `web/README.md` con instrucciones de `npm install` / `npm run dev` / `npm run build`.

**Verificación de fase**: ✅ `grep -ri "alpha3"` y `grep -ri "kit.fontawesome"` sobre `web/src` — 0 resultados (R8.1/R8.2 cumplidos).

## Fase E — Verificación
- [x] E1. `scripts/check-links.mjs` corre sobre `dist/` sin reportar enlaces rotos. → R1.2, R4.3 — **0 enlaces rotos** en 31.347 enlaces/recursos internos revisados sobre 1022 páginas.
- [x] E2. `npm run preview` (sirve `dist/` real) recorrido con el navegador: home, `productos/conexiones/Valforte`, `productos/conexiones/LatynPlas`, `productos/conexiones/LatynFlex`, ficha con tabla de specs, ficha con SKU a profundidad 6, listado con 36 productos (incluye el ítem "Percha" antes inalcanzable). → R4.1, R4.2, R4.3 — todo correcto, 0 errores de consola, 0 404.
- [x] E3. Chequeo viewport 375px (mobile): header colapsa a botón hamburguesa, menú se expande y muestra los 6 ítems de navegación al togglear.

**Verificación de fase**: ✅ Cumplida. Bugs adicionales del sitio viejo encontrados y corregidos durante esta fase (vía `check-links.mjs`, no estaban en el análisis original ni en el spot-check de Fase B): imagen `termomoldeada17.jpg` referenciada con extensión incorrecta (el archivo real es `.png`) — corregido de forma genérica en `migrate.mjs` (verifica contra el filesystem y prueba extensiones alternativas).

## Bugs del sitio viejo encontrados y corregidos durante la migración
Lista completa de defectos reales del sitio original que este proyecto corrigió (más allá de los ya documentados en el análisis inicial — arquitectura, SEO, versiones de Bootstrap):
1. `productos/conexiones/Valforte/index.html` y `.../LatynPlas/index.html` vacíos (0 bytes).
2. `productos/conexiones/LatynFlex/index.html` sin contenido real (solo header/nav truncado, sin cierre de documento).
3. Tarjeta "Vanitory 3" enlazaba a la imagen (`.jpg`) en vez de al producto (`vanitory3.html`).
4. Tarjeta "Percha" (`accesorios31`) enlazaba por error al producto anterior (`accesorios30`), dejándola inalcanzable.
5. Tarjeta "Varilla en L Esmerilado 2mm x 15mm" (`pisos21`) no tenía botón "Ver Producto" en absoluto.
6. Imagen `termomoldeada17.jpg` no existe; el archivo real es `termomoldeada17.png`.
7. `conexiones/index.html` tiene `<title>Categorias</title>` (copiado por error).
8. Listado `Sanitarios/productos-sanitarios/Accesorios.html` (mayúscula) vive en una carpeta con nombre distinto de su subcarpeta de productos (`accesorios/`, minúscula) — inconsistencia de mayúsculas que rompería en hosting case-sensitive.

## Fase F — Entrega
- [ ] F1. Confirmar con el usuario nombre de rama y mensaje de commit.
- [ ] F2. `git push` a `origin` (`https://github.com/DrSaturno/hrg2.git`).

**Verificación de fase**: el push se confirma explícitamente con el usuario antes de ejecutarse (constitución, punto 7).
