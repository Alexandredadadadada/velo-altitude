import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider, 
  Chip, 
  IconButton, 
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  DirectionsBike,
  Check,
  Assignment,
  Science
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Carte d'information sur une zone d'entraînement spécifique
 * Affiche les détails de la zone et ses bénéfices
 */
const ZoneGuideCard = ({ zone, isSelected, onClick, viewMode = 'detailed' }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  // Gestion de l'expansion de la carte
  const handleExpandClick = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  // Style pour l'icône d'expansion
  const expandIconStyle = {
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  };
  
  // Rendu du contenu compact (version simplifiée)
  const renderCompactContent = () => (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 1
      }}>
        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
          Zone {zone.id}
        </Typography>
        <Chip 
          label={`${zone.min}-${zone.max} W`} 
          size="small" 
          sx={{ 
            bgcolor: alpha(zone.color, 0.2),
            color: zone.color,
            fontWeight: 'bold'
          }}
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" noWrap>
        {zone.description}
      </Typography>
    </Box>
  );
  
  // Rendu du contenu détaillé
  const renderDetailedContent = () => (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 1,
        pb: 1,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
      }}>
        <Box sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: alpha(zone.color, 0.2),
          color: zone.color,
          mr: 2
        }}>
          {zone.icon || <DirectionsBike />}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
            Zone {zone.id}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {zone.name.split('-')[1].trim()}
          </Typography>
        </Box>
        <Chip 
          label={`${zone.min}-${zone.max} W`} 
          size="small" 
          sx={{ 
            bgcolor: alpha(zone.color, 0.2),
            color: zone.color,
            fontWeight: 'bold'
          }}
        />
      </Box>
      
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        {zone.description}
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 1
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Plus de détails
        </Typography>
        <IconButton
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="afficher plus"
          size="small"
          sx={{ p: 0.5 }}
        >
          <ExpandMoreIcon sx={expandIconStyle} />
        </IconButton>
      </Box>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Bénéfices
          </Typography>
          <List dense disablePadding>
            {zone.benefits.map((benefit, index) => (
              <ListItem key={index} disablePadding sx={{ pb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Check fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary={benefit} 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ my: 1.5 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Exemples d'entraînements
          </Typography>
          <List dense disablePadding>
            {zone.exampleWorkouts.map((workout, index) => (
              <ListItem key={index} disablePadding sx={{ pb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Assignment fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={workout} 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ my: 1.5 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Adaptations physiologiques
          </Typography>
          <List dense disablePadding>
            {zone.physiologicalAdaptations.map((adaptation, index) => (
              <ListItem key={index} disablePadding sx={{ pb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Science fontSize="small" color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary={adaptation} 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Collapse>
    </Box>
  );
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isSelected ? `0 0 0 2px ${zone.color}` : theme.shadows[1],
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: `0 0 0 2px ${zone.color}`,
          transform: 'translateY(-2px)'
        },
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: zone.color
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        {viewMode === 'compact' ? renderCompactContent() : renderDetailedContent()}
      </CardContent>
    </Card>
  );
};

export default ZoneGuideCard;
