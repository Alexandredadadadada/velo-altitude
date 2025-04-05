# Plan de déploiement - Grand Est Cyclisme

Ce document détaille les étapes finales de test et de déploiement de l'application Grand Est Cyclisme.

## 1. Tests finaux avant déploiement

### 1.1. Tests du module Explorateur de Cols
- Exécuter tous les tests définis dans `TEST_COLEXPLORER.md`
- Vérifier chaque scénario de test dans l'ordre indiqué
- Cocher les cases correspondantes dans le document
- Porter une attention particulière aux tests de performance et de chargement paresseux

### 1.2. Vérification du système de cache météo
- Suivre la procédure décrite dans `TEST_COLEXPLORER.md` section "Test du système de cache météo"
- Test offline :
  ```
  1. Visiter la page d'un col pour charger les données météo
  2. Ouvrir les outils de développement (F12) et vérifier dans Application > Storage que les données sont en cache
  3. Activer le mode offline dans les outils de développement (Network > Offline)
  4. Recharger la page et vérifier que les données météo s'affichent toujours
  ```

### 1.3. Tests de réactivité sur différents appareils
- Desktop (>1200px) : Vérifier la mise en page complète et l'affichage des graphiques
- Tablette (768-1024px) : Vérifier l'adaptation des composants et la navigation
- Mobile (<768px) : Vérifier la lisibilité des informations et l'accessibilité des contrôles
- Orientation : Tester le changement d'orientation sur les appareils mobiles

### 1.4. Vérification des modules de l'Agent 2
- Module Nutrition : Tester la planification nutritionnelle et les calculs
- Module Training : Vérifier le calculateur FTP et les plannings d'entraînement
- Module Social : Tester le partage et les interactions sociales

## 2. Préparation au déploiement

### 2.1. Création d'un dossier de déploiement propre
```bash
# Créer un nouveau dossier pour le déploiement
mkdir C:\Deployments\grand-est-cyclisme-final

# Copier le code source dans ce dossier (sans node_modules et build)
robocopy "C:\Users\busin\CascadeProjects\grand-est-cyclisme-website-final (1) VERSION FINAL" "C:\Deployments\grand-est-cyclisme-final" /E /XD node_modules build

# Aller dans le dossier de déploiement
cd "C:\Deployments\grand-est-cyclisme-final"

# Installer les dépendances proprement
npm install
```

### 2.2. Exécution du build final
```bash
# Utiliser webpack.fix.js pour éviter le conflit d'index.html
cmd.exe /c "npx webpack --config webpack.fix.js"
```

### 2.3. Vérification des assets statiques
- Vérifier que le dossier `build/` contient tous les fichiers nécessaires
- Vérifier la présence des sous-dossiers :
  - `build/static/js/` pour les scripts JavaScript
  - `build/static/css/` pour les styles CSS
  - `build/assets/` pour les assets du projet
  - `build/js/` pour les scripts spécifiques (weather-map.js, image-fallback.js)
  - `build/images/` pour les images et placeholders

## 3. Déploiement

### 3.1. Déploiement sur un serveur Nginx
- Transférer le contenu du dossier `build/` vers le serveur web
- Configuration Nginx (à adapter selon votre environnement) :
```nginx
server {
    listen 80;
    server_name grand-est-cyclisme.fr www.grand-est-cyclisme.fr;
    
    # Redirection vers HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name grand-est-cyclisme.fr www.grand-est-cyclisme.fr;
    
    # Configuration SSL (à personnaliser)
    ssl_certificate /etc/letsencrypt/live/grand-est-cyclisme.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/grand-est-cyclisme.fr/privkey.pem;
    
    # Racine du site
    root /var/www/grand-est-cyclisme;
    index index.html;
    
    # Compression Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Mise en cache des assets statiques (30 jours)
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # Gestion du routing SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3.2. Déploiement sur Netlify/Vercel (alternative)
1. Créer un compte sur Netlify ou Vercel si ce n'est pas déjà fait
2. Importer le projet depuis GitHub ou téléverser le dossier `build/`
3. Configuration sur Netlify :
   - Base directory : `.`
   - Build command : `npx webpack --config webpack.fix.js`
   - Publish directory : `build`
4. Configuration des redirections dans `_redirects` ou `netlify.toml` :
```
/*    /index.html   200
```

## 4. Vérification post-déploiement

### 4.1. Tests multi-navigateurs
- Chrome (dernière version)
- Firefox (dernière version)
- Safari (dernière version)
- Edge (dernière version)
- Mobile Safari et Chrome mobile

### 4.2. Vérification des API externes
- Tester l'API météo sur plusieurs cols
- Vérifier que les temps de réponse sont acceptables
- Vérifier que le système de cache fonctionne correctement en production

### 4.3. Vérification du système de fallback d'images
- Déconnecter temporairement certaines images pour tester le fallback
- Vérifier que les placeholders s'affichent correctement
- S'assurer que l'expérience utilisateur reste fluide même avec des ressources manquantes

### 4.4. Monitoring initial
- Configurer Google Analytics ou un outil similaire
- Surveiller les premières visites et comportements utilisateurs
- Identifier et corriger rapidement les éventuels problèmes

## 5. Documentation finale

### 5.1. Mise à jour du journal des modifications
```bash
# Mettre à jour CHANGELOG.md avec les dernières modifications
echo "## 1.0.0 ($(date +%d-%m-%Y))\n- Version initiale déployée\n- Résolution des problèmes de build\n- Optimisation des performances" >> CHANGELOG.md
```

### 5.2. Mise à jour du statut du projet
```bash
# Mettre à jour ETAT_PROJET.md pour indiquer que le projet est en production
echo "# État du projet au $(date +%d-%m-%Y)\n\nLe projet Grand Est Cyclisme est maintenant en production." > ETAT_PROJET.md
```

---

Ce plan de déploiement a été préparé par l'équipe de développement le 04/04/2025.
