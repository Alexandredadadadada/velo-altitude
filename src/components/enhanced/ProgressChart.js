import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '@mui/material';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant affichant un graphique de progression pour les statistiques d'entraînement
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.data - Données du graphique au format Chart.js
 * @param {string} props.timeframe - Période sélectionnée (week, month, year, all)
 */
const ProgressChart = ({ data, timeframe }) => {
  const theme = useTheme();

  // Options de configuration du graphique
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 4,
        boxShadow: theme.shadows[3],
        callbacks: {
          // Personnalisation des tooltips
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Distance')) {
                label += context.parsed.y.toFixed(1) + ' km';
              } else if (label.includes('Vitesse')) {
                label += context.parsed.y.toFixed(1) + ' km/h';
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 45,
          minRotation: 45
        },
        title: {
          display: true,
          text: timeframe === 'week' ? 'Derniers 7 jours' : 
                timeframe === 'month' ? 'Derniers 30 jours' : 
                timeframe === 'year' ? 'Derniers 12 mois' : 'Toutes les activités'
        }
      },
      y: {
        position: 'left',
        title: {
          display: true,
          text: 'Distance (km)'
        },
        grid: {
          borderDash: [5, 5]
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      y1: {
        position: 'right',
        title: {
          display: true,
          text: 'Vitesse (km/h)'
        },
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 10
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 3,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: theme.palette.background.paper
      }
    }
  };

  // Adapter les options en fonction de la période
  if (timeframe === 'week') {
    options.scales.x.ticks.maxTicksLimit = 7;
  } else if (timeframe === 'month') {
    options.scales.x.ticks.maxTicksLimit = 10;
  } else if (timeframe === 'year') {
    options.scales.x.ticks.maxTicksLimit = 12;
  } else {
    // Pour 'all', adapter en fonction du nombre de points
    const pointCount = data?.labels?.length || 0;
    options.scales.x.ticks.maxTicksLimit = Math.min(12, pointCount);
  }

  // Si aucune donnée n'est disponible, afficher un message
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/progresschart"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        color: theme.palette.text.secondary
      }}>
        Aucune donnée disponible pour cette période
      </div>
    );
  }

  return <Line data={data} options={options} />;
};

export default ProgressChart;
