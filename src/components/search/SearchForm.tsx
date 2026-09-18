import React from 'react';
import styles from './SearchForm.module.scss';
import { SEARCH_CATEGORY_PARAM, SEARCH_PAGE_PATH, SEARCH_QUERY_PARAM } from '../../consts';

interface SearchFormProps {
  /** 絞り込むカテゴリ(例: `plog`)。指定した場合は検索ページをそのカテゴリで開く */
  category?: string;
  placeholder?: string;
}

/**
 * サイト内検索フォーム(Footer・一覧ページのサイドバー等で利用)。
 * 送信すると検索ページ(`/search/?q=キーワード`)に遷移し、検索結果を表示する。
 */
const SearchForm: React.FC<SearchFormProps> = ({ category, placeholder = 'サイト内を検索' }) => {
  return (
    <form className={styles.searchForm} role="search" action={SEARCH_PAGE_PATH} method="get">
      <input
        className={styles.searchInput}
        type="search"
        name={SEARCH_QUERY_PARAM}
        placeholder={placeholder}
        aria-label={placeholder}
        required
      />
      {category && <input type="hidden" name={SEARCH_CATEGORY_PARAM} value={category} />}
      <button type="submit" className={styles.searchButton}>
        検索
      </button>
    </form>
  );
};

export default SearchForm;
