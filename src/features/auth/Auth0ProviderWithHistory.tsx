/**
 * Auth0 Provider with History
 * 
 * Wraps the Auth0Provider with history management to handle redirects after authentication
 */

import React, { ReactNode } from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { auth0Config } from '../../config/auth0';

interface Auth0ProviderWithHistoryProps {
  children: ReactNode;
}

const Auth0ProviderWithHistory: React.FC<Auth0ProviderWithHistoryProps> = ({ children }) => {
  const navigate = useNavigate();

  // Handle redirect after authentication
  const onRedirectCallback = (appState: any) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  // Ensure required configuration is available
  if (!auth0Config.domain || !auth0Config.clientId) {
    console.error('Error: Auth0 domain or clientId not configured');
    return (
      <div className="auth-error">
        <h2>Configuration Error</h2>
        <p>Auth0 is not properly configured. Please check your environment variables.</p>
      </div>
    );
  }

  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
