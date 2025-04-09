/**
 * Types pour l'intégration Strava
 * 
 * Ce fichier définit tous les types utilisés dans l'intégration Strava,
 * y compris les modèles de données, les configurations et les réponses API.
 */

// Types pour l'authentification Strava
export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  athlete?: StravaAthlete;
}

// Types pour les modèles de données Strava
export interface StravaAthlete {
  id: number;
  username?: string;
  firstname: string;
  lastname: string;
  profile?: string; // URL de la photo de profil
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  premium?: boolean;
  summit?: boolean;
  created_at?: string;
  updated_at?: string;
  weight?: number;
  ftp?: number;
}

export interface StravaActivity {
  id: number;
  athlete: {
    id: number;
  };
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  workout_type: number | null;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  start_latitude: number | null;
  start_longitude: number | null;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  total_photo_count: number;
  map: {
    id: string;
    summary_polyline: string | null;
    polyline: string | null;
    resource_state: number;
  };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: string | null;
  average_speed: number;
  max_speed: number;
  average_watts: number | null;
  max_watts: number | null;
  weighted_average_watts: number | null;
  kilojoules: number | null;
  device_watts: boolean | null;
  has_heartrate: boolean;
  average_heartrate: number | null;
  max_heartrate: number | null;
  visibility: string;
  upload_id: number | null;
  upload_id_str: string | null;
  external_id: string | null;
  from_accepted_tag: boolean;
  has_kudoed: boolean;
  resource_state: number;
}

export interface StravaActivityDetail extends StravaActivity {
  description: string | null;
  calories: number;
  device_name: string | null;
  embed_token: string | null;
  segment_efforts: StravaSegmentEffort[];
  splits_metric: StravaSplit[];
  splits_standard: StravaSplit[];
  best_efforts: StravaBestEffort[];
  laps: StravaLap[];
  photos: {
    primary: {
      id: number | null;
      unique_id: string | null;
      urls: Record<string, string>;
    } | null;
    count: number;
  };
  gear: {
    id: string;
    primary: boolean;
    name: string;
    resource_state: number;
    distance: number;
  } | null;
  average_cadence: number | null;
  device_watts: boolean;
  suffer_score: number | null;
}

export interface StravaSegmentEffort {
  id: number;
  name: string;
  segment: StravaSegment;
  activity_id: number;
  elapsed_time: number;        // en secondes
  moving_time: number;         // en secondes
  start_date: string;          // format ISO
  start_date_local: string;    // format ISO
  distance: number;            // en mètres
  start_index: number;
  end_index: number;
  average_watts?: number;      // en watts
  average_heartrate?: number;  // en bpm
  max_heartrate?: number;      // en bpm
  average_cadence?: number;    // en rpm
  pr_rank?: number;            // classement du record personnel (1 = meilleur)
  achievements?: StravaAchievement[];
  kom_rank?: number;           // classement KOM/QOM
}

export interface StravaSegment {
  id: number;
  name: string;
  activity_type: string;
  distance: number;            // en mètres
  average_grade: number;       // en pourcentage
  maximum_grade: number;       // en pourcentage
  elevation_high: number;      // en mètres
  elevation_low: number;       // en mètres
  start_latlng: [number, number];
  end_latlng: [number, number];
  climb_category: number;      // 0-5, où 5 est plus difficile
  city?: string;
  state?: string;
  country?: string;
  private: boolean;
  hazardous: boolean;
  starred: boolean;            // favori par l'athlète
}

export interface StravaBestEffort {
  id: number;
  name: string;
  activity_id: number;
  elapsed_time: number;        // en secondes
  moving_time: number;         // en secondes
  start_date: string;          // format ISO
  start_date_local: string;    // format ISO
  distance: number;            // en mètres
  start_index: number;
  end_index: number;
  pr_rank?: number;            // classement du record personnel
}

export interface StravaAchievement {
  type_id: number;
  type: string;
  rank: number;
}

export interface StravaPhoto {
  id: number;
  unique_id: string;
  urls: {
    100: string;
    600: string;
  };
  source: number;              // 1 = Strava, 2 = Instagram
  caption?: string;
}

export interface StravaLap {
  id: number;
  activity_id: number;
  name?: string;
  lap_index: number;
  split: number;
  distance: number;            // en mètres
  moving_time: number;         // en secondes
  elapsed_time: number;        // en secondes
  start_date: string;          // format ISO
  start_date_local: string;    // format ISO
  start_index: number;
  end_index: number;
  total_elevation_gain: number;// en mètres
  average_speed: number;       // en m/s
  max_speed: number;           // en m/s
  average_cadence?: number;    // en rpm
  average_watts?: number;      // en watts
  device_watts?: boolean;
  average_heartrate?: number;  // en bpm
  max_heartrate?: number;      // en bpm
}

export interface StravaSplit {
  distance: number;
  elapsed_time: number;
  elevation_difference: number;
  moving_time: number;
  split: number;
  average_speed: number;
  average_heartrate: number | null;
  pace_zone: number;
}

export interface StravaGear {
  id: string;
  primary: boolean;
  name: string;
  nickname?: string;
  resource_state: number;
  distance: number;            // en mètres
}

export interface StravaRoute {
  id: number;
  name: string;
  description?: string;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
  };
  distance: number;            // en mètres
  elevation_gain: number;      // en mètres
  map: {
    id: string;
    summary_polyline: string;  // Polyline encodée du parcours
    polyline?: string;         // Polyline détaillée
  };
  type: number;                // 1 = route, 2 = course
  sub_type: number;            // 1 = route, 2 = MTB, 3 = CX, 4 = gravel
  private: boolean;
  starred: boolean;            // favori par l'athlète
  timestamp: number;           // UNIX timestamp de création
  segments?: StravaSegment[];
}

// Types pour les options de requête
/**
 * Options pour la récupération des activités
 */
export interface ActivityOptions {
  /** Page à récupérer (pagination) */
  page?: number;
  /** Nombre d'éléments par page */
  perPage?: number;
  /** Date de début (inclus) */
  after?: Date | number;
  /** Date de fin (inclus) */
  before?: Date | number;
  /** Type d'activité spécifique */
  type?: ActivityType;
  /** Liste de types d'activités à inclure */
  types?: ActivityType[];
}

export enum ActivityType {
  RIDE = 'Ride',
  RUN = 'Run',
  SWIM = 'Swim',
  HIKE = 'Hike',
  WALK = 'Walk',
  ALPINE_SKI = 'AlpineSki',
  BACKCOUNTRY_SKI = 'BackcountrySki',
  CANOEING = 'Canoeing',
  CROSSFIT = 'Crossfit',
  EBIKE_RIDE = 'EBikeRide',
  ELLIPTICAL = 'Elliptical',
  HANDCYCLE = 'Handcycle',
  ICE_SKATE = 'IceSkate',
  INLINE_SKATE = 'InlineSkate',
  KAYAKING = 'Kayaking',
  KITESURF = 'Kitesurf',
  NORDIC_SKI = 'NordicSki',
  ROCK_CLIMBING = 'RockClimbing',
  ROLLER_SKI = 'RollerSki',
  ROWING = 'Rowing',
  SNOWBOARD = 'Snowboard',
  SNOWSHOE = 'Snowshoe',
  STAIR_STEPPER = 'StairStepper',
  STAND_UP_PADDLING = 'StandUpPaddling',
  SURFING = 'Surfing',
  VIRTUAL_RIDE = 'VirtualRide',
  VIRTUAL_RUN = 'VirtualRun',
  WEIGHT_TRAINING = 'WeightTraining',
  WHEELCHAIR = 'Wheelchair',
  WINDSURF = 'Windsurf',
  WORKOUT = 'Workout',
  YOGA = 'Yoga'
}

// Types pour le stockage local
export interface StoredActivity {
  /** ID interne */
  id: string;
  /** ID Strava */
  stravaId: number;
  /** Nom de l'activité */
  name: string;
  /** Description */
  description: string;
  /** Type d'activité */
  type: ActivityType;
  /** Distance en mètres */
  distance: number;
  /** Temps en mouvement (secondes) */
  movingTime: number;
  /** Temps total (secondes) */
  elapsedTime: number;
  /** Dénivelé positif total (mètres) */
  totalElevationGain: number;
  /** Date et heure de début UTC */
  startDate: Date;
  /** Date et heure de début locale */
  startDateLocal: Date;
  /** Fuseau horaire */
  timezone: string;
  /** Coordonnées de départ [lat, lng] */
  startCoordinates: [number, number];
  /** Coordonnées d'arrivée [lat, lng] */
  endCoordinates: [number, number];
  /** Nombre de réalisations (KOMs, PRs) */
  achievementCount: number;
  /** Nombre de kudos reçus */
  kudosCount: number;
  /** Nombre de commentaires */
  commentCount: number;
  /** Nombre d'athlètes dans l'activité */
  athleteCount: number;
  /** Nombre de photos */
  photoCount: number;
  /** Données cartographiques */
  map: {
    id: string;
    summaryPolyline: string;
    polyline: string;
  } | null;
  /** Réalisée sur un home trainer */
  trainer: boolean;
  /** Trajet domicile-travail */
  commute: boolean;
  /** Saisie manuelle */
  manual: boolean;
  /** Activité privée */
  private: boolean;
  /** Activité signalée */
  flagged: boolean;
  /** Vitesse moyenne (m/s) */
  averageSpeed: number;
  /** Vitesse maximale (m/s) */
  maxSpeed: number;
  /** Puissance moyenne (watts) */
  averageWatts: number | null;
  /** Puissance maximale (watts) */
  maxWatts: number | null;
  /** Puissance normalisée (watts) */
  weightedAverageWatts: number | null;
  /** Énergie totale (kilojoules) */
  kilojoules: number | null;
  /** Puissance mesurée par un capteur */
  deviceWatts: boolean | null;
  /** Présence de données cardiaques */
  hasHeartrate: boolean;
  /** Fréquence cardiaque moyenne (bpm) */
  averageHeartrate: number | null;
  /** Fréquence cardiaque max (bpm) */
  maxHeartrate: number | null;
  /** Segments réalisés */
  segmentEfforts: {
    id: number;
    name: string;
    elapsedTime: number;
    distance: number;
    startDate: Date;
    averageWatts: number | null;
    segmentId: number;
  }[];
  /** Intervalles métriques */
  splitsMetric: {
    distance: number;
    elapsedTime: number;
    elevationDifference: number;
    movingTime: number;
    split: number;
    averageSpeed: number;
    averageHeartrate: number | null;
    paceZone: number;
  }[];
  /** Meilleures performances */
  bestEfforts: {
    id: number;
    name: string;
    elapsedTime: number;
    distance: number;
    startDate: Date;
  }[];
  /** Tours */
  laps: {
    id: number;
    name: string;
    elapsedTime: number;
    movingTime: number;
    distance: number;
    startDate: Date;
    averageSpeed: number;
    maxSpeed: number;
    averageWatts: number | null;
    averageHeartrate: number | null;
    maxHeartrate: number | null;
  }[];
  /** ID de l'équipement utilisé */
  gearId: string | null;
  /** Nom de l'appareil utilisé */
  deviceName: string;
  /** Token pour intégration */
  embedToken: string;
  /** Calories estimées */
  calories: number;
  /** Source de l'activité (strava, garmin, etc.) */
  source: string;
  /** Date de synchronisation */
  syncDate: Date;
  /** Données brutes JSON */
  rawData: string;
}

// Types pour les statistiques et agrégats
export interface AthleteStats {
  totalRideDistance: number;   // en mètres
  totalRunDistance: number;    // en mètres
  biggestRideDistance: number; // en mètres
  biggestClimbElevationGain: number; // en mètres
  recentRideCount: number;     // 4 semaines
  recentRunCount: number;      // 4 semaines
  ytdRideCount: number;        // year to date
  ytdRunCount: number;         // year to date
  allRideCount: number;        // all time
  allRunCount: number;         // all time
  recentRideTotalDistance: number; // en mètres, 4 semaines
  recentRunTotalDistance: number;  // en mètres, 4 semaines
  ytdRideTotalDistance: number;    // en mètres, year to date
  ytdRunTotalDistance: number;     // en mètres, year to date
  allRideTotalDistance: number;    // en mètres, all time
  allRunTotalDistance: number;     // en mètres, all time
}

// Types pour les messages d'erreur et statuts
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Résultat d'une opération de synchronisation
 */
export interface SyncResult {
  /** ID de l'utilisateur */
  userId: string;
  /** Statut de la synchronisation */
  status: SyncStatus;
  /** Nombre d'activités synchronisées avec succès */
  syncedActivitiesCount: number;
  /** Nombre total d'activités traitées */
  totalActivitiesCount: number;
  /** Nombre d'activités ayant échoué */
  failedActivitiesCount: number;
  /** Message d'erreur (si applicable) */
  error?: string;
  /** Durée de l'opération en ms */
  duration: number;
  /** Date de début de l'opération */
  startTime: Date;
  /** Date de fin de l'opération */
  endTime: Date;
  /** S'agit-il d'une synchronisation initiale */
  isInitialSync: boolean;
}

export interface StravaError {
  message: string;
  code: number;
  field?: string;
  resource?: string;
}

// Types pour la configuration
export interface StravaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  apiBaseUrl: string;
  apiVersion: string;
  webhookCallbackUrl?: string;
  webhookVerifyToken?: string;
}

export interface TokenManagerConfig {
  storageType: 'database' | 'redis' | 'memory';
  refreshBuffer: number;       // en secondes, marge avant expiration
  redisUrl?: string;
  dbCollection?: string;
}

/**
 * Configuration pour la synchronisation Strava
 */
export interface SyncConfig {
  /** Nombre de jours à synchroniser lors de la première synchronisation */
  initialSyncDays: number;
  /** Activer la synchronisation automatique */
  autoSyncEnabled: boolean;
  /** Intervalle de synchronisation automatique en minutes */
  autoSyncInterval: number;
  /** Forcer une resynchronisation complète après X jours */
  forceResyncAfterDays: number;
  /** Nombre maximum d'activités à synchroniser par opération */
  maxActivitiesPerSync: number;
}
