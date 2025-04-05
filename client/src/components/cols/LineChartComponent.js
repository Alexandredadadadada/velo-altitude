import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './EnhancedColDetail.css';

/**
 * Composant optimisé pour les graphiques - extrait du composant EnhancedColDetail
 * Ce composant utilise Chart.js pour afficher les données d'élévation et de gradient
 * Optimisé pour le chargement paresseux et les performances
 */
const LineChartComponent = ({ data, options, type = 'elevation', title, isVisible = true }) => {
  const chartRef = useRef(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartInstance, setChartInstance] = useState(null);

  // Observer pour le chargement paresseux basé sur la visibilité
  useEffect(() => {
    // Initialiser un IntersectionObserver uniquement si la visibilité n'est pas déjà assurée
    if (!isVisible) {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsChartReady(true);
            // Une fois que le composant est visible, on peut arrêter l'observation
            observer.unobserve(entry.target);
          }
        });
      }, options);

      // On observe l'élément parent du graphique
      const chartContainer = document.querySelector('.chart-container');
      if (chartContainer) {
        observer.observe(chartContainer);
      }

      return () => {
        if (chartContainer) {
          observer.unobserve(chartContainer);
        }
      };
    } else {
      // Si isVisible est true, on charge immédiatement
      setIsChartReady(true);
    }
  }, [isVisible]);

  // Optimisation des performances du graphique
  useEffect(() => {
    // Nettoyage de l'instance précédente pour éviter les fuites mémoire
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [chartInstance]);

  // Référence la chart instance pour pouvoir y accéder ailleurs
  const onChartRef = (reference) => {
    if (reference) {
      chartRef.current = reference;
      setChartInstance(reference.chartInstance);
    }
  };

  // Optimisation par mémoisation des données
  const memoizedData = React.useMemo(() => {
    return data;
  }, [JSON.stringify(data)]);

  // Optimisation des options du graphique
  const memoizedOptions = React.useMemo(() => {
    return {
      ...options,
      // Options additionnelles pour optimiser le rendu
      animation: {
        duration: 500 // Réduire la durée d'animation pour améliorer les performances
      },
      resizeDelay: 200, // Éviter les rendus multiples lors du redimensionnement
      devicePixelRatio: window.devicePixelRatio || 1, // Optimiser la netteté sur les écrans haute résolution
      maintainAspectRatio: false, // Permettre au graphique de remplir son conteneur
      responsive: true,
      plugins: {
        ...options?.plugins,
        title: {
          display: !!title,
          text: title || '',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'x',
          }
        }
      },
      interaction: {
        mode: 'nearest',
        intersect: false,
        axis: 'x'
      },
    };
  }, [options, title]);

  // Fallback pendant le chargement
  const renderLoadingState = () => (
    <div className="chart-loading">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
      <p>Chargement du graphique {type}...</p>
    </div>
  );

  if (!isChartReady || !memoizedData) {
    return renderLoadingState();
  }

  return (
    <div className={`chart-container ${type}-chart`}>
      <Line 
        data={memoizedData} 
        options={memoizedOptions}
        ref={onChartRef}
      />
      <div className="chart-controls">
        <button 
          className="btn btn-sm btn-outline-secondary me-2" 
          onClick={() => {
            if (chartRef.current && chartRef.current.chartInstance) {
              chartRef.current.chartInstance.resetZoom();
            }
          }}
        >
          Réinitialiser le zoom
        </button>
        <button 
          className="btn btn-sm btn-outline-primary" 
          onClick={() => {
            if (chartRef.current && chartRef.current.chartInstance) {
              // Export du graphique en PNG
              const dataUrl = chartRef.current.chartInstance.toBase64Image();
              const link = document.createElement('a');
              link.href = dataUrl;
              link.download = `graphique-${type}-${new Date().toISOString().slice(0, 10)}.png`;
              link.click();
            }
          }}
        >
          Exporter
        </button>
      </div>
    </div>
  );
};

// Composant de chargement paresseux
export const LazyLineChart = lazy(() => {
  // Simuler un délai de chargement pour éviter les saccades UI
  return new Promise(resolve => {
    // Délai minimal pour éviter le flash de chargement
    setTimeout(() => {
      resolve(import('./LineChartComponent').then(module => ({ default: module.default })));
    }, 300);
  });
});

// Composant wrapper avec Suspense
export const LineChartWithSuspense = (props) => (
  <Suspense fallback={
    <div className="chart-loading">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
    </div>
  }>
    <LazyLineChart {...props} />
  </Suspense>
);

export default React.memo(LineChartComponent);
