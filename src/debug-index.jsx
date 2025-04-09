import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Simple debug component to test React rendering
const DebugApp = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>RISK Game Debug Mode</h1>
      <p>If you can see this, React is rendering correctly.</p>
      
      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Troubleshooting</h2>
        <p>We're seeing a blank screen because there might be JS errors preventing the main app from rendering.</p>
        <p>Check your browser console for errors.</p>
      </div>
      
      <button 
        style={{ 
          padding: '10px 15px', 
          backgroundColor: '#2962ff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={() => {
          console.log('Debug button clicked');
          alert('Debug mode is active. Check console for more information.');
        }}
      >
        Debug Button
      </button>
    </div>
  );
};

// Mount the debug component
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DebugApp />
  </React.StrictMode>,
);
