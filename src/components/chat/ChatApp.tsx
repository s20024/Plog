import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './ChatApp.module.scss';
import ChatThreadNav from './ChatThreadNav';
import ChatWelcome from './ChatWelcome';
import ChatMessageList from './ChatMessageList';
import ChatInputBox from './ChatInputBox';
import { useTypingAnimation } from '../../hooks/useTypingAnimation';
import { useThreads } from '../../hooks/useThreads';
import { useChatStream } from '../../hooks/useChatStream';
import { createId } from '../../utils/createId';
import type { Message } from '../../interfaces/chat';

// 送信時にユーザーメッセージが画面上端に張り付かないよう確保する余白 (px)
const SCROLL_TOP_OFFSET = 20;

/** 時間帯に応じた挨拶文を返す */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'おはようございます';
  if (hour >= 11 && hour < 18) return 'こんにちは';
  return 'こんばんは';
};

/**
 * AIチャットのメインコンポーネント。
 * スレッド管理・SSEストリーミング・タイピングアニメーションを各フックに委譲し、
 * UIの組み立てと送信ロジックを担う。
 */
const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [greeting] = useState(getGreeting);
  const [aiGroupMinHeight, setAiGroupMinHeight] = useState<number | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  const { typingBufferRef, startTypingLoop, waitForBufferDrain, flushTypingBuffer } = useTypingAnimation(setMessages);

  const { threads, threadId, setThreadId, historyLoading, updateThreads, switchToThread, deleteThread, startNewChat } =
    useThreads(isLoading, setMessages);

  const { streamingId, setStreamingId, createThread, streamReply } = useChatStream({
    setMessages,
    setThreadId,
    updateThreads,
    typingBufferRef,
    startTypingLoop,
    flushTypingBuffer,
  });

  // 最新ユーザーメッセージのインデックスとID (応答グループの開始点)
  const lastUserIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return i;
    }
    return -1;
  }, [messages]);
  const lastUserId = lastUserIndex >= 0 ? messages[lastUserIndex].id : null;

  // 最新ユーザーメッセージのDOMサイズから応答グループの min-height を計算する
  useLayoutEffect(() => {
    if (!lastUserId) {
      setAiGroupMinHeight(undefined);
      return;
    }
    const compute = (attempt = 0) => {
      const list = listRef.current;
      const userEl = list?.querySelector<HTMLElement>(`[data-msg-id="${lastUserId}"]`);
      if (!list || !userEl) {
        if (attempt < 5) setTimeout(() => compute(attempt + 1), 30);
        return;
      }
      // messageList の表示高さ - ユーザーメッセージの高さ - gap (1rem)
      const minH = Math.max(0, list.clientHeight - userEl.offsetHeight - 16);
      setAiGroupMinHeight(minH);
    };
    compute();

    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [lastUserId]);

  /** 送信後にユーザーメッセージが画面上端付近にくるよう一度だけスクロールする */
  const scrollMessageToTop = (msgId: string): void => {
    const tryScroll = (attempt: number) => {
      const list = listRef.current;
      const el = list?.querySelector<HTMLElement>(`[data-msg-id="${msgId}"]`);
      if (!list || !el) {
        if (attempt < 5) setTimeout(() => tryScroll(attempt + 1), 30);
        return;
      }
      const containerTop = list.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      list.scrollTo({
        top: Math.max(0, list.scrollTop + (elTop - containerTop) - SCROLL_TOP_OFFSET),
        behavior: 'smooth',
      });
    };
    requestAnimationFrame(() => tryScroll(0));
  };

  /** メッセージを送信する */
  const handleSend = async (): Promise<void> => {
    const text = input.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setInput('');

    const userMsgId = createId();
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: text }]);
    scrollMessageToTop(userMsgId);

    try {
      let tid = threadId;
      if (!tid) {
        tid = await createThread();
        setThreadId(tid);
        updateThreads((prev) => [{ id: tid!, title: null, createdAt: Date.now() }, ...prev]);
      }

      await streamReply(tid, text);
      // ストリーム終了後もタイピング表示が残っている可能性があるので待つ
      await waitForBufferDrain();
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          content: '申し訳ありません、エラーが発生しました。もう一度お試しください。',
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingId(null);
    }
  };

  const isInitial = messages.length === 0 && !isLoading && !historyLoading;

  return (
    <>
      <ChatThreadNav
        threads={threads}
        currentThreadId={threadId}
        busy={isLoading || historyLoading}
        onSelect={switchToThread}
        onDelete={deleteThread}
        onNewChat={startNewChat}
      />
      <div className={`${styles.chat} ${isInitial ? styles.initial : ''}`}>
        {isInitial && <ChatWelcome greeting={greeting} />}
        {!isInitial && (
          <ChatMessageList
            listRef={listRef}
            messages={messages}
            historyLoading={historyLoading}
            isLoading={isLoading}
            streamingId={streamingId}
            lastUserIndex={lastUserIndex}
            lastUserId={lastUserId}
            aiGroupMinHeight={aiGroupMinHeight}
          />
        )}
        <ChatInputBox value={input} onChange={setInput} onSend={handleSend} disabled={isLoading} />
      </div>
    </>
  );
};

export default ChatApp;
