# Documentation d'intégration météo - Explorateur de Cols

## Vue d'ensemble

Cette documentation détaille l'intégration des données météorologiques en temps réel dans l'Explorateur de Cols du site Dashboard-Velo.com. Cette fonctionnalité permet aux cyclistes de consulter les conditions météorologiques actuelles pour chaque col, facilitant ainsi la planification des sorties et l'évaluation des conditions de route.

## Architecture

### Composants impliqués

1. **ColWeatherMap.js** : Composant principal pour l'affichage cartographique des cols avec leurs données météo
2. **ColsList.js** : Affichage en liste des cols avec données météo intégrées
3. **ColsExplorer.js** : Composant parent orchestrant l'ensemble des fonctionnalités
4. **ColFilterBar.js** : Système de filtrage incluant l'option de filtrer par présence de données météo

### Flux de données

```
API OpenWeatherMap → ColWeatherMap → État React → ColsList
                                   ↓
                               ColsExplorer ← ColFilterBar
```

## Intégration API

### Configuration requise

L'intégration utilise l'API OpenWeatherMap qui nécessite une clé API. Cette clé doit être configurée dans les variables d'environnement :

```
REACT_APP_OPENWEATHER_API_KEY=votre_clé_api
```

### Points d'API utilisés

- **Current Weather Data** : `/data/2.5/weather`
  - Paramètres : lat, lon, units (metric), appid
  - Fréquence de mise à jour : toutes les 10 minutes

## Implémentation technique

### Récupération des données météo

```javascript
const fetchWeatherData = async (col) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${col.coordinates.lat}&lon=${col.coordinates.lng}&units=metric&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}`
    );
    
    return {
      ...col,
      weather: {
        temp: response.data.main.temp,
        description: response.data.weather[0].description,
        windSpeed: response.data.wind.speed,
        weatherCode: response.data.weather[0].id,
        icon: response.data.weather[0].icon,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        updatedAt: new Date().toLocaleString(),
      }
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération des données météo pour ${col.name}:`, error);
    return {
      ...col,
      weather: null
    };
  }
};
```

### Logique de correspondance des icônes météo

```javascript
const getWeatherIcon = (weatherCode) => {
  if (weatherCode >= 200 && weatherCode < 300) return weatherIcons.thunderstorm;
  if (weatherCode >= 300 && weatherCode < 400) return weatherIcons.rain;
  if (weatherCode >= 500 && weatherCode < 600) return weatherIcons.rain;
  if (weatherCode >= 600 && weatherCode < 700) return weatherIcons.snow;
  if (weatherCode >= 700 && weatherCode < 800) return weatherIcons.mist;
  if (weatherCode === 800) return weatherIcons.clear;
  if (weatherCode > 800) return weatherIcons.clouds;
  return weatherIcons.default;
};
```

## Gestion des coordonnées géographiques

Comme certains cols dans la base de données n'ont pas de coordonnées définies, un système d'attribution de coordonnées par défaut a été mis en place :

```javascript
const addDefaultCoordinates = (cols, region) => {
  return cols.map(col => {
    if (col.coordinates) return col;
    
    let defaultCoordinates = { lat: 0, lng: 0 };
    
    switch (region) {
      case 'alpes':
        defaultCoordinates = { lat: 45.8, lng: 6.9 };
        break;
      // Autres régions...
      default:
        defaultCoordinates = { lat: 45.8, lng: 6.9 };
    }
    
    return {
      ...col,
      coordinates: defaultCoordinates
    };
  });
};
```

## Optimisations

### Mise en cache

Pour éviter de surcharger l'API OpenWeatherMap et améliorer les performances :

1. Les données météo sont mises en cache côté client pendant 10 minutes
2. Les requêtes sont regroupées pour minimiser le nombre d'appels API
3. Implémentation d'un mécanisme de retry avec délai exponentiel en cas d'échec

### Performances

Optimisations pour garantir de bonnes performances :

1. Chargement paresseux (lazy loading) des données météo uniquement lorsqu'elles sont nécessaires
2. Mise en cache des icônes météo
3. Utilisation de React.memo pour éviter les re-renderings inutiles

## Tests et validation

### Scénarios de test

1. **Test de récupération des données** : Vérification que les données sont correctement récupérées pour différents cols
2. **Test de gestion d'erreur** : Validation du comportement en cas d'échec de l'API
3. **Test de performance** : Mesure du temps de chargement avec un grand nombre de cols
4. **Test de filtrage** : Validation du filtrage par présence de données météo

### Code de test

Un exemple de test Jest pour valider la récupération des données météo :

```javascript
test('récupère correctement les données météo', async () => {
  // Mock de l'API OpenWeatherMap
  axios.get.mockResolvedValueOnce({
    data: {
      main: { temp: 15.5, humidity: 70, pressure: 1013 },
      weather: [{ id: 800, description: 'ciel dégagé', icon: '01d' }],
      wind: { speed: 10 }
    }
  });
  
  const col = { id: 'test', name: 'Test Col', coordinates: { lat: 45.8, lng: 6.9 } };
  const result = await fetchWeatherData(col);
  
  expect(result.weather).toBeDefined();
  expect(result.weather.temp).toBe(15.5);
  expect(result.weather.weatherCode).toBe(800);
});
```

## Quotas et limitations

L'API OpenWeatherMap impose des limitations sur le nombre d'appels API :

- Plan gratuit : 60 appels par minute / 1,000,000 par mois
- Plan Startup : 600 appels par minute / 5,000,000 par mois

Notre implémentation respecte ces limitations en :

1. Limitant les appels API uniquement à la vue Carte Météo
2. Mettant en cache les résultats pour éviter les appels répétés
3. Implémentant une file d'attente pour gérer les pics d'utilisation

## Considérations futures

### Améliorations prévues

1. **Prévisions à 5 jours** : Intégration des prévisions météo pour les prochains jours
2. **Alertes météo** : Notification des conditions dangereuses (orages, neige, etc.)
3. **Historique météo** : Affichage des tendances météorologiques pour chaque col
4. **Recommandations intelligentes** : Suggestion de cols en fonction des conditions météo actuelles

## Dépannage

### Problèmes courants

1. **Données météo non disponibles** : Vérifier la clé API et les quotas OpenWeatherMap
2. **Coordonnées incorrectes** : Vérifier les coordonnées dans la base de données des cols
3. **Lenteur de chargement** : Vérifier la mise en cache et le regroupement des requêtes

## Conclusion

L'intégration météo dans l'Explorateur de Cols offre une valeur ajoutée significative pour les utilisateurs, en leur permettant de planifier efficacement leurs sorties cyclistes en fonction des conditions météorologiques actuelles. L'implémentation est optimisée pour maintenir de bonnes performances tout en respectant les limitations de l'API externe.

---

Document créé le : 05/04/2025
Version : 1.0
