import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiExternalLink, FiAward, FiCalendar, FiMapPin } from 'react-icons/fi';
import { WorkoutInstructorTabProps } from '../../../types/workout';
import { colors } from '../../../design-system/tokens/colors';
import './WorkoutInstructorTab.css';

/**
 * @module Training/Workout
 * @component WorkoutInstructorTab
 * 
 * Affiche les informations détaillées sur l'instructeur de l'entraînement
 * Intègre les données du profil utilisateur avec mise en cache multi-niveau
 * 
 * @example
 * ```tsx
 * <WorkoutInstructorTab instructor={workout.instructor} />
 * ```
 */
const WorkoutInstructorTab: React.FC<WorkoutInstructorTabProps> = ({ instructor }) => {
  // Animation constants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  
  const buttonHover = { scale: 1.05 };
  const buttonTap = { scale: 0.95 };

  return (
    <div 
      className="workout-instructor-tab"
      role="tabpanel"
      id="instructor-panel"
      aria-labelledby="instructor-tab"
    >
      <motion.div 
        className="instructor-profile"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="instructor-header"
          variants={itemVariants}
        >
          <div className="instructor-image-container">
            {instructor.profileImage ? (
              <img 
                src={instructor.profileImage} 
                alt={`${instructor.name}, ${instructor.title}`}
                className="instructor-image"
                loading="lazy"
              />
            ) : (
              <div 
                className="instructor-image-placeholder"
                aria-hidden="true"
              >
                {instructor.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
          
          <div className="instructor-info">
            <h2 id="instructor-name-heading" className="instructor-name">{instructor.name}</h2>
            <div className="instructor-title">{instructor.title}</div>
            
            <div className="instructor-stats" aria-labelledby="instructor-name-heading">
              {instructor.stats && (
                <>
                  {instructor.stats.workouts !== undefined && (
                    <div className="stat-item">
                      <span className="stat-value">{instructor.stats.workouts}</span>
                      <span className="stat-label">Entraînements</span>
                    </div>
                  )}
                  
                  {instructor.stats.athletes !== undefined && (
                    <div className="stat-item">
                      <span className="stat-value">{instructor.stats.athletes}</span>
                      <span className="stat-label">Athlètes</span>
                    </div>
                  )}
                  
                  {instructor.stats.rating !== undefined && (
                    <div className="stat-item">
                      <span className="stat-value">
                        {instructor.stats.rating.toFixed(1)}
                        <span className="rating-star" aria-hidden="true">★</span>
                      </span>
                      <span className="stat-label">
                        Note
                        <span className="visually-hidden">
                          {` ${instructor.stats.rating.toFixed(1)} sur 5`}
                        </span>
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="instructor-contact-buttons">
              {instructor.email && (
                <motion.a 
                  href={`mailto:${instructor.email}`}
                  className="contact-button email focus-visible-ring"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  aria-label={`Envoyer un email à ${instructor.name}`}
                >
                  <FiMail aria-hidden="true" />
                  <span>Contacter</span>
                </motion.a>
              )}
              
              {instructor.website && (
                <motion.a 
                  href={instructor.website}
                  className="contact-button website focus-visible-ring"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  aria-label={`Visiter le site web de ${instructor.name}`}
                >
                  <FiExternalLink aria-hidden="true" />
                  <span>Site web</span>
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="instructor-bio"
          variants={itemVariants}
        >
          <h3 id="instructor-bio-heading">À propos</h3>
          <p aria-labelledby="instructor-bio-heading">{instructor.bio}</p>
        </motion.div>
        
        <div className="instructor-details-grid">
          {instructor.yearsOfExperience && (
            <motion.div 
              className="instructor-detail-item"
              variants={itemVariants}
            >
              <div className="detail-icon" aria-hidden="true">
                <FiCalendar />
              </div>
              <div className="detail-content">
                <h4 id="experience-heading">Expérience</h4>
                <p aria-labelledby="experience-heading">{instructor.yearsOfExperience} {instructor.yearsOfExperience > 1 ? 'années' : 'année'}</p>
              </div>
            </motion.div>
          )}
          
          {instructor.location && (
            <motion.div 
              className="instructor-detail-item"
              variants={itemVariants}
            >
              <div className="detail-icon" aria-hidden="true">
                <FiMapPin />
              </div>
              <div className="detail-content">
                <h4 id="location-heading">Localisation</h4>
                <p aria-labelledby="location-heading">{instructor.location}</p>
              </div>
            </motion.div>
          )}
          
          {instructor.certifications && instructor.certifications.length > 0 && (
            <motion.div 
              className="instructor-detail-item"
              variants={itemVariants}
            >
              <div className="detail-icon" aria-hidden="true">
                <FiAward />
              </div>
              <div className="detail-content">
                <h4 id="certifications-heading">Certifications</h4>
                <ul 
                  className="certification-list"
                  aria-labelledby="certifications-heading"
                >
                  {instructor.certifications.map((cert, index) => (
                    <li key={index}>{cert}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
        
        {instructor.specialties && instructor.specialties.length > 0 && (
          <motion.div 
            className="instructor-specialties"
            variants={itemVariants}
          >
            <h3 id="specialties-heading">Spécialités</h3>
            <div 
              className="specialties-list"
              aria-labelledby="specialties-heading"
            >
              {instructor.specialties.map((specialty, index) => (
                <span key={index} className="specialty-tag">
                  {specialty}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default WorkoutInstructorTab;
