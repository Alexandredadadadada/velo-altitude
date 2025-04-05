#!/bin/bash
# Script de sauvegarde automatisée pour Dashboard-Velo.com
# Ce script effectue des sauvegardes complètes de la base de données, 
# des fichiers de contenu et des logs du système.

# Configuration
BACKUP_DIR="/var/backups/dashboard-velo"
MONGO_HOST="localhost"
MONGO_PORT="27017"
MONGO_DB="dashboard_velo"
MONGO_USER="backup_user"
MONGO_PASS="your_secure_password"
CONTENT_DIR="/var/www/dashboard-velo/content"
LOG_FILE="/var/log/dashboard-velo/backup.log"
RETENTION_DAYS=14
BACKUP_REPORT_EMAIL="admin@dashboard-velo.com"
REMOTE_BACKUP_ENABLED=false
REMOTE_BACKUP_HOST="backup.dashboard-velo.com"
REMOTE_BACKUP_USER="backup"
REMOTE_BACKUP_PATH="/backups/dashboard-velo"

# Création des répertoires nécessaires
mkdir -p $BACKUP_DIR/mongodb
mkdir -p $BACKUP_DIR/content
mkdir -p $BACKUP_DIR/logs
mkdir -p $(dirname $LOG_FILE)

# Fonction de logging
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Vérification de l'espace disque disponible
check_disk_space() {
  local required_space=5 # GB
  local available_space=$(df -BG $BACKUP_DIR | awk 'NR==2 {print $4}' | sed 's/G//')
  
  if [ $available_space -lt $required_space ]; then
    log "ALERTE: Espace disque insuffisant ($available_space GB). Minimum requis: $required_space GB"
    return 1
  else
    log "Espace disque suffisant: $available_space GB"
    return 0
  fi
}

# Sauvegarde de la base de données MongoDB
backup_mongodb() {
  log "Démarrage de la sauvegarde MongoDB"
  
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local temp_dir=$BACKUP_DIR/mongodb/dump_$timestamp
  local backup_file=$BACKUP_DIR/mongodb/mongodb_backup_$timestamp.tar.gz
  
  mongodump --host $MONGO_HOST --port $MONGO_PORT --db $MONGO_DB --username $MONGO_USER --password $MONGO_PASS --out $temp_dir
  
  if [ $? -eq 0 ]; then
    log "Dump MongoDB réussi"
    
    # Compression de la sauvegarde
    tar -czf $backup_file -C $BACKUP_DIR/mongodb dump_$timestamp
    if [ $? -eq 0 ]; then
      log "Compression de la sauvegarde MongoDB terminée: $backup_file ($(du -h $backup_file | cut -f1))"
      rm -rf $temp_dir
      return 0
    else
      log "ERREUR: Échec de la compression de la sauvegarde MongoDB"
      return 1
    fi
  else
    log "ERREUR: Échec du dump MongoDB"
    return 1
  fi
}

# Sauvegarde des fichiers de contenu
backup_content() {
  log "Démarrage de la sauvegarde des fichiers de contenu"
  
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local backup_file=$BACKUP_DIR/content/content_backup_$timestamp.tar.gz
  
  tar -czf $backup_file -C $(dirname $CONTENT_DIR) $(basename $CONTENT_DIR)
  
  if [ $? -eq 0 ]; then
    log "Sauvegarde des fichiers de contenu réussie: $backup_file ($(du -h $backup_file | cut -f1))"
    return 0
  else
    log "ERREUR: Échec de la sauvegarde des fichiers de contenu"
    return 1
  fi
}

# Sauvegarde des fichiers de log
backup_logs() {
  log "Démarrage de la sauvegarde des logs"
  
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local backup_file=$BACKUP_DIR/logs/logs_backup_$timestamp.tar.gz
  
  tar -czf $backup_file /var/log/dashboard-velo
  
  if [ $? -eq 0 ]; then
    log "Sauvegarde des logs réussie: $backup_file ($(du -h $backup_file | cut -f1))"
    return 0
  else
    log "ERREUR: Échec de la sauvegarde des logs"
    return 1
  fi
}

# Suppression des anciennes sauvegardes
cleanup_old_backups() {
  log "Nettoyage des sauvegardes de plus de $RETENTION_DAYS jours"
  
  find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
  
  if [ $? -eq 0 ]; then
    log "Nettoyage des anciennes sauvegardes terminé"
    return 0
  else
    log "ERREUR: Problème lors du nettoyage des anciennes sauvegardes"
    return 1
  fi
}

# Backup distant (optionnel)
remote_backup() {
  if [ "$REMOTE_BACKUP_ENABLED" = true ]; then
    log "Démarrage de la sauvegarde distante"
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local latest_mongodb=$(find $BACKUP_DIR/mongodb -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-)
    local latest_content=$(find $BACKUP_DIR/content -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-)
    
    # Créer le répertoire distant pour cette sauvegarde
    ssh $REMOTE_BACKUP_USER@$REMOTE_BACKUP_HOST "mkdir -p $REMOTE_BACKUP_PATH/$timestamp"
    
    # Copier les fichiers de sauvegarde les plus récents
    scp $latest_mongodb $latest_content $REMOTE_BACKUP_USER@$REMOTE_BACKUP_HOST:$REMOTE_BACKUP_PATH/$timestamp/
    
    if [ $? -eq 0 ]; then
      log "Sauvegarde distante réussie: $REMOTE_BACKUP_HOST:$REMOTE_BACKUP_PATH/$timestamp/"
      return 0
    else
      log "ERREUR: Échec de la sauvegarde distante"
      return 1
    fi
  else
    log "Sauvegarde distante désactivée, ignorée"
    return 0
  fi
}

# Vérification de l'intégrité des sauvegardes
verify_backups() {
  log "Vérification de l'intégrité des sauvegardes"
  
  local success=true
  
  # Vérifier les dernières sauvegardes
  local latest_mongodb=$(find $BACKUP_DIR/mongodb -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-)
  local latest_content=$(find $BACKUP_DIR/content -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-)
  
  # Tester l'intégrité des archives
  for archive in "$latest_mongodb" "$latest_content"; do
    if [ -f "$archive" ]; then
      tar -tzf "$archive" > /dev/null 2>&1
      if [ $? -ne 0 ]; then
        log "ERREUR: L'archive $archive est corrompue"
        success=false
      else
        log "L'archive $archive est valide"
      fi
    else
      log "ERREUR: L'archive $archive n'existe pas"
      success=false
    fi
  done
  
  if [ "$success" = true ]; then
    log "Vérification de l'intégrité des sauvegardes réussie"
    return 0
  else
    log "ERREUR: Des problèmes ont été détectés lors de la vérification des sauvegardes"
    return 1
  fi
}

# Génération du rapport de sauvegarde
generate_backup_report() {
  local timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
  local report_file="/tmp/backup_report_$timestamp.txt"
  local success=$1
  local total_size=$(du -sh $BACKUP_DIR | cut -f1)
  
  {
    echo "=== Rapport de Sauvegarde Dashboard-Velo.com ==="
    echo "Date: $(date +'%Y-%m-%d %H:%M:%S')"
    echo "Status: $([ "$success" = true ] && echo "RÉUSSI" || echo "ÉCHEC")"
    echo ""
    echo "Taille totale des sauvegardes: $total_size"
    echo "Emplacement: $BACKUP_DIR"
    echo ""
    echo "Détails des Sauvegardes:"
    echo "- MongoDB: $(find $BACKUP_DIR/mongodb -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-) ($(du -h $(find $BACKUP_DIR/mongodb -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-) | cut -f1))"
    echo "- Contenu: $(find $BACKUP_DIR/content -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-) ($(du -h $(find $BACKUP_DIR/content -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-) | cut -f1))"
    echo "- Logs: $(find $BACKUP_DIR/logs -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-) ($(du -h $(find $BACKUP_DIR/logs -type f -name "*.tar.gz" -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-) | cut -f1))"
    echo ""
    echo "Espace Disque:"
    df -h $BACKUP_DIR | awk '{print "- " $0}'
    echo ""
    echo "=== Fin du Rapport ==="
  } > $report_file
  
  # Envoi du rapport par email
  cat $report_file | mail -s "Rapport de Sauvegarde Dashboard-Velo.com - $([ "$success" = true ] && echo "RÉUSSI" || echo "ÉCHEC")" $BACKUP_REPORT_EMAIL
  
  log "Rapport de sauvegarde envoyé à $BACKUP_REPORT_EMAIL"
  rm $report_file
}

# Fonction principale
main() {
  log "=== DÉBUT DE LA SAUVEGARDE ==="
  
  local success=true
  
  # Vérifier l'espace disque
  check_disk_space
  if [ $? -ne 0 ]; then
    success=false
  fi
  
  # Sauvegarde MongoDB
  backup_mongodb
  if [ $? -ne 0 ]; then
    success=false
  fi
  
  # Sauvegarde des fichiers de contenu
  backup_content
  if [ $? -ne 0 ]; then
    success=false
  fi
  
  # Sauvegarde des logs
  backup_logs
  if [ $? -ne 0 ]; then
    success=false
  fi
  
  # Vérification des sauvegardes
  verify_backups
  if [ $? -ne 0 ]; then
    success=false
  fi
  
  # Nettoyage des anciennes sauvegardes
  cleanup_old_backups
  
  # Sauvegarde distante
  remote_backup
  
  # Génération du rapport
  generate_backup_report $success
  
  # Résultat final
  if [ "$success" = true ]; then
    log "=== SAUVEGARDE TERMINÉE AVEC SUCCÈS ==="
    return 0
  else
    log "=== SAUVEGARDE TERMINÉE AVEC DES ERREURS ==="
    return 1
  fi
}

# Exécution du script principal
main
exit $?
