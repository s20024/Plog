import React, { useState } from 'react';
import style from './Navigation.module.scss';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={style.navigation}>
      <div className={style.desktopNav}>
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
          <li>
            <a href="/about">プロフィール</a>
          </li>
        </ul>
      </div>

      <div className={style.mobileNav}>
        <button className={`${style.hamburger} ${isMenuOpen ? style.active : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`${style.mobileMenu} ${isMenuOpen ? style.active : ''}`}>
          <ul>
            <li>
              <a href="/" onClick={toggleMenu}>
                ホーム
              </a>
            </li>
            <li>
              <a href="/plog" onClick={toggleMenu}>
                プログ
              </a>
            </li>
            <li>
              <a href="/news" onClick={toggleMenu}>
                ニュース
              </a>
            </li>
            <li>
              <a href="/memo" onClick={toggleMenu}>
                メモ
              </a>
            </li>
            <li>
              <a href="/about" onClick={toggleMenu}>
                プロフィール
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
