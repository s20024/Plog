import React, { useState } from 'react';
import styles from './ToolBadge.module.scss';
import { formatValue } from '../../utils/formatValue';

/**
 * AIのツール呼び出しを折りたたみ可能なバッジで表示するコンポーネント。
 * 引数・結果の詳細をドロップダウンで確認できる。
 */
const ToolBadge: React.FC<{
  name: string;
  args?: unknown;
  result?: unknown;
}> = ({ name, args, result }) => {
  const [open, setOpen] = useState(false);
  const hasResult = result !== undefined;

  return (
    <div className={styles.tool}>
      <button type="button" className={styles.toolName} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
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

export default ToolBadge;
