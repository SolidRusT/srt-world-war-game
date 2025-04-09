/**
 * Save/Load System for Risk-inspired strategy game
 */

/**
 * Handles saving and loading game state
 */
class SaveLoadSystem {
  /**
   * Save game state to localStorage
   * @param {Object} gameState - Game state to save
   * @param {string} saveName - Name of the save file
   * @returns {boolean} True if save was successful
   */
  static saveGame(gameState, saveName = 'autosave') {
    try {
      if (!gameState) return false;
      
      // Create a serialized version of the game state
      const serializedState = gameState.serialize();
      
      // Add metadata
      const saveData = {
        name: saveName,
        timestamp: Date.now(),
        version: '1.0.0',
        state: serializedState
      };
      
      // Save to localStorage
      localStorage.setItem(`risk-game-${saveName}`, JSON.stringify(saveData));
      
      // Update save list
      this.updateSaveList(saveName);
      
      return true;
    } catch (error) {
      console.error('Error saving game:', error);
      return false;
    }
  }
  
  /**
   * Load game state from localStorage
   * @param {string} saveName - Name of the save file
   * @returns {Object|null} Loaded game state or null if error/not found
   */
  static loadGame(saveName = 'autosave') {
    try {
      // Get save data from localStorage
      const saveDataStr = localStorage.getItem(`risk-game-${saveName}`);
      if (!saveDataStr) return null;
      
      const saveData = JSON.parse(saveDataStr);
      
      // Verify version compatibility
      if (!this.isVersionCompatible(saveData.version)) {
        console.warn('Save file version may be incompatible');
      }
      
      // Return the serialized state to be reconstructed
      return saveData.state;
    } catch (error) {
      console.error('Error loading game:', error);
      return null;
    }
  }
  
  /**
   * Create a new auto-save
   * @param {Object} gameState - Game state to save
   * @returns {boolean} True if auto-save was successful
   */
  static createAutoSave(gameState) {
    return this.saveGame(gameState, 'autosave');
  }
  
  /**
   * Check if a save with the given name exists
   * @param {string} saveName - Name to check
   * @returns {boolean} True if save exists
   */
  static saveExists(saveName) {
    return localStorage.getItem(`risk-game-${saveName}`) !== null;
  }
  
  /**
   * Delete a saved game
   * @param {string} saveName - Name of the save to delete
   * @returns {boolean} True if deletion was successful
   */
  static deleteSave(saveName) {
    try {
      localStorage.removeItem(`risk-game-${saveName}`);
      this.updateSaveList(saveName, true);
      return true;
    } catch (error) {
      console.error('Error deleting save:', error);
      return false;
    }
  }
  
  /**
   * Get list of all saved games
   * @returns {Object[]} Array of save info objects
   */
  static getSaveList() {
    try {
      // Get the save list
      const saveListStr = localStorage.getItem('risk-game-savelist');
      const saveList = saveListStr ? JSON.parse(saveListStr) : [];
      
      // Get details for each save
      const saveDetails = saveList.map(saveName => {
        const saveDataStr = localStorage.getItem(`risk-game-${saveName}`);
        if (!saveDataStr) return null;
        
        try {
          const saveData = JSON.parse(saveDataStr);
          return {
            name: saveName,
            displayName: saveName === 'autosave' ? 'Auto Save' : saveName,
            timestamp: saveData.timestamp,
            date: new Date(saveData.timestamp).toLocaleString(),
            version: saveData.version
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
      
      // Sort by timestamp (newest first)
      saveDetails.sort((a, b) => b.timestamp - a.timestamp);
      
      return saveDetails;
    } catch (error) {
      console.error('Error getting save list:', error);
      return [];
    }
  }
  
  /**
   * Update the save list when a new save is created or deleted
   * @param {string} saveName - Name of the save
   * @param {boolean} isDelete - True if this is a deletion
   */
  static updateSaveList(saveName, isDelete = false) {
    try {
      // Get current save list
      const saveListStr = localStorage.getItem('risk-game-savelist');
      let saveList = saveListStr ? JSON.parse(saveListStr) : [];
      
      if (isDelete) {
        // Remove from list
        saveList = saveList.filter(name => name !== saveName);
      } else if (!saveList.includes(saveName)) {
        // Add to list if not already present
        saveList.push(saveName);
      }
      
      // Save updated list
      localStorage.setItem('risk-game-savelist', JSON.stringify(saveList));
    } catch (error) {
      console.error('Error updating save list:', error);
    }
  }
  
  /**
   * Check if a save version is compatible with current version
   * @param {string} version - Version to check
   * @returns {boolean} True if compatible
   */
  static isVersionCompatible(version) {
    // In a real implementation, this would check version compatibility
    // For now, we'll assume all versions are compatible
    return true;
  }
  
  /**
   * Export a save file to a downloadable file
   * @param {string} saveName - Name of the save to export
   * @returns {boolean} True if export was successful
   */
  static exportSave(saveName) {
    try {
      const saveDataStr = localStorage.getItem(`risk-game-${saveName}`);
      if (!saveDataStr) return false;
      
      // Create a blob and download link
      const blob = new Blob([saveDataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk-game-${saveName}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      return true;
    } catch (error) {
      console.error('Error exporting save:', error);
      return false;
    }
  }
  
  /**
   * Import a save file
   * @param {File} file - File to import
   * @returns {Promise<string|null>} Save name if successful, null if error
   */
  static importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const saveData = JSON.parse(event.target.result);
          
          // Validate save data
          if (!saveData.name || !saveData.timestamp || !saveData.state) {
            throw new Error('Invalid save file format');
          }
          
          // Generate a unique name if necessary
          let saveName = saveData.name;
          if (this.saveExists(saveName) && saveName !== 'autosave') {
            saveName = `${saveName}_${Date.now()}`;
          }
          
          // Save to localStorage
          localStorage.setItem(`risk-game-${saveName}`, JSON.stringify({
            ...saveData,
            name: saveName
          }));
          
          // Update save list
          this.updateSaveList(saveName);
          
          resolve(saveName);
        } catch (error) {
          console.error('Error parsing save file:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }
}

export default SaveLoadSystem;
