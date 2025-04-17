// Utilitaire de batching pour regrouper plusieurs requêtes similaires
// Usage : batcher.batch(key, () => fetchFn())
class RequestBatcher {
  constructor() {
    this.batches = new Map();
  }

  async batch(key, fetchFn) {
    if (!this.batches.has(key)) {
      this.batches.set(key, []);
      // Lancer la récupération dans la prochaine tick pour accumuler les requêtes
      setTimeout(async () => {
        const resolvers = this.batches.get(key);
        try {
          const result = await fetchFn();
          resolvers.forEach(({resolve}) => resolve(result));
        } catch (err) {
          resolvers.forEach(({reject}) => reject(err));
        }
        this.batches.delete(key);
      }, 0);
    }
    return new Promise((resolve, reject) => {
      this.batches.get(key).push({resolve, reject});
    });
  }
}

module.exports = new RequestBatcher();
