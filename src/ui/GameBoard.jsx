import React, { useState, useEffect } from 'react';
import classicMap from '../assets/maps/classic-map.js';

/**
 * GameBoard component for rendering the map and game state
 */
const GameBoard = ({ gameState, onTerritoryClick }) => {
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [viewBox, setViewBox] = useState('0 0 800 500');
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  
  // Load map data on component mount
  useEffect(() => {
    // In a real implementation, this would be loaded from the game state
    setMapData(classicMap);
  }, []);
  
  if (!mapData) {
    return <div>Loading map data...</div>;
  }
  
  // Get player colors for territories
  const getPlayerColor = (territoryId) => {
    if (!gameState) return '#cccccc';
    
    const territory = gameState.territories.find(t => t.id === territoryId);
    if (!territory || !territory.occupyingPlayer) return '#cccccc';
    
    const player = gameState.players.find(p => p.id === territory.occupyingPlayer);
    return player ? player.color : '#cccccc';
  };
  
  // Handle territory click
  const handleTerritoryClick = (territoryId) => {
    setSelectedTerritory(territoryId);
    if (onTerritoryClick) {
      onTerritoryClick(territoryId);
    }
  };
  
  // Render the map territories
  const renderTerritories = () => {
    return mapData.territories.map(territory => {
      const isSelected = selectedTerritory === territory.id;
      const fillColor = getPlayerColor(territory.id);
      
      // For this simple visualization, we'll use circles to represent territories
      return (
        <g key={territory.id} onClick={() => handleTerritoryClick(territory.id)}>
          <circle
            cx={territory.coordinates.x}
            cy={territory.coordinates.y}
            r={isSelected ? 15 : 12}
            fill={fillColor}
            stroke={isSelected ? '#000' : '#666'}
            strokeWidth={isSelected ? 3 : 1}
            opacity={0.7}
          />
          <text
            x={territory.coordinates.x}
            y={territory.coordinates.y + 25}
            textAnchor="middle"
            fontSize="10"
            fill="#000"
          >
            {territory.name}
          </text>
        </g>
      );
    });
  };
  
  // Render connections between territories
  const renderConnections = () => {
    const connections = [];
    
    mapData.territories.forEach(territory => {
      territory.adjacent.forEach(adjId => {
        // Find the adjacent territory
        const adjTerritory = mapData.territories.find(t => t.id === adjId);
        if (!adjTerritory) return;
        
        // Create a unique ID for this connection to avoid duplicates
        const id1 = territory.id;
        const id2 = adjId;
        const connectionId = [id1, id2].sort().join('-');
        
        // Only add each connection once
        if (!connections.some(c => c.id === connectionId)) {
          connections.push({
            id: connectionId,
            x1: territory.coordinates.x,
            y1: territory.coordinates.y,
            x2: adjTerritory.coordinates.x,
            y2: adjTerritory.coordinates.y
          });
        }
      });
    });
    
    return connections.map(conn => (
      <line
        key={conn.id}
        x1={conn.x1}
        y1={conn.y1}
        x2={conn.x2}
        y2={conn.y2}
        stroke="#999"
        strokeWidth={1}
        opacity={0.5}
      />
    ));
  };
  
  // Render continent backgrounds
  const renderContinents = () => {
    // This is a simplified visualization
    // In a real implementation, we would use polygon shapes for continents
    const continentColors = {
      'north-america': 'rgba(255, 192, 203, 0.2)', // pink
      'south-america': 'rgba(255, 255, 0, 0.2)',   // yellow
      'europe': 'rgba(0, 0, 255, 0.2)',            // blue
      'africa': 'rgba(255, 165, 0, 0.2)',          // orange
      'asia': 'rgba(0, 255, 0, 0.2)',              // green
      'australia': 'rgba(128, 0, 128, 0.2)'        // purple
    };
    
    return mapData.continents.map(continent => {
      // Get all territories in this continent
      const continentTerritories = mapData.territories.filter(
        t => t.continent === continent.id
      );
      
      // Calculate center point for continent label
      const centerX = continentTerritories.reduce((sum, t) => sum + t.coordinates.x, 0) / 
                      continentTerritories.length;
      const centerY = continentTerritories.reduce((sum, t) => sum + t.coordinates.y, 0) / 
                      continentTerritories.length;
      
      return (
        <g key={continent.id}>
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fill={continent.color || '#000'}
            opacity={0.4}
          >
            {continent.name}
          </text>
        </g>
      );
    });
  };
  
  return (
    <div className="game-board">
      <svg
        viewBox={viewBox}
        width="100%"
        height="100%"
        style={{ maxHeight: '80vh' }}
      >
        {/* Render map elements */}
        <rect
          x="0"
          y="0"
          width={dimensions.width}
          height={dimensions.height}
          fill="#e8f4f8"
        />
        {renderContinents()}
        {renderConnections()}
        {renderTerritories()}
      </svg>
      
      {/* Territory info panel */}
      {selectedTerritory && (
        <div className="territory-info">
          <h3>Territory: {mapData.territories.find(t => t.id === selectedTerritory)?.name}</h3>
          {/* In a real implementation, we would show more territory details here */}
        </div>
      )}
    </div>
  );
};

export default GameBoard;
