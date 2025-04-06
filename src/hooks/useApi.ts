import { useState, useEffect } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApi<T>(url: string, options: RequestInit = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true }));
      
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({ 
            data: null, 
            loading: false, 
            error: error instanceof Error ? error : new Error('Unknown error') 
          });
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [url, JSON.stringify(options)]);
  
  return state;
}

// Hook pour récupérer les données d'un athlète
export function useAthleteProfile() {
  return useApi('/api/athlete');
}

// Hook pour récupérer les détails d'un itinéraire avec météo et élévation
export function useRouteDetails(routeId: string) {
  return useApi(`/api/routes/${routeId}`);
}

// Hook pour récupérer des recommandations d'entraînement
export function useTrainingRecommendations() {
  return useApi('/api/training/recommendations');
}

// Hook pour récupérer des recommandations nutritionnelles pour un itinéraire
export function useNutritionRecommendations(routeId: string) {
  return useApi(`/api/nutrition/recommendations?routeId=${routeId}`);
}

// Hook pour récupérer des recommandations d'équipement
export function useEquipmentRecommendations(routeId: string) {
  return useApi(`/api/equipment/recommendations?routeId=${routeId}`);
}
