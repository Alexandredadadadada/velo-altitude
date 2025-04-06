import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import { useCommunity } from '../../../contexts/CommunityContext';

const Preview = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  marginTop: theme.spacing(2),
  maxHeight: '300px',
  overflow: 'auto'
}));

const TabButton = styled(Button)(({ theme, active }) => ({
  marginRight: theme.spacing(1),
  textTransform: 'none',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  borderBottom: active ? `2px solid ${theme.palette.primary.main}` : 'none',
  borderRadius: 0,
  paddingBottom: theme.spacing(0.5),
}));

const NewTopicForm = ({ open, onClose, forumId, forumName }) => {
  const navigate = useNavigate();
  const { createForumTopic } = useCommunity();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentTab, setCurrentTab] = useState('edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState({
    title: '',
    content: ''
  });

  const validateForm = () => {
    let isValid = true;
    const newError = { title: '', content: '' };

    if (title.trim() === '') {
      newError.title = 'Le titre est requis';
      isValid = false;
    } else if (title.length < 5) {
      newError.title = 'Le titre doit contenir au moins 5 caractères';
      isValid = false;
    }

    if (content.trim() === '') {
      newError.content = 'Le contenu est requis';
      isValid = false;
    } else if (content.length < 10) {
      newError.content = 'Le contenu doit contenir au moins 10 caractères';
      isValid = false;
    }

    setError(newError);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const newTopic = await createForumTopic(forumId, {
        title,
        content
      });
      
      setSubmitting(false);
      resetForm();
      onClose();
      
      // Rediriger vers le nouveau sujet
      if (newTopic && newTopic.id) {
        navigate(`/community/forums/topics/${newTopic.id}`);
      }
    } catch (error) {
      setSubmitting(false);
      console.error('Error creating topic:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCurrentTab('edit');
    setError({ title: '', content: '' });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Nouveau sujet dans {forumName}
        </Typography>
        <Chip 
          label="Markdown supporté" 
          size="small" 
          color="primary" 
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </DialogTitle>
      
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Titre du sujet"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!!error.title}
          helperText={error.title}
          disabled={submitting}
        />
        
        <Box sx={{ mt: 2, mb: 1 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <TabButton
              active={currentTab === 'edit' ? 1 : 0}
              onClick={() => setCurrentTab('edit')}
            >
              Éditer
            </TabButton>
            <TabButton
              active={currentTab === 'preview' ? 1 : 0}
              onClick={() => setCurrentTab('preview')}
            >
              Aperçu
            </TabButton>
          </Box>
          
          {currentTab === 'edit' ? (
            <TextField
              label="Contenu"
              multiline
              rows={12}
              fullWidth
              variant="outlined"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              error={!!error.content}
              helperText={error.content || "Utilisez le Markdown pour formater votre texte"}
              disabled={submitting}
            />
          ) : (
            <Preview>
              {content ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <Typography color="textSecondary" align="center">
                  Aucun contenu à prévisualiser
                </Typography>
              )}
            </Preview>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? 'Création...' : 'Créer le sujet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewTopicForm;
