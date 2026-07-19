# Constitución — Reconstrucción HRG2

Principios no negociables para este proyecto. Cualquier decisión de diseño o implementación que entre en conflicto con uno de estos puntos se resuelve a favor del principio, no de la conveniencia puntual.

## 1. Preservar las URLs públicas actuales
La estructura de rutas bajo `/productos/**` del sitio nuevo debe coincidir 1:1 con la del sitio actual (misma jerarquía de carpetas, mismos nombres de archivo sin extensión `.html` → slug). No se rompen enlaces, códigos QR ni links ya compartidos por WhatsApp o impresos.

## 2. El sitio actual no se toca hasta el corte final
Todo el desarrollo ocurre en `web/`, una carpeta nueva dentro del mismo repo. Los archivos existentes en la raíz (`index.html`, `header.html`, `productos/`, etc.) permanecen intactos y funcionales durante toda la migración. No hay "mientras tanto roto".

## 3. Un solo layout gobierna todas las páginas
Ningún dato de cabecera, pie, o `<head>` se duplica archivo por archivo. Cambiar el diseño una vez en `BaseLayout.astro` / `Header.astro` / `Footer.astro` debe propagarse automáticamente a las ~1.025 páginas generadas. Este es el problema de raíz que este proyecto existe para resolver — no se reintroduce.

## 4. Cero regresión de contenido
Todo producto, imagen, descripción, tabla de medidas y PDF que existe hoy en el sitio viejo debe seguir existiendo y siendo accesible en el sitio nuevo. La migración de datos se valida contra el contenido real, no se inventa ni se resume contenido de producto.

## 5. Los bugs conocidos se corrigen, no se migran
Las páginas vacías de Conexiones (Valforte, LatynPlas), las rutas rotas (`includes.js`, `estilos.css` en `LatynFlex`), la mezcla de versiones de Bootstrap y las tres fuentes de Font Awesome no se replican en el sitio nuevo. Se documentan como requirements con criterio de aceptación explícito (ver `requirements.md`).

## 6. Especificar antes de implementar
`requirements.md` y `design.md` se completan y quedan versionados en el repo antes de escribir código de producto. `tasks.md` es la única fuente de verdad sobre qué falta hacer; el trabajo avanza tarea por tarea, marcando cada una solo cuando su criterio de aceptación se cumple.

## 7. No se despliega ni se pushea sin confirmar
El build se verifica en local (servidor estático + navegador) antes de cualquier `git push`. El push a `origin` (`https://github.com/DrSaturno/hrg2.git`) ocurre una sola vez, al final, con rama y mensaje confirmados. No se hace force-push. No se despliega a un hosting (Vercel/Netlify/Pages) como parte de este proyecto — es una decisión aparte, posterior.
