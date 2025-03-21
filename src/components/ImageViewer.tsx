import React, { useState } from 'react';
import styles from './ImageViewer.module.scss';
import IconClose from './icon/IconClose';

interface ImageViewerProps {
  src: string;
  alt?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className={styles.imageViewer}>
      <div className={styles.imageWrapper}>
        <img src={src} alt={alt} className={styles.image} onClick={openModal} />
      </div>

      {isModalOpen && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img src={src} alt={alt} className={styles.modalImage} />
            <button className={styles.closeButton} onClick={closeModal} aria-label="閉じる">
              <IconClose />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;
