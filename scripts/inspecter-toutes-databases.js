/**
 * Script pour inspecter TOUTES les bases de données disponibles
 * et analyser en détail les problèmes de tirets vs underscores
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

// Fonction pour formater la taille
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function inspectAllDatabases() {
  // Essayer différentes variantes d'URI pour s'assurer que nous nous connectons
  const possibleURIs = [
    process.env.MONGODB_URI,
    process.env.MONGODB_URI?.replace('velo-altitude', 'velo_altitude'),
    process.env.MONGODB_URI?.replace('velo_altitude', 'velo-altitude'),
    "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/?retryWrites=true&w=majority"
  ].filter(Boolean);

  console.log('=== INSPECTION COMPLÈTE DES BASES DE DONNÉES ===');
  
  let client;
  let connectedURI = '';
  
  // Essayer chaque URI jusqu'à ce qu'un fonctionne
  for (const uri of possibleURIs) {
    try {
      console.log(`📡 Tentative de connexion avec URI: ${uri.substr(0, 40)}...`);
      client = new MongoClient(uri);
      await client.connect();
      console.log('✅ Connexion réussie!');
      connectedURI = uri;
      break;
    } catch (error) {
      console.error(`❌ Échec de connexion: ${error.message}`);
      if (client) await client.close();
      client = null;
    }
  }
  
  if (!client) {
    console.error('❌ Impossible de se connecter à MongoDB avec aucun des URIs');
    return;
  }
  
  try {
    // Lister toutes les bases de données avec leur taille
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    console.log('\n📊 TOUTES LES BASES DE DONNÉES DISPONIBLES:');
    console.log('╔════════════════════════╦═══════════════╦═══════════════════════════════════╗');
    console.log('║ Nom de la base         ║ Taille        ║ Observations                      ║');
    console.log('╠════════════════════════╬═══════════════╬═══════════════════════════════════╣');
    
    for (const db of dbs.databases) {
      let observation = '';
      
      if (db.name.includes('velo')) {
        if (db.name === 'velo-altitude') {
          observation = 'Base principale (avec tirets)';
        } else if (db.name === 'velo_altitude') {
          observation = 'Ancienne base (avec underscores)';
        } else {
          observation = 'Base liée au projet';
        }
        
        // Si c'est une grande base (>500MB)
        if (db.sizeOnDisk > 500 * 1024 * 1024) {
          observation += ' - GRANDE BASE!';
        }
      }
      
      console.log(`║ ${db.name.padEnd(22)} ║ ${formatSize(db.sizeOnDisk).padEnd(13)} ║ ${observation.padEnd(33)} ║`);
    }
    console.log('╚════════════════════════╩═══════════════╩═══════════════════════════════════╝');
    
    // Examiner en détail les bases liées à velo-altitude
    console.log('\n🔍 INSPECTION DÉTAILLÉE DES BASES VELO:');
    
    for (const dbInfo of dbs.databases) {
      if (dbInfo.name.includes('velo')) {
        console.log(`\n==== BASE: ${dbInfo.name} (${formatSize(dbInfo.sizeOnDisk)}) ====`);
        
        // Obtenir les collections dans cette base
        const database = client.db(dbInfo.name);
        const collections = await database.listCollections().toArray();
        
        if (collections.length === 0) {
          console.log('   Aucune collection trouvée');
          continue;
        }
        
        console.log('   Collections:');
        for (const coll of collections) {
          try {
            const count = await database.collection(coll.name).countDocuments();
            const sizeStats = await database.command({ collStats: coll.name });
            const size = sizeStats.size || 0;
            
            console.log(`   - ${coll.name}: ${count} documents (${formatSize(size)})`);
            
            // Si c'est la collection cols, analyser son contenu
            if (coll.name === 'cols') {
              try {
                // Obtenir un échantillon pour analyse
                const sample = await database.collection(coll.name).find().limit(1).toArray();
                
                if (sample.length > 0) {
                  const col = sample[0];
                  console.log(`     ↳ Exemple: Col "${col.name}" à ${col.elevation}m`);
                  
                  // Vérifier la présence de structures importantes
                  console.log(`     ↳ Structure: ${Object.keys(col).join(', ')}`);
                  
                  const has3D = col.visualization3D !== undefined;
                  console.log(`     ↳ Données 3D: ${has3D ? '✅ Présentes' : '❌ Absentes'}`);
                }
              } catch (error) {
                console.error(`     ❌ Erreur lors de l'analyse des cols: ${error.message}`);
              }
            }
          } catch (error) {
            console.error(`   ❌ Erreur sur collection ${coll.name}: ${error.message}`);
          }
        }
      }
    }
    
    // Recommandations
    console.log('\n🔧 RECOMMANDATIONS:');
    console.log('1. URI de connexion à utiliser dans vos fichiers .env:');
    console.log(`   ${connectedURI}`);
    
    // Vérifier si les deux bases velo existent
    const hasVeloAltitude = dbs.databases.some(db => db.name === 'velo-altitude');
    const hasVeloAltitudeUnderscore = dbs.databases.some(db => db.name === 'velo_altitude');
    
    if (hasVeloAltitude && hasVeloAltitudeUnderscore) {
      console.log('\n⚠️ ATTENTION: Les deux bases "velo-altitude" et "velo_altitude" existent!');
      console.log('   Utilisez le script fix-database-name.js pour fusionner ces bases.');
    } else if (hasVeloAltitude) {
      console.log('\n✅ Configuration correcte: Seule la base "velo-altitude" existe.');
      console.log('   Assurez-vous que tous vos fichiers de code utilisent ce nom avec des tirets.');
    } else if (hasVeloAltitudeUnderscore) {
      console.log('\n⚠️ ATTENTION: Seule la base "velo_altitude" existe (avec underscores).');
      console.log('   Vous devriez renommer cette base ou ajuster vos fichiers de code.');
    }
    
    console.log('\n=== INSPECTION TERMINÉE ===');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'inspection:', error);
  } finally {
    await client.close();
    console.log('📡 Connexion MongoDB fermée');
  }
}

// Lancer l'inspection
inspectAllDatabases().catch(console.error);
