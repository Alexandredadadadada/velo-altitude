# Documentation de la Gestion d'État avec Context API

Ce document explique l'architecture de gestion d'état implémentée dans l'application Euro Cycling Dashboard, utilisant React Context API pour centraliser et simplifier la gestion des données.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Contextes disponibles](#contextes-disponibles)
3. [ChallengeContext](#challengecontext)
4. [Bonnes pratiques](#bonnes-pratiques)
5. [Migration depuis la gestion d'état locale](#migration-depuis-la-gestion-détat-locale)
6. [Dépannage](#dépannage)

## Vue d'ensemble

Notre application utilise React Context API pour gérer l'état global de manière modulaire et efficace. Cette approche offre plusieurs avantages :

- **Réduction du prop drilling** : Évite de passer des props à travers de nombreux composants
- **Centralisation de la logique** : Sépare la logique métier de l'interface utilisateur
- **Meilleure testabilité** : Facilite les tests unitaires et d'intégration
- **Performances optimisées** : Réduit les re-rendus inutiles avec une structure optimisée
- **Maintenabilité améliorée** : Organisation claire du code par domaine fonctionnel

## Contextes disponibles

| Contexte | Fichier | Description |
|----------|---------|-------------|
| AuthContext | `/contexts/AuthContext.js` | Gestion de l'authentification et des utilisateurs |
| ThemeContext | `/contexts/ThemeContext.js` | Configuration et changement de thème |
| ChallengeContext | `/contexts/ChallengeContext.js` | Gestion des défis "7 Majeurs" |
| NotificationContext | `/contexts/NotificationContext.js` | Système de notifications et alertes |
| SettingsContext | `/contexts/SettingsContext.js` | Préférences utilisateur et configuration |

## ChallengeContext

Le `ChallengeContext` est un exemple complet de notre architecture de gestion d'état. Il centralise toute la logique liée aux défis "Les 7 Majeurs".

### États gérés

- Liste des cols disponibles et sélectionnés
- Filtres de recherche et pagination
- États des boîtes de dialogue et des formulaires
- Données météo et informations de planification
- Notifications spécifiques aux défis

### Actions disponibles

```javascript
// Exemples d'actions disponibles dans ChallengeContext
const { 
  // Actions de recherche et filtrage
  setFilters, setPage, 
  
  // Actions de gestion des cols
  selectCol, removeCol, markColAsCompleted,
  
  // Actions de gestion du défi
  saveChallenge, loadChallenge, deleteChallenge,
  
  // Actions d'interface utilisateur
  viewColDetails, closeColDetails, scheduleAscent
} = useChallenge();
```

### Utilisation dans un composant

```jsx
import React from 'react';
import { useChallenge } from '../../contexts/ChallengeContext';

const ColCard = ({ col }) => {
  const { 
    selectCol, 
    selectedCols, 
    viewColDetails,
    userCompletedCols
  } = useChallenge();
  
  const isSelected = selectedCols.some(c => c.id === col.id);
  const isCompleted = userCompletedCols.includes(col.id);
  
  return (
    <Card>
      <CardHeader title={col.name} />
      <CardContent>
        <Typography>Altitude: {col.altitude}m</Typography>
        <Typography>Difficulté: {col.difficulty}/10</Typography>
      </CardContent>
      <CardActions>
        <Button onClick={() => viewColDetails(col)}>
          Détails
        </Button>
        
        {!isSelected && (
          <Button onClick={() => selectCol(col)} disabled={selectedCols.length >= 7}>
            Ajouter au défi
          </Button>
        )}
        
        {isCompleted && <CheckCircleIcon color="success" />}
      </CardActions>
    </Card>
  );
};

export default ColCard;
```

## Bonnes pratiques

Pour une utilisation efficace des contextes :

1. **Créez des contextes par domaine fonctionnel** plutôt qu'un seul contexte global
2. **Utilisez la mémoisation** pour éviter les re-rendus inutiles :
   ```javascript
   const memoizedValue = useMemo(() => ({
     state,
     actions
   }), [dependencies]);
   ```
3. **Séparez les données fréquemment modifiées** des données stables dans différents contextes
4. **Utilisez des reducers** pour les logiques d'état complexes
5. **Combinez avec d'autres hooks** comme `useCallback` pour optimiser les performances

## Migration depuis la gestion d'état locale

Lorsque vous migrez un composant pour utiliser un contexte :

1. **Identifiez l'état local** qui devrait être déplacé vers le contexte
2. **Remplacez `useState` et `useEffect`** par les valeurs et actions du contexte
3. **Adaptez les gestionnaires d'événements** pour utiliser les actions du contexte
4. **Simplifiez le JSX** en utilisant directement les valeurs du contexte
5. **Ajoutez des memoizations** pour optimiser les performances si nécessaire

### Exemple de refactorisation

#### Avant (avec état local) :

```jsx
const MyComponent = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await api.getItems();
        setItems(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchItems();
  }, []);
  
  return (
    <div>
      {loading ? (
        <Loading />
      ) : (
        <ItemList items={items} />
      )}
    </div>
  );
};
```

#### Après (avec contexte) :

```jsx
const MyComponent = () => {
  const { items, loading } = useItemsContext();
  
  return (
    <div>
      {loading ? (
        <Loading />
      ) : (
        <ItemList items={items} />
      )}
    </div>
  );
};
```

## Dépannage

| Problème | Causes possibles | Solutions |
|----------|------------------|-----------|
| Le contexte n'est pas à jour | Provider mal positionné dans l'arbre de composants | Vérifiez que le Provider englobe tous les composants concernés |
| Multiples instances d'un contexte | Plusieurs Providers pour le même contexte | Assurez-vous que les Providers sont placés au bon niveau |
| Performances dégradées | Re-rendus excessifs | Utilisez `useMemo` et `useCallback` pour optimiser |
| Valeurs undefined | Composant utilisé en dehors du Provider | Ajoutez des valeurs par défaut dans `createContext()` |
| État perdu lors des transitions de page | Contexte non maintenu entre les routes | Placez le Provider au niveau du routeur ou utilisez un contexte global |
