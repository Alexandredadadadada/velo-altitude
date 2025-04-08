# Budgets de Performance - Velo-Altitude

Ce document définit les objectifs de performance et les budgets pour l'application Velo-Altitude. Il sert de référence pour l'équipe de développement et établit les attentes en termes de performances utilisateur.

## Métriques Web Vitals (Expérience Utilisateur)

| Métrique | Description | Budget | Priorité | Outil de Mesure |
|----------|-------------|--------|----------|-----------------|
| **LCP (Largest Contentful Paint)** | Temps d'affichage du contenu principal | < 2.5s | Haute | Lighthouse, Web Vitals JS |
| **INP (Interaction to Next Paint)** | Réactivité aux interactions utilisateur | < 200ms | Haute | Web Vitals JS |
| **CLS (Cumulative Layout Shift)** | Stabilité visuelle | < 0.1 | Moyenne | Lighthouse, Web Vitals JS |

## Métriques de Chargement & Réseau

| Métrique | Description | Budget | Priorité | Outil de Mesure |
|----------|-------------|--------|----------|-----------------|
| **TTFB Initial** | Temps de première réponse serveur | < 800ms | Moyenne | Lighthouse, Navigation Timing API |
| **TTFB API** | Temps de réponse des appels API | < 400ms | Haute | Performance API, React Query DevTools |
| **Initial JS Bundle** | Taille du JS initial (compressé) | < 250Ko | Haute | webpack-bundle-analyzer |
| **Initial CSS** | Taille du CSS initial (compressé) | < 100Ko | Moyenne | webpack-bundle-analyzer |
| **Total Assets Critiques** | Taille totale des ressources critiques | < 1Mo | Moyenne | Lighthouse |
| **Requêtes Réseau Initiales** | Nombre de requêtes au chargement | < 25 | Basse | DevTools Network, Lighthouse |
| **Temps de Chargement Total** | De la navigation à l'interactivité complète | < 4s | Haute | Lighthouse, Performance API |

## Métriques Spécifiques à Velo-Altitude

| Métrique | Description | Budget | Priorité | Outil de Mesure |
|----------|-------------|--------|----------|-----------------|
| **Temps de Rendu 3D Initial** | Premier affichage des visualisations 3D | < 2s | Haute | Performance API (marqueurs personnalisés) |
| **FPS en Navigation 3D (Desktop)** | Fluidité des interactions 3D sur desktop | > 50 FPS | Haute | FPS API, Spector.js |
| **FPS en Navigation 3D (Mobile)** | Fluidité des interactions 3D sur mobile | > 30 FPS | Haute | FPS API, Spector.js |
| **Temps de Chargement Cartographique** | Affichage des tiles de carte | < 1.5s | Moyenne | Performance API (marqueurs personnalisés) |
| **Réactivité des Filtres** | Temps de réponse des filtres de recherche | < 150ms | Moyenne | Performance API (marqueurs personnalisés) |
| **Temps d'Affichage Liste des Cols** | Rendu de la liste principale des cols | < 1s | Moyenne | Performance API (marqueurs personnalisés) |

## Segmentation par Appareil et Réseau

Les budgets ci-dessus sont définis pour des conditions moyennes. Voici les ajustements par contexte :

### Par Type d'Appareil

| Appareil | Ajustement des Budgets | Notes |
|----------|------------------------|-------|
| **Desktop (Haut de gamme)** | -30% sur les budgets temporels | Performance optimale attendue |
| **Desktop (Standard)** | Budgets standards | Référence de base |
| **Tablette** | +30% sur les budgets temporels | Tolérance moyenne |
| **Mobile (Milieu de gamme)** | +50% sur les budgets temporels | Tolérance élevée |
| **Mobile (Bas de gamme)** | +100% sur les budgets temporels, réduction des effets 3D | Mode dégradé acceptable |

### Par Type de Connexion

| Connexion | Ajustement des Budgets | Notes |
|-----------|------------------------|-------|
| **WiFi/Fibre** | Budgets standards | Référence de base |
| **4G** | +30% sur les budgets temporels | Tolérance moyenne |
| **3G** | +100% sur les budgets temporels, chargement progressif | Expérience dégradée acceptable |
| **Hors ligne** | Fonctionnalités essentielles disponibles via cache | Mode hors ligne fonctionnel |

## Stratégie d'Amélioration Continue

1. **Mesurer régulièrement** : Intégrer les tests de performance dans la CI/CD
2. **Prioriser les optimisations** : Adresser d'abord les métriques marquées "Haute" priorité
3. **Tester sur des appareils réels** : Ne pas se limiter aux émulateurs pour les tests finaux
4. **Automatiser l'alerte** : Configurer des alertes lors de régressions significatives
5. **Documenter les optimisations** : Maintenir un registre des techniques d'optimisation efficaces

## Techniques d'Optimisation Prioritaires

1. **Code-Splitting** : Découper le bundle par route et fonctionnalité
2. **Lazy-Loading** : Charger à la demande les composants hors-écran et non critiques
3. **Optimisation des Images** : Utiliser les formats modernes (WebP, AVIF) et le responsive loading
4. **Mise en Cache** : Exploiter au maximum React Query et le cache HTTP
5. **Pré-chargement Stratégique** : Utiliser `<link rel="preload">` pour les ressources critiques
6. **Optimisation des Librairies 3D** : Réduire les géométries, optimiser les shaders, niveau de détail adaptatif

## Outils et Processus de Monitoring

1. **Outils Intégrés** : Web Vitals JS, Performance API
2. **Surveillance CI/CD** : Lighthouse CI, Performance Budget Github Action
3. **Alertes Automatisées** : Notifications Slack/Teams en cas de régression
4. **Dashboard de Performance** : Tableau de bord centralisant les métriques de performance
5. **Analyse de Bundle** : webpack-bundle-analyzer intégré au build process
6. **Tests de Charge** : k6 pour simuler le comportement sous charge
