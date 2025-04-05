import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Chip, Avatar, Badge } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import LandscapeIcon from '@mui/icons-material/Landscape';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';

// Styled components
const ChallengeProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 5,
  [`&.MuiLinearProgress-colorPrimary`]: {
    backgroundColor: theme.palette.grey[200],
  },
  [`& .MuiLinearProgress-bar`]: {
    borderRadius: 5,
    backgroundImage: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  },
}));

const ColChip = styled(Chip)(({ theme, completed }) => ({
  margin: '0 4px 4px 0',
  backgroundColor: completed ? theme.palette.success.light : theme.palette.grey[100],
  '& .MuiChip-avatar': {
    backgroundColor: completed ? theme.palette.success.main : theme.palette.grey[300],
    color: theme.palette.common.white,
  },
  '& .MuiChip-label': {
    fontWeight: completed ? 'bold' : 'normal',
  }
}));

const MiniChallengeTracker = ({ onClose }) => {
  const { t } = useTranslation();
  const [userChallenges, setUserChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  // Fetch user challenges on component mount
  useEffect(() => {
    // Mock data - replace with actual API call
    const mockChallenges = [
      {
        id: '1',
        name: 'Les 7 Majeurs des Alpes',
        description: 'Gravir les 7 cols majeurs des Alpes',
        progress: 3,
        totalCols: 7,
        cols: [
          { id: 'col1', name: 'Alpe d\'Huez', elevation: 1860, completed: true },
          { id: 'col2', name: 'Col du Galibier', elevation: 2642, completed: true },
          { id: 'col3', name: 'Col de la Madeleine', elevation: 2000, completed: true },
          { id: 'col4', name: 'Col du Glandon', elevation: 1924, completed: false },
          { id: 'col5', name: 'Col de la Croix de Fer', elevation: 2067, completed: false },
          { id: 'col6', name: 'Col d\'Izoard', elevation: 2360, completed: false },
          { id: 'col7', name: 'Col d\'Agnel', elevation: 2744, completed: false },
        ],
        createdAt: '2024-12-01',
        endDate: '2025-09-30'
      },
      {
        id: '2',
        name: 'Tour du Mont Blanc',
        description: 'Faire le tour du massif du Mont Blanc',
        progress: 1,
        totalCols: 3,
        cols: [
          { id: 'col8', name: 'Col de Voza', elevation: 1653, completed: true },
          { id: 'col9', name: 'Col de la Forclaz', elevation: 1527, completed: false },
          { id: 'col10', name: 'Col du Grand-Saint-Bernard', elevation: 2469, completed: false },
        ],
        createdAt: '2025-01-15',
        endDate: '2025-08-31'
      }
    ];
    
    setUserChallenges(mockChallenges);
    if (mockChallenges.length > 0) {
      setSelectedChallenge(mockChallenges[0]);
    }
  }, []);

  // Calculate days remaining in the challenge
  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleNextChallenge = () => {
    const currentIndex = userChallenges.findIndex(c => c.id === selectedChallenge.id);
    const nextIndex = (currentIndex + 1) % userChallenges.length;
    setSelectedChallenge(userChallenges[nextIndex]);
  };

  if (!selectedChallenge) {
    return (
      <Card sx={{ minWidth: 275, maxWidth: 350 }}>
        <CardContent>
          <Typography variant="h6">{t('noActiveChallenges')}</Typography>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (selectedChallenge.progress / selectedChallenge.totalCols) * 100;
  const daysRemaining = calculateDaysRemaining(selectedChallenge.endDate);

  return (
    <Card sx={{ minWidth: 275, maxWidth: 350 }}>
      <CardContent sx={{ padding: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div">
            {t('challengeTracker')}
          </Typography>
          <Badge 
            badgeContent={userChallenges.length} 
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={handleNextChallenge}
          >
            <EmojiEventsIcon color="action" />
          </Badge>
        </Box>
        
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {selectedChallenge.name}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedChallenge.progress} / {selectedChallenge.totalCols} {t('colsCompleted')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progressPercentage.toFixed(0)}%
            </Typography>
          </Box>
          <ChallengeProgressBar variant="determinate" value={progressPercentage} />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption">
              {selectedChallenge.cols.reduce((acc, col) => acc + col.elevation, 0).toLocaleString()}m D+
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PendingIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption">
              {daysRemaining} {t('daysRemaining')}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="subtitle2" gutterBottom>
          {t('colsInChallenge')}:
        </Typography>
        
        <Box sx={{ maxHeight: 80, overflowY: 'auto', mb: 1 }}>
          {selectedChallenge.cols.map(col => (
            <ColChip
              key={col.id}
              size="small"
              label={col.name}
              completed={col.completed}
              avatar={
                <Avatar>
                  {col.completed ? <CheckCircleIcon fontSize="small" /> : <LandscapeIcon fontSize="small" />}
                </Avatar>
              }
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MiniChallengeTracker;
