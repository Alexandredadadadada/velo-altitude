const { MongoClient } = require('mongodb');

let cachedDb = null;

async function mongoConnect() {
    if (cachedDb) {
        console.log('Using cached MongoDB connection');
        return cachedDb;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('[db.js] MONGODB_URI environment variable is not set.');
    }

    console.log('[db.js] Establishing new MongoDB connection...');
    const client = new MongoClient(uri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000 // Added timeout
    });

    try {
        await client.connect();
        const dbName = process.env.MONGODB_DB_NAME || 'velo-altitude'; // Use env var or default
        const db = client.db(dbName);
        cachedDb = db;
        console.log(`[db.js] Successfully connected to MongoDB database: ${dbName}`);
        return db;
    } catch (error) {
        console.error("[db.js] Error connecting to MongoDB:", error);
        // Ensure client is closed if connection fails during initialization
        await client.close(); 
        throw error; // Re-throw the error after logging
    }
    // Note: We are not closing the client here to allow connection reuse.
    // Netlify function execution environments might handle this.
}

module.exports = { mongoConnect };
