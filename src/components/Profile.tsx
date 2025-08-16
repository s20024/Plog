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
      <div className={styles.profileImageWrapper} onClick={handleClick}>
        <img src="/images/profile@256.png" alt="Profile" className={styles.profileImage} />
      </div>
      <div className={styles.profileInfo}>
        <h2>{PLOGGER}({PLOGGER_NAME})</h2>
        <p className={styles.profileBio}>
          プログラマー歴2年の初心者プログラマーです。<br />
          フロントエンドエンジニアです。たまにバックエンドもしています。<br />
          SNSは、あまりやっていないです。<br />
          <br />
          ん。。。Laravelの記事しか書いて無くね?w<br />
          バックエンドエンジニアじゃん。w<br />
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
