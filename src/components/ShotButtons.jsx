import React from 'react';

// NOTE: The error "Cannot find module './components/Video'" suggests that
// this file might have had an incorrect import statement like
// `import Video from './components/Video';` in a previous version.
// If such an import existed, and Video.jsx is a sibling file in the same
// directory (src/components/), the correct import should be:
// `import Video from './Video';`
// However, in its current and intended functionality, ShotButtons.jsx does not
// need to import Video.jsx directly, as they are both consumed by App.js.

// Reusable button style (moved here for ShotButtons)
const buttonStyle = {
  padding: '10px 20px',
  fontSize: '20px',
  fontWeight: 'bold',
  cursor: 'pointer',
  backgroundColor: 'rgba(246, 218, 2, 0.93)', // A different color for these buttons
  color: 'black',
  border: 'none',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'background-color 0.3s ease',
  // Removed ':disabled' styles; use CSS for disabled state
};

export default function ShotButtons({ onShotButtonClick, disabled }) {
  return (
    <div className="shot-buttons" style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button onClick={() => onShotButtonClick('Line')} className="shot-button" style={buttonStyle} disabled={disabled}>
        Line
      </button>
      <button onClick={() => onShotButtonClick('Angle')} className="shot-button" style={buttonStyle} disabled={disabled}>
        Angle
      </button>
      <button onClick={() => onShotButtonClick('Cut')} className="shot-button" style={buttonStyle} disabled={disabled}>
        Cut
      </button>
      <button onClick={() => onShotButtonClick('Short')} className="shot-button" style={buttonStyle} disabled={disabled}>
        Short
      </button>
      <button onClick={() => onShotButtonClick('Jumbo')} className="shot-button" style={buttonStyle} disabled={disabled}>
        Jumbo
      </button>
      <button onClick={() => onShotButtonClick('Set Over')} className="shot-button" style={buttonStyle} disabled={disabled}>
        Set Over
      </button>
      <button onClick={() => onShotButtonClick('Jump Set')} className="shot-button" style={buttonStyle} disabled={disabled}>
        Jump Set
      </button>
      <button onClick={() => onShotButtonClick('Hit on 1')} className="shot-button" style={buttonStyle} disabled={disabled}>
        Hit on 1
      </button>
      <button onClick={() => onShotButtonClick('Hit on 2')} className="shot-button" style={buttonStyle} disabled={disabled}>
        Hit on 2
      </button>
    </div>
  );
}