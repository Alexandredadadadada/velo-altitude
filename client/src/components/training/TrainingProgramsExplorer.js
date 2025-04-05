import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  CardMedia, 
  Button, 
  Tabs, 
  Tab, 
  TextField, 
  InputAdornment, 
  Chip, 
  Divider, 
  useTheme, 
  useMediaQuery, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions 
} from '@mui/material';
import { 
  Search as SearchIcon, 
  AccessTime as TimeIcon, 
  FitnessCenter as FitnessIcon, 
  Trending as TrendingIcon, 
  People as PeopleIcon 
} from '@mui/icons-material';

// Import de l'index des programmes
import trainingPrograms from '../../data/trainingProgramsIndex';

/**
 * Composant d'exploration des programmes d'entraînement
 * Permet de parcourir, filtrer et accéder à tous les programmes disponibles
 */
const TrainingProgramsExplorer = ({ onProgramSelect, userProfile }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // État pour gérer les programmes affichés
  const [displayedPrograms, setDisplayedPrograms] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Charger tous les programmes au démarrage
  useEffect(() => {
    setDisplayedPrograms(trainingPrograms.allPrograms);
  }, []);
  
  // Filtrer les programmes en fonction de la catégorie et de la recherche
  useEffect(() => {
    let filteredPrograms = [];
    
    // Filtrer par catégorie
    if (selectedCategory === 'all') {
      filteredPrograms = [...trainingPrograms.allPrograms];
    } else if (selectedCategory === 'recommended') {
      filteredPrograms = trainingPrograms.recommend(userProfile || {}, 10);
    } else {
      // Vérifier si la catégorie est dans les catégories principales
      if (trainingPrograms.categories[selectedCategory]) {
        filteredPrograms = [...trainingPrograms.categories[selectedCategory].programs];
      } 
      // Sinon vérifier si c'est dans les objectifs
      else if (trainingPrograms.objectives[selectedCategory]) {
        filteredPrograms = [...trainingPrograms.objectives[selectedCategory].programs];
      }
    }
    
    // Filtrer par recherche si nécessaire
    if (searchQuery.trim() !== '') {
      filteredPrograms = trainingPrograms.search(searchQuery);
    }
    
    setDisplayedPrograms(filteredPrograms);
  }, [selectedCategory, searchQuery, userProfile]);
  
  // Gestionnaires d'événements
  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const handleProgramSelect = (program) => {
    if (onProgramSelect) {
      onProgramSelect(program);
    } else {
      setSelectedProgram(program);
      setDetailDialogOpen(true);
    }
  };
  
  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
  };
  
  // Rendu du composant de niveau de difficulté
  const renderLevelChip = (level) => {
    let color = 'primary';
    
    if (level.toLowerCase().includes('débutant')) {
      color = 'success';
    } else if (level.toLowerCase().includes('intermédiaire')) {
      color = 'info';
    } else if (level.toLowerCase().includes('avancé')) {
      color = 'warning';
    } else if (level.toLowerCase().includes('expert') || level.toLowerCase().includes('élite')) {
      color = 'error';
    }
    
    return (
      <Chip 
        label={level} 
        color={color} 
        size="small" 
        icon={<FitnessIcon />} 
        sx={{ mr: 1, mb: 1 }}
      />
    );
  };
  
  // Rendu d'une carte de programme
  const renderProgramCard = (program) => {
    return (
      <Grid item xs={12} sm={6} md={4} key={program.id}>
        <Card 
          elevation={3} 
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.02)'
            }
          }}
        >
          <CardMedia
            component="img"
            height="140"
            image={program.image || `/images/training/${program.id}.jpg`}
            alt={program.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/training/default.jpg';
            }}
          />
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography gutterBottom variant="h5" component="div">
              {program.title}
            </Typography>
            <Box sx={{ mb: 1.5 }}>
              {renderLevelChip(program.level)}
              {program.duration && (
                <Chip 
                  label={`${program.duration} semaines`} 
                  color="default" 
                  size="small" 
                  icon={<TimeIcon />} 
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {program.description.length > 150 
                ? `${program.description.substring(0, 150)}...` 
                : program.description}
            </Typography>
            {program.tags && program.tags.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                {program.tags.map(tag => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    variant="outlined" 
                    size="small" 
                    sx={{ mr: 0.5, mb: 0.5 }} 
                  />
                ))}
              </Box>
            )}
          </CardContent>
          <CardActions>
            <Button 
              size="small" 
              variant="contained" 
              color="primary" 
              onClick={() => handleProgramSelect(program)}
              fullWidth
            >
              {t('Voir le programme')}
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  };
  
  // Rendu du dialogue de détails
  const renderDetailDialog = () => {
    if (!selectedProgram) return null;
    
    return (
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        scroll="body"
      >
        <DialogTitle>
          <Typography variant="h4">{selectedProgram.title}</Typography>
          <Box sx={{ mt: 1 }}>
            {renderLevelChip(selectedProgram.level)}
            {selectedProgram.duration && (
              <Chip 
                label={`${selectedProgram.duration} semaines`} 
                color="default" 
                size="small" 
                icon={<TimeIcon />} 
                sx={{ mr: 1 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <img 
                src={selectedProgram.image || `/images/training/${selectedProgram.id}.jpg`}
                alt={selectedProgram.title}
                style={{ 
                  width: '100%', 
                  borderRadius: theme.shape.borderRadius,
                  maxHeight: 300,
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/training/default.jpg';
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {t('Objectif')}
              </Typography>
              <Typography paragraph>
                {selectedProgram.goalDescription}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                {t('Public cible')}
              </Typography>
              <Typography paragraph>
                {selectedProgram.targetAudience}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {t('Prérequis')}
                </Typography>
                <Typography>
                  <strong>{t('Niveau de forme')}:</strong> {selectedProgram.prerequisites?.fitnessLevel}
                </Typography>
                <Typography>
                  <strong>{t('Expérience')}:</strong> {selectedProgram.prerequisites?.experience}
                </Typography>
                {selectedProgram.prerequisites?.equipment && (
                  <>
                    <Typography component="div">
                      <strong>{t('Équipement')}:</strong>
                    </Typography>
                    <ul style={{ marginTop: 4 }}>
                      {selectedProgram.prerequisites.equipment.map((item, index) => (
                        <li key={index}><Typography>{item}</Typography></li>
                      ))}
                    </ul>
                  </>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                {t('Caractéristiques spécifiques')}
              </Typography>
              
              {selectedProgram.specificFeatures && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {selectedProgram.specificFeatures.map((feature, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle1" color="primary" gutterBottom>
                            {feature.name}
                          </Typography>
                          <Typography variant="body2">
                            {feature.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {selectedProgram.weekByWeekPlan && selectedProgram.weekByWeekPlan.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    {t('Structure du programme')}
                  </Typography>
                  
                  {selectedProgram.weekByWeekPlan.map((week, index) => {
                    // Si c'est une semaine simplifiée (pour les détails de documentation)
                    if (typeof week.weekNumber === 'string') {
                      return (
                        <Box key={`week-${index}`} sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" color="primary">
                            {t('Semaines')} {week.weekNumber}: {week.theme}
                          </Typography>
                          <Typography paragraph>
                            {week.description}
                          </Typography>
                          {week.keyWorkouts && (
                            <Box sx={{ pl: 2 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {t('Séances clés')}:
                              </Typography>
                              <ul>
                                {week.keyWorkouts.map((workout, i) => (
                                  <li key={i}><Typography variant="body2">{workout}</Typography></li>
                                ))}
                              </ul>
                            </Box>
                          )}
                        </Box>
                      );
                    }
                    
                    // Sinon c'est une semaine détaillée
                    return (
                      <Box key={`week-${index}`} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" color="primary">
                          {t('Semaine')} {week.weekNumber}: {week.theme}
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {t('Volume total')}: {week.totalHours || 
                            (typeof week.totalHours === 'object' ? 
                              `Débutant: ${week.totalHours.beginner}h, Intermédiaire: ${week.totalHours.intermediate}h, Avancé: ${week.totalHours.advanced}h` : 
                              'Variable')} heures
                        </Typography>
                        {week.workouts && week.workouts.length > 0 && (
                          <Typography variant="body2" fontWeight="bold">
                            {t('Aperçu des séances principales')}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </>
              )}
              
              {selectedProgram.success_stories && selectedProgram.success_stories.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('Témoignages')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {selectedProgram.success_stories.map((story, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                          <CardContent>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                              {story.name}, {story.age} ans
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {story.background}
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                              "{story.testimonial}"
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('Fermer')}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              if (onProgramSelect) {
                onProgramSelect(selectedProgram);
              }
              handleCloseDialog();
            }}
          >
            {t('Sélectionner ce programme')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('Programmes d\'entraînement')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          {t('Découvrez nos programmes d\'entraînement sur mesure pour tous les niveaux et objectifs')}
        </Typography>
        
        {/* Barre de recherche */}
        <TextField
          variant="outlined"
          placeholder={t('Rechercher un programme...')}
          fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ mb: 3, mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        {/* Système d'onglets pour les catégories */}
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
          allowScrollButtonsMobile
          centered={!isMobile}
          sx={{ mb: 3 }}
        >
          <Tab label={t('Tous les programmes')} value="all" />
          <Tab label={t('Recommandés pour vous')} value="recommended" />
          <Tab label={t('Classiques')} value="classic" />
          <Tab label={t('Endurance')} value="endurance" />
          <Tab label={t('Cols Européens')} value="europeanCols" />
          <Tab label={t('Spécialisés')} value="specialized" />
        </Tabs>
        
        {/* Affichage des programmes */}
        {displayedPrograms.length > 0 ? (
          <Grid container spacing={3}>
            {displayedPrograms.map(program => renderProgramCard(program))}
          </Grid>
        ) : (
          <Box sx={{ 
            py: 5, 
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 1
          }}>
            <Typography variant="h6" color="text.secondary">
              {t('Aucun programme ne correspond à votre recherche')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('Essayez d\'autres critères ou consultez tous les programmes disponibles')}
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Dialogue de détails */}
      {renderDetailDialog()}
    </Container>
  );
};

export default TrainingProgramsExplorer;
