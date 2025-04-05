import React, { useEffect, useRef } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

/**
 * Composant de visualisation de la distribution du temps passé dans chaque zone d'entraînement
 * Affiche un graphique en secteurs interactif
 */
const ZoneDistributionChart = ({ zones, distribution, onZoneSelect, selectedZone }) => {
  const theme = useTheme();
  const chartRef = useRef(null);
  
  // Préparer les données pour le graphique
  const data = zones.map((zone, index) => ({
    id: zone.id,
    name: `Zone ${zone.id}`,
    value: distribution[index] || 0,
    color: zone.color,
    fullName: zone.name
  }));
  
  // Personnalisation du tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, fullName } = payload[0].payload;
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
          <Typography variant="subtitle2" gutterBottom>{fullName}</Typography>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>{value}%</span>
            <span style={{ marginLeft: 5, color: theme.palette.text.secondary }}>du temps total</span>
          </Typography>
        </Box>
      );
    }
    return null;
  };
  
  // Personnalisation de la légende
  const renderLegend = (props) => {
    const { payload } = props;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
        {payload.map((entry, index) => {
          const isSelected = selectedZone && selectedZone.id === entry.payload.id;
          
          return (
            <motion.div
              key={`item-${index}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onZoneSelect(zones[entry.payload.id - 1])}
              style={{ cursor: 'pointer' }}
            >
              <Box 
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mx: 1,
                  my: 0.5,
                  p: 0.5,
                  borderRadius: 1,
                  bgcolor: isSelected ? alpha(entry.color, 0.2) : 'transparent',
                  border: isSelected ? `1px solid ${entry.color}` : '1px solid transparent',
                }}
              >
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: entry.color,
                    mr: 1
                  }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: isSelected ? 'bold' : 'normal',
                    color: isSelected ? entry.color : 'text.primary'
                  }}
                >
                  {entry.value} ({distribution[entry.payload.id - 1]}%)
                </Typography>
              </Box>
            </motion.div>
          );
        })}
      </Box>
    );
  };
  
  // Animation à l'entrée
  const pieAnimation = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  
  // Rendu du composant
  return (
    <motion.div 
      style={{ width: '100%', height: '100%' }}
      initial="hidden"
      animate="visible"
      variants={pieAnimation}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart ref={chartRef}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            animationDuration={500}
            animationEasing="ease-out"
            onClick={(data) => onZoneSelect(zones[data.id - 1])}
          >
            {data.map((entry, index) => {
              const isSelected = selectedZone && selectedZone.id === entry.id;
              
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  fillOpacity={isSelected ? 1 : 0.8}
                  stroke={isSelected ? theme.palette.common.white : entry.color}
                  strokeWidth={isSelected ? 2 : 0}
                />
              );
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} layout="horizontal" verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default ZoneDistributionChart;
