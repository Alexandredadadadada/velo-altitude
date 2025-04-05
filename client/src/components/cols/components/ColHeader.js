import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Chip, 
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

/**
 * Composant d'en-tête pour le détail d'un col
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.col - Données du col
 * @param {boolean} props.isFavorite - Si le col est en favori
 * @param {boolean} props.compareMode - Si le mode de comparaison est actif
 * @param {Array} props.similarCols - Liste des cols similaires
 * @param {Function} props.toggleFavorite - Fonction pour basculer l'état favori
 * @param {Function} props.toggleCompareMode - Fonction pour basculer le mode comparaison
 * @param {Function} props.handleCompareColChange - Fonction de changement de col de comparaison
 * @param {Function} props.shareCol - Fonction pour partager le col
 */
const ColHeader = memo(({ 
  col, 
  isFavorite, 
  compareMode, 
  similarCols, 
  toggleFavorite, 
  toggleCompareMode, 
  handleCompareColChange, 
  shareCol 
}) => {
  const { t } = useTranslation();

  if (!col) return null;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Titre et badges */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {col.name}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip 
              label={`${col.altitude}m`} 
              color="primary" 
              size="small" 
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              label={col.location.region} 
              color="secondary" 
              size="small"
            />
            <Chip 
              label={col.location.country} 
              variant="outlined" 
              size="small"
            />
            {col.difficulty && (
              <Chip 
                label={t(`cols.difficulty_${col.difficulty.toLowerCase()}`)}
                color={
                  col.difficulty === 'EASY' ? 'success' :
                  col.difficulty === 'MEDIUM' ? 'warning' :
                  col.difficulty === 'HARD' ? 'error' : 'default'
                }
                size="small"
              />
            )}
          </Stack>
        </Box>
        
        {/* Boutons d'action */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant={isFavorite ? "contained" : "outlined"}
            color="warning"
            onClick={toggleFavorite}
            startIcon={<BookmarkIcon />}
            size="small"
          >
            {isFavorite ? t('cols.remove_favorite') : t('cols.add_favorite')}
          </Button>
          
          <Button
            variant={compareMode ? "contained" : "outlined"}
            color="primary"
            onClick={toggleCompareMode}
            startIcon={<CompareArrowsIcon />}
            disabled={similarCols.length === 0}
            size="small"
          >
            {compareMode ? t('cols.hide_comparison') : t('cols.compare')}
          </Button>
          
          <Button
            variant="outlined"
            color="success"
            onClick={shareCol}
            startIcon={<ShareIcon />}
            size="small"
          >
            {t('cols.share')}
          </Button>
        </Stack>
      </Box>
      
      {/* Contrôles de comparaison */}
      {compareMode && (
        <Box sx={{ mt: 2, mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="compare-col-label">{t('cols.compare_with')}</InputLabel>
            <Select
              labelId="compare-col-label"
              id="compare-col-select"
              onChange={handleCompareColChange}
              defaultValue={similarCols.length > 0 ? similarCols[0].id : ''}
              label={t('cols.compare_with')}
            >
              {similarCols.map(similarCol => (
                <MenuItem key={similarCol.id} value={similarCol.id}>
                  {similarCol.name} ({similarCol.altitude}m)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  );
});

export default ColHeader;
