import React, { useEffect, useState } from 'react';
import '../styles/background.scss';

interface Bubble {
  id: number;
  size: number;
  x: number;
  y: number;
  color: string;
  speed: number;
  type: 'circle' | 'star';
}

const colors = [
  '#D1F1CC', // baseColor
  '#F3D1E5', // subColor1
  '#D5E0F1', // subColor2
  '#C8EFEA', // subColor3
  '#EDD0E5', // subColor4
];

const BackgroundDecoration: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    // ウィンドウサイズに基づいてバブルの数を決定
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const bubbleCount = Math.floor((windowWidth * windowHeight) / 40000);

    // バブルを生成
    const newBubbles: Bubble[] = [];
    for (let i = 0; i < bubbleCount; i++) {
      newBubbles.push(createBubble(i));
    }

    setBubbles(newBubbles);

    // リサイズイベントのリスナー
    const handleResize = () => {
      const newWindowWidth = window.innerWidth;
      const newWindowHeight = window.innerHeight;
      const newBubbleCount = Math.floor((newWindowWidth * newWindowHeight) / 40000);

      if (newBubbleCount !== bubbles.length) {
        const updatedBubbles: Bubble[] = [];
        for (let i = 0; i < newBubbleCount; i++) {
          if (i < bubbles.length) {
            updatedBubbles.push(bubbles[i]);
          } else {
            updatedBubbles.push(createBubble(i));
          }
        }
        setBubbles(updatedBubbles);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const createBubble = (id: number): Bubble => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const size = Math.random() * 60 + 20; // 20px〜80pxのサイズ

    return {
      id,
      size,
      x: Math.random() * windowWidth,
      y: Math.random() * windowHeight,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 0.5 + 0.1, // 浮遊速度
      type: Math.random() > 0.7 ? 'star' : 'circle', // 70%の確率で円、30%の確率で星
    };
  };

  return (
    <div className="bg-decoration">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`bubble ${bubble.type}`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.x}px`,
            top: `${bubble.y}px`,
            backgroundColor: bubble.color,
            animationDuration: `${20 + bubble.speed * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundDecoration;