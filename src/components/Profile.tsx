import React from 'react';
import styles from './Profile.module.scss';
import SocialIcon from './SocialIcon';
import { PLOGGER, PLOGGER_NAME } from '../consts';

interface ProfileProps {
  type?: 'short' | 'about';
}

const Profile: React.FC<ProfileProps> = ({ type = 'short' }) => {
  const handleClick = () => {
    window.location.href = '/about';
  };

  return (
    <div className={`${styles.profileSection} ${styles[type]}`}>
      <div className={styles.profileImage} onClick={handleClick}>
        <div className={styles.imagePlaceholder}></div>
      </div>
      <div className={styles.profileInfo}>
        <h2>
          {PLOGGER}({PLOGGER_NAME})
        </h2>
        <p className={styles.profileBio}>
          プログラマー歴2年の初心者プログラマーです。
          <br />
          フロントエンドエンジニアをしています。たまにバックエンドもしています。
          <br />
          SNSは、あまりやっていないです。
        </p>
        <div className={styles.socialLinks}>
          <SocialIcon type="github" />
          <SocialIcon type="twitter" />
        </div>
      </div>
    </div>
  );
};

export default Profile;
