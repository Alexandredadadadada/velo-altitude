import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const SuggestedQueries = ({ queries, onSelectQuery }) => {
  const { t } = useTranslation();

  if (!queries || queries.length === 0) return null;

  return (
    <Box className="suggested-queries">
      <Typography variant="caption" color="textSecondary" className="suggestions-title">
        {t('chatbox.suggestedQueries')}
      </Typography>
      
      <Box className="queries-container">
        {queries.map((query, index) => (
          <Chip
            key={index}
            label={query}
            onClick={() => onSelectQuery(query)}
            size="small"
            className="query-chip"
            clickable
          />
        ))}
      </Box>
    </Box>
  );
};

export default SuggestedQueries;
