import React, { memo } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, 
  Button, Alert, Pagination
} from '@mui/material';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkedAlt, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';
import { styled } from '@mui/material/styles';
import { useCommunity } from '../../contexts/CommunityContext';
import { useNotification } from '../../components/common/NotificationSystem';
import { useFeatureFlags } from '../../services/featureFlags';

// Styles personnalisés
const StyledCardHeader = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default
}));

const EventCard = styled(Card)(({ theme, joined }) => ({
  marginBottom: theme.spacing(2),
  border: joined ? `1px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: theme.shadows[3]
  },
  position: 'relative',
  '&::before': joined ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette.success.main
  } : {}
}));

// Composant pour afficher une carte d'événement
const EventCardItem = memo(({ event, formatDate, handleJoinEvent, handleLeaveEvent }) => {
  const { notify } = useNotification();
  
  const handleJoin = (eventId) => {
    try {
      handleJoinEvent(eventId);
    } catch (error) {
      notify.error('Une erreur est survenue lors de l\'inscription à l\'événement', error);
    }
  };
  
  const handleLeave = (eventId) => {
    try {
      handleLeaveEvent(eventId);
    } catch (error) {
      notify.error('Une erreur est survenue lors de l\'annulation de votre participation', error);
    }
  };
  
  return (
    <EventCard 
      joined={event.joined}
      tabIndex={0}
      aria-label={`Événement: ${event.title} à ${event.location} le ${formatDate(event.date)}`}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" component="h3">{event.title}</Typography>
            <Box sx={{ mb: 2 }}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 3 }}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '4px', color: 'text.secondary' }} />
                <Typography variant="body2" component="span">{formatDate(event.date)} | {event.time}</Typography>
              </Box>
              
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faMapMarkedAlt} style={{ marginRight: '4px', color: 'text.secondary' }} />
                <Typography variant="body2" component="span">{event.location}</Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" paragraph>
              {event.description}
            </Typography>
          </Box>
          <Box sx={{ px: 3, py: 1, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="body1" fontWeight="bold">{event.distance} km</Typography>
            <Typography variant="body2">{event.participants} participants</Typography>
            {event.elevation && (
              <Typography variant="body2">{event.elevation}m D+</Typography>
            )}
          </Box>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Organisé par {event.organizer}
          </Typography>
          
          {event.joined ? (
            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              onClick={() => handleLeave(event.id)}
              aria-label={`Annuler votre participation à l'événement ${event.title}`}
            >
              Annuler participation
            </Button>
          ) : (
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleJoin(event.id)}
              aria-label={`Participer à l'événement ${event.title}`}
            >
              Participer
            </Button>
          )}
        </Box>
      </CardContent>
    </EventCard>
  );
});

// Section Événements complète
const EventsSection = () => {
  const { upcomingEvents, formatDate, handleJoinEvent, handleLeaveEvent, loading } = useCommunity();
  const { isFeatureEnabled } = useCommunity();
  
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Card>
          <StyledCardHeader 
            title={
              <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '8px' }} />
                Événements à venir
              </Typography>
            }
            aria-labelledby="evenements-a-venir-title"
          />
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<FontAwesomeIcon icon={faFilter} />}
                  sx={{ mr: 1 }}
                  aria-label="Filtrer les événements"
                >
                  Filtrer
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<FontAwesomeIcon icon={faSort} />}
                  aria-label="Trier les événements"
                >
                  Trier
                </Button>
              </Box>
              
              {isFeatureEnabled('enableSocialSharing') && (
                <Button 
                  variant="contained" 
                  size="small"
                  aria-label="Créer un nouvel événement"
                >
                  Créer un événement
                </Button>
              )}
            </Box>
            
            {upcomingEvents.length > 0 ? (
              <div className="upcoming-events">
                {upcomingEvents.map((event, index) => (
                  <EventCardItem 
                    key={index}
                    event={event}
                    formatDate={formatDate}
                    handleJoinEvent={handleJoinEvent}
                    handleLeaveEvent={handleLeaveEvent}
                  />
                ))}
                
                <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
                  <Pagination count={3} color="primary" />
                </Box>
              </div>
            ) : (
              <Alert severity="info">
                Aucun événement à venir n'est planifié. Les événements prévus apparaîtront ici.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default EventsSection;
