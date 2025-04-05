import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  Button, 
  Chip,
  Divider,
  useTheme,
  alpha,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  TrendingUp,
  DirectionsBike,
  Timer,
  Favorite,
  Speed,
  Whatshot,
  EmojiEvents,
  CheckCircle,
  Flag
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

/**
 * Composant pour afficher les résultats de la simulation d'entraînement de col
 * Cette étape finale présente les projections de performance, 
 * l'impact physiologique et les recommandations
 */
const SimulationResultsStep = ({ formData, onBack, onFinish }) => {
  const theme = useTheme();
  
  // Données générées à partir des entrées utilisateur
  const simulationResults = generateSimulationResults(formData);
  
  return (
    <Box sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          Résultats de la Simulation
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Voici les projections basées sur vos données et le col sélectionné. 
          Ce programme est conçu spécifiquement pour vous préparer à {formData.selectedCol?.name}.
        </Typography>

        {/* Projection de temps et de performances */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card 
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              sx={{ 
                height: '100%',
                borderLeft: `4px solid ${theme.palette.primary.main}`
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Projection de Performance
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Timer color="primary" sx={{ fontSize: 45, mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Temps projeté après programme d'entraînement
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {simulationResults.projectedTime}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Vitesse moyenne
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Speed sx={{ mr: 1, color: theme.palette.info.main }} />
                      <Typography variant="h6">
                        {simulationResults.averageSpeed} km/h
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      VAM
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp sx={{ mr: 1, color: theme.palette.success.main }} />
                      <Typography variant="h6">
                        {simulationResults.vam} m/h
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card 
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              sx={{ 
                height: '100%',
                borderLeft: `4px solid ${theme.palette.secondary.main}`
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Amélioration Projetée
                </Typography>
                
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={simulationResults.progressionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="ftp" 
                        stroke={theme.palette.primary.main} 
                        activeDot={{ r: 8 }} 
                        name="FTP (Watts)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="time" 
                        stroke={theme.palette.secondary.main} 
                        activeDot={{ r: 8 }} 
                        name="Temps (% amélioration)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Programme d'entraînement recommandé */}
        <Card 
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          sx={{ mb: 4 }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Programme d'Entraînement Recommandé (12 semaines)
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Phase 1: Construction (Semaines 1-4)</Typography>
                <List>
                  {simulationResults.trainingProgram.phase1.map((session, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <DirectionsBike color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={session.title}
                        secondary={`${session.duration} min - Zone ${session.zone}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Phase 2: Spécificité (Semaines 5-8)</Typography>
                <List>
                  {simulationResults.trainingProgram.phase2.map((session, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <DirectionsBike color="secondary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={session.title}
                        secondary={`${session.duration} min - Zone ${session.zone}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Phase 3: Affûtage (Semaines 9-12)</Typography>
                <List>
                  {simulationResults.trainingProgram.phase3.map((session, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <DirectionsBike sx={{ color: theme.palette.success.main }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={session.title}
                        secondary={`${session.duration} min - Zone ${session.zone}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Impact physiologique */}
        <Card 
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          sx={{ mb: 4 }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Impact Physiologique
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Amélioration des Systèmes Énergétiques
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Système Aérobie</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{simulationResults.physiologicalImpact.aerobic}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={simulationResults.physiologicalImpact.aerobic} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 5
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Seuil Lactique</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{simulationResults.physiologicalImpact.threshold}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={simulationResults.physiologicalImpact.threshold} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: alpha(theme.palette.warning.main, 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.warning.main,
                        borderRadius: 5
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Puissance Anaérobie</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{simulationResults.physiologicalImpact.anaerobic}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={simulationResults.physiologicalImpact.anaerobic} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: alpha(theme.palette.error.main, 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.error.main,
                        borderRadius: 5
                      }
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Répartition de l'Effort d'Entraînement
                </Typography>
                <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="80%" height="100%">
                    <PieChart>
                      <Pie
                        data={simulationResults.trainingDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {simulationResults.trainingDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Intégration avec 7 Majeurs */}
        <Card 
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          sx={{ mb: 4 }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Progression vers le Défi "7 Majeurs"
            </Typography>
            
            <Typography variant="body2" paragraph>
              Ce programme vous prépare spécifiquement pour {formData.selectedCol?.name}, mais contribue également à votre progression vers le défi des "7 Majeurs".
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" gutterBottom>
                  Impact sur vos autres objectifs
                </Typography>
                
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={simulationResults.majorChallengeProgress}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="currentLevel" stackId="a" fill={theme.palette.info.main} name="Niveau actuel" />
                      <Bar dataKey="improvement" stackId="a" fill={theme.palette.success.main} name="Amélioration projetée" />
                      <Bar dataKey="remaining" stackId="a" fill={theme.palette.grey[300]} name="Reste à accomplir" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Objectifs connexes
                </Typography>
                
                <List>
                  {simulationResults.relatedGoals.map((goal, index) => (
                    <ListItem key={index} sx={{ py: 1 }}>
                      <ListItemIcon>
                        <Flag sx={{ color: goal.color }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={goal.title}
                        secondary={goal.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Boutons de navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            startIcon={<DirectionsBike />}
          >
            Revenir à la génération
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={onFinish}
            endIcon={<CheckCircle />}
          >
            Enregistrer ce Programme
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
};

/**
 * Génère les résultats de simulation basés sur les données du formulaire
 * @param {Object} formData - Données du formulaire des étapes précédentes
 * @returns {Object} Résultats de la simulation
 */
const generateSimulationResults = (formData) => {
  // Dans une application réelle, cela ferait appel à un algorithme complexe
  // basé sur les caractéristiques du col et le niveau de l'utilisateur
  
  // Estimation du temps projeté
  const baseTimeInMinutes = 
    formData.selectedCol?.elevation / 
    ((formData.ftp * 0.8) / (formData.weight * 9.8)) * 60;
  
  // Pour l'exemple, on génère des données fictives mais cohérentes
  return {
    projectedTime: formatTimeFromMinutes(baseTimeInMinutes * 0.85), // 15% d'amélioration
    averageSpeed: (formData.selectedCol?.distance / (baseTimeInMinutes * 0.85 / 60)).toFixed(1),
    vam: Math.floor((formData.selectedCol?.elevation / (baseTimeInMinutes * 0.85 / 60))),
    
    progressionData: [
      { week: 1, ftp: formData.ftp, time: 100 },
      { week: 4, ftp: Math.floor(formData.ftp * 1.03), time: 96 },
      { week: 8, ftp: Math.floor(formData.ftp * 1.07), time: 91 },
      { week: 12, ftp: Math.floor(formData.ftp * 1.12), time: 85 }
    ],
    
    trainingProgram: {
      phase1: [
        { title: "Endurance longue", duration: 180, zone: 2 },
        { title: "Tempo varié", duration: 90, zone: 3 },
        { title: "Sweet Spot", duration: 75, zone: "3-4" },
        { title: "Récupération active", duration: 60, zone: 1 }
      ],
      phase2: [
        { title: "Simulation col - base", duration: 120, zone: "3-4" },
        { title: "Intervalles seuil", duration: 90, zone: 4 },
        { title: "Blocs VO2max", duration: 75, zone: 5 },
        { title: "Récupération", duration: 45, zone: 1 }
      ],
      phase3: [
        { title: "Simulation col - complet", duration: 180, zone: "2-5" },
        { title: "Affûtage haute intensité", duration: 60, zone: "4-5" },
        { title: "Préparation spécifique", duration: 120, zone: "3-4" },
        { title: "Récupération pré-défi", duration: 45, zone: 1 }
      ]
    },
    
    physiologicalImpact: {
      aerobic: 80,
      threshold: 65,
      anaerobic: 35
    },
    
    trainingDistribution: [
      { name: "Z1-Z2", value: 60, color: "#4CAF50" },
      { name: "Z3-Z4", value: 30, color: "#FF9800" },
      { name: "Z5+", value: 10, color: "#F44336" }
    ],
    
    majorChallengeProgress: [
      { name: formData.selectedCol?.name || "Col actuel", currentLevel: 40, improvement: 50, remaining: 10 },
      { name: "Galibier", currentLevel: 30, improvement: 25, remaining: 45 },
      { name: "Tourmalet", currentLevel: 25, improvement: 20, remaining: 55 },
      { name: "Ventoux", currentLevel: 35, improvement: 30, remaining: 35 },
      { name: "Izoard", currentLevel: 20, improvement: 15, remaining: 65 }
    ],
    
    relatedGoals: [
      { 
        title: "Challenge Altitude", 
        description: "10,000m de dénivelé en un mois", 
        color: theme.palette.primary.main 
      },
      { 
        title: "Marathon Alpin", 
        description: "Préparation complémentaire",
        color: theme.palette.secondary.main
      },
      { 
        title: "7 Majeurs - Phase 1", 
        description: "Conquête des 3 premiers cols",
        color: theme.palette.success.main
      }
    ]
  };
};

/**
 * Formate un nombre de minutes en chaîne HH:MM:SS
 * @param {number} totalMinutes - Minutes totales
 * @returns {string} Temps formaté
 */
const formatTimeFromMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.floor((totalMinutes % 1) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Accès aux couleurs du thème pour les éléments statiques
const theme = {
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    success: { main: '#4caf50' }
  }
};

export default SimulationResultsStep;
