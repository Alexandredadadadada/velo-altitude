import React from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

/**
 * Composant de comparaison des zones de puissance
 * Permet de visualiser les plages de puissance pour chaque zone et comparer avec des cyclistes de niveau similaire
 */
const ZonePowerComparisonChart = ({ zones, ftp, compareMode, userProfile }) => {
  const theme = useTheme();
  
  // Préparation des données pour le graphique
  const data = zones.map(zone => ({
    id: zone.id,
    name: `Z${zone.id}`,
    fullName: zone.name,
    min: zone.min,
    max: zone.max,
    range: zone.max - zone.min,
    color: zone.color,
    // Données fictives pour la comparaison avec d'autres cyclistes
    avgMin: Math.round(zone.min * (0.9 + Math.random() * 0.2)),
    avgMax: Math.round(zone.max * (0.9 + Math.random() * 0.2)),
  }));
  
  // Personnalisation du tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const zoneData = payload[0].payload;
      
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            boxShadow: theme.shadows[3],
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ borderBottom: `2px solid ${zoneData.color}`, pb: 1, mb: 1 }}>
            <strong>{zoneData.fullName}</strong>
          </Box>
          
          <Box sx={{ fontSize: '0.85rem' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <span>Min:</span>
              <strong>{zoneData.min} W</strong>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <span>Max:</span>
              <strong>{zoneData.max} W</strong>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px dashed ${theme.palette.divider}`, pt: 0.5, mt: 0.5 }}>
              <span>Plage:</span>
              <strong>{zoneData.range} W</strong>
            </Box>
            
            {compareMode && (
              <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, mb: 0.5 }}>
                  Cyclistes similaires:
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <span>Min:</span>
                  <strong>{zoneData.avgMin} W</strong>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Max:</span>
                  <strong>{zoneData.avgMax} W</strong>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      );
    }
    
    return null;
  };
  
  // Génération des barres de comparaison
  const renderBars = () => {
    const bars = [
      <Bar 
        key="power" 
        dataKey="range" 
        name="Vos zones" 
        stackId="a" 
        fill={theme.palette.primary.main}
        radius={[4, 4, 0, 0]}
      >
        {data.map((entry, index) => (
          <motion.rect 
            key={`power-${index}`} 
            fill={entry.color} 
            initial={{ opacity: 0.5, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          />
        ))}
      </Bar>
    ];
    
    // Ajouter les barres de comparaison si le mode est activé
    if (compareMode) {
      bars.push(
        <Bar 
          key="avgPower" 
          dataKey="avgMax" 
          name="Cyclistes similaires" 
          stackId="b" 
          fill="transparent"
          stroke={theme.palette.grey[500]}
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      );
    }
    
    return bars;
  };
  
  // Calcul des limites du graphique
  const maxPower = Math.max(...zones.map(zone => zone.max), ftp * 1.1);
  
  // Animation à l'entrée
  const chartAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div 
      style={{ width: '100%', height: '100%' }}
      initial="hidden"
      animate="visible"
      variants={chartAnimation}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis 
            type="number"
            domain={[0, maxPower]}
            tickFormatter={(value) => `${value}W`}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            scale="band" 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          
          {/* Ligne de référence pour le FTP */}
          <ReferenceLine 
            x={ftp} 
            stroke={theme.palette.error.main} 
            strokeWidth={2} 
            strokeDasharray="3 3"
            label={{ 
              value: `FTP: ${ftp}W`, 
              position: 'insideTopRight',
              fill: theme.palette.error.main,
              fontSize: 12
            }}
          />
          
          {renderBars()}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default ZonePowerComparisonChart;
