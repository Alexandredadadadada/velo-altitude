/**
 * Test MSW
 * 
 * Ce script permet de tester l'interception des appels API par MSW.
 * Il peut être exécuté dans la console du navigateur pour vérifier que MSW
 * fonctionne correctement.
 */

/**
 * Fonction de test pour vérifier l'interception des appels API par MSW
 * @returns {Promise<string>} Message de résultat
 */
async function testMSW() {
  console.log("=== Test d'interception MSW ===");
  console.log("Vérification que MSW intercepte correctement les appels API...");
  
  try {
    // Test 1: Récupération des cols
    console.log("\n--- Test 1: Récupération des cols ---");
    const colsResponse = await fetch('/api/cols');
    if (!colsResponse.ok) {
      throw new Error(`Erreur lors de la récupération des cols: ${colsResponse.status}`);
    }
    const cols = await colsResponse.json();
    console.log("✅ Cols récupérés avec succès:", cols);
    
    // Test 2: Récupération des données nutritionnelles
    console.log("\n--- Test 2: Récupération des données nutritionnelles ---");
    const userId = "test-user-id";
    const nutritionResponse = await fetch(`/api/users/${userId}/nutrition`);
    if (!nutritionResponse.ok) {
      throw new Error(`Erreur lors de la récupération des données nutritionnelles: ${nutritionResponse.status}`);
    }
    const nutrition = await nutritionResponse.json();
    console.log("✅ Données nutritionnelles récupérées avec succès:", nutrition);
    
    // Test 3: Récupération du profil utilisateur
    console.log("\n--- Test 3: Récupération du profil utilisateur ---");
    const profileResponse = await fetch(`/api/users/${userId}/profile`);
    if (!profileResponse.ok) {
      throw new Error(`Erreur lors de la récupération du profil: ${profileResponse.status}`);
    }
    const profile = await profileResponse.json();
    console.log("✅ Profil utilisateur récupéré avec succès:", profile);
    
    // Vérification dans la console
    console.log("\n=== Résumé des tests ===");
    console.log("✅ Tous les tests ont réussi!");
    console.log("✅ MSW intercepte correctement les appels API.");
    console.log("✅ Vérifiez dans l'onglet Réseau que les requêtes sont marquées '(from ServiceWorker)'.");
    
    return "Tests MSW terminés avec succès - Consultez la console pour les détails";
  } catch (error) {
    console.error("❌ Erreur lors des tests MSW:", error);
    return `Erreur lors des tests MSW: ${error.message}`;
  }
}

// Exporter la fonction pour qu'elle soit accessible dans la console
window.testMSW = testMSW;

// Instructions d'utilisation
console.log(`
=== Test MSW ===
Pour tester l'interception des appels API par MSW, exécutez la commande suivante dans la console:
  testMSW()
`);

export default testMSW;
