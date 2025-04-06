import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Challenge, Certification, UserRanking } from '../../types';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';
import { useAuth } from '../../hooks/useAuth';

const apiOrchestrator = new APIOrchestrator();

interface ChallengeStatisticsProps {
  challengeId?: string;
  userId?: string;
}

interface StatsPeriod {
  id: string;
  label: string;
  value: number;
}

const ChallengeStatistics: React.FC<ChallengeStatisticsProps> = ({ 
  challengeId, 
  userId 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [userCertification, setUserCertification] = useState<Certification | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [completionStats, setCompletionStats] = useState<StatsPeriod[]>([]);
  const [performanceStats, setPerformanceStats] = useState<any[]>([]);
  const [difficultyDistribution, setDifficultyDistribution] = useState<any[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(challengeId || '');

  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    // Si un challengeId est fourni, l'utiliser, sinon utiliser celui sélectionné
    const currentChallengeId = challengeId || selectedChallengeId;
    
    const fetchStatisticsData = async () => {
      if (!currentChallengeId && !userId) {
        // Si aucun défi ni utilisateur n'est spécifié, charger la liste des défis
        await loadAvailableChallenges();
        return;
      }
      
      setLoading(true);
      
      try {
        // Récupération des données générales
        let challengeData;
        let certificationsData: Certification[] = [];
        let rankingsData: UserRanking[] = [];
        let userCert = null;
        
        // Charger le défi si un ID est spécifié
        if (currentChallengeId) {
          challengeData = await apiOrchestrator.getChallengeById(currentChallengeId);
          setChallenge(challengeData);
          
          // Charger les certifications pour ce défi
          certificationsData = await apiOrchestrator.getChallengeCertifications(currentChallengeId);
          setCertifications(certificationsData);
          
          // Charger les classements
          rankingsData = await apiOrchestrator.getChallengeRankings(currentChallengeId, { limit: 100 });
          setRankings(rankingsData);
        }
        
        // Si un utilisateur est spécifié ou si l'utilisateur courant est connecté
        const currentUserId = userId || (user && user.id);
        if (currentUserId && currentChallengeId) {
          // Tenter de récupérer la certification de l'utilisateur pour ce défi
          try {
            const userCertifications = await apiOrchestrator.getUserCertifications(currentUserId);
            userCert = userCertifications.find(cert => cert.challengeId === currentChallengeId) || null;
            setUserCertification(userCert);
          } catch (error) {
            console.error('Erreur lors de la récupération des certifications de l\'utilisateur:', error);
          }
        }
        
        // Générer les statistiques basées sur les données récupérées
        generateStatistics(certificationsData, rankingsData, userCert);
      } catch (error) {
        console.error('Erreur lors du chargement des données statistiques:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatisticsData();
  }, [challengeId, userId, user, selectedChallengeId]);
  
  // Chargement de la liste des défis disponibles
  const loadAvailableChallenges = async () => {
    try {
      const publicChallenges = await apiOrchestrator.getPublicChallenges();
      setAvailableChallenges(publicChallenges);
      
      // Si des défis sont disponibles et qu'aucun n'est sélectionné, sélectionner le premier
      if (publicChallenges.length > 0 && !selectedChallengeId) {
        setSelectedChallengeId(publicChallenges[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des défis disponibles:', error);
    }
  };
  
  // Génération des statistiques à partir des données récupérées
  const generateStatistics = (
    certifications: Certification[], 
    rankings: UserRanking[],
    userCertification: Certification | null
  ) => {
    // 1. Statistiques de complétion par période
    const completionByPeriod = generateCompletionByPeriod(certifications);
    setCompletionStats(completionByPeriod);
    
    // 2. Statistiques de performance
    const performanceData = generatePerformanceStats(rankings);
    setPerformanceStats(performanceData);
    
    // 3. Distribution des difficultés
    const difficultyData = generateDifficultyDistribution(certifications);
    setDifficultyDistribution(difficultyData);
  };
  
  // Génération des statistiques de complétion par période (mois, trimestre, année)
  const generateCompletionByPeriod = (certifications: Certification[]): StatsPeriod[] => {
    // Ne conserver que les certifications vérifiées
    const verifiedCertifications = certifications.filter(cert => cert.status === 'verified');
    
    // Obtenir les dates de complétion
    const completionDates = verifiedCertifications.map(cert => new Date(cert.completionDate));
    
    // Générer les périodes en fonction de la sélection (mois, trimestre, année)
    const periods: { [key: string]: number } = {};
    
    switch (selectedPeriod) {
      case 'month':
        // Grouper par mois
        completionDates.forEach(date => {
          const periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          periods[periodKey] = (periods[periodKey] || 0) + 1;
        });
        break;
      
      case 'quarter':
        // Grouper par trimestre
        completionDates.forEach(date => {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          const periodKey = `${date.getFullYear()}-Q${quarter}`;
          periods[periodKey] = (periods[periodKey] || 0) + 1;
        });
        break;
      
      case 'year':
      default:
        // Grouper par année
        completionDates.forEach(date => {
          const periodKey = date.getFullYear().toString();
          periods[periodKey] = (periods[periodKey] || 0) + 1;
        });
        break;
    }
    
    // Convertir en tableau pour les graphiques
    return Object.entries(periods).map(([key, value]) => ({
      id: key,
      label: key,
      value
    }));
  };
  
  // Génération des statistiques de performance
  const generatePerformanceStats = (rankings: UserRanking[]): any[] => {
    // Trier les classements par temps de complétion
    const sortedRankings = [...rankings].sort((a, b) => {
      if (!a.completionTime) return 1;
      if (!b.completionTime) return -1;
      return a.completionTime - b.completionTime;
    });
    
    // Prendre les 20 premiers pour le graphique
    const top20 = sortedRankings.slice(0, 20);
    
    // Formater pour le graphique
    return top20.map(ranking => ({
      name: ranking.userName,
      time: ranking.completionTime ? Math.round(ranking.completionTime / 60) : 0, // Convertir en minutes
      kudos: ranking.kudos
    }));
  };
  
  // Génération de la distribution des difficultés
  const generateDifficultyDistribution = (certifications: Certification[]): any[] => {
    // Calculer le temps moyen de complétion
    const completionTimes = certifications
      .filter(cert => cert.status === 'verified' && cert.completionTime)
      .map(cert => cert.completionTime as number);
    
    if (completionTimes.length === 0) return [];
    
    // Calculer les quartiles
    const sortedTimes = [...completionTimes].sort((a, b) => a - b);
    const quartileSize = sortedTimes.length / 4;
    
    const quartiles = [
      {
        name: 'Rapide',
        value: sortedTimes.slice(0, Math.ceil(quartileSize)).length,
        fill: '#00C49F'
      },
      {
        name: 'Moyen-rapide',
        value: sortedTimes.slice(Math.ceil(quartileSize), Math.ceil(quartileSize * 2)).length,
        fill: '#0088FE'
      },
      {
        name: 'Moyen-lent',
        value: sortedTimes.slice(Math.ceil(quartileSize * 2), Math.ceil(quartileSize * 3)).length,
        fill: '#FFBB28'
      },
      {
        name: 'Lent',
        value: sortedTimes.slice(Math.ceil(quartileSize * 3)).length,
        fill: '#FF8042'
      }
    ];
    
    return quartiles;
  };
  
  // Gestion du changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Gestion du changement de période
  const handlePeriodChange = (event: SelectChangeEvent) => {
    setSelectedPeriod(event.target.value);
    
    // Régénérer les statistiques avec la nouvelle période
    if (certifications.length > 0) {
      const completionByPeriod = generateCompletionByPeriod(certifications);
      setCompletionStats(completionByPeriod);
    }
  };
  
  // Gestion du changement de défi sélectionné
  const handleChallengeChange = (event: SelectChangeEvent) => {
    setSelectedChallengeId(event.target.value);
  };
  
  // Formater la durée en heures et minutes
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };
  
  // Si aucun défi n'est sélectionné, afficher le sélecteur de défi
  if (!challenge && !loading && availableChallenges.length > 0) {
    return (
      <Box sx={{ py: 4, px: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Statistiques des défis
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel id="challenge-select-label">Sélectionner un défi</InputLabel>
          <Select
            labelId="challenge-select-label"
            value={selectedChallengeId}
            label="Sélectionner un défi"
            onChange={handleChallengeChange}
          >
            {availableChallenges.map(challenge => (
              <MenuItem key={challenge.id} value={challenge.id}>
                {challenge.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!challenge) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Défi introuvable. Veuillez sélectionner un défi valide.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Statistiques - {challenge.name}
      </Typography>
      
      {/* Sélecteur de défi pour changer de vue */}
      {availableChallenges.length > 0 && (
        <FormControl sx={{ minWidth: 300, mb: 4 }}>
          <InputLabel id="challenge-select-label">Défi</InputLabel>
          <Select
            labelId="challenge-select-label"
            value={selectedChallengeId}
            label="Défi"
            onChange={handleChallengeChange}
          >
            {availableChallenges.map(challenge => (
              <MenuItem key={challenge.id} value={challenge.id}>
                {challenge.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      {/* Résumé des statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Temps moyen
              </Typography>
              <Typography variant="h4" color="primary">
                {formatDuration(
                  certifications
                    .filter(cert => cert.status === 'verified' && cert.completionTime)
                    .reduce((sum, cert) => sum + (cert.completionTime || 0), 0) / 
                    certifications.filter(cert => cert.status === 'verified' && cert.completionTime).length || 0
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cyclistes
              </Typography>
              <Typography variant="h4" color="primary">
                {certifications.filter(cert => cert.status === 'verified').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Meilleur temps
              </Typography>
              <Typography variant="h4" color="primary">
                {formatDuration(
                  Math.min(
                    ...certifications
                      .filter(cert => cert.status === 'verified' && cert.completionTime)
                      .map(cert => cert.completionTime || Infinity)
                  )
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total kudos
              </Typography>
              <Typography variant="h4" color="primary">
                {certifications
                  .filter(cert => cert.status === 'verified')
                  .reduce((sum, cert) => sum + cert.kudos, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Onglets pour les différentes vues statistiques */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Performances" />
          <Tab label="Évolution temporelle" />
          <Tab label="Distribution" />
          <Tab label="Classement" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Onglet Performances */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Temps de complétion par utilisateur
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceStats}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: 'Temps (minutes)', position: 'insideBottom', offset: -5 }} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip formatter={(value) => [`${value} minutes`, 'Temps']} />
                    <Legend />
                    <Bar dataKey="time" fill="#0088FE" name="Temps (minutes)" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              
              {userCertification && userCertification.completionTime && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
                  <Typography variant="h6">
                    Votre performance
                  </Typography>
                  <Typography variant="body1">
                    Temps: {formatDuration(userCertification.completionTime)}
                    {rankings.length > 0 && (
                      ` (${
                        rankings.findIndex(r => r.userId === (userId || (user && user.id))) + 1
                      }/${rankings.length} - Top ${
                        Math.round(((rankings.findIndex(r => r.userId === (userId || (user && user.id))) + 1) / rankings.length) * 100)
                      }%)`
                    )}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          
          {/* Onglet Évolution temporelle */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Évolution des complétions
                </Typography>
                
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel id="period-select-label">Période</InputLabel>
                  <Select
                    labelId="period-select-label"
                    value={selectedPeriod}
                    label="Période"
                    onChange={handlePeriodChange}
                    size="small"
                  >
                    <MenuItem value="month">Par mois</MenuItem>
                    <MenuItem value="quarter">Par trimestre</MenuItem>
                    <MenuItem value="year">Par année</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={completionStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Nombre de complétions" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}
          
          {/* Onglet Distribution */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Distribution des temps de complétion
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {difficultyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} cyclistes`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}
          
          {/* Onglet Classement */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Classement des cyclistes
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rang</TableCell>
                      <TableCell>Cycliste</TableCell>
                      <TableCell>Temps</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Kudos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rankings.slice(0, 20).map((ranking, index) => (
                      <TableRow 
                        key={ranking.userId}
                        sx={{ 
                          bgcolor: 
                            (userId && ranking.userId === userId) || 
                            (!userId && user && ranking.userId === user.id)
                              ? 'rgba(0, 136, 254, 0.1)'
                              : 'inherit'
                        }}
                      >
                        <TableCell>{ranking.rank}</TableCell>
                        <TableCell>{ranking.userName}</TableCell>
                        <TableCell>{formatDuration(ranking.completionTime)}</TableCell>
                        <TableCell>{new Date(ranking.completionDate).toLocaleDateString()}</TableCell>
                        <TableCell>{ranking.kudos}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ChallengeStatistics;
