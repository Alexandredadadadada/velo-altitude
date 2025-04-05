import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import Chart from 'chart.js/auto';

/**
 * TrainingZoneChart Component
 * Visualizes cycling training zones based on FTP using Chart.js
 * 
 * @param {Object} props - Component props
 * @param {Object} props.zones - Training zones object calculated from FTP
 * @param {number} props.ftp - The cyclist's Functional Threshold Power
 * @param {string} props.className - Optional CSS class name
 */
const TrainingZoneChart = ({ zones, ftp, className = '' }) => {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const theme = useTheme();
  
  useEffect(() => {
    // Destroy existing chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    if (!canvasRef.current || !zones) return;
    
    // Prepare data for chart
    const zoneLabels = [
      'Z1: Récupération',
      'Z2: Endurance',
      'Z3: Tempo',
      'Z4: Seuil',
      'Z5: VO2 Max',
      'Z6: Anaérobie',
      'Z7: Neuromuscular'
    ];
    
    const zoneRanges = [
      [0, zones.z1.max],
      [zones.z2.min, zones.z2.max],
      [zones.z3.min, zones.z3.max],
      [zones.z4.min, zones.z4.max],
      [zones.z5.min, zones.z5.max],
      [zones.z6.min, zones.z6.max],
      [zones.z7.min, zones.z7.min + 50] // Add a cap for visualization
    ];
    
    const zoneColors = [
      'rgba(53, 162, 235, 0.7)',  // Blue
      'rgba(75, 192, 192, 0.7)',  // Teal
      'rgba(102, 205, 170, 0.7)', // Green
      'rgba(255, 205, 86, 0.7)',  // Yellow
      'rgba(255, 159, 64, 0.7)',  // Orange
      'rgba(255, 99, 132, 0.7)',  // Red
      'rgba(153, 102, 255, 0.7)'  // Purple
    ];
    
    // Calculate zone widths for bar chart
    const zoneWidths = zoneRanges.map(([min, max]) => max - min);
    
    // Create chart
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: zoneLabels,
        datasets: [{
          label: 'Plage de puissance (watts)',
          data: zoneWidths,
          backgroundColor: zoneColors,
          borderColor: zoneColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Puissance (watts)',
              color: theme.palette.text.primary,
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: theme.palette.divider
            },
            ticks: {
              color: theme.palette.text.secondary
            }
          },
          y: {
            stacked: true,
            grid: {
              display: false
            },
            ticks: {
              color: theme.palette.text.primary,
              font: {
                weight: 'bold'
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const zoneIndex = context.dataIndex;
                const [min, max] = zoneRanges[zoneIndex];
                return `${min} - ${max} watts (${Math.round(min/ftp*100)}-${Math.round(max/ftp*100)}% FTP)`;
              }
            }
          },
          legend: {
            display: false
          }
        }
      }
    });
    
    // Add annotations for FTP line
    const originalDraw = Chart.controllers.bar.prototype.draw;
    Chart.controllers.bar.prototype.draw = function() {
      originalDraw.apply(this, arguments);
      
      const chart = this.chart;
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      
      // Draw FTP line
      const ftpPixel = xAxis.getPixelForValue(ftp);
      
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ftpPixel, yAxis.top);
      ctx.lineTo(ftpPixel, yAxis.bottom);
      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.palette.error.main;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      
      // Add FTP label
      ctx.fillStyle = theme.palette.error.main;
      ctx.textAlign = 'center';
      ctx.fillText('FTP', ftpPixel, yAxis.top - 10);
      ctx.fillText(`${ftp}W`, ftpPixel, yAxis.top - 25);
      ctx.restore();
    };
    
    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      // Restore original draw method
      Chart.controllers.bar.prototype.draw = originalDraw;
    };
  }, [zones, ftp, theme]);
  
  if (!zones || !ftp) {
    return null;
  }
  
  return (
    <Card className={`training-zone-chart ${className}`} elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Visualisation des zones d'entraînement
        </Typography>
        <Box sx={{ height: 300, position: 'relative' }}>
          <canvas ref={canvasRef}></canvas>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
          Les zones d'entraînement sont calculées à partir de votre FTP de {ftp} watts.
          Chaque zone correspond à différents objectifs physiologiques et d'entraînement.
        </Typography>
      </CardContent>
    </Card>
  );
};

TrainingZoneChart.propTypes = {
  zones: PropTypes.shape({
    z1: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string
    }),
    z2: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string
    }),
    z3: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string
    }),
    z4: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string
    }),
    z5: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string
    }),
    z6: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string
    }),
    z7: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string
    })
  }).isRequired,
  ftp: PropTypes.number.isRequired,
  className: PropTypes.string
};

export default TrainingZoneChart;
