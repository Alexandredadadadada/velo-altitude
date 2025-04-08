import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { FaSignOutAlt } from 'react-icons/fa';
import styles from '../../features/auth/AuthPages.module.css';

interface LogoutButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
  label?: string;
  showIcon?: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className, 
  variant = 'secondary', 
  label = 'Se déconnecter',
  showIcon = true
}) => {
  const { logout } = useAuth0();

  const handleLogout = () => {
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    });
  };

  return (
    <button 
      onClick={handleLogout}
      className={`${styles.profileButton} ${styles[`${variant}Button`]} ${className || ''}`}
    >
      {showIcon && <FaSignOutAlt style={{ marginRight: '8px' }} />} {label}
    </button>
  );
};

export default LogoutButton;
