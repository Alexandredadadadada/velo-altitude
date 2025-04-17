# MongoDB Index Strategy for Velo-Altitude

## 1. Collections and Schema Fields

### users
- email (unique, login)
- stravaId (external integration)
- lastLoginAt (activity)

### challenges
- status, visibility, startDate, endDate (active challenge queries)
- participants.user (user challenge lookup)
- tags (search)
- title, description, tags (text search)

### colchallenges
- userId, status (user progress)
- challengeId, status (leaderboard)

## 2. Index Table

| Collection    | Field(s) / Type                                    | Query Patterns Supported                                                  | Estimated Impact           |
|---------------|----------------------------------------------------|--------------------------------------------------------------------------|----------------------------|
| users         | { email: 1 } (unique)                              | Login, lookup by email                                                   | Fast login                 |
| users         | { stravaId: 1 }                                    | Lookup by Strava integration                                             | 90%+ faster                |
| users         | { lastLoginAt: -1 }                                | Recent user activity                                                     | Fast dashboard             |
| challenges    | { status: 1, visibility: 1, startDate: 1, endDate: 1 } | Active challenge queries                                                 | 80-95% faster              |
| challenges    | { 'participants.user': 1 }                         | Challenges by user                                                       | 90%+ faster                |
| challenges    | { tags: 1 }                                        | Tag-based search                                                         | 90%+ faster                |
| challenges    | { title: 'text', description: 'text', tags: 'text' } | Full-text search                                                         | 90%+ faster                |
| colchallenges | { userId: 1, status: 1 }                           | User's in-progress/completed colchallenges                               | 80-95% faster              |
| colchallenges | { challengeId: 1, status: 1 }                      | Leaderboard/progress lookup                                              | 80-95% faster              |

## 3. Index Creation Commands

```js
// Users
// Already present: email (unique)
db.users.createIndex({ stravaId: 1 }, { background: true });
db.users.createIndex({ lastLoginAt: -1 }, { background: true });

// Challenges
db.challenges.createIndex({ status: 1, visibility: 1, startDate: 1, endDate: 1 }, { background: true });
db.challenges.createIndex({ "participants.user": 1 }, { background: true });
db.challenges.createIndex({ tags: 1 }, { background: true });
db.challenges.createIndex({ title: "text", description: "text", tags: "text" }, { background: true });

// ColChallenges
db.colchallenges.createIndex({ userId: 1, status: 1 }, { background: true });
db.colchallenges.createIndex({ challengeId: 1, status: 1 }, { background: true });
```

## 4. Monitoring & Maintenance
- Enable MongoDB profiler: `db.setProfilingLevel(2, { slowms: 100 })`
- Weekly: `db.collection.aggregate([{$indexStats:{}}])` to report unused indexes
- Remove unused indexes to optimize write performance
- Monitor slow query logs and adjust as query patterns evolve

## 5. Special Note: Geospatial Indexes
- For the "7 Majeurs" feature or any col location queries, if you add a `location` field (GeoJSON), create:
```js
db.cols.createIndex({ location: "2dsphere" }, { background: true });
```
- This supports `$near`, `$geoWithin`, etc. for map and route features.

---

**This document is ready for review and implementation tracking.**
