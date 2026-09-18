# [Plog(Plograming-blog)](https://plog.s20024.com)

s20024(やら)のプログラミングログです。  
github-copilotのアシスタントは、「ずんだもん」人格にしている。w  
　　→たまに、ブログの内容に補完で入ってくるから気を付けないと。w

## 環境構築

- node:v22
- その他:[package.json](package.json)参照

1. Nodeのバージョンを22に変更 (例:nodebrew)

   ```shell
   nodebrew install 22
   nodebrew use 22
   ```

2. npmのパッケージをインストール

   ```shell
   npm install
   ```

3. 開発サーバーを起動
   ```shell
   npm run dev
   ```

## Astro / Prettier

| Command                   | Action                                                     |
| :------------------------ | :--------------------------------------------------------- |
| `npm run dev`             | Starts local dev server at `localhost:4321`                |
| `npm run build`           | Build your production site to `./dist/` (+ Pagefind index) |
| `npm run preview`         | Preview your build locally, before deploying               |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check`           |
| `npm run astro -- --help` | Get help using the Astro CLI                               |
| `npx prettier --write .`  | Format your code                                           |

## サイト内検索 (Pagefind)

- [astro-pagefind](https://github.com/shishkin/astro-pagefind) を利用し、`npm run build` 時に [Pagefind](https://pagefind.app/) が `dist/pagefind/` に検索インデックスを生成する。
- 検索対象は `data-pagefind-body` を付けた記事本文(`PostContainer.astro`)のみ。プログ・ニュース・メモが対象。
- 検索ページの検索欄・件数表示・検索結果は、Pagefind公式の [Component UI](https://pagefind.app/docs/ui/) を利用している(デザインは `--pf-*` 変数と結果テンプレートでサイトに合わせている)。
- 検索ページ(`/search/`)は、キーワード(`?q=`)・カテゴリ(`?category=`)・タグ(`?tag=`)で検索でき、検索条件はURLと同期する。キーワード未入力時はタグ一覧を表示する。
- `npm run dev` では、前回のビルドで生成したインデックス(`dist/pagefind/`)を配信する(astro-pagefind の機能)。
  - 開発中に検索するには、先に一度 `npm run build` を実行しておく。
  - 開発中に追加・変更した記事は、再度 `npm run build` するまで検索結果に反映されない。

## Todoメモ

- Junksの作成
- Productsの作成
