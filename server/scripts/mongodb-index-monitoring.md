# MongoDB Index Monitoring for Velo-Altitude

## Profiling Configuration

Enable profiling for slow queries (over 100ms):

```js
db.setProfilingLevel(2, { slowms: 100 })
```

## Export Slow Query Log

After 1-2 hours of normal traffic, export slow query logs:

```js
db.system.profile.find().pretty()
```

## Weekly Index Usage Report

To check usage and efficiency of all indexes:

```js
// For each collection
db.collection.aggregate([{$indexStats:{}}])
```

## Remove Unused Indexes

If an index is never used, consider removing it:

```js
db.collection.dropIndex("indexName")
```

## Atlas/Compass Monitoring
- Use MongoDB Atlas or Compass to visualize index hit rates and slow queries.
- Set up alerts for queries exceeding 100ms.

## Maintenance Checklist
- [ ] Enable and review profiler logs weekly
- [ ] Generate and review index usage reports
- [ ] Remove unused indexes
- [ ] Re-evaluate indexes after new features or query patterns

---

**This document can be included in your ops/devops runbook.**
