# API_GUIDE_ADVANCED – Sprint Excellence 2025

## Endpoints avancés et innovations

### Nouveaux endpoints (2025)
- `/api/cols/enriched` : accès aux profils enrichis (météo, records, images)
- `/api/training/programs/advanced` : programmes structurés, HIIT, filtres multi-critères
- `/api/nutrition/recipes/ai-recommendation` : suggestions personnalisées IA
- `/api/monitoring/perf` : stats temps de chargement, FPS, bundle size
- `/api/community/photo-challenge` : soumission et vote photos cols

### Standards de qualité
- Réponses structurées, validées par schemas JSON
- Codes d’erreur explicites, messages contextualisés
- Limites de rate et logs pour chaque endpoint critique

### Exemples d’utilisation

```http
GET /api/cols/enriched?country=fr&min_elevation=2000
```

```http
POST /api/nutrition/recipes/ai-recommendation
{
  "profile": "climber",
  "phase": "pre-ride"
}
```

### Sécurité & monitoring
- Auth obligatoire sur endpoints sensibles
- Logs et alertes automatiques sur erreurs et lenteurs

---

# Nouveautés Sprint Excellence 2025

- Endpoints API pour import batch (training, nutrition)
- Exemples d’utilisation automatisés (scripts Node.js)
- Validation automatique des données (voir scripts server/scripts)
- Prochaines étapes : endpoints pour enrichissement cols, dashboard live

---

Voir [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) pour la référence complète.
