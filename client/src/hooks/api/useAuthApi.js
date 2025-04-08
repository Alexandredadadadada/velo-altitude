/**
 * Hooks pour l'API d'authentification
 * 
 * Collection de hooks React Query pour gérer toutes les opérations liées à l'authentification.
 * Ces hooks utilisent l'orchestrateur API réel et offrent une gestion de cache efficace.
 * Ils sont conçus pour s'intégrer avec le système d'authentification unifié Velo-Altitude.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiOrchestrator } from '../../contexts/RealApiOrchestratorProvider';
import { queryKeys } from '../../lib/react-query';
import { notificationService } from '../../services/notification/notificationService';
import { useAuth } from '../../auth';
import { optimisticMutation } from '../../lib/optimistic-updates';

/**
 * Hook pour gérer le processus de connexion
 * @returns {Object} Mutation result
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  const { login: authLogin } = useAuth();
  
  return useMutation(
    (credentials) => apiOrchestrator.login(credentials),
    {
      onSuccess: (data) => {
        // Mettre à jour l'état d'authentification via AuthUnified
        authLogin(data.token);
        
        // Stocker les informations utilisateur dans le cache
        if (data.user) {
          queryClient.setQueryData(
            queryKeys.users.profile(data.user.id),
            data.user
          );
        }
        
        notificationService.showSuccess(
          'Connexion réussie',
          { title: 'Authentification' }
        );
      },
      onError: (error) => {
        console.error('Erreur lors de la connexion:', error);
        notificationService.showError(
          'Échec de la connexion',
          { 
            title: 'Erreur d\'authentification',
            description: error.message || 'Identifiants incorrects ou service indisponible'
          }
        );
      }
    }
  );
};

/**
 * Hook pour gérer le processus d'inscription
 * @returns {Object} Mutation result
 */
export const useRegister = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  const { login: authLogin } = useAuth();
  
  return useMutation(
    (userData) => apiOrchestrator.register(userData),
    {
      onSuccess: (data) => {
        // Se connecter automatiquement après l'inscription
        authLogin(data.token);
        
        // Stocker les informations utilisateur dans le cache
        if (data.user) {
          queryClient.setQueryData(
            queryKeys.users.profile(data.user.id),
            data.user
          );
        }
        
        notificationService.showSuccess(
          'Inscription réussie',
          { title: 'Bienvenue sur Velo-Altitude !' }
        );
      },
      onError: (error) => {
        console.error('Erreur lors de l\'inscription:', error);
        notificationService.showError(
          'Échec de l\'inscription',
          { 
            title: 'Erreur d\'inscription',
            description: error.message || 'Impossible de créer votre compte'
          }
        );
      }
    }
  );
};

/**
 * Hook pour gérer la déconnexion
 * @returns {Object} Mutation result
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  const { logout: authLogout } = useAuth();
  
  return useMutation(
    () => apiOrchestrator.logout(),
    optimisticMutation(queryClient, {
      mutationFn: () => apiOrchestrator.logout(),
      
      // Puisque la déconnexion est une opération critique, on n'invalide pas tout de suite
      // mais on le fait dans onSuccess
      invalidateQueries: () => [],
      
      // Pas de mise à jour optimiste du cache car c'est une opération destructive
      updateCache: () => ({}),
      
      // Actions après une déconnexion réussie
      onSuccess: () => {
        // Mettre à jour l'état d'authentification via AuthUnified
        authLogout();
        
        // Invalider toutes les requêtes utilisateur
        queryClient.invalidateQueries({
          predicate: (query) => {
            // Invalider toutes les requêtes utilisateur mais pas les données publiques
            return query.queryKey[0] === 'users' || 
                   query.queryKey[0] === 'activities' ||
                   query.queryKey[0] === 'majeurs7' ||
                   query.queryKey[0] === 'nutrition';
          }
        });
      },
      
      // En cas d'erreur, on déconnecte quand même localement
      onError: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
        authLogout();
        notificationService.showWarning(
          'Déconnexion effectuée localement, mais une erreur est survenue avec le serveur',
          { title: 'Déconnexion partielle' }
        );
      },
      
      // Messages de notification
      successMessage: 'Vous avez été déconnecté avec succès',
      errorMessage: null // Géré manuellement dans onError
    })
  );
};

/**
 * Hook pour rafraîchir le token d'authentification
 * @returns {Object} Mutation result
 */
export const useRefreshToken = () => {
  const apiOrchestrator = useApiOrchestrator();
  const { updateToken } = useAuth();
  
  return useMutation(
    (refreshToken) => apiOrchestrator.refreshToken(refreshToken),
    {
      onSuccess: (data) => {
        // Mettre à jour le token dans AuthUnified
        updateToken(data.token);
      },
      onError: (error) => {
        console.error('Erreur lors du rafraîchissement du token:', error);
        // En cas d'erreur grave, on peut rediriger vers la page de connexion
        // mais généralement c'est géré par les intercepteurs Axios
      },
      // Retries automatiques pour cette opération critique
      retry: 3,
      retryDelay: 1000
    }
  );
};

/**
 * Hook pour récupérer l'utilisateur actuellement connecté
 * @returns {Object} Mutation result
 */
export const useGetCurrentUser = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    () => apiOrchestrator.getCurrentUser(),
    {
      onSuccess: (data) => {
        // Mettre à jour les données utilisateur dans le cache
        queryClient.setQueryData(
          queryKeys.users.profile(data.id),
          data
        );
      },
      onError: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur courant:', error);
      }
    }
  );
};

// Exporter les hooks dans un objet pour faciliter l'import
const authApiHooks = {
  useLogin,
  useRegister,
  useLogout,
  useRefreshToken,
  useGetCurrentUser
};

export default authApiHooks;
