import React from 'react';
import type { Message } from '../../interfaces/chat';
import AiMessage from './AiMessage';
import ToolBadge from './ToolBadge';
import styles from './ChatMessageList.module.scss';

/** 1件のメッセージをレンダリングする */
const renderMessage = (m: Message, streamingId: string | null) => {
  if (m.role === 'tool') {
    return (
      <div key={m.id} data-msg-id={m.id} className={`${styles.messageRow} ${styles.assistant}`}>
        <ToolBadge name={m.toolName || 'unknown'} args={m.toolArguments} result={m.toolResult} />
      </div>
    );
  }
  return (
    <div
      key={m.id}
      data-msg-id={m.id}
      className={`${styles.messageRow} ${m.role === 'user' ? styles.user : styles.assistant}`}
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

/**
 * チャットのメッセージ一覧を表示するコンポーネント。
 * 最新ユーザーメッセージ以降を応答グループとしてラップし、最小高さを確保する。
 */
const ChatMessageList: React.FC<{
  listRef: React.RefObject<HTMLDivElement | null>;
  messages: Message[];
  historyLoading: boolean;
  isLoading: boolean;
  streamingId: string | null;
  lastUserIndex: number;
  lastUserId: string | null;
  aiGroupMinHeight: number | undefined;
}> = ({
  listRef,
  messages,
  historyLoading,
  isLoading,
  streamingId,
  lastUserIndex,
  lastUserId: _lastUserId,
  aiGroupMinHeight,
}) => {
  // 最新ユーザーメッセージ以降が応答グループの開始点
  const groupStart = lastUserIndex >= 0 ? lastUserIndex + 1 : messages.length;
  const beforeGroup = messages.slice(0, groupStart);
  const inGroup = messages.slice(groupStart);
  const showGroup = lastUserIndex >= 0;

  return (
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
        {beforeGroup.map((m) => renderMessage(m, streamingId))}
        {showGroup && (
          <div
            className={styles.responseGroup}
            style={aiGroupMinHeight !== undefined ? { minHeight: aiGroupMinHeight } : undefined}
          >
            {inGroup.map((m) => renderMessage(m, streamingId))}
            {isLoading && !streamingId && (
              <div className={`${styles.messageRow} ${styles.assistant}`}>
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
      </div>
    </div>
  );
};

export default ChatMessageList;
