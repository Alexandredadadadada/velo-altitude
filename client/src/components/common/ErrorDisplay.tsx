import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  retryAction?: () => void;
  details?: string;
}

/**
 * Composant pour afficher les erreurs de manière uniforme dans l'application
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = "Une erreur est survenue",
  message,
  retryAction,
  details
}) => {
  return (
    <Paper 
      elevation={3}
      sx={{
        p: 3,
        m: 2,
        maxWidth: '800px',
        mx: 'auto',
        textAlign: 'center',
        borderLeft: '4px solid #d32f2f'
      }}
    >
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <ErrorIcon color="error" sx={{ fontSize: 60 }} />
        
        <Typography variant="h5" component="h2" color="error" gutterBottom>
          {title}
        </Typography>
        
        <Typography variant="body1" gutterBottom>
          {message}
        </Typography>
        
        {details && (
          <Box 
            sx={{ 
              bgcolor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              width: '100%',
              overflowX: 'auto',
              my: 2
            }}
          >
            <Typography variant="body2" component="pre" sx={{ textAlign: 'left' }}>
              {details}
            </Typography>
          </Box>
        )}
        
        {retryAction && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={retryAction}
            sx={{ mt: 2 }}
          >
            Réessayer
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ErrorDisplay;
