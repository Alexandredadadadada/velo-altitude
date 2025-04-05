import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Material UI
import {
  Avatar,
  Box,
  Card,
  Container,
  Grid,
  Rating,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

// Icons
import {
  FormatQuote,
  NavigateNext,
  NavigateBefore,
  Verified
} from '@mui/icons-material';

// Sample testimonials data
const testimonials = [
  {
    id: 1,
    name: 'Thomas Laurent',
    role: 'Cycliste amateur',
    avatar: '/assets/avatars/user1.jpg',
    quote: "Velo-Altitude a complètement changé ma façon de préparer mes sorties en montagne. Les informations sur les cols et la météo sont d'une précision incroyable.",
    rating: 5,
    location: 'Annecy',
    verified: true,
    tags: ['Module Cols', 'Météo']
  },
  {
    id: 2,
    name: 'Sophie Dubois',
    role: 'Triathlète',
    avatar: '/assets/avatars/user2.jpg',
    quote: "Le module d'entraînement est exceptionnel. J'ai pu améliorer significativement mes performances en côte grâce aux plans personnalisés.",
    rating: 5,
    location: 'Lyon',
    verified: true,
    tags: ['Entraînement', 'Nutrition']
  },
  {
    id: 3,
    name: 'Marc Petit',
    role: 'Cycliste de route',
    avatar: '/assets/avatars/user3.jpg',
    quote: "Le défi des 7 Majeurs m'a motivé comme jamais. La communauté est super active et les fonctionnalités 3D apportent une dimension incroyable à la préparation.",
    rating: 4,
    location: 'Grenoble',
    verified: true,
    tags: ['7 Majeurs', '3D']
  },
  {
    id: 4,
    name: 'Julie Moreau',
    role: 'Cycliste de montagne',
    avatar: '/assets/avatars/user4.jpg',
    quote: "Indispensable pour tous les passionnés de cols ! Les prévisions météo spécifiques m'ont évité plusieurs sorties sous la pluie. L'interface est intuitive et agréable.",
    rating: 5,
    location: 'Chamonix',
    verified: true,
    tags: ['Météo', 'Communauté']
  },
  {
    id: 5,
    name: 'Nicolas Blanc',
    role: 'Cyclosportif',
    avatar: '/assets/avatars/user5.jpg',
    quote: "Je suis impressionné par la précision des données sur les cols. Les profils, pourcentages et conseils sont extrêmement utiles pour préparer des ascensions.",
    rating: 5,
    location: 'Briançon',
    verified: true,
    tags: ['Module Cols', 'Communauté']
  },
  {
    id: 6,
    name: 'Émilie Renard',
    role: 'Coach sportif',
    avatar: '/assets/avatars/user6.jpg',
    quote: "J'utilise Velo-Altitude avec mes athlètes. Les outils d'analyse et de suivi sont parfaits pour structurer leur progression en montagne.",
    rating: 4,
    location: 'Toulouse',
    verified: true,
    tags: ['Entraînement', 'Nutrition']
  }
];

// Custom navigation arrows for the slider
const PrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <ArrowButton className={className} $prev onClick={onClick}>
      <NavigateBefore fontSize="large" />
    </ArrowButton>
  );
};

const NextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <ArrowButton className={className} onClick={onClick}>
      <NavigateNext fontSize="large" />
    </ArrowButton>
  );
};

// Main component
const TestimonialsSection = ({ animationComplexity = 'high' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Animation controls
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  const controls = useAnimation();
  
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    } else {
      if (animationComplexity !== 'low') {
        controls.start('hidden');
      }
    }
  }, [controls, inView, animationComplexity]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };
  
  // Determine how many slides to show based on screen size
  const slidesToShow = isMobile ? 1 : isTablet ? 2 : 3;
  
  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: slidesToShow,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };
  
  // Get overall rating average
  const averageRating = testimonials.reduce((acc, curr) => acc + curr.rating, 0) / testimonials.length;
  
  return (
    <SectionWrapper id="testimonials">
      <Container>
        <SectionTitle>
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{ 
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              mb: 1
            }}
          >
            Ce qu'en disent nos utilisateurs
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 400,
              color: 'text.secondary',
              maxWidth: '800px',
              margin: '0 auto',
              mb: 3
            }}
          >
            Rejoignez notre communauté de passionnés de cyclisme
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 5 }}>
            <Rating value={averageRating} precision={0.5} readOnly size="large" />
            <Typography 
              variant="h5" 
              sx={{ 
                ml: 1,
                fontWeight: 500,
                color: '#1976d2'
              }}
            >
              {averageRating.toFixed(1)}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ ml: 1 }}
            >
              ({testimonials.length} avis)
            </Typography>
          </Box>
        </SectionTitle>
        
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          <TestimonialsSlider>
            <Slider {...sliderSettings}>
              {testimonials.map((testimonial) => (
                <div key={testimonial.id}>
                  <motion.div variants={itemVariants}>
                    <TestimonialCard>
                      <QuoteIcon>
                        <FormatQuote fontSize="large" />
                      </QuoteIcon>
                      
                      <Rating value={testimonial.rating} readOnly size="small" sx={{ mb: 2 }} />
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 3,
                          minHeight: '100px',
                          fontStyle: 'italic'
                        }}
                      >
                        "{testimonial.quote}"
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {testimonial.tags.map(tag => (
                          <TagChip key={tag}>
                            {tag}
                          </TagChip>
                        ))}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        />
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {testimonial.name}
                            </Typography>
                            {testimonial.verified && (
                              <Verified 
                                sx={{ 
                                  fontSize: 16, 
                                  ml: 0.5,
                                  color: '#1976d2'
                                }} 
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {testimonial.role}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {testimonial.location}
                          </Typography>
                        </Box>
                      </Box>
                    </TestimonialCard>
                  </motion.div>
                </div>
              ))}
            </Slider>
          </TestimonialsSlider>
          
          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500,
                fontSize: '1.1rem'
              }}
            >
              Rejoignez plus de 3000 cyclistes qui utilisent Velo-Altitude pour améliorer leur expérience en montagne
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </SectionWrapper>
  );
};

// Styled Components
const SectionWrapper = styled.section`
  padding: 120px 0;
  background-color: #f5f7fa;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/assets/patterns/topography.svg');
    background-repeat: repeat;
    background-size: 600px;
    opacity: 0.07;
    z-index: 0;
  }
`;

const SectionTitle = styled.div`
  text-align: center;
  margin-bottom: 60px;
  position: relative;
  z-index: 1;
`;

const TestimonialsSlider = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  
  .slick-track {
    display: flex;
    gap: 20px;
    
    .slick-slide {
      height: inherit;
      padding: 10px;
      
      & > div {
        height: 100%;
      }
    }
  }
  
  .slick-dots {
    bottom: -40px;
    
    li button:before {
      font-size: 12px;
    }
  }
`;

const TestimonialCard = styled(Card)`
  padding: 32px;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  
  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }
`;

const QuoteIcon = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  color: rgba(0, 0, 0, 0.05);
  transform: scaleX(-1);
  
  svg {
    font-size: 40px;
  }
`;

const TagChip = styled.span`
  display: inline-block;
  padding: 4px 10px;
  background-color: rgba(25, 118, 210, 0.08);
  color: #1976d2;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const ArrowButton = styled.div`
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  cursor: pointer;
  ${props => props.$prev ? 'left: -20px;' : 'right: -20px;'}
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #1976d2;
    color: white;
  }
  
  svg {
    font-size: 24px;
  }
  
  @media (max-width: 768px) {
    ${props => props.$prev ? 'left: -10px;' : 'right: -10px;'}
    width: 36px;
    height: 36px;
  }
`;

export default TestimonialsSection;
