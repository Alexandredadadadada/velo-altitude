/**
 * Service pour la génération de PDF
 * Utilise jsPDF pour la génération de documents PDF
 */

import { ColData } from '../types';

/**
 * Service pour la génération de PDF
 */
class PDFService {
  /**
   * Génère un PDF pour un col
   * @param colData Données du col
   */
  async generateColPDF(colData: ColData): Promise<void> {
    try {
      // Importer dynamiquement jsPDF pour réduire la taille du bundle initial
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Titre
      doc.setFontSize(22);
      doc.text(`Col: ${colData.name}`, 20, 20);
      
      // Ligne de séparation
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 25, 190, 25);
      
      // Informations principales
      doc.setFontSize(12);
      doc.text('Informations générales', 20, 35);
      
      doc.setFontSize(10);
      doc.text(`Altitude: ${colData.altitude} m`, 25, 45);
      doc.text(`Longueur: ${colData.length} km`, 25, 52);
      doc.text(`Dénivelé moyen: ${colData.gradient}%`, 25, 59);
      doc.text(`Difficulté: ${this.getDifficultyLabel(colData.difficulty)}`, 25, 66);
      doc.text(`Région: ${colData.region}`, 25, 73);
      doc.text(`Pays: ${colData.country}`, 25, 80);
      doc.text(`Coordonnées: ${colData.coordinates.lat}, ${colData.coordinates.lng}`, 25, 87);
      
      // Date de génération
      const today = new Date();
      const formattedDate = today.toLocaleDateString('fr-FR');
      doc.setFontSize(8);
      doc.text(`Document généré le ${formattedDate} via Velo-Altitude`, 20, 280);
      
      // Télécharger le PDF
      doc.save(`col-${colData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      
      console.log(`[PDFService] PDF generated for col ${colData.name}`);
    } catch (error) {
      console.error('[PDFService] Error generating PDF:', error);
      throw error;
    }
  }
  
  /**
   * Obtient le libellé de difficulté à partir de la valeur numérique
   * @param difficulty Valeur numérique de difficulté
   * @returns Libellé de difficulté
   */
  private getDifficultyLabel(difficulty: number): string {
    switch (difficulty) {
      case 1: return 'Facile';
      case 2: return 'Modéré';
      case 3: return 'Difficile';
      case 4: return 'Très difficile';
      case 5: return 'Extrême';
      default: return `Niveau ${difficulty}`;
    }
  }
}

// Créer une instance et l'exporter
const pdfService = new PDFService();
export default pdfService;
