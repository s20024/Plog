import type { SearchCondition } from '../interfaces/search';
import {
  SEARCH_CATEGORY_LABELS,
  SEARCH_CATEGORY_PARAM,
  SEARCH_PAGE_PATH,
  SEARCH_QUERY_PARAM,
  SEARCH_TAG_PARAM,
} from '../consts';

/**
 * 指定したタグで絞り込んだ検索ページのURLを作成する。
 * @param tag タグ名
 * @returns 検索ページのURL (例: `/search/?tag=Laravel`)
 */
export const createTagSearchUrl = (tag: string): string =>
  `${SEARCH_PAGE_PATH}?${new URLSearchParams({ [SEARCH_TAG_PARAM]: tag }).toString()}`;

/**
 * URLのクエリパラメータから検索条件を読み込む。
 * @returns キーワード・カテゴリ(未知のカテゴリは null)・タグ
 */
export const readSearchConditionFromUrl = (): SearchCondition => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get(SEARCH_CATEGORY_PARAM);
  return {
    query: params.get(SEARCH_QUERY_PARAM) ?? '',
    category: category && Object.hasOwn(SEARCH_CATEGORY_LABELS, category) ? category : null,
    tag: params.get(SEARCH_TAG_PARAM) || null,
  };
};

/**
 * 検索条件をURLのクエリパラメータに反映する(検索結果をURLで共有できるように)。
 * @param condition 検索条件
 */
export const syncSearchConditionToUrl = ({ query, category, tag }: SearchCondition): void => {
  const url = new URL(window.location.href);
  const params: [string, string | null][] = [
    [SEARCH_QUERY_PARAM, query.trim() || null],
    [SEARCH_CATEGORY_PARAM, category],
    [SEARCH_TAG_PARAM, tag],
  ];
  params.forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  });
  window.history.replaceState(null, '', url);
};
