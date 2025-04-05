import React from 'react';
import { Box, Typography, FormControl, Select, MenuItem, InputLabel, FormHelperText, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import PropTypes from 'prop-types';

const LanguageSettings = ({ settings, onChange }) => {
  const handleLanguageChange = (event) => {
    onChange({
      interface: event.target.value
    });
  };

  const handleUnitChange = (event) => {
    onChange({
      units: event.target.value
    });
  };

  const handleDateFormatChange = (event) => {
    onChange({
      dateFormat: event.target.value
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="language-select-label">Langue de l'interface</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={settings.interface}
            label="Langue de l'interface"
            onChange={handleLanguageChange}
          >
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="de">Deutsch</MenuItem>
            <MenuItem value="es">Español</MenuItem>
            <MenuItem value="it">Italiano</MenuItem>
          </Select>
          <FormHelperText>Choisissez la langue dans laquelle vous souhaitez utiliser l'application</FormHelperText>
        </FormControl>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Système d'unités
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="units"
            name="units"
            value={settings.units}
            onChange={handleUnitChange}
            row
          >
            <FormControlLabel 
              value="metric" 
              control={<Radio />} 
              label="Métrique (km, kg, m)" 
            />
            <FormControlLabel 
              value="imperial" 
              control={<Radio />} 
              label="Impérial (mi, lb, ft)" 
            />
          </RadioGroup>
          <FormHelperText>Utilisé pour afficher les distances, poids et altitudes</FormHelperText>
        </FormControl>
      </Box>

      <Box>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Format de date
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="date-format"
            name="dateFormat"
            value={settings.dateFormat}
            onChange={handleDateFormatChange}
            row
          >
            <FormControlLabel 
              value="DD/MM/YYYY" 
              control={<Radio />} 
              label="JJ/MM/AAAA" 
            />
            <FormControlLabel 
              value="MM/DD/YYYY" 
              control={<Radio />} 
              label="MM/JJ/AAAA" 
            />
            <FormControlLabel 
              value="YYYY-MM-DD" 
              control={<Radio />} 
              label="AAAA-MM-JJ" 
            />
          </RadioGroup>
        </FormControl>
      </Box>
    </Box>
  );
};

LanguageSettings.propTypes = {
  settings: PropTypes.shape({
    interface: PropTypes.string.isRequired,
    units: PropTypes.string.isRequired,
    dateFormat: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default LanguageSettings;
