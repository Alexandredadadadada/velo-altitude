import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Breadcrumbs,
  Skeleton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PushPinIcon from '@mui/icons-material/PushPin';
import LockIcon from '@mui/icons-material/Lock';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCommunity } from '../../../contexts/CommunityContext';
import NewTopicForm from './NewTopicForm';

const ForumTopicList = () => {
  const { forumId } = useParams();
  const { forums, forumTopics, loading, formatDate } = useCommunity();
  const [searchTerm, setSearchTerm] = useState('');
  const [openNewTopicForm, setOpenNewTopicForm] = useState(false);
  const [currentForum, setCurrentForum] = useState(null);

  // Trouver le forum actuel
  useEffect(() => {
    if (forums && forums.length > 0) {
      const forum = forums.find(f => f.id === forumId);
      setCurrentForum(forum);
    }
  }, [forumId, forums]);

  // Filtrer les sujets de ce forum
  const filteredTopics = useMemo(() => {
    if (!forumTopics) return [];
    
    let topics = forumTopics.filter(topic => topic.forumId === forumId);
    
    // Appliquer le filtre de recherche
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      topics = topics.filter(topic => 
        topic.title.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Trier : épinglés en premier, puis par date de dernière activité
    return topics.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      const dateA = a.lastReply ? new Date(a.lastReply.date) : new Date(a.createdAt);
      const dateB = b.lastReply ? new Date(b.lastReply.date) : new Date(b.createdAt);
      
      return dateB - dateA; // Ordre décroissant
    });
  }, [forumId, forumTopics, searchTerm]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </Box>
    );
  }

  if (!currentForum) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">Forum introuvable</Typography>
        <Button component={Link} to="/community/forums" color="primary" sx={{ mt: 2 }}>
          Retour à la liste des forums
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Fil d'Ariane */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="navigation" 
        sx={{ mb: 2 }}
      >
        <Link to="/community" style={{ textDecoration: 'none', color: 'inherit' }}>
          Communauté
        </Link>
        <Link to="/community/forums" style={{ textDecoration: 'none', color: 'inherit' }}>
          Forums
        </Link>
        <Typography color="textPrimary">{currentForum.name}</Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {currentForum.name}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {currentForum.description}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setOpenNewTopicForm(true)}
        >
          Nouveau sujet
        </Button>
      </Box>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Rechercher un sujet..."
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
      
      {filteredTopics.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
            Aucun sujet trouvé dans ce forum
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => setOpenNewTopicForm(true)}
          >
            Créer le premier sujet
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>Sujet</TableCell>
                <TableCell sx={{ color: 'white' }}>Auteur</TableCell>
                <TableCell sx={{ color: 'white' }} align="center">Réponses</TableCell>
                <TableCell sx={{ color: 'white' }} align="center">Vues</TableCell>
                <TableCell sx={{ color: 'white' }}>Dernière activité</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTopics.map((topic) => (
                <TableRow 
                  key={topic.id}
                  sx={{ 
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    backgroundColor: topic.pinned ? 'rgba(25, 118, 210, 0.05)' : 'inherit'
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {topic.pinned && (
                        <PushPinIcon color="primary" sx={{ mr: 1, fontSize: 18 }} />
                      )}
                      {topic.locked && (
                        <LockIcon color="action" sx={{ mr: 1, fontSize: 18 }} />
                      )}
                      <Link to={`/community/forums/topics/${topic.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Typography sx={{ fontWeight: topic.pinned ? 'bold' : 'normal' }}>
                          {topic.title}
                        </Typography>
                      </Link>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={topic.author.avatar}
                        alt={topic.author.name}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                      <Typography variant="body2">
                        {topic.author.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {format(new Date(topic.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={topic.replies} 
                      size="small" 
                      color={topic.replies > 0 ? "primary" : "default"}
                      variant={topic.replies > 0 ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell align="center">{topic.views}</TableCell>
                  <TableCell>
                    {topic.lastReply ? (
                      <>
                        <Typography variant="body2">
                          {topic.lastReply.authorName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDistanceToNow(new Date(topic.lastReply.date), { addSuffix: true, locale: fr })}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Pas de réponse
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Modal pour créer un nouveau sujet */}
      <NewTopicForm 
        open={openNewTopicForm} 
        onClose={() => setOpenNewTopicForm(false)} 
        forumId={forumId} 
        forumName={currentForum.name}
      />
    </Box>
  );
};

export default ForumTopicList;
