import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullPage = false 
}) => {
  return (
    <div className={`${styles.spinnerContainer} ${fullPage ? styles.fullPage : ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`}></div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
