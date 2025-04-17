# Velo-Altitude – Deployment Guide (v2.1)

## Deployment Overview

This guide describes how to deploy the Velo-Altitude platform (v2.1), now fully modernized with Vite, Service Worker, and advanced monitoring.

---

## Prerequisites
- Node.js ≥16.14.0
- npm ≥8.0.0
- MongoDB (production-ready, with indexes)
- Redis (for caching)

---

## Build & Deploy (Vite)

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

### Optional: Compare Builds

```bash
node build-comparison.js
```

---

## Service Worker & Offline
- Service Worker auto-registers on load
- Offline.html is served for navigation fallback
- Background sync for challenges/activities (IndexedDB)

---

## Monitoring
- Core Web Vitals and custom metrics sent to /api/analytics endpoints
- Prometheus metrics available at /metrics (server)

---

## Deployment Steps
1. **Staging**: Deploy to staging and run QA
2. **Production**: Deploy to production server
3. **Monitoring**: Set up alerts for regressions
4. **Backup**: Ensure DB and Redis backup before rollout

---

## Rollback
- Restore previous build from backup
- Restore MongoDB and Redis snapshots if needed

---

## References
- [Release Notes](../RELEASE_NOTES_v2.1.md)
- [Project Status](../PROJECT_STATUS_UPDATE.md)
- [Performance Guide](../docs/PERFORMANCE_GUIDE.md)

---

## Contact
For deployment support, contact the Velo-Altitude DevOps team.