import React from 'react';
import styles from './Footer.module.scss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../../consts';
import SocialIcon from '../SocialIcon';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <h2>{SITE_TITLE}</h2>
            <p>{SITE_DESCRIPTION}</p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h3>コンテンツ</h3>
              <ul>
                <li>
                  <a href="/">ホーム</a>
                </li>
                <li>
                  <a href="/plog">プログ</a>
                </li>
                <li>
                  <a href="/news">ニュース</a>
                </li>
                <li>
                  <a href="/memo">メモ</a>
                </li>
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h3>その他</h3>
              <ul>
                <li>
                  <a href="/about">プロフィール</a>
                </li>
                {/* <li><a href="/contact">お問い合わせ</a></li> */}
                {/* <li><a href="/privacy">プライバシーポリシー</a></li> */}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h3>フォロー</h3>
              <div className={styles.socialLinks}>
                <SocialIcon type="github" />
                <SocialIcon type="twitter" />
                <SocialIcon type="portfolio" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.copyright}>
          <p>
            &copy; {currentYear} {SITE_TITLE}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
