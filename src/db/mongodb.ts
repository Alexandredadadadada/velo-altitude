import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error('MongoDB URI not configured in environment variables');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the connection
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new connection
  client = new MongoClient(process.env.MONGODB_URI);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

export async function getCollection<T>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

// Helper functions for common database operations

// Generic find one document by ID
export async function findById<T>(collection: string, id: string): Promise<T | null> {
  const db = await getDb();
  return db.collection<T>(collection).findOne({ _id: id }) as Promise<T | null>;
}

// Generic find many documents with optional query
export async function findMany<T>(collection: string, query = {}, options = {}): Promise<T[]> {
  const db = await getDb();
  return db.collection<T>(collection).find(query, options).toArray();
}

// Generic insert one document
export async function insertOne<T>(collection: string, document: T): Promise<T> {
  const db = await getDb();
  const result = await db.collection<T>(collection).insertOne(document as any);
  return { ...document, _id: result.insertedId } as T;
}

// Generic update one document
export async function updateOne<T>(collection: string, id: string, update: Partial<T>): Promise<T | null> {
  const db = await getDb();
  await db.collection<T>(collection).updateOne({ _id: id }, { $set: update });
  return findById<T>(collection, id);
}

// Generic delete one document
export async function deleteOne(collection: string, id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection(collection).deleteOne({ _id: id });
  return result.deletedCount === 1;
}

// Close the database connection when the app is shutting down
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
  }
}
