import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Divider,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Terrain as TerrainIcon,
  Public as GlobeIcon,
  WbSunny as SunnyIcon,
  Cloud as CloudIcon,
  Timeline as TimelineIcon,
  RouteOutlined as RouteIcon,
  Speed as SpeedIcon,
  StraightenOutlined as ElevationIcon
} from '@mui/icons-material';
import ColVisualization3D from '../../cols/ColVisualization3D';

/**
 * Composant pour afficher les détails d'un col dans une boîte de dialogue
 */
const ColDetailsDialog = ({
  open,
  col,
  onClose,
  onExportTrack,
  onMarkAsCompleted,
  onAddToChallenge,
  isSelected,
  isCompleted,
  maxColsReached,
  exportFormat,
  onExportFormatChange,
  weatherData
}) => {
  const { t } = useTranslation();
  
  if (!col) return null;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="col-details-dialog-title"
    >
      <DialogTitle id="col-details-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">
            {col.name}
          </Typography>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Informations générales */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <img 
                src={col.imageUrl || '/images/cols/default-col.jpg'} 
                alt={col.name}
                style={{ 
                  width: '100%', 
                  height: '300px', 
                  objectFit: 'cover', 
                  borderRadius: '8px' 
                }}
              />
            </Box>
            
            <Typography variant="h6" gutterBottom>
              {t('cols.details', 'Détails du col')}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Chip 
                label={col.difficulty === 'extreme' ? 'Extrême' :
                      col.difficulty === 'hard' ? 'Difficile' :
                      col.difficulty === 'medium' ? 'Moyen' : 'Facile'}
                color={col.difficulty === 'extreme' ? 'error' :
                       col.difficulty === 'hard' ? 'warning' :
                       col.difficulty === 'medium' ? 'info' : 'success'}
                sx={{ mr: 1, mb: 1 }}
              />
              
              {col.tags && col.tags.map(tag => (
                <Chip 
                  key={tag}
                  label={tag}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
            
            <Grid container spacing={2}>
              {col.location && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <GlobeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('cols.location', 'Localisation')}:
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {col.location.region && col.location.country 
                      ? `${col.location.region}, ${col.location.country}`
                      : col.location.region || col.location.country || t('common.unknown', 'Inconnu')}
                  </Typography>
                </Grid>
              )}
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TerrainIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.altitude', 'Altitude')}:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {col.altitude} m
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ElevationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.elevation', 'Dénivelé')}:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {col.elevation} m
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RouteIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.distance', 'Distance')}:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {col.distance} km
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SpeedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.gradient', 'Pente moyenne')}:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {col.avgGradient}%
                </Typography>
              </Grid>
              
              {col.maxGradient && (
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SpeedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('cols.max_gradient', 'Pente maximale')}:
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {col.maxGradient}%
                  </Typography>
                </Grid>
              )}
              
              {col.startElevation && (
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TerrainIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('cols.start_elevation', 'Altitude de départ')}:
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {col.startElevation} m
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Description */}
            {col.description && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('cols.description', 'Description')}
                </Typography>
                <Typography variant="body2">
                  {col.description}
                </Typography>
              </Box>
            )}
            
            {/* Météo */}
            {weatherData && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('cols.weather', 'Météo')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SunnyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {t('cols.temperature', 'Température')}: {weatherData.temperature}°C
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CloudIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {t('cols.conditions', 'Conditions')}: {weatherData.conditions}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {t('cols.wind', 'Vent')}: {weatherData.windSpeed} km/h
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {t('cols.humidity', 'Humidité')}: {weatherData.humidity}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Histoires et anecdotes */}
            {col.stories && col.stories.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('cols.stories', 'Histoire et anecdotes')}
                </Typography>
                <ul>
                  {col.stories.map((story, index) => (
                    <li key={index}>
                      <Typography variant="body2">{story}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
            
            {/* Points d'intérêt */}
            {col.pointsOfInterest && col.pointsOfInterest.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('cols.points_of_interest', 'Points d\'intérêt')}
                </Typography>
                <List dense>
                  {col.pointsOfInterest.map((poi, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={poi.name} 
                        secondary={poi.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
          
          {/* Visualisation 3D */}
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', minHeight: '400px' }}>
              <Typography variant="h6" gutterBottom>
                {t('cols.profile_visualization', 'Profil d\'altitude')}
              </Typography>
              
              {/* Utilisation du composant de visualisation 3D existant */}
              <ColVisualization3D 
                colId={col.id} 
                colData={col.elevationProfile || []} 
                pointsOfInterest={col.pointsOfInterest || []}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('common.close', 'Fermer')}
        </Button>
        
        {/* Bouton d'exportation */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ToggleButtonGroup
            value={exportFormat}
            exclusive
            onChange={(e, newFormat) => newFormat && onExportFormatChange(newFormat)}
            size="small"
            sx={{ mr: 1 }}
          >
            <ToggleButton value="gpx">GPX</ToggleButton>
            <ToggleButton value="tcx">TCX</ToggleButton>
          </ToggleButtonGroup>
          
          <Button 
            onClick={() => onExportTrack(col)}
            startIcon={<DownloadIcon />}
            color="secondary"
            variant="outlined"
            size="small"
          >
            {t('common.export', 'Exporter')}
          </Button>
        </Box>
        
        {/* Bouton pour marquer comme complété */}
        {isSelected && (
          <Button 
            onClick={() => onMarkAsCompleted(col.id)}
            color={isCompleted ? "success" : "primary"}
            variant="outlined"
            startIcon={isCompleted ? <CheckCircleIcon /> : null}
          >
            {isCompleted 
              ? t('challenges.seven_majors.completed', 'Terminé') 
              : t('challenges.seven_majors.mark_as_completed', 'Marquer comme terminé')}
          </Button>
        )}
        
        <Button 
          onClick={() => onAddToChallenge(col)}
          color="primary"
          variant="contained"
          disabled={isSelected || maxColsReached}
        >
          {t('challenges.seven_majors.add_to_challenge', 'Ajouter au défi')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColDetailsDialog;
