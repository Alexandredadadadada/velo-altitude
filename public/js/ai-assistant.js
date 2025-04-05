/**
 * ai-assistant.js - Module d'assistant IA pour Grand Est Cyclisme
 * Utilise l'API OpenAI pour fournir des conseils personnalisés aux cyclistes
 */

// Configuration de l'assistant IA
const assistantConfig = {
  defaultPrompts: {
    training: "Que dois-je faire comme entraînement cycliste cette semaine pour progresser ?",
    nutrition: "Quels aliments et boissons sont recommandés avant, pendant et après une sortie vélo ?",
    routes: "Quels sont les meilleurs itinéraires cyclistes dans la région Grand Est ?",
    equipment: "Quel équipement est recommandé pour le cyclisme en montagne dans les Vosges ?",
    recovery: "Comment optimiser ma récupération après une sortie vélo intensive ?"
  },
  contextProviders: {
    weather: () => window.weatherModule ? window.weatherModule.getCurrentWeatherContext() : null,
    strava: () => window.stravaIntegration ? window.stravaIntegration.getAthleteContext() : null,
    location: () => ({
      region: "Grand Est",
      majorAreas: ["Vosges", "Alsace", "Lorraine", "Champagne-Ardenne"],
      famousCyclingSpots: ["Col du Grand Ballon", "Col de la Schlucht", "Planche des Belles Filles"]
    })
  },
  conversationHistory: [],
  maxHistoryLength: 10
};

/**
 * Initialise l'assistant IA
 * @param {string} chatContainerId ID du conteneur du chat
 * @param {string} chatInputId ID du champ de saisie du chat
 * @param {string} chatButtonId ID du bouton d'envoi
 * @param {string} suggestionContainerId ID du conteneur des suggestions
 */
function initAIAssistant(chatContainerId, chatInputId, chatButtonId, suggestionContainerId) {
  // Vérifier que les éléments existent
  const chatContainer = document.getElementById(chatContainerId);
  const chatInput = document.getElementById(chatInputId);
  const chatButton = document.getElementById(chatButtonId);
  const suggestionContainer = document.getElementById(suggestionContainerId);
  
  if (!chatContainer || !chatInput || !chatButton) {
    console.error("Éléments manquants pour l'initialisation de l'assistant IA");
    return;
  }
  
  // Initialiser le conteneur de chat
  initChatContainer(chatContainer);
  
  // Configurer l'événement d'envoi de message
  chatButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
      sendMessage(message, chatContainerId);
      chatInput.value = '';
    }
  });
  
  // Configurer l'événement d'envoi par la touche Entrée
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const message = chatInput.value.trim();
      if (message) {
        sendMessage(message, chatContainerId);
        chatInput.value = '';
      }
      e.preventDefault();
    }
  });
  
  // Initialiser les suggestions prédéfinies
  if (suggestionContainer) {
    initSuggestions(suggestionContainer, chatContainerId);
  }
  
  // Ajouter un message de bienvenue
  addSystemMessage(
    "Bonjour, je suis votre assistant cyclisme pour la région Grand Est ! Je peux vous donner des conseils d'entraînement, des recommandations nutritionnelles, des idées d'itinéraires ou répondre à vos questions sur le cyclisme. Comment puis-je vous aider aujourd'hui ?",
    chatContainerId
  );
}

/**
 * Initialise le conteneur de chat
 * @param {HTMLElement} container Élément conteneur du chat
 */
function initChatContainer(container) {
  // Vider le conteneur
  container.innerHTML = '';
  
  // Créer l'en-tête du chat
  const header = document.createElement('div');
  header.className = 'chat-header';
  header.innerHTML = `
    <div class="chat-title">
      <i class="fas fa-robot"></i>
      <h3>Assistant Cyclisme</h3>
    </div>
  `;
  
  // Créer le corps du chat
  const body = document.createElement('div');
  body.className = 'chat-body';
  
  // Créer le conteneur des messages
  const messages = document.createElement('div');
  messages.className = 'chat-messages';
  
  // Ajouter les éléments au conteneur
  body.appendChild(messages);
  container.appendChild(header);
  container.appendChild(body);
}

/**
 * Initialise les suggestions prédéfinies
 * @param {HTMLElement} container Élément conteneur des suggestions
 * @param {string} chatContainerId ID du conteneur de chat
 */
function initSuggestions(container, chatContainerId) {
  // Vider le conteneur
  container.innerHTML = '';
  
  // Créer l'en-tête des suggestions
  const header = document.createElement('h3');
  header.textContent = 'Suggestions';
  container.appendChild(header);
  
  // Créer la liste des suggestions
  const suggestionList = document.createElement('div');
  suggestionList.className = 'suggestion-list';
  
  // Ajouter les suggestions prédéfinies
  Object.entries(assistantConfig.defaultPrompts).forEach(([key, prompt]) => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'suggestion-item';
    suggestionItem.textContent = prompt;
    
    // Configurer l'événement de clic sur la suggestion
    suggestionItem.addEventListener('click', () => {
      sendMessage(prompt, chatContainerId);
    });
    
    suggestionList.appendChild(suggestionItem);
  });
  
  // Ajouter la liste au conteneur
  container.appendChild(suggestionList);
}

/**
 * Envoie un message à l'assistant
 * @param {string} message Message à envoyer
 * @param {string} chatContainerId ID du conteneur de chat
 */
function sendMessage(message, chatContainerId) {
  // Ajouter le message de l'utilisateur au chat
  addUserMessage(message, chatContainerId);
  
  // Ajouter un indicateur de chargement
  const loadingId = addLoadingIndicator(chatContainerId);
  
  // Préparer le contexte pour l'API
  const context = {};
  
  // Ajouter les contextes disponibles
  Object.entries(assistantConfig.contextProviders).forEach(([key, providerFn]) => {
    const contextData = providerFn();
    if (contextData) {
      context[key] = contextData;
    }
  });
  
  // Ajouter l'historique récent
  context.history = assistantConfig.conversationHistory
    .slice(-assistantConfig.maxHistoryLength);
  
  // Appeler l'API pour obtenir une réponse
  generateAIResponse(message, context)
    .then(response => {
      // Supprimer l'indicateur de chargement
      removeLoadingIndicator(loadingId, chatContainerId);
      
      // Ajouter la réponse au chat
      addAssistantMessage(response, chatContainerId);
      
      // Mettre à jour l'historique de conversation
      assistantConfig.conversationHistory.push({
        role: 'user',
        content: message
      });
      
      assistantConfig.conversationHistory.push({
        role: 'assistant',
        content: response
      });
      
      // Limiter la taille de l'historique
      if (assistantConfig.conversationHistory.length > assistantConfig.maxHistoryLength * 2) {
        assistantConfig.conversationHistory = assistantConfig.conversationHistory
          .slice(-assistantConfig.maxHistoryLength * 2);
      }
    })
    .catch(error => {
      // Supprimer l'indicateur de chargement
      removeLoadingIndicator(loadingId, chatContainerId);
      
      // Afficher un message d'erreur
      console.error('Erreur lors de la génération de la réponse:', error);
      addSystemMessage(
        "Désolé, une erreur est survenue lors de la génération de la réponse. Veuillez réessayer.",
        chatContainerId
      );
    });
}

/**
 * Génère une réponse IA via l'API
 * @param {string} prompt Message de l'utilisateur
 * @param {object} context Contexte de la conversation
 * @returns {Promise} Promesse résolue avec la réponse
 */
function generateAIResponse(prompt, context) {
  // Appeler l'API d'IA
  return fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      context
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erreur lors de la génération de la réponse');
    }
    return response.json();
  })
  .then(data => {
    if (data.success && data.data && data.data.response) {
      return data.data.response;
    } else {
      throw new Error('Réponse invalide de l\'API');
    }
  });
}

/**
 * Génère une recommandation d'itinéraire en fonction des préférences
 * @param {object} preferences Préférences de l'utilisateur
 * @returns {Promise} Promesse résolue avec la recommandation
 */
function generateRouteRecommendation(preferences) {
  return fetch('/api/ai/route-recommendation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      preferences
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erreur lors de la génération de la recommandation');
    }
    return response.json();
  })
  .then(data => {
    if (data.success && data.data) {
      return data.data;
    } else {
      throw new Error('Réponse invalide de l\'API');
    }
  });
}

/**
 * Génère un plan d'entraînement personnalisé
 * @param {object} athleteData Données de l'athlète
 * @param {object} goals Objectifs de l'athlète
 * @returns {Promise} Promesse résolue avec le plan d'entraînement
 */
function generateTrainingPlan(athleteData, goals) {
  return fetch('/api/ai/training-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      athleteData,
      goals
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erreur lors de la génération du plan d\'entraînement');
    }
    return response.json();
  })
  .then(data => {
    if (data.success && data.data) {
      return data.data;
    } else {
      throw new Error('Réponse invalide de l\'API');
    }
  });
}

/**
 * Ajoute un message de l'utilisateur au chat
 * @param {string} message Contenu du message
 * @param {string} chatContainerId ID du conteneur de chat
 */
function addUserMessage(message, chatContainerId) {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'chat-message user-message';
  messageContainer.innerHTML = `
    <div class="message-content">
      <p>${formatMessageText(message)}</p>
    </div>
    <div class="message-avatar">
      <i class="fas fa-user"></i>
    </div>
  `;
  
  appendMessageToChat(messageContainer, chatContainerId);
}

/**
 * Ajoute un message de l'assistant au chat
 * @param {string} message Contenu du message
 * @param {string} chatContainerId ID du conteneur de chat
 */
function addAssistantMessage(message, chatContainerId) {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'chat-message assistant-message';
  messageContainer.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <p>${formatMessageText(message)}</p>
    </div>
  `;
  
  appendMessageToChat(messageContainer, chatContainerId);
}

/**
 * Ajoute un message système au chat
 * @param {string} message Contenu du message
 * @param {string} chatContainerId ID du conteneur de chat
 */
function addSystemMessage(message, chatContainerId) {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'chat-message system-message';
  messageContainer.innerHTML = `
    <div class="message-content">
      <p>${formatMessageText(message)}</p>
    </div>
  `;
  
  appendMessageToChat(messageContainer, chatContainerId);
}

/**
 * Ajoute un indicateur de chargement au chat
 * @param {string} chatContainerId ID du conteneur de chat
 * @returns {string} ID de l'indicateur de chargement
 */
function addLoadingIndicator(chatContainerId) {
  const loadingId = 'loading-' + Date.now();
  const loadingContainer = document.createElement('div');
  loadingContainer.className = 'chat-message assistant-message loading-message';
  loadingContainer.id = loadingId;
  loadingContainer.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  appendMessageToChat(loadingContainer, chatContainerId);
  return loadingId;
}

/**
 * Supprime l'indicateur de chargement
 * @param {string} loadingId ID de l'indicateur de chargement
 * @param {string} chatContainerId ID du conteneur de chat
 */
function removeLoadingIndicator(loadingId, chatContainerId) {
  const loadingElement = document.getElementById(loadingId);
  if (loadingElement) {
    loadingElement.remove();
  }
}

/**
 * Ajoute un message au conteneur de chat
 * @param {HTMLElement} messageElement Élément du message
 * @param {string} chatContainerId ID du conteneur de chat
 */
function appendMessageToChat(messageElement, chatContainerId) {
  const chatContainer = document.getElementById(chatContainerId);
  if (!chatContainer) return;
  
  const messagesContainer = chatContainer.querySelector('.chat-messages');
  if (messagesContainer) {
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } else {
    const chatBody = chatContainer.querySelector('.chat-body');
    if (chatBody) {
      const newMessagesContainer = document.createElement('div');
      newMessagesContainer.className = 'chat-messages';
      newMessagesContainer.appendChild(messageElement);
      chatBody.appendChild(newMessagesContainer);
    }
  }
}

/**
 * Formate le texte du message (liens, sauts de ligne, etc.)
 * @param {string} text Texte du message
 * @returns {string} Texte formaté
 */
function formatMessageText(text) {
  // Remplacer les URLs par des liens cliquables
  let formattedText = text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Remplacer les sauts de ligne par des balises <br>
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
}

// Exporter les fonctions pour une utilisation externe
window.aiAssistant = {
  initAIAssistant,
  generateRouteRecommendation,
  generateTrainingPlan
};
