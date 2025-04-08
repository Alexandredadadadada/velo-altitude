import React from 'react';
import { Box, Typography, Paper, Avatar, Divider } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import 'highlight.js/styles/github.css';

const ChatMessages = ({ messages, isDarkMode }) => {
  const { t } = useTranslation();
  const currentUser = useSelector(state => state.auth.user);
  
  if (messages.length === 0) {
    return (
      <Box className="empty-chat">
        <SmartToyIcon sx={{ fontSize: 48, opacity: 0.5 }} />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {t('chatbox.emptyState')}
        </Typography>
      </Box>
    );
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <>
      {Object.entries(groupedMessages).map(([date, messagesForDay], dateIndex) => (
        <Box key={date}>
          <Box className="date-divider">
            <Divider>
              <Typography variant="caption" color="textSecondary">
                {date}
              </Typography>
            </Divider>
          </Box>
          
          {messagesForDay.map((message, index) => {
            const isUser = message.role === 'user';
            
            return (
              <Box 
                key={index} 
                className={`message-container ${isUser ? 'user-message' : 'assistant-message'}`}
              >
                <Box className="message-avatar">
                  {isUser ? (
                    currentUser?.profileImage ? (
                      <Avatar 
                        src={currentUser.profileImage} 
                        alt={currentUser.name || t('common.user')} 
                      />
                    ) : (
                      <Avatar>
                        <AccountCircleIcon />
                      </Avatar>
                    )
                  ) : (
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main',
                      }}
                    >
                      <SmartToyIcon />
                    </Avatar>
                  )}
                </Box>
                
                <Box className="message-content">
                  <Box className="message-header">
                    <Typography variant="subtitle2" className="message-sender">
                      {isUser ? (
                        currentUser?.name || t('common.user')
                      ) : (
                        t('chatbox.assistantName')
                      )}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" className="message-time">
                      {formatTimestamp(message.timestamp)}
                    </Typography>
                  </Box>
                  
                  <Paper 
                    elevation={0} 
                    className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}
                  >
                    {isUser ? (
                      <Typography variant="body2">{message.content}</Typography>
                    ) : (
                      <Box className="markdown-container">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          className={`markdown ${isDarkMode ? 'markdown-dark' : 'markdown-light'}`}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}
    </>
  );
};

export default ChatMessages;
