import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { ENV } from '../../config/environment';

export const Auth0ProviderWithHistory: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const navigate = useNavigate();

  // Utiliser les variables du fichier de configuration centralisé
  const { domain, clientId, audience, scope } = ENV.auth0;

  const onRedirectCallback = (appState: any) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  if (!domain || !clientId) {
    console.error('Auth0 configuration missing. Check your environment variables:', 
      { domain, clientId }
    );
    return <div>Error: Auth0 configuration is missing.</div>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
        scope: scope
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
