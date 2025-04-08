import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './ErrorLogViewer.scss';

/**
 * Composant pour visualiser les logs d'erreurs dans l'interface d'administration
 * Permet de filtrer, trier et analyser les erreurs survenues dans l'application
 */
const ErrorLogViewer = () => {
  const [errorLogs, setErrorLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    totalItems: 0
  });
  const [selectedLog, setSelectedLog] = useState(null);

  // Chargement des logs
  const fetchErrorLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      // Préparation des paramètres de requête
      const queryParams = new URLSearchParams({
        page: pagination.page,
        perPage: pagination.perPage,
        type: filters.type !== 'all' ? filters.type : '',
        severity: filters.severity !== 'all' ? filters.severity : '',
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search
      }).toString();
      
      // Chargement des logs depuis l'API
      const response = await fetch(`/api/admin/error-logs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement des logs: ${response.status}`);
      }
      
      const data = await response.json();
      
      setErrorLogs(data.logs || []);
      setPagination(prev => ({
        ...prev,
        totalItems: data.total || 0
      }));
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des logs:', err);
      setError(err.message);
      setErrorLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage]);

  // Chargement initial et lors des changements de filtres ou pagination
  useEffect(() => {
    fetchErrorLogs();
  }, [fetchErrorLogs]);

  // Gestion des changements de filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Réinitialiser la pagination lors d'un changement de filtre
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Réinitialisation des filtres
  const resetFilters = () => {
    setFilters({
      type: 'all',
      severity: 'all',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Changement de page
  const changePage = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(pagination.totalItems / pagination.perPage)) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Affichage des détails d'un log
  const viewLogDetails = (log) => {
    setSelectedLog(log);
  };

  // Fermeture des détails
  const closeDetails = () => {
    setSelectedLog(null);
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
    } catch (err) {
      return 'Date invalide';
    }
  };

  // Marquage d'un log comme résolu
  const markAsResolved = async (logId) => {
    try {
      const response = await fetch(`/api/admin/error-logs/${logId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la mise à jour: ${response.status}`);
      }
      
      // Recharger les logs
      fetchErrorLogs();
      
      // Mettre à jour le log sélectionné si nécessaire
      if (selectedLog && selectedLog.id === logId) {
        setSelectedLog(prev => ({ ...prev, resolved: true }));
      }
    } catch (err) {
      console.error('Erreur lors du marquage comme résolu:', err);
      alert(`Erreur: ${err.message}`);
    }
  };

  // Nombre total de pages
  const totalPages = Math.ceil(pagination.totalItems / pagination.perPage);

  return (
    <div className="error-log-viewer">
      <h2 className="error-log-viewer__title">Journal des erreurs</h2>
      
      {/* Filtres */}
      <div className="error-log-viewer__filters">
        <div className="error-log-viewer__filter-group">
          <label>
            Type:
            <select 
              name="type" 
              value={filters.type} 
              onChange={handleFilterChange}
            >
              <option value="all">Tous</option>
              <option value="api_error">Erreur API</option>
              <option value="react_error">Erreur React</option>
              <option value="auth_error">Erreur d'authentification</option>
              <option value="network_error">Erreur réseau</option>
            </select>
          </label>
          
          <label>
            Sévérité:
            <select 
              name="severity" 
              value={filters.severity} 
              onChange={handleFilterChange}
            >
              <option value="all">Toutes</option>
              <option value="error">Erreur</option>
              <option value="warning">Avertissement</option>
              <option value="critical">Critique</option>
            </select>
          </label>
        </div>
        
        <div className="error-log-viewer__filter-group">
          <label>
            Du:
            <input 
              type="date" 
              name="startDate" 
              value={filters.startDate} 
              onChange={handleFilterChange}
            />
          </label>
          
          <label>
            Au:
            <input 
              type="date" 
              name="endDate" 
              value={filters.endDate} 
              onChange={handleFilterChange}
            />
          </label>
        </div>
        
        <div className="error-log-viewer__filter-group">
          <input 
            type="text" 
            name="search" 
            value={filters.search} 
            onChange={handleFilterChange}
            placeholder="Rechercher..."
            className="error-log-viewer__search"
          />
          
          <button 
            onClick={resetFilters}
            className="error-log-viewer__reset-btn"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>
      
      {/* Tableau des logs */}
      <div className="error-log-viewer__table-container">
        {loading ? (
          <div className="error-log-viewer__loading">Chargement des logs...</div>
        ) : error ? (
          <div className="error-log-viewer__error">{error}</div>
        ) : errorLogs.length === 0 ? (
          <div className="error-log-viewer__empty">Aucun log d'erreur trouvé.</div>
        ) : (
          <table className="error-log-viewer__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Message</th>
                <th>Module</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {errorLogs.map(log => (
                <tr 
                  key={log.id}
                  className={`error-log-viewer__row ${log.resolved ? 'error-log-viewer__row--resolved' : ''}`}
                >
                  <td>{formatDate(log.timestamp)}</td>
                  <td>
                    <span className={`error-log-viewer__tag error-log-viewer__tag--${log.type.toLowerCase()}`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="error-log-viewer__message">{log.message}</td>
                  <td>{log.moduleName || 'N/A'}</td>
                  <td>
                    <span className={`error-log-viewer__status error-log-viewer__status--${log.resolved ? 'resolved' : 'active'}`}>
                      {log.resolved ? 'Résolu' : 'Actif'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="error-log-viewer__action-btn"
                      onClick={() => viewLogDetails(log)}
                    >
                      Détails
                    </button>
                    {!log.resolved && (
                      <button 
                        className="error-log-viewer__action-btn error-log-viewer__action-btn--resolve"
                        onClick={() => markAsResolved(log.id)}
                      >
                        Marquer résolu
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {!loading && !error && errorLogs.length > 0 && (
        <div className="error-log-viewer__pagination">
          <button 
            className="error-log-viewer__pagination-btn"
            disabled={pagination.page === 1}
            onClick={() => changePage(1)}
          >
            &laquo;
          </button>
          <button 
            className="error-log-viewer__pagination-btn"
            disabled={pagination.page === 1}
            onClick={() => changePage(pagination.page - 1)}
          >
            &lsaquo;
          </button>
          
          <span className="error-log-viewer__pagination-info">
            Page {pagination.page} sur {totalPages}
          </span>
          
          <button 
            className="error-log-viewer__pagination-btn"
            disabled={pagination.page === totalPages}
            onClick={() => changePage(pagination.page + 1)}
          >
            &rsaquo;
          </button>
          <button 
            className="error-log-viewer__pagination-btn"
            disabled={pagination.page === totalPages}
            onClick={() => changePage(totalPages)}
          >
            &raquo;
          </button>
        </div>
      )}
      
      {/* Modal de détails */}
      {selectedLog && (
        <div className="error-log-viewer__modal">
          <div className="error-log-viewer__modal-content">
            <div className="error-log-viewer__modal-header">
              <h3>Détails de l'erreur</h3>
              <button 
                className="error-log-viewer__modal-close"
                onClick={closeDetails}
              >
                &times;
              </button>
            </div>
            
            <div className="error-log-viewer__modal-body">
              <div className="error-log-viewer__detail-group">
                <h4>Informations générales</h4>
                <div className="error-log-viewer__detail-row">
                  <span className="error-log-viewer__detail-label">ID:</span>
                  <span className="error-log-viewer__detail-value">{selectedLog.id}</span>
                </div>
                <div className="error-log-viewer__detail-row">
                  <span className="error-log-viewer__detail-label">Date:</span>
                  <span className="error-log-viewer__detail-value">{formatDate(selectedLog.timestamp)}</span>
                </div>
                <div className="error-log-viewer__detail-row">
                  <span className="error-log-viewer__detail-label">Type:</span>
                  <span className="error-log-viewer__detail-value">{selectedLog.type}</span>
                </div>
                <div className="error-log-viewer__detail-row">
                  <span className="error-log-viewer__detail-label">Module:</span>
                  <span className="error-log-viewer__detail-value">{selectedLog.moduleName || 'N/A'}</span>
                </div>
                <div className="error-log-viewer__detail-row">
                  <span className="error-log-viewer__detail-label">Statut:</span>
                  <span className="error-log-viewer__detail-value">{selectedLog.resolved ? 'Résolu' : 'Actif'}</span>
                </div>
                <div className="error-log-viewer__detail-row">
                  <span className="error-log-viewer__detail-label">URL:</span>
                  <span className="error-log-viewer__detail-value">{selectedLog.url || 'N/A'}</span>
                </div>
                <div className="error-log-viewer__detail-row">
                  <span className="error-log-viewer__detail-label">Agent utilisateur:</span>
                  <span className="error-log-viewer__detail-value">{selectedLog.userAgent || 'N/A'}</span>
                </div>
              </div>
              
              <div className="error-log-viewer__detail-group">
                <h4>Message d'erreur</h4>
                <div className="error-log-viewer__detail-message">
                  {selectedLog.message}
                </div>
              </div>
              
              {selectedLog.stack && (
                <div className="error-log-viewer__detail-group">
                  <h4>Stack trace</h4>
                  <pre className="error-log-viewer__detail-stack">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}
              
              {selectedLog.componentStack && (
                <div className="error-log-viewer__detail-group">
                  <h4>Pile de composants</h4>
                  <pre className="error-log-viewer__detail-stack">
                    {selectedLog.componentStack}
                  </pre>
                </div>
              )}
              
              {selectedLog.context && (
                <div className="error-log-viewer__detail-group">
                  <h4>Contexte</h4>
                  <pre className="error-log-viewer__detail-context">
                    {JSON.stringify(selectedLog.context, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="error-log-viewer__modal-footer">
              {!selectedLog.resolved && (
                <button 
                  className="error-log-viewer__modal-btn error-log-viewer__modal-btn--resolve"
                  onClick={() => markAsResolved(selectedLog.id)}
                >
                  Marquer comme résolu
                </button>
              )}
              <button 
                className="error-log-viewer__modal-btn"
                onClick={closeDetails}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLogViewer;
