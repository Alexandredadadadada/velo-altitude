import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, Typography, Grid, Box, 
  Button, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { CalendarMonth, LocationOn, People, DirectionsBike, Event } from '@mui/icons-material';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import OptimizedImage from '../common/OptimizedImage';

/**
 * EventsCalendar component for displaying and managing cycling events
 * @param {Object} props - Component properties
 * @param {string} props.userId - Current user ID
 */
const EventsCalendar = ({ userId }) => {
  const [events, setEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [calendarView, setCalendarView] = useState('calendar'); // 'calendar' or 'list'
  
  // Fetch events data on component mount
  useEffect(() => {
    const fetchEventsData = async () => {
      try {
        setLoading(true);
        // In a real implementation, these would be API calls
        // const allEventsResponse = await axios.get('/api/events');
        // const userEventsResponse = await axios.get(`/api/users/${userId}/events`);
        
        // Mock events data for development
        const mockEvents = generateMockEvents();
        setEvents(mockEvents);
        setUserEvents(mockEvents.filter(event => 
          event.participants.some(participant => participant.id === userId)
        ));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events data:', error);
        setLoading(false);
      }
    };
    
    fetchEventsData();
  }, [userId]);
  
  // Get dates for current month
  const getDaysInMonth = (month, year) => {
    const date = new Date(year, month, 1);
    const days = [];
    
    // Get day of week for first day (0-6, where 0 is Sunday)
    const firstDayOfWeek = date.getDay();
    
    // Add empty days to align first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  };
  
  // Filter events for specified date
  const getEventsForDate = (date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };
  
  // Handle viewing event details
  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };
  
  // Handle registering for an event
  const handleRegisterEvent = (eventId) => {
    // Update event participants (in a real app, this would be an API call)
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const isRegistered = event.participants.some(p => p.id === userId);
        
        if (isRegistered) {
          // Unregister
          return {
            ...event,
            participants: event.participants.filter(p => p.id !== userId)
          };
        } else {
          // Register
          return {
            ...event,
            participants: [
              ...event.participants,
              { id: userId, name: 'Jean Dupont' }
            ]
          };
        }
      }
      return event;
    }));
    
    // Update user events
    const updatedUserEvents = events
      .filter(event => event.participants.some(p => p.id === userId));
    setUserEvents(updatedUserEvents);
  };
  
  // Group events by month for list view
  const groupEventsByMonth = () => {
    const grouped = {};
    
    events.forEach(event => {
      const date = new Date(event.date);
      const monthYear = `${date.getMonth()}-${date.getFullYear()}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(event);
    });
    
    return Object.values(grouped);
  };
  
  if (loading) {
    return <div className="events-loading">Chargement des événements...</div>;
  }
  
  const days = getDaysInMonth(selectedMonth, selectedYear);
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/eventscalendar"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <div className="events-calendar">
      <div className="events-header">
        <Typography variant="h5" gutterBottom>
          Événements Cyclistes
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Mois</InputLabel>
              <Select
                value={selectedMonth}
                label="Mois"
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthNames.map((month, index) => (
                  <MenuItem key={index} value={index}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Année</InputLabel>
              <Select
                value={selectedYear}
                label="Année"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value={2025}>2025</MenuItem>
                <MenuItem value={2026}>2026</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box>
            <Button 
              variant={calendarView === 'calendar' ? 'contained' : 'outlined'}
              onClick={() => setCalendarView('calendar')}
              startIcon={<CalendarMonth />}
              size="small"
              sx={{ mr: 1 }}
            >
              Calendrier
            </Button>
            
            <Button 
              variant={calendarView === 'list' ? 'contained' : 'outlined'}
              onClick={() => setCalendarView('list')}
              startIcon={<Event />}
              size="small"
            >
              Liste
            </Button>
          </Box>
        </Box>
      </div>
      
      {userEvents.length > 0 && (
        <div className="user-events-section">
          <Typography variant="h6" gutterBottom>
            Mes événements
          </Typography>
          
          <Grid container spacing={3} mb={4}>
            {userEvents.slice(0, 3).map(event => (
              <Grid item xs={12} sm={6} md={4} key={`user-${event.id}`}>
                <EventCard 
                  event={event} 
                  userId={userId}
                  onViewEvent={handleViewEvent}
                  onRegisterEvent={handleRegisterEvent}
                />
              </Grid>
            ))}
            
            {userEvents.length > 3 && (
              <Grid item xs={12}>
                <Button color="primary">
                  Voir tous mes événements ({userEvents.length})
                </Button>
              </Grid>
            )}
          </Grid>
        </div>
      )}
      
      {calendarView === 'calendar' ? (
        <div className="calendar-view">
          <Grid container spacing={1} className="calendar-header">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, index) => (
              <Grid item xs={12/7} key={index}>
                <Typography variant="subtitle2" align="center">
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>
          
          <Grid container spacing={1} className="calendar-days">
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              
              return (
                <Grid item xs={12/7} key={index}>
                  {day && (
                    <Box 
                      className={`calendar-day ${dayEvents.length ? 'has-events' : ''}`}
                      p={1}
                      border={1}
                      borderColor="divider"
                      borderRadius={1}
                    >
                      <Typography variant="body2" align="right">
                        {day.getDate()}
                      </Typography>
                      
                      {dayEvents.map(event => (
                        <Box 
                          key={event.id}
                          className="calendar-event"
                          bgcolor={getEventTypeColor(event.type)}
                          p={0.5}
                          borderRadius={0.5}
                          mb={0.5}
                          onClick={() => handleViewEvent(event)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <Typography variant="caption" noWrap>
                            {event.title}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Grid>
              );
            })}
          </Grid>
        </div>
      ) : (
        <div className="list-view">
          {groupEventsByMonth().map((monthEvents, monthIndex) => (
            <Box key={monthIndex} mb={4}>
              <Typography variant="h6" gutterBottom>
                {monthNames[new Date(monthEvents[0].date).getMonth()]} {new Date(monthEvents[0].date).getFullYear()}
              </Typography>
              
              <Grid container spacing={3}>
                {monthEvents.map(event => (
                  <Grid item xs={12} sm={6} md={4} key={event.id}>
                    <EventCard 
                      event={event} 
                      userId={userId}
                      onViewEvent={handleViewEvent}
                      onRegisterEvent={handleRegisterEvent}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </div>
      )}
      
      {/* Event Detail Dialog */}
      <Dialog 
        open={showEventDialog} 
        onClose={() => setShowEventDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              {selectedEvent.title}
            </DialogTitle>
            
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box mb={3}>
                    <img 
                      src={selectedEvent.image} 
                      alt={selectedEvent.title}
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </Box>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarMonth color="primary" />
                      <Typography variant="body1">
                        {new Date(selectedEvent.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn color="primary" />
                      <Typography variant="body1">
                        {selectedEvent.location}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <DirectionsBike color="primary" />
                      <Typography variant="body1">
                        {selectedEvent.distance} km • {selectedEvent.elevationGain} m D+
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <People color="primary" />
                      <Typography variant="body1">
                        {selectedEvent.participants.length} participants
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {selectedEvent.description}
                  </Typography>
                  
                  <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      Type d'événement
                    </Typography>
                    <Chip 
                      label={selectedEvent.type} 
                      color={getEventTypeChipColor(selectedEvent.type)}
                    />
                  </Box>
                  
                  <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      Organisé par
                    </Typography>
                    <Typography variant="body1">
                      {selectedEvent.organizer}
                    </Typography>
                  </Box>
                  
                  {selectedEvent.website && (
                    <Box mt={2}>
                      <Typography variant="subtitle1" gutterBottom>
                        Site web
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        href={selectedEvent.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visiter le site
                      </Button>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button 
                variant="contained" 
                color={selectedEvent.participants.some(p => p.id === userId) ? 'error' : 'primary'}
                onClick={() => handleRegisterEvent(selectedEvent.id)}
              >
                {selectedEvent.participants.some(p => p.id === userId) 
                  ? 'Se désinscrire' 
                  : 'S\'inscrire'
                }
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
};

// Event card component
const EventCard = ({ event, userId, onViewEvent, onRegisterEvent }) => {
  const isRegistered = event.participants.some(p => p.id === userId);
  const eventDate = new Date(event.date);
  
  return (
    <Card className="event-card">
      <Box 
        className="event-card-image" 
        sx={{ 
          height: 140, 
          backgroundImage: `url(${event.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            bgcolor: getEventTypeColor(event.type),
            color: 'white',
            py: 0.5,
            px: 1,
            borderRadius: 1
          }}
        >
          <Typography variant="caption">
            {event.type}
          </Typography>
        </Box>
      </Box>
      
      <CardContent>
        <Typography variant="h6" gutterBottom noWrap>
          {event.title}
        </Typography>
        
        <Box display="flex" alignItems="center" mb={1}>
          <CalendarMonth fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2">
            {eventDate.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" mb={1}>
          <LocationOn fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2" noWrap>
            {event.location}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" mb={1}>
          <DirectionsBike fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2">
            {event.distance} km • {event.elevationGain} m D+
          </Typography>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => onViewEvent(event)}
          >
            Détails
          </Button>
          
          <Button 
            variant={isRegistered ? 'contained' : 'outlined'}
            color={isRegistered ? 'primary' : 'primary'}
            size="small"
            onClick={() => onRegisterEvent(event.id)}
          >
            {isRegistered ? 'Inscrit' : 'S\'inscrire'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Get color based on event type
const getEventTypeColor = (type) => {
  switch (type) {
    case 'Randonnée':
      return '#4CAF50';
    case 'Course':
      return '#F44336';
    case 'Gravel':
      return '#FF9800';
    case 'Cyclotourisme':
      return '#2196F3';
    default:
      return '#9C27B0';
  }
};

// Get chip color based on event type
const getEventTypeChipColor = (type) => {
  switch (type) {
    case 'Randonnée':
      return 'success';
    case 'Course':
      return 'error';
    case 'Gravel':
      return 'warning';
    case 'Cyclotourisme':
      return 'primary';
    default:
      return 'secondary';
  }
};

// Generate mock events for development
const generateMockEvents = () => {
  return [
    {
      id: 'event1',
      title: 'Grand Tour des Vosges',
      type: 'Randonnée',
      date: '2025-05-15T08:00:00Z',
      location: 'Gérardmer, Grand Est',
      distance: 120,
      elevationGain: 2500,
      description: 'Une journée complète à travers les plus beaux cols des Vosges. Parcours exigeant avec ravitaillements tous les 30km. Un événement incontournable pour les amateurs de montagne !',
      image: 'https://i.imgur.com/LmSY37z.jpg',
      organizer: 'Club Cycliste des Vosges',
      website: 'https://www.tourdesvosges.fr',
      participants: [
        { id: 'user2', name: 'Thomas Petit' },
        { id: 'user3', name: 'Emma Dupont' },
        { id: 'user123', name: 'Jean Dupont' }
      ]
    },
    {
      id: 'event2',
      title: 'Critérium de Strasbourg',
      type: 'Course',
      date: '2025-06-20T14:00:00Z',
      location: 'Strasbourg, Grand Est',
      distance: 80,
      elevationGain: 350,
      description: 'Course urbaine au cœur de Strasbourg. Circuit fermé à la circulation avec plusieurs catégories (débutants, confirmés, élite). Ambiance garantie !',
      image: 'https://i.imgur.com/pO5tM1S.jpg',
      organizer: 'Fédération Française de Cyclisme',
      website: 'https://www.criterium-strasbourg.fr',
      participants: [
        { id: 'user1', name: 'Sophie Martin' },
        { id: 'user4', name: 'Lucas Bernard' }
      ]
    },
    {
      id: 'event3',
      title: 'Gravel des Lacs',
      type: 'Gravel',
      date: '2025-07-05T09:00:00Z',
      location: 'Xonrupt-Longemer, Grand Est',
      distance: 95,
      elevationGain: 1800,
      description: 'Une aventure sur les chemins forestiers et les sentiers autour des lacs vosgiens. 60% off-road, 40% route. Vélo gravel ou VTT recommandé.',
      image: 'https://i.imgur.com/3G4Wj5u.jpg',
      organizer: 'Gravel Club Vosges',
      website: 'https://www.graveldeslacs.fr',
      participants: [
        { id: 'user2', name: 'Thomas Petit' },
        { id: 'user123', name: 'Jean Dupont' }
      ]
    },
    {
      id: 'event4',
      title: 'Tour d\'Alsace Cyclotouristique',
      type: 'Cyclotourisme',
      date: '2025-08-10T07:30:00Z',
      location: 'Colmar, Grand Est',
      distance: 320,
      elevationGain: 4500,
      description: 'Un voyage de 4 jours à travers l\'Alsace, ses villages pittoresques et ses cols. Hébergement et bagages pris en charge. Une expérience complète pour découvrir la région à vélo.',
      image: 'https://i.imgur.com/8ZTHScF.jpg',
      organizer: 'Office du Tourisme d\'Alsace',
      website: 'https://www.touralsacevelo.fr',
      participants: [
        { id: 'user3', name: 'Emma Dupont' },
        { id: 'user4', name: 'Lucas Bernard' }
      ]
    },
    {
      id: 'event5',
      title: 'Charity Ride Grand Est',
      type: 'Randonnée',
      date: '2025-09-05T10:00:00Z',
      location: 'Nancy, Grand Est',
      distance: 60,
      elevationGain: 500,
      description: 'Sortie caritative en soutien à la recherche contre le cancer. Parcours accessible à tous, ambiance conviviale et festive. Tous les bénéfices sont reversés à la fondation.',
      image: 'https://i.imgur.com/aFTKGYV.jpg',
      organizer: 'Association Rouler pour la Vie',
      website: 'https://www.charityride-grandest.fr',
      participants: [
        { id: 'user1', name: 'Sophie Martin' },
        { id: 'user2', name: 'Thomas Petit' },
        { id: 'user3', name: 'Emma Dupont' }
      ]
    }
  ];
};

export default EventsCalendar;
