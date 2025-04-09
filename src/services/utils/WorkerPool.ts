/**
 * Classe utilitaire pour l'exécution de tâches en parallèle
 * avec une limite de concurrence et file d'attente
 */
export class WorkerPool {
  private concurrency: number;
  private running: number;
  private queue: (() => Promise<void>)[];
  private completeResolve: (() => void) | null;

  /**
   * Crée un nouveau pool de workers
   * @param concurrency Nombre maximum de tâches en parallèle
   */
  constructor(concurrency: number = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
    this.completeResolve = null;
  }

  /**
   * Ajoute une tâche au pool
   * @param task Fonction asynchrone à exécuter
   */
  add(task: () => Promise<void>): void {
    if (this.running < this.concurrency) {
      this.executeTask(task);
    } else {
      this.queue.push(task);
    }
  }

  /**
   * Ajoute plusieurs tâches au pool
   * @param tasks Tableau de fonctions asynchrones à exécuter
   */
  addAll(tasks: (() => Promise<void>)[]): void {
    tasks.forEach(task => this.add(task));
  }

  /**
   * Attend que toutes les tâches soient terminées
   */
  async complete(): Promise<void> {
    if (this.running === 0 && this.queue.length === 0) {
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      this.completeResolve = resolve;
    });
  }

  /**
   * Exécute une tâche et gère la file d'attente
   * @param task Fonction asynchrone à exécuter
   */
  private async executeTask(task: () => Promise<void>): Promise<void> {
    this.running++;

    try {
      await task();
    } catch (error) {
      console.error('Erreur dans la tâche du pool :', error);
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  /**
   * Traite la file d'attente et vérifie si toutes les tâches sont terminées
   */
  private processQueue(): void {
    if (this.queue.length > 0) {
      const nextTask = this.queue.shift();
      if (nextTask) {
        this.executeTask(nextTask);
      }
    } else if (this.running === 0 && this.completeResolve) {
      this.completeResolve();
      this.completeResolve = null;
    }
  }
}
