import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiSend, FiThumbsUp, FiFlag, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { WorkoutCommentsTabProps, Comment } from '../../../types/workout';
import './WorkoutCommentsTab.css';

/**
 * @module Training/Workout
 * @component WorkoutCommentsTab
 * 
 * Affiche et gère les commentaires d'un entraînement
 * Intègre les fonctionnalités d'authentification JWT et de rôles utilisateur
 * 
 * @example
 * ```tsx
 * <WorkoutCommentsTab 
 *   comments={workoutData.comments} 
 *   workoutId={workoutData.id}
 *   onAddComment={handleAddComment}
 * />
 * ```
 */
const WorkoutCommentsTab: React.FC<WorkoutCommentsTabProps> = ({ 
  comments, 
  workoutId, 
  onAddComment,
  onDeleteComment,
  onEditComment,
  onLikeComment,
  onReportComment,
  onReplyComment,
  isLoading = false 
}) => {
  // State pour le champ de commentaire
  const [commentText, setCommentText] = useState<string>('');
  // State pour le commentaire en cours d'édition
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  // State pour le commentaire auquel on répond
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  // State pour le commentaire signalé
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');

  // Animation constants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Utilisation de useMemo pour éviter les recréations d'objets à chaque rendu
  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  }), []);

  const formAnimation = useMemo(() => ({
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.3 }
  }), []);

  // Fonction pour soumettre un nouveau commentaire (optimisée avec useCallback car utilisée dans une dépendance de formulaire)
  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && onAddComment) {
      try {
        await onAddComment(commentText.trim(), workoutId);
        setCommentText('');
      } catch (error) {
        console.error('Erreur lors de l\'ajout du commentaire:', error);
      }
    }
  }, [commentText, onAddComment, workoutId]);

  // Fonction pour soumettre une modification (optimisée avec useCallback car utilisée dans une dépendance de formulaire)
  const handleSubmitEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCommentId && editingText.trim() && onEditComment) {
      try {
        await onEditComment(editingCommentId, editingText.trim());
        setEditingCommentId(null);
        setEditingText('');
      } catch (error) {
        console.error('Erreur lors de la modification du commentaire:', error);
      }
    }
  }, [editingCommentId, editingText, onEditComment]);

  // Fonction pour soumettre une réponse (optimisée avec useCallback car utilisée dans une dépendance de formulaire)
  const handleSubmitReply = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyingToId && replyText.trim() && onReplyComment) {
      try {
        await onReplyComment(replyingToId, replyText.trim());
        setReplyingToId(null);
        setReplyText('');
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réponse:', error);
      }
    }
  }, [replyingToId, replyText, onReplyComment]);

  // Fonction pour soumettre un signalement (optimisée avec useCallback car utilisée dans une dépendance de formulaire)
  const handleSubmitReport = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportingCommentId && reportReason.trim() && onReportComment) {
      try {
        await onReportComment(reportingCommentId, reportReason.trim());
        setReportingCommentId(null);
        setReportReason('');
      } catch (error) {
        console.error('Erreur lors du signalement du commentaire:', error);
      }
    }
  }, [reportingCommentId, reportReason, onReportComment]);

  // Fonction pour aimer un commentaire
  const handleLikeComment = useCallback(async (commentId: string) => {
    if (onLikeComment) {
      try {
        await onLikeComment(commentId);
      } catch (error) {
        console.error('Erreur lors du like du commentaire:', error);
      }
    }
  }, [onLikeComment]);

  // Fonction pour supprimer un commentaire
  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (onDeleteComment && window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      try {
        await onDeleteComment(commentId);
      } catch (error) {
        console.error('Erreur lors de la suppression du commentaire:', error);
      }
    }
  }, [onDeleteComment]);

  // Fonction pour commencer l'édition d'un commentaire
  const startEditing = useCallback((comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.content);
    setReplyingToId(null);
    setReportingCommentId(null);
  }, []);

  // Fonction pour commencer à répondre à un commentaire
  const startReplying = useCallback((commentId: string) => {
    setReplyingToId(commentId);
    setEditingCommentId(null);
    setReportingCommentId(null);
  }, []);

  // Fonction pour commencer à signaler un commentaire
  const startReporting = useCallback((commentId: string) => {
    setReportingCommentId(commentId);
    setEditingCommentId(null);
    setReplyingToId(null);
  }, []);

  // Fonction pour formater les dates
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } else if (diffDay > 0) {
      return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
    } else if (diffHour > 0) {
      return `il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
    } else if (diffMin > 0) {
      return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    } else {
      return 'à l\'instant';
    }
  };

  // Fonction pour afficher un commentaire ou une réponse
  const renderComment = useCallback((comment: Comment, isReply: boolean = false) => (
    <motion.div 
      key={comment.id}
      className={`comment-item ${isReply ? 'reply-item' : ''}`}
      variants={itemVariants}
      aria-label={`Commentaire de ${comment.userName}, ${formatDate(comment.createdAt)}`}
    >
      <div className="comment-avatar">
        {comment.userAvatar ? (
          <img 
            src={comment.userAvatar} 
            alt={`Avatar de ${comment.userName}`}
            loading="lazy" 
          />
        ) : (
          <div className="avatar-placeholder" aria-hidden="true">
            {comment.userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="comment-content">
        <div className="comment-header">
          <h3 className="comment-author">{comment.userName}</h3>
          <span 
            className="comment-date"
            aria-label={`Publié ${formatDate(comment.createdAt)}`}
          >
            {formatDate(comment.createdAt)}
          </span>
        </div>

        {editingCommentId === comment.id ? (
          <motion.form 
            className="edit-comment-form"
            onSubmit={handleSubmitEdit}
            {...formAnimation}
          >
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="edit-textarea"
              aria-label="Modifier votre commentaire"
              autoFocus
              required
            />
            <div className="edit-actions">
              <button 
                type="submit" 
                className="edit-submit-btn focus-visible-ring"
                disabled={!editingText.trim()}
                aria-label="Enregistrer les modifications"
              >
                <FiEdit2 aria-hidden="true" />
                <span>Enregistrer</span>
              </button>
              <button 
                type="button" 
                className="edit-cancel-btn focus-visible-ring"
                onClick={() => setEditingCommentId(null)}
                aria-label="Annuler les modifications"
              >
                Annuler
              </button>
            </div>
          </motion.form>
        ) : (
          <p className="comment-text">{comment.content}</p>
        )}

        {/* Actions sur le commentaire */}
        <div className="comment-actions">
          {/* Bouton J'aime */}
          {onLikeComment && (
            <button 
              className={`comment-action-btn like-btn focus-visible-ring ${comment.isLiked ? 'is-liked' : ''}`}
              onClick={() => handleLikeComment(comment.id)}
              aria-label={`${comment.isLiked ? 'Retirer le j\'aime' : 'J\'aime'}, actuellement ${comment.likes} j'aime`}
              aria-pressed={comment.isLiked ? "true" : "false"}
            >
              <FiThumbsUp aria-hidden="true" />
              <span>{comment.likes > 0 ? comment.likes : ''}</span>
            </button>
          )}

          {/* Bouton Répondre */}
          {onReplyComment && !isReply && (
            <button 
              className="comment-action-btn reply-btn focus-visible-ring"
              onClick={() => startReplying(comment.id)}
              aria-label="Répondre à ce commentaire"
              aria-pressed={replyingToId === comment.id ? "true" : "false"}
            >
              Répondre
            </button>
          )}

          {/* Bouton Signaler */}
          {onReportComment && !comment.isOwn && (
            <button 
              className="comment-action-btn report-btn focus-visible-ring"
              onClick={() => startReporting(comment.id)}
              aria-label="Signaler ce commentaire"
              aria-pressed={reportingCommentId === comment.id ? "true" : "false"}
            >
              <FiFlag aria-hidden="true" />
            </button>
          )}

          {/* Bouton Modifier */}
          {onEditComment && comment.isOwn && (
            <button 
              className="comment-action-btn edit-btn focus-visible-ring"
              onClick={() => startEditing(comment)}
              aria-label="Modifier votre commentaire"
              aria-pressed={editingCommentId === comment.id ? "true" : "false"}
            >
              <FiEdit2 aria-hidden="true" />
            </button>
          )}

          {/* Bouton Supprimer */}
          {onDeleteComment && comment.isOwn && (
            <button 
              className="comment-action-btn delete-btn focus-visible-ring"
              onClick={() => handleDeleteComment(comment.id)}
              aria-label="Supprimer votre commentaire"
            >
              <FiTrash2 aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Formulaire de réponse */}
        {AnimatePresence({
          mode: "wait",
          children: replyingToId === comment.id ? (
            <motion.form 
              className="reply-form"
              onSubmit={handleSubmitReply}
              {...formAnimation}
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Écrire une réponse..."
                className="reply-textarea"
                aria-label="Écrire une réponse"
                autoFocus
                required
              />
              <div className="reply-actions">
                <button 
                  type="submit" 
                  className="reply-submit-btn focus-visible-ring"
                  disabled={!replyText.trim()}
                  aria-label="Publier votre réponse"
                >
                  <FiSend aria-hidden="true" />
                  <span>Répondre</span>
                </button>
                <button 
                  type="button" 
                  className="reply-cancel-btn focus-visible-ring"
                  onClick={() => setReplyingToId(null)}
                  aria-label="Annuler la réponse"
                >
                  Annuler
                </button>
              </div>
            </motion.form>
          ) : null
        })}

        {/* Formulaire de signalement */}
        {AnimatePresence({
          mode: "wait",
          children: reportingCommentId === comment.id ? (
            <motion.form 
              className="report-form"
              onSubmit={handleSubmitReport}
              {...formAnimation}
            >
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Raison du signalement..."
                className="report-textarea"
                aria-label="Raison du signalement"
                autoFocus
                required
              />
              <div className="report-actions">
                <button 
                  type="submit" 
                  className="report-submit-btn focus-visible-ring"
                  disabled={!reportReason.trim()}
                  aria-label="Envoyer le signalement"
                >
                  <FiFlag aria-hidden="true" />
                  <span>Signaler</span>
                </button>
                <button 
                  type="button" 
                  className="report-cancel-btn focus-visible-ring"
                  onClick={() => setReportingCommentId(null)}
                  aria-label="Annuler le signalement"
                >
                  Annuler
                </button>
              </div>
            </motion.form>
          ) : null
        })}

        {/* Afficher les réponses */}
        {comment.replies && comment.replies.length > 0 && (
          <div 
            className="comment-replies"
            aria-label={`${comment.replies.length} réponse${comment.replies.length > 1 ? 's' : ''} à ce commentaire`}
          >
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </motion.div>
  ), [editingCommentId, editingText, formAnimation, handleDeleteComment, handleLikeComment, handleSubmitEdit, handleSubmitReport, handleSubmitReply, itemVariants, onDeleteComment, onEditComment, onLikeComment, onReplyComment, onReportComment, reportReason, reportingCommentId, replyText, replyingToId, startEditing, startReporting, startReplying]);

  return (
    <div 
      className="workout-comments-tab"
      role="tabpanel"
      id="comments-panel"
      aria-labelledby="comments-tab"
    >
      <h2 id="comments-heading">Commentaires</h2>

      {/* Formulaire pour ajouter un nouveau commentaire */}
      {onAddComment && (
        <form 
          className="comment-form" 
          onSubmit={handleSubmitComment}
          aria-labelledby="comments-heading"
        >
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Écrire un commentaire..."
            className="comment-textarea"
            aria-label="Écrire un commentaire"
          />
          <button 
            type="submit" 
            className="comment-submit-btn focus-visible-ring"
            disabled={!commentText.trim() || isLoading}
            aria-label="Publier votre commentaire"
          >
            <FiSend aria-hidden="true" />
            <span>Publier</span>
          </button>
        </form>
      )}

      {/* Afficher les commentaires */}
      {isLoading ? (
        <div 
          className="comments-loading"
          aria-live="polite"
        >
          Chargement des commentaires...
        </div>
      ) : comments.length === 0 ? (
        <div 
          className="no-comments"
          aria-live="polite"
        >
          <FiMessageSquare className="no-comments-icon" aria-hidden="true" />
          <p>Aucun commentaire pour le moment. Soyez le premier à commenter !</p>
        </div>
      ) : (
        <motion.div 
          className="comments-list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          aria-label={`${comments.length} commentaire${comments.length > 1 ? 's' : ''}`}
        >
          {comments.map(comment => renderComment(comment))}
        </motion.div>
      )}
    </div>
  );
};

// Ce composant est préservé avec useCallback pour les fonctions de traitement des événements
export default WorkoutCommentsTab;
