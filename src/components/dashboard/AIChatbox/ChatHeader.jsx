import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem,
  Divider
} from '@mui/material';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Maximize';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TranslateIcon from '@mui/icons-material/Translate';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useTranslation } from 'react-i18next';

const ChatHeader = ({ 
  onMinimize, 
  isMinimized, 
  onDarkModeToggle, 
  isDarkMode, 
  onLanguageToggle, 
  onExport, 
  onClear 
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action) => {
    handleClose();
    switch (action) {
      case 'darkMode':
        onDarkModeToggle();
        break;
      case 'language':
        onLanguageToggle();
        break;
      case 'export':
        onExport();
        break;
      case 'clear':
        onClear();
        break;
      default:
        break;
    }
  };

  return (
    <Box className="chat-header">
      <Box className="header-title">
        <Box 
          component="img" 
          src="/assets/images/logo-ai.png" 
          alt="AI Assistant" 
          sx={{ width: 24, height: 24, marginRight: 1 }} 
        />
        <Typography variant="subtitle1" component="span">
          {t('chatbox.title')}
        </Typography>
      </Box>
      
      <Box className="header-actions">
        {!isMinimized && (
          <Tooltip title={t('chatbox.options')}>
            <IconButton
              size="small"
              onClick={handleClick}
              aria-controls={open ? 'chat-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title={isMinimized ? t('chatbox.maximize') : t('chatbox.minimize')}>
          <IconButton size="small" onClick={onMinimize}>
            {isMinimized ? <MaximizeIcon fontSize="small" /> : <MinimizeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      
      <Menu
        id="chat-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'menu-button',
        }}
      >
        <MenuItem onClick={() => handleMenuAction('darkMode')}>
          {isDarkMode ? <LightModeIcon fontSize="small" sx={{ mr: 1 }} /> : <DarkModeIcon fontSize="small" sx={{ mr: 1 }} />}
          {isDarkMode ? t('chatbox.lightMode') : t('chatbox.darkMode')}
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('language')}>
          <TranslateIcon fontSize="small" sx={{ mr: 1 }} />
          {t('chatbox.switchLanguage')}
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuAction('export')}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          {t('chatbox.exportChat')}
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('clear')}>
          <DeleteSweepIcon fontSize="small" sx={{ mr: 1 }} />
          {t('chatbox.clearHistory')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatHeader;
