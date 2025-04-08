/**
 * Service de compression pour optimiser le stockage des données
 * Utilise les APIs Web modernes pour la compression/décompression
 */
export class CompressionService {
  private encoder: TextEncoder;
  private decoder: TextDecoder;
  private compressionSupported: boolean;

  /**
   * Crée une nouvelle instance du service de compression
   */
  constructor() {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
    this.compressionSupported = typeof CompressionStream !== 'undefined';
  }

  /**
   * Compresse une donnée
   * @param data Donnée à compresser (objet, tableau, chaîne, etc.)
   * @returns Donnée compressée
   */
  public async compress(data: any): Promise<any> {
    try {
      // Si l'API CompressionStream n'est pas supportée, retourner les données non compressées
      if (!this.compressionSupported) {
        console.warn('[CompressionService] Compression not supported by this browser.');
        return data;
      }

      // Convertir en chaîne JSON
      const jsonString = JSON.stringify(data);
      
      // Convertir en Uint8Array
      const uint8Array = this.encoder.encode(jsonString);
      
      // Créer un readable stream à partir du Uint8Array
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(uint8Array);
          controller.close();
        }
      });
      
      // Compresser en utilisant CompressionStream
      const compressedStream = readableStream.pipeThrough(new CompressionStream('gzip'));
      
      // Récupérer les données compressées
      const compressedData = await this.streamToArrayBuffer(compressedStream);
      
      // Convertir en Base64 pour le stockage (plus efficace que JSON.stringify sur des données binaires)
      const base64String = this.arrayBufferToBase64(compressedData);
      
      // Marquer comme compressé
      return {
        __compressed: true,
        format: 'gzip',
        encoding: 'base64',
        data: base64String
      };
    } catch (error) {
      console.error('[CompressionService] Compression error:', error);
      
      // En cas d'erreur, retourner les données non compressées
      return data;
    }
  }

  /**
   * Décompresse une donnée
   * @param compressedData Donnée compressée
   * @returns Donnée décompressée
   */
  public async decompress(compressedData: any): Promise<any> {
    try {
      // Vérifier si les données sont compressées
      if (!compressedData || !compressedData.__compressed) {
        return compressedData;
      }
      
      // Vérifier le format
      if (compressedData.format !== 'gzip' || compressedData.encoding !== 'base64') {
        throw new Error(`Unsupported compression format: ${compressedData.format}`);
      }
      
      // Si l'API DecompressionStream n'est pas supportée, lever une erreur
      if (!this.compressionSupported) {
        throw new Error('Decompression not supported by this browser.');
      }
      
      // Convertir la chaîne Base64 en ArrayBuffer
      const arrayBuffer = this.base64ToArrayBuffer(compressedData.data);
      
      // Créer un readable stream à partir de l'ArrayBuffer
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(arrayBuffer));
          controller.close();
        }
      });
      
      // Décompresser en utilisant DecompressionStream
      const decompressedStream = readableStream.pipeThrough(new DecompressionStream('gzip'));
      
      // Récupérer les données décompressées
      const decompressedData = await this.streamToArrayBuffer(decompressedStream);
      
      // Convertir en chaîne JSON
      const jsonString = this.decoder.decode(new Uint8Array(decompressedData));
      
      // Parser en objet JavaScript
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[CompressionService] Decompression error:', error);
      
      // En cas d'erreur, retourner les données telles quelles
      // C'est mieux que de retourner null, car les données pourraient être partiellement utilisables
      return compressedData;
    }
  }

  /**
   * Vérifie si la compression est supportée par le navigateur
   */
  public isCompressionSupported(): boolean {
    return this.compressionSupported;
  }

  /**
   * Calcule le ratio de compression (taille originale / taille compressée)
   * @param original Données originales
   * @param compressed Données compressées
   */
  public calculateCompressionRatio(original: any, compressed: any): number {
    // Conversion en chaîne JSON pour mesurer la taille
    const originalString = JSON.stringify(original);
    const compressedString = JSON.stringify(compressed);
    
    // Calcul du ratio
    return originalString.length / compressedString.length;
  }

  /**
   * Convertit un stream en ArrayBuffer
   * @param stream Stream à convertir
   */
  private async streamToArrayBuffer(stream: ReadableStream): Promise<ArrayBuffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    
    // Lire toutes les chunks du stream
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      chunks.push(value);
    }
    
    // Calculer la taille totale
    let totalLength = 0;
    for (const chunk of chunks) {
      totalLength += chunk.length;
    }
    
    // Créer un Uint8Array de la taille totale
    const result = new Uint8Array(totalLength);
    
    // Copier toutes les chunks dans le résultat
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result.buffer;
  }

  /**
   * Convertit un ArrayBuffer en chaîne Base64
   * @param buffer ArrayBuffer à convertir
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  /**
   * Convertit une chaîne Base64 en ArrayBuffer
   * @param base64 Chaîne Base64 à convertir
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }

  /**
   * Implémentation de LZ-string pour browsers plus anciens qui ne supportent pas CompressionStream
   * @param input Chaîne à compresser
   */
  private compressLZString(input: string): string {
    // Implémentation simplifiée de LZ-based compression
    // Dans une version réelle, on utiliserait une bibliothèque comme lz-string
    // ou pako si CompressionStream n'est pas disponible
    
    // Cette implémentation est un placeholder
    // En production, il faudrait intégrer une vraie bibliothèque de compression
    return input;
  }

  /**
   * Implémentation de décompression LZ-string pour browsers plus anciens
   * @param compressed Chaîne compressée
   */
  private decompressLZString(compressed: string): string {
    // Décompression LZ simplifiée (placeholder)
    return compressed;
  }
}
