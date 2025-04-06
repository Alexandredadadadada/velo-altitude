import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormHelperText,
  InputAdornment,
  Paper,
  useTheme
} from '@mui/material';
import { PlanFormData } from '../PlanForm';

interface PersonalInfoStepProps {
  formData: PlanFormData;
  updateFormData: (data: Partial<PlanFormData>) => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ formData, updateFormData }) => {
  const theme = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const activityLevelDescriptions = {
    sedentary: 'Peu ou pas d\'exercice, travail de bureau',
    light: 'Exercice léger 1-3 jours/semaine',
    moderate: 'Exercice modéré 3-5 jours/semaine',
    active: 'Exercice intense 6-7 jours/semaine',
    very_active: 'Exercice très intense, entraînement biquotidien'
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Informations personnelles
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Ces informations nous permettent de calculer vos besoins caloriques et nutritionnels de base. Toutes les données sont confidentielles.
      </Typography>

      <Paper elevation={1} sx={{ p: 3, my: 3, bgcolor: theme.palette.background.paper }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Âge"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleNumberChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">ans</InputAdornment>,
                inputProps: { min: 16, max: 100 }
              }}
              helperText="Entre 16 et 100 ans"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="gender-label">Genre</InputLabel>
              <Select
                labelId="gender-label"
                name="gender"
                value={formData.gender}
                onChange={handleSelectChange}
                label="Genre"
              >
                <MenuItem value="male">Homme</MenuItem>
                <MenuItem value="female">Femme</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
              <FormHelperText>Utilisé pour les calculs métaboliques</FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Poids"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleNumberChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                inputProps: { min: 40, max: 200, step: 0.1 }
              }}
              helperText="En kilogrammes"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Taille"
              name="height"
              type="number"
              value={formData.height}
              onChange={handleNumberChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                inputProps: { min: 140, max: 220 }
              }}
              helperText="En centimètres"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Niveau d'activité quotidien (hors cyclisme)
            </Typography>
            <FormControl fullWidth required>
              <InputLabel id="activity-level-label">Niveau d'activité</InputLabel>
              <Select
                labelId="activity-level-label"
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleSelectChange}
                label="Niveau d'activité"
              >
                <MenuItem value="sedentary">Sédentaire</MenuItem>
                <MenuItem value="light">Légèrement actif</MenuItem>
                <MenuItem value="moderate">Modérément actif</MenuItem>
                <MenuItem value="active">Très actif</MenuItem>
                <MenuItem value="very_active">Extrêmement actif</MenuItem>
              </Select>
              <FormHelperText>
                {activityLevelDescriptions[formData.activityLevel]}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Box mt={4}>
        <Typography variant="body2" color="text.secondary">
          Note: Ces informations sont utilisées uniquement pour personnaliser votre plan nutritionnel. Plus vos données sont précises, plus les recommandations seront adaptées à vos besoins.
        </Typography>
      </Box>
    </Box>
  );
};

export default PersonalInfoStep;
