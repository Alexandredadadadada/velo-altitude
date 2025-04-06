import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Tabs, 
  Tab, 
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';
import TerrainIcon from '@mui/icons-material/Terrain';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCommunity } from '../../../contexts/CommunityContext';

const ForumCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledLink = styled(Link)({
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  width: '100%',
});

const ForumsList = () => {
  const { forums, loading } = useCommunity();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filtrer les forums en fonction de l'onglet et du terme de recherche
  const filteredForums = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    let filtered = [...forums];
    
    // Filtrer par type de forum selon l'onglet sélectionné
    if (tabValue === 1) {
      filtered = filtered.filter(forum => forum.type === 'region');
    } else if (tabValue === 2) {
      filtered = filtered.filter(forum => forum.type === 'discipline');
    }
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(forum => 
        forum.name.toLowerCase().includes(lowerSearchTerm) || 
        forum.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    return filtered;
  }, [forums, tabValue, searchTerm]);

  // Obtenir l'icône appropriée en fonction du type de forum
  const getForumIcon = (forumType, forumName) => {
    if (forumType === 'region') {
      if (forumName.includes('Alpes') || forumName.includes('Pyrénées') || forumName.includes('Vosges')) {
        return <TerrainIcon fontSize="large" />;
      }
      return <PeopleIcon fontSize="large" />;
    } else if (forumType === 'discipline') {
      return <DirectionsBikeIcon fontSize="large" />;
    }
    return <ForumIcon fontSize="large" />;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Chargement des forums...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Forums de discussion
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Rechercher un forum..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        <Tab label="Tous les forums" />
        <Tab label="Par région" />
        <Tab label="Par discipline" />
      </Tabs>
      
      <Divider sx={{ mb: 3 }} />
      
      {filteredForums.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" color="textSecondary">
            Aucun forum ne correspond à votre recherche
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredForums.map((forum) => (
            <Grid item xs={12} md={6} key={forum.id}>
              <StyledLink to={`/community/forums/${forum.id}`}>
                <ForumCard elevation={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getForumIcon(forum.type, forum.name)}
                    </Grid>
                    <Grid item xs={10}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                        {forum.name}
                      </Typography>
                      <Typography color="textSecondary" sx={{ mb: 1 }}>
                        {forum.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip 
                          label={`${forum.topicCount} sujets`} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                        <Typography variant="body2" color="textSecondary">
                          Dernière activité: {formatDistanceToNow(new Date(forum.lastActivity), { addSuffix: true, locale: fr })}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </ForumCard>
              </StyledLink>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ForumsList;
