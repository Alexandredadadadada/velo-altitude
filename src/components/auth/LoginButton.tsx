import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { FaSignInAlt } from 'react-icons/fa';
import styles from '../../features/auth/AuthPages.module.css';

interface LoginButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
  label?: string;
  showIcon?: boolean;
}

const LoginButton: React.FC<LoginButtonProps> = ({ 
  className, 
  variant = 'primary', 
  label = 'Se connecter',
  showIcon = true
}) => {
  const { loginWithRedirect } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname
      }
    });
  };

  return (
    <button 
      onClick={handleLogin}
      className={`${styles.profileButton} ${styles[`${variant}Button`]} ${className || ''}`}
    >
      {showIcon && <FaSignInAlt style={{ marginRight: '8px' }} />} {label}
    </button>
  );
};

export default LoginButton;
