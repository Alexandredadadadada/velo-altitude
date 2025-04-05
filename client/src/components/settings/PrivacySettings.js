import React from 'react';
import { Box, Typography, FormControl, Select, MenuItem, InputLabel, FormHelperText, Divider } from '@mui/material';
import PropTypes from 'prop-types';

const PrivacySettings = ({ settings, onChange }) => {
  const handleProfileVisibilityChange = (event) => {
    onChange({
      profileVisibility: event.target.value
    });
  };

  const handleActivitySharingChange = (event) => {
    onChange({
      activitySharing: event.target.value
    });
  };

  const handleLocationSharingChange = (event) => {
    onChange({
      locationSharing: event.target.value
    });
  };

  const handleDataCollectionChange = (event) => {
    onChange({
      dataCollection: event.target.value
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="profile-visibility-label">Visibilité du profil</InputLabel>
          <Select
            labelId="profile-visibility-label"
            id="profile-visibility"
            value={settings.profileVisibility}
            label="Visibilité du profil"
            onChange={handleProfileVisibilityChange}
          >
            <MenuItem value="public">Public (visible par tous)</MenuItem>
            <MenuItem value="friends">Amis seulement</MenuItem>
            <MenuItem value="private">Privé (visible uniquement par moi)</MenuItem>
          </Select>
          <FormHelperText>Définit qui peut voir votre profil et vos informations personnelles</FormHelperText>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="activity-sharing-label">Partage des activités</InputLabel>
          <Select
            labelId="activity-sharing-label"
            id="activity-sharing"
            value={settings.activitySharing}
            label="Partage des activités"
            onChange={handleActivitySharingChange}
          >
            <MenuItem value="public">Public (visible par tous)</MenuItem>
            <MenuItem value="friends">Amis seulement</MenuItem>
            <MenuItem value="private">Privé (visible uniquement par moi)</MenuItem>
          </Select>
          <FormHelperText>Définit qui peut voir vos activités cyclistes, entrainements et segments</FormHelperText>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="location-sharing-label">Partage de localisation</InputLabel>
          <Select
            labelId="location-sharing-label"
            id="location-sharing"
            value={settings.locationSharing}
            label="Partage de localisation"
            onChange={handleLocationSharingChange}
          >
            <MenuItem value="off">Désactivé</MenuItem>
            <MenuItem value="activity">Pendant les activités seulement</MenuItem>
            <MenuItem value="friends">Visible par les amis</MenuItem>
            <MenuItem value="public">Public</MenuItem>
          </Select>
          <FormHelperText>Définit si et quand votre position est partagée avec d'autres utilisateurs</FormHelperText>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <FormControl fullWidth>
          <InputLabel id="data-collection-label">Collecte de données</InputLabel>
          <Select
            labelId="data-collection-label"
            id="data-collection"
            value={settings.dataCollection}
            label="Collecte de données"
            onChange={handleDataCollectionChange}
          >
            <MenuItem value="minimal">Minimale (fonctionnalités de base uniquement)</MenuItem>
            <MenuItem value="standard">Standard (incluant analyses et suggestions)</MenuItem>
            <MenuItem value="full">Complète (pour expérience personnalisée optimale)</MenuItem>
          </Select>
          <FormHelperText>Définit le niveau de données que nous collectons pour améliorer votre expérience</FormHelperText>
        </FormControl>
      </Box>
    </Box>
  );
};

PrivacySettings.propTypes = {
  settings: PropTypes.shape({
    profileVisibility: PropTypes.string.isRequired,
    activitySharing: PropTypes.string.isRequired,
    locationSharing: PropTypes.string.isRequired,
    dataCollection: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default PrivacySettings;
