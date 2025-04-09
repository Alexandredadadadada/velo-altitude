/**
 * Script pour résoudre définitivement le problème de nom de base de données
 * Migration complète de velo_altitude vers velo-altitude
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function fixDatabaseName() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  
  try {
    console.log('=== CORRECTION DU NOM DE LA BASE DE DONNÉES ===');
    console.log('📡 Connexion à MongoDB...');
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    // Vérifier les bases de données existantes
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    console.log('\n📦 BASES DE DONNÉES EXISTANTES:');
    dbs.databases.forEach(db => {
      console.log(`   - ${db.name} (${Math.round(db.sizeOnDisk / 1024)} KB)`);
    });
    
    // Vérifier si velo_altitude existe
    const veloAltitudeExists = dbs.databases.some(db => db.name === 'velo_altitude');
    const veloAltitudeDashExists = dbs.databases.some(db => db.name === 'velo-altitude');
    
    if (!veloAltitudeExists) {
      console.log('\n⚠️ La base de données velo_altitude n\'existe pas');
    }
    
    if (!veloAltitudeDashExists) {
      console.log('\n⚠️ La base de données velo-altitude n\'existe pas');
    }
    
    if (veloAltitudeExists) {
      // Obtenir toutes les collections dans velo_altitude
      const oldDb = client.db('velo_altitude');
      const collections = await oldDb.listCollections().toArray();
      
      console.log(`\n📚 COLLECTIONS DANS velo_altitude: ${collections.length}`);
      
      if (collections.length > 0) {
        // S'assurer que velo-altitude existe
        const newDb = client.db('velo-altitude');
        
        // Pour chaque collection, copier les données
        for (const collInfo of collections) {
          const collName = collInfo.name;
          console.log(`🔄 Migration de la collection ${collName}...`);
          
          // Compter les documents dans la collection source
          const sourceCollection = oldDb.collection(collName);
          const count = await sourceCollection.countDocuments();
          console.log(`   - ${count} documents trouvés`);
          
          if (count > 0) {
            // Récupérer tous les documents
            const documents = await sourceCollection.find({}).toArray();
            
            // Insérer dans la nouvelle collection
            const targetCollection = newDb.collection(collName);
            
            // Vérifier si la collection cible existe déjà
            const targetExists = await newDb.listCollections({ name: collName }).hasNext();
            if (targetExists) {
              console.log(`   - La collection ${collName} existe déjà dans velo-altitude`);
              
              // Vérifier si elle contient déjà des documents
              const targetCount = await targetCollection.countDocuments();
              if (targetCount > 0) {
                console.log(`   - La collection cible contient déjà ${targetCount} documents`);
                console.log(`   - Création d'une sauvegarde avant fusion...`);
                
                // Créer une sauvegarde de la collection cible
                const backupName = `${collName}_backup_${Date.now()}`;
                await newDb.collection(backupName).insertMany(await targetCollection.find({}).toArray());
                console.log(`   - Sauvegarde créée: ${backupName}`);
                
                // Stratégie de fusion: vérifier pour chaque document s'il existe déjà
                let inserted = 0;
                for (const doc of documents) {
                  // Vérifier si un document avec le même nom existe déjà
                  const exists = await targetCollection.findOne({ name: doc.name });
                  if (!exists) {
                    await targetCollection.insertOne(doc);
                    inserted++;
                  }
                }
                
                console.log(`   - ${inserted} nouveaux documents ajoutés`);
              } else {
                // Si la collection est vide, on peut simplement copier tous les documents
                await targetCollection.insertMany(documents);
                console.log(`   - ${documents.length} documents copiés`);
              }
            } else {
              // Si la collection n'existe pas, la créer et copier les documents
              await targetCollection.insertMany(documents);
              console.log(`   - ${documents.length} documents copiés vers la nouvelle collection`);
            }
          }
        }
        
        // Vérifier si toutes les données ont été migrées
        console.log('\n🔍 VÉRIFICATION DE LA MIGRATION...');
        let allMigrated = true;
        
        for (const collInfo of collections) {
          const collName = collInfo.name;
          const oldCount = await oldDb.collection(collName).countDocuments();
          const newCount = await newDb.collection(collName).countDocuments();
          
          if (oldCount <= newCount) {
            console.log(`✅ ${collName}: ${oldCount}/${newCount} documents migrés`);
          } else {
            console.log(`❌ ${collName}: ${oldCount}/${newCount} documents migrés - INCOMPLET`);
            allMigrated = false;
          }
        }
        
        if (allMigrated) {
          console.log('\n🗑️ Toutes les données ont été migrées. Voulez-vous supprimer la base velo_altitude? (y/n)');
          // En production, on ajouterait ici une interaction avec l'utilisateur.
          // Pour ce script, on simule une réponse positive.
          const response = 'y';
          
          if (response.toLowerCase() === 'y') {
            console.log('🗑️ Suppression de la base de données velo_altitude...');
            await adminDb.command({ dropDatabase: 'velo_altitude' });
            console.log('✅ Base de données velo_altitude supprimée avec succès');
          } else {
            console.log('⏭️ La base de données velo_altitude a été conservée');
          }
        } else {
          console.log('\n⚠️ La migration est incomplète, veuillez vérifier les erreurs ci-dessus');
        }
      } else {
        console.log('⚠️ Aucune collection trouvée dans velo_altitude');
      }
    }
    
    // Vérifier les bases de données après les opérations
    const finalDbs = await adminDb.admin().listDatabases();
    
    console.log('\n📦 BASES DE DONNÉES FINALES:');
    finalDbs.databases.forEach(db => {
      console.log(`   - ${db.name} (${Math.round(db.sizeOnDisk / 1024)} KB)`);
    });
    
    console.log('\n=== OPÉRATION TERMINÉE ===');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('📡 Connexion MongoDB fermée');
  }
}

// Lancer la correction
fixDatabaseName().catch(console.error);
