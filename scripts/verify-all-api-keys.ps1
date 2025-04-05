# Script PowerShell pour vérifier toutes les clés API
# Ce script exécute tous les scripts de vérification des clés API et génère un rapport complet

Write-Host "=== Vérification complète des clés API pour Grand Est Cyclisme ===" -ForegroundColor Blue

# Définir le chemin de base
$basePath = Split-Path -Parent $PSScriptRoot
$reportPath = Join-Path -Path $basePath -ChildPath "api-keys-verification-report.html"

# Fonction pour exécuter un script Node.js
function Invoke-NodeScript {
    param (
        [string]$ScriptPath,
        [string]$Description
    )
    
    Write-Host "`nExécution de: $Description" -ForegroundColor Cyan
    
    try {
        $output = node $ScriptPath
        Write-Host $output
        return @{
            Success = $true
            Output = $output
        }
    }
    catch {
        Write-Host "Erreur lors de l'exécution du script: $_" -ForegroundColor Red
        return @{
            Success = $false
            Output = $_.ToString()
        }
    }
}

# Tableau pour stocker les résultats
$results = @()

# 1. Vérifier les clés API côté serveur
$serverApiKeysResult = Invoke-NodeScript -ScriptPath (Join-Path -Path $basePath -ChildPath "scripts\verify-api-integrations.js") -Description "Vérification des clés API côté serveur"
$results += @{
    Name = "Clés API côté serveur"
    Success = $serverApiKeysResult.Success
    Output = $serverApiKeysResult.Output
}

# 2. Vérifier les clés API côté client
$clientApiKeysResult = Invoke-NodeScript -ScriptPath (Join-Path -Path $basePath -ChildPath "scripts\verify-client-api-keys.js") -Description "Vérification des clés API côté client"
$results += @{
    Name = "Clés API côté client"
    Success = $clientApiKeysResult.Success
    Output = $clientApiKeysResult.Output
}

# 3. Vérifier le gestionnaire de clés API
$apiKeysManagerResult = Invoke-NodeScript -ScriptPath (Join-Path -Path $basePath -ChildPath "scripts\run-api-keys-manager.js") -Description "Vérification du gestionnaire de clés API"
$results += @{
    Name = "Gestionnaire de clés API"
    Success = $apiKeysManagerResult.Success
    Output = $apiKeysManagerResult.Output
}

# Générer le rapport HTML
$allSuccess = $results | Where-Object { -not $_.Success } | Measure-Object | Select-Object -ExpandProperty Count -eq 0

$htmlReport = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de vérification des clés API - Grand Est Cyclisme</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .summary {
            background-color: $(if ($allSuccess) { "#d5f5e3" } else { "#fadbd8" });
            color: $(if ($allSuccess) { "#27ae60" } else { "#c0392b" });
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .verification-section {
            margin: 30px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow: hidden;
        }
        .verification-header {
            background-color: $(if ($allSuccess) { "#d5f5e3" } else { "#fadbd8" });
            padding: 10px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .verification-header h2 {
            margin: 0;
            font-size: 18px;
        }
        .verification-status {
            font-weight: bold;
        }
        .success {
            color: #27ae60;
        }
        .failure {
            color: #c0392b;
        }
        .verification-content {
            padding: 15px;
            background-color: #f9f9f9;
            white-space: pre-wrap;
            font-family: Consolas, monospace;
            font-size: 14px;
            max-height: 400px;
            overflow-y: auto;
        }
        .timestamp {
            text-align: right;
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <h1>Rapport de vérification des clés API - Grand Est Cyclisme</h1>
    
    <div class="summary">
        $(if ($allSuccess) {
            "✓ Toutes les vérifications de clés API ont réussi."
        } else {
            "✗ Certaines vérifications de clés API ont échoué. Veuillez consulter les détails ci-dessous."
        })
    </div>
    
    $(foreach ($result in $results) {
        $statusClass = if ($result.Success) { "success" } else { "failure" }
        $statusIcon = if ($result.Success) { "✓" } else { "✗" }
        
        @"
    <div class="verification-section">
        <div class="verification-header">
            <h2>$($result.Name)</h2>
            <span class="verification-status $statusClass">$statusIcon $(if ($result.Success) { "Réussi" } else { "Échoué" })</span>
        </div>
        <div class="verification-content">$($result.Output)</div>
    </div>
"@
    })
    
    <div class="timestamp">
        Rapport généré le $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
    </div>
</body>
</html>
"@

# Enregistrer le rapport HTML
$htmlReport | Out-File -FilePath $reportPath -Encoding utf8

Write-Host "`nRapport HTML généré: $reportPath" -ForegroundColor Green

# Afficher le résumé
if ($allSuccess) {
    Write-Host "`n✓ Toutes les vérifications de clés API ont réussi." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Certaines vérifications de clés API ont échoué. Veuillez consulter le rapport pour plus de détails." -ForegroundColor Red
    exit 1
}
