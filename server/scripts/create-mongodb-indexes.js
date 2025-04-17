// Script to create recommended MongoDB indexes for Velo-Altitude
// Usage: node scripts/create-mongodb-indexes.js

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/velo-altitude';
const dbName = uri.split('/').pop();

async function createIndexes() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);

    // USERS
    await db.collection('users').createIndex({ stravaId: 1 });
    await db.collection('users').createIndex({ lastLoginAt: -1 });

    // CHALLENGES
    await db.collection('challenges').createIndex({ status: 1, visibility: 1, startDate: 1, endDate: 1 });
    await db.collection('challenges').createIndex({ 'participants.user': 1 });
    await db.collection('challenges').createIndex({ tags: 1 });
    await db.collection('challenges').createIndex({ title: 'text', description: 'text', tags: 'text' });

    // COLCHALLENGES
    await db.collection('colchallenges').createIndex({ userId: 1, status: 1 });
    await db.collection('colchallenges').createIndex({ challengeId: 1, status: 1 });

    console.log('✅ All recommended indexes created successfully.');
  } catch (err) {
    console.error('❌ Error creating indexes:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createIndexes();
