import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  ButtonGroup, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Alert, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell,
  Divider,
  Stack,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssessmentIcon from '@mui/icons-material/Assessment';

const PassComparison = ({ passId1, passId2 }) => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('elevation');
  const comparisonRef = useRef(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  
  // Charger les données de comparaison
  useEffect(() => {
    setLoading(true);
    axios.get(`/api/visualization/passes/compare/${passId1}/${passId2}`)
      .then(response => {
        if (response.data.status === 'success') {
          setComparisonData(response.data.data);
        } else {
          setError('Erreur lors du chargement des données');
        }
      })
      .catch(err => {
        console.error('Erreur lors de la récupération des données de comparaison', err);
        setError(`Erreur lors de la récupération des données: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [passId1, passId2]);

  // Préparer les données pour les graphiques d'élévation
  const prepareElevationChartData = () => {
    if (!comparisonData) return [];
    
    const pass1 = comparisonData.pass1;
    const pass2 = comparisonData.pass2;
    
    // Normaliser les profils d'élévation pour avoir le même nombre de points
    const normalize = (profile, count) => {
      if (!profile || profile.length === 0) return [];
      
      const result = [];
      const step = profile.length / count;
      
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(i * step);
        if (profile[idx]) {
          result.push(profile[idx]);
        }
      }
      
      return result;
    };
    
    const normalizedCount = 100; // Nombre de points à afficher
    const profile1 = normalize(pass1.visualization.elevationProfile, normalizedCount);
    const profile2 = normalize(pass2.visualization.elevationProfile, normalizedCount);
    
    // Créer les données pour le graphique
    return Array.from({ length: normalizedCount }, (_, i) => {
      const point1 = profile1[i] || [0, 0];
      const point2 = profile2[i] || [0, 0];
      
      return {
        distance: (i / normalizedCount * 100).toFixed(1) + '%', // Distance en pourcentage
        elevation1: point1[1],
        elevation2: point2[1]
      };
    });
  };
  
  // Préparer les données pour le graphique de segments par difficulté
  const prepareSegmentChartData = () => {
    if (!comparisonData) return [];
    
    const comparison = comparisonData.comparison.segmentsByDifficulty;
    
    return Object.keys(comparison).map(difficulty => ({
      difficulty,
      pass1: comparison[difficulty].percentagePass1,
      pass2: comparison[difficulty].percentagePass2
    }));
  };
  
  // Préparer les données pour le graphique de métriques
  const prepareMetricsChartData = () => {
    if (!comparisonData) return [];
    
    const { length, elevationGain, averageGradient, maxGradient } = comparisonData.comparison;
    
    return [
      {
        name: 'Longueur (km)',
        pass1: length.pass1,
        pass2: length.pass2
      },
      {
        name: 'Dénivelé (m)',
        pass1: elevationGain.pass1,
        pass2: elevationGain.pass2
      },
      {
        name: 'Pente moy. (%)',
        pass1: averageGradient.pass1,
        pass2: averageGradient.pass2
      },
      {
        name: 'Pente max. (%)',
        pass1: maxGradient.pass1,
        pass2: maxGradient.pass2
      }
    ];
  };
  
  // Exporter au format PDF
  const exportToPDF = () => {
    if (!comparisonRef.current) return;
    
    html2canvas(comparisonRef.current, {
      scale: 2,
      logging: false,
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      
      // Ajouter le titre
      pdf.setFontSize(18);
      pdf.text(`Comparaison: ${comparisonData.pass1.name} vs. ${comparisonData.pass2.name}`, 14, 20);
      
      // Ajouter l'image
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      pdf.save(`Comparaison-${comparisonData.pass1.name}-${comparisonData.pass2.name}.pdf`);
    });
  };
  
  // Exporter au format image
  const exportToImage = () => {
    if (!comparisonRef.current) return;
    
    html2canvas(comparisonRef.current, {
      scale: 2,
      logging: false,
      useCORS: true
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Comparaison-${comparisonData.pass1.name}-${comparisonData.pass2.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };
  
  // Styled components pour un design plus moderne
  const ComparisonContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
  }));

  const ChartContainer = styled(Box)(({ theme }) => ({
    height: '400px',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    backgroundColor: theme.palette.background.paper,
  }));

  const TabPanel = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3, 0),
  }));

  const StyledTabs = styled(Tabs)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    '& .MuiTabs-indicator': {
      height: 3,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
  }));

  const TableStyled = styled(Table)(({ theme }) => ({
    '.positive': {
      color: theme.palette.success.main,
      fontWeight: 'bold',
    },
    '.negative': {
      color: theme.palette.error.main,
      fontWeight: 'bold',
    },
    'th': {
      fontWeight: 'bold',
      backgroundColor: theme.palette.mode === 'light' 
        ? theme.palette.grey[100] 
        : theme.palette.grey[800],
    }
  }));

  const ExportButtonsContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  }));

  const PassInfoCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }));

  const KeyMetric = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }));

  // Si chargement en cours
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si erreur
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  // Si pas de données
  if (!comparisonData) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Données non disponibles pour la comparaison
      </Alert>
    );
  }

  const { pass1, pass2, comparison } = comparisonData;
  
  // Texte d'analyse
  const analysisText = [
    `${pass1.name} ${comparison.length.difference > 0 ? 'est plus long de' : 'est plus court de'} ${Math.abs(comparison.length.difference).toFixed(1)} km par rapport à ${pass2.name}.`,
    `Le dénivelé de ${pass1.name} est ${comparison.elevationGain.difference > 0 ? 'supérieur de' : 'inférieur de'} ${Math.abs(comparison.elevationGain.difference)} m.`,
    `${comparison.difficulty.comparison}`,
    `${pass1.name} présente des segments ${Object.keys(comparison.segmentsByDifficulty).length > 0 ? Object.keys(comparison.segmentsByDifficulty).reduce((acc, key) => {
      if (comparison.segmentsByDifficulty[key].percentagePass1 > comparison.segmentsByDifficulty[key].percentagePass2) {
        return `${acc}${acc ? ' et ' : ''}plus ${key}`;
      }
      return acc;
    }, '') : ''}.`
  ];

  return (
    <ComparisonContainer ref={comparisonRef}>
      <Typography variant="h4" gutterBottom>
        Comparaison : {pass1.name} vs {pass2.name}
      </Typography>
      
      <ExportButtonsContainer>
        <ButtonGroup variant="outlined" size="small">
          <Button startIcon={<PictureAsPdfIcon />} onClick={exportToPDF}>
            Exporter en PDF
          </Button>
          <Button startIcon={<ImageIcon />} onClick={exportToImage}>
            Exporter en image
          </Button>
        </ButtonGroup>
      </ExportButtonsContainer>
      
      <StyledTabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        aria-label="onglets de comparaison"
        sx={{ mb: 3 }}
      >
        <Tab 
          label="Profil d'élévation" 
          value="elevation" 
          icon={<TimelineIcon />} 
          iconPosition="start"
        />
        <Tab 
          label="Segments" 
          value="segments" 
          icon={<BarChartIcon />} 
          iconPosition="start"
        />
        <Tab 
          label="Métriques" 
          value="metrics" 
          icon={<AssessmentIcon />} 
          iconPosition="start"
        />
      </StyledTabs>
      
      {activeTab === 'elevation' && (
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={prepareElevationChartData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              onMouseMove={(data) => {
                if (data && data.activePayload) {
                  setSelectedDataPoint(data.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setSelectedDataPoint(null)}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
              <XAxis 
                dataKey="distance" 
                label={{ 
                  value: 'Progression (%)', 
                  position: 'insideBottomRight', 
                  offset: -5 
                }} 
              />
              <YAxis 
                label={{ 
                  value: 'Altitude (m)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }} 
              />
              <RechartsTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <Paper 
                        elevation={3} 
                        sx={{ 
                          p: 1.5, 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: 1,
                          boxShadow: '0 3px 14px rgba(0, 0, 0, 0.15)',
                          borderLeft: '4px solid',
                          borderColor: 'primary.main'
                        }}
                      >
                        <Typography variant="subtitle2">
                          Distance: {payload[0].payload.distance}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#8884d8', fontWeight: 'bold' }}>
                          {pass1.name}: {payload[0].value} m
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#82ca9d', fontWeight: 'bold' }}>
                          {pass2.name}: {payload[1].value} m
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', pt: 0.5, display: 'block' }}>
                          Différence: {Math.abs(payload[0].value - payload[1].value)} m
                        </Typography>
                      </Paper>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                payload={[
                  { value: pass1.name, type: 'line', color: '#8884d8' },
                  { value: pass2.name, type: 'line', color: '#82ca9d' }
                ]}
                wrapperStyle={{ paddingTop: 10 }}
              />
              <Line 
                type="monotone" 
                dataKey="elevation1" 
                stroke="#8884d8" 
                strokeWidth={3}
                activeDot={{ r: 8, strokeWidth: 0, fill: '#8884d8' }} 
                dot={false}
                name={pass1.name}
              />
              <Line 
                type="monotone" 
                dataKey="elevation2" 
                stroke="#82ca9d" 
                strokeWidth={3} 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#82ca9d' }} 
                dot={false} 
                name={pass2.name}
              />
              
              {/* Points critiques */}
              {comparisonData && comparisonData.comparison.criticalPoints && comparisonData.comparison.criticalPoints.map((point, index) => (
                <ReferenceLine 
                  key={index}
                  x={point.distance + '%'} 
                  stroke="#ff7300"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ 
                    value: point.name, 
                    position: 'top',
                    fill: '#ff7300',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
      
      {activeTab === 'segments' && (
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareSegmentChartData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
              <XAxis 
                dataKey="difficulty" 
                label={{ 
                  value: 'Niveau de difficulté', 
                  position: 'insideBottomRight', 
                  offset: -5 
                }} 
              />
              <YAxis 
                label={{ 
                  value: 'Pourcentage du parcours (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }} 
              />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <Paper 
                        elevation={3} 
                        sx={{ 
                          p: 1.5, 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: 1,
                          boxShadow: '0 3px 14px rgba(0, 0, 0, 0.15)',
                          borderLeft: '4px solid',
                          borderColor: 'primary.main'
                        }}
                      >
                        <Typography variant="subtitle2">
                          Difficulté: {label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#8884d8', fontWeight: 'bold' }}>
                          {pass1.name}: {payload[0].value.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#82ca9d', fontWeight: 'bold' }}>
                          {pass2.name}: {payload[1].value.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', pt: 0.5, display: 'block' }}>
                          Différence: {Math.abs(payload[0].value - payload[1].value).toFixed(1)}%
                        </Typography>
                      </Paper>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                payload={[
                  { value: pass1.name, type: 'rect', color: '#8884d8' },
                  { value: pass2.name, type: 'rect', color: '#82ca9d' }
                ]}
              />
              <Bar 
                dataKey="pass1" 
                fill="#8884d8" 
                name={pass1.name} 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="pass2" 
                fill="#82ca9d" 
                name={pass2.name} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
      
      {activeTab === 'metrics' && (
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareMetricsChartData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.5} horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={150}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    let unit = "";
                    if (label.includes("Longueur")) unit = " km";
                    else if (label.includes("Dénivelé")) unit = " m";
                    else if (label.includes("Pente")) unit = "%";
                    
                    return (
                      <Paper 
                        elevation={3} 
                        sx={{ 
                          p: 1.5, 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: 1,
                          boxShadow: '0 3px 14px rgba(0, 0, 0, 0.15)',
                          borderLeft: '4px solid',
                          borderColor: 'primary.main'
                        }}
                      >
                        <Typography variant="subtitle2">
                          {label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#8884d8', fontWeight: 'bold' }}>
                          {pass1.name}: {payload[0].value}{unit}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#82ca9d', fontWeight: 'bold' }}>
                          {pass2.name}: {payload[1].value}{unit}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', pt: 0.5, display: 'block' }}>
                          Différence: {Math.abs(payload[0].value - payload[1].value).toFixed(1)}{unit}
                        </Typography>
                      </Paper>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                payload={[
                  { value: pass1.name, type: 'rect', color: '#8884d8' },
                  { value: pass2.name, type: 'rect', color: '#82ca9d' }
                ]}
              />
              <Bar dataKey="pass1" fill="#8884d8" name={pass1.name} radius={[0, 4, 4, 0]} />
              <Bar dataKey="pass2" fill="#82ca9d" name={pass2.name} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <PassInfoCard>
            <Typography variant="h6" component="h3" gutterBottom color="primary">
              {pass1.name}
            </Typography>
            
            <KeyMetric>
              <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: 2, minWidth: 40, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                  {comparison.difficulty.pass1}
                </Typography>
              </Box>
              <Typography variant="body1">
                Difficulté globale
              </Typography>
            </KeyMetric>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 1 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <i className="fas fa-ruler-combined" style={{ marginRight: '8px' }} />
                {comparison.length.pass1} km
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <i className="fas fa-mountain" style={{ marginRight: '8px' }} />
                {comparison.elevationGain.pass1} m D+
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <i className="fas fa-angle-up" style={{ marginRight: '8px' }} />
                {comparison.averageGradient.pass1.toFixed(1)}% moyenne
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-angle-double-up" style={{ marginRight: '8px' }} />
                {comparison.maxGradient.pass1.toFixed(1)}% max
              </Typography>
            </Box>
            
            {pass1.keyPoints && (
              <Box mt={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Points clés:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 0, mt: 0.5 }}>
                  {pass1.keyPoints.map((point, idx) => (
                    <Typography component="li" key={idx} variant="body2">
                      {point}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </PassInfoCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <PassInfoCard>
            <Typography variant="h6" component="h3" gutterBottom color="secondary">
              {pass2.name}
            </Typography>
            
            <KeyMetric>
              <Box sx={{ bgcolor: 'secondary.light', p: 1, borderRadius: 2, minWidth: 40, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="secondary.contrastText">
                  {comparison.difficulty.pass2}
                </Typography>
              </Box>
              <Typography variant="body1">
                Difficulté globale
              </Typography>
            </KeyMetric>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 1 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <i className="fas fa-ruler-combined" style={{ marginRight: '8px' }} />
                {comparison.length.pass2} km
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <i className="fas fa-mountain" style={{ marginRight: '8px' }} />
                {comparison.elevationGain.pass2} m D+
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <i className="fas fa-angle-up" style={{ marginRight: '8px' }} />
                {comparison.averageGradient.pass2.toFixed(1)}% moyenne
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-angle-double-up" style={{ marginRight: '8px' }} />
                {comparison.maxGradient.pass2.toFixed(1)}% max
              </Typography>
            </Box>
            
            {pass2.keyPoints && (
              <Box mt={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Points clés:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 0, mt: 0.5 }}>
                  {pass2.keyPoints.map((point, idx) => (
                    <Typography component="li" key={idx} variant="body2">
                      {point}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </PassInfoCard>
        </Grid>
      </Grid>
      
      <Box mt={4} mb={3}>
        <Typography variant="h6" gutterBottom>
          Tableau comparatif
        </Typography>
        <TableStyled>
          <TableHead>
            <TableRow>
              <TableCell>Métrique</TableCell>
              <TableCell>{pass1.name}</TableCell>
              <TableCell>{pass2.name}</TableCell>
              <TableCell>Différence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Longueur</TableCell>
              <TableCell>{comparison.length.pass1} km</TableCell>
              <TableCell>{comparison.length.pass2} km</TableCell>
              <TableCell className={comparison.length.difference > 0 ? 'positive' : 'negative'}>
                {Math.abs(comparison.length.difference).toFixed(1)} km {comparison.length.difference > 0 ? 'de plus' : 'de moins'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Dénivelé</TableCell>
              <TableCell>{comparison.elevationGain.pass1} m</TableCell>
              <TableCell>{comparison.elevationGain.pass2} m</TableCell>
              <TableCell className={comparison.elevationGain.difference > 0 ? 'positive' : 'negative'}>
                {Math.abs(comparison.elevationGain.difference)} m {comparison.elevationGain.difference > 0 ? 'de plus' : 'de moins'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Pente moyenne</TableCell>
              <TableCell>{comparison.averageGradient.pass1.toFixed(1)} %</TableCell>
              <TableCell>{comparison.averageGradient.pass2.toFixed(1)} %</TableCell>
              <TableCell className={comparison.averageGradient.difference > 0 ? 'positive' : 'negative'}>
                {Math.abs(comparison.averageGradient.difference).toFixed(1)} % {comparison.averageGradient.difference > 0 ? 'de plus' : 'de moins'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Pente maximale</TableCell>
              <TableCell>{comparison.maxGradient.pass1.toFixed(1)} %</TableCell>
              <TableCell>{comparison.maxGradient.pass2.toFixed(1)} %</TableCell>
              <TableCell className={comparison.maxGradient.difference > 0 ? 'positive' : 'negative'}>
                {Math.abs(comparison.maxGradient.difference).toFixed(1)} % {comparison.maxGradient.difference > 0 ? 'de plus' : 'de moins'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Difficulté</TableCell>
              <TableCell>{comparison.difficulty.pass1}</TableCell>
              <TableCell>{comparison.difficulty.pass2}</TableCell>
              <TableCell>{comparison.difficulty.comparison}</TableCell>
            </TableRow>
          </TableBody>
        </TableStyled>
      </Box>
      
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Analyse comparative pour cyclistes
        </Typography>
        <Paper elevation={1} sx={{ p: 3, backgroundColor: 'background.paper', borderRadius: 2 }}>
          {analysisText.map((text, index) => (
            <Typography key={index} paragraph mb={index === analysisText.length - 1 ? 0 : 2}>
              {text}
            </Typography>
          ))}
          
          <Box mt={3} p={2} sx={{ backgroundColor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Recommandation pour cyclistes:
            </Typography>
            <Typography variant="body2">
              {pass1.name} est {comparison.recommendedFor.pass1}
            </Typography>
            <Typography variant="body2">
              {pass2.name} est {comparison.recommendedFor.pass2}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </ComparisonContainer>
  );
};

export default PassComparison;
