// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio de producción. Se usa para generar URLs absolutas en sitemap.xml,
// canonical y Open Graph.
const SITE_URL = 'https://hrg2.com';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap()],
});
