// Utilitaire pour coalescer les requêtes identiques en vol
// Usage : coalescer.coalesce(key, () => fetchFn())
class RequestCoalescer {
  constructor() {
    this.pending = new Map();
  }

  async coalesce(key, fetchFn) {
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }
    const promise = fetchFn();
    this.pending.set(key, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(key);
    }
  }
}

module.exports = new RequestCoalescer();
