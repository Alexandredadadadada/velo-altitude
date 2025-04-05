# Documentation des Composants Material UI

Cette documentation présente les composants Material UI utilisés dans l'application Grand Est Cyclisme, leurs propriétés et des exemples d'utilisation.

## Table des matières

1. [Composants Principaux](#composants-principaux)
   - [Card & CardContent](#card--cardcontent)
   - [Grid](#grid)
   - [Typography](#typography)
   - [Button](#button)
   - [Alert](#alert)
2. [Composants Personnalisés](#composants-personnalisés)
   - [StyledCardHeader](#styledcardheader)
   - [EventCard](#eventcard)
   - [StatValue](#statvalue)
   - [ActivityBar](#activitybar)
3. [Navigation](#navigation)
   - [TabNavigation](#tabnavigation)
4. [Accessibilité](#accessibilité)
5. [Meilleures Pratiques](#meilleures-pratiques)

## Composants Principaux

### Card & CardContent

Utilisés pour créer des conteneurs avec une apparence cohérente.

```jsx
<Card>
  <StyledCardHeader 
    title={
      <Typography variant="h6" component="h2">
        Titre de la Carte
      </Typography>
    }
    aria-labelledby="card-title"
  />
  <CardContent>
    {/* Contenu de la carte */}
  </CardContent>
</Card>
```

#### Props
- `className`: Classes CSS additionnelles
- `sx`: Propriétés de style inline avec le système de thème MUI

### Grid

Système de mise en page responsive basé sur une grille de 12 colonnes.

```jsx
<Grid container spacing={4}>
  <Grid item xs={12} md={6} lg={4}>
    {/* Contenu de la colonne */}
  </Grid>
  <Grid item xs={12} md={6} lg={8}>
    {/* Contenu de la colonne */}
  </Grid>
</Grid>
```

#### Props
- `container`: Définit l'élément comme un conteneur de grille
- `item`: Définit l'élément comme un élément de grille
- `spacing`: Espacement entre les éléments (multiple de 8px)
- `xs, sm, md, lg, xl`: Nombre de colonnes à utiliser selon la taille d'écran

### Typography

Système typographique cohérent avec différentes variantes.

```jsx
<Typography variant="h4" component="h1" gutterBottom>
  Titre Principal
</Typography>
<Typography variant="body1" color="text.secondary">
  Texte descriptif secondaire.
</Typography>
```

#### Props
- `variant`: Style typographique (h1-h6, subtitle1, subtitle2, body1, body2, etc.)
- `component`: Élément HTML à utiliser (h1, h2, p, span, etc.)
- `gutterBottom`: Ajoute une marge en bas
- `color`: Couleur du texte (basée sur la palette du thème)

### Button

Boutons avec différentes variantes et styles.

```jsx
<Button 
  variant="contained" 
  color="primary"
  component={Link}
  to="/path"
  aria-label="Description accessible"
>
  Texte du Bouton
</Button>
```

#### Props
- `variant`: "text", "contained", "outlined"
- `color`: "primary", "secondary", "error", "warning", "info", "success"
- `size`: "small", "medium", "large"
- `component`: Composant React à utiliser (pour l'intégration avec React Router)
- `aria-label`: Description accessible pour les lecteurs d'écran

### Alert

Affichage de messages d'alerte ou d'information.

```jsx
<Alert variant="filled" severity="success">
  Opération réussie !
</Alert>
```

#### Props
- `severity`: "error", "warning", "info", "success"
- `variant`: "standard", "filled", "outlined"
- `onClose`: Fonction appelée lors de la fermeture (si l'alerte est fermable)

## Composants Personnalisés

### StyledCardHeader

En-tête de carte stylisé avec couleur de fond primaire.

```jsx
<StyledCardHeader 
  title={
    <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
      <FontAwesomeIcon icon={faIcon} style={{ marginRight: '8px' }} />
      Titre
    </Typography>
  }
  aria-labelledby="id-unique"
/>
```

#### Props
- `title`: Contenu du titre (généralement un Typography avec une icône)
- `aria-labelledby`: ID de l'élément qui étiquette cette en-tête

### EventCard

Carte spécialisée pour afficher des événements avec indication visuelle de participation.

```jsx
<EventCard 
  joined={true}
  tabIndex={0}
  aria-label="Description de l'événement"
>
  <CardContent>
    {/* Contenu de l'événement */}
  </CardContent>
</EventCard>
```

#### Props
- `joined`: Booléen indiquant si l'utilisateur participe à l'événement
- `tabIndex`: Index de tabulation pour l'accessibilité
- `aria-label`: Description accessible pour les lecteurs d'écran

### StatValue

Affichage d'une statistique avec étiquette et valeur.

```jsx
<StatValue>
  <span>Étiquette:</span>
  <strong>Valeur</strong>
</StatValue>
```

### ActivityBar

Barre d'activité pour les visualisations de données.

```jsx
<ActivityBarContainer role="img" aria-label="Description du graphique">
  {data.map((value, index) => {
    const percentage = (value / Math.max(...data)) * 100;
    return (
      <ActivityBar key={index} percentage={percentage} />
    );
  })}
</ActivityBarContainer>
```

#### Props
- `percentage`: Pourcentage de hauteur de la barre (0-100)

## Navigation

### TabNavigation

Système de navigation par onglets avec intégration React Router.

```jsx
<TabNavigation />
```

Ce composant utilise:
- `useLocation` de React Router pour déterminer l'onglet actif
- `Link` de React Router pour la navigation sans rechargement
- `Tabs` et `Tab` de Material UI

## Accessibilité

Tous les composants ont été conçus en tenant compte de l'accessibilité:

1. **Attributs ARIA**:
   - `aria-label`: Description textuelle des éléments
   - `aria-labelledby`: Référence à un élément qui étiquette un autre
   - `role`: Rôle ARIA pour clarifier la fonction d'un élément

2. **Navigation au clavier**:
   - `tabIndex`: Contrôle l'ordre de tabulation
   - Styles de focus visibles pour tous les éléments interactifs

3. **Sémantique HTML**:
   - Utilisation de `Typography` avec `component` approprié
   - Structure hiérarchique des titres (h1, h2, h3)

## Meilleures Pratiques

1. **Utilisation du système de thème**:
   ```jsx
   sx={{ mb: 2, color: 'text.secondary' }}
   ```
   Plutôt que des styles en ligne ou des valeurs codées en dur.

2. **Composants memoïsés**:
   ```jsx
   const MemoizedComponent = React.memo(Component);
   ```
   Pour les composants qui ne changent pas fréquemment.

3. **Chargement paresseux**:
   ```jsx
   const LazyComponent = React.lazy(() => import('./Component'));
   ```
   Pour les composants lourds ou rarement utilisés.

4. **Tests d'accessibilité**:
   - Utiliser axe DevTools pour vérifier les problèmes d'accessibilité
   - Tester avec VoiceOver, NVDA, ou autres lecteurs d'écran
   - Vérifier le contraste des couleurs et le support du zoom
