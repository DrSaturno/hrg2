# Requirements — Reconstrucción HRG2

Formato: historia de usuario + criterios de aceptación en estilo EARS (`Cuando <evento>, el sistema debe <comportamiento>`). Cada requirement tiene un ID (`R#`) referenciado desde `tasks.md`.

## R1 — Navegación de categorías
**Como** visitante del sitio, **quiero** navegar por categorías y subcategorías desde el menú superior, **para** encontrar el tipo de material que busco.

- R1.1 Cuando el visitante carga cualquier página del sitio, el sistema debe mostrar el mismo header con el mismo menú de categorías (Instalables, Terminaciones, Conexiones, Sanitarios, Deco) que existe hoy en `header.html`.
- R1.2 Cuando el visitante hace clic en cualquier ítem del menú, el sistema debe navegar a una página que existe y tiene contenido (cero enlaces del menú apuntando a páginas vacías o inexistentes).
- R1.3 Cuando se compara con el sitio actual, cada URL bajo `/productos/**` del sitio nuevo debe coincidir con la URL equivalente del sitio actual (mismo path, mismo nombre de archivo sin `.html`).

## R2 — Listado de categoría/subcategoría
**Como** visitante, **quiero** ver todos los productos de una categoría en una grilla de tarjetas, **para** comparar opciones antes de entrar al detalle.

- R2.1 Cuando el visitante entra a una página de listado (equivalente a un `index.html` actual), el sistema debe mostrar una tarjeta por cada producto/subcategoría hijo, con imagen, título y un link "Ver más"/"Ver Producto".
- R2.2 Cuando una categoría actual tiene sub-listados anidados (ej. `Deco/Cerámica/nuevayork/`), el sistema debe preservar esa jerarquía en el sitio nuevo.

## R3 — Ficha de producto
**Como** visitante, **quiero** ver el detalle de un producto (imagen, descripción, medidas si aplica), **para** decidir si me sirve y consultar por WhatsApp.

- R3.1 Cuando el visitante entra a una ficha de producto, el sistema debe mostrar título, imagen principal, descripción y — si el producto original tenía tabla de medidas o SKU — esa misma información.
- R3.2 Cuando la ficha de producto se renderiza, el sistema debe usar el diseño "Premium 2026" (variables de `estilos.css`, clases `.product-detail-img` / `.product-info-box`) — no el Bootstrap plano que usan hoy 1.019 de 1.025 páginas.
- R3.3 Cuando el visitante quiere volver, el sistema debe ofrecer un link de regreso al listado padre correcto.

## R4 — Corrección de contenido roto conocido
**Como** dueño del sitio, **quiero** que las páginas de Conexiones funcionen, **para** no perder consultas de clientes.

- R4.1 Cuando el visitante navega a la página de Valforte, el sistema debe mostrar contenido real (no una página en blanco) con al menos: imagen, descripción breve y link de descarga a `Valforteok.pdf`.
- R4.2 Cuando el visitante navega a la página de LatynPlas, el sistema debe mostrar contenido real equivalente, con link de descarga a `Latynplastok.pdf`.
- R4.3 Cuando cualquier página del sitio nuevo carga sus recursos (CSS, JS, imágenes), el sistema debe resolver todas las rutas sin 404 — no debe existir el caso de `LatynFlex` actual donde `includes.js` y `estilos.css` no cargan.

## R5 — Buscador y filtro
**Como** visitante, **quiero** buscar productos por texto y filtrar por categoría desde la home, **para** encontrar rápido lo que necesito.

- R5.1 Cuando el visitante escribe en el buscador de la home, el sistema debe filtrar las tarjetas visibles por coincidencia de texto en el título, igual que el comportamiento actual de `filtros-buscador.js`.
- R5.2 Cuando el visitante selecciona una categoría en el filtro, el sistema debe mostrar solo las tarjetas de esa categoría y ocultar secciones sin resultados.

## R6 — SEO
**Como** dueño del sitio, **quiero** que Google pueda indexar correctamente cada página, **para** aparecer en búsquedas relevantes.

- R6.1 Cuando se renderiza cualquier página, el sistema debe incluir `<meta name="description">` con contenido específico de esa página (no genérico repetido).
- R6.2 Cuando se renderiza cualquier página, el sistema debe incluir Open Graph (`og:title`, `og:description`, `og:image`) para que los links compartidos por WhatsApp muestren preview.
- R6.3 Cuando se genera el build, el sistema debe producir un `sitemap.xml` con todas las URLs y un `robots.txt` que lo referencie.
- R6.4 Cuando se renderiza cualquier página, el `<title>` debe ser único y descriptivo (incluir nombre de producto + "HRG2").

## R7 — Rendimiento de imágenes
**Como** visitante en un celular con conexión limitada, **quiero** que las páginas de catálogo carguen rápido, **para** no abandonar el sitio.

- R7.1 Cuando una página de listado renderiza múltiples tarjetas, cada `<img>` debe tener `loading="lazy"` excepto la primera imagen visible sobre el pliegue.
- R7.2 Cuando se renderiza cualquier `<img>`, el sistema debe declarar `width`/`height` (o `aspect-ratio` vía CSS) para evitar layout shift.

## R8 — Consistencia técnica
**Como** desarrollador que mantiene el sitio a futuro, **quiero** una sola fuente de verdad para dependencias externas, **para** no tener versiones desincronizadas.

- R8.1 El sitio completo debe cargar una única versión de Bootstrap (no debe coexistir `5.3.0` y `5.3.0-alpha3`).
- R8.2 El sitio completo debe cargar Font Awesome desde una única fuente (no CDNJS + Kit script simultáneos).
- R8.3 El `<head>` de cada página debe generarse desde un único componente de layout, no copiado a mano.

## R9 — Limpieza de artefactos muertos
**Como** dueño del repo, **quiero** que no queden archivos sin uso, **para** que el repo sea entendible.

- R9.1 El sitio nuevo no debe incluir `config/` (restos de otro generador, confirmado sin referencias en el código actual).
- R9.2 El sitio nuevo no debe incluir `Img/Logoruben.png` (1.8 MB, sin referencias).
- R9.3 El sitio nuevo no debe incluir archivos vacíos heredados (`css/bootstrap.min.css`, `js/main.js`, `README.md` vacío del sitio viejo).
