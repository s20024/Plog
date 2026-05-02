/**
 * ランダムなIDを生成する。
 * `crypto.randomUUID` が利用可能な場合はそちらを使い、そうでなければ Math.random で代替する。
 */
export const createId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
