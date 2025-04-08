/**
 * GroupRideChat.js
 * Composant de chat pour les participants aux sorties de groupe
 */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Send as SendIcon,
  InsertEmoticon as EmojiIcon,
  AttachFile as AttachIcon,
  Image as ImageIcon,
  LocationOn as LocationIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import authService from '../../../services/authService';
import { brandConfig } from '../../../config/branding';

// Mock de service pour le chat
const mockChatService = {
  // Simuler des messages de chat initiaux
  getInitialMessages: (rideId) => {
    const mockMessages = [
      {
        id: 'msg-1',
        rideId: rideId,
        userId: 'user-123',
        userName: 'Pierre Martin',
        userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        content: 'Bonjour à tous ! Je suis l\'organisateur de cette sortie. N\'hésitez pas à poser vos questions ici.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        isOrganizer: true
      },
      {
        id: 'msg-2',
        rideId: rideId,
        userId: 'user-124',
        userName: 'Sophie Dubois',
        userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        content: 'Est-ce qu\'il y a un café prévu à mi-parcours ?',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        isOrganizer: false
      },
      {
        id: 'msg-3',
        rideId: rideId,
        userId: 'user-123',
        userName: 'Pierre Martin',
        userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        content: 'Oui, on s\'arrêtera au café du cycliste à mi-parcours, vers le kilomètre 40.',
        timestamp: new Date(Date.now() - 3600000 * 11).toISOString(),
        isOrganizer: true
      },
      {
        id: 'msg-4',
        rideId: rideId,
        userId: 'user-125',
        userName: 'Thomas Klein',
        userAvatar: 'https://randomuser.me/api/portraits/men/41.jpg',
        content: 'Super, je serai présent ! J\'ai hâte de rouler avec vous.',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        isOrganizer: false
      }
    ];
    
    return Promise.resolve(mockMessages);
  },
  
  // Simuler l'envoi d'un message
  sendMessage: (rideId, userId, userName, userAvatar, content) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      rideId,
      userId,
      userName,
      userAvatar,
      content,
      timestamp: new Date().toISOString(),
      isOrganizer: false // À déterminer dans un cas réel
    };
    
    return Promise.resolve(newMessage);
  }
};

/**
 * Composant de chat pour les sorties de groupe
 */
const GroupRideChat = ({ rideId, participants, userProfile }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Charger les messages au montage
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        // Dans une application réelle, appeler une API ou utiliser un service de chat comme Firebase
        const initialMessages = await mockChatService.getInitialMessages(rideId);
        setMessages(initialMessages);
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchMessages();
    }
    
    // Dans une application réelle, configurer la mise à jour en temps réel avec des WebSockets ou Firebase
    const chatUpdateInterval = setInterval(() => {
      // Simuler la réception d'un nouveau message occasionnel
      if (Math.random() > 0.7 && messages.length > 0) {
        const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
        const randomMessages = [
          "J'ai vérifié la météo pour demain, ça devrait tenir !",
          "Quelqu'un a le lien du parcours sur Strava ?",
          "Je pense arriver 15 minutes en avance pour vérifier mon vélo.",
          "On se rejoint tous au point de départ ou certains veulent se retrouver avant ?",
          "J'ai une chambre à air de rechange si quelqu'un en a besoin.",
          "Qui a déjà fait ce parcours ?",
          "N'oubliez pas vos bidons, il va faire chaud !"
        ];
        
        const newMessage = {
          id: `msg-auto-${Date.now()}`,
          rideId,
          userId: randomParticipant.id,
          userName: randomParticipant.name,
          userAvatar: randomParticipant.avatar,
          content: randomMessages[Math.floor(Math.random() * randomMessages.length)],
          timestamp: new Date().toISOString(),
          isOrganizer: participants[0].id === randomParticipant.id
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    }, 60000); // Vérifier toutes les minutes
    
    return () => clearInterval(chatUpdateInterval);
  }, [rideId, participants]);

  // Faire défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Gérer l'envoi d'un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !userProfile) {
      return;
    }
    
    try {
      setSending(true);
      
      // Dans une application réelle, appeler une API ou utiliser un service de chat
      const newMessage = await mockChatService.sendMessage(
        rideId,
        userProfile.id,
        userProfile.name,
        userProfile.avatar,
        messageInput.trim()
      );
      
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setSending(false);
    }
  };

  // Formater la date d'un message
  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Si c'est aujourd'hui, afficher l'heure
    if (date.toDateString() === now.toDateString()) {
      return `${format(date, 'HH:mm')}`;
    }
    
    // Si c'est hier, afficher "Hier" + heure
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hier, ${format(date, 'HH:mm')}`;
    }
    
    // Sinon, afficher la date complète
    return format(date, 'dd/MM/yyyy, HH:mm');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        {t('groupChat')}
      </Typography>
      
      <Paper 
        elevation={0}
        variant="outlined"
        sx={{ 
          flex: 1, 
          mb: 2, 
          p: 0, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 1
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box 
            ref={chatContainerRef}
            sx={{ 
              flex: 1, 
              overflow: 'auto', 
              p: 2,
              bgcolor: '#f5f5f5'
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="textSecondary">
                  {t('noMessagesYet')}
                </Typography>
              </Box>
            ) : (
              <List sx={{ width: '100%', p: 0 }}>
                {messages.map((message, index) => {
                  const isCurrentUser = userProfile && message.userId === userProfile.id;
                  
                  // Déterminer si on doit afficher un séparateur de date
                  let showDateDivider = false;
                  if (index === 0) {
                    showDateDivider = true;
                  } else {
                    const prevDate = new Date(messages[index - 1].timestamp).toDateString();
                    const currDate = new Date(message.timestamp).toDateString();
                    if (prevDate !== currDate) {
                      showDateDivider = true;
                    }
                  }
                  
                  return (
                    <React.Fragment key={message.id}>
                      {showDateDivider && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            my: 2
                          }}
                        >
                          <Chip 
                            label={format(new Date(message.timestamp), 'EEEE d MMMM y', { locale: fr })}
                            size="small"
                            sx={{ 
                              bgcolor: 'white',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          />
                        </Box>
                      )}
                      
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                          px: 1,
                          py: 0.5
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar 
                            src={message.userAvatar} 
                            alt={message.userName}
                            sx={{ 
                              width: 36, 
                              height: 36,
                              ml: isCurrentUser ? 1 : 0,
                              mr: isCurrentUser ? 0 : 1,
                              border: message.isOrganizer ? `2px solid ${brandConfig.colors.primary}` : null
                            }}
                          />
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Typography
                                variant="subtitle2"
                                color="textPrimary"
                                component="span"
                              >
                                {isCurrentUser ? 'Vous' : message.userName}
                              </Typography>
                              
                              {message.isOrganizer && (
                                <Chip 
                                  label={t('organizer')}
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  display: 'inline-block',
                                  maxWidth: '100%',
                                  bgcolor: isCurrentUser ? brandConfig.colors.primary : 'white',
                                  color: isCurrentUser ? 'white' : 'inherit',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ 
                                    whiteSpace: 'pre-wrap', 
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {message.content}
                                </Typography>
                              </Paper>
                              
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ 
                                  display: 'block',
                                  mt: 0.5,
                                  textAlign: isCurrentUser ? 'right' : 'left',
                                  pr: isCurrentUser ? 0 : 2,
                                  pl: isCurrentUser ? 2 : 0
                                }}
                              >
                                {formatMessageDate(message.timestamp)}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            m: 0,
                            '.MuiListItemText-secondary': {
                              mt: 0
                            }
                          }}
                        />
                      </ListItem>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </List>
            )}
          </Box>
        )}
        
        <Divider />
        
        <Box 
          component="form" 
          onSubmit={handleSendMessage}
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: 'background.paper'
          }}
        >
          <Tooltip title={t('addEmoji')}>
            <IconButton size="small" sx={{ mr: 1 }}>
              <EmojiIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('attachFile')}>
            <IconButton size="small" sx={{ mr: 1 }}>
              <AttachIcon />
            </IconButton>
          </Tooltip>
          
          <TextField
            placeholder={userProfile ? t('typeMessage') : t('loginToChat')}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            disabled={!userProfile || sending}
            sx={{ mr: 1 }}
          />
          
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            disabled={!userProfile || !messageInput.trim() || sending}
            type="submit"
          >
            {t('send')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

GroupRideChat.propTypes = {
  rideId: PropTypes.string.isRequired,
  participants: PropTypes.array.isRequired,
  userProfile: PropTypes.object
};

export default GroupRideChat;
