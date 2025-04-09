/**
 * Gestion des interactions avec la base de données pour les cols
 */
import { Collection, MongoClient, ObjectId } from 'mongodb';
import { Col, ElevationProfile } from './types';

// Configuration MongoDB
const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI || "mongodb+srv://username:password@velo-altitude.mongodb.net/velo_altitude?retryWrites=true&w=majority",
  database: "velo_altitude",
  collections: {
    cols: "cols",
    backups: "cols_backups"
  },
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};

export class ColRepository {
  private client: MongoClient;
  private connected: boolean = false;
  private db: any;
  private colsCollection: Collection;

  constructor() {
    this.client = new MongoClient(MONGODB_CONFIG.uri);
  }

  /**
   * Établit la connexion à MongoDB
   */
  private async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.db = this.client.db(MONGODB_CONFIG.database);
      this.colsCollection = this.db.collection(MONGODB_CONFIG.collections.cols);
      this.connected = true;
    }
  }

  /**
   * Récupère tous les cols
   */
  async getAll(): Promise<Col[]> {
    await this.connect();
    return await this.colsCollection.find({}).toArray() as unknown as Col[];
  }

  /**
   * Récupère un col par son ID
   */
  async getById(id: string): Promise<Col | null> {
    await this.connect();
    return await this.colsCollection.findOne({ _id: new ObjectId(id) }) as unknown as Col;
  }

  /**
   * Met à jour le profil d'élévation d'un col
   */
  async updateProfile(id: string, profile: ElevationProfile): Promise<boolean> {
    await this.connect();
    
    const result = await this.colsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          elevation_profile: profile,
          updatedAt: new Date()
        } 
      }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Crée une sauvegarde des cols
   */
  async createBackup(collectionName: string, cols: Col[]): Promise<void> {
    await this.connect();
    
    // Créer une nouvelle collection de backup
    const backupCollection = this.db.collection(collectionName);
    
    // Insérer les cols dans la collection de backup
    await backupCollection.insertMany(cols);
  }

  /**
   * Ferme la connexion à MongoDB
   */
  async close() {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
    }
  }
}
