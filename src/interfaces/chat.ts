/** チャットメッセージのロール */
export type Role = 'user' | 'assistant' | 'tool';

/** チャットメッセージ */
export interface Message {
  id: string;
  role: Role;
  content: string;
  toolName?: string;
  toolArguments?: unknown;
  toolResult?: unknown;
}

/** スレッドエントリ */
export interface ThreadEntry {
  id: string;
  title: string | null;
  createdAt: number;
}
