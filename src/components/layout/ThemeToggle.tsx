import React, { useState, useEffect } from 'react';
import styles from './ThemeToggle.module.scss';

type Theme = 'light' | 'dark';

/**
 * テーマ切り替えコンポーネント
 * タブ形式でライトモードとダークモードを切り替える
 */
const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');

  // テーマの初期化
  useEffect(() => {
    // LocalStorageからテーマを取得
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // システムの設定を確認
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme: Theme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  // システムの設定変更を監視
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // LocalStorageに保存されていない場合のみシステム設定に従う
      if (!localStorage.getItem('theme')) {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  /**
   * テーマをDOMとLocalStorageに適用
   * @param newTheme 適用するテーマ
   */
  const applyTheme = (newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  /**
   * テーマ変更ハンドラー
   * @param newTheme 新しいテーマ
   */
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className={styles.themeToggle}>
      <div className={styles.toggleTabs}>
        <button
          className={`${styles.tab} ${theme === 'light' ? styles.active : ''}`}
          onClick={() => handleThemeChange('light')}
          aria-label="ライトモードに切り替え"
        >
          ☀️
        </button>
        <button
          className={`${styles.tab} ${theme === 'dark' ? styles.active : ''}`}
          onClick={() => handleThemeChange('dark')}
          aria-label="ダークモードに切り替え"
        >
          🌙
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;