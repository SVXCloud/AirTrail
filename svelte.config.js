import { preprocessMeltUI, sequence } from '@melt-ui/pp';
import adapter from '@sveltejs/adapter-node';
import { buildBasePath } from './scripts/subpath/base-path.js';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config}*/
const config = {
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    adapter: adapter({
      precompress: process.env.AIRTRAIL_TEMPLATE_BUILD !== '1',
    }),
    paths: { base: buildBasePath(), relative: false },
    // Origin checking is reimplemented in src/hooks.server.ts so the OAuth
    // token/revoke endpoints can accept form-encoded POSTs from non-browser
    // clients, which send no Origin header (RFC 6749 §3.2, §4.1.3).
    csrf: { checkOrigin: false },
    version: { name: process.env.npm_package_version },
  },
};
export default config;
