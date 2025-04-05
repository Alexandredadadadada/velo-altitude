import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Material UI
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  useMediaQuery,
  useTheme
} from '@mui/material';

// Icons
import {
  DirectionsBike,
  ArrowForward,
  FilterHdr,
  Star
} from '@mui/icons-material';

const CTASection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  return (
    <SectionWrapper>
      <Container maxWidth="lg">
        <CTACard>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box>
                <Typography
                  variant="h3"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '1.8rem', md: '2.5rem' },
                    color: 'white'
                  }}
                >
                  Prêt à relever le défi des cols?
                </Typography>
                
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 400,
                    mb: 4,
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  Rejoignez Velo-Altitude dès aujourd'hui et accédez à tous les outils dont vous avez besoin pour conquérir les sommets.
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FeatureItem>
                      <FilterHdr fontSize="small" />
                      <Typography variant="body2">
                        Accès à +3000 cols cyclables
                      </Typography>
                    </FeatureItem>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FeatureItem>
                      <Star fontSize="small" />
                      <Typography variant="body2">
                        Relevez le défi des 7 Majeurs
                      </Typography>
                    </FeatureItem>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FeatureItem>
                      <DirectionsBike fontSize="small" />
                      <Typography variant="body2">
                        Plans d'entraînement personnalisés
                      </Typography>
                    </FeatureItem>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FeatureItem>
                      <DirectionsBike fontSize="small" />
                      <Typography variant="body2">
                        Communauté passionnée de cyclisme
                      </Typography>
                    </FeatureItem>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                  <Button
                    variant="contained"
                    size="large"
                    color="secondary"
                    onClick={() => navigate('/signup')}
                    sx={{
                      borderRadius: '50px',
                      px: 4,
                      py: isMobile ? 1 : 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      boxShadow: '0 8px 20px rgba(245, 124, 0, 0.3)',
                      backgroundColor: '#f57c00',
                      '&:hover': {
                        backgroundColor: '#e65100'
                      }
                    }}
                  >
                    S'inscrire gratuitement
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/login')}
                    endIcon={<ArrowForward />}
                    sx={{
                      borderRadius: '50px',
                      px: 4,
                      py: isMobile ? 1 : 1.5,
                      fontSize: '1.1rem',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Se connecter
                  </Button>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <CTAImage>
                <img 
                  src="/assets/images/cyclist-mountain.png" 
                  alt="Cycliste en montagne" 
                  width="100%"
                />
                
                <ImageDecoration className="dots-1" />
                <ImageDecoration className="dots-2" />
                <ImageDecoration className="circle" />
              </CTAImage>
            </Grid>
          </Grid>
        </CTACard>
      </Container>
    </SectionWrapper>
  );
};

// Styled Components
const SectionWrapper = styled.section`
  padding: 120px 0;
  background-color: #f5f7fa;
  
  @media (max-width: 768px) {
    padding: 80px 0;
  }
`;

const CTACard = styled(Card)`
  padding: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/assets/patterns/topography.svg');
    background-repeat: repeat;
    background-size: 300px;
    opacity: 0.05;
    z-index: 0;
  }
  
  @media (max-width: 768px) {
    padding: 32px 24px;
  }
`;

const FeatureItem = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
`;

const CTAImage = styled(Box)`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
    max-height: 320px;
    object-fit: contain;
  }
  
  .dots-1 {
    position: absolute;
    top: 20%;
    right: 10%;
    width: 100px;
    height: 100px;
    background-size: 10px 10px;
    background-image: radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px);
    z-index: 1;
    border-radius: 50%;
  }
  
  .dots-2 {
    position: absolute;
    bottom: 10%;
    left: 5%;
    width: 120px;
    height: 120px;
    background-size: 10px 10px;
    background-image: radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px);
    z-index: 1;
    border-radius: 50%;
  }
  
  .circle {
    position: absolute;
    top: 40%;
    left: 40%;
    transform: translate(-50%, -50%);
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
    z-index: 1;
  }
`;

const ImageDecoration = styled.div``;

export default CTASection;
