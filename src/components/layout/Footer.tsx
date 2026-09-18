import React from 'react';
import styles from './Footer.module.scss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../../consts';
import SocialIcon from '../SocialIcon';
import PortfolioLink from '../PortfolioLink';
import SearchForm from '../search/SearchForm';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <a href="/" className={styles.homeLink}>
              {/* memo: 隣にサイト名があるため、ロゴは装飾扱い(alt="")にする。 */}
              <img className={styles.logoImg} src="/images/logo@256.png" alt="" />
              <h2>{SITE_TITLE}</h2>
            </a>
            <p>{SITE_DESCRIPTION}</p>
            <div className={styles.footerSearch}>
              <SearchForm />
            </div>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h3>コンテンツ</h3>
              <ul>
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
                  <a href="/chat">チャット</a>
                </li>
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
                <PortfolioLink />
                <div className={styles.socialIcons}>
                  <SocialIcon type="github" />
                  <SocialIcon type="twitter" />
                </div>
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
