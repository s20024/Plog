import React from 'react';

interface IconMemoProps {
  width?: number;
  height?: number;
  fill?: string;
}

const IconMemo: React.FC<IconMemoProps> = ({ width = 24, height = 24, fill = 'currentColor' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill={fill}>
      <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zm0 16H5V5h14v14z"></path>
      <path d="M7 7h1.5v1.5H7zm4 0h1.5v1.5H11zm4 0h1.5v1.5H15zm-8 4h1.5v1.5H7zm4 0h1.5v1.5H11zm4 0h1.5v1.5H15zm-8 4h1.5v1.5H7zm4 0h1.5v1.5H11zm4 0h1.5v1.5H15z"></path>
    </svg>
  );
};

export default IconMemo;
