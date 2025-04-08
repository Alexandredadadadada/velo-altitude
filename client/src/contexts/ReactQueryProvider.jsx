/**
 * Provider React Query
 * 
 * Ce composant fournit le contexte React Query à l'ensemble de l'application,
 * permettant d'utiliser les hooks de requête et de mutation dans tous les composants.
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../lib/react-query';

/**
 * Provider React Query pour l'application
 * @param {Object} props - Props du composant
 * @param {React.ReactNode} props.children - Composants enfants
 * @returns {JSX.Element} Provider React Query
 */
const ReactQueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
