import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const AccessibilitySettings = () => {
  const { fontSize, updateFontSize } = useAccessibility();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Reading Settings</h1>
        <p>Customize your reading experience</p>
      </div>

      <div className="settings-card">
        <h2>Font Size</h2>
        
        <div className="setting-item">
          <label htmlFor="font-size">Size: {fontSize}px</label>
          <input
            type="range"
            id="font-size"
            min="12"
            max="24"
            step="2"
            value={fontSize}
            onChange={(e) => updateFontSize(parseInt(e.target.value))}
          />
          <div className="range-labels">
            <span>Small (12px)</span>
            <span>Large (24px)</span>
          </div>
        </div>

        <div className="settings-preview">
          <h3>Preview</h3>
          <div style={{ fontSize: `${fontSize}px` }}>
            <p>The quick brown fox jumps over the lazy dog.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;