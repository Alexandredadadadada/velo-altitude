# Exemples de Gestion d'Erreurs par Module

Ce document fournit des exemples concrets d'utilisation du système de gestion d'erreurs pour chaque module de l'application Grand Est Cyclisme.

## Module Authentification

### Exemple : Connexion utilisateur

```jsx
// pages/Login.js
import React, { useState } from 'react';
import useErrorHandler from '../hooks/useErrorHandler';
import authService from '../services/authService';

function Login() {
  const { handleApiRequest } = useErrorHandler();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const user = await handleApiRequest(
        () => authService.login(credentials),
        {
          loadingMessage: 'Connexion en cours...',
          errorMessage: 'Échec de la connexion',
          showLoading: true
        }
      );
      
      if (user) {
        // Redirection après connexion réussie
        window.location.href = '/dashboard';
      }
    } catch (error) {
      // L'erreur est déjà gérée par handleApiRequest
      console.log('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Formulaire de connexion */}
    </form>
  );
}
```

### Exemple : Vérification de token

```jsx
// services/authService.js
import useErrorHandler from '../hooks/useErrorHandler';
import jwtDecode from 'jwt-decode';

export const useTokenVerification = () => {
  const { handleError } = useErrorHandler();
  
  const verifyToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      
      // Vérifier l'expiration
      if (decoded.exp * 1000 < Date.now()) {
        handleError(
          'Votre session a expiré',
          'auth/session-expired',
          {
            severity: 'warning',
            showNotification: true
          }
        );
        return false;
      }
      
      return decoded;
    } catch (error) {
      handleError(
        'Token invalide',
        'auth/invalid-token',
        {
          severity: 'error',
          showNotification: true
        }
      );
      return false;
    }
  };
  
  return { verifyToken };
};
```

## Module Parcours

### Exemple : Chargement des détails d'un parcours

```jsx
// pages/RouteDetails.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useErrorHandler from '../hooks/useErrorHandler';
import api from '../services/api';
import ErrorBoundary from '../components/common/ErrorBoundary';

function RouteDetails() {
  const { routeId } = useParams();
  const { handleApiRequest } = useErrorHandler();
  const [route, setRoute] = useState(null);
  
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const data = await handleApiRequest(
          () => api.get(`/routes/${routeId}`),
          {
            loadingMessage: 'Chargement du parcours...',
            errorMessage: 'Impossible de charger les détails du parcours',
            showLoading: true,
            // Données de secours
            fallbackData: {
              id: routeId,
              name: 'Parcours indisponible',
              distance: 0,
              elevation: 0,
              difficulty: 'Inconnue',
              image: '/images/default-route.jpg'
            }
          }
        );
        
        if (data) {
          setRoute(data);
        }
      } catch (error) {
        // Déjà géré par handleApiRequest
      }
    };
    
    fetchRoute();
  }, [routeId, handleApiRequest]);
  
  if (!route) return <div>Chargement...</div>;
  
  return (
    <ErrorBoundary>
      <div className="route-details">
        <h1>{route.name}</h1>
        {/* Affichage des détails du parcours */}
      </div>
    </ErrorBoundary>
  );
}
```

### Exemple : Sauvegarde d'un parcours

```jsx
// components/RouteSaveForm.js
import React, { useState } from 'react';
import useErrorHandler from '../hooks/useErrorHandler';
import api from '../services/api';
import { withRetry } from '../utils/RetryStrategy';

function RouteSaveForm({ route, onSaved }) {
  const { handleApiRequest, handleError } = useErrorHandler();
  const [isSaving, setIsSaving] = useState(false);
  
  // Créer une version avec retry de la fonction de sauvegarde
  const saveWithRetry = withRetry(
    (data) => api.post('/routes', data),
    {
      maxRetries: 3,
      baseDelay: 1000
    }
  );
  
  const validateRoute = (routeData) => {
    if (!routeData.name || routeData.name.trim() === '') {
      handleError(
        'Le nom du parcours est requis',
        'validation/required-fields',
        {
          severity: 'warning',
          showNotification: true
        }
      );
      return false;
    }
    
    if (routeData.distance <= 0) {
      handleError(
        'La distance doit être supérieure à 0',
        'validation/invalid-value',
        {
          severity: 'warning',
          showNotification: true
        }
      );
      return false;
    }
    
    return true;
  };
  
  const handleSave = async () => {
    if (!validateRoute(route)) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const savedRoute = await handleApiRequest(
        () => saveWithRetry(route),
        {
          loadingMessage: 'Sauvegarde en cours...',
          successMessage: 'Parcours sauvegardé avec succès !',
          errorMessage: 'Erreur lors de la sauvegarde du parcours',
          showLoading: true,
          showSuccess: true
        }
      );
      
      if (savedRoute && onSaved) {
        onSaved(savedRoute);
      }
    } catch (error) {
      // Déjà géré par handleApiRequest
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="route-save-form">
      {/* Formulaire de sauvegarde */}
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  );
}
```

## Module Météo

### Exemple : Widget météo avec fallback

```jsx
// components/WeatherWidget.js
import React, { useState, useEffect } from 'react';
import useErrorHandler from '../hooks/useErrorHandler';
import weatherService from '../services/weatherService';
import ErrorBoundary from '../components/common/ErrorBoundary';

function WeatherWidget({ location }) {
  const { handleApiRequest, tryCatch } = useErrorHandler();
  const [weather, setWeather] = useState(null);
  
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await handleApiRequest(
          () => weatherService.getWeather(location),
          {
            // Sans message de chargement pour une expérience fluide
            showLoading: false,
            // Message d'erreur discret
            errorMessage: 'Données météo indisponibles',
            severity: 'info',
            // Données de secours
            fallbackData: {
              temperature: '--',
              conditions: 'Indisponible',
              icon: 'default',
              forecast: []
            }
          }
        );
        
        if (data) {
          // Traitement des données météo avec gestion d'erreur
          const processedData = tryCatch(
            () => ({
              ...data,
              temperature: `${Math.round(data.temperature)}°C`,
              forecast: data.forecast.map(f => ({
                ...f,
                day: new Date(f.date).toLocaleDateString('fr-FR', { weekday: 'short' })
              }))
            }),
            {
              errorMessage: 'Erreur lors du traitement des données météo',
              // Utiliser les données brutes en cas d'erreur
              fallback: data
            }
          );
          
          setWeather(processedData);
        }
      } catch (error) {
        // Déjà géré par handleApiRequest
      }
    };
    
    fetchWeather();
    
    // Rafraîchir toutes les 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [location, handleApiRequest, tryCatch]);
  
  if (!weather) return <div>Chargement...</div>;
  
  return (
    <ErrorBoundary>
      <div className="weather-widget">
        <div className="current-weather">
          <img src={`/images/weather/${weather.icon}.svg`} alt={weather.conditions} />
          <div className="temperature">{weather.temperature}</div>
          <div className="conditions">{weather.conditions}</div>
        </div>
        
        {weather.forecast && weather.forecast.length > 0 && (
          <div className="forecast">
            {weather.forecast.map((day, index) => (
              <div key={index} className="forecast-day">
                <div className="day">{day.day}</div>
                <img src={`/images/weather/${day.icon}.svg`} alt={day.conditions} />
                <div className="temp">{Math.round(day.temperature)}°C</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
```

## Module Profil Utilisateur

### Exemple : Mise à jour du profil avec validation

```jsx
// pages/ProfileEdit.js
import React, { useState, useEffect } from 'react';
import useErrorHandler from '../hooks/useErrorHandler';
import api from '../services/api';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { MaterialUIErrorAdapter } from '../adapters/MaterialUIErrorAdapter';
import { TextField, Button } from '@mui/material';

function ProfileEdit() {
  const { handleApiRequest, handleError } = useErrorHandler();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await handleApiRequest(
          () => api.get('/user/profile'),
          {
            loadingMessage: 'Chargement du profil...',
            errorMessage: 'Impossible de charger votre profil',
            showLoading: true
          }
        );
        
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        // Déjà géré par handleApiRequest
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [handleApiRequest]);
  
  const validateProfile = (profileData) => {
    const errors = {};
    
    if (!profileData.name || profileData.name.trim() === '') {
      errors.name = 'Le nom est requis';
    }
    
    if (!profileData.email || !/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Email invalide';
    }
    
    if (Object.keys(errors).length > 0) {
      handleError(
        'Veuillez corriger les erreurs dans le formulaire',
        'validation/form-errors',
        {
          severity: 'warning',
          showNotification: true,
          details: errors
        }
      );
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfile(profile)) {
      return;
    }
    
    try {
      const updatedProfile = await handleApiRequest(
        () => api.put('/user/profile', profile),
        {
          loadingMessage: 'Mise à jour du profil...',
          successMessage: 'Profil mis à jour avec succès !',
          errorMessage: 'Erreur lors de la mise à jour du profil',
          showLoading: true,
          showSuccess: true
        }
      );
      
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      // Déjà géré par handleApiRequest
    }
  };
  
  if (isLoading) return <div>Chargement...</div>;
  if (!profile) return <div>Impossible de charger le profil</div>;
  
  return (
    <ErrorBoundary>
      <div className="profile-edit">
        <h1>Modifier votre profil</h1>
        
        <form onSubmit={handleSubmit}>
          <MaterialUIErrorAdapter componentName="TextField">
            <TextField
              label="Nom"
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              fullWidth
              margin="normal"
              error={!!profile.errors?.name}
              helperText={profile.errors?.name}
            />
          </MaterialUIErrorAdapter>
          
          <MaterialUIErrorAdapter componentName="TextField">
            <TextField
              label="Email"
              value={profile.email || ''}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              fullWidth
              margin="normal"
              error={!!profile.errors?.email}
              helperText={profile.errors?.email}
            />
          </MaterialUIErrorAdapter>
          
          {/* Autres champs du profil */}
          
          <Button type="submit" variant="contained" color="primary">
            Enregistrer
          </Button>
        </form>
      </div>
    </ErrorBoundary>
  );
}
```

## Module Événements

### Exemple : Calendrier des événements avec gestion des erreurs

```jsx
// components/EventsCalendar.js
import React, { useState, useEffect } from 'react';
import useErrorHandler from '../hooks/useErrorHandler';
import api from '../services/api';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { withMUIErrorHandling } from '../adapters/MaterialUIErrorAdapter';
import { FullCalendar } from '@fullcalendar/react';

// Créer une version sécurisée du calendrier
const SafeFullCalendar = withMUIErrorHandling(FullCalendar, 'FullCalendar');

function EventsCalendar() {
  const { handleApiRequest } = useErrorHandler();
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await handleApiRequest(
          () => api.get('/events'),
          {
            loadingMessage: 'Chargement des événements...',
            errorMessage: 'Impossible de charger les événements',
            showLoading: true,
            // Données de secours
            fallbackData: [
              {
                id: 'default-1',
                title: 'Aucun événement disponible',
                start: new Date(),
                allDay: true,
                color: '#ccc'
              }
            ]
          }
        );
        
        if (data) {
          setEvents(data);
        }
      } catch (error) {
        // Déjà géré par handleApiRequest
      }
    };
    
    fetchEvents();
  }, [handleApiRequest]);
  
  // Interface de secours personnalisée pour ErrorBoundary
  const calendarErrorFallback = (error, errorInfo, resetError) => (
    <div className="calendar-error">
      <h3>Impossible d'afficher le calendrier</h3>
      <p>Nous rencontrons un problème technique. Veuillez réessayer ultérieurement.</p>
      <button onClick={resetError}>Réessayer</button>
    </div>
  );
  
  return (
    <ErrorBoundary fallback={calendarErrorFallback}>
      <div className="events-calendar">
        <h2>Calendrier des événements</h2>
        
        <SafeFullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={(info) => {
            // Gérer le clic sur un événement
          }}
          // Autres options du calendrier
        />
      </div>
    </ErrorBoundary>
  );
}
```

## Conclusion

Ces exemples montrent comment intégrer le système de gestion d'erreurs dans différents modules de l'application. Les principes clés à retenir sont :

1. Utiliser `handleApiRequest` pour toutes les requêtes API
2. Fournir des données de secours pour les composants critiques
3. Envelopper les composants complexes avec `ErrorBoundary`
4. Valider les données utilisateur avec `handleError`
5. Utiliser les adaptateurs pour les composants Material UI
6. Implémenter des stratégies de retry pour les opérations réseau importantes

Pour plus d'informations, consultez la [documentation complète du système d'erreurs](../error-handling-system.md) et le [guide rapide](../guides/error-handling-quickstart.md).
