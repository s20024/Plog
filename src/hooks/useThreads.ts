import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Message, ThreadEntry } from '../interfaces/chat';
import { CHAT_API_BASE, CHAT_THREADS_KEY } from '../consts';
import { createId } from '../utils/createId';

/** localStorageからスレッド一覧を読み込む */
const loadThreadsFromStorage = (): ThreadEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_THREADS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (e): e is ThreadEntry => e !== null && typeof e === 'object' && typeof (e as ThreadEntry).id === 'string',
    );
  } catch {
    return [];
  }
};

/** localStorageにスレッド一覧を保存する */
const saveThreadsToStorage = (threads: ThreadEntry[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_THREADS_KEY, JSON.stringify(threads));
  } catch {
    // ignore
  }
};

/**
 * APIのレスポンス履歴をMessage[]形式に変換する。
 * tool_call と tool_result を紐付けて一つの tool メッセージにまとめる。
 */
export const buildHistoryFromAPI = (rawMessages: unknown[]): Message[] => {
  const history: Message[] = [];
  const toolCallIndex = new Map<string, number>();

  for (const m of rawMessages) {
    if (typeof m !== 'object' || m === null || !('role' in m)) continue;
    const msg = m as Record<string, unknown>;

    if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.length > 0) {
      history.push({ id: createId(), role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      if (typeof msg.content === 'string' && msg.content.length > 0) {
        history.push({ id: createId(), role: 'assistant', content: msg.content });
      }
      if (Array.isArray(msg.tool_calls)) {
        for (const tc of msg.tool_calls as Record<string, unknown>[]) {
          history.push({
            id: createId(),
            role: 'tool',
            content: '',
            toolName: typeof tc.name === 'string' ? tc.name : 'unknown',
            toolArguments: tc.arguments,
          });
          if (typeof tc.id === 'string') toolCallIndex.set(tc.id, history.length - 1);
        }
      }
    } else if (msg.role === 'tool_result' && Array.isArray(msg.tool_results)) {
      for (const tr of msg.tool_results as Record<string, unknown>[]) {
        const idx = typeof tr.id === 'string' ? toolCallIndex.get(tr.id) : undefined;
        if (idx !== undefined) {
          history[idx] = { ...history[idx], toolResult: tr.result };
        } else {
          history.push({
            id: createId(),
            role: 'tool',
            content: '',
            toolName: typeof tr.name === 'string' ? tr.name : 'unknown',
            toolArguments: tr.arguments,
            toolResult: tr.result,
          });
        }
      }
    }
  }
  return history;
};

interface UseThreadsReturn {
  threads: ThreadEntry[];
  threadId: string | null;
  setThreadId: Dispatch<SetStateAction<string | null>>;
  historyLoading: boolean;
  updateThreads: (mutator: (prev: ThreadEntry[]) => ThreadEntry[]) => void;
  switchToThread: (tid: string) => Promise<void>;
  deleteThread: (tid: string) => Promise<void>;
  startNewChat: () => void;
}

/**
 * チャットスレッドの状態管理フック。
 * localStorage との同期と、スレッドのCRUD API操作を担う。
 */
export const useThreads = (isLoading: boolean, setMessages: Dispatch<SetStateAction<Message[]>>): UseThreadsReturn => {
  const [threads, setThreads] = useState<ThreadEntry[]>(() => loadThreadsFromStorage());
  const [threadId, setThreadId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const updateThreads = (mutator: (prev: ThreadEntry[]) => ThreadEntry[]): void => {
    setThreads((prev) => {
      const next = mutator(prev);
      saveThreadsToStorage(next);
      return next;
    });
  };

  const switchToThread = async (tid: string): Promise<void> => {
    if (isLoading || historyLoading) return;
    if (tid === threadId) return;
    setHistoryLoading(true);
    setMessages([]);
    setThreadId(null);
    try {
      const res = await fetch(`${CHAT_API_BASE}/${tid}`);
      if (res.status === 404) {
        // サーバから消えていればローカルからも削除する
        updateThreads((prev) => prev.filter((t) => t.id !== tid));
        return;
      }
      if (!res.ok) {
        console.warn('履歴取得失敗:', res.status);
        return;
      }
      const data = (await res.json()) as { thread_id: string; title?: string; messages?: unknown[] };
      setThreadId(data.thread_id);
      setMessages(buildHistoryFromAPI(data.messages ?? []));
      if (typeof data.title === 'string' && data.title) {
        updateThreads((prev) => prev.map((t) => (t.id === tid ? { ...t, title: data.title as string } : t)));
      }
    } catch (e) {
      console.error('履歴の取得に失敗しました', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteThread = async (tid: string): Promise<void> => {
    if (isLoading) return;
    // ローカルから即削除してから非同期でAPIを呼び出す
    updateThreads((prev) => prev.filter((t) => t.id !== tid));
    if (threadId === tid) {
      setMessages([]);
      setThreadId(null);
    }
    try {
      await fetch(`${CHAT_API_BASE}/${tid}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('スレッド削除APIの失敗:', e);
    }
  };

  const startNewChat = (): void => {
    if (isLoading) return;
    setMessages([]);
    setThreadId(null);
  };

  return {
    threads,
    threadId,
    setThreadId,
    historyLoading,
    updateThreads,
    switchToThread,
    deleteThread,
    startNewChat,
  };
};
