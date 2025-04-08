# Documentation RBAC Auth0 pour Velo-Altitude

## Introduction

Ce document décrit l'implémentation du contrôle d'accès basé sur les rôles (RBAC) dans l'application Velo-Altitude en utilisant Auth0. Il explique comment les rôles sont définis dans Auth0, comment ils sont transmis à l'application, et comment ils sont utilisés pour contrôler l'accès aux fonctionnalités.

## Configuration Auth0

### Structure des rôles

L'application Velo-Altitude utilise un système RBAC à deux niveaux principaux :

1. **Utilisateur standard** (`user`) : Accès aux fonctionnalités de base de l'application
2. **Administrateur** (`admin`) : Accès complet, y compris aux fonctionnalités d'administration

### Configuration dans le Dashboard Auth0

Pour configurer correctement les rôles dans Auth0 :

1. Connectez-vous au [Dashboard Auth0](https://manage.auth0.com/)
2. Sélectionnez votre locataire (tenant) Velo-Altitude
3. Accédez à **Auth Pipeline** > **Authorization** > **Roles**
4. Créez (si ce n'est pas déjà fait) les rôles suivants :
   - `user` : Rôle par défaut pour tous les utilisateurs
   - `admin` : Rôle d'administrateur pour la gestion de l'application

### Attribution des rôles aux utilisateurs

Pour attribuer des rôles aux utilisateurs :

1. Accédez à **User Management** > **Users** dans le Dashboard Auth0
2. Sélectionnez l'utilisateur auquel vous souhaitez attribuer un rôle
3. Allez dans l'onglet **Roles**
4. Cliquez sur **Assign Roles** et sélectionnez le rôle approprié

### Configuration du namespace personnalisé

Velo-Altitude utilise un namespace personnalisé pour transmettre les rôles dans le token JWT :

```
https://velo-altitude.com/roles
```

Pour configurer ce namespace, vous devez ajouter une règle (rule) dans Auth0 :

1. Accédez à **Auth Pipeline** > **Rules**
2. Cliquez sur **Create Rule** et sélectionnez **Empty Rule**
3. Nommez la règle "Add Roles to JWT"
4. Utilisez le code suivant :

```javascript
function addRolesToJWT(user, context, callback) {
  const namespace = 'https://velo-altitude.com/';
  
  // Récupérer les rôles de l'utilisateur
  const assignedRoles = (context.authorization || {}).roles || [];
  
  // Ajouter un rôle 'user' par défaut à tous les utilisateurs authentifiés si ce n'est pas déjà fait
  if (!assignedRoles.includes('user')) {
    assignedRoles.push('user');
  }
  
  // Ajouter les rôles au token avec le namespace personnalisé
  context.idToken[namespace + 'roles'] = assignedRoles;
  context.accessToken[namespace + 'roles'] = assignedRoles;
  
  callback(null, user, context);
}
```

5. Enregistrez la règle

## Implémentation dans l'application

### Vérification des rôles

La vérification des rôles est implémentée dans la fonction `hasRole` du module `AuthCore.tsx` :

```typescript
const hasRole = (user: User | undefined, role: string): boolean => {
  if (!user) return false;
  
  // Vérifier dans les permissions Auth0 standard
  // https://auth0.com/docs/manage-users/access-control/sample-use-cases-rbac
  const roles = user['https://velo-altitude.com/roles'] || [];
  if (Array.isArray(roles) && roles.includes(role)) {
    return true;
  }
  
  // Fallback pour la méthode actuelle basée sur l'email (à enlever après migration complète)
  if (role === 'admin' && user.email?.includes('admin')) {
    return true;
  }
  
  return false;
};
```

**Note importante** : Un fallback temporaire basé sur l'email existe pour faciliter la transition. À terme, cette méthode sera supprimée pour ne conserver que la vérification basée sur les claims Auth0.

### Utilisation dans les composants React

Pour les composants React, la propriété `isAdmin` est exposée via le hook `useAuth` :

```typescript
const { isAdmin } = useAuth();

// Utilisation pour conditionner l'affichage
{isAdmin && <AdminPanel />}
```

### Utilisation dans les routes protégées

Le contrôle d'accès aux routes est géré par le composant `ProtectedRoute` qui utilise les rôles pour déterminer l'accès :

```typescript
import { useSafeAuth } from './AuthCore';

const ProtectedRoute = ({ requireAdmin, ...rest }) => {
  const { isAuthenticated, isAdmin, loading } = useSafeAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <Route {...rest} />;
};
```

### Utilisation dans les appels API

Pour les appels API, les rôles sont vérifiés par le backend qui reçoit le token JWT contenant les claims de rôles. Le token est automatiquement attaché aux requêtes API via les intercepteurs.

## Test et débogage

### Inspecter les tokens

Pour vérifier que les rôles sont correctement inclus dans les tokens JWT :

1. Utilisez l'extension [JWT.io](https://jwt.io/) pour décoder un token d'accès
2. Vérifiez la présence du claim `https://velo-altitude.com/roles` contenant un tableau des rôles attribués

### Simulation locale

Pour tester localement sans configurer Auth0 :

1. Assurez-vous d'avoir un compte de test avec le rôle approprié dans Auth0
2. Connectez-vous à l'application avec ce compte de test
3. Vérifiez les logs de l'application pour confirmer que les rôles sont correctement chargés

## Bonnes pratiques et conseils

1. **Sécurité** : Ne vous fiez jamais uniquement au frontend pour la vérification des autorisations. Le backend doit toujours vérifier les rôles pour les opérations sensibles.

2. **Réutilisabilité** : Utilisez les hooks `useAuth` ou `useSafeAuth` de manière cohérente plutôt que de réimplémenter la logique d'autorisation.

3. **Évolution** : Lorsque vous ajoutez de nouveaux rôles ou permissions, assurez-vous de mettre à jour à la fois la configuration Auth0 et la documentation.

4. **Audit** : Activez les logs d'audit dans Auth0 pour suivre les modifications apportées aux rôles et permissions.

## Migration complète

Le système est actuellement dans une phase de transition. Pour finaliser la migration vers le RBAC complet :

1. Assurez-vous que tous les utilisateurs ont les rôles appropriés définis dans Auth0
2. Testez exhaustivement la vérification des rôles basée sur les claims Auth0
3. Supprimez le fallback basé sur l'email dans la fonction `hasRole`
4. Mettez à jour les tests unitaires pour refléter la nouvelle méthode de vérification

## Références

- [Documentation officielle Auth0 sur RBAC](https://auth0.com/docs/manage-users/access-control/rbac)
- [Tutoriel Auth0 sur les règles (rules)](https://auth0.com/docs/customize/rules/create-rules)
- [Bonnes pratiques pour le contrôle d'accès](https://auth0.com/blog/role-based-access-control-rbac-and-react-apps/)
