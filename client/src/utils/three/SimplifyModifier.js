/**
 * SimplifyModifier pour Three.js
 * Basé sur le SimplifyModifier de Three.js examples
 * Permet de simplifier les géométries 3D pour améliorer les performances
 * 
 * Adapté et optimisé pour Velo-Altitude
 */

import * as THREE from 'three';

// Classe utilitaire pour gérer les triangles
class Triangle {
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
    
    this.v1 = new THREE.Vector3();
    this.v2 = new THREE.Vector3();
    this.v3 = new THREE.Vector3();
    
    this.computeNormal();
    
    this.deleted = false;
  }
  
  computeNormal() {
    this.v1.subVectors(this.c, this.b);
    this.v2.subVectors(this.a, this.b);
    this.v3.crossVectors(this.v1, this.v2).normalize();
    return this.v3;
  }
}

// Classe utilitaire pour gérer les bords partagés
class Edge {
  constructor(a, b) {
    this.a = Math.min(a, b);
    this.b = Math.max(a, b);
    this.faces = [];
    this.cost = 0;
    this.processed = false;
  }
}

// Classe utilitaire pour gérer les vertex
class Vertex {
  constructor(position, index) {
    this.position = position;  // Vector3
    this.index = index;        // Original index dans la géométrie
    this.cost = 0;             // Coût de suppression
    this.collapsed = false;    // Si le vertex a été fusionné
    this.faces = [];           // Triangles adjacents
    this.neighbors = [];       // Vertex voisins
    this.collapseCost = {};    // Coût de fusion avec chaque voisin
    this.collapseTarget = null; // Cible de fusion optimale
  }
}

class SimplifyModifier {
  constructor() {
    this.computeEdgeCostFunc = this.computeEdgeCost.bind(this);
  }
  
  /**
   * Simplifie une géométrie Three.js
   * 
   * @param {THREE.BufferGeometry} geometry - Géométrie à simplifier
   * @param {number} percentage - Pourcentage de réduction (0-1)
   * @param {boolean} preserveBoundaries - Conserver les limites de la géométrie
   * @param {boolean} preserveUVs - Conserver les coordonnées UV
   * @returns {THREE.BufferGeometry} Géométrie simplifiée
   */
  simplify(geometry, percentage, preserveBoundaries = true, preserveUVs = true) {
    if (!geometry.isBufferGeometry) {
      console.error('SimplifyModifier: Geometry n\'est pas une BufferGeometry.');
      return geometry;
    }
    
    if (percentage >= 1.0) {
      return geometry;
    }
    
    // Calculer le nombre de triangles à conserver
    const attributes = geometry.attributes;
    
    if (!attributes.position) {
      console.error('SimplifyModifier: Geometry n\'a pas d\'attribut position.');
      return geometry;
    }
    
    if (attributes.position.itemSize !== 3) {
      console.error('SimplifyModifier: Attribut position doit être de taille 3.');
      return geometry;
    }
    
    // Extraire les positions
    const positions = attributes.position.array;
    let vertices = [];
    
    // Créer les vertex
    for (let i = 0; i < positions.length; i += 3) {
      const position = new THREE.Vector3(
        positions[i], 
        positions[i + 1], 
        positions[i + 2]
      );
      
      vertices.push(new Vertex(position, i / 3));
    }
    
    // Extraire les triangles
    let triangles = [];
    
    if (geometry.index) {
      // Géométrie indexée
      const indices = geometry.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];
        
        const triangle = new Triangle(vertices[a], vertices[b], vertices[c]);
        triangles.push(triangle);
        
        // Garder les références
        vertices[a].faces.push(triangle);
        vertices[b].faces.push(triangle);
        vertices[c].faces.push(triangle);
      }
    } else {
      // Géométrie non indexée
      for (let i = 0; i < positions.length / 3; i += 3) {
        const a = i;
        const b = i + 1;
        const c = i + 2;
        
        const triangle = new Triangle(vertices[a], vertices[b], vertices[c]);
        triangles.push(triangle);
        
        // Garder les références
        vertices[a].faces.push(triangle);
        vertices[b].faces.push(triangle);
        vertices[c].faces.push(triangle);
      }
    }
    
    // Construire un graphe des edges
    let edges = this.computeEdges(vertices, triangles);
    
    // Calculer les coûts de suppression
    this.computeVertexCosts(vertices, edges, preserveBoundaries);
    
    // Réduire la géométrie
    const targetTriangleCount = Math.max(1, Math.floor(triangles.length * percentage));
    this.reduce(vertices, edges, triangles, targetTriangleCount);
    
    // Construire la géométrie simplifiée
    return this.createSimplifiedGeometry(geometry, vertices, triangles, preserveUVs);
  }
  
  /**
   * Construit le graphe des edges
   */
  computeEdges(vertices, triangles) {
    const edges = [];
    const edgeDict = {};
    
    // Ajouter un edge à la liste
    function addEdge(a, b, triangle) {
      const edgeKey = `${Math.min(a, b)}-${Math.max(a, b)}`;
      
      if (!edgeDict[edgeKey]) {
        const edge = new Edge(a, b);
        edge.faces.push(triangle);
        edgeDict[edgeKey] = edges.length;
        edges.push(edge);
      } else {
        const edge = edges[edgeDict[edgeKey]];
        edge.faces.push(triangle);
      }
    }
    
    // Parcourir les triangles
    for (let i = 0; i < triangles.length; i++) {
      const triangle = triangles[i];
      
      addEdge(triangle.a.index, triangle.b.index, triangle);
      addEdge(triangle.b.index, triangle.c.index, triangle);
      addEdge(triangle.c.index, triangle.a.index, triangle);
    }
    
    return edges;
  }
  
  /**
   * Calcule le coût de suppression d'un edge
   */
  computeEdgeCost(vertA, vertB) {
    // Implémenter une métrique de coût pour l'edge collapse
    // Plus la courbure est importante, plus le coût est élevé
    
    const edgeLength = vertA.position.distanceTo(vertB.position);
    
    // Calculer la déviation normale entre les triangles adjacents
    let curvature = 0;
    
    // Trouver les triangles partagés
    const sharedFaces = vertA.faces.filter(face => 
      vertB.faces.includes(face)
    );
    
    if (sharedFaces.length > 1) {
      // Calculer la courbure en comparant les normales des triangles
      for (let i = 0; i < sharedFaces.length; i++) {
        for (let j = i + 1; j < sharedFaces.length; j++) {
          // Différence entre les normales
          const normalDeviation = 1 - sharedFaces[i].computeNormal().dot(sharedFaces[j].computeNormal());
          curvature += normalDeviation;
        }
      }
      
      // Normaliser la courbure
      curvature /= sharedFaces.length * (sharedFaces.length - 1) / 2;
    }
    
    // Le coût est une combinaison de la longueur de l'arête et de la courbure
    // Plus l'arête est longue et plus la courbure est élevée, plus le coût est élevé
    return edgeLength * (1 + curvature * 10);
  }
  
  /**
   * Calcule les coûts de suppression pour tous les vertex
   */
  computeVertexCosts(vertices, edges, preserveBoundaries) {
    // Identifier les vertex de bordure si nécessaire
    if (preserveBoundaries) {
      for (const edge of edges) {
        if (edge.faces.length === 1) {
          // Edge de bordure - marquer les vertex
          vertices[edge.a].isBoundary = true;
          vertices[edge.b].isBoundary = true;
        }
      }
    }
    
    // Calculer les coûts de suppression
    for (const edge of edges) {
      const vertA = vertices[edge.a];
      const vertB = vertices[edge.b];
      
      // Vérifier si ce sont des vertex de bordure à préserver
      if (preserveBoundaries && (vertA.isBoundary && vertB.isBoundary)) {
        // Coût élevé pour préserver les bordures
        edge.cost = 1000;
      } else {
        // Calculer le coût normal
        edge.cost = this.computeEdgeCostFunc(vertA, vertB);
      }
      
      // Maintenir les voisins
      if (!vertA.neighbors.includes(vertB.index)) {
        vertA.neighbors.push(vertB.index);
      }
      
      if (!vertB.neighbors.includes(vertA.index)) {
        vertB.neighbors.push(vertA.index);
      }
      
      // Stocker le coût pour cet edge
      vertA.collapseCost[vertB.index] = edge.cost;
      vertB.collapseCost[vertA.index] = edge.cost;
    }
    
    // Déterminer les cibles optimales de collapse pour chaque vertex
    for (const vertex of vertices) {
      if (vertex.neighbors.length === 0) continue;
      
      // Trouver le voisin avec le coût minimum
      let minCost = Infinity;
      let minVert = null;
      
      for (const neighborIdx of vertex.neighbors) {
        const cost = vertex.collapseCost[neighborIdx];
        if (cost < minCost) {
          minCost = cost;
          minVert = neighborIdx;
        }
      }
      
      // Stocker la cible optimale
      vertex.collapseTarget = minVert;
      vertex.cost = minCost;
    }
  }
  
  /**
   * Réduit la géométrie jusqu'au nombre cible de triangles
   */
  reduce(vertices, edges, triangles, targetTriangleCount) {
    // Trier les vertex par coût
    let sortedVertices = vertices
      .map((v, i) => ({ index: i, cost: v.cost }))
      .filter(v => v.cost !== undefined && v.cost < 1000) // Exclure les vertex de bordure
      .sort((a, b) => a.cost - b.cost);
    
    let currentTriangleCount = triangles.filter(t => !t.deleted).length;
    
    // Supprimer les vertex jusqu'à atteindre la cible
    while (sortedVertices.length > 0 && currentTriangleCount > targetTriangleCount) {
      // Prendre le vertex avec le coût le plus bas
      const vertIdx = sortedVertices.shift().index;
      const vertex = vertices[vertIdx];
      
      // Vérifier s'il est déjà supprimé
      if (vertex.collapsed) continue;
      
      // Vérifier si la cible est valide
      const targetIdx = vertex.collapseTarget;
      if (targetIdx === null || vertices[targetIdx].collapsed) continue;
      
      // Supprimer ce vertex en le fusionnant avec sa cible
      vertex.collapsed = true;
      
      // Mettre à jour les triangles
      for (const triangle of vertex.faces) {
        if (triangle.deleted) continue;
        
        // Si le triangle contient la cible, le supprimer
        if (triangle.a === vertices[targetIdx] || 
            triangle.b === vertices[targetIdx] || 
            triangle.c === vertices[targetIdx]) {
          triangle.deleted = true;
          currentTriangleCount--;
        } else {
          // Remplacer le vertex par sa cible
          if (triangle.a === vertex) triangle.a = vertices[targetIdx];
          if (triangle.b === vertex) triangle.b = vertices[targetIdx];
          if (triangle.c === vertex) triangle.c = vertices[targetIdx];
          
          // Ajouter à la liste des faces de la cible
          if (!vertices[targetIdx].faces.includes(triangle)) {
            vertices[targetIdx].faces.push(triangle);
          }
        }
      }
      
      // Si nous avons atteint la cible, sortir
      if (currentTriangleCount <= targetTriangleCount) break;
    }
  }
  
  /**
   * Crée une nouvelle géométrie Three.js à partir des vertex et triangles restants
   */
  createSimplifiedGeometry(originalGeometry, vertices, triangles, preserveUVs) {
    // Créer un nouveau BufferGeometry
    const newGeometry = new THREE.BufferGeometry();
    
    // Filtrer les triangles non supprimés
    const remainingTriangles = triangles.filter(t => !t.deleted);
    
    // Créer une nouvelle liste de vertices unique
    const vertexMap = new Map();
    let index = 0;
    
    for (const triangle of remainingTriangles) {
      if (!vertexMap.has(triangle.a)) vertexMap.set(triangle.a, index++);
      if (!vertexMap.has(triangle.b)) vertexMap.set(triangle.b, index++);
      if (!vertexMap.has(triangle.c)) vertexMap.set(triangle.c, index++);
    }
    
    // Créer les nouveaux attributs
    const positions = new Float32Array(vertexMap.size * 3);
    const indices = new Uint32Array(remainingTriangles.length * 3);
    
    // Remplir les positions
    for (const [vertex, newIndex] of vertexMap.entries()) {
      positions[newIndex * 3] = vertex.position.x;
      positions[newIndex * 3 + 1] = vertex.position.y;
      positions[newIndex * 3 + 2] = vertex.position.z;
    }
    
    // Remplir les indices
    let indexOffset = 0;
    for (const triangle of remainingTriangles) {
      indices[indexOffset++] = vertexMap.get(triangle.a);
      indices[indexOffset++] = vertexMap.get(triangle.b);
      indices[indexOffset++] = vertexMap.get(triangle.c);
    }
    
    // Définir les attributs
    newGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    newGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    // Copier les coordonnées UV si nécessaire
    if (preserveUVs && originalGeometry.attributes.uv) {
      const originalUVs = originalGeometry.attributes.uv.array;
      const newUVs = new Float32Array(vertexMap.size * 2);
      
      for (const [vertex, newIndex] of vertexMap.entries()) {
        if (vertex.index * 2 + 1 < originalUVs.length) {
          newUVs[newIndex * 2] = originalUVs[vertex.index * 2];
          newUVs[newIndex * 2 + 1] = originalUVs[vertex.index * 2 + 1];
        }
      }
      
      newGeometry.setAttribute('uv', new THREE.BufferAttribute(newUVs, 2));
    }
    
    // Copier d'autres attributs importants
    if (originalGeometry.attributes.normal) {
      newGeometry.computeVertexNormals();
    }
    
    return newGeometry;
  }
}

export default SimplifyModifier;
