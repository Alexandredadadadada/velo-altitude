import React, { useState } from 'react';
import { Card, CardContent, Typography, Slider, Box, TextField, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

// Styled components
const ZoneBar = styled(Box)(({ theme, zone }) => ({
  height: '20px',
  borderRadius: '4px',
  margin: '2px 0',
  background: zone === 1 ? '#5CE1E6' : 
              zone === 2 ? '#7ED957' : 
              zone === 3 ? '#FFDE59' : 
              zone === 4 ? '#FF914D' : 
              zone === 5 ? '#FF5757' : 
              zone === 6 ? '#8C52FF' : '#C252FF',
  transition: 'all 0.3s ease',
  position: 'relative',
  '&:hover': {
    transform: 'scaleY(1.1)',
  }
}));

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[3],
    border: `1px solid ${theme.palette.divider}`,
    padding: '8px',
    fontSize: '0.75rem',
  },
}));

const MiniFTPCalculator = ({ onClose }) => {
  const { t } = useTranslation();
  const [ftp, setFtp] = useState(250);

  // Calculate zones based on FTP
  const calculateZones = (ftpValue) => ([
    { zone: 1, name: 'Recovery', min: Math.round(ftpValue * 0.55), max: Math.round(ftpValue * 0.75) },
    { zone: 2, name: 'Endurance', min: Math.round(ftpValue * 0.76), max: Math.round(ftpValue * 0.90) },
    { zone: 3, name: 'Tempo', min: Math.round(ftpValue * 0.91), max: Math.round(ftpValue * 1.05) },
    { zone: 4, name: 'Threshold', min: Math.round(ftpValue * 1.06), max: Math.round(ftpValue * 1.20) },
    { zone: 5, name: 'VO2 Max', min: Math.round(ftpValue * 1.21), max: Math.round(ftpValue * 1.40) },
    { zone: 6, name: 'Anaerobic', min: Math.round(ftpValue * 1.41), max: Math.round(ftpValue * 1.70) },
    { zone: 7, name: 'Neuromuscular', min: Math.round(ftpValue * 1.71), max: Math.round(ftpValue * 2.20) },
  ]);

  const zones = calculateZones(ftp);

  const handleFtpChange = (event) => {
    const newValue = parseInt(event.target.value, 10);
    if (!isNaN(newValue)) {
      setFtp(newValue > 0 ? newValue : 1);
    }
  };

  const handleSliderChange = (event, newValue) => {
    setFtp(newValue);
  };

  return (
    <Card sx={{ minWidth: 275, maxWidth: 350 }}>
      <CardContent sx={{ padding: 2 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {t('ftpCalculator')}
        </Typography>
        
        <Box sx={{ mt: 2, mb: 3 }}>
          <TextField
            label={t('yourFTP')}
            type="number"
            size="small"
            value={ftp}
            onChange={handleFtpChange}
            sx={{ width: '100%', mb: 1 }}
            inputProps={{ min: 1, max: 500 }}
          />
          <Slider
            value={ftp}
            onChange={handleSliderChange}
            min={100}
            max={400}
            step={1}
            aria-label="FTP"
            sx={{ mt: 1 }}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('trainingZones')}
          </Typography>
          {zones.map((zone) => (
            <StyledTooltip 
              key={zone.zone}
              title={`${zone.name}: ${zone.min}-${zone.max} watts`}
              placement="right"
              arrow
            >
              <ZoneBar 
                zone={zone.zone} 
                sx={{ 
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  pl: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold', textShadow: '0px 0px 2px rgba(0,0,0,0.5)' }}>
                  Z{zone.zone}
                </Typography>
              </ZoneBar>
            </StyledTooltip>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MiniFTPCalculator;
