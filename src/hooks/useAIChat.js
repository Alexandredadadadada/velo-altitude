import { useState, useEffect, useCallback, useRef } from 'react';
import { aiService } from '../services/ai';
import { contextProviders } from '../services/ai/contextProviders';

/**
 * Custom hook for managing AI chat functionality
 * @param {Object} options - Configuration options
 * @param {string} options.userId - Current user ID
 * @param {string} options.language - Current language (fr/en)
 * @returns {Object} Chat state and functions
 */
export const useAIChat = ({ userId, language = 'fr' }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestedQueries, setSuggestedQueries] = useState([]);
  
  // Store context in a ref to avoid unnecessary re-renders
  const contextRef = useRef({});
  
  // Load chat history when component mounts
  useEffect(() => {
    if (userId) {
      loadChatHistory();
    }
  }, [userId]);
  
  // Update context when needed
  useEffect(() => {
    refreshContext();
  }, [userId, language]);
  
  /**
   * Load chat history from local storage or backend
   */
  const loadChatHistory = useCallback(async () => {
    try {
      // First try to load from local storage
      const storedMessages = localStorage.getItem(`chat_history_${userId}`);
      
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else if (userId) {
        // If not in localStorage, try to load from backend
        setIsLoading(true);
        const history = await aiService.getChatHistory(userId);
        setMessages(history);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError('Failed to load chat history');
      setIsLoading(false);
    }
  }, [userId]);
  
  /**
   * Save chat history to local storage and/or backend
   */
  const saveChatHistory = useCallback(async (updatedMessages) => {
    try {
      // Save to local storage
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify(updatedMessages));
      
      // Optionally save to backend
      if (userId) {
        await aiService.saveChatHistory(userId, updatedMessages);
      }
    } catch (err) {
      console.error('Error saving chat history:', err);
      setError('Failed to save chat history');
    }
  }, [userId]);
  
  /**
   * Refresh context data from various services
   */
  const refreshContext = useCallback(async () => {
    try {
      const contextData = {};
      
      // Gather context from all providers in parallel
      const contextPromises = Object.entries(contextProviders).map(
        async ([key, providerFn]) => {
          try {
            const data = await providerFn();
            return [key, data];
          } catch (err) {
            console.error(`Error fetching ${key} context:`, err);
            return [key, null];
          }
        }
      );
      
      const results = await Promise.all(contextPromises);
      
      // Update context ref with all results
      results.forEach(([key, value]) => {
        if (value) {
          contextData[key] = value;
        }
      });
      
      contextRef.current = {
        ...contextData,
        language,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (err) {
      console.error('Error refreshing context:', err);
    }
  }, [language]);
  
  /**
   * Send a message to the AI and get a response
   * @param {string} content - Message content
   */
  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;
    
    try {
      // Add user message to state
      const userMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
      
      // Start loading state
      setIsLoading(true);
      setSuggestedQueries([]);
      
      // Send message to AI service
      const response = await aiService.sendMessage({
        message: content,
        history: messages.slice(-10), // Send last 10 messages for context
        context: contextRef.current,
        language
      });
      
      // Add AI response to state
      const aiMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      
      // Update suggested queries if provided
      if (response.suggestedQueries && response.suggestedQueries.length > 0) {
        setSuggestedQueries(response.suggestedQueries);
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get AI response');
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer plus tard.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages([...messages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, language, saveChatHistory]);
  
  /**
   * Clear chat history
   */
  const clearHistory = useCallback(async () => {
    try {
      setMessages([]);
      localStorage.removeItem(`chat_history_${userId}`);
      
      if (userId) {
        await aiService.clearChatHistory(userId);
      }
      
      setSuggestedQueries([]);
    } catch (err) {
      console.error('Error clearing chat history:', err);
      setError('Failed to clear chat history');
    }
  }, [userId]);
  
  return {
    messages,
    isLoading,
    error,
    suggestedQueries,
    sendMessage,
    clearHistory,
    refreshContext
  };
};

export default useAIChat;
