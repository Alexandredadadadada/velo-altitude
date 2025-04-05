# Plan de Surveillance Post-Lancement - Dashboard-Velo.com

## Introduction

Ce document définit le plan de surveillance à mettre en place immédiatement après le lancement de Dashboard-Velo.com. Il identifie les métriques critiques à surveiller, établit des seuils d'alerte, définit les rôles et responsabilités de l'équipe de garde, et fournit des procédures d'intervention pour les incidents courants.

## Métriques Critiques et Seuils d'Alerte

### Performance des Serveurs

| Métrique | Description | Seuil d'Alerte | Seuil Critique | Fréquence |
|----------|-------------|----------------|----------------|-----------|
| CPU | Utilisation du processeur | > 70% pendant 5 min | > 90% pendant 2 min | 30s |
| Mémoire | Utilisation de la RAM | > 80% pendant 5 min | > 95% pendant 2 min | 30s |
| Disque | Espace disque disponible | < 20% | < 10% | 5 min |
| Nœuds | Santé des nœuds (cluster) | 1 nœud inactif | > 1 nœud inactif | 1 min |

### Performance de la Base de Données MongoDB

| Métrique | Description | Seuil d'Alerte | Seuil Critique | Fréquence |
|----------|-------------|----------------|----------------|-----------|
| Temps de réponse | Latence des requêtes | > 100ms moyenne | > 500ms moyenne | 1 min |
| Connexions | Nombre de connexions | > 80% capacité | > 95% capacité | 1 min |
| Opérations | Opérations par seconde | > 5000 ops/s | > 8000 ops/s | 30s |
| Verrouillages | Temps d'attente verrouillage | > 10ms moyenne | > 50ms moyenne | 1 min |
| Réplication | Délai de réplication | > 10s | > 30s | 1 min |

### Performance des API

| Métrique | Description | Seuil d'Alerte | Seuil Critique | Fréquence |
|----------|-------------|----------------|----------------|-----------|
| Latence | Temps de réponse API | > 300ms p95 | > 1s p95 | 30s |
| Taux d'erreur | % requêtes en erreur (4xx/5xx) | > 1% | > 5% | 1 min |
| Disponibilité | % de disponibilité | < 99.9% | < 99% | 1 min |

### Métriques Spécifiques aux Modules Critiques

#### Module d'Entraînement

| Métrique | Description | Seuil d'Alerte | Seuil Critique | Fréquence |
|----------|-------------|----------------|----------------|-----------|
| Calcul FTP | Temps de génération | > 2s | > 5s | 5 min |
| Génération Programme | Temps de création | > 3s | > 8s | 5 min |
| Erreurs HIIT | Erreurs générées par le module HIIT | > 10/heure | > 50/heure | 10 min |

#### Explorateur de Cols

| Métrique | Description | Seuil d'Alerte | Seuil Critique | Fréquence |
|----------|-------------|----------------|----------------|-----------|
| Chargement Carte | Temps de rendu initial | > 3s | > 8s | 5 min |
| Filtrage | Temps de réponse filtres | > 500ms | > 2s | 5 min |
| Téléchargements GPX | Erreurs de téléchargement | > 5% taux d'échec | > 15% taux d'échec | 10 min |

### Métriques Utilisateur

| Métrique | Description | Seuil d'Alerte | Seuil Critique | Fréquence |
|----------|-------------|----------------|----------------|-----------|
| Sessions actives | Nombre d'utilisateurs simultanés | > 2000 | > 5000 | 1 min |
| Taux de rebond | % utilisateurs quittant après 1 page | > 60% | > 80% | 30 min |
| Temps de chargement | Performance côté client | > 2s | > 5s | 5 min |
| Erreurs JS | Erreurs JavaScript côté client | > 1% des sessions | > 5% des sessions | 5 min |
| Traductions | Utilisation d'une clé non traduite | > 10/heure | > 50/heure | 15 min |

## Outils de Surveillance

### Infrastructure de Monitoring

- **Prometheus** : Collecte des métriques système et applicatives
- **Grafana** : Visualisation des tableaux de bord et configuration des alertes
- **AlertManager** : Gestion et routage des alertes
- **Loki** : Agrégation et analyse des logs
- **Jaeger** : Traçage distribué pour les requêtes complexes
- **Blackbox Exporter** : Surveillance de disponibilité externe
- **Uptime Robot** : Monitoring externe indépendant

### Tableau de Bord Principal

Un tableau de bord Grafana centralisé sera accessible à l'URL : `https://monitoring.dashboard-velo.com`

Ce tableau de bord comprendra les vues suivantes :
- Vue d'ensemble système (santé globale)
- Performance des API (latence, erreurs, disponibilité)
- Métriques MongoDB (opérations, temps de réponse)
- Activité utilisateur (sessions, conversions, erreurs)
- Logs et événements importants
- État des sauvegardes

### Configuration des Alertes

Les alertes seront distribuées selon les canaux suivants :

| Niveau | Canaux | Délai de notification |
|--------|--------|----------------------|
| Information | Slack #monitoring | Immédiat |
| Alerte | Slack #alerts, Email | Immédiat |
| Critique | Slack #incidents, Email, SMS | Immédiat |
| Urgence | Slack #incidents, Email, SMS, Appel | Immédiat |

## Organisation de l'Équipe de Garde

### Structure et Rotation

L'équipe de garde sera organisée en binômes comprenant :
- 1 ingénieur backend/infrastructure
- 1 ingénieur frontend/UX

La rotation s'effectuera sur une base hebdomadaire (du lundi 9h au lundi suivant 9h).

#### Calendrier Initial (4 semaines post-lancement)

| Semaine | Dates | Binôme Backend/Infra | Binôme Frontend/UX |
|---------|-------|----------------------|-------------------|
| 1 | 7-14 avril | Thomas D. | Sarah M. |
| 2 | 14-21 avril | Marc L. | Julie P. |
| 3 | 21-28 avril | Sophie B. | Romain T. |
| 4 | 28 avril-5 mai | Thomas D. | David C. |

### Niveaux d'Escalade

| Niveau | Description | Temps de réponse | Contact |
|--------|-------------|------------------|---------|
| L1 | Équipe de garde | < 15 min | Selon planning |
| L2 | Experts domaine | < 30 min | Responsables modules |
| L3 | Management technique | < 45 min | CTO + Architectes |
| L4 | Direction | < 60 min | Direction + Communication |

### Contact d'Urgence

Un numéro unique d'astreinte sera actif 24/7 : **+33 7 XX XX XX XX**

Ce numéro sera redirigé automatiquement vers le membre de l'équipe de garde.

## Runbooks pour Incidents Courants

### 1. Latence API Élevée

**Symptômes** : Temps de réponse API > 1s, plaintes utilisateurs sur lenteur

**Actions** :
1. Vérifier les graphiques de charge CPU/mémoire
2. Examiner les logs d'erreur dans Loki (`grep "timeout" OR "slow query"`)
3. Vérifier l'activité MongoDB (`db.currentOp()`)
4. Identifier les requêtes problématiques (`mongostat`, `mongotop`)
5. Si nécessaire, augmenter les ressources des instances API
6. Surveiller l'amélioration des temps de réponse

**Escalade** : Si non résolu après 30 minutes, contacter L2 (Expert Backend)

### 2. Erreurs 5xx

**Symptômes** : Taux d'erreurs 5xx > 5%, alertes utilisateurs

**Actions** :
1. Vérifier les logs d'erreur dans Loki
2. Identifier le pattern et les endpoints concernés
3. Vérifier les déploiements récents (via journal de déploiement)
4. Examiner l'état des services externes (MongoDB, services tiers)
5. Si lié à un déploiement récent, envisager un rollback
6. Si lié à la charge, augmenter les ressources ou activer la mise en cache d'urgence

**Escalade** : Si non résolu après 15 minutes, contacter L2

### 3. Problèmes de Base de Données

**Symptômes** : Latence MongoDB élevée, erreurs de connexion, timeouts

**Actions** :
1. Vérifier l'état de la réplication (`rs.status()`)
2. Examiner les métriques (IOPS, CPU, mémoire)
3. Vérifier l'espace disque disponible
4. Identifier les requêtes lentes (`db.currentOp({ "active": true, "secs_running": { "$gt": 5 } })`)
5. Optimiser les index si nécessaire
6. Augmenter les ressources de l'instance si nécessaire

**Escalade** : Si non résolu après 20 minutes, contacter L2 (Expert DB)

### 4. Problèmes de Traduction

**Symptômes** : Textes non traduits, alertes du moniteur de traduction

**Actions** :
1. Exécuter script de vérification des traductions (`node scripts/checkTranslations.js`)
2. Identifier les modules/langues concernés
3. Vérifier les déploiements récents qui pourraient avoir ajouté du contenu
4. Restaurer les fichiers de traduction depuis la sauvegarde si nécessaire
5. Ajouter les traductions manquantes si le volume est faible
6. Communiquer avec les utilisateurs via bannière si l'impact est important

**Escalade** : Si impact utilisateur significatif, contacter L2 (UX Lead)

### 5. Pic de Charge Inattendu

**Symptômes** : Augmentation soudaine du trafic, ralentissement général

**Actions** :
1. Vérifier la source du trafic (Google Analytics, logs)
2. Confirmer s'il s'agit de trafic légitime ou d'attaque
3. Si légitime, augmenter les ressources des serveurs web et API
4. Activer le mode haute disponibilité (bascule CDN pour contenus statiques)
5. Activer la mise en cache agressive si nécessaire
6. Surveiller l'amélioration des performances

**Escalade** : Si suspicion d'attaque, contacter immédiatement L3

### 6. Problèmes de Sauvegarde

**Symptômes** : Échec des sauvegardes programmées, alertes d'intégrité

**Actions** :
1. Vérifier les logs dans `/var/log/dashboard-velo/backup.log`
2. Identifier la cause exacte de l'échec (espace disque, permissions, timeout)
3. Corriger le problème identifié
4. Déclencher une sauvegarde manuelle (`/scripts/backup.sh`)
5. Vérifier l'intégrité de la nouvelle sauvegarde
6. Mettre à jour le monitoring si nécessaire

**Escalade** : Si problème persistant, contacter L2 (Expert Infra)

### 7. Problèmes d'Authentification

**Symptômes** : Échecs de connexion, déconnexions inattendues

**Actions** :
1. Vérifier les logs d'authentification
2. Tester l'API d'authentification depuis l'extérieur
3. Vérifier la configuration JWT et les secrets
4. Vérifier l'état du service d'identité (si externe)
5. Si nécessaire, augmenter la durée des sessions temporairement
6. Communiquer avec les utilisateurs via bannière

**Escalade** : Si non résolu après 15 minutes, contacter L2 (Expert Sécurité)

## Processus de Communication des Incidents

### Classification des Incidents

| Niveau | Impact | Exemples |
|--------|--------|----------|
| P1 | Critique - Service indisponible | Site down, authentification impossible pour tous |
| P2 | Majeur - Fonctionnalité principale affectée | Module entraînement inaccessible, erreurs fréquentes |
| P3 | Modéré - Problème visible mais contournable | Lenteurs, fonctionnalités secondaires indisponibles |
| P4 | Mineur - Impact limité | Erreurs cosmétiques, problèmes isolés |

### Canaux de Communication

#### Communication Interne

- **Slack #incidents** : Canal principal pour la coordination technique
- **Réunions de crise** : Pour incidents P1/P2 uniquement
- **Email status@dashboard-velo.com** : Pour mise à jour formelle

#### Communication Externe

- **Page de statut** : https://status.dashboard-velo.com
- **Bannière in-app** : Pour les incidents P1/P2
- **Email utilisateurs** : Pour les incidents P1 prolongés
- **Réseaux sociaux** : Pour les incidents P1 uniquement

### Template de Communication

```
[NIVEAU] Incident Dashboard-Velo.com: [TITRE COURT]

État: [En cours / Résolu / Surveillance]
Début: [DATE/HEURE]
Résolution estimée: [DATE/HEURE ou "En investigation"]

Impact: [Description de l'impact utilisateur]

Détails: [Description technique si pertinente]

Contournement: [Instructions si disponibles]

Mises à jour: Suivez l'évolution sur https://status.dashboard-velo.com
```

## Analyse Post-Incident (PostMortem)

Après chaque incident P1/P2 ou tout incident significatif, un PostMortem sera réalisé selon le template suivant :

### Template de PostMortem

```markdown
# PostMortem: [Titre de l'incident]

## Résumé
- **Date/Heure de début** : YYYY-MM-DD HH:MM
- **Date/Heure de fin** : YYYY-MM-DD HH:MM
- **Durée** : X heures Y minutes
- **Impact** : [Description de l'impact utilisateur]
- **Équipe impliquée** : [Liste des intervenants]

## Chronologie
- HH:MM : [Événement]
- HH:MM : [Événement]
- ...

## Cause Racine
[Description détaillée de la cause principale]

## Facteurs Contributifs
- [Facteur 1]
- [Facteur 2]
- ...

## Détection et Réponse
- Comment l'incident a été détecté
- Efficacité de la réponse initiale
- Obstacles rencontrés

## Actions Correctives
- **Court terme** (< 1 semaine)
  - [Action 1] - Responsable: [Nom] - Échéance: [Date]
  - ...
- **Moyen terme** (< 1 mois)
  - [Action 1] - Responsable: [Nom] - Échéance: [Date]
  - ...
- **Long terme**
  - [Action 1] - Responsable: [Nom] - Échéance: [Date]
  - ...

## Leçons Apprises
- [Leçon 1]
- [Leçon 2]
- ...
```

Le PostMortem devra être complété dans les 48 heures suivant la résolution de l'incident et partagé avec toute l'équipe.

## Préparation et Tests

### Exercices Programmés

Des exercices de simulation d'incident seront organisés régulièrement :

| Type | Fréquence | Description |
|------|-----------|-------------|
| Table-top | Bi-mensuel | Simulation théorique d'incidents |
| Chaos Engineering | Mensuel | Introduction contrôlée de défaillances |
| Fail-over | Trimestriel | Test de bascule complète |

### Checklist de Préparation Quotidienne

L'équipe de garde vérifiera quotidiennement :

- [ ] Accès fonctionnels à tous les systèmes
- [ ] Tableaux de bord opérationnels
- [ ] Notifications correctement configurées
- [ ] Documentation à jour et accessible
- [ ] Sauvegardes récentes disponibles et validées

## Améliorations Continues

Le plan de surveillance sera revu et amélioré selon le calendrier suivant :

- **Quotidien** : Revue des alertes et ajustement des seuils si nécessaire
- **Hebdomadaire** : Analyse des tendances et incidents mineurs
- **Mensuel** : Revue complète du plan et mise à jour des runbooks
- **Trimestriel** : Audit complet et exercice de récupération

## Annexes

### A. Configuration des Outils de Monitoring

Instructions détaillées pour la configuration de :
- Prometheus (fichiers de configuration, règles d'alerte)
- Grafana (tableaux de bord, sources de données)
- AlertManager (routes, destinataires)
- Loki (sources de logs, requêtes importantes)

### B. Matrice RACI

Matrice de responsabilité pour chaque type d'incident et chaque composant du système.

### C. Contacts Essentiels

| Rôle | Nom | Email | Téléphone | Horaires |
|------|-----|-------|-----------|----------|
| CTO | Jean Dupont | jean.dupont@dashboard-velo.com | +33 6 XX XX XX XX | 24/7 |
| Lead DevOps | Marie Martin | marie.martin@dashboard-velo.com | +33 6 XX XX XX XX | 24/7 |
| Lead Backend | Thomas Weber | thomas.weber@dashboard-velo.com | +33 6 XX XX XX XX | 8h-20h |
| Lead Frontend | Sarah Martin | sarah.martin@dashboard-velo.com | +33 6 XX XX XX XX | 8h-20h |
| Support Manager | Philippe Leclerc | philippe.leclerc@dashboard-velo.com | +33 6 XX XX XX XX | 8h-20h |

### D. Fournisseurs Externes

| Service | Fournisseur | Contact Support | SLA |
|---------|-------------|----------------|-----|
| Cloud Infrastructure | AWS | Portal + TAM | 99.99% |
| CDN | Cloudflare | support@cloudflare.com | 99.9% |
| Email | SendGrid | support@sendgrid.com | 99.95% |
| Paiement | Stripe | dashboard + email | 99.99% |
| Météo | OpenWeatherMap | api@openweathermap.org | 99.5% |
