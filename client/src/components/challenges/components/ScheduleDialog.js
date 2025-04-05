import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

/**
 * Composant de dialogue pour planifier une ascension
 */
const ScheduleDialog = ({ 
  open, 
  onClose, 
  onSchedule, 
  selectedColId,
  selectedColName 
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState('');
  const [dateError, setDateError] = useState('');
  
  // Valider la date sélectionnée
  const validateDate = (date) => {
    const today = new Date();
    const selected = new Date(date);
    
    if (isNaN(selected.getTime())) {
      return t('common.invalid_date');
    }
    
    if (selected < today) {
      return t('challenges.seven_majors.date_in_past');
    }
    
    return '';
  };
  
  // Gérer le changement de date
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setDateError(validateDate(date));
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = () => {
    const error = validateDate(selectedDate);
    
    if (error) {
      setDateError(error);
      return;
    }
    
    onSchedule(selectedColId, selectedDate);
    onClose();
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="schedule-ascent-dialog-title"
    >
      <DialogTitle id="schedule-ascent-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('challenges.seven_majors.schedule_ascent')}
          </Typography>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('challenges.seven_majors.scheduling_for')}:
          </Typography>
          <Typography variant="h6" color="primary">
            {selectedColName}
          </Typography>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" gutterBottom>
            {t('challenges.seven_majors.schedule_instructions')}
          </Typography>
          
          <TextField
            label={t('challenges.seven_majors.ascent_date')}
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            fullWidth
            error={!!dateError}
            helperText={dateError}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mt: 2 }}
            inputProps={{
              min: new Date().toISOString().split('T')[0]
            }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={!selectedDate || !!dateError}
        >
          {t('challenges.seven_majors.confirm_schedule')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleDialog;
