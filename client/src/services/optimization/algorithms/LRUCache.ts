/**
 * Structure de données pour un nœud dans la liste doublement chaînée
 */
class DoublyLinkedNode<T> {
  key: string;
  value: T;
  expiry: number;
  prev: DoublyLinkedNode<T> | null = null;
  next: DoublyLinkedNode<T> | null = null;

  constructor(key: string, value: T, expiry: number = Infinity) {
    this.key = key;
    this.value = value;
    this.expiry = expiry;
  }
}

/**
 * Implémentation d'un cache Least Recently Used (LRU)
 * Cette classe utilise une combinaison d'une Map et d'une liste doublement chaînée
 * pour fournir des opérations O(1) pour l'accès, l'insertion et la suppression
 */
export class LRUCache<T = any> {
  private capacity: number;
  private size: number = 0;
  private cache: Map<string, DoublyLinkedNode<T>>;
  private head: DoublyLinkedNode<T> | null = null; // Le plus récemment utilisé
  private tail: DoublyLinkedNode<T> | null = null; // Le moins récemment utilisé
  
  // Métriques de performance
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;
  private expirations: number = 0;

  /**
   * Crée un nouveau cache LRU avec la capacité spécifiée
   * @param capacity Taille maximale du cache en octets
   */
  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Récupère une valeur du cache s'elle existe et n'est pas expirée
   * @param key Clé à rechercher
   * @returns La valeur associée à la clé ou undefined si non trouvée
   */
  get(key: string): T | undefined {
    const now = Date.now();
    const node = this.cache.get(key);
    
    if (!node) {
      this.misses++;
      return undefined;
    }
    
    // Vérifier si la valeur est expirée
    if (node.expiry !== Infinity && node.expiry < now) {
      this.delete(key);
      this.expirations++;
      this.misses++;
      return undefined;
    }
    
    // Déplacer le nœud en tête de la liste (le plus récemment utilisé)
    this.moveToHead(node);
    this.hits++;
    
    return node.value;
  }

  /**
   * Ajoute ou met à jour une entrée dans le cache
   * @param key Clé à utiliser
   * @param value Valeur à stocker
   * @param expiry Timestamp d'expiration (optionnel)
   */
  set(key: string, value: T, expiry: number = Infinity): void {
    // Vérifier si la clé existe déjà
    const existingNode = this.cache.get(key);
    
    if (existingNode) {
      // Mettre à jour la valeur et l'expiration
      existingNode.value = value;
      existingNode.expiry = expiry;
      
      // Déplacer en tête de liste
      this.moveToHead(existingNode);
      return;
    }
    
    // Créer un nouveau nœud
    const newNode = new DoublyLinkedNode(key, value, expiry);
    
    // Ajouter à la Map
    this.cache.set(key, newNode);
    
    // Ajouter en tête de liste
    this.addToHead(newNode);
    
    // Incrémenter la taille
    this.size++;
    
    // Si la capacité est dépassée, supprimer le moins récemment utilisé
    if (this.size > this.capacity) {
      this.removeLRU();
    }
  }

  /**
   * Supprime une entrée du cache
   * @param key Clé à supprimer
   * @returns true si supprimé, false sinon
   */
  delete(key: string): boolean {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }
    
    // Supprimer de la liste
    this.removeFromList(node);
    
    // Supprimer de la Map
    this.cache.delete(key);
    
    // Décrémenter la taille
    this.size--;
    
    return true;
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  /**
   * Supprime toutes les entrées d'un namespace spécifique
   * @param namespace Préfixe de namespace
   */
  clearNamespace(namespace: string): void {
    // Identifier les clés à supprimer
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(namespace)) {
        keysToDelete.push(key);
      }
    }
    
    // Supprimer les clés
    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  /**
   * Nettoie les entrées expirées du cache
   * @param now Timestamp actuel (optionnel)
   */
  cleanExpired(now: number = Date.now()): number {
    let cleaned = 0;
    
    // Identifier les clés expirées
    const expiredKeys: string[] = [];
    
    for (const [key, node] of this.cache.entries()) {
      if (node.expiry !== Infinity && node.expiry < now) {
        expiredKeys.push(key);
      }
    }
    
    // Supprimer les clés expirées
    for (const key of expiredKeys) {
      this.delete(key);
      cleaned++;
    }
    
    this.expirations += cleaned;
    
    return cleaned;
  }

  /**
   * Réduit la taille du cache à la capacité cible en supprimant les éléments les moins récemment utilisés
   * @param targetCapacity Capacité cible (par défaut: 70% de la capacité maximale)
   */
  prune(targetCapacity: number = this.capacity * 0.7): number {
    let pruned = 0;
    
    while (this.size > targetCapacity && this.tail) {
      // Supprimer le moins récemment utilisé
      this.delete(this.tail.key);
      pruned++;
    }
    
    this.evictions += pruned;
    
    return pruned;
  }

  /**
   * Récupère toutes les clés du cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Récupère le nombre d'entrées dans le cache
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Récupère la capacité maximale du cache
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Définit une nouvelle capacité maximale
   * @param newCapacity Nouvelle capacité maximale
   */
  setCapacity(newCapacity: number): void {
    this.capacity = newCapacity;
    
    // Si la nouvelle capacité est inférieure à la taille actuelle, éliminer les entrées les moins récemment utilisées
    if (this.size > this.capacity) {
      this.prune(this.capacity);
    }
  }

  /**
   * Récupère les statistiques du cache
   */
  getStats(): { size: number; capacity: number; hits: number; misses: number; evictions: number; expirations: number } {
    return {
      size: this.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      expirations: this.expirations
    };
  }

  /**
   * Récupère le nombre de hits du cache
   */
  getHits(): number {
    return this.hits;
  }

  /**
   * Récupère le nombre de misses du cache
   */
  getMisses(): number {
    return this.misses;
  }

  /**
   * Récupère le taux de succès du cache (hits / (hits + misses))
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  /**
   * Déplace un nœud en tête de liste (le plus récemment utilisé)
   * @param node Nœud à déplacer
   */
  private moveToHead(node: DoublyLinkedNode<T>): void {
    // Si c'est déjà en tête, rien à faire
    if (node === this.head) {
      return;
    }
    
    // Retirer de sa position actuelle
    this.removeFromList(node);
    
    // Ajouter en tête
    this.addToHead(node);
  }

  /**
   * Ajoute un nœud en tête de liste
   * @param node Nœud à ajouter
   */
  private addToHead(node: DoublyLinkedNode<T>): void {
    // Si la liste est vide
    if (!this.head) {
      this.head = node;
      this.tail = node;
      node.prev = null;
      node.next = null;
      return;
    }
    
    // Sinon, ajouter en tête
    node.next = this.head;
    node.prev = null;
    this.head.prev = node;
    this.head = node;
  }

  /**
   * Retire un nœud de la liste
   * @param node Nœud à retirer
   */
  private removeFromList(node: DoublyLinkedNode<T>): void {
    // Si ce n'est pas dans la liste, rien à faire
    if (!this.head || !this.tail) {
      return;
    }
    
    // Si c'est la tête
    if (node === this.head) {
      this.head = node.next;
      if (this.head) {
        this.head.prev = null;
      }
      
      // Si c'était le seul élément
      if (node === this.tail) {
        this.tail = null;
      }
      
      return;
    }
    
    // Si c'est la queue
    if (node === this.tail) {
      this.tail = node.prev;
      if (this.tail) {
        this.tail.next = null;
      }
      return;
    }
    
    // Sinon, c'est au milieu
    if (node.prev) {
      node.prev.next = node.next;
    }
    
    if (node.next) {
      node.next.prev = node.prev;
    }
  }

  /**
   * Supprime le nœud le moins récemment utilisé (LRU)
   */
  private removeLRU(): void {
    if (!this.tail) {
      return;
    }
    
    const key = this.tail.key;
    this.delete(key);
    this.evictions++;
  }
}
