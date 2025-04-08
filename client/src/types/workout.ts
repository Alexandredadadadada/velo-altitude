/**
 * Types et interfaces pour le module d'entraînement
 * 
 * Ce fichier centralise toutes les définitions de types pour les composants
 * et fonctions liés aux entraînements, assurant une cohérence dans l'application.
 * 
 * @module Training
 * @preferred
 */

/**
 * Types d'onglets disponibles pour la vue détaillée de l'entraînement
 * Cette énumération définit les différentes sections accessibles dans la vue détaillée
 * 
 * @typedef {'details' | 'metrics' | 'equipment' | 'instructor' | 'comments'} WorkoutTabType
 */
export type WorkoutTabType = 'details' | 'metrics' | 'equipment' | 'instructor' | 'comments';

/**
 * Interface pour une section d'entraînement
 * Représente une partie spécifique de l'entraînement (échauffement, effort, récupération, etc.)
 * 
 * @interface WorkoutSection
 */
export interface WorkoutSection {
  /** Titre de la section */
  title: string;
  /** Durée en minutes */
  duration: number;
  /** Description détaillée */
  description: string;
  /** Objectifs physiologiques ou techniques de la section */
  targets: string[];
}

/**
 * Interface pour les métriques d'entraînement
 * Contient toutes les données de performance mesurées pendant l'entraînement
 * Compatible avec les intégrations Strava et les capteurs connectés
 * 
 * @interface WorkoutMetrics
 */
export interface WorkoutMetrics {
  /** Puissance moyenne en watts */
  avgPower?: number;
  /** Puissance maximale en watts */
  maxPower?: number;
  /** Fréquence cardiaque moyenne en BPM */
  avgHeartRate?: number;
  /** Fréquence cardiaque maximale en BPM */
  maxHeartRate?: number;
  /** Cadence moyenne en RPM */
  avgCadence?: number;
  /** Cadence maximale en RPM */
  maxCadence?: number;
  /** Vitesse moyenne en km/h */
  avgSpeed?: number;
  /** Vitesse maximale en km/h */
  maxSpeed?: number;
  /** Calories brûlées */
  calories?: number;
  /** Niveau d'intensité (1-10) */
  intensity?: number;
  /** Score de récupération nécessaire (1-10) */
  recoveryScore?: number;
  /** Score d'effort (1-100) - basé sur la méthodologie TSS (Training Stress Score) */
  effortScore?: number;
  /** Données temporelles pour les visualisations graphiques */
  timeSeriesData?: {
    /** Données de puissance par intervalle temporel */
    power?: Array<{time: number, value: number}>;
    /** Données de fréquence cardiaque par intervalle temporel */
    heartRate?: Array<{time: number, value: number}>;
    /** Données de cadence par intervalle temporel */
    cadence?: Array<{time: number, value: number}>;
    /** Données de vitesse par intervalle temporel */
    speed?: Array<{time: number, value: number}>;
  };
}

/**
 * Interface pour un équipement
 * Représente un équipement nécessaire ou recommandé pour l'entraînement
 * 
 * @interface Equipment
 */
export interface Equipment {
  /** ID unique de l'équipement */
  id: string;
  /** Nom de l'équipement */
  name: string;
  /** Description détaillée */
  description: string;
  /** Type d'équipement (vélo, capteur, vêtement, etc.) */
  type: string;
  /** Si l'équipement est optionnel ou obligatoire */
  optional: boolean;
  /** Niveau de recommandation (1-5) */
  recommendationLevel?: number;
  /** URL de l'image de l'équipement */
  imageUrl?: string;
}

/**
 * Interface pour un instructeur
 * Contient les informations sur l'instructeur responsable de l'entraînement
 * Intègre les données de profil utilisateur et synchronisation avec les services d'authentification
 * 
 * @interface Instructor
 */
export interface Instructor {
  /** ID unique de l'instructeur */
  id: string;
  /** Nom complet de l'instructeur */
  name: string;
  /** Titre ou spécialité */
  title: string;
  /** Biographie courte */
  bio: string;
  /** URL de l'image de profil */
  profileImage?: string;
  /** Adresse email (masquée pour les utilisateurs non-admin) */
  email?: string;
  /** Site web personnel */
  website?: string;
  /** Années d'expérience */
  yearsOfExperience?: number;
  /** Certifications obtenues */
  certifications?: string[];
  /** Localisation */
  location?: string;
  /** Domaines de spécialité */
  specialties?: string[];
  /** Statistiques personnelles */
  stats?: {
    /** Nombre d'entraînements publiés */
    workouts?: number;
    /** Nombre d'athlètes encadrés */
    athletes?: number;
    /** Note moyenne (sur 5) - calculée à partir des avis utilisateurs */
    rating?: number;
  };
}

/**
 * Interface pour un commentaire
 * Représente un commentaire laissé par un utilisateur sur un entraînement
 * Intègre les fonctionnalités de gestion des utilisateurs, modération et engagement
 * 
 * @interface Comment
 */
export interface Comment {
  /** ID unique du commentaire */
  id: string;
  /** ID de l'utilisateur auteur */
  userId: string;
  /** Nom de l'utilisateur */
  userName: string;
  /** URL de l'image de profil */
  userAvatar?: string;
  /** Contenu du commentaire */
  content: string;
  /** Date de création */
  createdAt: Date | string;
  /** Nombre de "J'aime" */
  likes: number;
  /** Si l'utilisateur actuel a aimé ce commentaire */
  isLiked?: boolean;
  /** Si le commentaire est de l'utilisateur actuel */
  isOwn?: boolean;
  /** Réponses au commentaire */
  replies?: Comment[];
}

/**
 * Interface pour un entraînement complet
 * Représente toutes les données d'un entraînement dans l'application
 * Intègre des fonctionnalités avancées comme les métriques de performance et la personnalisation
 * 
 * @interface Workout
 */
export interface Workout {
  /** ID unique de l'entraînement */
  id: string;
  /** Titre principal */
  title: string;
  /** Sous-titre ou description courte */
  subtitle: string;
  /** Type d'entraînement (Intervalle, Endurance, etc.) */
  type: string;
  /** Niveau de difficulté */
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Durée totale en minutes */
  duration: number;
  /** Distance estimée en km */
  distance?: number;
  /** Dénivelé en mètres */
  elevation?: number;
  /** Calories estimées */
  calories?: number;
  /** Description détaillée */
  description: string;
  /** URL de l'image principale */
  imageUrl: string;
  /** URL de la miniature */
  thumbnailUrl: string;
  /** Si l'entraînement est en vedette */
  featured: boolean;
  /** Si l'entraînement est premium (réservé aux abonnés) */
  premium: boolean;
  /** Date de création */
  createdAt: string;
  /** Date de dernière mise à jour */
  updatedAt: string;
  /** Bénéfices/objectifs de l'entraînement */
  benefits: string[];
  /** Tags pour le filtrage et la recherche */
  tags: string[];
  /** Sections/étapes de l'entraînement */
  sections: WorkoutSection[];
  /** Conseils supplémentaires */
  tips?: string[];
  /** Métriques de performance */
  metrics: WorkoutMetrics;
  /** Équipement nécessaire */
  equipment: Equipment[];
  /** Instructeur de l'entraînement */
  instructor: Instructor;
  /** Commentaires des utilisateurs */
  comments: Comment[];
}

/**
 * Interface pour les propriétés du composant WorkoutDetailView
 * Définit les props acceptées par le composant principal de vue détaillée d'un entraînement
 * 
 * @interface WorkoutDetailViewProps
 */
export interface WorkoutDetailViewProps {
  /** ID de l'entraînement à afficher (optionnel, si non fourni utilise le paramètre d'URL) */
  workoutId?: string;
}

/**
 * Interface pour les propriétés du composant WorkoutHeader
 * Définit les props pour l'en-tête de la vue détaillée d'un entraînement
 * 
 * @interface WorkoutHeaderProps
 */
export interface WorkoutHeaderProps {
  /** Données de l'entraînement */
  workout: Workout;
}

/**
 * Interface pour les propriétés du composant WorkoutTabs
 * Définit les props pour la navigation par onglets de la vue détaillée
 * 
 * @interface WorkoutTabsProps
 */
export interface WorkoutTabsProps {
  /** Onglet actuellement actif */
  activeTab: WorkoutTabType;
  /** Fonction de rappel appelée lors du changement d'onglet */
  onTabChange: (tab: WorkoutTabType) => void;
}

/**
 * Interface pour les propriétés du composant WorkoutDetailsTab
 * Définit les props pour l'onglet de détails de l'entraînement
 * 
 * @interface WorkoutDetailsTabProps
 */
export interface WorkoutDetailsTabProps {
  /** Données de l'entraînement */
  workout: Workout;
}

/**
 * Interface pour les propriétés du composant WorkoutMetricsTab
 * Définit les props pour l'onglet de métriques de l'entraînement
 * 
 * @interface WorkoutMetricsTabProps
 */
export interface WorkoutMetricsTabProps {
  /** Données des métriques de l'entraînement */
  metrics: WorkoutMetrics;
}

/**
 * Interface pour les propriétés du composant WorkoutEquipmentTab
 * Définit les props pour l'onglet d'équipement de l'entraînement
 * 
 * @interface WorkoutEquipmentTabProps
 */
export interface WorkoutEquipmentTabProps {
  /** Liste des équipements nécessaires ou recommandés pour l'entraînement */
  equipment: Equipment[];
}

/**
 * Interface pour les propriétés du composant WorkoutInstructorTab
 * Définit les props pour l'onglet d'instructeur de l'entraînement
 * 
 * @interface WorkoutInstructorTabProps
 */
export interface WorkoutInstructorTabProps {
  /** Données de l'instructeur de l'entraînement */
  instructor: Instructor;
}

/**
 * Interface pour les propriétés du composant WorkoutCommentsTab
 * Définit les props pour l'onglet de commentaires de l'entraînement
 * Intègre les fonctionnalités d'authentification JWT et de gestion des commentaires
 * 
 * @interface WorkoutCommentsTabProps
 */
export interface WorkoutCommentsTabProps {
  /** Liste des commentaires de l'entraînement */
  comments: Comment[];
  /** ID de l'entraînement */
  workoutId: string;
  /** Fonction pour ajouter un commentaire */
  onAddComment?: (content: string, workoutId: string) => Promise<void>;
  /** Fonction pour supprimer un commentaire */
  onDeleteComment?: (commentId: string) => Promise<void>;
  /** Fonction pour modifier un commentaire */
  onEditComment?: (commentId: string, content: string) => Promise<void>;
  /** Fonction pour aimer un commentaire */
  onLikeComment?: (commentId: string) => Promise<void>;
  /** Fonction pour signaler un commentaire */
  onReportComment?: (commentId: string, reason: string) => Promise<void>;
  /** Fonction pour répondre à un commentaire */
  onReplyComment?: (commentId: string, content: string) => Promise<void>;
  /** Si les commentaires sont en cours de chargement */
  isLoading?: boolean;
}
