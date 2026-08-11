import React from 'react';
import styles from './PortfolioLink.module.scss';
import IconBusinessCard from './icon/IconBusinessCard';
import { PORTFOLIO_URL } from '../consts';

const PortfolioLink: React.FC = () => {
  return (
    <a
      href={PORTFOLIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.portfolioLink}
      title="ポートフォリオを開く"
    >
      <IconBusinessCard width={18} height={18} />
      <span className={styles.label}>Portfolio</span>
      <span className={styles.url}>{PORTFOLIO_URL.replace(/^https?:\/\//, '')}</span>
    </a>
  );
};

export default PortfolioLink;
