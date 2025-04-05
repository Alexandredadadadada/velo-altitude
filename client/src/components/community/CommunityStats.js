import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  useTheme
} from '@mui/material';
import {
  PedalBike,
  Terrain,
  EmojiEvents,
  Group,
  Timeline,
  TrendingUp,
  Public,
  Star
} from '@mui/icons-material';
import { 
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Enregistrement des composants ChartJS
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

// Données fictives pour la démo
const demoData = {
  totals: {
    members: 2487,
    colsClimbed: 14328,
    challengesCompleted: 842,
    kilometersRidden: 1235478,
    elevationGained: 18754320
  },
  leaderboards: {
    mostColsClimbed: [
      { id: 1, name: "Thomas L.", avatar: "/images/avatars/user1.jpg", count: 187 },
      { id: 2, name: "Sophie M.", avatar: "/images/avatars/user2.jpg", count: 156 },
      { id: 3, name: "Jean D.", avatar: "/images/avatars/user3.jpg", count: 134 },
      { id: 4, name: "Marie F.", avatar: "/images/avatars/user4.jpg", count: 129 },
      { id: 5, name: "Pierre N.", avatar: "/images/avatars/user5.jpg", count: 113 }
    ],
    mostElevation: [
      { id: 3, name: "Jean D.", avatar: "/images/avatars/user3.jpg", elevation: 287500 },
      { id: 1, name: "Thomas L.", avatar: "/images/avatars/user1.jpg", elevation: 254300 },
      { id: 6, name: "Claire B.", avatar: "/images/avatars/user6.jpg", elevation: 231800 },
      { id: 2, name: "Sophie M.", avatar: "/images/avatars/user2.jpg", elevation: 215400 },
      { id: 7, name: "Michel R.", avatar: "/images/avatars/user7.jpg", elevation: 198750 }
    ],
    challengeCompletions: [
      { id: 8, name: "Luc V.", avatar: "/images/avatars/user8.jpg", completed: 12 },
      { id: 6, name: "Claire B.", avatar: "/images/avatars/user6.jpg", completed: 9 },
      { id: 9, name: "Émilie T.", avatar: "/images/avatars/user9.jpg", completed: 8 },
      { id: 2, name: "Sophie M.", avatar: "/images/avatars/user2.jpg", completed: 7 },
      { id: 7, name: "Michel R.", avatar: "/images/avatars/user7.jpg", completed: 6 }
    ]
  },
  regionActivity: {
    labels: ['Alpes', 'Pyrénées', 'Vosges', 'Jura', 'Massif Central', 'Corse'],
    data: [5842, 3726, 1814, 1578, 942, 426]
  },
  monthlyActivity: {
    labels: ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
    data: [420, 580, 1200, 1800, 2400, 3100, 3800, 3600, 2900, 1700, 900, 500]
  },
  colDifficultyDistribution: {
    labels: ['Facile', 'Modéré', 'Difficile', 'Très difficile', 'Extrême'],
    data: [2876, 4982, 3854, 1892, 724]
  }
};

/**
 * Composant affichant les statistiques de la communauté cycliste
 */
const CommunityStats = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Simuler le chargement des données
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(demoData);
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Options de graphique pour les régions
  const regionChartOptions = {
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return ` ${context.label}: ${context.raw} ascensions`;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  // Options de graphique pour l'activité mensuelle
  const monthlyActivityOptions = {
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return ` ${context.raw} cols gravis`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre d\'ascensions'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Mois'
        }
      }
    },
    maintainAspectRatio: false
  };

  // Données pour le graphique des régions
  const regionChartData = {
    labels: stats?.regionActivity.labels || [],
    datasets: [
      {
        data: stats?.regionActivity.data || [],
        backgroundColor: [
          '#4CAF50',
          '#2196F3',
          '#FFC107',
          '#9C27B0',
          '#FF5722',
          '#607D8B'
        ],
        borderWidth: 1
      }
    ]
  };

  // Données pour le graphique d'activité mensuelle
  const monthlyActivityData = {
    labels: stats?.monthlyActivity.labels || [],
    datasets: [
      {
        label: 'Activité mensuelle',
        data: stats?.monthlyActivity.data || [],
        backgroundColor: 'rgba(33, 150, 243, 0.6)',
        borderColor: '#2196F3',
        borderWidth: 1
      }
    ]
  };

  // Données pour le graphique de distribution des difficultés
  const difficultyChartData = {
    labels: stats?.colDifficultyDistribution.labels || [],
    datasets: [
      {
        label: 'Distribution par difficulté',
        data: stats?.colDifficultyDistribution.data || [],
        backgroundColor: [
          'rgba(76, 175, 80, 0.7)',
          'rgba(255, 193, 7, 0.7)',
          'rgba(255, 152, 0, 0.7)',
          'rgba(244, 67, 54, 0.7)',
          'rgba(156, 39, 176, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Options pour le graphique de difficulté
  const difficultyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      }
    },
    maintainAspectRatio: false
  };

  // Convertir en format lisible par l'homme
  const formatNumber = (number) => {
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    } else if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}k`;
    }
    return number.toString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Chargement des statistiques...
        </Typography>
      </Box>
    );
  }

  return (
    <Box py={3}>
      {/* En-tête */}
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Statistiques de la Communauté
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Découvrez les performances et les exploits de la communauté cycliste Grand Est.
      </Typography>
      <Divider sx={{ my: 3 }} />

      {/* Statistiques globales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              color: 'white'
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Group fontSize="large" />
              <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                {formatNumber(stats.totals.members)}
              </Typography>
              <Typography variant="body2">Membres</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
              color: 'white'
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Terrain fontSize="large" />
              <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                {formatNumber(stats.totals.colsClimbed)}
              </Typography>
              <Typography variant="body2">Cols gravis</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #FF9800, #F57C00)',
              color: 'white'
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents fontSize="large" />
              <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                {formatNumber(stats.totals.challengesCompleted)}
              </Typography>
              <Typography variant="body2">Défis complétés</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
              color: 'white'
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <PedalBike fontSize="large" />
              <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                {formatNumber(stats.totals.kilometersRidden)}
              </Typography>
              <Typography variant="body2">Kilomètres parcourus</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)',
              color: 'white'
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp fontSize="large" />
              <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                {formatNumber(stats.totals.elevationGained)}
              </Typography>
              <Typography variant="body2">Mètres de dénivelé</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphiques et classements */}
      <Grid container spacing={4}>
        {/* Distribution des cols par région */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Public color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Distribution par région</Typography>
            </Box>
            <Box height={300}>
              <Pie data={regionChartData} options={regionChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Activité mensuelle */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Timeline color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Activité mensuelle</Typography>
            </Box>
            <Box height={300}>
              <Bar data={monthlyActivityData} options={monthlyActivityOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Distribution par difficulté */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Terrain color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Distribution par difficulté</Typography>
            </Box>
            <Box height={300}>
              <Pie data={difficultyChartData} options={difficultyChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Classements */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Star color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Classements</Typography>
            </Box>
            
            <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1 }}>
              Top grimpeurs (nombre de cols)
            </Typography>
            <List disablePadding>
              {stats.leaderboards.mostColsClimbed.map((user, index) => (
                <ListItem key={user.id} disablePadding sx={{ py: 1 }}>
                  <Chip 
                    size="small" 
                    label={`#${index + 1}`} 
                    color={index === 0 ? "primary" : "default"}
                    sx={{ mr: 1, minWidth: 40 }}
                  />
                  <ListItemAvatar>
                    <Avatar src={user.avatar} alt={user.name} />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={user.name} 
                    secondary={`${user.count} cols`}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1 }}>
              Top dénivelé cumulé
            </Typography>
            <List disablePadding>
              {stats.leaderboards.mostElevation.map((user, index) => (
                <ListItem key={user.id} disablePadding sx={{ py: 1 }}>
                  <Chip 
                    size="small" 
                    label={`#${index + 1}`} 
                    color={index === 0 ? "primary" : "default"}
                    sx={{ mr: 1, minWidth: 40 }}
                  />
                  <ListItemAvatar>
                    <Avatar src={user.avatar} alt={user.name} />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={user.name} 
                    secondary={`${formatNumber(user.elevation)} m`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CommunityStats;
