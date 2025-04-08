import { useState, useEffect, useCallback } from 'react';
import { ColData } from '../../types';
import colService from '../../services/colService';
import { useNotification } from '../useNotification';

/**
 * Options pour le hook useCols
 */
interface UseColsOptions {
  region?: string;
  difficulty?: number;
  limit?: number;
  sortBy?: 'name' | 'altitude' | 'difficulty' | 'length' | 'gradient';
  sortOrder?: 'asc' | 'desc';
  includeDetails?: boolean;
}

/**
 * Hook pour récupérer et gérer les données des cols
 * @param options Options de filtrage et de tri
 */
const useCols = (options: UseColsOptions = {}) => {
  const [cols, setCols] = useState<ColData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();

  /**
   * Charge les cols en fonction des options
   */
  const loadCols = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data: ColData[];

      // Récupérer les cols en fonction des options
      if (options.region) {
        data = await colService.getColsByRegion(options.region);
      } else if (options.difficulty !== undefined) {
        data = await colService.getColsByDifficulty(options.difficulty);
      } else {
        data = await colService.getAllCols();
      }

      // Trier les cols si nécessaire
      if (options.sortBy) {
        data.sort((a, b) => {
          const aValue = a[options.sortBy as keyof ColData];
          const bValue = b[options.sortBy as keyof ColData];
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return options.sortOrder === 'desc' 
              ? bValue.localeCompare(aValue) 
              : aValue.localeCompare(bValue);
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            return options.sortOrder === 'desc' 
              ? bValue - aValue 
              : aValue - bValue;
          }
          
          return 0;
        });
      }

      // Limiter le nombre de résultats si nécessaire
      if (options.limit && options.limit > 0) {
        data = data.slice(0, options.limit);
      }

      setCols(data);
    } catch (err) {
      console.error('[useCols] Error loading cols:', err);
      setError(err instanceof Error ? err : new Error('Failed to load cols'));
      showNotification('Erreur lors du chargement des cols', 'error');
    } finally {
      setLoading(false);
    }
  }, [options, showNotification]);

  // Charger les cols au montage du composant ou lorsque les options changent
  useEffect(() => {
    loadCols();
  }, [loadCols]);

  /**
   * Recherche des cols par terme de recherche
   * @param query Terme de recherche
   */
  const searchCols = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadCols();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await colService.searchCols(query);
      setCols(data);
    } catch (err) {
      console.error(`[useCols] Error searching cols with query "${query}":`, err);
      setError(err instanceof Error ? err : new Error('Failed to search cols'));
      showNotification('Erreur lors de la recherche des cols', 'error');
    } finally {
      setLoading(false);
    }
  }, [loadCols, showNotification]);

  /**
   * Récupère un col par son ID
   * @param id ID du col
   */
  const getColById = useCallback(async (id: string) => {
    try {
      return await colService.getColById(id);
    } catch (err) {
      console.error(`[useCols] Error fetching col with ID ${id}:`, err);
      showNotification(`Erreur lors de la récupération du col ${id}`, 'error');
      throw err;
    }
  }, [showNotification]);

  /**
   * Rafraîchit la liste des cols
   */
  const refresh = useCallback(() => {
    loadCols();
  }, [loadCols]);

  return {
    cols,
    loading,
    error,
    searchCols,
    getColById,
    refresh
  };
};

export default useCols;
