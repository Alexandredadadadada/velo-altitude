import React, { ComponentType, FC, useState, useEffect } from 'react';
import './optimization.css';

/**
 * Options pour le composant lazy-loaded
 */
export interface LazyLoadOptions {
  /**
   * Délai avant le chargement du composant (ms)
   */
  delay?: number;
  
  /**
   * Fallback à afficher pendant le chargement
   */
  fallback?: React.ReactNode;
  
  /**
   * Si true, précharge le composant dès que possible
   */
  preload?: boolean;
  
  /**
   * Priorité de chargement
   */
  priority?: 'high' | 'normal' | 'low';
  
  /**
   * Seuil d'intersection pour le chargement (entre 0 et 1)
   */
  threshold?: number;
  
  /**
   * Marge d'intersection pour le chargement
   */
  rootMargin?: string;
}

/**
 * HOC qui ajoute le lazy loading à un composant
 * 
 * @param Component - Le composant à charger paresseusement
 * @param options - Options de lazy loading
 * @returns Un composant optimisé avec lazy loading
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: LazyLoadOptions = {}
): FC<P> {
  // Valeurs par défaut
  const {
    delay = 0,
    fallback = null,
    preload = false,
    priority = 'normal',
    threshold = 0.1,
    rootMargin = '200px'
  } = options;

  // Composant optimisé
  const LazyLoadedComponent: FC<P> = (props) => {
    // État pour suivre si le composant doit être rendu
    const [shouldRender, setShouldRender] = useState(preload);
    // Référence à l'élément conteneur
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Si le préchargement est activé, rendre immédiatement
      if (preload) {
        return;
      }

      // Configurer l'observateur d'intersection
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            // Ajouter un délai si nécessaire
            if (delay > 0) {
              setTimeout(() => setShouldRender(true), delay);
            } else {
              setShouldRender(true);
            }
            // Arrêter d'observer une fois que le composant est chargé
            observer.disconnect();
          }
        },
        {
          root: null,
          rootMargin,
          threshold
        }
      );

      // Observer l'élément
      if (ref.current) {
        observer.observe(ref.current);
      }

      // Nettoyer l'observateur
      return () => {
        observer.disconnect();
      };
    }, [delay, preload, rootMargin, threshold]);

    // Rendu du composant
    return (
      <div ref={ref} className="lazy-loading-container">
        {shouldRender ? <Component {...props} /> : fallback}
      </div>
    );
  };

  // Définir le nom d'affichage pour le débogage
  LazyLoadedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name || 'Component'})`;

  return LazyLoadedComponent;
}

export default withLazyLoading;
