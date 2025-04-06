import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  Slider,
  Switch,
  Paper,
  TextField,
  useTheme
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale';
import TerrainIcon from '@mui/icons-material/Terrain';
import SpeedIcon from '@mui/icons-material/Speed';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EventIcon from '@mui/icons-material/Event';
import { PlanFormData } from '../PlanForm';

interface GoalsStepProps {
  formData: PlanFormData;
  updateFormData: (data: Partial<PlanFormData>) => void;
}

const GoalsStep: React.FC<GoalsStepProps> = ({ formData, updateFormData }) => {
  const theme = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateFormData({ [name]: numValue });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      updateFormData({ [name]: value });
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    updateFormData({ [name]: checked });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      updateFormData({ eventDate: date });
    }
  };

  const targetGoalInfo = {
    climbing: {
      title: "Ascension de cols",
      description: "Optimisé pour les cyclistes qui se préparent à gravir des cols difficiles. Équilibré en glucides complexes et protéines.",
      icon: <TerrainIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />,
      color: theme.palette.secondary.main
    },
    endurance: {
      title: "Endurance",
      description: "Adapté aux longues sorties et aux événements d'endurance. Accent sur les sources d'énergie durables et la récupération.",
      icon: <SpeedIcon fontSize="large" sx={{ color: theme.palette.info.main }} />,
      color: theme.palette.info.main
    },
    performance: {
      title: "Performance",
      description: "Maximisez votre puissance et votre vitesse. Idéal pour les cyclistes compétitifs cherchant à améliorer leurs résultats.",
      icon: <FitnessCenterIcon fontSize="large" sx={{ color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main
    },
    weight_loss: {
      title: "Perte de poids",
      description: "Conçu pour les cyclistes cherchant à optimiser leur poids tout en maintenant leur énergie pour les entraînements.",
      icon: <TrendingDownIcon fontSize="large" sx={{ color: theme.palette.success.main }} />,
      color: theme.palette.success.main
    },
    maintenance: {
      title: "Maintien",
      description: "Équilibre parfait pour maintenir votre poids et votre performance actuels. Idéal pour la période d'entretien.",
      icon: <SpeedIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Objectifs cyclistes
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Définissez vos objectifs cyclistes pour personnaliser votre plan nutritionnel en fonction de vos besoins spécifiques.
      </Typography>

      <Paper elevation={1} sx={{ p: 3, my: 3, bgcolor: theme.palette.background.paper }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Quel est votre objectif principal ?
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {Object.entries(targetGoalInfo).map(([key, info]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Paper 
                elevation={formData.targetGoal === key ? 3 : 1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: formData.targetGoal === key ? `2px solid ${info.color}` : '2px solid transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
                onClick={() => updateFormData({ targetGoal: key as any })}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  {info.icon}
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="medium" 
                    ml={1}
                    color={formData.targetGoal === key ? info.color : 'inherit'}
                  >
                    {info.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {info.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, my: 3, bgcolor: theme.palette.background.paper }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Votre entraînement cycliste
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <Typography gutterBottom>
                Fréquence d'entraînement (séances par semaine)
              </Typography>
              <Slider
                value={formData.trainingFrequency}
                onChange={(_, value) => updateFormData({ trainingFrequency: value as number })}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                  { value: 5, label: '5' },
                  { value: 6, label: '6' },
                  { value: 7, label: '7' },
                ]}
                min={1}
                max={7}
                valueLabelDisplay="auto"
              />
              <FormHelperText>
                {formData.trainingFrequency <= 2 
                  ? 'Pratique occasionnelle'
                  : formData.trainingFrequency <= 4 
                  ? 'Pratique régulière'
                  : 'Pratique intensive'}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="training-intensity-label">Intensité d'entraînement</InputLabel>
              <Select
                labelId="training-intensity-label"
                name="trainingIntensity"
                value={formData.trainingIntensity}
                onChange={handleSelectChange}
                label="Intensité d'entraînement"
              >
                <MenuItem value="low">Faible (récupération active, sorties légères)</MenuItem>
                <MenuItem value="medium">Moyenne (sorties modérées, quelques intervalles)</MenuItem>
                <MenuItem value="high">Élevée (intervalles intenses, préparation compétition)</MenuItem>
              </Select>
              <FormHelperText>
                {formData.trainingIntensity === 'low' 
                  ? 'Privilégie l'endurance fondamentale et la récupération' 
                  : formData.trainingIntensity === 'medium' 
                  ? 'Développe l'endurance et la puissance de façon équilibrée'
                  : 'Maximise la performance et la préparation spécifique'}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, my: 3, bgcolor: theme.palette.background.paper }}>
        <Box display="flex" alignItems="center" mb={2}>
          <EventIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="medium">
            Événements à venir
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={formData.upcomingEvents}
              onChange={handleSwitchChange}
              name="upcomingEvents"
              color="primary"
            />
          }
          label="J'ai un événement cycliste à venir (course, randonnée, défi de cols)"
          sx={{ mb: 2 }}
        />

        {formData.upcomingEvents && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="event-type-label">Type d'événement</InputLabel>
                <Select
                  labelId="event-type-label"
                  name="eventType"
                  value={formData.eventType || ''}
                  onChange={handleSelectChange}
                  label="Type d'événement"
                >
                  <MenuItem value="short_race">Course courte distance (< 100km)</MenuItem>
                  <MenuItem value="long_race">Course longue distance (> 100km)</MenuItem>
                  <MenuItem value="stage_race">Course à étapes</MenuItem>
                  <MenuItem value="gran_fondo">Cyclosportive / Gran Fondo</MenuItem>
                  <MenuItem value="col_challenge">Défi d'ascension de cols</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date de l'événement"
                  value={formData.eventDate || null}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Nous adapterons votre plan en fonction de cette date"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        )}
      </Paper>

      <Box mt={4}>
        <Typography variant="body2" color="text.secondary">
          Ces informations nous permettent d'adapter précisément les apports caloriques et la répartition des macronutriments en fonction de vos objectifs cyclistes et de votre calendrier d'entraînement.
        </Typography>
      </Box>
    </Box>
  );
};

export default GoalsStep;
