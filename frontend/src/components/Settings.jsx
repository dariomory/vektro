import React from 'react';

export function Settings({ isOpen, onClose, theme, onToggleTheme }) {
  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="settings-content">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Theme</h3>
              <p>Switch between light and dark mode</p>
            </div>
            <button 
              className={`theme-switch ${theme}`}
              onClick={onToggleTheme}
            >
              <span className="switch-slider"></span>
            </button>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Model</h3>
              <p>SmolLM2-360M-Instruct</p>
            </div>
            <span className="setting-badge">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
