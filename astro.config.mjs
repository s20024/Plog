import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://plog.s20024.com',
  integrations: [
    mdx({
      rehypePlugins: [
        [
          rehypeExternalLinks,
          {
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        ],
      ],
      shikiConfig: {
        theme: 'snazzy-light', // default: 'github-dark'
      },
    }),
    sitemap(),
    react(),
  ],
});
