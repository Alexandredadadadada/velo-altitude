import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { useTranslation } from 'react-i18next';

const ChatInput = ({ onSend, isLoading }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Initialize speech recognition if available
  const initSpeechRecognition = () => {
    if (!recognition && window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();
      
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'fr-FR'; // Default to French, should match app language
      
      newRecognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setMessage(transcript);
      };
      
      newRecognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      setRecognition(newRecognition);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognition) {
      initSpeechRecognition();
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage('');
      
      // Stop recording if active
      if (isRecording && recognition) {
        recognition.stop();
        setIsRecording(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const speechRecognitionSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <Box className="chat-input">
      <TextField
        fullWidth
        multiline
        maxRows={4}
        variant="outlined"
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={t('chatbox.inputPlaceholder')}
        disabled={isLoading}
        size="small"
        InputProps={{
          endAdornment: speechRecognitionSupported && (
            <InputAdornment position="end">
              <IconButton
                onClick={toggleSpeechRecognition}
                edge="end"
                color={isRecording ? "error" : "default"}
              >
                {isRecording ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      <IconButton 
        color="primary" 
        onClick={handleSend} 
        disabled={!message.trim() || isLoading}
        className="send-button"
      >
        {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
      </IconButton>
    </Box>
  );
};

export default ChatInput;
