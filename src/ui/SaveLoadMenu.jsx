import React, { useState, useEffect, useRef } from 'react';
import SaveLoadSystem from '../core/save-load-system';
import './SaveLoadMenu.css';

/**
 * SaveLoadMenu component for managing game saves
 */
const SaveLoadMenu = ({ onSave, onLoad, onClose }) => {
  const [saveList, setSaveList] = useState([]);
  const [selectedSave, setSelectedSave] = useState(null);
  const [newSaveName, setNewSaveName] = useState('');
  const [activeTab, setActiveTab] = useState('load'); // 'load' or 'save'
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInputRef = useRef(null);
  
  // Load save list on component mount
  useEffect(() => {
    refreshSaveList();
  }, []);
  
  // Refresh the save list
  const refreshSaveList = () => {
    const saves = SaveLoadSystem.getSaveList();
    setSaveList(saves);
    
    // Clear selection if selected save no longer exists
    if (selectedSave && !saves.some(save => save.name === selectedSave)) {
      setSelectedSave(null);
    }
  };
  
  // Handle save selection
  const handleSelectSave = (saveName) => {
    setSelectedSave(saveName);
    setConfirmDelete(null);
  };
  
  // Handle save game
  const handleSave = () => {
    if (!newSaveName.trim()) {
      alert('Please enter a name for your save.');
      return;
    }
    
    // Check if save already exists
    if (SaveLoadSystem.saveExists(newSaveName) && 
        !window.confirm(`A save named "${newSaveName}" already exists. Overwrite?`)) {
      return;
    }
    
    const success = onSave(newSaveName);
    
    if (success) {
      refreshSaveList();
      setNewSaveName('');
      setActiveTab('load');
    }
  };
  
  // Handle load game
  const handleLoad = () => {
    if (!selectedSave) {
      alert('Please select a save to load.');
      return;
    }
    
    onLoad(selectedSave);
  };
  
  // Handle delete save
  const handleDelete = () => {
    if (!selectedSave) return;
    
    if (confirmDelete === selectedSave) {
      // Confirmed, delete the save
      SaveLoadSystem.deleteSave(selectedSave);
      setSelectedSave(null);
      setConfirmDelete(null);
      refreshSaveList();
    } else {
      // Ask for confirmation
      setConfirmDelete(selectedSave);
    }
  };
  
  // Handle export save
  const handleExport = () => {
    if (!selectedSave) {
      alert('Please select a save to export.');
      return;
    }
    
    SaveLoadSystem.exportSave(selectedSave);
  };
  
  // Handle import save
  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Process imported file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    SaveLoadSystem.importSave(file)
      .then(saveName => {
        refreshSaveList();
        setSelectedSave(saveName);
        alert(`Save "${saveName}" imported successfully!`);
      })
      .catch(error => {
        alert(`Error importing save: ${error.message}`);
      });
    
    // Reset the file input
    event.target.value = '';
  };
  
  return (
    <div className="save-load-menu">
      <div className="save-load-header">
        <h2>Save/Load Game</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'load' ? 'active' : ''}`}
          onClick={() => setActiveTab('load')}
        >
          Load Game
        </button>
        <button 
          className={`tab-button ${activeTab === 'save' ? 'active' : ''}`}
          onClick={() => setActiveTab('save')}
        >
          Save Game
        </button>
      </div>
      
      {activeTab === 'load' && (
        <div className="load-panel">
          <div className="save-list">
            {saveList.length === 0 ? (
              <div className="no-saves">No saved games found.</div>
            ) : (
              saveList.map(save => (
                <div 
                  key={save.name}
                  className={`save-item ${selectedSave === save.name ? 'selected' : ''}`}
                  onClick={() => handleSelectSave(save.name)}
                >
                  <div className="save-name">
                    {save.displayName}
                    {save.name === 'autosave' && <span className="auto-tag">Auto</span>}
                  </div>
                  <div className="save-date">{save.date}</div>
                </div>
              ))
            )}
          </div>
          
          <div className="action-buttons">
            <button 
              className="action-button load-button"
              disabled={!selectedSave}
              onClick={handleLoad}
            >
              Load Game
            </button>
            
            <button 
              className="action-button delete-button"
              disabled={!selectedSave}
              onClick={handleDelete}
            >
              {confirmDelete === selectedSave ? 'Confirm Delete' : 'Delete Save'}
            </button>
            
            <div className="import-export-buttons">
              <button 
                className="action-button export-button"
                disabled={!selectedSave}
                onClick={handleExport}
              >
                Export Save
              </button>
              
              <button 
                className="action-button import-button"
                onClick={handleImport}
              >
                Import Save
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'save' && (
        <div className="save-panel">
          <div className="save-form">
            <div className="form-group">
              <label htmlFor="save-name">Save Name:</label>
              <input 
                type="text" 
                id="save-name"
                value={newSaveName} 
                onChange={(e) => setNewSaveName(e.target.value)}
                placeholder="Enter a name for your save"
              />
            </div>
            
            <button 
              className="action-button save-button"
              disabled={!newSaveName.trim()}
              onClick={handleSave}
            >
              Save Game
            </button>
            
            <div className="save-info">
              <p>Saving will store your current game progress, including:</p>
              <ul>
                <li>Map state and territory control</li>
                <li>Player resources and technologies</li>
                <li>Cards and game progress</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaveLoadMenu;
