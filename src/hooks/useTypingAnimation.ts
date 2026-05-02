import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Message } from '../interfaces/chat';

// タイピングアニメーションの速度設定
const TICK_MS = 20;
const BASE_CHARS = 2;

interface UseTypingAnimationReturn {
  typingBufferRef: React.MutableRefObject<Map<string, string>>;
  startTypingLoop: () => void;
  waitForBufferDrain: () => Promise<void>;
  flushTypingBuffer: () => void;
}

/**
 * タイピングアニメーションを管理するフック。
 * バッファに文字を積み、一定速度でメッセージに反映することで自然なタイプ感を演出する。
 */
export const useTypingAnimation = (setMessages: Dispatch<SetStateAction<Message[]>>): UseTypingAnimationReturn => {
  const typingBufferRef = useRef<Map<string, string>>(new Map());
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drainResolversRef = useRef<Array<() => void>>([]);

  const startTypingLoop = (): void => {
    if (typingIntervalRef.current !== null) return;
    typingIntervalRef.current = setInterval(() => {
      const buffer = typingBufferRef.current;
      if (buffer.size === 0) {
        if (typingIntervalRef.current !== null) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        const resolvers = drainResolversRef.current;
        drainResolversRef.current = [];
        resolvers.forEach((r) => r());
        return;
      }

      setMessages((prev) =>
        prev.map((m) => {
          const pending = buffer.get(m.id);
          if (!pending) return m;
          // バッファが溜まってきたら少し早送り (目安1.5秒で吐き出す)
          const charsPerTick = Math.max(BASE_CHARS, Math.ceil(pending.length / 75));
          const taken = pending.slice(0, charsPerTick);
          const remaining = pending.slice(charsPerTick);
          if (remaining) {
            buffer.set(m.id, remaining);
          } else {
            buffer.delete(m.id);
          }
          return { ...m, content: m.content + taken };
        }),
      );
    }, TICK_MS);
  };

  const waitForBufferDrain = (): Promise<void> =>
    new Promise<void>((resolve) => {
      if (typingBufferRef.current.size === 0) {
        resolve();
        return;
      }
      drainResolversRef.current.push(resolve);
    });

  const flushTypingBuffer = (): void => {
    const buffer = typingBufferRef.current;
    if (buffer.size === 0) return;
    const snapshot = new Map(buffer);
    buffer.clear();
    setMessages((prev) =>
      prev.map((m) => {
        const remaining = snapshot.get(m.id);
        if (!remaining) return m;
        return { ...m, content: m.content + remaining };
      }),
    );
  };

  // アンマウント時にタイピングループを停止する
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current !== null) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

  return { typingBufferRef, startTypingLoop, waitForBufferDrain, flushTypingBuffer };
};
