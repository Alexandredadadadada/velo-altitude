import { useSnackbar, OptionsObject } from 'notistack';

/**
 * Hook pour afficher des notifications dans l'application
 * Utilise notistack pour gérer les notifications de manière cohérente
 * 
 * @returns Un objet contenant la fonction pour afficher des notifications
 */
export const useNotification = () => {
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Affiche une notification
   * 
   * @param message - Le message à afficher
   * @param variant - Le type de notification (success, error, warning, info, default)
   * @param options - Options supplémentaires pour la notification
   */
  const showNotification = (
    message: string, 
    variant: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default',
    options?: OptionsObject
  ) => {
    enqueueSnackbar(message, {
      variant,
      autoHideDuration: 4000,
      ...options
    });
  };

  return { showNotification };
};

export default useNotification;
