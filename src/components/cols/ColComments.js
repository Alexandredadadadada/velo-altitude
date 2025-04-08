import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSend, MdThumbUp, MdOutlineThumbUp, MdEdit, MdDelete, MdFlag } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import './ColComments.css';

/**
 * Composant pour afficher et gérer les commentaires sur un col
 * 
 * @component
 * @param {Object} props - Les propriétés du composant
 * @param {Array} props.comments - La liste des commentaires existants
 * @param {String} props.colId - L'identifiant du col
 */
export const ColComments = ({ colId, comments: initialComments = [] }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  
  // Animation des commentaires
  const commentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }),
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } }
  };
  
  // Charger les commentaires si nécessaire
  useEffect(() => {
    if (initialComments.length === 0 && colId) {
      fetchComments();
    }
  }, [colId, initialComments]);
  
  // Récupérer les commentaires depuis le backend
  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Simulation d'appel API avec données mockées
      setTimeout(() => {
        // Dans une implémentation réelle, cette partie utiliserait le Cache Service
        // et l'Authentication Middleware pour optimiser les performances
        const mockComments = generateMockComments();
        setComments(mockComments);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
      setLoading(false);
    }
  };
  
  // Générer des commentaires fictifs pour la démo
  const generateMockComments = () => {
    const userNames = [
      'Julien D.', 'Marie P.', 'Thomas L.', 'Sophie B.', 
      'Pierre M.', 'Claire V.', 'Lucas R.', 'Emma S.'
    ];
    
    const avatars = Array(8).fill().map((_, i) => `https://i.pravatar.cc/150?img=${i + 1}`);
    
    const commentTexts = [
      "Super col, je le recommande vivement ! La vue au sommet est à couper le souffle.",
      "Montée difficile mais qui en vaut la peine. Attention aux conditions météo qui changent rapidement.",
      "J'ai gravi ce col trois fois cette saison, c'est devenu mon préféré dans la région.",
      "Belle route, bon revêtement mais attention au trafic qui peut être dense en été.",
      "Très belle ascension ! Je conseille de partir tôt le matin pour éviter la chaleur.",
      "Paysage magnifique tout au long de la montée. Les derniers kilomètres sont les plus difficiles.",
      "Un classique à faire au moins une fois dans sa vie de cycliste !",
      "Montée régulière qui permet de trouver son rythme. Les virages offrent de belles vues panoramiques."
    ];
    
    return Array(Math.floor(Math.random() * 5) + 3).fill().map((_, i) => ({
      id: `comment-${i}`,
      userId: `user-${i}`,
      userName: userNames[i % userNames.length],
      userAvatar: avatars[i % avatars.length],
      text: commentTexts[i % commentTexts.length],
      date: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      likes: Math.floor(Math.random() * 15),
      userLiked: Math.random() > 0.7
    }));
  };
  
  // Soumettre un nouveau commentaire
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!user) {
      // Notification à l'utilisateur (dans une implémentation réelle)
      alert('Veuillez vous connecter pour ajouter un commentaire');
      return;
    }
    
    try {
      setLoading(true);
      
      // Dans une implémentation réelle, cette partie utiliserait l'API pour
      // envoyer le commentaire avec authentification JWT
      
      // Simuler l'ajout d'un commentaire
      setTimeout(() => {
        const newCommentObj = {
          id: `comment-new-${Date.now()}`,
          userId: user.id || 'current-user',
          userName: user.name || 'Utilisateur actuel',
          userAvatar: user.avatar || 'https://i.pravatar.cc/150?img=10',
          text: newComment,
          date: new Date().toISOString(),
          likes: 0,
          userLiked: false
        };
        
        setComments([newCommentObj, ...comments]);
        setNewComment('');
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      setLoading(false);
    }
  };
  
  // Gérer le like d'un commentaire
  const handleLikeComment = async (commentId) => {
    if (!user) {
      // Notification à l'utilisateur (dans une implémentation réelle)
      alert('Veuillez vous connecter pour aimer un commentaire');
      return;
    }
    
    // Optimistic UI update
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const newLiked = !comment.userLiked;
        return {
          ...comment,
          userLiked: newLiked,
          likes: newLiked ? comment.likes + 1 : comment.likes - 1
        };
      }
      return comment;
    });
    
    setComments(updatedComments);
    
    // Dans une implémentation réelle, cette partie enverrait la mise à jour au backend
    // avec l'Authentication Middleware pour vérifier les autorisations
  };
  
  // Commencer l'édition d'un commentaire
  const startEditComment = (comment) => {
    if (!user || (user.id !== comment.userId)) return;
    
    setEditingComment(comment.id);
    setEditText(comment.text);
  };
  
  // Enregistrer un commentaire édité
  const saveEditedComment = async () => {
    if (!editText.trim()) return;
    
    // Optimistic UI update
    const updatedComments = comments.map(comment => {
      if (comment.id === editingComment) {
        return {
          ...comment,
          text: editText,
          edited: true
        };
      }
      return comment;
    });
    
    setComments(updatedComments);
    setEditingComment(null);
    setEditText('');
    
    // Dans une implémentation réelle, cette partie enverrait la mise à jour au backend
  };
  
  // Supprimer un commentaire
  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    
    const commentToDelete = comments.find(c => c.id === commentId);
    if (!commentToDelete || user.id !== commentToDelete.userId) {
      // Notification à l'utilisateur (dans une implémentation réelle)
      alert('Vous ne pouvez pas supprimer ce commentaire');
      return;
    }
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }
    
    // Optimistic UI update
    setComments(comments.filter(c => c.id !== commentId));
    
    // Dans une implémentation réelle, cette partie enverrait la suppression au backend
  };
  
  // Signaler un commentaire inapproprié
  const handleReportComment = async (commentId) => {
    if (!user) {
      // Notification à l'utilisateur (dans une implémentation réelle)
      alert('Veuillez vous connecter pour signaler un commentaire');
      return;
    }
    
    // Simuler confirmation et notification
    if (window.confirm('Voulez-vous signaler ce commentaire comme inapproprié ?')) {
      alert('Commentaire signalé. Nos modérateurs vont l\'examiner. Merci !');
    }
    
    // Dans une implémentation réelle, cette partie enverrait le signalement au backend
  };
  
  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return diffMins ? `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}` : 'à l\'instant';
    } else if (diffHours < 24) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  return (
    <div className="col-comments">
      {/* Formulaire d'ajout de commentaire */}
      <form className="comment-form glass" onSubmit={handleSubmitComment}>
        <div className="comment-form-avatar">
          <img 
            src={user?.avatar || 'https://i.pravatar.cc/150?img=10'}
            alt="Avatar"
          />
        </div>
        <div className="comment-form-input-container">
          <textarea
            className="comment-form-input"
            placeholder="Partagez votre expérience sur ce col..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="comment-form-submit"
            disabled={!newComment.trim() || loading}
          >
            <MdSend />
          </button>
        </div>
      </form>
      
      {/* Liste des commentaires */}
      <div className="comments-list">
        {comments.length > 0 ? (
          comments.map((comment, i) => (
            <motion.div
              key={comment.id}
              className="comment-item glass"
              custom={i}
              variants={commentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="comment-avatar">
                <img 
                  src={comment.userAvatar}
                  alt={comment.userName}
                />
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <div className="comment-user-name">{comment.userName}</div>
                  <div className="comment-date">{formatDate(comment.date)}</div>
                </div>
                
                {editingComment === comment.id ? (
                  <div className="comment-edit-container">
                    <textarea
                      className="comment-edit-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                    />
                    <div className="comment-edit-actions">
                      <button 
                        onClick={() => setEditingComment(null)}
                        className="comment-edit-cancel"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={saveEditedComment}
                        className="comment-edit-save"
                        disabled={!editText.trim()}
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="comment-text">
                    {comment.text}
                    {comment.edited && <span className="comment-edited">(modifié)</span>}
                  </div>
                )}
                
                <div className="comment-actions">
                  <button 
                    className={`comment-like-button ${comment.userLiked ? 'active' : ''}`}
                    onClick={() => handleLikeComment(comment.id)}
                  >
                    {comment.userLiked ? <MdThumbUp /> : <MdOutlineThumbUp />}
                    <span className="comment-likes-count">{comment.likes}</span>
                  </button>
                  
                  {user && user.id === comment.userId && (
                    <>
                      <button 
                        className="comment-edit-button"
                        onClick={() => startEditComment(comment)}
                      >
                        <MdEdit />
                      </button>
                      <button 
                        className="comment-delete-button"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <MdDelete />
                      </button>
                    </>
                  )}
                  
                  {user && user.id !== comment.userId && (
                    <button 
                      className="comment-report-button"
                      onClick={() => handleReportComment(comment.id)}
                    >
                      <MdFlag />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="comments-empty glass">
            <p>Soyez le premier à commenter ce col !</p>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="comments-loading">
          <div className="comments-loader"></div>
          <p>Chargement des commentaires...</p>
        </div>
      )}
    </div>
  );
};
