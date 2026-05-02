import { useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Message, ThreadEntry } from '../interfaces/chat';
import { CHAT_API_BASE } from '../consts';
import { createId } from '../utils/createId';

interface UseChatStreamParams {
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setThreadId: Dispatch<SetStateAction<string | null>>;
  updateThreads: (mutator: (prev: ThreadEntry[]) => ThreadEntry[]) => void;
  typingBufferRef: MutableRefObject<Map<string, string>>;
  startTypingLoop: () => void;
  flushTypingBuffer: () => void;
}

interface UseChatStreamReturn {
  streamingId: string | null;
  setStreamingId: Dispatch<SetStateAction<string | null>>;
  createThread: () => Promise<string>;
  streamReply: (tid: string, message: string) => Promise<void>;
}

/**
 * SSEストリーミングでチャット応答を受信するフック。
 * text_delta / tool_call / tool_result / title などのイベントを処理する。
 */
export const useChatStream = ({
  setMessages,
  setThreadId,
  updateThreads,
  typingBufferRef,
  startTypingLoop,
  flushTypingBuffer,
}: UseChatStreamParams): UseChatStreamReturn => {
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const createThread = async (): Promise<string> => {
    const res = await fetch(CHAT_API_BASE, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`スレッド作成に失敗しました (${res.status})`);
    }
    const data = (await res.json()) as { thread_id: string };
    return data.thread_id;
  };

  const streamReply = async (tid: string, message: string): Promise<void> => {
    const res = await fetch(`${CHAT_API_BASE}/${tid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`チャット送信に失敗しました (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';
    let currentAssistantId: string | null = null;

    /** アシスタントメッセージが未作成なら作成してIDを返す */
    const ensureAssistant = (): string => {
      if (currentAssistantId) return currentAssistantId;
      const id = createId();
      currentAssistantId = id;
      setMessages((prev) => [...prev, { id, role: 'assistant', content: '' }]);
      setStreamingId(id);
      return id;
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = sseBuffer.indexOf('\n\n')) >= 0) {
        const chunk = sseBuffer.slice(0, idx);
        sseBuffer = sseBuffer.slice(idx + 2);
        const dataLine = chunk.split('\n').find((l) => l.startsWith('data: '));
        if (!dataLine) continue;

        let ev: Record<string, unknown>;
        try {
          ev = JSON.parse(dataLine.slice(6)) as Record<string, unknown>;
        } catch {
          continue;
        }

        switch (ev.type) {
          case 'title': {
            const title = ev.title;
            if (typeof title === 'string' && title.length > 0) {
              updateThreads((prev) => prev.map((t) => (t.id === tid ? { ...t, title } : t)));
            }
            break;
          }
          case 'text_start': {
            // 次の発話の前に前のバッファを flush する
            flushTypingBuffer();
            currentAssistantId = null;
            ensureAssistant();
            break;
          }
          case 'text_delta': {
            const id = ensureAssistant();
            const delta = typeof ev.delta === 'string' ? ev.delta : '';
            if (!delta) break;
            const buf = typingBufferRef.current;
            buf.set(id, (buf.get(id) ?? '') + delta);
            startTypingLoop();
            break;
          }
          case 'text_end': {
            currentAssistantId = null;
            break;
          }
          case 'tool_call': {
            flushTypingBuffer();
            currentAssistantId = null;
            const toolName =
              typeof ev.tool_name === 'string' ? ev.tool_name : typeof ev.name === 'string' ? ev.name : 'unknown';
            setMessages((prev) => [
              ...prev,
              { id: createId(), role: 'tool', content: '', toolName, toolArguments: ev.arguments },
            ]);
            break;
          }
          case 'tool_result': {
            flushTypingBuffer();
            currentAssistantId = null;
            const toolName =
              typeof ev.tool_name === 'string' ? ev.tool_name : typeof ev.name === 'string' ? ev.name : 'unknown';
            const result = ev.result;
            setMessages((prev) => {
              const next = [...prev];
              // 直近の同名 tool で result 未設定のものに紐付ける
              for (let i = next.length - 1; i >= 0; i--) {
                const t = next[i];
                if (t.role === 'tool' && t.toolName === toolName && t.toolResult === undefined) {
                  next[i] = { ...t, toolResult: result };
                  return next;
                }
              }
              // 紐付け先がなければ単独で追加する
              next.push({ id: createId(), role: 'tool', content: '', toolName, toolResult: result });
              return next;
            });
            break;
          }
        }
      }
    }
  };

  // memo: setThreadId はスレッド作成後に Chat.tsx 側で呼ぶので、引数に含めるが実際には未使用
  void setThreadId;

  return { streamingId, setStreamingId, createThread, streamReply };
};
