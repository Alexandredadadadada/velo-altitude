/**
 * Composant et HOC pour gérer le chargement des données avec gestion des erreurs,
 * mise en cache, et fonctionnalités de chargement améliorées
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CircularProgress, Alert, Button, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import ReplayIcon from '@mui/icons-material/Replay';

// État de chargement des données
interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Options pour le HOC de chargement de données
interface DataFetchingOptions {
  cacheKey?: string;
  cacheTTL?: number; // Durée de vie du cache en millisecondes
  initialData?: any;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  loadOnMount?: boolean;
  dependencies?: any[];
}

// Styles pour les conteneurs d'état
const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  minHeight: '200px',
  width: '100%'
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.error.light,
  color: theme.palette.error.contrastText,
  marginBottom: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}));

/**
 * Composant d'état de chargement par défaut
 */
export const DefaultLoadingState: React.FC = () => (
  <LoadingContainer>
    <CircularProgress size={40} thickness={4} />
    <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
      Chargement des données en cours...
    </Typography>
  </LoadingContainer>
);

/**
 * Composant d'état d'erreur par défaut
 */
export const DefaultErrorState: React.FC<{
  error: string;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <ErrorContainer>
    <Alert 
      severity="error" 
      action={
        onRetry && (
          <Button 
            color="inherit" 
            size="small" 
            onClick={onRetry}
            startIcon={<ReplayIcon />}
          >
            Réessayer
          </Button>
        )
      }
    >
      {error || "Une erreur est survenue lors du chargement des données"}
    </Alert>
  </ErrorContainer>
);

/**
 * HOC (Higher Order Component) pour ajouter la gestion du chargement des données à un composant
 * @param Component - Composant à envelopper
 * @param fetchFn - Fonction de chargement des données
 * @param options - Options de configuration
 */
export function withDataFetching<P, T = any>(
  Component: React.ComponentType<P & { data: T | null; loading: boolean; error: string | null; lastUpdated: number | null; refetch: () => Promise<void>; retry: () => void }>,
  fetchFn: (props: P) => Promise<T>,
  options: DataFetchingOptions = {}
) {
  return function WithDataFetching(props: P) {
    const [state, setState] = useState<DataState<T>>({
      data: options.initialData || null,
      loading: options.loadOnMount !== false,
      error: null,
      lastUpdated: null
    });

    // Fonction pour charger les données
    const fetchData = useCallback(async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // Ajouter un timeout pour éviter les chargements interminables
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Le chargement a pris trop de temps")), 15000)
        );
        
        const dataPromise = fetchFn(props);
        const result = await Promise.race([dataPromise, timeoutPromise]);
        
        setState({
          data: result,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        });
        
        // Mettre en cache si nécessaire
        if (options.cacheKey) {
          try {
            sessionStorage.setItem(options.cacheKey, JSON.stringify({
              data: result,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.warn("Erreur lors de la mise en cache:", e);
          }
        }
      } catch (error: any) {
        console.error("Erreur lors du chargement des données:", error);
        setState(prev => ({
          ...prev,
          error: error.message || "Une erreur est survenue",
          loading: false
        }));
      }
    }, [props]);
    
    // Fonction pour réessayer en cas d'erreur
    const retry = useCallback(() => {
      fetchData();
    }, [fetchData]);
    
    // Vérifier le cache et charger les données au montage
    useEffect(() => {
      const checkCacheAndFetch = async () => {
        // Vérifier le cache si une clé de cache est fournie
        if (options.cacheKey) {
          try {
            const cachedData = sessionStorage.getItem(options.cacheKey);
            
            if (cachedData) {
              const parsed = JSON.parse(cachedData);
              const cacheTime = parsed.timestamp;
              const now = Date.now();
              
              // Vérifier si le cache est encore valide (15 min par défaut)
              if (now - cacheTime < (options.cacheTTL || 900000)) {
                setState({
                  data: parsed.data,
                  loading: false,
                  error: null,
                  lastUpdated: cacheTime
                });
                return;
              }
            }
          } catch (e) {
            console.warn("Erreur lors de la lecture du cache:", e);
          }
        }
        
        // Si pas de cache valide, charger les données
        if (options.loadOnMount !== false) {
          fetchData();
        }
      };
      
      checkCacheAndFetch();
    }, [options.cacheKey, ...(options.dependencies || [])]);
    
    // Si le composant est en chargement et qu'un composant de chargement personnalisé est fourni
    if (state.loading && options.loadingComponent) {
      return <>{options.loadingComponent}</>;
    }
    
    // Si une erreur s'est produite et qu'un composant d'erreur personnalisé est fourni
    if (state.error && options.errorComponent) {
      const ErrorComp = options.errorComponent as React.ReactElement;
      return React.cloneElement(ErrorComp, { error: state.error, onRetry: retry });
    }
    
    // Passer les données et fonctions au composant enveloppé
    return (
      <Component
        {...props}
        data={state.data}
        loading={state.loading}
        error={state.error}
        lastUpdated={state.lastUpdated}
        refetch={fetchData}
        retry={retry}
      />
    );
  };
}

/**
 * Composant pour la gestion du chargement des données
 */
export const DataFetcher = <T extends any>({
  fetchFn,
  children,
  loadingComponent = <DefaultLoadingState />,
  errorComponent,
  cacheKey,
  cacheTTL,
  loadOnMount = true,
  dependencies = []
}: {
  fetchFn: () => Promise<T>;
  children: (data: T | null, { loading, error, refetch }: { loading: boolean; error: string | null; refetch: () => Promise<void> }) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactElement;
  cacheKey?: string;
  cacheTTL?: number;
  loadOnMount?: boolean;
  dependencies?: any[];
}) => {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: loadOnMount,
    error: null,
    lastUpdated: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await fetchFn();
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });
      
      // Mettre en cache si nécessaire
      if (cacheKey) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: result,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn("Erreur lors de la mise en cache:", e);
        }
      }
      
      return result;
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      setState(prev => ({
        ...prev,
        error: error.message || "Une erreur est survenue",
        loading: false
      }));
    }
  }, [fetchFn, cacheKey]);
  
  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  // Vérifier le cache et charger les données au montage
  useEffect(() => {
    const checkCacheAndFetch = async () => {
      // Vérifier le cache si une clé de cache est fournie
      if (cacheKey) {
        try {
          const cachedData = sessionStorage.getItem(cacheKey);
          
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            const cacheTime = parsed.timestamp;
            const now = Date.now();
            
            // Vérifier si le cache est encore valide
            if (now - cacheTime < (cacheTTL || 900000)) {
              setState({
                data: parsed.data,
                loading: false,
                error: null,
                lastUpdated: cacheTime
              });
              return;
            }
          }
        } catch (e) {
          console.warn("Erreur lors de la lecture du cache:", e);
        }
      }
      
      // Si pas de cache valide, charger les données
      if (loadOnMount) {
        fetchData();
      }
    };
    
    checkCacheAndFetch();
  }, [cacheKey, cacheTTL, loadOnMount, fetchData, ...dependencies]);
  
  // Afficher le composant de chargement
  if (state.loading) {
    return <>{loadingComponent}</>;
  }
  
  // Afficher le composant d'erreur
  if (state.error) {
    if (errorComponent) {
      return React.cloneElement(errorComponent, { error: state.error, onRetry: retry });
    }
    
    return <DefaultErrorState error={state.error} onRetry={retry} />;
  }
  
  // Rendre les enfants avec les données
  return <>{children(state.data, { loading: state.loading, error: state.error, refetch: fetchData })}</>;
};

export default DataFetcher;
