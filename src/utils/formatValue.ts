/**
 * unknown型の値を表示用文字列にフォーマットする。
 * 文字列はそのまま返し、オブジェクト等はJSONにシリアライズする。
 */
export const formatValue = (v: unknown): string => {
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};
