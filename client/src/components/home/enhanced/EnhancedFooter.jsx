import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

// Material UI
import {
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

// Icons
import {
  Facebook,
  Twitter,
  Instagram,
  YouTube,
  LocationOn,
  Email,
  Phone,
  KeyboardArrowUp
} from '@mui/icons-material';

const EnhancedFooter = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Footer links sections
  const footerSections = [
    {
      title: 'Modules',
      links: [
        { label: 'Les 7 Majeurs', path: '/7-majeurs' },
        { label: 'Module Cols', path: '/cols' },
        { label: 'Module d\'Entraînement', path: '/entrainement' },
        { label: 'Module Nutrition', path: '/nutrition' },
        { label: 'Dashboard Météo', path: '/meteo' },
      ]
    },
    {
      title: 'Communauté',
      links: [
        { label: 'Forums', path: '/forums' },
        { label: 'Événements', path: '/evenements' },
        { label: 'Groupes', path: '/groupes' },
        { label: 'Classements', path: '/classements' },
        { label: 'Parcours partagés', path: '/parcours' },
      ]
    },
    {
      title: 'À propos',
      links: [
        { label: 'Qui sommes-nous', path: '/a-propos' },
        { label: 'Blog', path: '/blog' },
        { label: 'Carrières', path: '/carrieres' },
        { label: 'Presse', path: '/presse' },
        { label: 'Contact', path: '/contact' },
      ]
    }
  ];
  
  return (
    <FooterWrapper>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo & Description */}
          <Grid item xs={12} md={4}>
            <Box>
              <FooterLogo>
                <img src="/assets/logo/velo-altitude-logo-white.png" alt="Velo-Altitude Logo" height="40" />
              </FooterLogo>
              
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: '300px' }}>
                Velo-Altitude est la plateforme de référence pour les cyclistes passionnés par les défis de montagne.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <SocialButton aria-label="Facebook">
                  <Facebook fontSize="small" />
                </SocialButton>
                
                <SocialButton aria-label="Twitter">
                  <Twitter fontSize="small" />
                </SocialButton>
                
                <SocialButton aria-label="Instagram">
                  <Instagram fontSize="small" />
                </SocialButton>
                
                <SocialButton aria-label="YouTube">
                  <YouTube fontSize="small" />
                </SocialButton>
              </Box>
              
              <ContactInfo>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ fontSize: 18, mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Annecy, France
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Email sx={{ fontSize: 18, mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    contact@velo-altitude.fr
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Phone sx={{ fontSize: 18, mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    +33 1 23 45 67 89
                  </Typography>
                </Box>
              </ContactInfo>
            </Box>
          </Grid>
          
          {/* Links Sections */}
          {footerSections.map((section) => (
            <Grid item xs={12} sm={6} md={isMobile ? 6 : 2.5} key={section.title}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 600,
                  mb: 2
                }}
              >
                {section.title}
              </Typography>
              
              <List disablePadding dense>
                {section.links.map((link) => (
                  <ListItem disablePadding key={link.label}>
                    <ListItemButton 
                      component={Link} 
                      to={link.path}
                      sx={{ 
                        py: 0.5,
                        px: 0,
                        color: 'rgba(255,255,255,0.7)',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: 'white'
                        }
                      }}
                    >
                      <ListItemText primary={link.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Grid>
          ))}
        </Grid>
        
        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} Velo-Altitude. Tous droits réservés.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link to="/mentions-legales" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                Mentions légales
              </Typography>
            </Link>
            
            <Link to="/confidentialite" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                Confidentialité
              </Typography>
            </Link>
            
            <Link to="/cgu" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                CGU
              </Typography>
            </Link>
          </Box>
          
          <BackToTopButton onClick={scrollToTop}>
            <KeyboardArrowUp />
          </BackToTopButton>
        </Box>
      </Container>
    </FooterWrapper>
  );
};

// Styled Components
const FooterWrapper = styled.footer`
  background-color: #0A1929;
  color: white;
  padding: 80px 0 40px;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 60px 0 40px;
  }
`;

const FooterLogo = styled.div`
  margin-bottom: 20px;
`;

const SocialButton = styled(IconButton)`
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  width: 36px;
  height: 36px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const ContactInfo = styled.div`
  margin-top: 20px;
`;

const BackToTopButton = styled(IconButton)`
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  width: 40px;
  height: 40px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

export default EnhancedFooter;
