# Résolution des Problèmes de Sous-modules Git

**Date :** 5 avril 2025  
**Version :** 1.0.0  
**Statut :** ✅ Résolu  

## Problème Identifié

Lors du déploiement sur Netlify, l'erreur suivante était signalée :

```
fatal: No url found for submodule path 'VELO-ALTITUDE' in .gitmodules
```

Cette erreur indiquait un conflit entre la configuration Git du projet et un dossier `VELO-ALTITUDE` qui était traité comme un sous-module.

## Cause du Problème

1. Le dossier `VELO-ALTITUDE` contenait un répertoire `.git`, ce qui faisait que Git le traitait comme un sous-module
2. Cependant, le fichier `.gitmodules` indiquait qu'il n'y avait pas de sous-modules dans ce projet
3. Cette incohérence provoquait l'échec du déploiement sur Netlify

## Solution Appliquée

Les actions suivantes ont été effectuées pour résoudre le problème :

1. **Désinitialisation du sous-module :**
   ```bash
   git submodule deinit -f VELO-ALTITUDE
   ```

2. **Suppression du sous-module du cache Git :**
   ```bash
   git rm -rf --cached VELO-ALTITUDE
   ```

3. **Mise à jour du fichier .gitmodules :**
   Le fichier a été mis à jour pour indiquer clairement qu'il n'y a pas de sous-modules Git dans ce projet

## Prévention des Problèmes Futurs

Pour éviter de rencontrer à nouveau ce problème :

1. **Éviter les dépôts Git imbriqués :**
   - Ne pas créer de répertoires `.git` à l'intérieur du projet principal
   - Si vous avez besoin d'inclure un autre projet, utilisez npm/yarn pour les dépendances ou des sous-modules Git correctement configurés

2. **Vérifier régulièrement la structure Git :**
   ```bash
   git submodule status
   ```

3. **Si vous utilisez intentionnellement des sous-modules :**
   Assurez-vous que le fichier `.gitmodules` est correctement configuré :
   ```
   [submodule "nom-du-sous-module"]
       path = chemin/vers/sous-module
       url = https://github.com/compte/repo.git
   ```

## Déploiement sur Netlify

Après avoir résolu le problème de sous-module, le déploiement sur Netlify devrait fonctionner correctement. Si vous rencontrez d'autres problèmes, vérifiez :

1. Les paramètres de build dans `netlify.toml`
2. Les scripts de build dans `package.json`
3. La configuration de webpack dans `webpack.fix.js`

## Référence

Pour plus d'informations sur la gestion des sous-modules Git, consultez :
- [Documentation Git sur les sous-modules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Documentation Netlify sur les déploiements Git](https://docs.netlify.com/configure-builds/common-configurations/)
