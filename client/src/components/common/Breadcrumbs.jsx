import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Breadcrumbs as MuiBreadcrumbs, 
  Link, 
  Typography, 
  Box,
  useTheme 
} from '@mui/material';
import { 
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon 
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Composant de fil d'Ariane amélioré
 * Affiche un chemin de navigation hiérarchique avec animations
 * @param {Object} props - Les propriétés du composant
 * @param {Array} props.crumbs - Les éléments du fil d'Ariane [{path, label}]
 */
const Breadcrumbs = ({ crumbs }) => {
  const theme = useTheme();

  // Si pas de fil d'Ariane à afficher
  if (!crumbs || crumbs.length <= 1) return null;

  // Animation variants pour les éléments
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: i => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2
      }
    })
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      style={{ overflow: 'hidden' }}
    >
      <MuiBreadcrumbs
        separator={
          <NavigateNextIcon 
            fontSize="small" 
            sx={{ color: 'text.secondary', mt: 0.2 }}
          />
        }
        aria-label="fil d'ariane"
        sx={{
          py: 0.5,
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
            overflowX: 'auto',
            msOverflowStyle: 'none', // IE and Edge
            scrollbarWidth: 'none', // Firefox
            '&::-webkit-scrollbar': { // Chrome, Safari, Opera
              display: 'none'
            }
          }
        }}
      >
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <motion.div
              key={crumb.path}
              custom={index}
              variants={itemVariants}
              style={{ whiteSpace: 'nowrap' }}
            >
              {isLast ? (
                <Typography 
                  color="text.primary" 
                  variant="body2" 
                  fontWeight={600}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  {index === 0 && <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  component={RouterLink}
                  color="inherit"
                  to={crumb.path}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    '&:hover': {
                      color: theme.palette.primary.main,
                      textDecoration: 'none'
                    }
                  }}
                  underline="hover"
                  variant="body2"
                >
                  {index === 0 && <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  {crumb.label}
                </Link>
              )}
            </motion.div>
          );
        })}
      </MuiBreadcrumbs>
    </motion.div>
  );
};

export default Breadcrumbs;
