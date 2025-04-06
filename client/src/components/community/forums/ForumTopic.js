import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Avatar,
  TextField,
  IconButton,
  Breadcrumbs,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import ReplyIcon from '@mui/icons-material/Reply';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FlagIcon from '@mui/icons-material/Flag';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCommunity } from '../../../contexts/CommunityContext';
import { useAuth } from '../../../context/AuthContext';

const ReplyContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&:hover': {
    '& .actions': {
      opacity: 1,
    },
  },
}));

const ReplyActions = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  opacity: 0.2,
  transition: 'opacity 0.2s',
}));

const AuthorInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const ContentBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  flex: 1,
}));

// Mock des réponses pour la démo
const mockReplies = [
  {
    id: 'reply-1',
    topicId: 'topic-1',
    author: {
      id: '456',
      name: 'Marie Martin',
      avatar: '/images/profiles/user2.jpg',
      posts: 58,
      joinDate: '2024-12-15',
    },
    content: "Je recommande juin ou septembre. En juillet-août, il y a beaucoup de touristes et les températures peuvent être très élevées pendant la journée.\n\nEn juin, la nature est magnifique avec les fleurs alpines, et en septembre, les couleurs automnales commencent à apparaître.",
    createdAt: '2025-04-01T09:15:00Z',
    likes: 7
  },
  {
    id: 'reply-2',
    topicId: 'topic-1',
    author: {
      id: '789',
      name: 'Lucas Bernard',
      avatar: '/images/profiles/user3.jpg',
      posts: 124,
      joinDate: '2024-08-03',
    },
    content: "J'ajoute que si vous voulez éviter la foule, essayez d'y aller en semaine plutôt que le weekend.\n\nAussi, vérifiez toujours la météo avant de partir - le temps peut changer rapidement en montagne !",
    createdAt: '2025-04-02T14:30:00Z',
    likes: 4
  },
  {
    id: 'reply-3',
    topicId: 'topic-1',
    author: {
      id: '123',
      name: 'Jean Dupont',
      avatar: '/images/profiles/default-avatar.jpg',
      posts: 86,
      joinDate: '2024-11-20',
    },
    content: "Merci à tous pour vos conseils ! Je pense que je vais opter pour la mi-juin.\n\nQuelqu'un a-t-il des recommandations d'hébergement dans le coin ?",
    createdAt: '2025-04-03T08:45:00Z',
    likes: 2
  }
];

const ForumTopic = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { forumTopics, forums, replyToTopic, formatDate, reportContent } = useCommunity();
  const { user } = useAuth();
  
  const [topic, setTopic] = useState(null);
  const [forum, setForum] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingContentId, setReportingContentId] = useState(null);
  const [reportType, setReportType] = useState('');

  useEffect(() => {
    // Dans une vraie implémentation, ces données viendraient d'une API
    if (forumTopics && forumTopics.length > 0) {
      const foundTopic = forumTopics.find(t => t.id === topicId);
      
      if (foundTopic) {
        setTopic(foundTopic);
        
        // Trouver le forum parent
        if (forums && forums.length > 0) {
          const parentForum = forums.find(f => f.id === foundTopic.forumId);
          setForum(parentForum);
        }
        
        // Simuler le chargement des réponses
        // Dans une implémentation réelle, ces données viendraient d'une API
        setReplies(mockReplies.filter(r => r.topicId === topicId));
      }
    }
  }, [topicId, forumTopics, forums]);

  const handleReplySubmit = async () => {
    if (replyContent.trim() === '') {
      setError('Le contenu de la réponse ne peut pas être vide');
      return;
    }

    try {
      setSubmitting(true);
      await replyToTopic(topicId, { content: replyContent });
      
      // Simuler l'ajout de la réponse
      const newReply = {
        id: `reply-${Date.now()}`,
        topicId,
        author: {
          id: user?.sub || '123',
          name: user?.name || 'Jean Dupont',
          avatar: user?.picture || '/images/profiles/default-avatar.jpg',
          posts: 86,
          joinDate: '2024-11-20',
        },
        content: replyContent,
        createdAt: new Date().toISOString(),
        likes: 0
      };
      
      setReplies(prev => [...prev, newReply]);
      setReplyContent('');
      setError('');
      setShowPreview(false);
    } catch (err) {
      setError('Erreur lors de l\'envoi de la réponse. Veuillez réessayer.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = (contentId, type) => {
    setReportingContentId(contentId);
    setReportType(type);
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (reportReason.trim() === '') {
      return;
    }
    
    try {
      await reportContent(reportType, reportingContentId, reportReason);
      setReportDialogOpen(false);
      setReportReason('');
      setReportingContentId(null);
      setReportType('');
    } catch (error) {
      console.error('Error reporting content:', error);
    }
  };

  if (!topic || !forum) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
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
        <Link to={`/community/forums/${forum.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          {forum.name}
        </Link>
        <Typography color="textPrimary" noWrap sx={{ maxWidth: 200 }}>{topic.title}</Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate(`/community/forums/${forum.id}`)}
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {topic.title}
        </Typography>
      </Box>
      
      {/* Message d'origine */}
      <ReplyContainer elevation={3} sx={{ mb: 4, backgroundColor: 'rgba(25, 118, 210, 0.04)' }}>
        <ReplyActions className="actions">
          <IconButton size="small" onClick={() => handleReport(topic.id, 'topic')}>
            <FlagIcon fontSize="small" />
          </IconButton>
        </ReplyActions>
        
        <Box sx={{ display: 'flex' }}>
          <AuthorInfo sx={{ width: { xs: '120px', md: '180px' } }}>
            <Avatar 
              src={topic.author.avatar} 
              alt={topic.author.name}
              sx={{ width: 64, height: 64, mb: 1 }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              {topic.author.name}
            </Typography>
            <Chip 
              label={topic.author.posts ? `${topic.author.posts} posts` : "Nouveau membre"} 
              size="small" 
              sx={{ my: 1 }}
            />
            <Typography variant="caption" color="textSecondary">
              Membre depuis {topic.author.joinDate ? format(new Date(topic.author.joinDate), 'MMM yyyy', { locale: fr }) : 'récemment'}
            </Typography>
          </AuthorInfo>
          
          <ContentBox>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Publié le {format(new Date(topic.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                #{topic.id}
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <ReactMarkdown>
                {topic.content || "Contenu non disponible"}
              </ReactMarkdown>
            </Box>
          </ContentBox>
        </Box>
      </ReplyContainer>
      
      {/* Réponses */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {replies.length} {replies.length > 1 ? 'Réponses' : 'Réponse'}
      </Typography>
      
      {replies.map((reply) => (
        <ReplyContainer key={reply.id} elevation={2}>
          <ReplyActions className="actions">
            <IconButton size="small" sx={{ mr: 1 }}>
              <ThumbUpIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => handleReport(reply.id, 'reply')}>
              <FlagIcon fontSize="small" />
            </IconButton>
          </ReplyActions>
          
          <Box sx={{ display: 'flex' }}>
            <AuthorInfo sx={{ width: { xs: '120px', md: '180px' } }}>
              <Avatar 
                src={reply.author.avatar} 
                alt={reply.author.name}
                sx={{ width: 48, height: 48, mb: 1 }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {reply.author.name}
              </Typography>
              <Chip 
                label={`${reply.author.posts} posts`} 
                size="small" 
                sx={{ my: 1 }}
              />
              <Typography variant="caption" color="textSecondary">
                Membre depuis {format(new Date(reply.author.joinDate), 'MMM yyyy', { locale: fr })}
              </Typography>
            </AuthorInfo>
            
            <ContentBox>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Publié le {format(new Date(reply.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ThumbUpIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="textSecondary">
                    {reply.likes}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <ReactMarkdown>
                  {reply.content}
                </ReactMarkdown>
              </Box>
            </ContentBox>
          </Box>
        </ReplyContainer>
      ))}
      
      {/* Formulaire de réponse */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Répondre à ce sujet
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Button
            variant={showPreview ? 'outlined' : 'contained'}
            color="primary"
            onClick={() => setShowPreview(false)}
            sx={{ mr: 1 }}
          >
            Éditer
          </Button>
          <Button
            variant={showPreview ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setShowPreview(true)}
          >
            Aperçu
          </Button>
        </Box>
        
        {!showPreview ? (
          <TextField
            fullWidth
            multiline
            rows={8}
            placeholder="Rédigez votre réponse (Markdown supporté)..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
            disabled={submitting}
          />
        ) : (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, minHeight: '200px' }}>
            {replyContent ? (
              <ReactMarkdown>
                {replyContent}
              </ReactMarkdown>
            ) : (
              <Typography color="textSecondary" align="center">
                Aperçu vide. Commencez à rédiger pour voir l'aperçu.
              </Typography>
            )}
          </Paper>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            endIcon={<ReplyIcon />}
            onClick={handleReplySubmit}
            disabled={submitting}
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer la réponse'}
          </Button>
        </Box>
      </Paper>
      
      {/* Dialogue de signalement */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)}>
        <DialogTitle>
          Signaler un contenu
          <IconButton
            aria-label="close"
            onClick={() => setReportDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Merci de nous aider à maintenir la qualité de notre communauté. Veuillez indiquer la raison de votre signalement :
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Raison du signalement"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>
            Annuler
          </Button>
          <Button onClick={submitReport} variant="contained" color="primary">
            Envoyer le signalement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForumTopic;
