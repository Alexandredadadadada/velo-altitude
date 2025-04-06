import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Button, 
  Container, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Chip, 
  CircularProgress,
  IconButton,
  Dialog,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TerrainIcon from '@mui/icons-material/Terrain';
import RouteIcon from '@mui/icons-material/Route';
import PeopleIcon from '@mui/icons-material/People';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useRouter } from 'next/router';
import { APIOrchestrator } from '../api/orchestration';
import ChallengeCreator from '../components/cols/ChallengeCreator';
import { Challenge } from '../types';

// Mock des données utilisateur en attendant l'authentification
const mockUser = {
  id: 'user-123',
  firstname: 'Thomas',
  lastname: 'Voeckler'
};

const SevenMajors: React.FC = () => {
  const router = useRouter();
  const apiOrchestrator = new APIOrchestrator();
  
  // État
  const [tabValue, setTabValue] = useState(0);
  const [publicChallenges, setPublicChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [editChallenge, setEditChallenge] = useState<Challenge | null>(null);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState<{ open: boolean, challengeId: string | null }>({
    open: false,
    challengeId: null
  });
  
  // Charger les défis au montage du composant
  useEffect(() => {
    loadChallenges();
  }, []);
  
  // Charger les défis publics et ceux de l'utilisateur
  const loadChallenges = async () => {
    setLoading(true);
    try {
      // Charger les défis publics
      const publicChallenges = await apiOrchestrator.getPublicChallenges();
      setPublicChallenges(publicChallenges);
      
      // Charger les défis de l'utilisateur
      const userChallenges = await apiOrchestrator.getUserChallenges(mockUser.id);
      setUserChallenges(userChallenges);
    } catch (err) {
      setError(err as Error);
      console.error('Erreur lors du chargement des défis:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Créer un nouveau défi
  const handleCreateChallenge = () => {
    setCreateMode(true);
    setEditChallenge(null);
  };
  
  // Éditer un défi existant
  const handleEditChallenge = (challenge: Challenge) => {
    setEditChallenge(challenge);
    setCreateMode(true);
  };
  
  // Confirmer la suppression d'un défi
  const handleConfirmDelete = (challengeId: string) => {
    setConfirmDeleteDialog({
      open: true,
      challengeId
    });
  };
  
  // Supprimer un défi
  const handleDeleteChallenge = async () => {
    if (!confirmDeleteDialog.challengeId) return;
    
    try {
      await apiOrchestrator.colsService.deleteChallenge(confirmDeleteDialog.challengeId);
      
      // Mettre à jour la liste des défis
      setUserChallenges(prevChallenges => 
        prevChallenges.filter(challenge => challenge.id !== confirmDeleteDialog.challengeId)
      );
      
      // Si le défi était public, mettre à jour aussi la liste des défis publics
      setPublicChallenges(prevChallenges => 
        prevChallenges.filter(challenge => challenge.id !== confirmDeleteDialog.challengeId)
      );
    } catch (err) {
      console.error('Erreur lors de la suppression du défi:', err);
    } finally {
      setConfirmDeleteDialog({ open: false, challengeId: null });
    }
  };
  
  // Exporter un défi en GPX
  const handleExportGpx = async (challengeId: string) => {
    try {
      const challenge = [...publicChallenges, ...userChallenges].find(c => c.id === challengeId);
      if (!challenge) return;
      
      const gpxUrl = await apiOrchestrator.generateGpxForChallenge(challengeId);
      
      // Créer un lien et simuler un clic pour télécharger le fichier
      const a = document.createElement('a');
      a.href = gpxUrl;
      a.download = `${challenge.name.replace(/\s+/g, '_')}.gpx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erreur lors de l\'export GPX:', err);
    }
  };
  
  // Gérer l'enregistrement d'un défi (nouveau ou modifié)
  const handleSaveChallenge = (challenge: Challenge) => {
    // Mettre à jour la liste des défis
    if (editChallenge) {
      // Mise à jour d'un défi existant
      setUserChallenges(prevChallenges => 
        prevChallenges.map(c => c.id === challenge.id ? challenge : c)
      );
      
      // Si le défi est public, mettre à jour aussi la liste des défis publics
      if (challenge.isPublic) {
        setPublicChallenges(prevChallenges => {
          const exists = prevChallenges.some(c => c.id === challenge.id);
          if (exists) {
            return prevChallenges.map(c => c.id === challenge.id ? challenge : c);
          } else {
            return [...prevChallenges, challenge];
          }
        });
      } else {
        // Si le défi n'est plus public, le retirer de la liste des défis publics
        setPublicChallenges(prevChallenges => 
          prevChallenges.filter(c => c.id !== challenge.id)
        );
      }
    } else {
      // Nouveau défi
      setUserChallenges(prevChallenges => [...prevChallenges, challenge]);
      
      // Si le défi est public, l'ajouter à la liste des défis publics
      if (challenge.isPublic) {
        setPublicChallenges(prevChallenges => [...prevChallenges, challenge]);
      }
    }
    
    // Fermer le formulaire
    setCreateMode(false);
    setEditChallenge(null);
  };
  
  // Annuler la création/édition d'un défi
  const handleCancelChallenge = () => {
    setCreateMode(false);
    setEditChallenge(null);
  };
  
  // Formatage de la difficulté pour l'affichage
  const getDifficultyLabel = (score: number) => {
    if (score < 30) return { label: 'Facile', color: 'success' };
    if (score < 60) return { label: 'Modéré', color: 'info' };
    if (score < 90) return { label: 'Difficile', color: 'warning' };
    return { label: 'Extrême', color: 'error' };
  };
  
  // Afficher la liste des défis
  const renderChallengesList = (challenges: Challenge[], isUserChallenges = false) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box p={4}>
          <Typography color="error">
            Erreur lors du chargement des défis: {error.message}
          </Typography>
        </Box>
      );
    }
    
    if (challenges.length === 0) {
      return (
        <Box p={4} textAlign="center">
          <Typography variant="h6" color="text.secondary">
            {isUserChallenges 
              ? 'Vous n\'avez pas encore créé de défi. Cliquez sur "Créer un défi" pour commencer.'
              : 'Aucun défi public n\'est disponible pour le moment.'}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {challenges.map(challenge => (
          <Grid item xs={12} sm={6} md={4} key={challenge.id}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="160"
                image={challenge.imageUrl || '/images/default-challenge.jpg'}
                alt={challenge.name}
              />
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {challenge.name}
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <Chip 
                    label={getDifficultyLabel(challenge.difficulty).label}
                    color={getDifficultyLabel(challenge.difficulty).color as any}
                    size="small"
                  />
                  
                  {challenge.completedBy && (
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${challenge.completedBy} cyclistes`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {challenge.description.length > 120
                    ? `${challenge.description.substring(0, 120)}...`
                    : challenge.description}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center">
                    <TerrainIcon sx={{ fontSize: '1rem', mr: 0.5, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {Math.round(challenge.totalElevation)} m
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <RouteIcon sx={{ fontSize: '1rem', mr: 0.5, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {Math.round(challenge.totalDistance)} km
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2">
                  {challenge.cols.length} cols
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<FileDownloadIcon />}
                  onClick={() => handleExportGpx(challenge.id)}
                >
                  GPX
                </Button>
                
                {isUserChallenges && (
                  <>
                    <Box flexGrow={1} />
                    
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditChallenge(challenge)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleConfirmDelete(challenge.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Si le mode création/édition est actif, afficher le formulaire
  if (createMode) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Button onClick={handleCancelChallenge}>
            Retour à la liste des défis
          </Button>
        </Box>
        
        <Typography variant="h4" gutterBottom>
          {editChallenge ? 'Modifier le défi' : 'Créer un nouveau défi'}
        </Typography>
        
        <ChallengeCreator
          userId={mockUser.id}
          challenge={editChallenge || undefined}
          onSave={handleSaveChallenge}
          onCancel={handleCancelChallenge}
        />
      </Container>
    );
  }
  
  // Sinon, afficher la liste des défis
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Les 7 Majeurs
        </Typography>
        
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Créez votre propre défi en sélectionnant 7 cols prestigieux
        </Typography>
        
        <Typography variant="body1" paragraph>
          Le concept des "7 Majeurs" vous permet de composer votre défi personnel en sélectionnant
          7 cols parmi notre catalogue complet. Visualisez les statistiques, comparez les difficultés,
          et partagez vos défis avec la communauté Velo-Altitude.
        </Typography>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Défis publics" />
            <Tab label="Mes défis" />
          </Tabs>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateChallenge}
          >
            Créer un défi
          </Button>
        </Box>
      </Box>
      
      <Box>
        {tabValue === 0 && renderChallengesList(publicChallenges)}
        {tabValue === 1 && renderChallengesList(userChallenges, true)}
      </Box>
      
      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={confirmDeleteDialog.open}
        onClose={() => setConfirmDeleteDialog({ open: false, challengeId: null })}
      >
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            Confirmer la suppression
          </Typography>
          
          <Typography variant="body1" paragraph>
            Êtes-vous sûr de vouloir supprimer ce défi ? Cette action est irréversible.
          </Typography>
          
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button 
              onClick={() => setConfirmDeleteDialog({ open: false, challengeId: null })}
              variant="outlined"
            >
              Annuler
            </Button>
            
            <Button 
              onClick={handleDeleteChallenge}
              variant="contained"
              color="error"
            >
              Supprimer
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
};

export default SevenMajors;
