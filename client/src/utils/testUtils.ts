/**
 * Fonctions utilitaires pour les tests
 * Ces fonctions serviront d'exemple pour valider notre configuration TypeScript/Jest
 */

/**
 * Formate un nombre avec des séparateurs de milliers
 * @param value - Nombre à formater
 * @param locale - Locale à utiliser pour le formatage (par défaut: 'fr-FR')
 * @returns Chaîne formatée
 */
export function formatNumber(value: number, locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Vérifie si un objet est vide
 * @param obj - Objet à vérifier
 * @returns true si l'objet est vide, false sinon
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return obj && Object.keys(obj).length === 0;
}

/**
 * Tronque une chaîne à une longueur maximale
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale
 * @param suffix - Suffixe à ajouter en cas de troncature (par défaut: '...')
 * @returns Chaîne tronquée
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + suffix;
}

/**
 * Filtre un tableau d'objets selon une propriété et une valeur
 * @param array - Tableau d'objets à filtrer
 * @param property - Propriété à vérifier
 * @param value - Valeur recherchée
 * @returns Tableau filtré
 */
export function filterArrayByProperty<T>(
  array: T[], 
  property: keyof T, 
  value: any
): T[] {
  return array.filter(item => item[property] === value);
}
