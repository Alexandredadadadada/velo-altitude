/**
 * Composant de grille responsive qui corrige les problèmes d'affichage sur petits écrans
 * Utilisé pour garantir un affichage correct sur tous les appareils
 */

import React from 'react';
import { Grid, GridProps } from '@mui/material';
import { styled } from '@mui/material/styles';

// Grille responsive avec corrections pour les petits écrans
export const ResponsiveGrid = styled(Grid)(({ theme }) => ({
  // Corrections pour les écrans très petits (mobile)
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    '& > .MuiGrid-item': {
      padding: theme.spacing(0.5),
    }
  },
  
  // Corrections pour les écrans moyens (tablette)
  [theme.breakpoints.down('md')]: {
    '& .MuiCard-root': {
      margin: theme.spacing(0.5, 0),
    }
  },
  
  // Corrections pour les conteneurs de graphiques
  '& .chart-container': {
    width: '100%',
    height: 'auto',
    minHeight: '300px',
    [theme.breakpoints.down('md')]: {
      minHeight: '250px',
    },
    [theme.breakpoints.down('sm')]: {
      minHeight: '200px',
    }
  },
  
  // Corrections pour les formulaires
  '& .MuiFormControl-root': {
    width: '100%',
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1),
    }
  },
  
  // Améliorations pour les tableaux sur mobile
  '& .MuiTable-root': {
    [theme.breakpoints.down('sm')]: {
      '& .MuiTableCell-root': {
        padding: theme.spacing(1, 0.5),
        fontSize: '0.75rem',
      }
    }
  },
  
  // Corrections pour les images
  '& img': {
    maxWidth: '100%',
    height: 'auto',
  }
}));

// Props type avec tous les props de Grid + props personnalisés
interface ResponsiveGridProps extends GridProps {
  fixedHeight?: boolean;
  equalHeight?: boolean;
  scrollable?: boolean;
  children: React.ReactNode;
}

/**
 * Composant ResponsiveGridContainer avec options supplémentaires
 */
export const ResponsiveGridContainer: React.FC<ResponsiveGridProps> = ({
  fixedHeight = false,
  equalHeight = false,
  scrollable = false,
  children,
  ...props
}) => {
  // Styles supplémentaires basés sur les props
  const additionalStyles: React.CSSProperties = {
    ...(fixedHeight && {
      height: '100%',
    }),
    ...(equalHeight && {
      display: 'flex',
      '& > .MuiGrid-item': {
        display: 'flex',
        '& > *': {
          width: '100%',
        }
      }
    }),
    ...(scrollable && {
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'thin',
    })
  };

  return (
    <ResponsiveGrid container {...props} style={{ ...props.style, ...additionalStyles }}>
      {children}
    </ResponsiveGrid>
  );
};

/**
 * Composant ResponsiveGridItem avec options supplémentaires
 */
export const ResponsiveGridItem: React.FC<ResponsiveGridProps> = ({
  children,
  ...props
}) => {
  return (
    <Grid item {...props}>
      {children}
    </Grid>
  );
};

/**
 * Composant ChartContainer pour assurer la responsivité des graphiques
 */
export const ChartContainer = styled('div')(({ theme }) => ({
  width: '100%',
  height: 'auto',
  minHeight: '300px',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    minHeight: '250px',
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: '200px',
    marginBottom: theme.spacing(1),
  }
}));

/**
 * Composant FormContainer pour assurer la responsivité des formulaires
 */
export const FormContainer = styled('div')(({ theme }) => ({
  width: '100%',
  '& .MuiFormControl-root': {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1.5),
    }
  },
  '& .MuiButton-root': {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      marginBottom: theme.spacing(1),
    }
  },
  '& .MuiInputLabel-root': {
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.875rem',
    }
  },
  '& .MuiSelect-select': {
    [theme.breakpoints.down('sm')]: {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    }
  }
}));

export default ResponsiveGrid;
