import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

/**
 * Composant pour gérer les notes utilisateur sur un col
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.userNotes - Notes de l'utilisateur
 * @param {boolean} props.showNotesForm - Indique si le formulaire d'édition est affiché
 * @param {Function} props.setUserNotes - Fonction pour mettre à jour les notes
 * @param {Function} props.setShowNotesForm - Fonction pour afficher/masquer le formulaire
 * @param {Function} props.saveUserNotes - Fonction pour sauvegarder les notes
 */
const UserNotes = memo(({ 
  userNotes, 
  showNotesForm, 
  setUserNotes, 
  setShowNotesForm, 
  saveUserNotes 
}) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2 }}>
      {showNotesForm ? (
        <Box component="form" noValidate autoComplete="off">
          <TextField
            label={t('cols.your_notes')}
            multiline
            fullWidth
            minRows={4}
            maxRows={10}
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={() => setShowNotesForm(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={saveUserNotes}
              startIcon={<SaveIcon />}
            >
              {t('common.save')}
            </Button>
          </Box>
        </Box>
      ) : (
        userNotes ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{t('cols.your_notes')}</Typography>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<EditIcon />}
                onClick={() => setShowNotesForm(true)}
              >
                {t('common.edit')}
              </Button>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
              <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {userNotes}
              </Typography>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {t('cols.no_notes')}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setShowNotesForm(true)}
              startIcon={<EditIcon />}
            >
              {t('cols.add_notes')}
            </Button>
          </Box>
        )
      )}
    </Box>
  );
});

export default UserNotes;
