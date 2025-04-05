import React, { useState, useEffect } from 'react';
import CommunityFeed from './CommunityFeed';
import RouteSharing from './RouteSharing';
import EventsCalendar from './EventsCalendar';
import UserProfile from './UserProfile';
import ClubsDirectory from './ClubsDirectory';
import './SocialHub.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import OptimizedImage from '../common/OptimizedImage';

/**
 * SocialHub component integrating community features, route sharing, events, and user profiles
 * @param {Object} props - Component properties
 * @param {string} props.userId - Current user ID
 * @param {string} props.initialView - Initial view to display (feed, routes, events, profile, clubs)
 * @param {Function} props.onViewChange - Callback function when view changes
 */
const SocialHub = ({ userId, initialView = 'feed', onViewChange }) => {
  const [activeView, setActiveView] = useState(initialView);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        // const response = await axios.get(`/api/users/${userId}`);
        // setUserData(response.data);
        
        // Mock user data for development
        setUserData({
          id: userId || 'user123',
          name: 'Jean Dupont',
          level: 'intermediate',
          location: 'Strasbourg, France',
          profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
          following: 68,
          followers: 42,
          totalRides: 156,
          totalDistance: 3840,
          clubs: [
            { id: 'club1', name: 'Grand Est Cyclisme' },
            { id: 'club2', name: 'Strasbourg Vélo Club' }
          ],
          achievements: [
            { id: 'ach1', name: 'Ascension du Galibier', date: '2025-03-15' },
            { id: 'ach2', name: '1000 km parcourus', date: '2025-02-28' },
            { id: 'ach3', name: 'Premier événement', date: '2025-01-10' }
          ]
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  // Synchronize with initialView when it changes
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);
  
  // Navigation handler
  const handleNavigation = (view) => {
    setActiveView(view);
    // Call the callback if provided
    if (onViewChange) {
      onViewChange(view);
    }
  };
  
  if (loading) {
    return <div className="social-hub-loading">Chargement...</div>;
  }
  
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/socialhub"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <div className="social-hub">
      <div className="social-hub-header">
        <h2>Hub Social</h2>
        
        <div className="user-profile-summary">
          <img 
            src={userData.profileImage} 
            alt={userData.name} 
            className="profile-image-small" 
          />
          <div className="profile-details">
            <span className="user-name">{userData.name}</span>
            <span className="user-location">{userData.location}</span>
          </div>
        </div>
      </div>
      
      <div className="social-navigation">
        <button 
          className={`social-nav-button ${activeView === 'feed' ? 'active' : ''}`}
          onClick={() => handleNavigation('feed')}
        >
          <i className="fas fa-stream"></i>
          Fil d'actualité
        </button>
        <button 
          className={`social-nav-button ${activeView === 'routes' ? 'active' : ''}`}
          onClick={() => handleNavigation('routes')}
        >
          <i className="fas fa-route"></i>
          Partage d'itinéraires
        </button>
        <button 
          className={`social-nav-button ${activeView === 'events' ? 'active' : ''}`}
          onClick={() => handleNavigation('events')}
        >
          <i className="fas fa-calendar-alt"></i>
          Événements
        </button>
        <button 
          className={`social-nav-button ${activeView === 'clubs' ? 'active' : ''}`}
          onClick={() => handleNavigation('clubs')}
        >
          <i className="fas fa-users"></i>
          Clubs
        </button>
        <button 
          className={`social-nav-button ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => handleNavigation('profile')}
        >
          <i className="fas fa-user"></i>
          Mon profil
        </button>
      </div>
      
      <article className="social-content">
        {activeView === 'feed' && (
          <CommunityFeed userId={userData.id} />
        )}
        
        {activeView === 'routes' && (
          <RouteSharing userId={userData.id} />
        )}
        
        {activeView === 'events' && (
          <EventsCalendar userId={userData.id} />
        )}
        
        {activeView === 'clubs' && (
          <ClubsDirectory userId={userData.id} userClubs={userData.clubs} />
        )}
        
        {activeView === 'profile' && (
          <UserProfile userData={userData} />
        )}
      </div>
    </div>
  );
};

export default SocialHub;
