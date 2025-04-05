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
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Terrain as TerrainIcon,
  Public as GlobeIcon,
  WbSunny as SunnyIcon,
  Cloud as CloudIcon,
  Timeline as TimelineIcon
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
                src={col.image || '/images/cols/placeholder.jpg'} 
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
              {t('cols.details')}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GlobeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.location')}:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {col.region}, {col.country}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TerrainIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.altitude')}:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {col.altitude} m
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimelineIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.length')}:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {col.length} km
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimelineIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.avg_gradient')}:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {col.gradient}%
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimelineIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.max_gradient')}:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {col.maxGradient || '-'}%
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimelineIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('cols.difficulty')}:
                  </Typography>
                </Box>
                <Chip 
                  label={col.difficulty} 
                  size="small"
                  color={
                    col.difficulty === 'HC' ? 'error' :
                    col.difficulty === '1' ? 'warning' :
                    col.difficulty === '2' ? 'success' :
                    col.difficulty === '3' ? 'info' : 'default'
                  }
                />
              </Grid>
            </Grid>
            
            {/* Description */}
            {col.description && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('cols.description')}
                </Typography>
                <Typography variant="body2" paragraph>
                  {col.description}
                </Typography>
              </Box>
            )}
            
            {/* Météo */}
            {weatherData && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('cols.current_weather')}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {weatherData.isGoodWeather ? (
                        <SunnyIcon sx={{ mr: 1, color: 'warning.main' }} />
                      ) : (
                        <CloudIcon sx={{ mr: 1, color: 'info.main' }} />
                      )}
                      <Typography variant="body2">
                        {weatherData.condition}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {t('cols.temperature')}: {weatherData.temperature}°C
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {t('cols.wind')}: {weatherData.wind} km/h
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {t('cols.humidity')}: {weatherData.humidity}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Histoires et anecdotes */}
            {col.stories && col.stories.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('cols.stories')}
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
                  {t('cols.points_of_interest')}
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
                {t('cols.profile_visualization')}
              </Typography>
              
              {/* Utilisation du composant de visualisation 3D existant */}
              <ColVisualization3D 
                colId={col.id} 
                colData={col.elevationData || []} 
                pointsOfInterest={col.pointsOfInterest || []}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('common.close')}
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
            {t('common.export')}
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
              ? t('challenges.seven_majors.completed') 
              : t('challenges.seven_majors.mark_as_completed')}
          </Button>
        )}
        
        <Button 
          onClick={() => onAddToChallenge(col)}
          color="primary"
          variant="contained"
          disabled={isSelected || maxColsReached}
        >
          {t('challenges.seven_majors.add_to_challenge')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColDetailsDialog;
