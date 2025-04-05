import React from 'react';
import { Box, Typography, FormControl, RadioGroup, FormControlLabel, Radio, Slider, Switch, FormGroup } from '@mui/material';
import PropTypes from 'prop-types';

const ThemeSettings = ({ settings, onChange }) => {
  const handleThemeModeChange = (event) => {
    onChange({
      mode: event.target.value
    });
  };

  const handlePrimaryColorChange = (event, newValue) => {
    onChange({
      primaryColor: newValue
    });
  };

  const handleFontSizeChange = (event) => {
    onChange({
      fontSize: event.target.value
    });
  };

  const handleAnimationsChange = (event) => {
    onChange({
      animations: event.target.checked
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Mode d'affichage
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="theme-mode"
            name="themeMode"
            value={settings.mode}
            onChange={handleThemeModeChange}
            row
          >
            <FormControlLabel value="light" control={<Radio />} label="Clair" />
            <FormControlLabel value="dark" control={<Radio />} label="Sombre" />
            <FormControlLabel value="system" control={<Radio />} label="Système" />
          </RadioGroup>
        </FormControl>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Taille de la police
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="font-size"
            name="fontSize"
            value={settings.fontSize}
            onChange={handleFontSizeChange}
            row
          >
            <FormControlLabel value="small" control={<Radio />} label="Petite" />
            <FormControlLabel value="medium" control={<Radio />} label="Moyenne" />
            <FormControlLabel value="large" control={<Radio />} label="Grande" />
          </RadioGroup>
        </FormControl>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Animations
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.animations}
                onChange={handleAnimationsChange}
                name="animations"
                color="primary"
              />
            }
            label="Activer les animations"
          />
        </FormGroup>
      </Box>
    </Box>
  );
};

ThemeSettings.propTypes = {
  settings: PropTypes.shape({
    mode: PropTypes.string.isRequired,
    primaryColor: PropTypes.string.isRequired,
    fontSize: PropTypes.string.isRequired,
    animations: PropTypes.bool.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default ThemeSettings;
