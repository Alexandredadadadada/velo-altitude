import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

export const Auth0ProviderWithHistory: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const navigate = useNavigate();

  const domain = process.env.REACT_APP_AUTH0_DOMAIN || '';
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID || '';
  const audience = process.env.REACT_APP_AUTH0_AUDIENCE || '';
  const scope = process.env.REACT_APP_AUTH0_SCOPE || 'openid profile email';

  const onRedirectCallback = (appState: any) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  if (!domain || !clientId) {
    console.error('Auth0 configuration missing. Check your environment variables.');
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
