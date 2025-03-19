import React, { useEffect, useState } from 'react';
import '../../styles/background.scss';
import { COLORS } from '../../consts';

const BUBBLE_DENSITY = 0.00001; // 表示されるバブルの密度
const RANDOM_BUBBLE_SIZE = 320; // 表示されるバブルのランダムサイズ
const MIN_BUBBLE_SIZE = 20; // 表示されるバブルの最小サイズ
const RANDOM_BUBBLE_SPEED = 0.5; // 表示されるバブルのランダムスピード
const MIN_BUBBLE_SPEED = 0.1; // 表示されるバブルの最小スピード
const BUBBLE_PROBABILITY = 0.9; // 表示されるバブルの確率

interface Bubble {
  id: number;
  size: number;
  x: number;
  y: number;
  color: string;
  speed: number;
  type: 'circle' | 'star';
}

const BackgroundDecoration: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const bubbleCount = Math.floor(windowWidth * windowHeight * BUBBLE_DENSITY);

    const newBubbles: Bubble[] = [];
    for (let i = 0; i < bubbleCount; i++) {
      newBubbles.push(createBubble(i));
    }

    setBubbles(newBubbles);

    const handleResize = () => {
      const newWindowWidth = window.innerWidth;
      const newWindowHeight = window.innerHeight;
      const newBubbleCount = Math.floor(
        newWindowWidth * newWindowHeight * BUBBLE_DENSITY,
      );

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
    const size = Math.random() * RANDOM_BUBBLE_SIZE + MIN_BUBBLE_SIZE;

    return {
      id,
      size,
      x: Math.random() * windowWidth,
      y: Math.random() * windowHeight,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * RANDOM_BUBBLE_SPEED + MIN_BUBBLE_SPEED,
      type: Math.random() > BUBBLE_PROBABILITY ? 'star' : 'circle',
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
