import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Chart from 'chart.js/auto';

/**
 * Composant de visualisation des zones d'entraînement basées sur le FTP
 * @param {Object} props - Propriétés du composant
 * @param {number} props.ftp - Valeur FTP de l'utilisateur
 * @param {Object} props.theme - Thème Material UI pour la cohérence visuelle
 */
const TrainingZoneChart = ({ ftp, theme }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Définition des zones d'entraînement basées sur le FTP
  const trainingZones = [
    { name: 'Zone 1 - Récupération active', min: 0, max: Math.round(ftp * 0.55), color: '#4caf50' },
    { name: 'Zone 2 - Endurance', min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75), color: '#8bc34a' },
    { name: 'Zone 3 - Tempo', min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90), color: '#ffeb3b' },
    { name: 'Zone 4 - Seuil lactique', min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05), color: '#ff9800' },
    { name: 'Zone 5 - VO2 Max', min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20), color: '#f44336' },
    { name: 'Zone 6 - Capacité anaérobie', min: Math.round(ftp * 1.21), max: Math.round(ftp * 1.50), color: '#9c27b0' },
    { name: 'Zone 7 - Sprint', min: Math.round(ftp * 1.51), max: Math.round(ftp * 2.50), color: '#3f51b5' },
  ];

  useEffect(() => {
    if (!ftp) return;

    // Calcul de la plage maximale pour l'axe X
    const maxPower = Math.max(...trainingZones.map(zone => zone.max), ftp * 1.1);
    
    // Préparation des données pour Chart.js
    const data = {
      labels: trainingZones.map(zone => zone.name),
      datasets: [{
        label: 'Plage de puissance (watts)',
        data: trainingZones.map(zone => zone.max - zone.min),
        backgroundColor: trainingZones.map(zone => zone.color),
        barThickness: 30,
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1
      }]
    };

    // Configuration du graphique
    const config = {
      type: 'bar',
      data: data,
      options: {
        indexAxis: 'y',
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const zoneIndex = context.dataIndex;
                return `${trainingZones[zoneIndex].min} - ${trainingZones[zoneIndex].max} watts`;
              }
            }
          },
          annotation: {
            annotations: {
              ftpLine: {
                type: 'line',
                xMin: ftp,
                xMax: ftp,
                borderColor: 'rgba(0, 0, 0, 0.8)',
                borderWidth: 2,
                label: {
                  content: `FTP: ${ftp}w`,
                  enabled: true,
                  position: 'top'
                }
              }
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: maxPower,
            title: {
              display: true,
              text: 'Puissance (watts)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Zones d\'entraînement'
            },
            grid: {
              display: false
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    };

    // Création ou mise à jour du graphique
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (chartRef.current) {
      chartInstance.current = new Chart(chartRef.current, config);
    }

    // Nettoyage lors du démontage du composant
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [ftp, theme]);

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Zones d'entraînement basées sur votre FTP
      </Typography>
      <Box sx={{ height: 350 }}>
        <canvas ref={chartRef} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          Ces zones sont calculées automatiquement à partir de votre FTP de {ftp} watts.
          Utilisez-les pour structurer vos entraînements selon vos objectifs.
        </Typography>
      </Box>
    </Paper>
  );
};

export default TrainingZoneChart;
