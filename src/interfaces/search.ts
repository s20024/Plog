import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { FilterCounts, PagefindSearchResult } from '@pagefind/component-ui';

/** 検索インデックスの読み込み状態 */
export type SearchIndexStatus = 'loading' | 'ready' | 'unavailable';

/** 検索条件 */
export interface SearchCondition {
  query: string;
  category: string | null;
  tag: string | null;
}

/** Pagefind本体の検索オプション */
export interface PagefindSearchOptions {
  filters?: Record<string, string[]>;
  sort?: Record<string, 'asc' | 'desc'>;
}

/**
 * Pagefind本体(Component UI が内部で保持しているもの)のAPI。利用する分のみ定義。
 * memo: Component UI は並び順を指定できないため、キーワードなしの検索を新しい順に並べる際に利用する。
 */
export interface PagefindCore {
  search: (term: string | null, options?: PagefindSearchOptions) => Promise<PagefindSearchResult>;
  filters: () => Promise<FilterCounts>;
}

/** Pagefind Component UI のカスタム要素に共通の属性 */
export interface PagefindElementAttributes extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  instance?: string;
}

/** `<pagefind-input>` の属性 */
export interface PagefindInputAttributes extends PagefindElementAttributes {
  placeholder?: string;
  debounce?: number;
}

// memo: React(TSX)で Pagefind Component UI のカスタム要素を利用できるようにする。
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'pagefind-input': PagefindInputAttributes;
      'pagefind-summary': PagefindElementAttributes;
      'pagefind-results': PagefindElementAttributes;
    }
  }
}
