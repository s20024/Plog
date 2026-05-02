import React from 'react';
import styles from './ChatWelcome.module.scss';

interface Props {
  greeting: string;
}

/**
 * チャット初期表示時のウェルカム画面コンポーネント。
 * 時間帯に応じた挨拶文とサービス説明を表示する。
 */
const ChatWelcome: React.FC<Props> = ({ greeting }) => {
  return (
    <div className={styles.welcome}>
      <h2 className={styles.greeting}>{greeting}</h2>
      <p className={styles.description}>このチャットではs20024(やら)の紹介を行うAIチャットなのだ。</p>
    </div>
  );
};

export default ChatWelcome;
