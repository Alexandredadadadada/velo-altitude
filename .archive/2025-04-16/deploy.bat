@echo off
echo ===== Déploiement de Velo-Altitude =====
echo.

echo 1. Ajout des modifications...
git add .

echo.
echo 2. Création du commit...
set /p MESSAGE="Message du commit (ex: Mise à jour du site): "
git commit -m "%MESSAGE%"

echo.
echo 3. Envoi vers GitHub...
git push

echo.
echo ===== Déploiement terminé! =====
echo Les modifications sont envoyées à GitHub
echo Netlify devrait déployer automatiquement dans quelques minutes.
echo.
pause
