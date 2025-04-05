# Procédures de Backup et Restauration - Dashboard-Velo.com

## Introduction

Ce document détaille les procédures de sauvegarde et de restauration mises en place pour Dashboard-Velo.com. Il est destiné aux administrateurs système et aux développeurs responsables de la maintenance de l'application. Ces procédures garantissent l'intégrité des données et permettent une récupération rapide en cas d'incident.

## Architecture de Sauvegarde

### Composants Sauvegardés

Le système de sauvegarde couvre les éléments essentiels suivants :

1. **Base de données MongoDB** - Toutes les données utilisateurs, programmes d'entraînement, informations sur les cols, etc.
2. **Fichiers de contenu** - Images, fichiers GPX, médias, documents téléchargeables
3. **Logs système** - Journaux d'application pour diagnostiquer les problèmes

### Infrastructure

- **Stockage primaire** : Serveur de production (`/var/backups/dashboard-velo/`)
- **Stockage secondaire** (optionnel) : Serveur de backup distant (`backup.dashboard-velo.com`)
- **Rotation** : Conservation des sauvegardes pendant 14 jours par défaut

## Procédures de Sauvegarde Automatisées

### Configuration du Script de Sauvegarde

Le script de sauvegarde principal (`backup.sh`) est situé dans le répertoire `/scripts/` du projet. Avant la première utilisation, configurez les variables suivantes :

```bash
# Configuration
BACKUP_DIR="/var/backups/dashboard-velo"     # Répertoire de sauvegarde local
MONGO_HOST="localhost"                       # Hôte MongoDB
MONGO_PORT="27017"                           # Port MongoDB
MONGO_DB="dashboard_velo"                    # Nom de la base de données
MONGO_USER="backup_user"                     # Utilisateur avec privilèges de backup
MONGO_PASS="your_secure_password"            # Mot de passe sécurisé (à remplacer)
CONTENT_DIR="/var/www/dashboard-velo/content" # Répertoire de contenu à sauvegarder
LOG_FILE="/var/log/dashboard-velo/backup.log" # Fichier de log du processus de backup
RETENTION_DAYS=14                            # Nombre de jours de conservation
BACKUP_REPORT_EMAIL="admin@dashboard-velo.com" # Email pour rapports
REMOTE_BACKUP_ENABLED=false                  # Activer/désactiver backup distant
```

### Planification des Sauvegardes

#### Sauvegardes Quotidiennes Automatiques

Configurez une tâche cron pour exécuter le script quotidiennement, par exemple à 2h du matin :

```bash
# Ajouter cette ligne à /etc/crontab
0 2 * * * root /path/to/scripts/backup.sh > /dev/null 2>&1
```

#### Sauvegardes Manuelles

Pour déclencher une sauvegarde manuelle :

```bash
cd /path/to/scripts
./backup.sh
```

### Types de Sauvegardes

#### Sauvegarde Complète

Le script effectue par défaut une sauvegarde complète de tous les composants.

#### Sauvegarde Incrémentielle

Pour les environnements à grandes quantités de données, activez les sauvegardes incrémentielles en modifiant le script et en utilisant l'option `--oplog` de MongoDB :

```bash
# Modifier la ligne dans la fonction backup_mongodb
mongodump --oplog --host $MONGO_HOST ...
```

## Procédures de Vérification des Sauvegardes

### Vérification Automatique

Le script inclut une fonction `verify_backups()` qui :
- Vérifie l'intégrité des archives tar
- Teste l'accessibilité des fichiers
- Génère des alertes en cas de problème

### Vérification Manuelle Planifiée

En plus des vérifications automatiques, exécutez ces vérifications manuelles une fois par mois :

1. Restaurez une sauvegarde récente dans un environnement de test
2. Vérifiez l'intégrité des données (utilisateurs, contenu, fonctionnalités)
3. Documentez les résultats dans le registre des vérifications

```bash
# Exemple de script pour extraire et vérifier une sauvegarde MongoDB
BACKUP_FILE="/var/backups/dashboard-velo/mongodb/mongodb_backup_20250401_020000.tar.gz"
TEMP_DIR="/tmp/backup_verification"

mkdir -p $TEMP_DIR
tar -xzf $BACKUP_FILE -C $TEMP_DIR
mongorestore --host localhost --port 27017 --db test_restore $TEMP_DIR/dump_*

# Exécuter des requêtes de vérification
mongo --host localhost --port 27017 test_restore --eval "db.users.count()"
mongo --host localhost --port 27017 test_restore --eval "db.trainingPrograms.count()"
```

## Procédures de Restauration

### Préparation à la Restauration

Avant de commencer une restauration :

1. Identifiez la sauvegarde à utiliser (généralement la plus récente viable)
2. Arrêtez les services d'application pour éviter les modifications pendant la restauration
3. Créez une sauvegarde de l'état actuel si possible (même en cas de corruption)
4. Préparez un plan de rollback en cas d'échec de restauration

```bash
# Arrêt des services
systemctl stop dashboard-velo-web
systemctl stop dashboard-velo-api
```

### Restauration de la Base de Données

```bash
# Décompresser la sauvegarde
mkdir -p /tmp/mongodb_restore
tar -xzf /var/backups/dashboard-velo/mongodb/mongodb_backup_YYYYMMDD_HHMMSS.tar.gz -C /tmp/mongodb_restore

# Restaurer la base de données
mongorestore --host localhost --port 27017 --db dashboard_velo --drop /tmp/mongodb_restore/dump_YYYYMMDD_HHMMSS/dashboard_velo

# Vérification post-restauration
mongo --host localhost --port 27017 dashboard_velo --eval "db.users.count()"
```

### Restauration des Fichiers de Contenu

```bash
# Créer une sauvegarde de l'état actuel (si nécessaire)
mv /var/www/dashboard-velo/content /var/www/dashboard-velo/content.bak

# Décompresser et restaurer le contenu
mkdir -p /var/www/dashboard-velo/content
tar -xzf /var/backups/dashboard-velo/content/content_backup_YYYYMMDD_HHMMSS.tar.gz -C /var/www

# Ajuster les permissions
chown -R www-data:www-data /var/www/dashboard-velo/content
chmod -R 755 /var/www/dashboard-velo/content
```

### Post-Restauration

1. Redémarrez les services
2. Vérifiez le bon fonctionnement de l'application
3. Exécutez une batterie de tests fonctionnels
4. Documentez l'opération dans le journal de maintenance

```bash
# Redémarrage des services
systemctl start dashboard-velo-api
systemctl start dashboard-velo-web

# Vérification des logs
tail -f /var/log/dashboard-velo/api.log
tail -f /var/log/dashboard-velo/web.log
```

## Scénarios de Récupération d'Urgence

### Scénario 1: Corruption de la Base de Données

**Symptômes**: Erreurs MongoDB, données incohérentes, échecs de requêtes

**Procédure**:
1. Arrêtez l'API et les services web
2. Tentez une réparation avec `mongod --repair`
3. Si la réparation échoue, procédez à une restauration complète
4. Redémarrez les services et vérifiez l'intégrité

### Scénario 2: Perte de Serveur

**Symptômes**: Serveur inaccessible, panne matérielle

**Procédure**:
1. Activez le serveur de secours (si configuré)
2. Restaurez la dernière sauvegarde sur le nouveau serveur
3. Mettez à jour les DNS pour pointer vers le nouveau serveur
4. Vérifiez l'intégrité et la cohérence des données

### Scénario 3: Suppression Accidentelle de Données

**Symptômes**: Données manquantes signalées par utilisateurs ou monitoring

**Procédure**:
1. Identifiez l'étendue et la date de la suppression
2. Choisissez la sauvegarde appropriée précédant l'incident
3. Restaurez uniquement les collections/fichiers affectés si possible
4. Synchronisez avec les données actuelles pour minimiser la perte

```bash
# Exemple de restauration d'une collection spécifique
mongorestore --host localhost --port 27017 --db dashboard_velo --collection users /tmp/mongodb_restore/dump_YYYYMMDD_HHMMSS/dashboard_velo/users.bson
```

## Tests de Récupération

### Tests Réguliers

Effectuez ces tests tous les trimestres pour garantir l'efficacité des procédures :

1. **Test de restauration complète**
   - Restaurez l'intégralité de l'application dans un environnement de test
   - Mesurez le temps de récupération (RTO)
   - Vérifiez la perte de données potentielle (RPO)

2. **Test de restauration partielle**
   - Simulez une corruption de collection spécifique
   - Exécutez une restauration ciblée
   - Vérifiez la cohérence des données post-restauration

### Journal des Tests

Maintenez un journal des tests avec les informations suivantes :

- Date et heure du test
- Type de test réalisé
- Sauvegarde utilisée
- Temps de restauration
- Résultats et observations
- Problèmes rencontrés et solutions

## Bonnes Pratiques

### Sécurité des Sauvegardes

1. **Chiffrement**
   - Chiffrez les sauvegardes contenant des données sensibles
   - Stockez les clés de chiffrement séparément des sauvegardes

   ```bash
   # Exemple de chiffrement d'une sauvegarde
   tar -czf - /path/to/backup | openssl enc -aes-256-cbc -e -out backup.tar.gz.enc -pass file:/path/to/key
   ```

2. **Contrôle d'accès**
   - Limitez l'accès aux sauvegardes aux administrateurs autorisés
   - Utilisez une authentification forte pour les serveurs de backup

3. **Stockage hors site**
   - Maintenez au moins une copie hors site (cloud sécurisé ou datacenter distant)
   - Effectuez des rotations régulières des sauvegardes hors site

### Surveillance et Alertes

Configurez des alertes pour les événements suivants :

- Échec d'une sauvegarde
- Espace de stockage insuffisant
- Sauvegardes non vérifiées depuis X jours
- Temps de sauvegarde anormalement long

```bash
# Exemple d'alerte Slack intégrable au script
notify_slack() {
  local webhook_url="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  local message="$1"
  
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"$message\"}" \
    $webhook_url
}
```

## Annexes

### A. Script de Backup Complet

Voir le fichier `/scripts/backup.sh` pour le script complet.

### B. Script de Restauration

Le script `/scripts/restore.sh` permet d'automatiser le processus de restauration.

### C. Configuration MongoDB pour Backup Optimisé

```js
// Configuration à ajouter à mongod.conf
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
      journalCompressor: snappy
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true
```

### D. Matrice de Décision pour la Restauration

| Situation | Action Recommandée | Sauvegarde à Utiliser | Niveau de Priorité |
|-----------|-------------------|----------------------|-------------------|
| Corruption mineure de données | Restauration ciblée | Dernière sauvegarde | Moyenne |
| Perte de serveur | Restauration complète | Dernière sauvegarde vérifiée | Haute |
| Cyberattaque | Restauration complète après sécurisation | Sauvegarde antérieure à l'attaque | Haute |
| Erreur utilisateur | Restauration ciblée | Sauvegarde avant l'incident | Moyenne |
| Mise à jour échouée | Rollback + restauration si nécessaire | Sauvegarde pré-mise à jour | Haute |

## Historique des Révisions

| Version | Date | Auteur | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-04-05 | Team Dashboard-Velo | Version initiale |
