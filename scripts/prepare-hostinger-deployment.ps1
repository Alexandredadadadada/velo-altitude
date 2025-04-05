# Script PowerShell pour préparer le déploiement sur Hostinger
# Ce script vérifie les prérequis et exécute les scripts d'audit et de préparation

Write-Host "=== Préparation au déploiement sur Hostinger ===" -ForegroundColor Blue

# Vérifier si Node.js est installé
try {
    $nodeVersion = & npm -v
    Write-Host "✓ npm version $nodeVersion détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Vérifier si les dépendances sont installées
Write-Host "`nVérification des dépendances..." -ForegroundColor Blue
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "Installation des dépendances avec npm install..." -ForegroundColor Yellow
    & npm install
} else {
    Write-Host "✓ Les dépendances sont déjà installées" -ForegroundColor Green
}

# Installer les dépendances nécessaires pour les scripts
Write-Host "`nInstallation des dépendances pour les scripts d'audit..." -ForegroundColor Blue
& npm install --save-dev chalk dotenv dotenv-flow

# Vérifier si le fichier .env.production existe
Write-Host "`nVérification du fichier .env.production..." -ForegroundColor Blue
if (-not (Test-Path -Path ".env.production")) {
    Write-Host "❌ Fichier .env.production non trouvé" -ForegroundColor Red
    
    # Copier .env.example vers .env.production si disponible
    if (Test-Path -Path ".env.example") {
        Write-Host "Création de .env.production à partir de .env.example..." -ForegroundColor Yellow
        Copy-Item -Path ".env.example" -Destination ".env.production"
        Write-Host "✓ Fichier .env.production créé. Veuillez le modifier avec vos valeurs réelles." -ForegroundColor Green
    } else {
        Write-Host "❌ Fichier .env.example non trouvé. Impossible de créer .env.production." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Fichier .env.production trouvé" -ForegroundColor Green
}

# Créer les répertoires pour les rapports
$securityReportsDir = "security-reports"
$deploymentReportDir = "deployment-report"

if (-not (Test-Path -Path $securityReportsDir)) {
    New-Item -Path $securityReportsDir -ItemType Directory | Out-Null
}

if (-not (Test-Path -Path $deploymentReportDir)) {
    New-Item -Path $deploymentReportDir -ItemType Directory | Out-Null
}

# Exécuter l'audit de sécurité
Write-Host "`n=== Exécution de l'audit de sécurité ===" -ForegroundColor Blue

# Générer le fichier .env.local pour le client React
Write-Host "`n=== Génération du fichier .env.local pour le client React ===" -ForegroundColor Blue
try {
    $clientEnvOutput = & node "$PSScriptRoot\generate-client-env.js"
    Write-Host $clientEnvOutput
    $clientEnvSuccess = $LASTEXITCODE -eq 0
    Write-Host "✓ Génération du fichier .env.local terminée." -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la génération du fichier .env.local: $_" -ForegroundColor Red
    $clientEnvSuccess = $false
}

# Exécuter la vérification des clés API
Write-Host "`n=== Vérification des clés API ===" -ForegroundColor Blue
try {
    $apiKeysVerificationOutput = & powershell -File "$PSScriptRoot\verify-all-api-keys.ps1"
    Write-Host $apiKeysVerificationOutput
    $apiKeysVerificationSuccess = $LASTEXITCODE -eq 0
    Write-Host "✓ Vérification des clés API terminée." -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la vérification des clés API: $_" -ForegroundColor Red
    $apiKeysVerificationSuccess = $false
}

# Vérifier les vulnérabilités npm
Write-Host "`nVérification des dépendances vulnérables..." -ForegroundColor Blue
try {
    $npmAuditOutput = & npm audit --json
    $npmAuditOutput | Out-File -FilePath "$securityReportsDir\npm-audit-output.json"
    Write-Host "✓ Audit npm terminé. Rapport sauvegardé dans $securityReportsDir\npm-audit-output.json" -ForegroundColor Green
    
    # Analyser le résultat pour afficher un résumé
    $auditResult = $npmAuditOutput | ConvertFrom-Json
    if ($auditResult.vulnerabilities) {
        $totalVulnerabilities = 0
        foreach ($severity in $auditResult.vulnerabilities.PSObject.Properties) {
            $totalVulnerabilities += $severity.Value.Count
        }
        
        if ($totalVulnerabilities -gt 0) {
            Write-Host "❌ $totalVulnerabilities vulnérabilités trouvées" -ForegroundColor Red
            Write-Host "Exécutez 'npm audit fix' pour résoudre les problèmes automatiquement" -ForegroundColor Yellow
        } else {
            Write-Host "✓ Aucune vulnérabilité trouvée" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "❌ Erreur lors de l'exécution de npm audit: $_" -ForegroundColor Red
}

# Vérifier les clés API
Write-Host "`nVérification des clés API dans .env.production..." -ForegroundColor Blue
$envContent = Get-Content -Path ".env.production" -Raw
$apiKeys = @(
    "MAPBOX_PUBLIC_TOKEN",
    "MAPBOX_SECRET_TOKEN",
    "OPENWEATHER_API_KEY",
    "OPENROUTE_API_KEY",
    "STRAVA_CLIENT_ID",
    "STRAVA_CLIENT_SECRET",
    "OPENAI_API_KEY",
    "CLAUDE_API_KEY"
)

$missingKeys = @()
$placeholderKeys = @()

foreach ($key in $apiKeys) {
    if ($envContent -match "$key=(.+)") {
        $value = $matches[1]
        if ($value -match "votre_|your_|ChangeThis|pk\.eyJ1I|sk\-a1b2c3d4") {
            $placeholderKeys += $key
        }
    } else {
        $missingKeys += $key
    }
}

if ($missingKeys.Count -gt 0) {
    Write-Host "❌ Clés API manquantes: $($missingKeys -join ', ')" -ForegroundColor Red
}

if ($placeholderKeys.Count -gt 0) {
    Write-Host "⚠️ Clés API avec valeurs placeholder: $($placeholderKeys -join ', ')" -ForegroundColor Yellow
    Write-Host "Ces clés doivent être remplacées par des valeurs réelles avant le déploiement" -ForegroundColor Yellow
}

if ($missingKeys.Count -eq 0 -and $placeholderKeys.Count -eq 0) {
    Write-Host "✓ Toutes les clés API sont configurées" -ForegroundColor Green
}

# Vérifier les variables d'environnement critiques
Write-Host "`nVérification des variables d'environnement critiques..." -ForegroundColor Blue
$criticalVars = @(
    "NODE_ENV",
    "API_BASE_URL",
    "CLIENT_BASE_URL",
    "MONGODB_URI",
    "REDIS_HOST",
    "SESSION_SECRET",
    "JWT_SECRET",
    "CORS_ORIGIN"
)

$missingVars = @()
$placeholderVars = @()

foreach ($var in $criticalVars) {
    if ($envContent -match "$var=(.+)") {
        $value = $matches[1]
        if ($value -match "votre_|your_|ChangeThis") {
            $placeholderVars += $var
        }
    } else {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Variables critiques manquantes: $($missingVars -join ', ')" -ForegroundColor Red
}

if ($placeholderVars.Count -gt 0) {
    Write-Host "⚠️ Variables avec valeurs placeholder: $($placeholderVars -join ', ')" -ForegroundColor Yellow
    Write-Host "Ces variables doivent être remplacées par des valeurs réelles avant le déploiement" -ForegroundColor Yellow
}

if ($missingVars.Count -eq 0 -and $placeholderVars.Count -eq 0) {
    Write-Host "✓ Toutes les variables critiques sont configurées" -ForegroundColor Green
}

# Vérifier que NODE_ENV est bien "production"
if ($envContent -match "NODE_ENV=(.+)" -and $matches[1] -ne "production") {
    Write-Host "❌ NODE_ENV n'est pas défini sur 'production'" -ForegroundColor Red
}

# Vérifier que les URLs utilisent HTTPS
$urlVars = @("API_BASE_URL", "CLIENT_BASE_URL", "CORS_ORIGIN", "STRAVA_REDIRECT_URI")
$nonHttpsUrls = @()

foreach ($var in $urlVars) {
    if ($envContent -match "$var=(.+)" -and $matches[1] -notmatch "^https://") {
        $nonHttpsUrls += $var
    }
}

if ($nonHttpsUrls.Count -gt 0) {
    Write-Host "❌ Les URLs suivantes n'utilisent pas HTTPS: $($nonHttpsUrls -join ', ')" -ForegroundColor Red
    Write-Host "HTTPS est obligatoire pour la production" -ForegroundColor Red
}

# Générer le rapport HTML
Write-Host "`nGénération du rapport de préparation au déploiement..." -ForegroundColor Blue

$htmlReport = @"
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de préparation au déploiement - Grand Est Cyclisme</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    h1 {
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
    }
    .section {
      margin-bottom: 30px;
      padding: 20px;
      border-radius: 5px;
      background-color: #f8f9fa;
      border-left: 5px solid #3498db;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .summary-box {
      flex: 1;
      margin: 0 10px;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .success {
      background-color: #d5f5e3;
      color: #27ae60;
      border-left: 5px solid #27ae60;
    }
    .warning {
      background-color: #fef9e7;
      color: #f39c12;
      border-left: 5px solid #f39c12;
    }
    .error {
      background-color: #fadbd8;
      color: #c0392b;
      border-left: 5px solid #c0392b;
    }
    .info {
      background-color: #d6eaf8;
      color: #2980b9;
      border-left: 5px solid #2980b9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    .status-ok {
      color: #27ae60;
      font-weight: bold;
    }
    .status-warning {
      color: #f39c12;
      font-weight: bold;
    }
    .status-error {
      color: #c0392b;
      font-weight: bold;
    }
    .recommendations {
      margin-top: 30px;
      padding: 20px;
      background-color: #eaf2f8;
      border-radius: 5px;
    }
    .timestamp {
      margin-top: 30px;
      color: #7f8c8d;
      font-size: 0.9em;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Rapport de préparation au déploiement - Grand Est Cyclisme</h1>
  <p>Ce rapport présente l'état de préparation de l'application pour le déploiement sur Hostinger.</p>
  
  <div class="summary">
    <div class="summary-box $($missingVars.Count -eq 0 ? 'success' : 'error')">
      <h3>Configuration</h3>
      <p>$($missingVars.Count -eq 0 ? 'Prête' : 'À compléter')</p>
    </div>
    <div class="summary-box $($placeholderKeys.Count -eq 0 ? 'success' : 'warning')">
      <h3>Clés API</h3>
      <p>$($apiKeys.Count - $missingKeys.Count - $placeholderKeys.Count)/$($apiKeys.Count) valides</p>
    </div>
    <div class="summary-box $($totalVulnerabilities -gt 0 ? 'warning' : 'success')">
      <h3>Dépendances</h3>
      <p>$($totalVulnerabilities -gt 0 ? "$totalVulnerabilities vulnérabilités" : "Sécurisées")</p>
    </div>
    <div class="summary-box $($nonHttpsUrls.Count -gt 0 ? 'error' : 'success')">
      <h3>HTTPS</h3>
      <p>$($nonHttpsUrls.Count -gt 0 ? "Non configuré" : "Configuré")</p>
    </div>
    <div class="summary-box $($apiKeysVerificationSuccess ? 'success' : 'error')">
      <h3>Vérification des clés API</h3>
      <p>$($apiKeysVerificationSuccess ? 'Réussie' : 'Échouée')</p>
    </div>
    <div class="summary-box $($clientEnvSuccess ? 'success' : 'error')">
      <h3>Génération du fichier .env.local</h3>
      <p>$($clientEnvSuccess ? 'Réussie' : 'Échouée')</p>
    </div>
  </div>
  
  <div class="section">
    <h2>1. Configuration de l'environnement</h2>
    
    <h3>Fichier .env.production</h3>
    <p>Statut: <span class="status-ok">Existe</span></p>
    <p>NODE_ENV: $($envContent -match "NODE_ENV=production" ? '<span class="status-ok">production</span>' : '<span class="status-error">non défini sur production</span>')</p>
    <p>HTTPS: $($nonHttpsUrls.Count -eq 0 ? '<span class="status-ok">Configuré</span>' : '<span class="status-error">Non configuré</span>')</p>
    
    $(if ($missingVars.Count -gt 0) {
    @"
    <h4>Variables manquantes</h4>
    <ul>
      $($missingVars | ForEach-Object { "<li class='status-error'>$_</li>" })
    </ul>
"@
    })
    
    $(if ($placeholderVars.Count -gt 0) {
    @"
    <h4>Variables avec valeurs placeholder</h4>
    <ul>
      $($placeholderVars | ForEach-Object { "<li class='status-warning'>$_</li>" })
    </ul>
    <p class="status-warning">Ces variables doivent être remplacées par des valeurs réelles avant le déploiement.</p>
"@
    })
  </div>
  
  <div class="section">
    <h2>2. Clés API</h2>
    
    <p>Services API totaux: $($apiKeys.Count)</p>
    <p>Services valides: <span class="status-ok">$($apiKeys.Count - $missingKeys.Count - $placeholderKeys.Count)</span></p>
    <p>Services invalides: <span class="$($missingKeys.Count + $placeholderKeys.Count -gt 0 ? 'status-error' : 'status-ok')">$($missingKeys.Count + $placeholderKeys.Count)</span></p>
    
    $(if ($missingKeys.Count -gt 0) {
    @"
    <h4>Clés API manquantes</h4>
    <ul>
      $($missingKeys | ForEach-Object { "<li class='status-error'>$_</li>" })
    </ul>
"@
    })
    
    $(if ($placeholderKeys.Count -gt 0) {
    @"
    <h4>Clés API avec valeurs placeholder</h4>
    <ul>
      $($placeholderKeys | ForEach-Object { "<li class='status-warning'>$_</li>" })
    </ul>
    <p class="status-warning">Ces clés doivent être remplacées par des valeurs réelles avant le déploiement.</p>
"@
    })
  </div>
  
  <div class="section">
    <h2>3. Dépendances</h2>
    
    $(if ($totalVulnerabilities -gt 0) {
    @"
    <p class="status-warning">Des vulnérabilités ont été détectées dans les dépendances.</p>
    
    <p>Exécutez <code>npm audit fix</code> pour résoudre les problèmes automatiquement.</p>
"@
    } else {
    @"
    <p class="status-ok">Aucune vulnérabilité détectée dans les dépendances.</p>
"@
    })
  </div>
  
  <div class="section">
    <h2>4. Vérification des clés API</h2>
    
    $(if ($apiKeysVerificationSuccess) {
    @"
    <p class="status-ok">La vérification des clés API a réussi.</p>
"@
    } else {
    @"
    <p class="status-error">La vérification des clés API a échoué.</p>
    <p>Consultez le rapport détaillé pour plus d'informations.</p>
"@
    })
  </div>
  
  <div class="section">
    <h2>5. Génération du fichier .env.local</h2>
    
    $(if ($clientEnvSuccess) {
    @"
    <p class="status-ok">La génération du fichier .env.local a réussi.</p>
"@
    } else {
    @"
    <p class="status-error">La génération du fichier .env.local a échoué.</p>
    <p>Consultez le rapport détaillé pour plus d'informations.</p>
"@
    })
  </div>
  
  <div class="section">
    <h2>6. URLs et HTTPS</h2>
    
    $(if ($nonHttpsUrls.Count -gt 0) {
    @"
    <p class="status-error">Les URLs suivantes n'utilisent pas HTTPS:</p>
    <ul>
      $($nonHttpsUrls | ForEach-Object { "<li class='status-error'>$_</li>" })
    </ul>
    <p class="status-error">HTTPS est obligatoire pour la production.</p>
"@
    } else {
    @"
    <p class="status-ok">Toutes les URLs utilisent HTTPS.</p>
"@
    })
  </div>
  
  <div class="recommendations">
    <h2>Recommandations avant déploiement</h2>
    
    <ol>
      $(if ($missingVars.Count -gt 0) {
      "<li>Complétez les variables d'environnement manquantes: $($missingVars -join ', ')</li>"
      })
      
      $(if ($placeholderVars.Count -gt 0) {
      "<li>Remplacez les valeurs placeholder par des valeurs réelles: $($placeholderVars -join ', ')</li>"
      })
      
      $(if ($missingKeys.Count -gt 0) {
      "<li>Ajoutez les clés API manquantes: $($missingKeys -join ', ')</li>"
      })
      
      $(if ($placeholderKeys.Count -gt 0) {
      "<li>Remplacez les clés API placeholder par des valeurs réelles: $($placeholderKeys -join ', ')</li>"
      })
      
      $(if ($totalVulnerabilities -gt 0) {
      "<li>Résolvez les vulnérabilités dans les dépendances avec <code>npm audit fix</code></li>"
      })
      
      $(if ($nonHttpsUrls.Count -gt 0) {
      "<li>Configurez HTTPS pour toutes les URLs: $($nonHttpsUrls -join ', ')</li>"
      })
      
      $(if (-not $apiKeysVerificationSuccess) {
      "<li>Résolvez les problèmes de vérification des clés API</li>"
      })
      
      $(if (-not $clientEnvSuccess) {
      "<li>Résolvez les problèmes de génération du fichier .env.local</li>"
      })
      
      <li>Configurez le monitoring des quotas API avec api-quota-monitor.js</li>
      <li>Mettez en place la rotation automatique des clés API pour les services qui le supportent</li>
      <li>Vérifiez les permissions des fichiers sur le serveur (755 pour les dossiers, 644 pour les fichiers)</li>
      <li>Testez le mécanisme de rollback automatique en cas d'échec du déploiement</li>
    </ol>
  </div>
  
  <div class="timestamp">
    Rapport généré le $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
  </div>
</body>
</html>
"@

$htmlReport | Out-File -FilePath "$deploymentReportDir\deployment-preparation-report.html" -Encoding utf8
Write-Host "✓ Rapport de préparation au déploiement généré: $deploymentReportDir\deployment-preparation-report.html" -ForegroundColor Green

# Résumé final
Write-Host "`n=== Résumé de la préparation au déploiement ===" -ForegroundColor Blue

if ($missingVars.Count -gt 0 -or $placeholderVars.Count -gt 0 -or $missingKeys.Count -gt 0 -or $placeholderKeys.Count -gt 0 -or $nonHttpsUrls.Count -gt 0 -or -not $apiKeysVerificationSuccess -or -not $clientEnvSuccess) {
    Write-Host "⚠️ Des actions sont nécessaires avant le déploiement sur Hostinger" -ForegroundColor Yellow
    Write-Host "Consultez le rapport détaillé: $deploymentReportDir\deployment-preparation-report.html" -ForegroundColor Yellow
} else {
    Write-Host "✓ L'application est prête pour le déploiement sur Hostinger" -ForegroundColor Green
}

Write-Host "`nPour déployer sur Hostinger, suivez ces étapes:" -ForegroundColor Blue
Write-Host "1. Créez une archive ZIP du projet (sans node_modules)" -ForegroundColor White
Write-Host "2. Connectez-vous à votre compte Hostinger" -ForegroundColor White
Write-Host "3. Accédez à l'hébergement Web et sélectionnez votre domaine" -ForegroundColor White
Write-Host "4. Utilisez le gestionnaire de fichiers pour télécharger l'archive" -ForegroundColor White
Write-Host "5. Extrayez l'archive dans le répertoire public_html" -ForegroundColor White
Write-Host "6. Configurez les variables d'environnement dans le panneau Hostinger" -ForegroundColor White
Write-Host "7. Installez les dépendances avec npm install --production" -ForegroundColor White
Write-Host "8. Démarrez l'application avec npm start" -ForegroundColor White
