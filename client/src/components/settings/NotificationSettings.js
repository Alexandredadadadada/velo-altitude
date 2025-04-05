import React from 'react';
import { Box, Typography, FormGroup, FormControlLabel, Switch, Divider } from '@mui/material';
import PropTypes from 'prop-types';

const NotificationSettings = ({ settings, onChange }) => {
  const handleChange = (event) => {
    onChange({
      [event.target.name]: event.target.checked
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Canaux de notification
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.pushEnabled}
                onChange={handleChange}
                name="pushEnabled"
                color="primary"
              />
            }
            label="Notifications push"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.emailEnabled}
                onChange={handleChange}
                name="emailEnabled"
                color="primary"
              />
            }
            label="Notifications par email"
          />
        </FormGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Types de notifications
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.achievementsNotification}
                onChange={handleChange}
                name="achievementsNotification"
                color="primary"
              />
            }
            label="Accomplissements et badges"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.friendsActivityNotification}
                onChange={handleChange}
                name="friendsActivityNotification"
                color="primary"
              />
            }
            label="Activités des amis"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.marketingNotification}
                onChange={handleChange}
                name="marketingNotification"
                color="primary"
              />
            }
            label="Actualités et offres spéciales"
          />
        </FormGroup>
      </Box>
    </Box>
  );
};

NotificationSettings.propTypes = {
  settings: PropTypes.shape({
    pushEnabled: PropTypes.bool.isRequired,
    emailEnabled: PropTypes.bool.isRequired,
    achievementsNotification: PropTypes.bool.isRequired,
    friendsActivityNotification: PropTypes.bool.isRequired,
    marketingNotification: PropTypes.bool.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default NotificationSettings;
