// Configuration
export const SITE_TITLE = "s20024's Plog";
export const SITE_DESCRIPTION = 'プログラミングの学習記録を残すブログです。';

export const PLOGGER = 's20024';
export const PLOGGER_NAME = 'やら';

export const COLORS = ['#D1F1CC', '#F3D1E5', '#D5E0F1', '#C8EFEA', '#EDD0E5'];

export const ANALITICS_ID = 'G-MYMZT7S10K';

// Chat
export const CHAT_API_BASE =
  (import.meta.env.PUBLIC_PROFILE_CHAT_API_URL as string | undefined) || 'https://backend.s20024.com/api/profile-chat';
export const CHAT_THREADS_KEY = 'plog.chat.threads';
export const CHAT_PERSONA = 'zundamon';

export const GITHUB_URL = 'https://github.com/s20024';
export const INSTAGRAM_URL = 'https://www.instagram.com';
export const TWITTER_URL = 'https://x.com/s20024itcollege';
export const PORTFOLIO_URL = 'https://portfolio.s20024.com';

// Search
export const SEARCH_PAGE_PATH = '/search/';
export const SEARCH_QUERY_PARAM = 'q';
export const SEARCH_CATEGORY_PARAM = 'category';
export const SEARCH_TAG_PARAM = 'tag';
export const SEARCH_CATEGORY_FILTER_KEY = 'category';
export const SEARCH_TAG_FILTER_KEY = 'tag';
export const SEARCH_DATE_SORT_KEY = 'date';
export const SEARCH_CATEGORY_LABELS: Record<string, string> = {
  plog: 'プログ',
  news: 'ニュース',
  memo: 'メモ',
};
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_EXCERPT_LENGTH = 40;
// memo: Pagefind Component UI の表示文言を上書きする([COUNT]・[SEARCH_TERM]は置き換えられる)。
export const SEARCH_TRANSLATIONS: Record<string, string> = {
  searching: '検索中...',
  zero_results: '「[SEARCH_TERM]」に一致するページは見つかりませんでした。',
  one_result: '[COUNT]件のページが見つかりました',
  many_results: '[COUNT]件のページが見つかりました',
  total_zero_results: '該当するページは見つかりませんでした。',
  total_one_result: '[COUNT]件のページが見つかりました',
  total_many_results: '[COUNT]件のページが見つかりました',
  error_search: '検索機能を読み込めませんでした。時間をおいて再度お試しください。',
};
