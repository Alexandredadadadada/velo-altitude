# Documentation du Système de Gestion d'Erreurs

## Introduction

Ce document présente le système standardisé de gestion d'erreurs implémenté dans l'application Dashboard-Velo. Ce système vise à uniformiser l'affichage et le traitement des erreurs à travers toute l'application, améliorant ainsi l'expérience utilisateur et facilitant la maintenance.

## Architecture

Le système de gestion d'erreurs est composé de plusieurs éléments complémentaires :

1. **Composants d'erreur** : Bibliothèque de composants UI pour afficher différents types d'erreurs
2. **Contexte d'erreur** : Système centralisé de gestion des erreurs via React Context
3. **Intercepteur d'API** : Capture et normalise les erreurs des requêtes API
4. **Mappings d'erreurs** : Convertit les codes d'erreur techniques en messages compréhensibles

## Composants d'Erreur

La bibliothèque de composants d'erreur (`ErrorComponents.js`) fournit différentes options d'affichage :

### Types de Composants

1. **Toast** : Notifications éphémères pour les informations non critiques
2. **ErrorModal** : Fenêtres modales pour les erreurs importantes nécessitant une action
3. **ErrorBanner** : Bannières persistantes en haut de page pour les notifications importantes
4. **InlineError** : Messages d'erreur intégrés aux formulaires
5. **ErrorCard** : Cartes d'erreur à intégrer dans le contenu principal
6. **NotificationDot** : Indicateurs visuels sur les icônes ou boutons
7. **ErrorBoundary** : Gestion des erreurs lors du rendu React

### Niveaux de Sévérité

Chaque composant prend en charge différents niveaux de sévérité :

- **SUCCESS** : Opérations réussies (vert)
- **INFO** : Informations neutres (bleu)
- **WARNING** : Avertissements (orange/jaune)
- **ERROR** : Erreurs standards (rouge)
- **FATAL** : Erreurs critiques (rouge foncé)

### Exemples d'Utilisation Directe

```jsx
import { 
  Toast, 
  ErrorModal, 
  ErrorBanner, 
  SeverityLevel 
} from '../components/error/ErrorComponents';

// Afficher un toast simple
<Toast
  open={true}
  message="Opération réussie !"
  severity={SeverityLevel.SUCCESS}
  duration={3000}
  onClose={() => setShowToast(false)}
/>

// Afficher une modal d'erreur
<ErrorModal
  open={errorModalOpen}
  title="Erreur de connexion"
  message="Identifiants incorrects. Veuillez réessayer."
  severity={SeverityLevel.ERROR}
  onClose={() => setErrorModalOpen(false)}
  actions={[
    { 
      label: 'Réessayer', 
      onClick: handleLoginRetry, 
      variant: 'contained' 
    },
    { 
      label: 'Annuler', 
      onClick: () => setErrorModalOpen(false), 
      variant: 'text' 
    }
  ]}
/>

// Afficher une bannière d'avertissement
<ErrorBanner
  open={maintenanceMode}
  message="Une maintenance est prévue ce soir à 22h. Certaines fonctionnalités seront indisponibles."
  severity={SeverityLevel.WARNING}
  onClose={() => setMaintenanceAcknowledged(true)}
  actions={[
    { label: 'En savoir plus', onClick: () => navigate('/maintenance-info') }
  ]}
/>

// Afficher une erreur inline dans un formulaire
<TextField
  label="Email"
  value={email}
  onChange={handleEmailChange}
  error={!!emailError}
/>
{emailError && <InlineError message={emailError} />}
```

## Contexte d'Erreur

Le `ErrorContext` (`ErrorContext.js`) permet une gestion centralisée des erreurs dans toute l'application :

### Configuration

Enveloppez votre application dans le `ErrorProvider` :

```jsx
import { ErrorProvider } from '../contexts/ErrorContext';

function App() {
  return (
    <ErrorProvider>
      <Router>
        {/* Vos composants et routes */}
      </Router>
    </ErrorProvider>
  );
}
```

### Utilisation dans les Composants

Utilisez le hook `useError` dans vos composants :

```jsx
import { useError, ErrorType, SeverityLevel } from '../contexts/ErrorContext';

function ProfileForm() {
  const { showToast, showModal, handleApiError } = useError();
  
  const handleSubmit = async (formData) => {
    try {
      await updateProfile(formData);
      showToast('Profil mis à jour avec succès !', SeverityLevel.SUCCESS);
    } catch (error) {
      handleApiError(error, {
        title: 'Erreur de mise à jour',
        message: 'Impossible de mettre à jour votre profil.'
      });
    }
  };
  
  const handleDeleteAccount = () => {
    showModal(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      SeverityLevel.WARNING,
      {
        actions: [
          { 
            label: 'Supprimer', 
            onClick: confirmAccountDeletion, 
            variant: 'contained', 
            color: 'error' 
          },
          { 
            label: 'Annuler', 
            variant: 'outlined' 
          }
        ]
      }
    );
  };
  
  return (
    // Votre formulaire de profil
  );
}
```

### Méthodes Disponibles

- **showToast(message, severity, options)** : Affiche une notification toast
- **showModal(title, message, severity, options)** : Affiche une fenêtre modale
- **showBanner(message, severity, options)** : Affiche une bannière persistante
- **handleApiError(error, options)** : Traite une erreur API avec le composant approprié
- **dismissError(errorId)** : Supprime une erreur spécifique
- **clearAllErrors()** : Supprime toutes les erreurs

## Intercepteur d'API

L'intercepteur d'API (`apiErrorInterceptor.js`) standardise la gestion des erreurs pour toutes les requêtes :

### Configuration

L'intercepteur est automatiquement configuré lors de l'importation du module :

```javascript
import { setupApiErrorInterceptors } from '../services/apiErrorInterceptor';

// Configurer les intercepteurs au démarrage de l'application
setupApiErrorInterceptors();
```

### Utilisation avec Axios

```javascript
import axios from 'axios';
import { createApiClient, apiRequest, ApiError } from '../services/apiErrorInterceptor';

// Méthode 1: Utiliser axios directement (intercepteurs globaux déjà appliqués)
try {
  const response = await axios.get('/api/user/profile');
  return response.data;
} catch (error) {
  // L'erreur est déjà normalisée en ApiError
  console.error('Type d\'erreur:', error.isApiError ? 'API Error' : 'Autre erreur');
}

// Méthode 2: Créer une instance axios personnalisée avec les intercepteurs
const apiClient = createApiClient({
  baseURL: '/api/v2',
  timeout: 5000
});

try {
  const response = await apiClient.post('/users', userData);
  return response.data;
} catch (error) {
  // Gérer l'erreur
}

// Méthode 3: Utiliser le helper apiRequest (plus concis)
try {
  const data = await apiRequest(axios.get('/api/products'));
  return data;
} catch (error) {
  // error est une instance de ApiError
  if (error.isNetworkError()) {
    // Gérer les erreurs réseau
  } else if (error.isAuthError()) {
    // Gérer les erreurs d'authentification
  }
}
```

### Classe ApiError

La classe `ApiError` fournit des méthodes utiles pour analyser l'erreur :

```javascript
try {
  // Votre code
} catch (error) {
  if (error.isApiError) {
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Status:', error.status);
    console.log('Détails:', error.details);
    
    // Méthodes d'aide
    if (error.isAuthError()) {
      // Erreur d'authentification
    }
    
    if (error.isNetworkError()) {
      // Erreur réseau
    }
    
    if (error.isValidationError()) {
      // Erreur de validation
    }
    
    // Message utilisateur
    alert(error.getUserMessage());
  }
}
```

## Intégration avec d'Autres Systèmes

### Avec le Système d'Authentification

L'intercepteur d'API est intégré avec le client d'authentification amélioré pour gérer les erreurs d'authentification :

```javascript
// Dans apiErrorInterceptor.js
function handleAuthError(error) {
  // Déclencher l'événement d'erreur d'authentification
  const event = new CustomEvent('auth:error', { 
    detail: { 
      code: error.code,
      message: error.message,
      status: error.status
    } 
  });
  window.dispatchEvent(event);
  
  // Actions spécifiques selon le code d'erreur
  switch (error.code) {
    case 'token_expired':
      // Pour les tokens expirés, le client d'authentification gère le rafraîchissement
      break;
      
    case 'token_revoked':
    case 'refresh_token_expired':
      // Pour ces erreurs, déconnecter l'utilisateur
      enhancedAuthClient.logout();
      break;
  }
}
```

### Avec les Formulaires

Intégration avec React Hook Form pour la validation de formulaires :

```jsx
import { useForm } from 'react-hook-form';
import { InlineError } from '../components/error/ErrorComponents';

function RegistrationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="Email"
        {...register('email', { 
          required: 'Email obligatoire',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Adresse email invalide'
          }
        })}
        error={!!errors.email}
      />
      {errors.email && <InlineError message={errors.email.message} />}
      
      {/* Autres champs... */}
      
      <Button type="submit">S'inscrire</Button>
    </form>
  );
}
```

## Bonnes Pratiques

### 1. Catégorisation des Erreurs

Classez les erreurs par catégorie pour une gestion appropriée :

- **Erreurs d'Authentification** : Utiliser des modales pour guider l'utilisateur vers la reconnexion
- **Erreurs de Validation** : Utiliser des erreurs inline près des champs concernés
- **Erreurs Réseau** : Utiliser des toasts avec option de réessai
- **Erreurs Serveur** : Utiliser des modales pour les erreurs 500 avec options de contact support
- **Erreurs Fonctionnelles** : Utiliser des messages contextuels expliquant la limitation

### 2. Messages Utilisateur

Principes pour des messages d'erreur efficaces :

1. **Être spécifique** : Expliquer clairement ce qui s'est passé
2. **Proposer des solutions** : Indiquer comment résoudre le problème
3. **Éviter le jargon technique** : Utiliser un langage accessible
4. **Être cohérent** : Maintenir un ton et un style uniformes
5. **Être concis** : Rester bref et précis

Exemple de transformation de message :
- ❌ "Erreur 404: Ressource non trouvée à l'URL spécifiée"
- ✅ "Nous n'avons pas trouvé ce que vous cherchez. Vérifiez l'adresse ou retournez à l'accueil."

### 3. Journalisation des Erreurs

Stratégies de journalisation :

```javascript
// Dans ErrorContext.js
const logError = (error, context = {}) => {
  // En développement : console
  if (process.env.NODE_ENV !== 'production') {
    console.error('Application Error:', error, context);
    return;
  }
  
  // En production : service de monitoring
  try {
    // Envoi à un service comme Sentry, LogRocket, etc.
    errorMonitoringService.captureException(error, {
      extra: context,
      tags: {
        component: context.component,
        errorType: error.isApiError ? 'api' : 'app'
      }
    });
  } catch (loggingError) {
    // Fallback si le logging échoue
    console.error('Error logging failed:', loggingError);
  }
};
```

## Tests

### Tests Unitaires

Exemple de test pour les composants d'erreur :

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast, SeverityLevel } from '../components/error/ErrorComponents';

describe('Toast Component', () => {
  test('renders with correct message', () => {
    const handleClose = jest.fn();
    render(
      <Toast
        open={true}
        message="Test message"
        severity={SeverityLevel.INFO}
        onClose={handleClose}
      />
    );
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
  
  test('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Toast
        open={true}
        message="Test message"
        severity={SeverityLevel.INFO}
        onClose={handleClose}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
```

### Tests d'Intégration

Exemple de test pour le contexte d'erreur :

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorProvider, useError } from '../contexts/ErrorContext';

const TestComponent = () => {
  const { showToast, showModal } = useError();
  
  return (
    <div>
      <button onClick={() => showToast('Toast Message', 'info')}>Show Toast</button>
      <button onClick={() => showModal('Modal Title', 'Modal Message', 'error')}>Show Modal</button>
    </div>
  );
};

describe('ErrorContext Integration', () => {
  test('shows toast when triggered', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );
    
    fireEvent.click(screen.getByText('Show Toast'));
    
    expect(await screen.findByText('Toast Message')).toBeInTheDocument();
  });
  
  test('shows modal when triggered', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );
    
    fireEvent.click(screen.getByText('Show Modal'));
    
    expect(await screen.findByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Message')).toBeInTheDocument();
  });
});
```

## Conclusion

Ce système standardisé de gestion d'erreurs améliore considérablement l'expérience utilisateur et la maintenabilité de l'application. En centralisant la logique d'erreur et en fournissant des composants réutilisables, nous assurons une expérience cohérente, informative et esthétique dans toute l'application Dashboard-Velo.

Pour toute amélioration ou extension du système, assurez-vous de maintenir la cohérence avec les principes établis dans cette documentation.
