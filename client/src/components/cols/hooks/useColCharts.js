import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook personnalisé pour gérer les données et options des graphiques d'élévation et de pente
 * 
 * @param {Object} params - Paramètres du hook
 * @param {Array} params.elevationProfile - Profil d'élévation
 * @param {Object} params.col - Données du col
 * @param {Object} params.compareCol - Données du col à comparer (optionnel)
 * @param {boolean} params.compareMode - Mode de comparaison activé
 * @param {string} params.selectedSide - Côté sélectionné
 * @returns {Object} Données et options des graphiques
 */
const useColCharts = ({ elevationProfile, col, compareCol, compareMode, selectedSide }) => {
  const { t } = useTranslation();

  /**
   * Options pour le graphique d'élévation
   */
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false
      },
      legend: {
        position: 'top',
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t('cols.distance_km')
        }
      },
      y: {
        title: {
          display: true,
          text: t('cols.elevation_m')
        }
      }
    }
  }), [t]);

  /**
   * Options pour le graphique de pente
   */
  const gradientChartOptions = useMemo(() => ({
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        title: {
          display: true,
          text: t('cols.gradient_percent')
        }
      }
    }
  }), [chartOptions, t]);

  /**
   * Données pour le graphique d'élévation
   */
  const elevationChartData = useMemo(() => {
    if (!elevationProfile) return null;
    
    return {
      labels: elevationProfile.map(point => `${point.distance.toFixed(1)}km`),
      datasets: [
        {
          label: t('cols.elevation'),
          data: elevationProfile.map(point => point.altitude),
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1
        },
        ...(compareMode && compareCol ? [
          {
            label: `${compareCol.name} (${t('cols.elevation')})`,
            data: elevationProfile.map((point, index) => {
              // Ajuster les données pour la comparaison
              // En pratique, on utiliserait les vraies données du col à comparer
              const factor = compareCol.altitude / col.altitude;
              return point.altitude * factor * 0.9 + Math.random() * 50;
            }),
            fill: false,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderDash: [5, 5],
            tension: 0.1
          }
        ] : [])
      ]
    };
  }, [elevationProfile, compareMode, compareCol, col, t]);

  /**
   * Données pour le graphique de pente
   */
  const gradientChartData = useMemo(() => {
    if (!elevationProfile) return null;
    
    return {
      labels: elevationProfile.map(point => `${point.distance.toFixed(1)}km`),
      datasets: [
        {
          label: t('cols.gradient'),
          data: elevationProfile.map(point => point.gradient),
          fill: false,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          tension: 0.1
        },
        ...(compareMode && compareCol ? [
          {
            label: `${compareCol.name} (${t('cols.gradient')})`,
            data: elevationProfile.map((point, index) => {
              // Ajuster les données pour la comparaison
              // En pratique, on utiliserait les vraies données du col à comparer
              const factor = compareCol.climbData[Object.keys(compareCol.climbData)[0]].maxGradient / 
                           col.climbData[selectedSide].maxGradient;
              return point.gradient * factor * 0.9 + Math.random() * 2 - 1;
            }),
            fill: false,
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderDash: [5, 5],
            tension: 0.1
          }
        ] : [])
      ]
    };
  }, [elevationProfile, compareMode, compareCol, col, selectedSide, t]);

  return {
    chartOptions,
    gradientChartOptions,
    elevationChartData,
    gradientChartData
  };
};

export default useColCharts;
