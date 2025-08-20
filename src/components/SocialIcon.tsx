import React from 'react';
import styles from './SocialIcon.module.scss';
import { GITHUB_URL, INSTAGRAM_URL, PORTFOLIO_URL, TWITTER_URL } from '../consts';
import IconGithub from './icon/IconGithub';
import IconInstagram from './icon/IconInstagram';
import IconTwitter from './icon/IconTwitter';
import IconBusinessCard from './icon/IconBusinessCard';

interface SocialIconProps {
  type: 'github' | 'instagram' | 'twitter' | 'portfolio';
  link?: string;
}

const SocialIcon: React.FC<SocialIconProps> = ({ type, link }) => {
  let defaultLink = '';
  if (type === 'github') {
    defaultLink = GITHUB_URL;
  } else if (type === 'instagram') {
    defaultLink = INSTAGRAM_URL;
  } else if (type === 'twitter') {
    defaultLink = TWITTER_URL;
  } else if (type === 'portfolio') {
    defaultLink = PORTFOLIO_URL;
  }

  const renderIcon = () => {
    // memo:switch書けよw上もw
    if (type === 'github') return <IconGithub />;
    if (type === 'instagram') return <IconInstagram />;
    if (type === 'twitter') return <IconTwitter />;
    if (type === 'portfolio') return <IconBusinessCard />;
    return null;
  };

  return (
    <div className={styles.socialIcon}>
      <a href={link ?? defaultLink} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
        {renderIcon()}
      </a>
    </div>
  );
};

export default SocialIcon;
