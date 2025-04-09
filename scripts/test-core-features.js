/**
 * Script de test des fonctionnalités de base de Velo-Altitude
 * Exécuter avec: node test-core-features.js
 */

const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'https://velo-altitude.com/api';
const MONGODB_URI = "mongodb+srv://dash-admin:U16G7XR2tC9x4TUA@cluster0grandest.wnfqy.mongodb.net/";
const DB_NAME = "velo_altitude";

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Test des services
 */
class ServiceTester {
  constructor() {
    this.authToken = process.env.TEST_AUTH_TOKEN;
    this.results = {
      database: { success: false, details: {} },
      auth: { success: false, details: {} },
      cols: { success: false, details: {} },
      weather: { success: false, details: {} },
      challenges: { success: false, details: {} }
    };
  }

  /**
   * Test de connexion à la base de données
   */
  async testDatabaseConnection() {
    console.log(`${colors.blue}➤ Test de connexion à MongoDB...${colors.reset}`);
    
    if (!MONGODB_URI) {
      console.error(`${colors.red}✗ MONGODB_URI non définie${colors.reset}`);
      this.results.database = { success: false, details: { error: 'MONGODB_URI non définie' } };
      return false;
    }
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      console.log(`${colors.green}✓ Connexion à MongoDB réussie${colors.reset}`);
      
      // Tester l'accès à la base de données
      const db = client.db(DB_NAME);
      
      // Obtenir la liste des collections
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log(`${colors.cyan}Collections disponibles:${colors.reset}`, collectionNames);
      
      // Vérifier les collections requises
      const requiredCollections = ['cols', 'challenges', 'users', 'routes'];
      const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));
      
      if (missingCollections.length > 0) {
        console.warn(`${colors.yellow}⚠ Collections manquantes: ${missingCollections.join(', ')}${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ Toutes les collections requises sont présentes${colors.reset}`);
      }
      
      // Compter les documents dans chaque collection
      const counts = {};
      for (const collection of collectionNames) {
        counts[collection] = await db.collection(collection).countDocuments();
        console.log(`${colors.cyan}${collection}:${colors.reset} ${counts[collection]} documents`);
      }
      
      this.results.database = { 
        success: true, 
        details: { 
          collections: collectionNames, 
          counts, 
          missingCollections 
        } 
      };
      
      return true;
    } catch (error) {
      console.error(`${colors.red}✗ Erreur de connexion à MongoDB:${colors.reset}`, error.message);
      this.results.database = { success: false, details: { error: error.message } };
      return false;
    } finally {
      await client.close();
    }
  }

  /**
   * Test des routes d'API
   */
  async testApiRoutes() {
    console.log(`\n${colors.blue}➤ Test des routes d'API...${colors.reset}`);
    
    // Configurer l'en-tête d'autorisation si disponible
    const headers = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    // Test de l'API de cols
    try {
      console.log(`${colors.cyan}Teste l'API de cols...${colors.reset}`);
      const colsResponse = await axios.get(`${BASE_URL}/cols`, { headers });
      
      if (colsResponse.status === 200 && Array.isArray(colsResponse.data)) {
        console.log(`${colors.green}✓ API cols fonctionnelle - ${colsResponse.data.length} cols récupérés${colors.reset}`);
        this.results.cols = { 
          success: true, 
          details: { 
            count: colsResponse.data.length, 
            sample: colsResponse.data.slice(0, 2) 
          } 
        };
      } else {
        console.warn(`${colors.yellow}⚠ API cols a répondu mais avec un format inattendu${colors.reset}`);
        this.results.cols = { 
          success: false, 
          details: { 
            status: colsResponse.status, 
            dataType: typeof colsResponse.data 
          } 
        };
      }
    } catch (error) {
      console.error(`${colors.red}✗ Erreur lors de l'accès à l'API cols:${colors.reset}`, error.message);
      this.results.cols = { success: false, details: { error: error.message } };
    }
    
    // Test de l'API météo
    try {
      console.log(`${colors.cyan}Teste l'API météo...${colors.reset}`);
      // Coordonnées du Col du Galibier
      const weatherResponse = await axios.get(`${BASE_URL}/weather?lat=45.0604&lon=6.4077`, { headers });
      
      if (weatherResponse.status === 200 && weatherResponse.data) {
        console.log(`${colors.green}✓ API météo fonctionnelle${colors.reset}`);
        this.results.weather = { 
          success: true, 
          details: { 
            data: weatherResponse.data
          } 
        };
      } else {
        console.warn(`${colors.yellow}⚠ API météo a répondu mais avec un format inattendu${colors.reset}`);
        this.results.weather = { 
          success: false, 
          details: { 
            status: weatherResponse.status, 
            dataType: typeof weatherResponse.data 
          } 
        };
      }
    } catch (error) {
      console.error(`${colors.red}✗ Erreur lors de l'accès à l'API météo:${colors.reset}`, error.message);
      this.results.weather = { success: false, details: { error: error.message } };
    }
    
    // Test de l'API défis
    try {
      console.log(`${colors.cyan}Teste l'API défis...${colors.reset}`);
      const challengesResponse = await axios.get(`${BASE_URL}/challenges`, { headers });
      
      if (challengesResponse.status === 200 && Array.isArray(challengesResponse.data)) {
        console.log(`${colors.green}✓ API défis fonctionnelle - ${challengesResponse.data.length} défis récupérés${colors.reset}`);
        this.results.challenges = { 
          success: true, 
          details: { 
            count: challengesResponse.data.length, 
            sample: challengesResponse.data.slice(0, 1) 
          } 
        };
      } else {
        console.warn(`${colors.yellow}⚠ API défis a répondu mais avec un format inattendu${colors.reset}`);
        this.results.challenges = { 
          success: false, 
          details: { 
            status: challengesResponse.status, 
            dataType: typeof challengesResponse.data 
          } 
        };
      }
    } catch (error) {
      console.error(`${colors.red}✗ Erreur lors de l'accès à l'API défis:${colors.reset}`, error.message);
      this.results.challenges = { success: false, details: { error: error.message } };
    }
  }

  /**
   * Test d'authentification
   */
  async testAuth() {
    console.log(`\n${colors.blue}➤ Test de l'authentification...${colors.reset}`);
    
    if (!this.authToken) {
      console.warn(`${colors.yellow}⚠ Pas de token d'authentification fourni - Tests d'authentification limités${colors.reset}`);
      this.results.auth = { success: false, details: { error: 'Pas de token fourni' } };
      return;
    }
    
    try {
      console.log(`${colors.cyan}Vérifie la validité du token...${colors.reset}`);
      const userResponse = await axios.get(`${BASE_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      if (userResponse.status === 200 && userResponse.data) {
        console.log(`${colors.green}✓ Token d'authentification valide - Profil utilisateur accessible${colors.reset}`);
        this.results.auth = { 
          success: true, 
          details: { 
            username: userResponse.data.username || userResponse.data.name,
            email: userResponse.data.email
          } 
        };
      } else {
        console.warn(`${colors.yellow}⚠ Réponse du serveur inattendue pour le profil utilisateur${colors.reset}`);
        this.results.auth = { 
          success: false, 
          details: { 
            status: userResponse.status, 
            dataType: typeof userResponse.data 
          } 
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error(`${colors.red}✗ Token d'authentification invalide ou expiré${colors.reset}`);
        this.results.auth = { success: false, details: { error: 'Token invalide ou expiré' } };
      } else {
        console.error(`${colors.red}✗ Erreur lors de la vérification du token:${colors.reset}`, error.message);
        this.results.auth = { success: false, details: { error: error.message } };
      }
    }
  }

  /**
   * Génère un rapport des tests
   */
  generateReport() {
    console.log(`\n${colors.magenta}=== RAPPORT DES TESTS ====${colors.reset}`);
    
    // Base de données
    if (this.results.database.success) {
      console.log(`${colors.green}✓ Base de données: CONNECTÉE${colors.reset}`);
      console.log(`  - ${this.results.database.details.collections.length} collections disponibles`);
      
      const colsCount = this.results.database.details.counts?.cols || 0;
      const challengesCount = this.results.database.details.counts?.challenges || 0;
      const usersCount = this.results.database.details.counts?.users || 0;
      
      if (colsCount === 0) console.log(`${colors.yellow}  ⚠ Aucun col dans la base de données${colors.reset}`);
      else console.log(`  - ${colsCount} cols dans la base de données`);
      
      if (challengesCount === 0) console.log(`${colors.yellow}  ⚠ Aucun défi dans la base de données${colors.reset}`);
      else console.log(`  - ${challengesCount} défis dans la base de données`);
      
      if (usersCount === 0) console.log(`${colors.yellow}  ⚠ Aucun utilisateur dans la base de données${colors.reset}`);
      else console.log(`  - ${usersCount} utilisateurs dans la base de données`);
      
    } else {
      console.log(`${colors.red}✗ Base de données: ERREUR DE CONNEXION${colors.reset}`);
      console.log(`  - Erreur: ${this.results.database.details.error}`);
    }
    
    // Authentification
    if (this.results.auth.success) {
      console.log(`${colors.green}✓ Authentification: FONCTIONNELLE${colors.reset}`);
      console.log(`  - Utilisateur: ${this.results.auth.details.username}`);
      console.log(`  - Email: ${this.results.auth.details.email}`);
    } else {
      console.log(`${colors.red}✗ Authentification: PROBLÈME${colors.reset}`);
      console.log(`  - Erreur: ${this.results.auth.details.error}`);
    }
    
    // API Cols
    if (this.results.cols.success) {
      console.log(`${colors.green}✓ API Cols: FONCTIONNELLE${colors.reset}`);
      console.log(`  - ${this.results.cols.details.count} cols récupérés`);
    } else {
      console.log(`${colors.red}✗ API Cols: PROBLÈME${colors.reset}`);
      console.log(`  - Erreur: ${this.results.cols.details.error}`);
    }
    
    // API Météo
    if (this.results.weather.success) {
      console.log(`${colors.green}✓ API Météo: FONCTIONNELLE${colors.reset}`);
      const data = this.results.weather.details.data;
      if (data.main) console.log(`  - Température: ${data.main.temp}°C`);
      if (data.wind) console.log(`  - Vent: ${data.wind.speed} km/h, direction: ${data.wind.deg}°`);
    } else {
      console.log(`${colors.red}✗ API Météo: PROBLÈME${colors.reset}`);
      console.log(`  - Erreur: ${this.results.weather.details.error}`);
    }
    
    // API Défis
    if (this.results.challenges.success) {
      console.log(`${colors.green}✓ API Défis: FONCTIONNELLE${colors.reset}`);
      console.log(`  - ${this.results.challenges.details.count} défis récupérés`);
    } else {
      console.log(`${colors.red}✗ API Défis: PROBLÈME${colors.reset}`);
      console.log(`  - Erreur: ${this.results.challenges.details.error}`);
    }
    
    // Verdict global
    const allSuccess = Object.values(this.results).every(r => r.success);
    if (allSuccess) {
      console.log(`\n${colors.green}✓✓✓ TOUS LES TESTS ONT RÉUSSI ✓✓✓${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠ CERTAINS TESTS ONT ÉCHOUÉ ⚠${colors.reset}`);
      console.log('Exécutez les correctifs suivants:');
      
      if (!this.results.database.success) {
        console.log(`${colors.cyan}1. Vérifiez la connexion MongoDB:${colors.reset}`);
        console.log('   - La variable MONGODB_URI est-elle définie correctement?');
        console.log('   - Le serveur MongoDB est-il accessible?');
      }
      
      if (!this.results.cols.success && this.results.database.success) {
        console.log(`${colors.cyan}2. Importez les données des cols:${colors.reset}`);
        console.log('   - Exécutez: node scripts/import-cols.js');
      }
      
      if (!this.results.challenges.success && this.results.database.success) {
        console.log(`${colors.cyan}3. Importez les défis:${colors.reset}`);
        console.log('   - Exécutez: node scripts/import-challenges.js');
      }
      
      if (!this.results.auth.success) {
        console.log(`${colors.cyan}4. Vérifiez la configuration Auth0:${colors.reset}`);
        console.log('   - Les variables AUTH0_* sont-elles définies correctement?');
        console.log('   - L\'API Auth0 est-elle accessible?');
      }
      
      if (!this.results.weather.success) {
        console.log(`${colors.cyan}5. Vérifiez la configuration des API météo:${colors.reset}`);
        console.log('   - OPENWEATHER_API_KEY est-elle définie correctement?');
        console.log('   - WINDY_PLUGINS_API est-elle définie correctement?');
      }
    }
  }

  /**
   * Exécute tous les tests
   */
  async runAllTests() {
    console.log(`${colors.magenta}=== DÉMARRAGE DES TESTS ====${colors.reset}`);
    console.log(`Date: ${new Date().toLocaleString()}`);
    
    await this.testDatabaseConnection();
    await this.testApiRoutes();
    await this.testAuth();
    
    this.generateReport();
  }
}

// Exécuter les tests
const tester = new ServiceTester();
tester.runAllTests().catch(error => {
  console.error(`${colors.red}Erreur fatale lors des tests:${colors.reset}`, error);
});
