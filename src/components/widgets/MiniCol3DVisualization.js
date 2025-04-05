import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem } from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useTranslation } from 'react-i18next';

// Simplified terrain model for widget view
const MiniTerrain = ({ elevationData, surfaceTypes }) => {
  const meshRef = useRef();

  // Create a simplified geometry
  useEffect(() => {
    if (!meshRef.current) return;
    
    // Add simplified shader effect for better performance
    meshRef.current.material.wireframe = false;
    meshRef.current.material.flatShading = true;
  }, [meshRef]);

  // Generate vertices based on elevation data
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];

  // Create a simplified 3D model from elevation data
  // This is a simplified version for the widget
  for (let i = 0; i < elevationData.width; i++) {
    for (let j = 0; j < elevationData.width; j++) {
      const x = i / elevationData.width - 0.5;
      const y = elevationData.heights[i][j] / 1000;
      const z = j / elevationData.width - 0.5;
      
      positions.push(x * 10, y, z * 10);
      normals.push(0, 1, 0);
      
      // Add color based on elevation
      const normalizedHeight = elevationData.heights[i][j] / 2000;
      colors.push(
        0.2 + normalizedHeight * 0.3, 
        0.4 + normalizedHeight * 0.3, 
        0.2
      );
    }
  }

  // Add simple indices for the geometry
  for (let i = 0; i < elevationData.width - 1; i++) {
    for (let j = 0; j < elevationData.width - 1; j++) {
      const a = i * elevationData.width + j;
      const b = i * elevationData.width + j + 1;
      const c = (i + 1) * elevationData.width + j;
      const d = (i + 1) * elevationData.width + j + 1;
      
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  return (
    <mesh ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={new Float32Array(positions)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-normal"
          count={normals.length / 3}
          array={new Float32Array(normals)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={new Float32Array(colors)}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          array={new Uint16Array(indices)}
          itemSize={1}
        />
      </bufferGeometry>
      <meshStandardMaterial
        vertexColors
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

const MiniCol3DVisualization = ({ onClose }) => {
  const { t } = useTranslation();
  const [favoriteCols, setFavoriteCols] = useState([]);
  const [selectedCol, setSelectedCol] = useState(null);

  // Fetch favorite cols on component mount
  useEffect(() => {
    // Mock data - replace with actual API call
    const mockFavoriteCols = [
      { 
        id: '1', 
        name: 'Col du Galibier', 
        elevation: 2642,
        elevationData: {
          width: 10,
          heights: Array(10).fill().map(() => Array(10).fill(100).map(() => Math.random() * 200 + 800))
        },
        surfaceTypes: {
          dominant: 'asphalt',
          sections: [
            { start: 0, end: 100, type: 'asphalt' }
          ]
        }
      },
      { 
        id: '2', 
        name: 'Alpe d\'Huez', 
        elevation: 1860,
        elevationData: {
          width: 10,
          heights: Array(10).fill().map(() => Array(10).fill(100).map(() => Math.random() * 150 + 700))
        },
        surfaceTypes: {
          dominant: 'asphalt',
          sections: [
            { start: 0, end: 100, type: 'asphalt' }
          ]
        }
      },
      { 
        id: '3', 
        name: 'Mont Ventoux', 
        elevation: 1909,
        elevationData: {
          width: 10,
          heights: Array(10).fill().map(() => Array(10).fill(100).map(() => Math.random() * 180 + 750))
        },
        surfaceTypes: {
          dominant: 'asphalt',
          sections: [
            { start: 0, end: 80, type: 'asphalt' },
            { start: 80, end: 100, type: 'gravel' }
          ]
        }
      }
    ];
    
    setFavoriteCols(mockFavoriteCols);
    if (mockFavoriteCols.length > 0) {
      setSelectedCol(mockFavoriteCols[0]);
    }
  }, []);

  const handleColChange = (event) => {
    const colId = event.target.value;
    const col = favoriteCols.find(c => c.id === colId);
    setSelectedCol(col);
  };

  if (!selectedCol) {
    return (
      <Card sx={{ minWidth: 275, maxWidth: 350, height: 300 }}>
        <CardContent>
          <Typography variant="h6">{t('loading')}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 275, maxWidth: 350, height: 300 }}>
      <CardContent sx={{ padding: 2, height: '100%' }}>
        <Typography variant="h6" component="div" gutterBottom>
          {t('favoriteCols3D')}
        </Typography>
        
        <Box sx={{ mb: 1 }}>
          <Select
            size="small"
            value={selectedCol.id}
            onChange={handleColChange}
            fullWidth
          >
            {favoriteCols.map(col => (
              <MenuItem key={col.id} value={col.id}>
                {col.name} ({col.elevation}m)
              </MenuItem>
            ))}
          </Select>
        </Box>
        
        <Box sx={{ height: 190, width: '100%' }}>
          <Canvas
            camera={{ position: [0, 5, 10], fov: 50 }}
            shadows
            style={{ background: '#e0e0e0' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <OrbitControls enableZoom={true} enablePan={false} />
            {selectedCol && (
              <MiniTerrain 
                elevationData={selectedCol.elevationData}
                surfaceTypes={selectedCol.surfaceTypes}
              />
            )}
          </Canvas>
        </Box>
        
        <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
          {t('clickForFullView')}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MiniCol3DVisualization;
