import React from 'react';
import { useRouteDetails } from '../../hooks/useApi';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper,
  useTheme
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ElevationProfileProps {
  routeId: string;
  height?: number;
}

interface ElevationPoint {
  distance: number;
  elevation: number;
  gradient: number;
  name?: string;
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({ routeId, height = 300 }) => {
  const theme = useTheme();
  const { data: routeData, loading, error } = useRouteDetails(routeId);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4} height={height}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Chargement du profil d'élévation...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4} color="error.main" height={height}>
        <ErrorOutlineIcon />
        <Typography variant="body1" ml={2}>
          Erreur lors du chargement du profil d'élévation: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!routeData || !routeData.elevation || routeData.elevation.length === 0) {
    return (
      <Box p={4} height={height} display="flex" alignItems="center" justifyContent="center">
        <Typography variant="body1">
          Aucune donnée d'élévation disponible pour cet itinéraire.
        </Typography>
      </Box>
    );
  }

  // Préparer les données pour le graphique
  const elevationData: ElevationPoint[] = [];
  let totalDistance = 0;
  let prevElevation = routeData.elevation[0]?.elevation || 0;
  
  routeData.elevation.forEach((point: any, index: number) => {
    if (index > 0) {
      // Calculer la distance depuis le point précédent (simplification)
      const prevPoint = routeData.coordinates[index-1];
      const currPoint = routeData.coordinates[index];
      
      if (prevPoint && currPoint) {
        const distance = calculateDistance(
          prevPoint[1], prevPoint[0],
          currPoint[1], currPoint[0]
        );
        
        totalDistance += distance;
        
        // Calculer le gradient entre les points
        const elevationDiff = point.elevation - prevElevation;
        const gradient = distance > 0 ? (elevationDiff / (distance * 1000)) * 100 : 0;
        
        elevationData.push({
          distance: parseFloat(totalDistance.toFixed(1)),
          elevation: Math.round(point.elevation),
          gradient: parseFloat(gradient.toFixed(1)),
        });
        
        prevElevation = point.elevation;
      }
    } else {
      // Premier point
      elevationData.push({
        distance: 0,
        elevation: Math.round(point.elevation),
        gradient: 0,
      });
    }
  });
  
  // Ajouter des noms de points à des distances clés si disponibles
  if (routeData.pointsOfInterest) {
    routeData.pointsOfInterest.forEach((poi: any) => {
      // Trouver le point d'élévation le plus proche
      const closestPoint = findClosestElevationPoint(elevationData, poi);
      if (closestPoint) {
        closestPoint.name = poi.name;
      }
    });
  }
  
  // Trouver les points notables pour les référence lines
  const maxElevation = Math.max(...elevationData.map(p => p.elevation));
  const minElevation = Math.min(...elevationData.map(p => p.elevation));
  
  // Trouver les sections avec les pentes les plus raides
  const steepClimbs = elevationData
    .filter(p => p.gradient > 8)
    .sort((a, b) => b.gradient - a.gradient)
    .slice(0, 3);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 1, backgroundColor: 'background.paper' }}>
          <Typography variant="body2">
            <strong>Distance:</strong> {label} km
          </Typography>
          <Typography variant="body2">
            <strong>Altitude:</strong> {payload[0].value} m
          </Typography>
          <Typography variant="body2">
            <strong>Pente:</strong> {payload[0].payload.gradient}%
          </Typography>
          {payload[0].payload.name && (
            <Typography variant="body2" fontWeight="bold" color="primary.main">
              {payload[0].payload.name}
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Profil d'élévation
      </Typography>
      
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Dénivelé positif: <strong>{routeData.statistics?.elevationGain ? Math.round(routeData.statistics.elevationGain) : '?'} m</strong> | 
          Point culminant: <strong>{maxElevation} m</strong> | 
          Distance totale: <strong>{elevationData[elevationData.length-1]?.distance || '?'} km</strong>
        </Typography>
      </Box>
      
      <Box height={height}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={elevationData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="distance" 
              label={{ 
                value: 'Distance (km)', 
                position: 'insideBottomRight', 
                offset: -10 
              }} 
            />
            <YAxis
              label={{ 
                value: 'Altitude (m)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' } 
              }}
              domain={[
                Math.floor(minElevation / 100) * 100, // Arrondi à la centaine inférieure
                Math.ceil(maxElevation / 100) * 100   // Arrondi à la centaine supérieure
              ]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={maxElevation} stroke="#f44336" strokeDasharray="3 3" label="Max" />
            
            {/* Ajouter des références pour les montées raides */}
            {steepClimbs.map((climb, index) => (
              <ReferenceLine 
                key={index}
                x={climb.distance} 
                stroke="#ff9800" 
                strokeDasharray="3 3" 
                label={`${climb.gradient}%`} 
              />
            ))}
            
            <Line 
              type="monotone" 
              dataKey="elevation" 
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 8, fill: theme.palette.secondary.main }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

// Fonction pour calculer la distance entre deux points en km (formule de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Fonction pour trouver le point d'élévation le plus proche d'un POI
function findClosestElevationPoint(elevationData: ElevationPoint[], poi: any): ElevationPoint | null {
  if (!poi.distance) return null;
  
  let closest = elevationData[0];
  let minDiff = Math.abs(closest.distance - poi.distance);
  
  elevationData.forEach(point => {
    const diff = Math.abs(point.distance - poi.distance);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  });
  
  return closest;
}

export default ElevationProfile;
