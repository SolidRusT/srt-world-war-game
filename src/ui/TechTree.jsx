import React, { useState, useEffect } from 'react';
import './TechTree.css';

/**
 * Technology Tree visualization component
 */
const TechTree = ({ gameState, playerId, onResearchTech }) => {
  const [selectedCategory, setSelectedCategory] = useState('military');
  const [playerTechTree, setPlayerTechTree] = useState(null);
  const [hoveredTech, setHoveredTech] = useState(null);
  
  // Fetch player's tech tree data on component mount and when game state changes
  useEffect(() => {
    if (gameState && gameState.techManager) {
      const techTree = gameState.techManager.getPlayerTechTree(playerId);
      setPlayerTechTree(techTree);
    }
  }, [gameState, playerId]);
  
  if (!playerTechTree) {
    return <div className="tech-tree-loading">Loading technology tree...</div>;
  }
  
  // Get player's current research progress
  const researchProgress = gameState.techManager.getResearchProgress(playerId);
  
  // Get available technologies for research
  const availableTechs = gameState.techManager.getAvailableTechnologies(playerId);
  
  // Format tech cost and time
  const formatTechInfo = (tech) => {
    if (tech.status === 'unlocked') {
      return 'Researched';
    } else if (tech.status === 'researching') {
      const progress = tech.progress || 0;
      return `Researching: ${progress}%`;
    } else if (tech.status === 'available') {
      const inAvailable = availableTechs.find(t => t.id === tech.id);
      if (inAvailable) {
        return `Cost: ${inAvailable.cost} RP • ${inAvailable.turnsRequired} turns`;
      }
      return `Cost: ${tech.cost} RP`;
    } else {
      return 'Locked';
    }
  };
  
  // Get CSS class for a technology based on its status
  const getTechClass = (tech) => {
    const baseClass = 'tech-node';
    
    switch (tech.status) {
      case 'unlocked':
        return `${baseClass} tech-unlocked`;
      case 'researching':
        return `${baseClass} tech-researching`;
      case 'available':
        return `${baseClass} tech-available`;
      default:
        return `${baseClass} tech-locked`;
    }
  };
  
  // Handle technology node click
  const handleTechClick = (tech) => {
    if (tech.status === 'available') {
      onResearchTech(tech.id);
    }
  };
  
  // Render technologies for the selected category
  const renderTechnologies = () => {
    const techs = playerTechTree[selectedCategory];
    if (!techs || techs.length === 0) {
      return <div className="no-techs">No technologies available in this category.</div>;
    }
    
    // Group technologies by tier (based on prerequisites)
    const tierMap = {};
    
    // First, assign tier 1 to techs with no prerequisites
    techs.forEach(tech => {
      if (tech.prerequisites.length === 0) {
        tierMap[tech.id] = 1;
      }
    });
    
    // Then, assign tiers to the rest based on prerequisites
    let assignedTechs = Object.keys(tierMap).length;
    let maxIterations = 10; // Prevent infinite loop
    
    while (assignedTechs < techs.length && maxIterations > 0) {
      techs.forEach(tech => {
        if (tierMap[tech.id]) return; // Already assigned
        
        // Check if all prerequisites have tiers assigned
        const prereqTiers = tech.prerequisites.map(p => tierMap[p] || 0);
        if (prereqTiers.every(t => t > 0)) {
          // Assign tier based on highest prerequisite tier
          tierMap[tech.id] = Math.max(...prereqTiers) + 1;
          assignedTechs++;
        }
      });
      
      maxIterations--;
    }
    
    // Group techs by tier
    const tierGroups = {};
    techs.forEach(tech => {
      const tier = tierMap[tech.id] || 1;
      if (!tierGroups[tier]) {
        tierGroups[tier] = [];
      }
      tierGroups[tier].push(tech);
    });
    
    // Render tier groups
    return (
      <div className="tech-tree-grid">
        {Object.entries(tierGroups).map(([tier, techsInTier]) => (
          <div key={tier} className="tech-tier">
            {techsInTier.map(tech => (
              <div key={tech.id} className="tech-node-container">
                <div 
                  className={getTechClass(tech)}
                  onClick={() => handleTechClick(tech)}
                  onMouseEnter={() => setHoveredTech(tech)}
                  onMouseLeave={() => setHoveredTech(null)}
                >
                  <h4>{tech.name}</h4>
                  <div className="tech-info">{formatTechInfo(tech)}</div>
                  
                  {tech.status === 'researching' && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${tech.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Draw connection lines to prerequisites */}
                {tech.prerequisites.map(prereqId => (
                  <svg key={`${tech.id}-${prereqId}`} className="tech-connection">
                    <line 
                      x1="50%" 
                      y1="0" 
                      x2="50%" 
                      y2="100%" 
                      className={tierMap[prereqId] < tierMap[tech.id] - 1 ? 'connection-distant' : ''}
                    />
                  </svg>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };
  
  // Render tech details panel
  const renderTechDetails = () => {
    if (!hoveredTech) return null;
    
    return (
      <div className="tech-details">
        <h3>{hoveredTech.name}</h3>
        <p className="tech-description">{hoveredTech.description}</p>
        
        {hoveredTech.prerequisites.length > 0 && (
          <div className="tech-prerequisites">
            <h4>Prerequisites:</h4>
            <ul>
              {hoveredTech.prerequisites.map(prereqId => {
                const prereq = playerTechTree[selectedCategory].find(t => t.id === prereqId);
                return <li key={prereqId}>{prereq ? prereq.name : prereqId}</li>;
              })}
            </ul>
          </div>
        )}
        
        <div className="tech-status">
          <p><strong>Status:</strong> {hoveredTech.status.charAt(0).toUpperCase() + hoveredTech.status.slice(1)}</p>
          {hoveredTech.status === 'available' && (
            <button 
              className="research-button"
              onClick={() => onResearchTech(hoveredTech.id)}
            >
              Start Research
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Render currently researching techs
  const renderActiveResearch = () => {
    const researching = Object.entries(researchProgress);
    
    if (researching.length === 0) {
      return <p>No technologies currently being researched.</p>;
    }
    
    return (
      <div className="active-research">
        <h3>Current Research</h3>
        {researching.map(([techId, progress]) => (
          <div key={techId} className="research-item">
            <div className="research-header">
              <h4>{progress.name}</h4>
              <span>{progress.progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="research-remaining">
              {progress.turnsRemaining} turns remaining
            </p>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="tech-tree-container">
      <div className="tech-tree-header">
        <h2>Technology Tree</h2>
        <div className="category-tabs">
          {Object.keys(playerTechTree).map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="tech-tree-content">
        <div className="tech-tree-visualization">
          {renderTechnologies()}
        </div>
        
        <div className="tech-tree-sidebar">
          {renderTechDetails()}
          {renderActiveResearch()}
          
          <div className="research-stats">
            <h3>Research Stats</h3>
            <p>
              <strong>Research Production:</strong>{' '}
              {gameState.resourceManager.calculateResourceProduction(playerId).research} per turn
            </p>
            <p>
              <strong>Technologies Unlocked:</strong>{' '}
              {
                Object.values(playerTechTree)
                  .flat()
                  .filter(tech => tech.status === 'unlocked')
                  .length
              }
              /{Object.values(playerTechTree).flat().length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechTree;
