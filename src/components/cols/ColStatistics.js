import React from 'react';
import { motion } from 'framer-motion';
import { MdTimerOutline, MdSpeed, MdPeople, MdTrendingUp, MdFlag } from 'react-icons/md';
import './ColStatistics.css';

/**
 * Composant pour afficher les statistiques d'un col
 * Visualisation élégante des données d'activité sur le col
 * 
 * @component
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.stats - Les statistiques du col
 */
export const ColStatistics = ({ stats }) => {
  // Animation des éléments à l'entrée
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };
  
  // Formatage du temps moyen (minutes en heures/minutes)
  const formatTime = (minutes) => {
    if (!minutes) return '-- min';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours}h ${mins > 0 ? mins + 'min' : ''}`;
  };

  return (
    <div className="col-statistics">
      <motion.div 
        className="col-stats-summary"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="col-stats-card glass" variants={itemVariants}>
          <div className="col-stats-icon">
            <MdTrendingUp />
          </div>
          <div className="col-stats-content">
            <h3 className="col-stats-value">{stats.totalAscents.toLocaleString('fr-FR')}</h3>
            <p className="col-stats-label">Ascensions totales</p>
          </div>
        </motion.div>
        
        <motion.div className="col-stats-card glass" variants={itemVariants}>
          <div className="col-stats-icon">
            <MdTimerOutline />
          </div>
          <div className="col-stats-content">
            <h3 className="col-stats-value">{formatTime(stats.averageTime)}</h3>
            <p className="col-stats-label">Temps moyen</p>
          </div>
        </motion.div>
        
        <motion.div className="col-stats-card glass" variants={itemVariants}>
          <div className="col-stats-icon">
            <MdSpeed />
          </div>
          <div className="col-stats-content">
            <h3 className="col-stats-value">{formatTime(stats.fastestTime)}</h3>
            <p className="col-stats-label">Record</p>
          </div>
        </motion.div>
        
        <motion.div className="col-stats-card glass" variants={itemVariants}>
          <div className="col-stats-icon">
            <MdFlag />
          </div>
          <div className="col-stats-content">
            <h3 className="col-stats-value">{stats.thisYear.toLocaleString('fr-FR')}</h3>
            <p className="col-stats-label">Cette année</p>
          </div>
        </motion.div>
        
        <motion.div className="col-stats-card glass" variants={itemVariants}>
          <div className="col-stats-icon">
            <MdPeople />
          </div>
          <div className="col-stats-content">
            <h3 className="col-stats-value">{stats.kudos.toLocaleString('fr-FR')}</h3>
            <p className="col-stats-label">Kudos</p>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="col-stats-distribution glass"
        variants={itemVariants}
      >
        <h3 className="col-stats-section-title">Distribution des temps d'ascension</h3>
        <div className="col-time-distribution">
          {generateDistributionData(stats.averageTime, stats.fastestTime).map((bar, index) => (
            <div key={index} className="col-time-bar-container">
              <div className="col-time-label">{bar.label}</div>
              <div className="col-time-bar-wrapper">
                <motion.div 
                  className="col-time-bar"
                  style={{ backgroundColor: bar.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${bar.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + (index * 0.1) }}
                >
                  <span className="col-time-value">{bar.count}</span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      
      <motion.div 
        className="col-stats-records glass"
        variants={itemVariants}
      >
        <h3 className="col-stats-section-title">Records mensuels</h3>
        <div className="col-monthly-records">
          {generateMonthlyRecords().map((month, index) => (
            <div key={index} className="col-month-record">
              <div className="col-month-name">{month.name}</div>
              <div className="col-month-time">{formatTime(month.time)}</div>
              <div className="col-month-user">{month.user}</div>
            </div>
          ))}
        </div>
      </motion.div>
      
      <motion.div 
        className="col-stats-activity glass"
        variants={itemVariants}
      >
        <h3 className="col-stats-section-title">Activité récente</h3>
        <div className="col-recent-activity">
          {generateRecentActivity().map((activity, index) => (
            <div key={index} className="col-activity-item">
              <div className="col-activity-user-avatar">
                <img src={activity.userAvatar} alt={activity.userName} />
              </div>
              <div className="col-activity-details">
                <div className="col-activity-user-name">{activity.userName}</div>
                <div className="col-activity-description">{activity.description}</div>
                <div className="col-activity-time">{activity.time}</div>
              </div>
              <div className="col-activity-stats">
                <div className="col-activity-time-value">{formatTime(activity.duration)}</div>
                <div className="col-activity-kudos">
                  {activity.kudos} kudos
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Générer des données de distribution fictives
const generateDistributionData = (averageTime, fastestTime) => {
  // Calculer un temps "limite" (approximativement 2x le temps moyen)
  const maxTime = averageTime * 2;
  
  // Créer 5 catégories de temps
  const step = (maxTime - fastestTime) / 5;
  
  const distribution = [
    {
      label: 'Très rapide',
      range: [fastestTime, fastestTime + step],
      count: Math.floor(Math.random() * 30) + 10,
      color: '#4CAF50'
    },
    {
      label: 'Rapide',
      range: [fastestTime + step, fastestTime + (step * 2)],
      count: Math.floor(Math.random() * 100) + 50,
      color: '#8BC34A'
    },
    {
      label: 'Moyen',
      range: [fastestTime + (step * 2), fastestTime + (step * 3)],
      count: Math.floor(Math.random() * 200) + 150,
      color: '#FFC107'
    },
    {
      label: 'Lent',
      range: [fastestTime + (step * 3), fastestTime + (step * 4)],
      count: Math.floor(Math.random() * 100) + 50,
      color: '#FF9800'
    },
    {
      label: 'Très lent',
      range: [fastestTime + (step * 4), maxTime],
      count: Math.floor(Math.random() * 30) + 10,
      color: '#F44336'
    }
  ];
  
  // Calculer le pourcentage pour chaque barre
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  
  return distribution.map(item => ({
    ...item,
    percentage: (item.count / total) * 100
  }));
};

// Générer des records mensuels fictifs
const generateMonthlyRecords = () => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const users = [
    'Pierre D.', 'Sophie M.', 'Thomas L.', 'Émilie B.',
    'Marc F.', 'Julie R.', 'David C.', 'Céline V.'
  ];
  
  return months.map(name => ({
    name,
    time: Math.floor(Math.random() * 60) + 30,
    user: users[Math.floor(Math.random() * users.length)]
  }));
};

// Générer des activités récentes fictives
const generateRecentActivity = () => {
  const users = [
    { name: 'Pierre D.', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Sophie M.', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Thomas L.', avatar: 'https://i.pravatar.cc/150?img=3' },
    { name: 'Émilie B.', avatar: 'https://i.pravatar.cc/150?img=9' },
    { name: 'Marc F.', avatar: 'https://i.pravatar.cc/150?img=7' }
  ];
  
  const descriptions = [
    'a gravi le col',
    'a battu son record personnel',
    'a terminé l\'ascension pour la première fois',
    'a ajouté des photos',
    'a partagé son parcours'
  ];
  
  const times = [
    'aujourd\'hui', 'hier', 'il y a 2 jours',
    'il y a 3 jours', 'la semaine dernière'
  ];
  
  return Array(5).fill().map((_, i) => {
    const user = users[i % users.length];
    
    return {
      userName: user.name,
      userAvatar: user.avatar,
      description: descriptions[i % descriptions.length],
      time: times[i % times.length],
      duration: Math.floor(Math.random() * 90) + 30,
      kudos: Math.floor(Math.random() * 30) + 1
    };
  });
};
