import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box
} from '@mui/material';
import {
  SortByAlpha,
  StarRate,
  AccessTime,
  ThumbUp
} from '@mui/icons-material';

/**
 * Menu de tri pour les avis
 * 
 * @param {Object} props - Propriétés du composant
 * @param {HTMLElement} props.anchorEl - Élément d'ancrage du menu
 * @param {Function} props.onClose - Fonction appelée à la fermeture du menu
 * @param {Function} props.onApply - Fonction appelée lors de l'application d'un tri
 * @param {string} props.currentSort - Tri actuellement appliqué
 */
const ReviewSortMenu = ({ anchorEl, onClose, onApply, currentSort }) => {
  // Options de tri
  const sortOptions = [
    { value: 'date_desc', label: 'Plus récents', icon: <AccessTime /> },
    { value: 'date_asc', label: 'Plus anciens', icon: <AccessTime /> },
    { value: 'rating_desc', label: 'Meilleures notes', icon: <StarRate /> },
    { value: 'rating_asc', label: 'Notes les plus basses', icon: <StarRate /> },
    { value: 'likes_desc', label: 'Plus populaires', icon: <ThumbUp /> },
    { value: 'alpha_asc', label: 'A à Z', icon: <SortByAlpha /> }
  ];

  // Gérer la sélection d'une option
  const handleSelect = (value) => {
    onApply(value);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        elevation: 3,
        sx: { 
          minWidth: 200,
          maxWidth: 300,
          borderRadius: 2
        }
      }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Trier par
        </Typography>
      </Box>
      
      <Divider />
      
      {sortOptions.map((option) => (
        <MenuItem
          key={option.value}
          onClick={() => handleSelect(option.value)}
          selected={currentSort === option.value}
          sx={{ 
            py: 1,
            '&.Mui-selected': {
              backgroundColor: 'action.selected',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }
          }}
        >
          <ListItemIcon>
            {option.icon}
          </ListItemIcon>
          <ListItemText primary={option.label} />
        </MenuItem>
      ))}
    </Menu>
  );
};

export default ReviewSortMenu;
