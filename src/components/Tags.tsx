import React from 'react';
import styles from './Tags.module.scss';

interface TagsProps {
  size?: 'small' | 'large';
  max?: number;
  tags?: string[];
}

const Tags: React.FC<TagsProps> = ({ size = 'small', max = -1, tags = [] }) => {
  let displayTags = tags;
  let afterMessage = '';
  if (max > 0 && tags.length > max) {
    displayTags = tags.slice(0, max);
    afterMessage = `+${tags.length - max}`;
  }

  return (
    <div className={styles.tags}>
      {
        displayTags.map((tag) => (
          <a href={`/tag/${tag.toLowerCase()}`} className={`${styles.tag} ${styles[size]}`} key={tag}>
            {tag}
          </a>
        ))
      }
      {afterMessage && <span className={styles.moreTags}>{afterMessage}</span>}
    </div>
  );
};

export default Tags;
