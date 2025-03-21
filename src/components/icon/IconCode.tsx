import React from 'react';

interface IconCodeProps {
  width?: number;
  height?: number;
  fill?: string;
}

const IconCode: React.FC<IconCodeProps> = ({ width = 24, height = 24, fill = 'currentColor' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill={fill}>
      <path d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V5h16l.002 14H4z"></path>
      <path d="M9.293 9.293L5.586 13l3.707 3.707 1.414-1.414L8.414 13l2.293-2.293zm5.414 0l-1.414 1.414L15.586 13l-2.293 2.293 1.414 1.414L18.414 13z"></path>
    </svg>
  );
};

export default IconCode;
