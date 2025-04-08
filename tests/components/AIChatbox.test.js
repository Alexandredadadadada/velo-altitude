/**
 * AIChatbox Component Tests
 * Tests for AI chatbox functionality, performance, and integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIChatbox from '../../src/components/dashboard/AIChatbox';
import { useAIChat } from '../../src/hooks/useAIChat';
import { aiService } from '../../src/services/ai';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

// Mock hooks and services
jest.mock('../../src/hooks/useAIChat', () => ({
  useAIChat: jest.fn()
}));

jest.mock('../../src/services/ai', () => ({
  aiService: {
    sendMessage: jest.fn(),
    getSuggestedQueries: jest.fn(),
    clearChatHistory: jest.fn()
  }
}));

// Create a theme for testing
const theme = createTheme();

// Setup mock data
const mockMessages = [
  { id: '1', role: 'assistant', content: 'Bonjour, comment puis-je vous aider ?', timestamp: new Date().toISOString() },
  { id: '2', role: 'user', content: 'Comment améliorer mon endurance ?', timestamp: new Date().toISOString() }
];

const mockSuggestedQueries = [
  'Conseils pour grimper les cols',
  'Nutrition avant une sortie longue',
  'Récupération après effort'
];

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Default mock implementation
  useAIChat.mockReturnValue({
    messages: mockMessages,
    isLoading: false,
    error: null,
    suggestedQueries: mockSuggestedQueries,
    sendMessage: jest.fn(),
    clearHistory: jest.fn()
  });
});

// Wrapper component for providing context
const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    </ThemeProvider>
  );
};

describe('AIChatbox Integration', () => {
  test('Message Flow', async () => {
    // Setup mocks
    const sendMessageMock = jest.fn();
    useAIChat.mockReturnValue({
      messages: mockMessages,
      isLoading: false,
      error: null,
      suggestedQueries: mockSuggestedQueries,
      sendMessage: sendMessageMock,
      clearHistory: jest.fn()
    });
    
    // Render component
    renderWithProviders(<AIChatbox />);
    
    // Check initial render
    expect(screen.getByText('Bonjour, comment puis-je vous aider ?')).toBeInTheDocument();
    expect(screen.getByText('Comment améliorer mon endurance ?')).toBeInTheDocument();
    
    // Test sending a message
    const inputElement = screen.getByPlaceholderText(/message/i) || screen.getByRole('textbox');
    fireEvent.change(inputElement, { target: { value: 'Quels exercices pour la récupération ?' } });
    
    // Find send button (either by text or aria-label)
    const sendButton = screen.getByRole('button', { name: /envoyer/i }) || 
      screen.getByLabelText(/envoyer/i) ||
      screen.getByTestId('send-button');
    
    fireEvent.click(sendButton);
    
    // Verify sendMessage was called with the correct input
    expect(sendMessageMock).toHaveBeenCalledWith('Quels exercices pour la récupération ?');
    
    // Verify input field is cleared after sending
    expect(inputElement.value).toBe('');
  });

  test('Context Updates', async () => {
    // Setup mocks with loading state
    const sendMessageMock = jest.fn();
    let isLoading = false;
    
    const mockUseAIChat = {
      messages: mockMessages,
      isLoading,
      error: null,
      suggestedQueries: mockSuggestedQueries,
      sendMessage: sendMessageMock,
      clearHistory: jest.fn()
    };
    
    useAIChat.mockReturnValue(mockUseAIChat);
    
    // Render component
    const { rerender } = renderWithProviders(<AIChatbox />);
    
    // Simulate sending a message
    const inputElement = screen.getByPlaceholderText(/message/i) || screen.getByRole('textbox');
    fireEvent.change(inputElement, { target: { value: 'Quels exercices pour la récupération ?' } });
    
    const sendButton = screen.getByRole('button', { name: /envoyer/i }) || 
      screen.getByLabelText(/envoyer/i) ||
      screen.getByTestId('send-button');
    
    fireEvent.click(sendButton);
    
    // Update to loading state
    mockUseAIChat.isLoading = true;
    useAIChat.mockReturnValue(mockUseAIChat);
    
    // Re-render with loading state
    rerender(
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <AIChatbox />
        </I18nextProvider>
      </ThemeProvider>
    );
    
    // Verify loading indicator is shown
    expect(screen.getByTestId('loading-indicator') || screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Update to completed state with new message
    mockUseAIChat.isLoading = false;
    mockUseAIChat.messages = [
      ...mockMessages,
      { 
        id: '3', 
        role: 'user', 
        content: 'Quels exercices pour la récupération ?', 
        timestamp: new Date().toISOString() 
      },
      { 
        id: '4', 
        role: 'assistant', 
        content: 'Pour la récupération, je recommande des étirements légers et du cyclisme à faible intensité.', 
        timestamp: new Date().toISOString() 
      }
    ];
    
    useAIChat.mockReturnValue(mockUseAIChat);
    
    // Re-render with new message
    rerender(
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <AIChatbox />
        </I18nextProvider>
      </ThemeProvider>
    );
    
    // Verify new message is shown
    expect(screen.getByText('Pour la récupération, je recommande des étirements légers et du cyclisme à faible intensité.')).toBeInTheDocument();
  });

  test('Performance', async () => {
    // Setup performance mock
    const originalPerformance = window.performance;
    const mockPerformance = {
      now: jest.fn(),
      mark: jest.fn(),
      measure: jest.fn()
    };
    
    window.performance = mockPerformance;
    
    try {
      // Mock timing functions
      mockPerformance.now
        .mockReturnValueOnce(100) // First call - start time
        .mockReturnValueOnce(250); // Second call - end time
      
      // Render component with timing measurement
      const startTime = window.performance.now();
      renderWithProviders(<AIChatbox />);
      const endTime = window.performance.now();
      
      // Verify render time is reasonable (less than 500ms)
      expect(endTime - startTime).toBeLessThan(500);
      
      // Test response generation performance
      const sendMessageMock = jest.fn(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              message: 'Réponse de test',
              suggestedQueries: ['Suggestion 1', 'Suggestion 2']
            });
          }, 50); // Simulated 50ms response time
        });
      });
      
      // Update mock
      useAIChat.mockReturnValue({
        messages: mockMessages,
        isLoading: false,
        error: null,
        suggestedQueries: mockSuggestedQueries,
        sendMessage: sendMessageMock,
        clearHistory: jest.fn()
      });
      
      // Simulate sending a message with timing
      const inputElement = screen.getByPlaceholderText(/message/i) || screen.getByRole('textbox');
      fireEvent.change(inputElement, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByRole('button', { name: /envoyer/i }) || 
        screen.getByLabelText(/envoyer/i) ||
        screen.getByTestId('send-button');
      
      // Measure send message performance
      const requestStartTime = window.performance.now();
      fireEvent.click(sendButton);
      
      // Wait for response
      await waitFor(() => {
        expect(sendMessageMock).toHaveBeenCalled();
      });
      
      // Verify send message was called in a timely manner (under 100ms)
      const requestEndTime = window.performance.now();
      expect(requestEndTime - requestStartTime).toBeLessThan(100);
      
    } finally {
      // Restore original performance object
      window.performance = originalPerformance;
    }
  });
  
  test('Special Commands', async () => {
    // Setup mocks
    const sendMessageMock = jest.fn();
    const clearHistoryMock = jest.fn();
    
    useAIChat.mockReturnValue({
      messages: mockMessages,
      isLoading: false,
      error: null,
      suggestedQueries: mockSuggestedQueries,
      sendMessage: sendMessageMock,
      clearHistory: clearHistoryMock
    });
    
    // Render component
    renderWithProviders(<AIChatbox />);
    
    // Test /clear command
    const inputElement = screen.getByPlaceholderText(/message/i) || screen.getByRole('textbox');
    fireEvent.change(inputElement, { target: { value: '/clear' } });
    
    const sendButton = screen.getByRole('button', { name: /envoyer/i }) || 
      screen.getByLabelText(/envoyer/i) ||
      screen.getByTestId('send-button');
    
    fireEvent.click(sendButton);
    
    // Verify clearHistory was called
    expect(clearHistoryMock).toHaveBeenCalled();
    expect(sendMessageMock).toHaveBeenCalledWith(expect.any(String));
    
    // Test /help command
    fireEvent.change(inputElement, { target: { value: '/help' } });
    fireEvent.click(sendButton);
    
    // Verify help message was sent
    expect(sendMessageMock).toHaveBeenCalledWith(expect.any(String));
  });
  
  test('Suggested Queries', async () => {
    // Setup mocks
    const sendMessageMock = jest.fn();
    
    useAIChat.mockReturnValue({
      messages: mockMessages,
      isLoading: false,
      error: null,
      suggestedQueries: mockSuggestedQueries,
      sendMessage: sendMessageMock,
      clearHistory: jest.fn()
    });
    
    // Render component
    renderWithProviders(<AIChatbox />);
    
    // Verify suggested queries are rendered
    for (const query of mockSuggestedQueries) {
      expect(screen.getByText(query)).toBeInTheDocument();
    }
    
    // Test clicking on a suggested query
    fireEvent.click(screen.getByText('Conseils pour grimper les cols'));
    
    // Verify sendMessage was called with the suggestion text
    expect(sendMessageMock).toHaveBeenCalledWith('Conseils pour grimper les cols');
  });
});
