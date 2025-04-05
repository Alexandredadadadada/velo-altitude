import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, IconButton, Button, Menu, MenuItem, Tooltip } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// Import widgets
import MiniFTPCalculator from '../widgets/MiniFTPCalculator';
import MiniCol3DVisualization from '../widgets/MiniCol3DVisualization';
import MiniNutritionCalculator from '../widgets/MiniNutritionCalculator';
import MiniWeatherMap from '../widgets/MiniWeatherMap';
import MiniChallengeTracker from '../widgets/MiniChallengeTracker';

// Widget definitions
const WIDGET_COMPONENTS = {
  'mini-ftp-calculator': MiniFTPCalculator,
  'mini-col-3d-visualization': MiniCol3DVisualization,
  'mini-nutrition-calculator': MiniNutritionCalculator,
  'mini-weather-map': MiniWeatherMap,
  'mini-challenge-tracker': MiniChallengeTracker,
};

const AVAILABLE_WIDGETS = [
  { id: 'mini-ftp-calculator', name: 'FTP Calculator', description: 'Visualisation rapide des zones d\'entraînement', icon: '🔢' },
  { id: 'mini-col-3d-visualization', name: 'Col 3D', description: 'Aperçu 3D des cols favoris', icon: '🏔️' },
  { id: 'mini-nutrition-calculator', name: 'Nutrition', description: 'Calculateur nutritionnel simplifié', icon: '🥗' },
  { id: 'mini-weather-map', name: 'Weather', description: 'Météo des cols populaires', icon: '☀️' },
  { id: 'mini-challenge-tracker', name: 'Challenges', description: 'Suivi des défis en cours', icon: '🏆' },
];

// Helper function to reorder the widgets
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const WidgetManager = () => {
  const { t } = useTranslation();
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // Load user widget preferences from localStorage or use defaults
    const savedWidgets = localStorage.getItem('dashboardWidgets');
    if (savedWidgets) {
      setActiveWidgets(JSON.parse(savedWidgets));
    } else {
      // Default widgets configuration
      setActiveWidgets([
        { id: 'mini-challenge-tracker', position: 0 },
        { id: 'mini-ftp-calculator', position: 1 },
        { id: 'mini-weather-map', position: 2 },
      ]);
    }
  }, []);

  // Save widget configuration to localStorage when it changes
  useEffect(() => {
    if (activeWidgets.length > 0) {
      localStorage.setItem('dashboardWidgets', JSON.stringify(activeWidgets));
    }
  }, [activeWidgets]);

  const handleAddWidgetClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddWidget = (widgetId) => {
    const widgetExists = activeWidgets.some(widget => widget.id === widgetId);
    if (!widgetExists) {
      const newWidgets = [...activeWidgets, { id: widgetId, position: activeWidgets.length }];
      setActiveWidgets(newWidgets);
    }
    handleMenuClose();
  };

  const handleRemoveWidget = (widgetId) => {
    const newWidgets = activeWidgets.filter(widget => widget.id !== widgetId)
      .map((widget, index) => ({ ...widget, position: index }));
    setActiveWidgets(newWidgets);
  };

  const handleDragEnd = (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    // Reorder the widgets based on drag result
    const reorderedWidgets = reorder(
      activeWidgets,
      result.source.index,
      result.destination.index
    ).map((widget, index) => ({ ...widget, position: index }));

    setActiveWidgets(reorderedWidgets);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Filter available widgets to only show those not already added
  const availableToAdd = AVAILABLE_WIDGETS.filter(widget => 
    !activeWidgets.some(active => active.id === widget.id)
  );

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          {t('dashboard')}
        </Typography>
        <Box>
          <Tooltip title={isEditMode ? t('saveLayout') : t('editLayout')}>
            <IconButton onClick={toggleEditMode} color={isEditMode ? "primary" : "default"}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddWidgetClick}
            disabled={availableToAdd.length === 0}
            sx={{ ml: 1 }}
          >
            {t('addWidget')}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {availableToAdd.map((widget) => (
              <MenuItem key={widget.id} onClick={() => handleAddWidget(widget.id)}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ mr: 1, fontSize: '1.2rem' }}>{widget.icon}</Box>
                  <Box>
                    <Typography variant="body1">{widget.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {widget.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets" direction="horizontal">
          {(provided) => (
            <Grid 
              container 
              spacing={2} 
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {activeWidgets
                .sort((a, b) => a.position - b.position)
                .map((widget, index) => {
                  const WidgetComponent = WIDGET_COMPONENTS[widget.id];
                  const widgetInfo = AVAILABLE_WIDGETS.find(w => w.id === widget.id);
                  
                  return (
                    <Draggable
                      key={widget.id}
                      draggableId={widget.id}
                      index={index}
                      isDragDisabled={!isEditMode}
                    >
                      {(provided, snapshot) => (
                        <Grid 
                          item 
                          xs={12} 
                          sm={6} 
                          md={4}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{
                            transition: 'transform 0.2s ease',
                            transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                            zIndex: snapshot.isDragging ? 1 : 0,
                          }}
                        >
                          <Paper 
                            elevation={snapshot.isDragging ? 6 : 1}
                            sx={{ 
                              position: 'relative',
                              height: '100%',
                              '&:hover': {
                                '& .widget-controls': {
                                  opacity: 1,
                                }
                              }
                            }}
                          >
                            {isEditMode && (
                              <Box 
                                className="widget-controls"
                                sx={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  right: 0,
                                  padding: 0.5,
                                  zIndex: 10,
                                  display: 'flex',
                                  opacity: snapshot.isDragging ? 1 : 0.5,
                                  transition: 'opacity 0.2s ease',
                                }}
                              >
                                <IconButton 
                                  size="small" 
                                  {...provided.dragHandleProps}
                                  sx={{ cursor: 'grab' }}
                                >
                                  <DragIndicatorIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleRemoveWidget(widget.id)}
                                  color="error"
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                            
                            {WidgetComponent && <WidgetComponent />}
                          </Paper>
                        </Grid>
                      )}
                    </Draggable>
                  );
                })}
              {provided.placeholder}
            </Grid>
          )}
        </Droppable>
      </DragDropContext>

      {activeWidgets.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {t('noDashboardWidgets')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('addWidgetsToCustomize')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddWidgetClick}
          >
            {t('addFirstWidget')}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default WidgetManager;
