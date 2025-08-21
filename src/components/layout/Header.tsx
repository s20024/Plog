import React from 'react';
import styles from './Header.module.scss';
import Navigation from './Navigation';
import ThemeToggle from './ThemeToggle';
import { SITE_TITLE } from '../../consts';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <a href="/">
              <img className={styles.logoImg} src="/images/logo@256.png" alt={SITE_TITLE} />
              <h1 className={styles.siteTitle}>{SITE_TITLE}</h1>
            </a>
          </div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
