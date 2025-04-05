import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardMedia, CardActionArea, Typography, Box, Chip } from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

/**
 * Composant d'affichage des actualités pour la page d'accueil
 * Affiche une carte d'actualité avec image, titre, date et catégorie
 */
const NewsCard = ({ news, onClick }) => {
  const { i18n } = useTranslation();
  
  // Format de date localisé
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'fr' ? fr : undefined;
    return format(date, 'dd MMMM yyyy', { locale });
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardActionArea 
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        onClick={() => onClick && onClick(news)}
      >
        <CardMedia
          component="img"
          height="140"
          image={news.imageUrl || '/images/placeholder.svg'}
          alt={news.title}
          sx={{ objectFit: 'cover' }}
          onError={(e) => {
            e.target.src = '/images/placeholder.svg';
          }}
        />
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 1 }}>
            <Chip 
              label={news.category} 
              size="small"
              color={
                news.category === 'Événement' ? 'primary' :
                news.category === 'Technique' ? 'secondary' :
                news.category === 'Compétition' ? 'success' :
                'default'
              }
              sx={{ mr: 1, mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatDate(news.date)}
            </Typography>
          </Box>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            {news.title}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {news.summary}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

NewsCard.propTypes = {
  news: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    content: PropTypes.string,
    date: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    category: PropTypes.string.isRequired,
    author: PropTypes.string,
    url: PropTypes.string
  }).isRequired,
  onClick: PropTypes.func
};

export default NewsCard;
