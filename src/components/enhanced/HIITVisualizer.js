import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Badge, ProgressBar, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStop, faClock, faChartLine, faFire } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Chart from 'chart.js/auto';
import { useNotification } from '../common/NotificationSystem';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant pour visualiser et suivre un entraînement HIIT
 */
const HIITVisualizer = ({ workout, onComplete, onSave }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [currentInterval, setCurrentInterval] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [timerID, setTimerID] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    tss: 0,          // Training Stress Score
    kj: 0,           // Kilojoules
    timeInZones: [0, 0, 0, 0, 0, 0, 0],  // Temps passé dans chaque zone
  });

  // Convertir le temps en format mm:ss
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Validation de l'entraînement
  useEffect(() => {
    if (!workout) {
      notify.error("Données d'entraînement manquantes");
      return;
    }

    try {
      if (!workout.intervals || !Array.isArray(workout.intervals)) {
        notify.error("Intervalles d'entraînement invalides");
        return;
      }

      // Calculer la durée totale de l'entraînement
      const total = workout.intervals.reduce(
        (sum, interval) => sum + (interval.duration || 0), 
        0
      );
      
      if (total <= 0) {
        notify.error("Durée d'entraînement invalide");
        return;
      }
      
      setTotalTime(total);
      
      // Initialiser la visualisation
      initializeChart();
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'entraînement", error);
      notify.error("Erreur lors de l'initialisation", error.message);
    }
  }, [workout, notify]);

  // Création et mise à jour du graphique
  const initializeChart = () => {
    if (!workout || !workout.intervals || !chartRef.current) return;

    // Détruire le graphique existant s'il y en a un
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Préparer les données pour le graphique
    const labels = [];
    const powerData = [];
    let currentTime = 0;

    workout.intervals.forEach(interval => {
      const durationMinutes = interval.duration / 60;
      const intervalType = interval.type || 'steady';
      
      // Pour chaque minute de l'intervalle
      for (let i = 0; i < durationMinutes; i++) {
        currentTime += 60;
        labels.push(formatTime(currentTime));
        powerData.push(interval.power);
      }
    });

    // Référence à la FTP pour déterminer les zones de puissance
    const ftp = workout.targetPower || 200;

    // Créer le graphique
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Puissance Cible (Watts)',
            data: powerData,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)'
          },
          {
            label: 'FTP',
            data: Array(labels.length).fill(ftp),
            borderColor: 'rgba(255, 99, 132, 0.8)',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Watts'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Temps (minutes)'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: (context) => {
                return `Temps: ${context[0].label}`;
              },
              label: (context) => {
                const power = context.raw;
                const percentOfFTP = Math.round((power / ftp) * 100);
                return [
                  `Puissance: ${power} W`,
                  `${percentOfFTP}% de FTP`
                ];
              }
            }
          }
        }
      }
    });
  };

  // Démarrer/Reprendre l'entraînement
  const startWorkout = () => {
    if (isActive) return;
    
    setIsActive(true);
    
    // Démarrer le chronomètre
    const id = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        
        // Vérifier si on doit passer à l'intervalle suivant
        let totalDuration = 0;
        let nextIntervalIndex = 0;
        
        for (let i = 0; i < workout.intervals.length; i++) {
          totalDuration += workout.intervals[i].duration;
          if (newTime <= totalDuration) {
            nextIntervalIndex = i;
            break;
          }
        }
        
        if (nextIntervalIndex !== currentInterval) {
          setCurrentInterval(nextIntervalIndex);
          
          // Annoncer le changement d'intervalle
          const intervalType = workout.intervals[nextIntervalIndex].type;
          const power = workout.intervals[nextIntervalIndex].power;
          notify.info(`Nouvel intervalle: ${intervalType}, ${power}W`);
        }
        
        // Calculer les statistiques de la séance
        updateSessionStats(newTime);
        
        // Vérifier si l'entraînement est terminé
        if (newTime >= totalTime) {
          clearInterval(timerID);
          finishWorkout();
          return totalTime;
        }
        
        return newTime;
      });
    }, 1000);
    
    setTimerID(id);
  };

  // Mettre à jour les statistiques de la séance
  const updateSessionStats = (currentTime) => {
    if (!workout || !workout.intervals) return;
    
    // Trouver l'intervalle actuel
    let accumulatedDuration = 0;
    let currentIntervalData = null;
    
    for (const interval of workout.intervals) {
      accumulatedDuration += interval.duration;
      if (currentTime <= accumulatedDuration) {
        currentIntervalData = interval;
        break;
      }
    }
    
    if (!currentIntervalData) return;
    
    // Calculer les statistiques supplémentaires
    setSessionStats(prev => {
      // Calculer les kilojoules (kJ = Watts * heures)
      const hourFraction = 1 / 3600; // une seconde en heures
      const newKj = prev.kj + (currentIntervalData.power * hourFraction);
      
      // Déterminer la zone de puissance
      const ftp = workout.targetPower || 200;
      const powerPercentage = currentIntervalData.power / ftp;
      
      // Incrémenter le temps passé dans la zone appropriée
      const newTimeInZones = [...prev.timeInZones];
      if (powerPercentage <= 0.55) newTimeInZones[0]++;
      else if (powerPercentage <= 0.75) newTimeInZones[1]++;
      else if (powerPercentage <= 0.9) newTimeInZones[2]++;
      else if (powerPercentage <= 1.05) newTimeInZones[3]++;
      else if (powerPercentage <= 1.3) newTimeInZones[4]++;
      else if (powerPercentage <= 1.5) newTimeInZones[5]++;
      else newTimeInZones[6]++;
      
      // Calculer le TSS approximatif (Training Stress Score)
      // TSS = (durée_en_secondes * NP * IF) / (FTP * 36)
      // Pour simplifier, on utilise la puissance de l'intervalle au lieu de NP (Normalized Power)
      // et IF (Intensity Factor) = puissance / FTP
      const tssIncrement = 
        (1 * currentIntervalData.power * (currentIntervalData.power / ftp)) / 
        (ftp * 36);
      
      return {
        tss: prev.tss + tssIncrement,
        kj: newKj,
        timeInZones: newTimeInZones
      };
    });
  };

  // Mettre en pause l'entraînement
  const pauseWorkout = () => {
    clearInterval(timerID);
    setIsActive(false);
  };

  // Terminer l'entraînement
  const finishWorkout = () => {
    clearInterval(timerID);
    setIsActive(false);
    
    // Arrondir les statistiques
    const finalStats = {
      tss: Math.round(sessionStats.tss),
      kj: Math.round(sessionStats.kj),
      timeInZones: sessionStats.timeInZones,
      duration: elapsedTime,
      completed: elapsedTime >= totalTime
    };
    
    // Notifier l'utilisateur
    notify.success("Entraînement terminé !", 
      `TSS: ${finalStats.tss}, Énergie dépensée: ${finalStats.kj} kJ`
    );
    
    // Appeler le callback de fin
    if (onComplete) {
      onComplete(finalStats);
    }
  };

  // Sauvegarder l'entraînement
  const saveWorkout = () => {
    if (!workout) return;
    
    try {
      if (onSave) {
        const workoutData = {
          ...workout,
          stats: sessionStats,
          completedTime: elapsedTime,
          completionDate: new Date().toISOString(),
          completed: elapsedTime >= totalTime
        };
        
        onSave(workoutData);
        notify.success("Entraînement sauvegardé !");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde", error);
      notify.error("Impossible de sauvegarder l'entraînement", error.message);
    }
  };

  // Obtenir les informations sur l'intervalle actuel
  const getCurrentIntervalInfo = () => {
    if (!workout || !workout.intervals || workout.intervals.length === 0) {
      return { type: 'inconnu', power: 0, duration: 0 };
    }
    
    const intervalIndex = Math.min(currentInterval, workout.intervals.length - 1);
    return workout.intervals[intervalIndex];
  };

  // Determiner le style de l'intervalle actuel
  const getIntervalStyle = (type) => {
    const styles = {
      warmup: { color: 'info', icon: faPlay },
      steady: { color: 'success', icon: faChartLine },
      threshold: { color: 'warning', icon: faFire },
      vo2max: { color: 'danger', icon: faFire },
      recovery: { color: 'info', icon: faClock },
      cooldown: { color: 'primary', icon: faClock },
      default: { color: 'secondary', icon: faChartLine }
    };
    
    return styles[type] || styles.default;
  };

  // Si aucun entraînement n'est fourni
  if (!workout) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/hiitvisualizer"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
      <Card className="text-center my-4">
        <Card.Body>
          <Card.Title>Aucun entraînement sélectionné</Card.Title>
          <Card.Text>
            Veuillez sélectionner un entraînement pour commencer la session.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  // Informations sur l'intervalle actuel
  const currentIntervalInfo = getCurrentIntervalInfo();
  const intervalStyle = getIntervalStyle(currentIntervalInfo.type);
  const percentComplete = Math.min(100, (elapsedTime / totalTime) * 100);

  return (
    <div className="hiit-visualizer">
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">{workout.name}</h4>
          <Badge bg="primary">{formatTime(elapsedTime)} / {formatTime(totalTime)}</Badge>
        </Card.Header>
        
        <Card.Body>
          <div className="mb-4">
            <ProgressBar 
              now={percentComplete} 
              variant="primary" 
              label={`${Math.round(percentComplete)}%`} 
              className="mb-2"
              style={{ height: '25px' }}
            />
          </div>
          
          <Row className="mb-4">
            <Col md={6}>
              <Card className="h-100 current-interval">
                <Card.Header className={`bg-${intervalStyle.color} text-white`}>
                  <FontAwesomeIcon icon={intervalStyle.icon} className="me-2" />
                  Intervalle Actuel: {t(`intervals.${currentIntervalInfo.type}`) || currentIntervalInfo.type}
                </Card.Header>
                <Card.Body className="text-center">
                  <div className="power-display mb-3">
                    <h1 className="power-value">{currentIntervalInfo.power}</h1>
                    <span className="power-unit">watts</span>
                  </div>
                  
                  <Row className="interval-details">
                    <Col xs={6}>
                      <div className="detail-item">
                        <FontAwesomeIcon icon={faClock} className="me-2 text-muted" />
                        {formatTime(currentIntervalInfo.duration)}
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="detail-item">
                        <FontAwesomeIcon icon={faFire} className="me-2 text-muted" />
                        {workout.targetPower ? `${Math.round((currentIntervalInfo.power / workout.targetPower) * 100)}% FTP` : 'FTP inconnue'}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100 session-stats">
                <Card.Header>Statistiques de la Session</Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={6} className="mb-3">
                      <div className="stat-label">TSS</div>
                      <div className="stat-value">{Math.round(sessionStats.tss)}</div>
                    </Col>
                    <Col xs={6} className="mb-3">
                      <div className="stat-label">Kilojoules</div>
                      <div className="stat-value">{Math.round(sessionStats.kj)} kJ</div>
                    </Col>
                  </Row>
                  
                  <div className="zones-distribution">
                    <div className="stat-label mb-2">Temps dans les zones</div>
                    <div className="zones-bars">
                      {sessionStats.timeInZones.map((time, index) => (
                        <div key={index} className="zone-bar-container mb-1">
                          <div className="zone-name">Z{index + 1}</div>
                          <ProgressBar 
                            now={time} 
                            max={totalTime} 
                            variant={
                              index === 0 ? 'info' :
                              index === 1 ? 'success' :
                              index === 2 ? 'primary' :
                              index === 3 ? 'warning' :
                              index === 4 ? 'danger' :
                              index === 5 ? 'dark' : 'secondary'
                            } 
                            className="flex-grow-1"
                          />
                          <div className="zone-time">{Math.round(time)}s</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <main className="chart-container" style={{ height: '300px' }}>
            <canvas ref={chartRef} />
          </div>
          
          <div className="workout-controls mt-4 d-flex justify-content-center">
            {!isActive ? (
              <Button 
                variant="success" 
                size="lg" 
                onClick={startWorkout}
                className="me-2"
              >
                <FontAwesomeIcon icon={faPlay} className="me-2" />
                {elapsedTime > 0 ? 'Reprendre' : 'Démarrer'}
              </Button>
            ) : (
              <Button 
                variant="warning" 
                size="lg" 
                onClick={pauseWorkout}
                className="me-2"
              >
                <FontAwesomeIcon icon={faPause} className="me-2" />
                Pause
              </Button>
            )}
            
            <Button 
              variant="danger" 
              size="lg" 
              onClick={finishWorkout}
              className="me-2"
            >
              <FontAwesomeIcon icon={faStop} className="me-2" />
              Terminer
            </Button>
            
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={saveWorkout}
            >
              Sauvegarder
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

HIITVisualizer.propTypes = {
  workout: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    description: PropTypes.string,
    duration: PropTypes.number,
    targetPower: PropTypes.number, // FTP ou puissance cible en watts
    intervals: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        duration: PropTypes.number.isRequired, // en secondes
        power: PropTypes.number.isRequired // en watts
      })
    ).isRequired
  }),
  onComplete: PropTypes.func,
  onSave: PropTypes.func
};

export default HIITVisualizer;
