import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  IconButton,
  useTheme,
  Button,
  Tooltip,
  Grid,
  Divider,
  LinearProgress
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import GetAppIcon from '@mui/icons-material/GetApp';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { NutritionPlan } from '../../../types';

interface PlanHeaderProps {
  plan: NutritionPlan;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onPrint: () => void;
  onExport: () => void;
}

const PlanHeader: React.FC<PlanHeaderProps> = ({
  plan,
  onEdit,
  onDelete,
  onShare,
  onPrint,
  onExport
}) => {
  const theme = useTheme();

  // Formater l'objectif pour l'affichage
  const formatGoal = (goal: string) => {
    switch (goal) {
      case 'weight_loss': return 'Perte de poids';
      case 'maintenance': return 'Maintien';
      case 'performance': return 'Performance';
      case 'endurance': return 'Endurance';
      case 'climbing': return 'Ascension de cols';
      default: return goal;
    }
  };

  // Formater le type de régime pour l'affichage
  const formatDietType = (dietType: string) => {
    switch (dietType) {
      case 'standard': return 'Standard';
      case 'vegetarian': return 'Végétarien';
      case 'vegan': return 'Végétalien';
      case 'pescatarian': return 'Pescétarien';
      case 'low_carb': return 'Faible en glucides';
      case 'keto': return 'Cétogène';
      case 'mediterranean': return 'Méditerranéen';
      default: return dietType;
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        mb: 3,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Barre de couleur selon l'objectif du plan */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          bgcolor: plan.targetGoal === 'climbing' 
            ? theme.palette.secondary.main 
            : plan.targetGoal === 'endurance' 
              ? theme.palette.info.main 
              : plan.targetGoal === 'performance' 
                ? theme.palette.warning.main 
                : plan.targetGoal === 'weight_loss' 
                  ? theme.palette.success.main 
                  : theme.palette.primary.main
        }}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {plan.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {plan.description}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip 
                icon={<DirectionsBikeIcon />} 
                label={formatGoal(plan.targetGoal)} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                icon={<RestaurantIcon />} 
                label={plan.dietaryRestrictions?.dietType ? formatDietType(plan.dietaryRestrictions.dietType) : 'Standard'} 
                color="secondary" 
                variant="outlined" 
              />
              <Chip 
                label={`Créé le ${new Date(plan.createdAt).toLocaleDateString('fr-FR')}`} 
                variant="outlined" 
                size="small"
              />
            </Stack>

            {plan.dietaryRestrictions?.allergies && plan.dietaryRestrictions.allergies.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Allergies:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {plan.dietaryRestrictions.allergies.map((allergen) => (
                    <Chip 
                      key={allergen} 
                      label={allergen} 
                      size="small" 
                      color="error" 
                      variant="outlined" 
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box 
            sx={{ 
              p: 2, 
              border: `1px solid ${theme.palette.divider}`, 
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: theme.palette.background.paper
            }}
          >
            <LocalFireDepartmentIcon 
              sx={{ 
                fontSize: 40, 
                color: theme.palette.warning.main,
                mb: 1
              }} 
            />
            <Typography variant="h4" fontWeight="bold" align="center">
              {plan.dailyCalories}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              calories par jour
            </Typography>

            <Divider sx={{ width: '100%', my: 2 }} />

            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle2" align="center" gutterBottom>
                Répartition des macronutriments
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Protéines: {plan.macroRatio.protein}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={plan.macroRatio.protein} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.primary.main
                    }
                  }} 
                />
                <Typography variant="caption" align="right" display="block">
                  {Math.round(plan.dailyCalories * plan.macroRatio.protein / 100 / 4)} g
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Glucides: {plan.macroRatio.carbs}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={plan.macroRatio.carbs} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.info.main
                    }
                  }} 
                />
                <Typography variant="caption" align="right" display="block">
                  {Math.round(plan.dailyCalories * plan.macroRatio.carbs / 100 / 4)} g
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" gutterBottom>
                  Lipides: {plan.macroRatio.fat}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={plan.macroRatio.fat} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.warning.main
                    }
                  }} 
                />
                <Typography variant="caption" align="right" display="block">
                  {Math.round(plan.dailyCalories * plan.macroRatio.fat / 100 / 9)} g
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          mt: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          pt: 2
        }}
      >
        <Button 
          startIcon={<EditIcon />} 
          onClick={onEdit}
          sx={{ mr: 1 }}
        >
          Modifier
        </Button>
        
        <Box>
          <Tooltip title="Partager">
            <IconButton onClick={onShare} size="small" sx={{ mr: 1 }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Exporter (PDF)">
            <IconButton onClick={onExport} size="small" sx={{ mr: 1 }}>
              <GetAppIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Imprimer">
            <IconButton onClick={onPrint} size="small" sx={{ mr: 1 }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Supprimer">
            <IconButton 
              onClick={onDelete} 
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default PlanHeader;
