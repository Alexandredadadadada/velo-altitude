import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";
import './PassComparison.css';

const PassComparison = ({ passId1, passId2 }) => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('elevation');
  const comparisonRef = useRef(null);
  
  // Charger les données de comparaison
  useEffect(() => {
    setLoading(true);
    axios.get(`/api/visualization/passes/compare/${passId1}/${passId2}`)
      .then(response => {
        if (response.data.status === 'success') {
          setComparisonData(response.data.data);
        } else {
          setError('Erreur lors du chargement des données');
        }
      })
      .catch(err => {
        console.error('Erreur lors de la récupération des données de comparaison', err);
        setError(`Erreur lors de la récupération des données: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [passId1, passId2]);

  // Préparer les données pour les graphiques d'élévation
  const prepareElevationChartData = () => {
    if (!comparisonData) return [];
    
    const pass1 = comparisonData.pass1;
    const pass2 = comparisonData.pass2;
    
    // Normaliser les profils d'élévation pour avoir le même nombre de points
    const normalize = (profile, count) => {
      if (!profile || profile.length === 0) return [];
      
      const result = [];
      const step = profile.length / count;
      
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(i * step);
        if (profile[idx]) {
          result.push(profile[idx]);
        }
      }
      
      return result;
    };
    
    const normalizedCount = 100; // Nombre de points à afficher
    const profile1 = normalize(pass1.visualization.elevationProfile, normalizedCount);
    const profile2 = normalize(pass2.visualization.elevationProfile, normalizedCount);
    
    // Créer les données pour le graphique
    return Array.from({ length: normalizedCount }, (_, i) => {
      const point1 = profile1[i] || [0, 0];
      const point2 = profile2[i] || [0, 0];
      
      return {
        distance: (i / normalizedCount * 100).toFixed(1) + '%', // Distance en pourcentage
        elevation1: point1[1],
        elevation2: point2[1]
      };
    });
  };
  
  // Préparer les données pour le graphique de segments par difficulté
  const prepareSegmentChartData = () => {
    if (!comparisonData) return [];
    
    const comparison = comparisonData.comparison.segmentsByDifficulty;
    
    return Object.keys(comparison).map(difficulty => ({
      difficulty,
      pass1: comparison[difficulty].percentagePass1,
      pass2: comparison[difficulty].percentagePass2
    }));
  };
  
  // Préparer les données pour le graphique de métriques
  const prepareMetricsChartData = () => {
    if (!comparisonData) return [];
    
    const { length, elevationGain, averageGradient, maxGradient } = comparisonData.comparison;
    
    return [
      {
        name: 'Longueur (km)',
        pass1: length.pass1,
        pass2: length.pass2
      },
      {
        name: 'Dénivelé (m)',
        pass1: elevationGain.pass1,
        pass2: elevationGain.pass2
      },
      {
        name: 'Pente moy. (%)',
        pass1: averageGradient.pass1,
        pass2: averageGradient.pass2
      },
      {
        name: 'Pente max. (%)',
        pass1: maxGradient.pass1,
        pass2: maxGradient.pass2
      }
    ];
  };
  
  // Exporter au format PDF
  const exportToPDF = () => {
    if (!comparisonRef.current) return;
    
    html2canvas(comparisonRef.current, {
      scale: 2,
      logging: false,
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      
      // Ajouter le titre
      pdf.setFontSize(18);
      pdf.text(`Comparaison: ${comparisonData.pass1.name} vs. ${comparisonData.pass2.name}`, 14, 20);
      
      // Ajouter l'image
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      pdf.save(`Comparaison-${comparisonData.pass1.name}-${comparisonData.pass2.name}.pdf`);
    });
  };
  
  // Exporter au format image
  const exportToImage = () => {
    if (!comparisonRef.current) return;
    
    html2canvas(comparisonRef.current, {
      scale: 2,
      logging: false,
      useCORS: true
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Comparaison-${comparisonData.pass1.name}-${comparisonData.pass2.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };
  
  if (loading) {
    return <div className="pass-comparison-loading">Chargement des données de comparaison...</div>;
  }

  if (error) {
    return <div className="pass-comparison-error">Erreur: {error}</div>;
  }

  if (!comparisonData) {
    return <div className="pass-comparison-error">Aucune donnée de comparaison disponible</div>;
  }
  
  const { pass1, pass2, comparison, analysisText } = comparisonData;
  
  return (
    <div className="pass-comparison-container">
      <div className="pass-comparison-header">
        <h2>Comparaison de cols</h2>
        <div className="pass-comparison-export-buttons">
          <button onClick={exportToPDF}>
            <i className="fas fa-file-pdf"></i> Exporter en PDF
          </button>
          <button onClick={exportToImage}>
            <i className="fas fa-file-image"></i> Exporter en image
          </button>
        </div>
      </div>
      
      <div className="pass-comparison-titles">
        <div className="pass-title pass1">{pass1.name}</div>
        <div className="pass-title-vs">VS</div>
        <div className="pass-title pass2">{pass2.name}</div>
      </div>
      
      <div className="pass-comparison-tabs">
        <button 
          className={activeTab === 'elevation' ? 'active' : ''} 
          onClick={() => setActiveTab('elevation')}
        >
          Profil d'élévation
        </button>
        <button 
          className={activeTab === 'segments' ? 'active' : ''} 
          onClick={() => setActiveTab('segments')}
        >
          Segments par difficulté
        </button>
        <button 
          className={activeTab === 'metrics' ? 'active' : ''} 
          onClick={() => setActiveTab('metrics')}
        >
          Métriques clés
        </button>
      </div>
      
      <div className="pass-comparison-content" ref={comparisonRef}>
        {activeTab === 'elevation' && (
          <div className="pass-comparison-chart elevation-chart">
            <h3>Comparaison des profils d'élévation</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={prepareElevationChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="distance" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}m`, 
                    name === 'elevation1' ? pass1.name : pass2.name
                  ]}
                />
                <Legend 
                  payload={[
                    { value: pass1.name, type: 'line', color: '#8884d8' },
                    { value: pass2.name, type: 'line', color: '#82ca9d' }
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="elevation1" 
                  stroke="#8884d8" 
                  strokeWidth={2} 
                  dot={false} 
                  name={pass1.name}
                />
                <Line 
                  type="monotone" 
                  dataKey="elevation2" 
                  stroke="#82ca9d" 
                  strokeWidth={2} 
                  dot={false} 
                  name={pass2.name}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {activeTab === 'segments' && (
          <div className="pass-comparison-chart segments-chart">
            <h3>Répartition des segments par difficulté</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={prepareSegmentChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value.toFixed(1)}%`, 
                    name === 'pass1' ? pass1.name : pass2.name
                  ]}
                />
                <Legend 
                  payload={[
                    { value: pass1.name, type: 'rect', color: '#8884d8' },
                    { value: pass2.name, type: 'rect', color: '#82ca9d' }
                  ]}
                />
                <Bar dataKey="pass1" fill="#8884d8" name={pass1.name} />
                <Bar dataKey="pass2" fill="#82ca9d" name={pass2.name} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {activeTab === 'metrics' && (
          <div className="pass-comparison-chart metrics-chart">
            <h3>Comparaison des métriques clés</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={prepareMetricsChartData()} 
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === 'pass1' ? pass1.name : pass2.name
                  ]}
                />
                <Legend 
                  payload={[
                    { value: pass1.name, type: 'rect', color: '#8884d8' },
                    { value: pass2.name, type: 'rect', color: '#82ca9d' }
                  ]}
                />
                <Bar dataKey="pass1" fill="#8884d8" name={pass1.name} />
                <Bar dataKey="pass2" fill="#82ca9d" name={pass2.name} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="pass-comparison-table">
          <h3>Tableau comparatif</h3>
          <table>
            <thead>
              <tr>
                <th>Métrique</th>
                <th>{pass1.name}</th>
                <th>{pass2.name}</th>
                <th>Différence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Longueur</td>
                <td>{comparison.length.pass1} km</td>
                <td>{comparison.length.pass2} km</td>
                <td className={comparison.length.difference > 0 ? 'positive' : 'negative'}>
                  {Math.abs(comparison.length.difference).toFixed(1)} km {comparison.length.difference > 0 ? 'de plus' : 'de moins'}
                </td>
              </tr>
              <tr>
                <td>Dénivelé</td>
                <td>{comparison.elevationGain.pass1} m</td>
                <td>{comparison.elevationGain.pass2} m</td>
                <td className={comparison.elevationGain.difference > 0 ? 'positive' : 'negative'}>
                  {Math.abs(comparison.elevationGain.difference)} m {comparison.elevationGain.difference > 0 ? 'de plus' : 'de moins'}
                </td>
              </tr>
              <tr>
                <td>Pente moyenne</td>
                <td>{comparison.averageGradient.pass1.toFixed(1)} %</td>
                <td>{comparison.averageGradient.pass2.toFixed(1)} %</td>
                <td className={comparison.averageGradient.difference > 0 ? 'positive' : 'negative'}>
                  {Math.abs(comparison.averageGradient.difference).toFixed(1)} % {comparison.averageGradient.difference > 0 ? 'de plus' : 'de moins'}
                </td>
              </tr>
              <tr>
                <td>Pente maximale</td>
                <td>{comparison.maxGradient.pass1.toFixed(1)} %</td>
                <td>{comparison.maxGradient.pass2.toFixed(1)} %</td>
                <td className={comparison.maxGradient.difference > 0 ? 'positive' : 'negative'}>
                  {Math.abs(comparison.maxGradient.difference).toFixed(1)} % {comparison.maxGradient.difference > 0 ? 'de plus' : 'de moins'}
                </td>
              </tr>
              <tr>
                <td>Difficulté</td>
                <td>{comparison.difficulty.pass1}</td>
                <td>{comparison.difficulty.pass2}</td>
                <td>{comparison.difficulty.comparison}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="pass-comparison-analysis">
          <h3>Analyse comparative</h3>
          {analysisText.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PassComparison;
