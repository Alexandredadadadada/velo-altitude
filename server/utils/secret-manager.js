/**
 * SecretManager - Classe pour la gestion sécurisée des secrets
 * 
 * Cette classe implémente un système de validation des secrets requis
 * pour le fonctionnement sécurisé de l'application. Elle vérifie que tous
 * les secrets nécessaires sont définis et qu'ils sont suffisamment forts.
 */

class SecretManager {
  /**
   * Constructeur
   * @param {Object} options - Options de configuration
   * @param {Array<string>} options.additionalSecrets - Secrets supplémentaires à vérifier
   * @param {number} options.minSecretLength - Longueur minimale des secrets
   * @param {number} options.minEntropyLevel - Niveau d'entropie minimal (1-4)
   */
  constructor(options = {}) {
    // Options par défaut
    this.options = {
      minSecretLength: 32,
      minEntropyLevel: 3,
      ...options
    };

    // Liste des secrets requis par défaut
    this.requiredSecrets = [
      'API_KEYS_ENCRYPTION_KEY',
      'JWT_SECRET'
    ];

    // Ajouter des secrets supplémentaires si spécifiés
    if (options.additionalSecrets && Array.isArray(options.additionalSecrets)) {
      this.requiredSecrets = [...this.requiredSecrets, ...options.additionalSecrets];
    }
  }

  /**
   * Vérifier que tous les secrets requis sont définis
   * @returns {Object} - Résultat de la validation avec les secrets manquants
   */
  validateRequiredSecrets() {
    const missingSecrets = this.requiredSecrets.filter(secret => {
      return !process.env[secret] || process.env[secret].trim() === '';
    });
    
    const result = {
      valid: missingSecrets.length === 0,
      missingSecrets
    };

    if (!result.valid) {
      console.error(`Secrets manquants ou vides: ${missingSecrets.join(', ')}. Ces secrets sont requis pour le fonctionnement sécurisé de l'application.`);
    }
    
    return result;
  }

  /**
   * Vérifier la force d'un secret
   * @param {string} secretName - Nom du secret à vérifier
   * @returns {Object} - Résultat de la validation avec les détails
   */
  validateSecretStrength(secretName) {
    const secret = process.env[secretName];
    
    if (!secret) {
      return {
        valid: false,
        reason: `Le secret ${secretName} n'est pas défini`
      };
    }
    
    // Vérifier la longueur minimale
    if (secret.length < this.options.minSecretLength) {
      return {
        valid: false,
        reason: `Le secret ${secretName} est trop court (minimum ${this.options.minSecretLength} caractères)`,
        details: {
          currentLength: secret.length,
          requiredLength: this.options.minSecretLength
        }
      };
    }
    
    // Vérifier l'entropie
    const hasLowercase = /[a-z]/.test(secret);
    const hasUppercase = /[A-Z]/.test(secret);
    const hasNumbers = /[0-9]/.test(secret);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(secret);
    
    const entropyFactors = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars];
    const entropyLevel = entropyFactors.filter(Boolean).length;
    
    if (entropyLevel < this.options.minEntropyLevel) {
      return {
        valid: false,
        reason: `Le secret ${secretName} a une entropie insuffisante. Utilisez un mélange de lettres minuscules, majuscules, chiffres et caractères spéciaux.`,
        details: {
          currentEntropyLevel: entropyLevel,
          requiredEntropyLevel: this.options.minEntropyLevel,
          hasLowercase,
          hasUppercase,
          hasNumbers,
          hasSpecialChars
        }
      };
    }
    
    return {
      valid: true,
      details: {
        length: secret.length,
        entropyLevel,
        hasLowercase,
        hasUppercase,
        hasNumbers,
        hasSpecialChars
      }
    };
  }

  /**
   * Vérifier la force de tous les secrets requis
   * @returns {Object} - Résultat de la validation avec les détails pour chaque secret
   */
  validateAllSecretsStrength() {
    const results = {};
    let allValid = true;
    
    for (const secret of this.requiredSecrets) {
      const result = this.validateSecretStrength(secret);
      results[secret] = result;
      
      if (!result.valid) {
        allValid = false;
        console.error(`Validation échouée pour ${secret}: ${result.reason}`);
      }
    }
    
    return {
      valid: allValid,
      results
    };
  }

  /**
   * Générer un secret fort
   * @param {number} length - Longueur du secret à générer
   * @returns {string} - Secret généré
   */
  generateStrongSecret(length = 48) {
    const crypto = require('crypto');
    return crypto.randomBytes(Math.ceil(length * 0.75)).toString('base64')
      .slice(0, length)
      .replace(/\+/g, '!')
      .replace(/\//g, '@');
  }

  /**
   * Générer des suggestions pour les secrets manquants ou faibles
   * @returns {Object} - Suggestions pour chaque secret manquant ou faible
   */
  generateSecretSuggestions() {
    const suggestions = {};
    
    // Vérifier les secrets manquants
    const { missingSecrets } = this.validateRequiredSecrets();
    
    for (const secret of missingSecrets) {
      suggestions[secret] = this.generateStrongSecret();
    }
    
    // Vérifier les secrets faibles
    for (const secret of this.requiredSecrets) {
      if (!missingSecrets.includes(secret)) {
        const result = this.validateSecretStrength(secret);
        if (!result.valid) {
          suggestions[secret] = this.generateStrongSecret();
        }
      }
    }
    
    return suggestions;
  }

  /**
   * Initialiser et valider tous les secrets
   * @param {boolean} throwOnError - Lancer une exception en cas d'erreur
   * @returns {boolean} - Succès de l'initialisation
   */
  initialize(throwOnError = true) {
    try {
      // Vérifier que tous les secrets requis sont définis
      const requiredCheck = this.validateRequiredSecrets();
      
      if (!requiredCheck.valid) {
        const error = new Error(`Secrets manquants: ${requiredCheck.missingSecrets.join(', ')}`);
        error.missingSecrets = requiredCheck.missingSecrets;
        
        if (throwOnError) {
          throw error;
        } else {
          console.error(error.message);
          return false;
        }
      }
      
      // Vérifier la force de chaque secret
      const strengthCheck = this.validateAllSecretsStrength();
      
      if (!strengthCheck.valid) {
        const weakSecrets = Object.keys(strengthCheck.results)
          .filter(key => !strengthCheck.results[key].valid);
        
        const error = new Error(`Secrets trop faibles: ${weakSecrets.join(', ')}`);
        error.weakSecrets = weakSecrets;
        error.details = strengthCheck.results;
        
        if (throwOnError) {
          throw error;
        } else {
          console.error(error.message);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      if (throwOnError) {
        throw error;
      } else {
        console.error('Erreur lors de l\'initialisation des secrets:', error.message);
        return false;
      }
    }
  }

  /**
   * Générer un rapport sur l'état des secrets
   * @returns {Object} - Rapport détaillé
   */
  generateReport() {
    const requiredCheck = this.validateRequiredSecrets();
    const strengthCheck = this.validateAllSecretsStrength();
    
    const report = {
      timestamp: new Date().toISOString(),
      allSecretsPresent: requiredCheck.valid,
      allSecretsStrong: strengthCheck.valid,
      missingSecrets: requiredCheck.missingSecrets,
      weakSecrets: Object.keys(strengthCheck.results)
        .filter(key => !strengthCheck.results[key].valid),
      details: {}
    };
    
    // Ajouter des détails pour chaque secret (sans exposer les valeurs)
    for (const secret of this.requiredSecrets) {
      report.details[secret] = {
        present: !requiredCheck.missingSecrets.includes(secret)
      };
      
      if (report.details[secret].present) {
        const strengthResult = strengthCheck.results[secret];
        report.details[secret].strong = strengthResult.valid;
        
        if (strengthResult.valid) {
          report.details[secret].entropyLevel = strengthResult.details.entropyLevel;
          report.details[secret].length = strengthResult.details.length;
        } else {
          report.details[secret].reason = strengthResult.reason;
        }
      }
    }
    
    return report;
  }
}

module.exports = SecretManager;
