# HRG2 — Materiales para Obra (sitio nuevo)

Reconstrucción del catálogo de HRG2 con [Astro](https://astro.build), reemplazando el sitio estático anterior (~1.025 archivos HTML escritos a mano). Ver [`specs/hrg2-astro-rebuild/`](../specs/hrg2-astro-rebuild/) en la raíz del repo para el contexto completo (constitución, requirements, diseño técnico y tareas de esta reconstrucción).

## Requisitos

- Node **20.3+** (probado con 20.15.0) o 18.17.1+ / 21+. **No usar Node 22+ con `create-astro`/Astro 7** sin actualizar `astro.config.mjs` y `package.json` — este proyecto está fijado a Astro `4.16.19` porque es la última versión mayor compatible con Node 20.

## Estructura

```
web/
  scripts/
    migrate.mjs        # regenera src/data/catalog.json desde ../productos/**/*.html
  src/
    data/catalog.json   # catálogo completo (generado — no editar a mano salvo casos documentados en migrate.mjs)
    layouts/BaseLayout.astro
    components/          # Header, Footer, WhatsAppWidget, ProductCard
    pages/
      index.astro
      productos/[...slug].astro   # una sola plantilla genera todas las páginas de producto/categoría
    scripts/search.client.js      # buscador de la home
    styles/estilos.css            # sistema de diseño (paleta, tipografía, sombras) — mismo que el sitio viejo
```

## Comandos

| Comando | Acción |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Build de producción a `./dist/` |
| `npm run preview` | Sirve `./dist/` para probar el build |
| `npm run migrate` | Re-ejecuta la migración de datos desde `../productos/` a `src/data/catalog.json` |
| `npm run check-links` | Valida que todos los enlaces internos del build resuelvan a páginas reales |

## Antes de desplegar a producción

- Reemplazar `SITE_URL` en `astro.config.mjs` por el dominio real (hoy es un placeholder: `https://www.hrg2materiales.com.ar`).
- Correr `npm run build && npm run check-links` y confirmar 0 enlaces rotos.
