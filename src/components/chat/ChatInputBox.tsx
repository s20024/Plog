import React, { useEffect, useRef } from 'react';
import styles from './ChatInputBox.module.scss';

/**
 * チャットの入力エリアコンポーネント。
 * Enterキーで送信、Shift+Enterで改行、入力内容に応じて自動リサイズする。
 */
const ChatInputBox: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = (): void => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight);
    const maxH = lineHeight * 5 + 0.6 * 16 * 2;
    ta.style.height = `${Math.min(ta.scrollHeight, maxH)}px`;
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={styles.inputBox}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="メッセージを入力(Enterで送信、Shift+Enterで改行)"
        rows={2}
        maxLength={1000}
        disabled={disabled}
      />
      <button
        className={styles.sendButton}
        onClick={onSend}
        disabled={!value.trim() || disabled}
        type="button"
        aria-label="送信"
      >
        送信
      </button>
    </div>
  );
};

export default ChatInputBox;
