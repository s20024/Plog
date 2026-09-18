import styles from './SearchResultTemplate.module.scss';
import type { PagefindResultData } from '@pagefind/component-ui';
import { SEARCH_CATEGORY_FILTER_KEY, SEARCH_CATEGORY_LABELS } from '../../consts';

/**
 * クラスとテキストを指定して要素を作成する。
 * @param tagName タグ名
 * @param className クラス名
 * @param text テキスト(省略時は空)
 * @returns 作成した要素
 */
const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);
  element.className = className;
  if (text) element.textContent = text;
  return element;
};

/**
 * 検索結果1件の要素を作成する(Pagefind Component UI の `<pagefind-results>` の結果テンプレート)。
 * 抜粋(excerpt)はPagefindがヒット箇所を<mark>で囲んだHTMLを返すため、そのまま描画する。
 * @param result 検索結果の詳細データ
 * @returns 検索結果1件のli要素
 */
export const createSearchResultElement = (result: PagefindResultData): HTMLLIElement => {
  const item = createElement('li', styles.item);
  const link = createElement('a', styles.link);
  link.href = result.url;

  if (result.meta.image) {
    const thumbnail = createElement('img', styles.thumbnail);
    thumbnail.src = result.meta.image;
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    link.appendChild(thumbnail);
  }

  const body = createElement('div', styles.body);
  const meta = createElement('div', styles.meta);
  const category = result.filters?.[SEARCH_CATEGORY_FILTER_KEY]?.[0];
  const categoryLabel = category ? SEARCH_CATEGORY_LABELS[category] : undefined;
  if (category && categoryLabel) {
    meta.appendChild(createElement('span', `${styles.category} ${styles[category] ?? ''}`, categoryLabel));
  }
  if (result.meta.date) meta.appendChild(createElement('span', styles.date, result.meta.date));
  body.appendChild(meta);
  body.appendChild(createElement('h2', styles.title, result.meta.title ?? result.url));

  const excerpt = createElement('p', styles.excerpt);
  // memo: excerptはビルド時に自サイトのコンテンツから生成されたもの(HTMLエスケープ済み)のみ。
  excerpt.innerHTML = result.excerpt;
  body.appendChild(excerpt);

  link.appendChild(body);
  item.appendChild(link);
  return item;
};
