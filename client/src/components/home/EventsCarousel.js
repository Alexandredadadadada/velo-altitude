import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, Card, CardContent, CardMedia, CardActionArea, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS, de, it } from 'date-fns/locale';

/**
 * Composant de carrousel d'événements pour la page d'accueil
 * Affiche les événements cyclistes à venir avec une interface interactive
 */
const EventsCarousel = ({ limit = 4 }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  // Configuration des locales pour date-fns
  const locales = {
    fr: fr,
    en: enUS,
    de: de,
    it: it,
    es: enUS // Fallback à l'anglais si l'espagnol n'est pas disponible
  };

  // Obtenir la locale actuelle
  const currentLocale = locales[i18n.language] || locales.fr;

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // En production, nous utiliserions l'API réelle
        // const response = await fetch('/.netlify/functions/events-upcoming');
        // const data = await response.json();
        
        // Pour le moment, utilisons des événements simulés
        const mockEvents = [
          {
            id: '1',
            title: 'Tour des Alpes 2025',
            description: 'Une semaine de cyclisme dans les Alpes françaises et italiennes',
            date: new Date(2025, 5, 15), // 15 juin 2025
            location: 'Alpes',
            imageUrl: '/images/events/alps-tour.jpg',
            registrationUrl: '/events/alps-tour-2025'
          },
          {
            id: '2',
            title: 'Challenge Pyrénées',
            description: 'Conquérir les cols mythiques des Pyrénées en 3 jours',
            date: new Date(2025, 6, 10), // 10 juillet 2025
            location: 'Pyrénées',
            imageUrl: '/images/events/pyrenees-challenge.jpg',
            registrationUrl: '/events/pyrenees-challenge-2025'
          },
          {
            id: '3',
            title: 'Journée Vosges Cyclisme',
            description: 'Une journée dédiée à l\'exploration des Vosges à vélo',
            date: new Date(2025, 7, 5), // 5 août 2025
            location: 'Vosges',
            imageUrl: '/images/events/vosges-day.jpg',
            registrationUrl: '/events/vosges-cycling-day-2025'
          },
          {
            id: '4',
            title: 'Grand Défi Alpes Suisses',
            description: 'Les plus beaux cols des Alpes suisses en un week-end',
            date: new Date(2025, 8, 20), // 20 septembre 2025
            location: 'Alpes Suisses',
            imageUrl: '/images/events/swiss-alps-challenge.jpg',
            registrationUrl: '/events/swiss-alps-grand-challenge-2025'
          },
          {
            id: '5',
            title: 'Randonnée des 7 Majeurs',
            description: 'Une randonnée épique passant par les 7 cols majeurs d\'Europe',
            date: new Date(2025, 9, 10), // 10 octobre 2025
            location: 'Europe',
            imageUrl: '/images/events/seven-majors-ride.jpg',
            registrationUrl: '/events/seven-majors-ride-2025'
          },
          {
            id: '6',
            title: 'Workshop Nutrition Cycliste',
            description: 'Atelier pratique sur la nutrition adaptée aux cyclistes de montagne',
            date: new Date(2025, 4, 25), // 25 mai 2025
            location: 'Paris',
            imageUrl: '/images/events/nutrition-workshop.jpg',
            registrationUrl: '/events/cyclist-nutrition-workshop-2025'
          }
        ];
        
        setEvents(mockEvents);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des événements:', err);
        setError(t('common.error'));
        setLoading(false);
      }
    };

    fetchEvents();
  }, [t]);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(events.length / limit);

  // Obtenir les événements pour la page actuelle
  const currentEvents = events.slice(currentPage * limit, (currentPage + 1) * limit);

  // Navigation dans le carrousel
  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  // Formater la date de l'événement
  const formatEventDate = (date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale: currentLocale
    });
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography>{t('common.loading')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          {t('home.upcomingEvents')}
        </Typography>
        <Box>
          <Button onClick={prevPage} disabled={totalPages <= 1}>
            &lt;
          </Button>
          <Button onClick={nextPage} disabled={totalPages <= 1}>
            &gt;
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {currentEvents.map((event) => (
          <Grid item xs={12} sm={6} md={3} key={event.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.shadows[10]
                }
              }}
            >
              <CardActionArea 
                component="a" 
                href={event.registrationUrl}
                sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={event.imageUrl}
                  alt={event.title}
                  onError={(e) => {
                    e.target.src = '/images/placeholder.svg';
                  }}
                />
                <CardContent sx={{ flex: 1 }}>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatEventDate(event.date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {event.location}
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {event.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

EventsCarousel.propTypes = {
  limit: PropTypes.number
};

export default EventsCarousel;
