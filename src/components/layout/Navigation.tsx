import React, { useState } from 'react';
import '../../styles/navigation.scss';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="desktop-nav">
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
          {/* <li><a href="/memo">メモ</a></li> */}
          <li>
            <a href="/about">プロフィール</a>
          </li>
        </ul>
      </div>

      <div className="mobile-nav">
        <button
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
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
            {/* <li><a href="/memo" onClick={toggleMenu}>メモ</a></li> */}
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
