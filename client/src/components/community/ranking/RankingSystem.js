import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Badge,
  Alert,
  Tooltip,
  Grid,
  IconButton,
  useMediaQuery
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import TerrainIcon from '@mui/icons-material/Terrain';
import SpeedIcon from '@mui/icons-material/Speed';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import { useCommunity } from '../../../contexts/CommunityContext';

// Composants stylisés
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const RankBadge = styled(Box)(({ theme, rank }) => {
  const getBadgeColor = () => {
    if (rank === 1) return theme.palette.warning.main; // Or
    if (rank === 2) return '#C0C0C0'; // Argent
    if (rank === 3) return '#CD7F32'; // Bronze
    return theme.palette.grey[500];
  };
  
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: getBadgeColor(),
    color: rank <= 3 ? theme.palette.getContrastText(getBadgeColor()) : theme.palette.common.white,
    fontWeight: 'bold',
  };
});

const FilterSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  boxShadow: theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[6],
    transform: 'translateY(-2px)',
  },
  transition: 'transform 0.2s, box-shadow 0.2s',
}));

// Données mock pour les classements
const seasonCategories = ['Général', 'Route', 'Gravel', 'VTT'];
const timeCategories = ['Saison 2025', 'Mensuel', 'Hebdomadaire'];

// Génération de données de classement de test
const generateMockRankings = () => {
  const users = [
    { id: 'user1', name: 'Marie Dufour', avatar: '/images/profiles/user1.jpg', level: 'Expert', team: 'Team Velo-Altitude' },
    { id: 'user2', name: 'Thomas Laurent', avatar: '/images/profiles/user2.jpg', level: 'Confirmé', team: 'Cyclistes des Vosges' },
    { id: 'user3', name: 'Sophie Moreau', avatar: '/images/profiles/user3.jpg', level: 'Expert', team: 'Team Velo-Altitude' },
    { id: 'user4', name: 'Jean Dupont', avatar: '/images/profiles/user4.jpg', level: 'Débutant', team: null },
    { id: 'user5', name: 'Lucie Bernard', avatar: '/images/profiles/user5.jpg', level: 'Intermédiaire', team: 'Cyclistes des Vosges' },
    { id: 'user6', name: 'Paul Martin', avatar: '/images/profiles/user6.jpg', level: 'Confirmé', team: null },
    { id: 'user7', name: 'Emma Petit', avatar: '/images/profiles/user7.jpg', level: 'Débutant', team: 'Team Velo-Altitude' },
    { id: 'user8', name: 'Nicolas Leroy', avatar: '/images/profiles/user8.jpg', level: 'Intermédiaire', team: null },
    { id: 'user9', name: 'Claire Dubois', avatar: '/images/profiles/user9.jpg', level: 'Confirmé', team: 'Cyclistes des Vosges' },
    { id: 'user10', name: 'Antoine Roux', avatar: '/images/profiles/user10.jpg', level: 'Expert', team: 'Team Velo-Altitude' },
    { id: 'user11', name: 'Emilie Girard', avatar: '/images/profiles/default-avatar.jpg', level: 'Intermédiaire', team: null },
    { id: 'user12', name: 'David Simon', avatar: '/images/profiles/default-avatar.jpg', level: 'Débutant', team: 'Team Velo-Altitude' },
  ];
  
  return users.map((user, index) => ({
    rank: index + 1,
    user,
    points: Math.floor(2000 - (index * 115) + (Math.random() * 50)),
    distance: Math.floor(800 - (index * 45) + (Math.random() * 30)),
    elevation: Math.floor(12000 - (index * 800) + (Math.random() * 500)),
    challenges: Math.floor(15 - (index * 1.2) + (Math.random() * 3)),
    routes: Math.floor(20 - (index * 1.5) + (Math.random() * 4)),
    kudos: Math.floor(120 - (index * 10) + (Math.random() * 20)),
    progress: {
      weekly: Math.floor(Math.random() * 3) - 1, // -1 (down), 0 (same), 1 (up)
      change: Math.floor(Math.random() * 50),
    }
  }));
};

const mockRankingData = generateMockRankings();

// Fonction pour obtenir les icônes de progression
const getProgressIcon = (progress) => {
  if (progress.weekly > 0) return <span style={{ color: 'green' }}>↑{progress.change}</span>;
  if (progress.weekly < 0) return <span style={{ color: 'red' }}>↓{progress.change}</span>;
  return <span style={{ color: 'gray' }}>→ =</span>;
};

const RankingSystem = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loading } = useCommunity();
  
  // États
  const [seasonType, setSeasonType] = useState(0);
  const [timeFrame, setTimeFrame] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [rankings, setRankings] = useState([]);
  
  // Statistiques du classement
  const rankingStats = {
    totalUsers: mockRankingData.length,
    topPoints: mockRankingData[0]?.points || 0,
    averagePoints: Math.floor(mockRankingData.reduce((sum, user) => sum + user.points, 0) / mockRankingData.length),
    totalDistance: mockRankingData.reduce((sum, user) => sum + user.distance, 0),
    totalElevation: mockRankingData.reduce((sum, user) => sum + user.elevation, 0),
  };
  
  // Chargement des données de classement
  useEffect(() => {
    const loadRankings = () => {
      setRankings([]);
      // Simuler un délai de chargement
      setTimeout(() => {
        setRankings(mockRankingData);
      }, 500);
    };
    
    loadRankings();
  }, [seasonType, timeFrame]);
  
  // Filtre des données
  const filteredRankings = rankings.filter(ranking => {
    const matchesSearch = searchTerm === '' ||
      ranking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ranking.user.team && ranking.user.team.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = levelFilter === 'all' || ranking.user.level === levelFilter;
    
    const matchesTeam = teamFilter === 'all' || 
      (teamFilter === 'none' && !ranking.user.team) || 
      (ranking.user.team === teamFilter);
    
    return matchesSearch && matchesLevel && matchesTeam;
  });
  
  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Changement d'onglets
  const handleSeasonTypeChange = (event, newValue) => {
    setSeasonType(newValue);
    setPage(0);
  };
  
  const handleTimeFrameChange = (event, newValue) => {
    setTimeFrame(newValue);
    setPage(0);
  };
  
  // Obtenir les niveaux et équipes uniques pour les filtres
  const levels = ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert'];
  const teams = ['Team Velo-Altitude', 'Cyclistes des Vosges'];
  
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold' }}>
        <EmojiEventsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Classement des cyclistes
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
        Découvrez les meilleures performances de notre communauté
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total participants
              </Typography>
              <Typography variant="h4" component="div">
                {rankingStats.totalUsers}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                cyclistes classés
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Meilleur score
              </Typography>
              <Typography variant="h4" component="div">
                {rankingStats.topPoints}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                points
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Distance totale
              </Typography>
              <Typography variant="h4" component="div">
                {rankingStats.totalDistance}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                kilomètres
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Dénivelé total
              </Typography>
              <Typography variant="h4" component="div">
                {rankingStats.totalElevation}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                mètres
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={seasonType}
            onChange={handleSeasonTypeChange}
            aria-label="season type tabs"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
          >
            {seasonCategories.map((category, index) => (
              <Tab key={index} label={category} />
            ))}
          </Tabs>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={timeFrame}
            onChange={handleTimeFrameChange}
            aria-label="time frame tabs"
          >
            {timeCategories.map((category, index) => (
              <Tab key={index} label={category} />
            ))}
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <FilterSection>
            <TextField
              placeholder="Rechercher un cycliste ou une équipe..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Niveau</InputLabel>
              <Select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                label="Niveau"
              >
                <MenuItem value="all">Tous les niveaux</MenuItem>
                {levels.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Équipe</InputLabel>
              <Select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                label="Équipe"
              >
                <MenuItem value="all">Toutes les équipes</MenuItem>
                <MenuItem value="none">Sans équipe</MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team} value={team}>{team}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </FilterSection>
          
          {rankings.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredRankings.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              Aucun cycliste ne correspond à votre recherche
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="classement des cyclistes">
                  <TableHead>
                    <TableRow>
                      <TableCell width={60} align="center">Rang</TableCell>
                      <TableCell>Cycliste</TableCell>
                      <TableCell align="center">Points</TableCell>
                      <TableCell align="center">Distance</TableCell>
                      <TableCell align="center">Dénivelé</TableCell>
                      <TableCell align="center">Défis</TableCell>
                      <TableCell align="center">Routes</TableCell>
                      <TableCell align="center">Évolution</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRankings
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((ranking) => (
                        <StyledTableRow key={ranking.user.id} hover>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <RankBadge rank={ranking.rank}>
                                {ranking.rank}
                              </RankBadge>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar
                                src={ranking.user.avatar}
                                alt={ranking.user.name}
                                sx={{ width: 40, height: 40, mr: 2 }}
                              />
                              <Box>
                                <Typography component={Link} to={`/community/users/${ranking.user.id}`} sx={{ 
                                  textDecoration: 'none', 
                                  color: 'primary.main',
                                  fontWeight: 'medium',
                                  '&:hover': { textDecoration: 'underline' }
                                }}>
                                  {ranking.user.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <Chip
                                    label={ranking.user.level}
                                    size="small"
                                    color={
                                      ranking.user.level === 'Expert' ? 'error' :
                                      ranking.user.level === 'Confirmé' ? 'warning' :
                                      ranking.user.level === 'Intermédiaire' ? 'info' :
                                      'success'
                                    }
                                    variant="outlined"
                                    sx={{ mr: 1 }}
                                  />
                                  {ranking.user.team && (
                                    <Typography variant="caption" color="textSecondary">
                                      {ranking.user.team}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body1" fontWeight="bold">
                              {ranking.points}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <DirectionsBikeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography>{ranking.distance} km</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TerrainIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography>{ranking.elevation} m</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">{ranking.challenges}</TableCell>
                          <TableCell align="center">{ranking.routes}</TableCell>
                          <TableCell align="center">
                            <Typography>
                              {getProgressIcon(ranking.progress)}
                            </Typography>
                          </TableCell>
                        </StyledTableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredRankings.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Lignes par page"
              />
            </>
          )}
        </Box>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            Le classement est mis à jour quotidiennement. Les points sont attribués en fonction de la distance parcourue, du dénivelé, des défis relevés et des contributions à la communauté.
          </Typography>
        </Alert>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Comment fonctionne le système de points ?
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Distance
              </Typography>
              <Typography variant="body2">
                1 point par kilomètre parcouru
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Dénivelé
              </Typography>
              <Typography variant="body2">
                10 points par 100m de dénivelé positif
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Défis
              </Typography>
              <Typography variant="body2">
                50-200 points par défi complété
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Contributions
              </Typography>
              <Typography variant="body2">
                20 points par itinéraire partagé
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default RankingSystem;
