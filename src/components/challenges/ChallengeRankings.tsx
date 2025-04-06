import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { Challenge, UserRanking } from '../../types';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';

const apiOrchestrator = new APIOrchestrator();

interface ChallengeRankingsProps {
  challengeId?: string;
}

/**
 * Affiche les classements des utilisateurs pour les défis Seven Majors
 */
const ChallengeRankings: React.FC<ChallengeRankingsProps> = ({ challengeId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(challengeId || '');
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [userRanking, setUserRanking] = useState<UserRanking | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'time' | 'date' | 'kudos'>('time');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const publicChallenges = await apiOrchestrator.getPublicChallenges();
        setChallenges(publicChallenges);
        
        // Si un challenge ID est fourni, utiliser celui-là, sinon prendre le premier
        const initialChallengeId = challengeId || (publicChallenges.length > 0 ? publicChallenges[0].id : '');
        setSelectedChallengeId(initialChallengeId);
      } catch (error) {
        console.error('Erreur lors du chargement des défis:', error);
      }
    };
    
    fetchChallenges();
  }, [challengeId]);
  
  useEffect(() => {
    const fetchRankings = async () => {
      if (!selectedChallengeId) return;
      
      setLoading(true);
      try {
        // Chargement des classements pour le défi sélectionné
        const challengeRankings = await apiOrchestrator.getChallengeRankings(
          selectedChallengeId,
          {
            sortBy,
            limit: 50 // On charge plus que ce qui est affiché pour la pagination côté client
          }
        );
        
        setRankings(challengeRankings);
        
        // Si l'utilisateur est connecté, récupérer son classement particulier
        if (user && user.id) {
          try {
            const userRank = await apiOrchestrator.getUserRankingForChallenge(
              user.id,
              selectedChallengeId
            );
            setUserRanking(userRank);
          } catch (error) {
            // L'utilisateur n'a peut-être pas complété ce défi
            setUserRanking(null);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des classements:', error);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRankings();
  }, [selectedChallengeId, sortBy, user]);
  
  // Fonction pour formater la durée en heures:minutes:secondes
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${remainingSeconds.toString().padStart(2, '0')}s`;
  };
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleChangeChallengeId = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedChallengeId(event.target.value as string);
    setPage(0);
  };
  
  const handleChangeSortBy = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortBy(event.target.value as 'time' | 'date' | 'kudos');
    setPage(0);
  };
  
  // Trouver le challenge sélectionné
  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId);
  
  return (
    <Box sx={{ my: 4, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Classement Communautaire
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          {/* Sélection du défi */}
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="challenge-select-label">Défi</InputLabel>
            <Select
              labelId="challenge-select-label"
              value={selectedChallengeId}
              onChange={handleChangeChallengeId as any}
              label="Défi"
              disabled={loading || challenges.length === 0}
            >
              {challenges.map((challenge) => (
                <MenuItem key={challenge.id} value={challenge.id}>
                  {challenge.name}
                </MenuItem>
              ))}
              {challenges.length === 0 && (
                <MenuItem value="">Aucun défi disponible</MenuItem>
              )}
            </Select>
          </FormControl>
          
          {/* Sélection du tri */}
          <FormControl sx={{ minWidth: 150 }} variant="outlined" size="small">
            <InputLabel id="sort-select-label">Trier par</InputLabel>
            <Select
              labelId="sort-select-label"
              value={sortBy}
              onChange={handleChangeSortBy as any}
              label="Trier par"
              disabled={loading}
            >
              <MenuItem value="time">Temps</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="kudos">Kudos</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* Informations sur le défi */}
        {selectedChallenge && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">{selectedChallenge.name}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {selectedChallenge.cols.length} cols • {selectedChallenge.totalDistance.toFixed(1)} km • 
              {selectedChallenge.totalElevation.toFixed(0)} m D+ • 
              Difficulté: {selectedChallenge.difficulty.toFixed(1)}/10
            </Typography>
          </Box>
        )}
        
        {/* Tableau de classement */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Afficher le classement de l'utilisateur si disponible */}
            {userRanking && (
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  bgcolor: 'primary.light', 
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ mr: 2 }}>
                    Votre position: #{userRanking.rank}
                  </Typography>
                  <Chip 
                    label={formatDuration(userRanking.completionTime)}
                    color="default"
                    size="small"
                    sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}
                  />
                  <Chip 
                    label={`${userRanking.kudos} kudos`}
                    color="default"
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2">
                    Complété le {new Date(userRanking.completionDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Paper>
            )}
            
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="tableau des classements">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '10%' }}>Rang</TableCell>
                    <TableCell sx={{ width: '35%' }}>Cycliste</TableCell>
                    <TableCell sx={{ width: '20%' }}>Temps</TableCell>
                    <TableCell sx={{ width: '15%' }}>Date</TableCell>
                    <TableCell sx={{ width: '10%' }}>Kudos</TableCell>
                    <TableCell sx={{ width: '10%' }}>Badges</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankings.length > 0 ? (
                    rankings
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((ranking) => (
                        <TableRow
                          key={ranking.userId}
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            bgcolor: user && ranking.userId === user.id ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {ranking.rank <= 3 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <MilitaryTechIcon 
                                  sx={{ 
                                    color: ranking.rank === 1 ? 'gold' : ranking.rank === 2 ? 'silver' : '#cd7f32',
                                    mr: 0.5
                                  }} 
                                />
                                {ranking.rank}
                              </Box>
                            ) : (
                              ranking.rank
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                alt={ranking.userName} 
                                src={ranking.userAvatar} 
                                sx={{ width: 32, height: 32, mr: 1 }}
                              />
                              {ranking.userName}
                            </Box>
                          </TableCell>
                          <TableCell>{formatDuration(ranking.completionTime)}</TableCell>
                          <TableCell>{new Date(ranking.completionDate).toLocaleDateString()}</TableCell>
                          <TableCell>{ranking.kudos}</TableCell>
                          <TableCell>
                            {ranking.badges && ranking.badges.length > 0 ? (
                              <Box sx={{ display: 'flex' }}>
                                {ranking.badges.slice(0, 3).map((badge, index) => (
                                  <Avatar 
                                    key={index}
                                    alt={badge.name}
                                    src={badge.imageUrl}
                                    sx={{ 
                                      width: 24, 
                                      height: 24,
                                      ml: index > 0 ? -0.5 : 0,
                                      border: '1px solid #fff'
                                    }}
                                  />
                                ))}
                                {ranking.badges.length > 3 && (
                                  <Chip 
                                    size="small" 
                                    label={`+${ranking.badges.length - 3}`}
                                    sx={{ ml: 0.5, height: 24 }}
                                  />
                                )}
                              </Box>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          Aucun cycliste n'a encore complété ce défi
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {rankings.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={rankings.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
              />
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ChallengeRankings;
