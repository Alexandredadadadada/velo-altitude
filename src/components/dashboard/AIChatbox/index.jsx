import React, { useState, useEffect, useRef } from 'react';
import { Card, Box, CircularProgress, IconButton, Typography, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Maximize';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import TranslateIcon from '@mui/icons-material/Translate';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import SuggestedQueries from './SuggestedQueries';
import { useAIChat } from '../../../hooks/useAIChat';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { exportChatHistory } from '../../../utils/exportUtils';
import './styles.css';

const AIChatbox = ({ position, bottom, right, width, height }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(theme.palette.mode === 'dark');
  const messagesEndRef = useRef(null);
  const currentUser = useSelector(state => state.auth.user);
  
  const { 
    messages, 
    isLoading, 
    error,
    suggestedQueries,
    sendMessage, 
    clearHistory 
  } = useAIChat({
    userId: currentUser?.id,
    language: i18n.language
  });

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSend = (message) => {
    // Check for special commands
    if (message.startsWith('/')) {
      handleSpecialCommand(message);
      return;
    }
    
    if (message.trim()) {
      sendMessage(message);
    }
  };

  const handleSpecialCommand = (command) => {
    switch (command.toLowerCase()) {
      case '/clear':
        clearHistory();
        sendMessage(t('ai.commands.historyClear'));
        break;
      case '/help':
        const helpMessage = t('ai.commands.help');
        sendMessage(helpMessage);
        break;
      case '/context':
        sendMessage(t('ai.commands.contextInfo'));
        break;
      default:
        sendMessage(t('ai.commands.unknown'));
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // This would ideally connect to your app's theme context/state
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const handleExport = () => {
    exportChatHistory(messages, `velo-altitude-chat-${new Date().toISOString().slice(0, 10)}`);
  };

  const chatboxStyle = {
    position: position || 'fixed',
    bottom: bottom || 20,
    right: right || 20,
    width: isMinimized ? '350px' : (width || '350px'),
    height: isMinimized ? '60px' : (height || '500px'),
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
    boxShadow: theme.shadows[4],
    transition: 'all 0.3s ease',
    transformOrigin: 'bottom right',
    borderRadius: '8px',
  };

  const chatboxClasses = `
    assistant-chat 
    ${isMinimized ? 'minimized' : ''} 
    ${isDarkMode ? 'dark-mode' : 'light-mode'}
  `;

  return (
    <Card className={chatboxClasses} style={chatboxStyle}>
      <ChatHeader 
        onMinimize={toggleMinimize} 
        isMinimized={isMinimized}
        onDarkModeToggle={toggleDarkMode}
        isDarkMode={isDarkMode}
        onLanguageToggle={toggleLanguage}
        onExport={handleExport}
        onClear={clearHistory}
      />
      
      {!isMinimized && (
        <>
          <Box className="chat-messages">
            <ChatMessages 
              messages={messages} 
              isLoading={isLoading} 
              error={error} 
              isDarkMode={isDarkMode} 
            />
            {isLoading && (
              <Box className="loading-indicator">
                <CircularProgress size={24} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
          
          {suggestedQueries.length > 0 && (
            <SuggestedQueries
              queries={suggestedQueries}
              onSelectQuery={handleSend}
            />
          )}
          
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </>
      )}
    </Card>
  );
};

export default AIChatbox;
