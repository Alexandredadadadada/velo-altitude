import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Divider
} from '@mui/material';
import TerainIcon from '@mui/icons-material/Terrain';

/**
 * Composant qui affiche les informations détaillées d'un col
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.col - Données du col
 */
const ColInfo = memo(({ col }) => {
  const { t } = useTranslation();

  if (!col) return null;

  return (
    <Card elevation={2}>
      <CardHeader 
        title={t('cols.col_info')}
        avatar={<TerainIcon />}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <List dense disablePadding>
          {/* Altitude */}
          <ListItem>
            <ListItemText 
              primary={t('cols.altitude')} 
              secondary={`${col.altitude}m`}
              primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
              secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
            />
          </ListItem>
          <Divider component="li" />
          
          {/* Localisation */}
          <ListItem>
            <ListItemText 
              primary={t('cols.location')} 
              secondary={`${col.location.region}, ${col.location.country}`}
              primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
              secondaryTypographyProps={{ variant: 'body1' }}
            />
          </ListItem>
          <Divider component="li" />
          
          {/* Difficulté */}
          {col.difficulty && (
            <>
              <ListItem>
                <ListItemText 
                  primary={t('cols.difficulty')} 
                  secondary={t(`cols.difficulty_${col.difficulty.toLowerCase()}`)}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ 
                    variant: 'body1',
                    color: 
                      col.difficulty === 'EASY' ? 'success.main' :
                      col.difficulty === 'MEDIUM' ? 'warning.main' :
                      col.difficulty === 'HARD' ? 'error.main' : 'text.primary'
                  }}
                />
              </ListItem>
              <Divider component="li" />
            </>
          )}
          
          {/* Période d'ouverture */}
          {col.openingMonths && (
            <>
              <ListItem>
                <ListItemText 
                  primary={t('cols.opening_period')} 
                  secondary={col.openingMonths}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              <Divider component="li" />
            </>
          )}
          
          {/* Surface de la route */}
          {col.roadSurface && (
            <>
              <ListItem>
                <ListItemText 
                  primary={t('cols.road_surface')} 
                  secondary={col.roadSurface}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              <Divider component="li" />
            </>
          )}
          
          {/* Niveau de trafic */}
          {col.trafficLevel && (
            <ListItem>
              <ListItemText 
                primary={t('cols.traffic')} 
                secondary={t(`cols.traffic_${col.trafficLevel.toLowerCase()}`)}
                primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1' }}
              />
            </ListItem>
          )}
        </List>
        
        {/* Description */}
        {col.description && (
          <>
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              {t('cols.description')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {col.description}
            </Typography>
          </>
        )}
        
        {/* Points d'intérêt */}
        {col.pointsOfInterest && col.pointsOfInterest.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              {t('cols.points_of_interest')}
            </Typography>
            <List dense>
              {col.pointsOfInterest.map(point => (
                <ListItem key={point.name}>
                  <ListItemText primary={point.name} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default ColInfo;
