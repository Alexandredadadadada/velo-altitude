import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, 
  PolarAngleAxis, Radar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ColVisualization3D from './ColVisualization3D';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Service pour charger les données des cols
const fetchColData = async (colId) => {
  try {
    // Simuler un appel API - à remplacer par un vrai appel API
    const response = await fetch(`/api/cols/${colId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch col data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching col data:', error);
    // Données fictives en cas d'erreur
    return {
      id: colId,
      name: `Col ${colId}`,
      elevation: Math.floor(Math.random() * 1000) + 500,
      length: Math.floor(Math.random() * 10) + 5,
      gradient: Math.floor(Math.random() * 10) + 5,
      difficulty: Math.floor(Math.random() * 5) + 1,
      elevationData: {
        width: 10,
        heights: Array(10).fill().map(() => Array(10).fill(Math.floor(Math.random() * 1000) + 500))
      },
      surfaceTypes: {
        dominant: ['asphalt', 'gravel', 'dirt'][Math.floor(Math.random() * 3)],
        sections: [
          { start: 0, end: 50, type: 'asphalt' },
          { start: 50, end: 75, type: 'gravel' },
          { start: 75, end: 100, type: 'dirt' }
        ]
      },
      elevationProfile: Array(20).fill().map((_, i) => ({
        distance: i * 0.5,
        elevation: Math.floor(Math.random() * 300) + 500 + (i * 20)
      })),
      weatherStats: {
        temperature: Math.floor(Math.random() * 15) + 10,
        wind: Math.floor(Math.random() * 20) + 5,
        precipitation: Math.floor(Math.random() * 50),
        sunshine: Math.floor(Math.random() * 70) + 30
      }
    };
  }
};

const ColComparison = ({ pass1Id, pass2Id }) => {
  const { t, i18n } = useTranslation();
  const [pass1, setPass1] = useState(null);
  const [pass2, setPass2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data1, data2] = await Promise.all([
          fetchColData(pass1Id),
          fetchColData(pass2Id)
        ]);
        setPass1(data1);
        setPass2(data2);
      } catch (err) {
        setError(err.message || 'Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pass1Id, pass2Id]);

  const handleExportPDF = async () => {
    const input = document.getElementById('comparison-container');
    if (!input) return;
    
    try {
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`comparison_${pass1?.name}_${pass2?.name}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  if (loading) {
    return <div className="loader">{t('loading')}</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!pass1 || !pass2) {
    return <div>{t('noData')}</div>;
  }

  // Données pour le graphique d'élévation
  const elevationData = pass1.elevationProfile.map((point, index) => ({
    distance: point.distance,
    [pass1.name]: point.elevation,
    [pass2.name]: pass2.elevationProfile[index]?.elevation || 0
  }));

  // Données pour le graphique radar
  const radarData = [
    { subject: t('difficulty'), [pass1.name]: pass1.difficulty, [pass2.name]: pass2.difficulty },
    { subject: t('gradient'), [pass1.name]: pass1.gradient, [pass2.name]: pass2.gradient },
    { subject: t('length'), [pass1.name]: pass1.length / 10, [pass2.name]: pass2.length / 10 },
    { subject: t('elevation'), [pass1.name]: pass1.elevation / 100, [pass2.name]: pass2.elevation / 100 },
  ];

  // Données pour le graphique des conditions météo
  const weatherData = [
    { name: t('temperature'), [pass1.name]: pass1.weatherStats.temperature, [pass2.name]: pass2.weatherStats.temperature },
    { name: t('wind'), [pass1.name]: pass1.weatherStats.wind, [pass2.name]: pass2.weatherStats.wind },
    { name: t('precipitation'), [pass1.name]: pass1.weatherStats.precipitation, [pass2.name]: pass2.weatherStats.precipitation },
    { name: t('sunshine'), [pass1.name]: pass1.weatherStats.sunshine, [pass2.name]: pass2.weatherStats.sunshine }
  ];

  return (
    <div id="comparison-container" className="col-comparison">
      <div className="comparison-header">
        <h2>{t('comparing')} {pass1.name} & {pass2.name}</h2>
        <button onClick={handleExportPDF} className="export-btn">
          {t('exportPDF')}
        </button>
      </div>

      <div className="comparison-visualizations">
        <div className="col-visual">
          <h3>{pass1.name}</h3>
          <ColVisualization3D 
            passId={pass1.id}
            elevationData={pass1.elevationData}
            surfaceTypes={pass1.surfaceTypes}
            pointsOfInterest={[]}
          />
        </div>
        <div className="col-visual">
          <h3>{pass2.name}</h3>
          <ColVisualization3D 
            passId={pass2.id}
            elevationData={pass2.elevationData}
            surfaceTypes={pass2.surfaceTypes}
            pointsOfInterest={[]}
          />
        </div>
      </div>

      <div className="comparison-metrics">
        <h3>{t('elevationProfile')}</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={elevationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="distance" label={{ value: t('distance') + ' (km)', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: t('elevation') + ' (m)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={pass1.name} stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey={pass2.name} stroke="#82ca9d" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <h3>{t('characteristicsComparison')}</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart outerRadius={90} data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <Radar name={pass1.name} dataKey={pass1.name} stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name={pass2.name} dataKey={pass2.name} stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <h3>{t('weatherConditions')}</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weatherData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={pass1.name} fill="#8884d8" />
              <Bar dataKey={pass2.name} fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="comparison-table">
        <h3>{t('detailedComparison')}</h3>
        <table>
          <thead>
            <tr>
              <th>{t('attribute')}</th>
              <th>{pass1.name}</th>
              <th>{pass2.name}</th>
              <th>{t('difference')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('maximumElevation')}</td>
              <td>{pass1.elevation} m</td>
              <td>{pass2.elevation} m</td>
              <td>{Math.abs(pass1.elevation - pass2.elevation)} m</td>
            </tr>
            <tr>
              <td>{t('length')}</td>
              <td>{pass1.length} km</td>
              <td>{pass2.length} km</td>
              <td>{Math.abs(pass1.length - pass2.length)} km</td>
            </tr>
            <tr>
              <td>{t('averageGradient')}</td>
              <td>{pass1.gradient}%</td>
              <td>{pass2.gradient}%</td>
              <td>{Math.abs(pass1.gradient - pass2.gradient)}%</td>
            </tr>
            <tr>
              <td>{t('difficultyRating')}</td>
              <td>{pass1.difficulty}/5</td>
              <td>{pass2.difficulty}/5</td>
              <td>{Math.abs(pass1.difficulty - pass2.difficulty)}</td>
            </tr>
            <tr>
              <td>{t('dominantSurface')}</td>
              <td>{t(pass1.surfaceTypes.dominant)}</td>
              <td>{t(pass2.surfaceTypes.dominant)}</td>
              <td>{pass1.surfaceTypes.dominant === pass2.surfaceTypes.dominant ? t('same') : t('different')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColComparison;
