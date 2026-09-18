import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import rehypeExternalLinks from 'rehype-external-links';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://plog.s20024.com',
  // memo: canonical・サイトマップと同じ「末尾スラッシュあり」に内部リンクも統一する(なしのURLは 301 リダイレクトになるため)。
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
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
    sitemap({
      // memo: 検索ページは noindex のため、サイトマップに含めない。
      filter: (page) => new URL(page).pathname !== '/search/',
    }),
    react(),
    // memo: ビルド後にPagefindの検索インデックスを生成し、開発サーバーでは前回ビルドのインデックスを配信する。
    pagefind(),
  ],
});
