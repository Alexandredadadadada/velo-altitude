/**
 * Export Utilities
 * Functions for exporting data in various formats
 */

/**
 * Convert chat messages to formatted text for export
 * @param {Array<Object>} messages - Array of chat messages
 * @returns {string} - Formatted text
 */
const formatChatMessages = (messages) => {
  if (!messages || messages.length === 0) {
    return 'No messages to export';
  }
  
  let output = '# Velo-Altitude AI Chat History\n\n';
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
  
  // Format each group
  Object.entries(groupedMessages).forEach(([date, messagesForDay]) => {
    output += `## ${date}\n\n`;
    
    messagesForDay.forEach(message => {
      const time = new Date(message.timestamp).toLocaleTimeString();
      const sender = message.role === 'user' ? 'You' : 'AI Assistant';
      
      output += `**${sender}** (${time}):\n${message.content}\n\n`;
    });
  });
  
  return output;
};

/**
 * Convert chat messages to markdown format
 * @param {Array<Object>} messages - Array of chat messages
 * @returns {string} - Markdown text
 */
const chatToMarkdown = (messages) => {
  return formatChatMessages(messages);
};

/**
 * Convert chat messages to plain text format
 * @param {Array<Object>} messages - Array of chat messages
 * @returns {string} - Plain text
 */
const chatToText = (messages) => {
  if (!messages || messages.length === 0) {
    return 'No messages to export';
  }
  
  let output = 'VELO-ALTITUDE AI CHAT HISTORY\n\n';
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
  
  // Format each group
  Object.entries(groupedMessages).forEach(([date, messagesForDay]) => {
    output += `=== ${date} ===\n\n`;
    
    messagesForDay.forEach(message => {
      const time = new Date(message.timestamp).toLocaleTimeString();
      const sender = message.role === 'user' ? 'You' : 'AI Assistant';
      
      output += `${sender} (${time}):\n${message.content}\n\n`;
    });
  });
  
  return output;
};

/**
 * Convert chat messages to CSV format
 * @param {Array<Object>} messages - Array of chat messages
 * @returns {string} - CSV text
 */
const chatToCSV = (messages) => {
  if (!messages || messages.length === 0) {
    return 'timestamp,role,content\n';
  }
  
  // CSV header
  let csv = 'timestamp,role,content\n';
  
  // Add each message as a row
  messages.forEach(message => {
    // Escape quotes in content
    const escapedContent = message.content.replace(/"/g, '""');
    
    csv += `${message.timestamp},"${message.role}","${escapedContent}"\n`;
  });
  
  return csv;
};

/**
 * Export chat history to a file
 * @param {Array<Object>} messages - Array of chat messages
 * @param {string} filename - Base filename without extension
 * @param {string} format - Export format (markdown, text, csv, json)
 */
export const exportChatHistory = (messages, filename = 'chat-export', format = 'markdown') => {
  let content = '';
  let extension = '';
  let mimeType = '';
  
  // Generate content based on format
  switch (format.toLowerCase()) {
    case 'markdown':
    case 'md':
      content = chatToMarkdown(messages);
      extension = 'md';
      mimeType = 'text/markdown';
      break;
    case 'text':
    case 'txt':
      content = chatToText(messages);
      extension = 'txt';
      mimeType = 'text/plain';
      break;
    case 'csv':
      content = chatToCSV(messages);
      extension = 'csv';
      mimeType = 'text/csv';
      break;
    case 'json':
      content = JSON.stringify(messages, null, 2);
      extension = 'json';
      mimeType = 'application/json';
      break;
    default:
      content = chatToMarkdown(messages);
      extension = 'md';
      mimeType = 'text/markdown';
  }
  
  // Create a blob with the content
  const blob = new Blob([content], { type: mimeType });
  
  // Create a download URL
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  
  // Trigger the download
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

export default {
  exportChatHistory,
  chatToMarkdown,
  chatToText,
  chatToCSV
};
