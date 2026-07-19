// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NOTA: reemplazar por el dominio real antes de desplegar a producción.
// Se usa para generar URLs absolutas en sitemap.xml, canonical y Open Graph.
const SITE_URL = 'https://www.hrg2materiales.com.ar';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap()],
});
