import React from 'react';

interface IconChatProps {
  width?: number;
  height?: number;
  fill?: string;
}

const IconChat: React.FC<IconChatProps> = ({ width = 24, height = 24, fill = 'currentColor' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill={fill}>
      <path d="M20 2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h2v4l5-4h9c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm0 14h-9.667L8 18.333V16H4V4h16v12z"></path>
      <circle cx="8" cy="10" r="1.25"></circle>
      <circle cx="12" cy="10" r="1.25"></circle>
      <circle cx="16" cy="10" r="1.25"></circle>
    </svg>
  );
};

export default IconChat;
