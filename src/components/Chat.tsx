import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './Chat.module.scss';
import AiMessage from './AiMessage';
import ChatThreadNav, { type ThreadEntry } from './ChatThreadNav';

const ToolBadge: React.FC<{
  name: string;
  args?: unknown;
  result?: unknown;
}> = ({ name, args, result }) => {
  const [open, setOpen] = useState(false);
  const hasResult = result !== undefined;
  const formatValue = (v: unknown): string => {
    if (typeof v === 'string') return v;
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };
  return (
    <div className={styles.tool}>
      <button
        type="button"
        className={styles.toolName}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{name}</span>
        {!hasResult && <span className={styles.toolPendingDot}>…</span>}
        <span className={styles.toolChevron}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className={styles.toolDetail}>
          {args !== undefined && (
            <div className={styles.toolSection}>
              <div className={styles.toolLabel}>引数</div>
              <pre className={styles.toolJson}>{formatValue(args)}</pre>
            </div>
          )}
          <div className={styles.toolSection}>
            <div className={styles.toolLabel}>結果</div>
            {hasResult ? (
              <pre className={styles.toolJson}>{formatValue(result)}</pre>
            ) : (
              <div className={styles.toolPending}>結果待ち...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const API_BASE =
  (import.meta.env.PUBLIC_PROFILE_CHAT_API_URL as string | undefined) ||
  'https://backend.s20024.com/api/profile-chat';

// 旧スキーマ (単一スレッドID) のキー。今は使わないので起動時に消す
const LEGACY_THREAD_KEY = 'plog.chat.threadId';
// スレッド一覧を保存するキー
const THREADS_KEY = 'plog.chat.threads';

type Role = 'user' | 'assistant' | 'tool';

interface Message {
  id: string;
  role: Role;
  content: string;
  // role === 'tool' のとき使う
  toolName?: string;
  toolArguments?: unknown;
  toolResult?: unknown;
}

const loadThreadsFromStorage = (): ThreadEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (e: any): e is ThreadEntry =>
        e && typeof e === 'object' && typeof e.id === 'string',
    );
  } catch {
    return [];
  }
};

const saveThreadsToStorage = (threads: ThreadEntry[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  } catch {
    // ignore
  }
};

// API 履歴 → 内部 Message[] への変換
const buildHistoryFromAPI = (rawMessages: any[]): Message[] => {
  const history: Message[] = [];
  const toolCallIndex = new Map<string, number>();
  for (const m of rawMessages || []) {
    if (m.role === 'user' && typeof m.content === 'string' && m.content.length > 0) {
      history.push({ id: createId(), role: 'user', content: m.content });
    } else if (m.role === 'assistant') {
      if (typeof m.content === 'string' && m.content.length > 0) {
        history.push({ id: createId(), role: 'assistant', content: m.content });
      }
      if (Array.isArray(m.tool_calls)) {
        for (const tc of m.tool_calls) {
          history.push({
            id: createId(),
            role: 'tool',
            content: '',
            toolName: tc.name || 'unknown',
            toolArguments: tc.arguments,
          });
          if (tc.id) toolCallIndex.set(tc.id, history.length - 1);
        }
      }
    } else if (m.role === 'tool_result' && Array.isArray(m.tool_results)) {
      for (const tr of m.tool_results) {
        const idx = tr.id ? toolCallIndex.get(tr.id) : undefined;
        if (idx !== undefined) {
          history[idx] = { ...history[idx], toolResult: tr.result };
        } else {
          history.push({
            id: createId(),
            role: 'tool',
            content: '',
            toolName: tr.name || 'unknown',
            toolArguments: tr.arguments,
            toolResult: tr.result,
          });
        }
      }
    }
  }
  return history;
};

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'おはようございます';
  if (hour >= 11 && hour < 18) return 'こんにちは';
  return 'こんばんは';
};

const Chat: React.FC = () => {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [threads, setThreads] = useState<ThreadEntry[]>(() =>
    loadThreadsFromStorage(),
  );
  const [greeting] = useState(getGreeting);
  // 最新ユーザーメッセージ以降をくくる「応答グループ」の min-height
  const [aiGroupMinHeight, setAiGroupMinHeight] = useState<number | undefined>(
    undefined,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 最新の user メッセージのインデックスと id (応答グループの開始点)
  const lastUserIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return i;
    }
    return -1;
  }, [messages]);
  const lastUserId = lastUserIndex >= 0 ? messages[lastUserIndex].id : null;

  // 最新ユーザーメッセージの DOM サイズから応答グループの min-height を計算
  useLayoutEffect(() => {
    if (!lastUserId) {
      setAiGroupMinHeight(undefined);
      return;
    }
    const compute = (attempt = 0) => {
      const list = listRef.current;
      const userEl = list?.querySelector<HTMLElement>(
        `[data-msg-id="${lastUserId}"]`,
      );
      if (!list || !userEl) {
        if (attempt < 5) setTimeout(() => compute(attempt + 1), 30);
        return;
      }
      // messageList の表示高さ - ユーザーメッセージ - gap (1rem)
      const minH = Math.max(0, list.clientHeight - userEl.offsetHeight - 16);
      setAiGroupMinHeight(minH);
    };
    compute();

    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [lastUserId]);

  // 受信した text_delta を一時的に貯めるバッファ (message id -> 残り文字列)
  const typingBufferRef = useRef<Map<string, string>>(new Map());
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drainResolversRef = useRef<Array<() => void>>([]);

  // 一定速度でバッファから文字を取り出して表示する
  const startTypingLoop = () => {
    if (typingIntervalRef.current !== null) return;
    const TICK_MS = 20;
    const BASE_CHARS = 2;
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
          // バッファが溜まってきたら少し早送り(目安1.5秒で吐き出す)
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

  // バッファが空になるまで待つ
  const waitForBufferDrain = () =>
    new Promise<void>((resolve) => {
      if (typingBufferRef.current.size === 0) {
        resolve();
        return;
      }
      drainResolversRef.current.push(resolve);
    });

  // バッファに残っている文字を一気に吐き出す (text_start / tool_* 時に使う)
  const flushTypingBuffer = () => {
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

  // アンマウント時にループを停止
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current !== null) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

  // 起動時は常に新しいチャットで始める。旧スキーマのキーだけ掃除する
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_THREAD_KEY);
    } catch {
      // ignore
    }
  }, []);

  // threads を更新しつつ localStorage にも反映する
  const updateThreads = (mutator: (prev: ThreadEntry[]) => ThreadEntry[]) => {
    setThreads((prev) => {
      const next = mutator(prev);
      saveThreadsToStorage(next);
      return next;
    });
  };

  // 既存スレッドへの切替
  const switchToThread = async (tid: string) => {
    if (isLoading || historyLoading) return;
    if (tid === threadId) return;
    setHistoryLoading(true);
    setMessages([]);
    setThreadId(null);
    try {
      const res = await fetch(`${API_BASE}/${tid}`);
      if (res.status === 404) {
        // サーバから消えていればローカルからも消す
        updateThreads((prev) => prev.filter((t) => t.id !== tid));
        return;
      }
      if (!res.ok) {
        console.warn('履歴取得失敗:', res.status);
        return;
      }
      const data = await res.json();
      setThreadId(data.thread_id);
      setMessages(buildHistoryFromAPI(data.messages || []));
      // タイトルがあれば一覧側も更新
      if (typeof data.title === 'string' && data.title) {
        updateThreads((prev) =>
          prev.map((t) => (t.id === tid ? { ...t, title: data.title } : t)),
        );
      }
    } catch (e) {
      console.error('履歴の取得に失敗しました', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // スレッド削除 (ローカル即削除 → 非同期で API 呼ぶ)
  const deleteThread = async (tid: string) => {
    if (isLoading) return;
    updateThreads((prev) => prev.filter((t) => t.id !== tid));
    if (threadId === tid) {
      setMessages([]);
      setThreadId(null);
    }
    try {
      await fetch(`${API_BASE}/${tid}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('スレッド削除APIの失敗:', e);
    }
  };

  // 新しいチャット (現在のチャットだけクリア。サーバ側スレッドは送信時に作成)
  const startNewChat = () => {
    if (isLoading) return;
    setMessages([]);
    setThreadId(null);
  };

  // 送信時に「自分のメッセージ」が画面上端付近にくるよう一度だけスクロールする
  // ヘッダーぴったりに張り付かないよう、上に少し余白(20px)を残す
  const SCROLL_TOP_OFFSET = 20;
  const scrollMessageToTop = (msgId: string) => {
    const tryScroll = (attempt: number) => {
      const list = listRef.current;
      const el = list?.querySelector<HTMLElement>(`[data-msg-id="${msgId}"]`);
      if (!list || !el) {
        // 初回 (initial → 非initial) は messageList がまだ無い場合がある。少し待って再試行
        if (attempt < 5) {
          setTimeout(() => tryScroll(attempt + 1), 30);
        }
        return;
      }
      const containerTop = list.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      list.scrollTo({
        top: Math.max(
          0,
          list.scrollTop + (elTop - containerTop) - SCROLL_TOP_OFFSET,
        ),
        behavior: 'smooth',
      });
    };
    requestAnimationFrame(() => tryScroll(0));
  };

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    // 5行分(line-height 1.6em × 5 + padding 1.2rem)を上限に
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight);
    const maxH = lineHeight * 5 + 0.6 * 16 * 2;
    ta.style.height = `${Math.min(ta.scrollHeight, maxH)}px`;
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  // SSE ストリームを読みながらメッセージを更新
  const streamReply = async (tid: string, message: string) => {
    const res = await fetch(`${API_BASE}/${tid}`, {
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
    let buffer = '';
    let currentAssistantId: string | null = null;

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
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const dataLine = chunk.split('\n').find((l) => l.startsWith('data: '));
        if (!dataLine) continue;

        let ev: any;
        try {
          ev = JSON.parse(dataLine.slice(6));
        } catch {
          continue;
        }

        switch (ev.type) {
          case 'title': {
            const title = ev.title;
            if (typeof title === 'string' && title.length > 0) {
              updateThreads((prev) =>
                prev.map((t) => (t.id === tid ? { ...t, title } : t)),
              );
            }
            break;
          }
          case 'text_start': {
            // API 仕様の推奨: 新しい発話前に前のバッファを flush しておく
            flushTypingBuffer();
            currentAssistantId = null;
            ensureAssistant();
            break;
          }
          case 'text_delta': {
            const id = ensureAssistant();
            const delta: string = ev.delta || '';
            if (!delta) break;
            // 直接更新せずバッファに積む。typing loop が一定速度で消化する
            const buf = typingBufferRef.current;
            buf.set(id, (buf.get(id) || '') + delta);
            startTypingLoop();
            break;
          }
          case 'text_end': {
            currentAssistantId = null;
            break;
          }
          case 'tool_call': {
            // 進行中の text を flush してからツールバッジを挿入
            flushTypingBuffer();
            currentAssistantId = null;
            const toolName: string = ev.tool_name || ev.name || 'unknown';
            const toolArguments = ev.arguments;
            setMessages((prev) => [
              ...prev,
              {
                id: createId(),
                role: 'tool',
                content: '',
                toolName,
                toolArguments,
              },
            ]);
            break;
          }
          case 'tool_result': {
            flushTypingBuffer();
            currentAssistantId = null;
            const toolName: string = ev.tool_name || ev.name || 'unknown';
            const result = ev.result;
            // 直近の同名 tool で result 未設定のものに紐付ける
            setMessages((prev) => {
              const next = [...prev];
              for (let i = next.length - 1; i >= 0; i--) {
                const t = next[i];
                if (
                  t.role === 'tool' &&
                  t.toolName === toolName &&
                  t.toolResult === undefined
                ) {
                  next[i] = { ...t, toolResult: result };
                  return next;
                }
              }
              // 紐付け先がなければ単独の tool エントリとして追加
              next.push({
                id: createId(),
                role: 'tool',
                content: '',
                toolName,
                toolResult: result,
              });
              return next;
            });
            break;
          }
          // title / stream_start / stream_end は今回未使用
        }
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setInput('');

    const userMsgId = createId();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text },
    ]);
    // 自分のメッセージが画面上端にくるよう一度だけスクロール
    scrollMessageToTop(userMsgId);

    try {
      let tid = threadId;
      if (!tid) {
        const createRes = await fetch(API_BASE, { method: 'POST' });
        if (!createRes.ok) {
          throw new Error(`スレッド作成に失敗しました (${createRes.status})`);
        }
        const data = await createRes.json();
        tid = data.thread_id as string;
        setThreadId(tid);
        // ローカルのスレッド一覧に追加 (タイトルは title イベントで後で埋まる)
        const newEntry: ThreadEntry = {
          id: tid,
          title: null,
          createdAt: Date.now(),
        };
        updateThreads((prev) => [newEntry, ...prev]);
      }

      await streamReply(tid, text);
      // ストリーム自体は終わっていても、タイピング表示が残っている可能性がある
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
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
      {isInitial && (
        <div className={styles.welcome}>
          <h2 className={styles.greeting}>{greeting}</h2>
          <p className={styles.description}>
            このチャットではs20024(やら)の紹介を行うAIチャットです。
          </p>
        </div>
      )}

      {!isInitial && (
        <div className={styles.messageList} ref={listRef}>
          <div className={styles.messageListInner}>
            {historyLoading && (
              <div className={styles.historyLoading} aria-busy="true">
                <div className={styles.typing}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            {(() => {
              const renderMessage = (m: Message) => {
                if (m.role === 'tool') {
                  return (
                    <div
                      key={m.id}
                      data-msg-id={m.id}
                      className={`${styles.messageRow} ${styles.assistant}`}
                    >
                      <ToolBadge
                        name={m.toolName || 'unknown'}
                        args={m.toolArguments}
                        result={m.toolResult}
                      />
                    </div>
                  );
                }
                return (
                  <div
                    key={m.id}
                    data-msg-id={m.id}
                    className={`${styles.messageRow} ${
                      m.role === 'user' ? styles.user : styles.assistant
                    }`}
                  >
                    <div className={styles.bubble}>
                      {m.role === 'user' ? (
                        <div className={styles.userText}>{m.content}</div>
                      ) : m.id === streamingId && !m.content ? (
                        <div className={styles.typing}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      ) : (
                        <AiMessage content={m.content} />
                      )}
                    </div>
                  </div>
                );
              };

              // 最新ユーザーメッセージまでは通常 / それ以降は応答グループラッパーに入れる
              const groupStart =
                lastUserIndex >= 0 ? lastUserIndex + 1 : messages.length;
              const beforeGroup = messages.slice(0, groupStart);
              const inGroup = messages.slice(groupStart);
              const showGroup = lastUserIndex >= 0;
              return (
                <>
                  {beforeGroup.map(renderMessage)}
                  {showGroup && (
                    <div
                      className={styles.responseGroup}
                      style={
                        aiGroupMinHeight !== undefined
                          ? { minHeight: aiGroupMinHeight }
                          : undefined
                      }
                    >
                      {inGroup.map(renderMessage)}
                      {isLoading && !streamingId && (
                        <div
                          className={`${styles.messageRow} ${styles.assistant}`}
                        >
                          <div className={styles.bubble}>
                            <div className={styles.typing}>
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className={styles.inputBox}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力(Enterで送信、Shift+Enterで改行)"
          rows={2}
          maxLength={1000}
          disabled={isLoading}
        />
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          type="button"
          aria-label="送信"
        >
          送信
        </button>
      </div>
      </div>
    </>
  );
};

export default Chat;
