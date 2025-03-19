# Plog(Plograming-blog)

s20024(やら)のプログラミングログです。

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

## Astro CLI

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npx prettier --write .`  | Format your code                                 |

## Todoメモ

- `[...slug].astro`の部分のデザイン統一化。
- `post`なのか`[news|plog|memo]`なのかはっきりさせる
- `plog`の利用していないデータの削除、データ名の修正
- Tag機能の追加
