import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiActivity, FiHeart, FiZap } from 'react-icons/fi';
import { WorkoutMetricsTabProps } from '../../../types/workout';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import './WorkoutMetricsTab.css';

/**
 * @module Training/Workout
 * @component WorkoutMetricsTab
 * 
 * Affiche les métriques détaillées d'un entraînement avec des graphiques et des résumés
 * Intègre des visualisations pour puissance, fréquence cardiaque, cadence et vitesse
 * Compatible avec l'intégration Strava et le monitoring des performances
 * 
 * @example
 * ```tsx
 * <WorkoutMetricsTab metrics={workoutData.metrics} />
 * ```
 */
const WorkoutMetricsTab: React.FC<WorkoutMetricsTabProps> = ({ metrics }) => {
  // Animation variants (mémorisé pour éviter re-création à chaque rendu)
  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6
      }
    })
  }), []);

  return (
    <div 
      className="workout-metrics-tab"
      role="tabpanel"
      id="metrics-panel"
      aria-labelledby="metrics-tab"
    >
      <div className="metrics-section">
        <h2 id="performance-summary-heading">Résumé des performances</h2>
        
        <div 
          className="metrics-overview"
          aria-labelledby="performance-summary-heading"
        >
          <motion.div 
            className="metric-card power focus-visible-ring"
            custom={0} 
            initial="hidden" 
            animate="visible" 
            variants={cardVariants}
            tabIndex={0}
            aria-label={`Puissance moyenne: ${metrics.avgPower || 0} watts, maximale: ${metrics.maxPower || 0} watts`}
          >
            <div className="metric-icon">
              <FiZap aria-hidden="true" />
            </div>
            <div className="metric-values">
              <div className="metric-main-value">
                <span className="value">{metrics.avgPower || 0}</span>
                <span className="unit">W</span>
              </div>
              <div className="metric-secondary-value">
                Max: {metrics.maxPower || 0}W
              </div>
            </div>
            <div className="metric-label">Puissance</div>
          </motion.div>
          
          <motion.div 
            className="metric-card heart-rate focus-visible-ring"
            custom={1} 
            initial="hidden" 
            animate="visible" 
            variants={cardVariants}
            tabIndex={0}
            aria-label={`Fréquence cardiaque moyenne: ${metrics.avgHeartRate || 0} battements par minute, maximale: ${metrics.maxHeartRate || 0} battements par minute`}
          >
            <div className="metric-icon">
              <FiHeart aria-hidden="true" />
            </div>
            <div className="metric-values">
              <div className="metric-main-value">
                <span className="value">{metrics.avgHeartRate || 0}</span>
                <span className="unit">bpm</span>
              </div>
              <div className="metric-secondary-value">
                Max: {metrics.maxHeartRate || 0} bpm
              </div>
            </div>
            <div className="metric-label">Fréquence cardiaque</div>
          </motion.div>
          
          <motion.div 
            className="metric-card cadence focus-visible-ring"
            custom={2} 
            initial="hidden" 
            animate="visible" 
            variants={cardVariants}
            tabIndex={0}
            aria-label={`Cadence moyenne: ${metrics.avgCadence || 0} tours par minute, maximale: ${metrics.maxCadence || 0} tours par minute`}
          >
            <div className="metric-icon">
              <FiActivity aria-hidden="true" />
            </div>
            <div className="metric-values">
              <div className="metric-main-value">
                <span className="value">{metrics.avgCadence || 0}</span>
                <span className="unit">rpm</span>
              </div>
              <div className="metric-secondary-value">
                Max: {metrics.maxCadence || 0} rpm
              </div>
            </div>
            <div className="metric-label">Cadence</div>
          </motion.div>
          
          <motion.div 
            className="metric-card speed focus-visible-ring"
            custom={3} 
            initial="hidden" 
            animate="visible" 
            variants={cardVariants}
            tabIndex={0}
            aria-label={`Vitesse moyenne: ${metrics.avgSpeed || 0} kilomètres par heure, maximale: ${metrics.maxSpeed || 0} kilomètres par heure`}
          >
            <div className="metric-icon">
              <FiTrendingUp aria-hidden="true" />
            </div>
            <div className="metric-values">
              <div className="metric-main-value">
                <span className="value">{metrics.avgSpeed || 0}</span>
                <span className="unit">km/h</span>
              </div>
              <div className="metric-secondary-value">
                Max: {metrics.maxSpeed || 0} km/h
              </div>
            </div>
            <div className="metric-label">Vitesse</div>
          </motion.div>
        </div>
      </div>
      
      <div className="metrics-charts-section">
        <h2 id="performance-charts-heading">Graphiques de performance</h2>
        
        <div 
          className="metrics-charts"
          aria-labelledby="performance-charts-heading"
        >
          <motion.div 
            className="chart-card power-chart focus-visible-ring"
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            tabIndex={0}
          >
            <h3>Puissance (W)</h3>
            <div className="chart-container">
              {metrics.timeSeriesData?.power ? (
                // Ici, nous afficherions un composant de graphique
                // Par exemple: <PowerChart data={metrics.timeSeriesData.power} />
                <div className="chart-placeholder" aria-label="Graphique de puissance - données disponibles">
                  Graphique de puissance - Intégration avec l'API de monitoring des performances
                </div>
              ) : (
                <div className="chart-placeholder" aria-label="Aucune donnée de puissance disponible">
                  Aucune donnée de puissance disponible
                </div>
              )}
            </div>
          </motion.div>
          
          <motion.div 
            className="chart-card heart-rate-chart focus-visible-ring"
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            tabIndex={0}
          >
            <h3>Fréquence cardiaque (bpm)</h3>
            <div className="chart-container">
              {metrics.timeSeriesData?.heartRate ? (
                <div className="chart-placeholder" aria-label="Graphique de fréquence cardiaque - données disponibles">
                  Graphique de fréquence cardiaque - Intégration avec l'API de monitoring
                </div>
              ) : (
                <div className="chart-placeholder" aria-label="Aucune donnée de fréquence cardiaque disponible">
                  Aucune donnée de fréquence cardiaque disponible
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="metrics-analysis-section">
        <h2 id="performance-analysis-heading">Analyse des performances</h2>
        
        <div 
          className="metrics-analysis-cards"
          aria-labelledby="performance-analysis-heading"
        >
          <motion.div 
            className="analysis-card focus-visible-ring"
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            tabIndex={0}
            aria-label={`Score d'effort: ${metrics.effortScore || '--'} sur une échelle de 100`}
          >
            <h3>Score d'effort</h3>
            <div className="analysis-value">{metrics.effortScore || '--'}</div>
            <div className="analysis-description">
              Évaluation globale de l'effort fourni durant l'entraînement
            </div>
          </motion.div>
          
          <motion.div 
            className="analysis-card focus-visible-ring"
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            tabIndex={0}
            aria-label={`Calories brûlées: ${metrics.calories || '--'} kilocalories`}
          >
            <h3>Calories</h3>
            <div className="analysis-value">{metrics.calories || '--'} kcal</div>
            <div className="analysis-description">
              Estimation des calories brûlées basée sur vos données biométriques
            </div>
          </motion.div>
          
          <motion.div 
            className="analysis-card focus-visible-ring"
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            tabIndex={0}
            aria-label={`Temps de récupération recommandé: ${metrics.recoveryScore || '--'} heures`}
          >
            <h3>Temps de récupération</h3>
            <div className="analysis-value">{metrics.recoveryScore || '--'} h</div>
            <div className="analysis-description">
              Temps de récupération recommandé avant le prochain entraînement intense
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(WorkoutMetricsTab);
