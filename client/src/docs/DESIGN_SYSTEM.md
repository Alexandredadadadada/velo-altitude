# Système de Design Velo-Altitude

## Stratégie de Style Officielle

Le système de design de Velo-Altitude est basé sur une approche centralisée utilisant Material-UI avec un thème personnalisé. Cette documentation clarifie la stratégie officielle et les meilleures pratiques pour maintenir la cohérence visuelle.

### Approche principale (À UTILISER)

1. **Design System basé sur Material-UI**
   - Thème centralisé dans `design-system/theme.js`
   - Tokens (couleurs, typographie, espacement) dans `design-system/tokens/`
   - Composants MUI stylisés via la propriété `sx` ou `styled`

2. **Utilitaires de Support**
   - `utils/styleUtils.js` - Fonctions pour assurer la cohérence des styles
   - `hoc/withDesignSystemStyles.jsx` - HOC pour migrer les composants legacy

### Approches secondaires (À ÉVITER/MIGRER)

1. **CSS Global**
   - `App.css` - En cours de migration vers le design system
   - `styles/DarkModeStyles.css` - Utiliser le mode sombre de MUI à la place

2. **Variables CSS**
   - Les variables CSS dans `:root` sont progressivement remplacées par les tokens du design system

## Guide d'utilisation

### Comment styliser un nouveau composant

```jsx
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Option 1: Utiliser la propriété sx (recommandée pour les cas simples)
const MyComponent = () => (
  <Box sx={{ 
    bgcolor: 'primary.light', 
    p: 2,
    borderRadius: 1 
  }}>
    <Typography variant="h4" sx={{ color: 'text.primary' }}>
      Titre
    </Typography>
  </Box>
);

// Option 2: Utiliser styled (recommandée pour les styles réutilisables)
const StyledCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  '&:hover': {
    boxShadow: theme.shadows[3]
  }
}));
```

### Comment migrer un composant legacy

1. **Utiliser le HOC withDesignSystemStyles**

```jsx
import withDesignSystemStyles from '../hoc/withDesignSystemStyles';

// Composant avec des styles legacy
const LegacyComponent = ({ className, style, ...props }) => (
  <div className={`legacy-class ${className}`} style={style}>
    {/* contenu */}
  </div>
);

// Composant migré
export default withDesignSystemStyles(LegacyComponent);
```

2. **Migrer manuellement un composant**

```jsx
// AVANT
import './styles.css';

const OldComponent = () => (
  <div className="card">
    <h2 className="card-title">Titre</h2>
    <p className="card-text">Texte</p>
  </div>
);

// APRÈS
import { Card, CardContent, Typography } from '@mui/material';

const NewComponent = () => (
  <Card>
    <CardContent>
      <Typography variant="h5">Titre</Typography>
      <Typography variant="body1">Texte</Typography>
    </CardContent>
  </Card>
);
```

## Tokens disponibles

### Palette de couleurs

- **Couleurs primaires**: `primary.main`, `primary.light`, `primary.dark`
- **Couleurs secondaires**: `secondary.main`, `secondary.light`, `secondary.dark`
- **Couleurs d'accentuation**: `accent.orange`, `accent.red`, `accent.yellow`
- **Niveaux de difficulté**: `difficulty.easy` à `difficulty.extreme`
- **Couleurs fonctionnelles**: `functional.success`, `functional.error`, etc.
- **Couleurs neutres**: `neutral.paper`, `neutral.white`, `neutral.grey[100-900]`

### Typographie

- **Variantes**: `h1` à `h6`, `body1`, `body2`, `button`, `caption`, `overline`
- **Typographies spéciales**: `techTypography`, `altitudeTypography`

### Espacements

L'espacement suit une échelle de 8px, accessible via la fonction `spacing` :
- `spacing(1)` = 8px
- `spacing(2)` = 16px, etc.

## Vérification de la cohérence

Pour vérifier et nettoyer les styles inutilisés :

1. Exécuter le script de purge CSS : `node src/scripts/purgeCss.js`
2. Examiner les fichiers résultants dans `src/styles/purged/`
3. Vérifier les classes rejetées dans les fichiers `.log`

## Processus de migration

1. Les nouveaux composants doivent utiliser exclusivement l'approche principale
2. Les composants existants doivent être progressivement migrés selon les priorités
3. Priorité aux composants partagés et aux écrans principaux

## Responsabilités

- **Tous les développeurs** doivent suivre ces directives pour les nouvelles fonctionnalités
- Les **revues de code** doivent vérifier la conformité avec le design system
- La **dette technique** liée aux styles doit être documentée et planifiée pour refactoring
