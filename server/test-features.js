/**
 * Script de test pour vérifier les fonctionnalités principales du serveur
 * 
 * Ce script permet de tester :
 * 1. L'endpoint /api/health
 * 2. L'authentification JWT
 * 3. Le système de gestion d'erreurs
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const errorService = require('./services/error.service');
const tokenBlacklist = require('./services/token-blacklist.service');
const authService = require('./services/auth.service');
const { logger } = require('./utils/logger');

// Configuration des tests
const TEST_RESULTS = {
  healthEndpoint: false,
  jwtAuthentication: false,
  errorManagement: false
};

// Fonction principale de test
async function runTests() {
  console.log('\n🔍 DÉBUT DES TESTS FONCTIONNELS 🔍\n');
  
  try {
    // Test 1: Simuler l'endpoint /api/health
    console.log('\n📊 TEST 1: ENDPOINT /API/HEALTH');
    await testHealthEndpoint();
    
    // Test 2: Tester l'authentification JWT
    console.log('\n🔐 TEST 2: AUTHENTIFICATION JWT');
    await testJwtAuthentication();
    
    // Test 3: Tester la gestion d'erreurs
    console.log('\n⚠️ TEST 3: GESTION D\'ERREURS');
    await testErrorManagement();
    
    // Résumé des tests
    console.log('\n📋 RÉSUMÉ DES TESTS:');
    console.log(`Endpoint /api/health: ${TEST_RESULTS.healthEndpoint ? '✅ OK' : '❌ ÉCHEC'}`);
    console.log(`Authentification JWT: ${TEST_RESULTS.jwtAuthentication ? '✅ OK' : '❌ ÉCHEC'}`);
    console.log(`Gestion d'erreurs: ${TEST_RESULTS.errorManagement ? '✅ OK' : '❌ ÉCHEC'}`);
    
  } catch (error) {
    console.error('\n❌ ERREUR LORS DES TESTS:', error);
  } finally {
    // Fermer la connexion MongoDB si elle était ouverte
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('\nConnexion MongoDB fermée');
    }
    console.log('\n🏁 FIN DES TESTS 🏁');
  }
}

// Test 1: Simuler l'endpoint /api/health
async function testHealthEndpoint() {
  try {
    // Vérifier si la connexion MongoDB est active
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Simuler la réponse de l'endpoint /api/health
    const healthStatus = {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus
    };
    
    console.log('État du système:', healthStatus);
    
    // Tenter de se connecter à MongoDB
    if (dbStatus !== 'connected') {
      try {
        console.log('Tentative de connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connexion à MongoDB réussie');
        
        // Mettre à jour le statut avec la nouvelle connexion
        healthStatus.database = 'connected';
        healthStatus.status = 'ok';
      } catch (dbError) {
        console.error('❌ Échec de connexion à MongoDB:', dbError.message);
        healthStatus.status = 'degraded';
        healthStatus.issues = ['database_connection'];
      }
    }
    
    console.log('État final du système:', healthStatus);
    TEST_RESULTS.healthEndpoint = healthStatus.status === 'ok';
    
  } catch (error) {
    console.error('❌ Erreur lors du test de l\'endpoint /api/health:', error);
    TEST_RESULTS.healthEndpoint = false;
  }
}

// Test 2: Tester l'authentification JWT
async function testJwtAuthentication() {
  try {
    // 1. Générer un token JWT
    console.log('Génération d\'un token JWT...');
    const mockUser = {
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    };
    
    const tokens = authService.generateTokens(mockUser);
    console.log('✅ Token généré avec succès');
    
    // 2. Vérifier la validité du token
    console.log('Vérification du token...');
    const decodedToken = await authService.verifyToken(tokens.accessToken);
    console.log('✅ Token vérifié avec succès');
    console.log('Données décodées:', decodedToken);
    
    // 3. Vérifier le temps restant du token
    const remainingTime = authService.getTokenRemainingTime(tokens.accessToken);
    console.log(`Temps restant du token: ${remainingTime} secondes`);
    
    // 4. Tester la révocation du token
    console.log('Test de révocation du token...');
    const revoked = await authService.logout(tokens.accessToken, mockUser._id);
    console.log(revoked ? '✅ Token révoqué avec succès' : '❌ Échec de révocation du token');
    
    // Tenter de vérifier le token révoqué
    try {
      await authService.verifyToken(tokens.accessToken);
      console.log('❌ Erreur: Le token révoqué a été validé');
      TEST_RESULTS.jwtAuthentication = false;
    } catch (error) {
      console.log('✅ Le token révoqué a bien été rejeté:', error.message);
      TEST_RESULTS.jwtAuthentication = true;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'authentification JWT:', error);
    TEST_RESULTS.jwtAuthentication = false;
  }
}

// Test 3: Tester la gestion d'erreurs
async function testErrorManagement() {
  try {
    console.log('Test des différents types d\'erreurs...');
    
    // Tableau des types d'erreurs à tester
    const errorTypes = [
      'auth_error',
      'access_denied',
      'validation_error',
      'not_found',
      'server_error'
    ];
    
    // Tester chaque type d'erreur
    for (const type of errorTypes) {
      console.log(`\nTest d'une erreur de type: ${type}`);
      
      // Créer une erreur avec errorService
      const error = errorService.createError({
        type,
        message: `Erreur test de type ${type}`,
        details: { test: true, timestamp: new Date().toISOString() },
        severity: errorService.SEVERITY_LEVELS.WARNING
      });
      
      // Afficher l'erreur créée
      console.log('Erreur créée:', {
        id: error.id,
        type: error.type,
        message: error.message,
        severity: error.severity,
        statusCode: errorService.HTTP_CODES[error.type]
      });
    }
    
    // Tester la capture d'une erreur non gérée
    console.log('\nTest de capture d\'une erreur non gérée...');
    try {
      // Générer une erreur intentionnellement
      throw new Error('Erreur non gérée intentionnelle');
    } catch (error) {
      const handledError = errorService.createError({
        type: 'uncaught_exception',
        message: `Exception capturée: ${error.message}`,
        details: { stack: error.stack },
        severity: 'critical'
      });
      
      console.log('Erreur capturée et transformée:', {
        id: handledError.id,
        type: handledError.type,
        message: handledError.message,
        severity: handledError.severity
      });
    }
    
    // Obtenir les statistiques d'erreurs
    const stats = errorService.getErrorStats();
    console.log('\nStatistiques des erreurs:', stats);
    
    // Test réussi
    TEST_RESULTS.errorManagement = true;
    
  } catch (error) {
    console.error('❌ Erreur lors du test de gestion d\'erreurs:', error);
    TEST_RESULTS.errorManagement = false;
  }
}

// Exécuter les tests
runTests();
