import React, { useEffect, useRef, useState } from 'react';
import styles from './SiteSearch.module.scss';
import { createSearchResultElement } from './SearchResultTemplate';
import IconClose from '../icon/IconClose';
import { hasSearchCondition, useSiteSearch } from '../../hooks/useSiteSearch';
import { createTagSearchUrl, readSearchConditionFromUrl } from '../../utils/searchUrl';
import { SEARCH_CATEGORY_LABELS, SEARCH_DEBOUNCE_MS } from '../../consts';

const DEFAULT_PLACEHOLDER = 'キーワードを入力 (例: Laravel, Astro, AIDD)';
const TAG_PLACEHOLDER = 'キーワードで絞り込む';

/**
 * タグを件数の多い順(同数の場合は名前順)に並べる。
 * @param tagCounts タグ名 → 件数
 * @returns 並べ替えたタグ名の一覧
 */
const sortTagsByCount = (tagCounts: Record<string, number>): string[] =>
  Object.entries(tagCounts)
    .sort(([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB, 'ja'))
    .map(([tag]) => tag);

/**
 * サイト内検索コンポーネント(検索ページ用)。
 * 検索欄・件数表示・検索結果は Pagefind Component UI の公式コンポーネントを利用し、
 * カテゴリ・タグでの絞り込みとタグ一覧は、その検索インスタンスを操作して実現する。
 */
const SiteSearch: React.FC = () => {
  // memo: client:only で描画するため、初期化時に window を参照できる。
  const [initialCondition] = useState(readSearchConditionFromUrl);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const { status, condition, categoryCounts, tagCounts, selectCategory, clearTag } = useSiteSearch({
    resultsRef,
    resultTemplate: createSearchResultElement,
    initialCondition,
  });
  const { category, tag } = condition;
  const hasCondition = hasSearchCondition(condition);
  // memo: 読み込み中は件数が未集計のため、0件と誤解されないよう表示しない。
  const showCounts = status === 'ready' && hasCondition;
  const allCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  /** Component UI が描画した検索欄の input 要素を取得する */
  const getInputElement = (): HTMLInputElement | null => searchBoxRef.current?.querySelector('input') ?? null;

  useEffect(() => {
    // memo: 検索条件付きで開いた場合は、スマホでキーボードが結果を隠さないようフォーカスしない。
    if (hasSearchCondition(initialCondition)) return;
    void customElements
      .whenDefined('pagefind-input')
      .then(() => requestAnimationFrame(() => getInputElement()?.focus()));
  }, []);

  useEffect(() => {
    // memo: Component UI は描画後の placeholder 属性の変更を反映しないため、input 要素に直接設定する。
    const input = getInputElement();
    if (input) input.placeholder = tag ? TAG_PLACEHOLDER : DEFAULT_PLACEHOLDER;
  }, [tag]);

  /** 検索欄が空のときにBackspaceを押した場合は、タグの絞り込みを解除する */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && tag && !input.value && !e.nativeEvent.isComposing) clearTag();
  };

  return (
    <div className={styles.siteSearch}>
      {/* memo: 読み込みに失敗した場合、公式コンポーネントが英語の技術的なエラーを表示するため、検索欄ごと非表示にする。 */}
      {status !== 'unavailable' && (
        <>
          <div
            ref={searchBoxRef}
            className={`${styles.searchBox} ${tag ? styles.hasTag : ''}`}
            onKeyDown={handleKeyDown}
          >
            {tag && (
              <button
                type="button"
                className={styles.tagToken}
                onClick={clearTag}
                aria-label={`タグ「${tag}」の絞り込みを解除`}
                title="タグの絞り込みを解除"
              >
                <span className={styles.tagTokenName}>#{tag}</span>
                <IconClose width={9} height={9} />
              </button>
            )}
            <pagefind-input
              className={styles.searchInput}
              placeholder={initialCondition.tag ? TAG_PLACEHOLDER : DEFAULT_PLACEHOLDER}
              debounce={SEARCH_DEBOUNCE_MS}
            />
          </div>

          <div className={styles.categoryFilter} role="group" aria-label="カテゴリで絞り込む">
            <button
              type="button"
              className={`${styles.categoryChip} ${category === null ? styles.active : ''}`}
              onClick={() => selectCategory(null)}
              aria-pressed={category === null}
            >
              すべて{showCounts && <span className={styles.count}>{allCount}</span>}
            </button>
            {Object.entries(SEARCH_CATEGORY_LABELS).map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={`${styles.categoryChip} ${category === key ? styles.active : ''}`}
                onClick={() => selectCategory(key)}
                aria-pressed={category === key}
              >
                {label}
                {showCounts && <span className={styles.count}>{categoryCounts[key] ?? 0}</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {status === 'loading' && <p className={styles.statusMessage}>検索インデックスを読み込み中...</p>}
      {status === 'unavailable' && (
        <p className={styles.statusMessage}>検索機能を読み込めませんでした。時間をおいて再度お試しください。</p>
      )}

      {/* memo: faceted モードでは条件なしでも全件が結果になるため、キーワード・タグの指定がない場合は非表示にする。 */}
      <div className={styles.results} hidden={status !== 'ready' || !hasCondition}>
        <pagefind-summary className={styles.summary} />
        <pagefind-results ref={resultsRef} className={styles.resultList} />
      </div>

      {status === 'ready' && !hasCondition && (
        <section className={styles.tagCloud}>
          <h2 className={styles.tagCloudTitle}>タグから探す</h2>
          <ul className={styles.tagList}>
            {sortTagsByCount(tagCounts).map((tagName) => (
              <li key={tagName}>
                <a className={styles.tagLink} href={createTagSearchUrl(tagName)}>
                  #{tagName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default SiteSearch;
