import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  Delete,
  FileDownload,
  Info
} from '@mui/icons-material';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { fr } from 'date-fns/locale';
import AnimatedTransition from '../common/AnimatedTransition';

/**
 * FTPHistory Component
 * Displays the history of FTP tests and shows progression over time
 */
const FTPHistory = ({ ftpHistory = [], onDeleteRecord, className = '' }) => {
  const [timeRange, setTimeRange] = useState('all');
  const [chartData, setChartData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Process FTP history data for display
  useEffect(() => {
    if (!ftpHistory || ftpHistory.length === 0) return;
    
    // Sort history by date
    const sortedHistory = [...ftpHistory].sort((a, b) => 
      new Date(a.testDate) - new Date(b.testDate)
    );
    
    // Filter data based on selected time range
    let filteredHistory = sortedHistory;
    const now = new Date();
    
    if (timeRange !== 'all') {
      const monthsBack = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
      const cutoffDate = new Date();
      cutoffDate.setMonth(now.getMonth() - monthsBack);
      
      filteredHistory = sortedHistory.filter(item => 
        new Date(item.testDate) >= cutoffDate
      );
    }
    
    // Calculate statistics
    if (filteredHistory.length > 0) {
      const firstFTP = filteredHistory[0].ftp;
      const lastFTP = filteredHistory[filteredHistory.length - 1].ftp;
      const totalGain = lastFTP - firstFTP;
      const percentImprovement = ((lastFTP - firstFTP) / firstFTP * 100).toFixed(1);
      
      // Calculate average monthly improvement
      const firstDate = new Date(filteredHistory[0].testDate);
      const lastDate = new Date(filteredHistory[filteredHistory.length - 1].testDate);
      const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                         (lastDate.getMonth() - firstDate.getMonth());
      
      const monthlyImprovement = monthsDiff > 0 
        ? (totalGain / monthsDiff).toFixed(1) 
        : 'N/A';
      
      setStatistics({
        firstFTP,
        lastFTP,
        totalGain,
        percentImprovement,
        monthlyImprovement,
        monthsDiff
      });
    }
    
    // Prepare chart data
    setChartData(filteredHistory);
  }, [ftpHistory, timeRange]);
  
  // Initialize and update chart
  useEffect(() => {
    if (!chartData || !canvasRef.current) return;
    
    // Destroy existing chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    const ctx = canvasRef.current.getContext('2d');
    
    // Create chart
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'FTP (watts)',
            data: chartData.map(item => ({
              x: new Date(item.testDate),
              y: item.ftp
            })),
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Puissance/Poids (W/kg)',
            data: chartData.map(item => ({
              x: new Date(item.testDate),
              y: item.powerToWeight
            })),
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(tooltipItems) {
                const date = new Date(tooltipItems[0].raw.x);
                return date.toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                });
              },
              label: function(context) {
                const index = context.dataIndex;
                const testMethod = chartData[index].method;
                
                if (context.dataset.label === 'FTP (watts)') {
                  return `FTP: ${context.raw.y}W (Méthode: ${testMethod})`;
                } else {
                  return `Puissance/Poids: ${context.raw.y} W/kg`;
                }
              }
            }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: chartData.length > 10 ? 'month' : 'day',
              tooltipFormat: 'PP',
              displayFormats: {
                day: 'dd MMM',
                month: 'MMM yyyy'
              }
            },
            adapters: {
              date: {
                locale: fr
              }
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'FTP (watts)'
            },
            suggestedMin: Math.max(0, Math.min(...chartData.map(item => item.ftp)) - 20)
          },
          y1: {
            position: 'right',
            beginAtZero: false,
            title: {
              display: true,
              text: 'W/kg'
            },
            suggestedMin: Math.max(0, Math.min(...chartData.map(item => item.powerToWeight)) - 0.5),
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
    
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartData]);
  
  // Handle time range change
  const handleTimeRangeChange = (event, newTimeRange) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };
  
  // Generate CSV data for export
  const handleExportCSV = () => {
    if (!ftpHistory || ftpHistory.length === 0) return;
    
    const sortedHistory = [...ftpHistory].sort((a, b) => 
      new Date(a.testDate) - new Date(b.testDate)
    );
    
    const headers = ['Date', 'FTP (watts)', 'Puissance/Poids (W/kg)', 'Méthode de test'];
    const csvContent = [
      headers.join(','),
      ...sortedHistory.map(item => {
        const date = new Date(item.testDate).toLocaleDateString('fr-FR');
        return [
          date,
          item.ftp,
          item.powerToWeight,
          item.method
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'historique_ftp.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // If no data yet
  if (!ftpHistory || ftpHistory.length === 0) {
    return (
      <Card className={`ftp-history ${className}`} elevation={2}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Historique FTP
          </Typography>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="info">
              Aucun historique FTP disponible. Utilisez le calculateur FTP pour enregistrer vos tests.
            </Alert>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <AnimatedTransition type="fade">
      <Card className={`ftp-history ${className}`} elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Historique FTP
            </Typography>
            
            <Box>
              <IconButton onClick={handleExportCSV} size="small" sx={{ mr: 1 }} title="Exporter en CSV">
                <FileDownload />
              </IconButton>
              <Tooltip title="Visualisez votre progression FTP au fil du temps. Ces données sont calculées à partir de vos tests FTP enregistrés.">
                <IconButton size="small">
                  <Info />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              aria-label="Période d'affichage"
              size="small"
            >
              <ToggleButton value="3m" aria-label="3 mois">
                3 mois
              </ToggleButton>
              <ToggleButton value="6m" aria-label="6 mois">
                6 mois
              </ToggleButton>
              <ToggleButton value="1y" aria-label="1 an">
                1 an
              </ToggleButton>
              <ToggleButton value="all" aria-label="Tout l'historique">
                Tout
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ height: 300, position: 'relative' }}>
                {chartData ? (
                  <canvas ref={canvasRef}></canvas>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              {statistics && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Statistiques de progression
                    </Typography>
                    
                    <Box sx={{ my: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        FTP Initial
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {statistics.firstFTP} W
                      </Typography>
                    </Box>
                    
                    <Box sx={{ my: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        FTP Actuel
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {statistics.lastFTP} W
                      </Typography>
                    </Box>
                    
                    <Box sx={{ my: 2, display: 'flex', alignItems: 'center' }}>
                      <TrendingUp color="success" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        Gain total: <strong>{statistics.totalGain} W</strong> ({statistics.percentImprovement}%)
                      </Typography>
                    </Box>
                    
                    {statistics.monthsDiff > 0 && (
                      <Box sx={{ my: 2 }}>
                        <Typography variant="body1">
                          Progression moyenne: <strong>{statistics.monthlyImprovement} W/mois</strong>
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Détail des tests
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>FTP (watts)</TableCell>
                      <TableCell>W/kg</TableCell>
                      <TableCell>Méthode</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...ftpHistory]
                      .sort((a, b) => new Date(b.testDate) - new Date(a.testDate))
                      .map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(record.testDate).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{record.ftp}</TableCell>
                        <TableCell>{record.powerToWeight}</TableCell>
                        <TableCell>{record.method}</TableCell>
                        <TableCell align="right">
                          {onDeleteRecord && (
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => onDeleteRecord(index)}
                              title="Supprimer"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </AnimatedTransition>
  );
};

FTPHistory.propTypes = {
  ftpHistory: PropTypes.arrayOf(
    PropTypes.shape({
      ftp: PropTypes.number.isRequired,
      powerToWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      method: PropTypes.string.isRequired,
      testDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired
    })
  ),
  onDeleteRecord: PropTypes.func,
  className: PropTypes.string
};

export default FTPHistory;
