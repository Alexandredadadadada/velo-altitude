@echo off
echo ===================================
echo Déploiement de Velo-Altitude en production
echo ===================================

echo Vérification des dépendances...
call node scripts\check-dependencies.js
if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de la vérification des dépendances.
    exit /b %ERRORLEVEL%
)

echo Vérification pré-déploiement...
call node scripts\pre-deploy-check.js
if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de la vérification pré-déploiement.
    exit /b %ERRORLEVEL%
)

echo Construction de l'application en mode production...
call npm run build:production
if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de la construction de l'application.
    exit /b %ERRORLEVEL%
)

echo Construction terminée avec succès!

echo Voulez-vous déployer l'application sur Netlify maintenant? (O/N)
set /p deploy=

if /i "%deploy%"=="O" (
    echo Déploiement sur Netlify...
    call netlify deploy --prod
) else (
    echo Préparation des fichiers pour un déploiement manuel...
    if not exist "deploy" mkdir deploy
    xcopy /E /Y /I "build" "deploy"
    copy netlify.toml deploy\
    
    echo Application prête pour le déploiement!
    echo Vous pouvez maintenant déployer le dossier "deploy" sur Netlify via l'interface de glisser-déposer:
    echo https://app.netlify.com/drop
)

echo ===================================
echo Processus de déploiement terminé
echo ===================================
