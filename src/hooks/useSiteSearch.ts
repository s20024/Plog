import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { getInstanceManager } from '@pagefind/component-ui';
import type {
  FilterCounts,
  FilterSelection,
  Instance,
  PagefindResultData,
  PagefindResults,
} from '@pagefind/component-ui';
import type { PagefindCore, SearchCondition, SearchIndexStatus } from '../interfaces/search';
import { syncSearchConditionToUrl } from '../utils/searchUrl';
import {
  SEARCH_CATEGORY_FILTER_KEY,
  SEARCH_DATE_SORT_KEY,
  SEARCH_TAG_FILTER_KEY,
  SEARCH_TRANSLATIONS,
} from '../consts';

/**
 * 検索条件にキーワードかタグが含まれているか(どちらもない場合は検索結果を表示しない)。
 * @param condition 検索条件
 * @returns キーワードかタグが指定されている場合は true
 */
export const hasSearchCondition = ({ query, tag }: SearchCondition): boolean => query.trim().length > 0 || tag !== null;

/**
 * 検索条件を Component UI のフィルタ指定に変換する。
 * @param condition 検索条件
 * @returns フィルタ名 → 値の一覧
 */
const toFilterSelection = ({ category, tag }: SearchCondition): FilterSelection => ({
  ...(category ? { [SEARCH_CATEGORY_FILTER_KEY]: [category] } : {}),
  ...(tag ? { [SEARCH_TAG_FILTER_KEY]: [tag] } : {}),
});

/**
 * Component UI の検索内容を検索条件に変換する。
 * @param term 検索キーワード
 * @param filters フィルタ指定
 * @returns 検索条件
 */
const toSearchCondition = (term: string, filters: FilterSelection): SearchCondition => ({
  query: term,
  category: filters[SEARCH_CATEGORY_FILTER_KEY]?.[0] ?? null,
  tag: filters[SEARCH_TAG_FILTER_KEY]?.[0] ?? null,
});

/**
 * キーワードなし(タグのみ)の検索結果を新しい順に並べるよう、Pagefind本体の検索処理を差し替える。
 * hack: Component UI は検索時に並び順を指定できないため、内部で保持しているPagefind本体(非公開の __pagefind__)を差し替えている。
 * @param instance Component UI の検索インスタンス
 * @returns 差し替えたPagefind本体(読み込み前などで取得できない場合は null)
 */
const patchDateSort = (instance: Instance): PagefindCore | null => {
  const pagefind = (instance as unknown as { __pagefind__?: PagefindCore }).__pagefind__;
  if (!pagefind) return null;
  const originalSearch = pagefind.search.bind(pagefind);
  pagefind.search = (term, options = {}) =>
    originalSearch(term, term ? options : { ...options, sort: { [SEARCH_DATE_SORT_KEY]: 'desc' } });
  return pagefind;
};

interface UseSiteSearchParams {
  /** 検索結果を表示する `<pagefind-results>` 要素 */
  resultsRef: RefObject<HTMLElement | null>;
  /** 検索結果1件の要素を作成する関数 */
  resultTemplate: (result: PagefindResultData) => HTMLElement;
  /** URLから読み込んだ検索条件の初期値 */
  initialCondition: SearchCondition;
}

interface UseSiteSearchReturn {
  status: SearchIndexStatus;
  condition: SearchCondition;
  categoryCounts: Record<string, number>;
  tagCounts: Record<string, number>;
  selectCategory: (category: string | null) => void;
  clearTag: () => void;
}

/**
 * Pagefind Component UI(`<pagefind-input>` / `<pagefind-results>` 等)の検索インスタンスと連携するフック。
 * 公式コンポーネントにない、カテゴリ・タグでの絞り込み、カテゴリ別の件数、URLとの同期を担う。
 * @param params 検索結果の要素・結果テンプレート・検索条件の初期値
 */
export const useSiteSearch = ({
  resultsRef,
  resultTemplate,
  initialCondition,
}: UseSiteSearchParams): UseSiteSearchReturn => {
  const instanceRef = useRef<Instance | null>(null);
  // memo: 読み込み時に faceted モードが自動で行う空の検索を、URLの同期などの対象にしないためのフラグ。
  const isReadyRef = useRef(false);
  // memo: 読み込み中は検索できないため、その間に変更された絞り込み(URLの初期値を含む)を保持し、読み込み完了時に適用する。
  const pendingFiltersRef = useRef<FilterSelection>(toFilterSelection(initialCondition));
  const [status, setStatus] = useState<SearchIndexStatus>('loading');
  const [condition, setCondition] = useState<SearchCondition>(initialCondition);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // memo: Component UI にはイベントの登録解除がないため、アンマウント後は各処理を無視する。
    let isActive = true;
    // memo: 最初の filters イベント(= Pagefind本体の読み込み完了)を受け取ったか。
    let isLoaded = false;
    // memo: 読み込み中に入力されたキーワード(入力がなければ null)。
    let pendingTerm: string | null = null;
    let pagefind: PagefindCore | null = null;
    let countRequestId = 0;

    /** カテゴリで絞る前の条件で検索し、カテゴリ別の件数を更新する */
    const updateCategoryCounts = async (target: SearchCondition): Promise<void> => {
      const requestId = ++countRequestId;
      if (!hasSearchCondition(target)) {
        setCategoryCounts({});
        return;
      }
      // memo: Pagefind本体を取得できない場合は、filters イベントで公式が集計した件数を代わりに表示する。
      if (!pagefind) return;
      try {
        const filters: FilterSelection = target.tag ? { [SEARCH_TAG_FILTER_KEY]: [target.tag] } : {};
        const response = await pagefind.search(target.query.trim() || null, { filters });
        if (isActive && requestId === countRequestId) {
          setCategoryCounts(response.filters?.[SEARCH_CATEGORY_FILTER_KEY] ?? {});
        }
      } catch (e) {
        console.error('カテゴリ別の件数の取得に失敗しました', e);
      }
    };

    const setup = async (): Promise<void> => {
      await Promise.all([customElements.whenDefined('pagefind-input'), customElements.whenDefined('pagefind-results')]);
      if (!isActive) return;
      const resultsElement = resultsRef.current as PagefindResults | null;
      if (resultsElement) resultsElement.resultTemplate = resultTemplate;

      const instance = getInstanceManager().getInstance();
      instanceRef.current = instance;
      instance.setTranslations(SEARCH_TRANSLATIONS);
      instance.on('filters', (data) => {
        // memo: Pagefind本体の読み込み完了時(最初の検索より前)に1度だけ差し替える。
        pagefind ??= patchDateSort(instance);
        if (!isActive) return;
        const { available } = data as { available: FilterCounts };
        // memo: 最初の filters イベントは読み込み直後の全ページの集計のため、タグ一覧の件数として使う(以降は検索結果の集計)。
        if (!isLoaded) {
          setTagCounts(available?.[SEARCH_TAG_FILTER_KEY] ?? {});
          isLoaded = true;
        }
        if (isReadyRef.current && !pagefind) setCategoryCounts(available?.[SEARCH_CATEGORY_FILTER_KEY] ?? {});
      });
      instance.on('search', (term, filters) => {
        if (!isActive) return;
        if (!isReadyRef.current) {
          // memo: 読み込み中の入力は保持する(読み込み完了直後に faceted モードが自動で行う空の検索は除く)。
          if (!isLoaded) pendingTerm = term as string;
          return;
        }
        const next = toSearchCondition(term as string, filters as FilterSelection);
        setCondition(next);
        syncSearchConditionToUrl(next);
        void updateCategoryCounts(next);
      });
      instance.on('error', () => {
        if (isActive) setStatus('unavailable');
      });

      await instance.triggerLoad();
      // memo: 読み込みに失敗した場合は、error イベントで unavailable になっている(フィルタも取得できていない)。
      if (!isActive || !instance.availableFilters) return;
      pagefind ??= patchDateSort(instance);
      if (!pagefind) {
        // comment: Component UI の内部構造が変わった可能性がある。検索は動くが、タグのみの検索結果は新しい順にならない。
        console.warn('Pagefind本体を取得できなかったため、タグのみの検索結果を新しい順に並べられません。');
      }
      if (!isLoaded) setTagCounts(instance.availableFilters?.[SEARCH_TAG_FILTER_KEY] ?? {});
      isReadyRef.current = true;
      setStatus('ready');

      // memo: 読み込み中に入力されたキーワード(なければURLの初期値)と、保持していた絞り込みで検索する。
      const term = pendingTerm ?? initialCondition.query;
      const filters = pendingFiltersRef.current;
      const pending = toSearchCondition(term, filters);
      if (hasSearchCondition(pending) || pending.category) {
        instance.triggerSearchWithFilters(term, filters);
      } else {
        // memo: 検索しない場合も、読み込み中に外した絞り込みをURLに反映する。
        syncSearchConditionToUrl(pending);
      }
    };
    void setup();
    return () => {
      isActive = false;
    };
    // memo: 初期化はマウント時の1度のみ行う(以降の検索条件の変更は Component UI のイベントで受け取る)。
  }, []);

  /**
   * 指定したフィルタを変更して再検索する(値が null の場合は絞り込みを解除する)。
   * @param key フィルタ名
   * @param value 絞り込む値
   */
  const updateFilter = (key: string, value: string | null): void => {
    const instance = isReadyRef.current ? instanceRef.current : null;
    const filters: FilterSelection = { ...(instance ? instance.searchFilters : pendingFiltersRef.current) };
    if (value) filters[key] = [value];
    else delete filters[key];
    if (instance) {
      instance.triggerFilters(filters);
      return;
    }
    // memo: 読み込み中は保持して画面にだけ反映し、読み込み完了時に検索に適用する。
    pendingFiltersRef.current = filters;
    setCondition((prev) => toSearchCondition(prev.query, filters));
  };

  return {
    status,
    condition,
    categoryCounts,
    tagCounts,
    selectCategory: (category) => updateFilter(SEARCH_CATEGORY_FILTER_KEY, category),
    clearTag: () => updateFilter(SEARCH_TAG_FILTER_KEY, null),
  };
};
