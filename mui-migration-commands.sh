# Commandes pour la migration de Material-UI v4 vers MUI v5

# 1. Désinstaller les packages v4
npm uninstall @material-ui/core @material-ui/icons @material-ui/lab @material-ui/styles

# 2. Installer les packages v5 et leurs dépendances
npm install @mui/material @mui/icons-material @mui/lab @mui/styles @emotion/react @emotion/styled

# 3. Installer le codemod pour la migration automatique (optionnel)
npx @mui/codemod v5.0.0/preset-safe ./src

# 4. Vérifier les dépendances après migration
npm run verify:deps