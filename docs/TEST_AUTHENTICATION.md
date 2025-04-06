# Guide de test de l'authentification Velo-Altitude

Ce document détaille les procédures de test pour les trois scénarios d'authentification implémentés dans l'application Velo-Altitude.

## Prérequis

- Application Velo-Altitude en cours d'exécution localement (`npm start` dans le dossier `client`)
- Configuration Auth0 locale fonctionnelle (variables d'environnement configurées)
- Navigateur avec console développeur accessible (F12)

## Scénario 1: Test du flux Auth0 standard

### Objectif
Vérifier le fonctionnement normal du processus d'authentification Auth0.

### Étapes
1. Accédez à l'application à l'adresse `http://localhost:3000`
2. Cliquez sur le bouton "Connexion" ou tentez d'accéder à une page protégée
3. Complétez le processus d'authentification Auth0 avec des identifiants valides
4. Vérifiez que vous êtes correctement redirigé vers l'application après connexion
5. Ouvrez la console développeur (F12) et examinez le localStorage:
   ```
   // Exécutez dans la console
   console.log(localStorage.getItem('auth0_user'));
   console.log(localStorage.getItem('auth0_token'));
   ```
6. Vérifiez que vous pouvez accéder aux pages protégées

### Validation
- ✅ Redirection vers Auth0 fonctionne
- ✅ Connexion réussie avec Auth0
- ✅ Profil utilisateur correctement récupéré
- ✅ Token stocké dans localStorage
- ✅ Accès aux pages protégées autorisé

## Scénario 2: Test du basculement vers le mode d'urgence

### Objectif
Vérifier que l'application bascule correctement en mode d'urgence en cas de défaillance d'Auth0.

### Étapes
1. Accédez à l'application avec le paramètre d'échec simulé: `http://localhost:3000?auth_fail=true`
2. Tentez de vous connecter comme dans le scénario 1
3. Observez le comportement de l'application après l'échec d'Auth0
4. Vérifiez la redirection vers la page de connexion d'urgence
5. Connectez-vous avec les identifiants d'urgence:
   - Email: `admin@velo-altitude.com`
   - Mot de passe: `emergency123`
6. Vérifiez que vous êtes connecté avec des fonctionnalités limitées

### Validation
- ✅ Détection correcte de l'échec d'Auth0
- ✅ Basculement automatique vers le mode d'urgence
- ✅ Interface de connexion d'urgence fonctionnelle
- ✅ Authentification d'urgence réussie
- ✅ Accès aux fonctionnalités de base en mode dégradé

## Scénario 3: Test direct du mode d'urgence

### Objectif
Vérifier le fonctionnement du mode d'urgence lorsqu'il est activé directement.

### Étapes
1. Accédez à l'application avec le paramètre d'urgence: `http://localhost:3000?emergency=true`
2. Observez que l'application saute complètement le flux Auth0
3. Connectez-vous via l'interface d'urgence
4. Vérifiez la persistance de la session en actualisant la page
5. Déconnectez-vous puis reconnectez-vous en mode d'urgence

### Validation
- ✅ Activation directe du mode d'urgence
- ✅ Interface d'urgence correctement affichée
- ✅ Persistance de la session d'urgence entre les actualisations
- ✅ Fonctionnalités critiques accessibles en mode d'urgence

## Rapport de test

Pour chaque scénario, documentez les résultats en utilisant le modèle suivant:

```
# Rapport de test - [Date]

## Scénario 1: Flux Auth0 standard
- Résultat: [Succès/Échec]
- Problèmes identifiés: [Détails]
- Captures d'écran: [Liens]

## Scénario 2: Basculement vers mode d'urgence
- Résultat: [Succès/Échec]
- Problèmes identifiés: [Détails]
- Captures d'écran: [Liens]

## Scénario 3: Mode d'urgence direct
- Résultat: [Succès/Échec]
- Problèmes identifiés: [Détails]
- Captures d'écran: [Liens]

## Remarques générales
[Vos observations sur l'expérience globale]
```

## Dépannage courant

### Problème: Erreur "useAuth must be used within an AuthProvider"
- **Solution**: Vérifiez que le script `auth-override.js` est correctement chargé avant l'application React

### Problème: Échec silencieux de l'authentification Auth0
- **Solution**: Examinez la console pour les erreurs Auth0 et vérifiez les variables d'environnement

### Problème: Session d'urgence perdue à l'actualisation
- **Solution**: Vérifiez la persistance localStorage et l'initialisation correcte du state
