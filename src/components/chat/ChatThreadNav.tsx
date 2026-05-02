import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './ChatThreadNav.module.scss';
import { COLORS } from '../../consts';
import type { ThreadEntry } from '../../interfaces/chat';

interface Props {
  threads: ThreadEntry[];
  currentThreadId: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

const BUBBLE_SIZE = 110;
const CONTENT_HALF_WIDTH = 540; // 1080 / 2
const TOP_LIMIT = 100;
const BOTTOM_LIMIT_GAP = 30;
const SIDE_EDGE_PADDING = 8;

// 速度・ステアリング設定 (背景バブル並みにゆっくり)
const MAX_SPEED = 0.025;
const STEER_FACTOR = 0.0005;
const NOISE = 0.0003;
const STEER_BUFFER = 60;

interface Physics {
  side: 'left' | 'right';
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** コンテンツ外のマージン幅を計算する */
const computeMarginWidth = (vw: number): number => Math.max(0, (vw - CONTENT_HALF_WIDTH * 2) / 2);

/** 指定された側のXレンジを返す */
const xRangeForSide = (side: 'left' | 'right', vw: number): { min: number; max: number } => {
  const margin = computeMarginWidth(vw);
  if (side === 'left') {
    return {
      min: SIDE_EDGE_PADDING,
      max: Math.max(SIDE_EDGE_PADDING, margin - BUBBLE_SIZE - SIDE_EDGE_PADDING),
    };
  }
  return {
    min: vw - margin + SIDE_EDGE_PADDING,
    max: vw - BUBBLE_SIZE - SIDE_EDGE_PADDING,
  };
};

/** バブルの初期 physics 状態を作る */
const createPhysics = (index: number): Physics => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const side: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right';
  const { min: xMin, max: xMax } = xRangeForSide(side, vw);
  const yMin = TOP_LIMIT;
  const yMax = Math.max(yMin, vh - BUBBLE_SIZE - BOTTOM_LIMIT_GAP);
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.01 + Math.random() * 0.015;
  return {
    side,
    x: xMin + Math.random() * Math.max(1, xMax - xMin),
    y: yMin + Math.random() * Math.max(1, yMax - yMin),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
};

/**
 * チャットスレッドをバブルUIで表示するナビゲーションコンポーネント。
 * PCではバブルが画面サイド上を漂い、モバイルでは上部に横スクロールで並ぶ。
 */
const ChatThreadNav: React.FC<Props> = ({ threads, currentThreadId, busy, onSelect, onDelete, onNewChat }) => {
  const bubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const physicsRef = useRef<Map<string, Physics>>(new Map());
  const rafRef = useRef<number | null>(null);
  const isDesktopRef = useRef<boolean>(false);
  // 削除確認中のスレッドID
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // PC かどうかを判定 (スマホ/タブレットは横スクロールバーで管理)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1381px)');
    isDesktopRef.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      isDesktopRef.current = e.matches;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // threads 変更時: 新規バブルの physics 初期化 / 削除バブルの physics 削除
  useLayoutEffect(() => {
    threads.forEach((t, i) => {
      if (!physicsRef.current.has(t.id)) {
        physicsRef.current.set(t.id, createPhysics(i));
      }
    });
    for (const id of Array.from(physicsRef.current.keys())) {
      if (!threads.some((t) => t.id === id)) {
        physicsRef.current.delete(id);
      }
    }
    // 初期位置を即座に DOM に反映してチラつきを防ぐ
    physicsRef.current.forEach((state, id) => {
      const el = bubbleRefs.current.get(id);
      if (el) {
        el.style.left = `${state.x}px`;
        el.style.top = `${state.y}px`;
      }
    });
  }, [threads]);

  // RAF ループでバブルをゆるやかなステアリングで漂わせる
  useEffect(() => {
    const tick = () => {
      if (isDesktopRef.current) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const yMin = TOP_LIMIT;
        const yMax = Math.max(yMin, vh - BUBBLE_SIZE - BOTTOM_LIMIT_GAP);
        physicsRef.current.forEach((state, id) => {
          const { min: xMin, max: xMax } = xRangeForSide(state.side, vw);

          // 壁に近づくほど強く内側へ向く力 (ステアリング)
          let steerX = 0;
          let steerY = 0;
          if (state.x < xMin + STEER_BUFFER) {
            steerX = (xMin + STEER_BUFFER - state.x) / STEER_BUFFER;
          } else if (state.x > xMax - STEER_BUFFER) {
            steerX = -(state.x - (xMax - STEER_BUFFER)) / STEER_BUFFER;
          }
          if (state.y < yMin + STEER_BUFFER) {
            steerY = (yMin + STEER_BUFFER - state.y) / STEER_BUFFER;
          } else if (state.y > yMax - STEER_BUFFER) {
            steerY = -(state.y - (yMax - STEER_BUFFER)) / STEER_BUFFER;
          }

          state.vx += steerX * STEER_FACTOR + (Math.random() - 0.5) * NOISE;
          state.vy += steerY * STEER_FACTOR + (Math.random() - 0.5) * NOISE;

          // 速度上限
          const speed = Math.hypot(state.vx, state.vy);
          if (speed > MAX_SPEED) {
            state.vx = (state.vx / speed) * MAX_SPEED;
            state.vy = (state.vy / speed) * MAX_SPEED;
          }

          state.x += state.vx;
          state.y += state.vy;

          // 念のためのハードクランプ (絶対に枠外に出ないよう)
          if (state.x < xMin) state.x = xMin;
          if (state.x > xMax) state.x = xMax;
          if (state.y < yMin) state.y = yMin;
          if (state.y > yMax) state.y = yMax;

          const el = bubbleRefs.current.get(id);
          if (el) {
            el.style.left = `${state.x}px`;
            el.style.top = `${state.y}px`;
          }
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <button
        className={styles.newChatButton}
        type="button"
        onClick={onNewChat}
        disabled={busy}
        aria-label="新しいチャット"
      >
        <span className={styles.newChatIcon}>＋</span>
        <span className={styles.newChatLabel}>新しいチャット</span>
      </button>

      <div className={styles.bubblesLayer}>
        {threads.map((t, i) => {
          const color = COLORS[i % COLORS.length];
          const isActive = t.id === currentThreadId;
          const isConfirming = confirmDeleteId === t.id;
          return (
            <div
              key={t.id}
              ref={(el) => {
                if (el) bubbleRefs.current.set(t.id, el);
                else bubbleRefs.current.delete(t.id);
              }}
              className={`${styles.bubble} ${isActive ? styles.active : ''}`}
              style={{
                backgroundColor: color,
                animationDuration: `${20 + (i % 5) * 4}s`,
                animationDelay: `-${(i * 1.7) % 8}s`,
              }}
            >
              {isConfirming ? (
                // 削除確認オーバーレイ
                <div className={styles.bubbleConfirm}>
                  <p className={styles.bubbleConfirmLabel}>削除しますか？</p>
                  <div className={styles.bubbleConfirmButtons}>
                    <button
                      type="button"
                      className={styles.bubbleConfirmOk}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                        onDelete(t.id);
                      }}
                    >
                      削除
                    </button>
                    <button
                      type="button"
                      className={styles.bubbleConfirmCancel}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                    >
                      戻る
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.bubbleSurface}
                    onClick={() => !busy && onSelect(t.id)}
                    disabled={busy}
                    title={t.title || '新しいチャット'}
                  >
                    <span className={styles.bubbleTitle}>{t.title || '新しいチャット'}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.bubbleDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (busy) return;
                      setConfirmDeleteId(t.id);
                    }}
                    disabled={busy}
                    aria-label="このチャットを削除"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ChatThreadNav;
