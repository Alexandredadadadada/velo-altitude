/**
 * Service de chargement des recettes avec gestion des états de chargement et des erreurs
 * Ce service résout les problèmes de chargement infini et d'erreurs non gérées dans le module nutrition
 */

import { Component, createRef, RefObject } from 'react';
import api from '../api';

// Interface pour les filtres de recettes
interface RecipeFilters {
  search?: string;
  mealType?: string;
  dietary?: string;
  difficulty?: string;
  [key: string]: any;
}

// Interface pour l'état du chargeur de recettes
interface RecipeLoaderState {
  recipes: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

/**
 * Service de chargement des recettes avec gestion des états et des erreurs
 */
export class RecipeLoader extends Component<{}, RecipeLoaderState> {
  errorBoundaryRef: RefObject<any>;
  private abortController: AbortController | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      recipes: [],
      loading: false,
      error: null,
      lastUpdated: null
    };
    this.errorBoundaryRef = createRef();
  }

  /**
   * Charge les recettes avec gestion des erreurs et des états de chargement
   * @param filters - Filtres optionnels pour les recettes
   */
  async loadRecipes(filters: RecipeFilters = {}) {
    // Annuler les requêtes en cours pour éviter les problèmes de course
    if (this.abortController) {
      this.abortController.abort();
    }
    
    // Initialiser un nouveau contrôleur d'annulation
    this.abortController = new AbortController();
    
    this.setState({ loading: true, error: null });
    
    try {
      // Ajouter un timeout pour éviter le chargement infini
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Délai d\'attente dépassé')), 10000)
      );
      
      const dataPromise = api.get('/nutrition/recipes', { 
        params: filters,
        signal: this.abortController.signal 
      });
      
      const response = await Promise.race([dataPromise, timeoutPromise]);
      
      // Utiliser une mise à jour d'état fonctionnelle pour éviter les problèmes de course
      this.setState(prevState => ({
        ...prevState,
        recipes: response.data,
        loading: false,
        lastUpdated: Date.now()
      }));
      
      return response.data;
    } catch (error: any) {
      // Vérifier si l'erreur est due à une annulation volontaire
      if (error.name === 'AbortError') {
        console.log('Requête de recettes annulée');
        return { recipes: [], error: null };
      }
      
      // Gérer les autres erreurs
      const errorMessage = error.message || 'Erreur lors du chargement des recettes';
      console.error('Erreur de chargement des recettes:', errorMessage);
      
      this.setState({ loading: false, error: errorMessage });
      
      // Déclencher l'erreur dans la boundary si disponible
      if (this.errorBoundaryRef.current) {
        this.errorBoundaryRef.current.triggerError(error);
      }
      
      // Retourner des données vides au lieu d'échouer complètement
      return { recipes: [], error: errorMessage };
    }
  }
  
  /**
   * Annule les requêtes en cours lors du démontage du composant
   */
  componentWillUnmount() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
  
  /**
   * Réessaie le chargement des recettes après une erreur
   */
  retryLoading(filters: RecipeFilters = {}) {
    return this.loadRecipes(filters);
  }
  
  /**
   * Vérifie si les données sont périmées et nécessitent un rechargement
   * @param maxAge - Âge maximum des données en millisecondes
   */
  isDataStale(maxAge: number = 300000): boolean {
    const { lastUpdated } = this.state;
    if (!lastUpdated) return true;
    
    return Date.now() - lastUpdated > maxAge;
  }
}

/**
 * Composant d'état de chargement pour les recettes
 * Affiche des skeletons pendant le chargement
 */
export const RecipeLoadingState = () => (
  <div className="recipe-loading-container">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="recipe-skeleton">
        <div className="recipe-skeleton__image"></div>
        <div className="recipe-skeleton__title"></div>
        <div className="recipe-skeleton__meta"></div>
      </div>
    ))}
  </div>
);

/**
 * Composant d'état d'erreur pour les recettes
 * Affiche un message d'erreur avec option de réessai
 */
export const RecipeErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="recipe-error-container">
    <div className="recipe-error__icon">⚠️</div>
    <div className="recipe-error__message">{error}</div>
    <button className="recipe-error__retry-button" onClick={onRetry}>
      Réessayer
    </button>
  </div>
);

/**
 * Composant d'état vide pour les recettes
 * Affiche un message lorsqu'aucune recette n'est disponible
 */
export const RecipeEmptyState = ({ message = "Aucune recette trouvée" }: { message?: string }) => (
  <div className="recipe-empty-container">
    <div className="recipe-empty__icon">🍽️</div>
    <div className="recipe-empty__message">{message}</div>
  </div>
);
