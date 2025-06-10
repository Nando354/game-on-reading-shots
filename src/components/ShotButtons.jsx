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
  // Added disabled styles
  ':disabled': {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
};

export default function ShotButtons({ onShotButtonClick, isPlayerReady }) { // Added isPlayerReady prop
  return (
    <div className="shot-buttons" style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button onClick={() => onShotButtonClick('Line')} className="shot-button" style={buttonStyle} disabled={!isPlayerReady}>
        Line
      </button>
      <button onClick={() => onShotButtonClick('Angle')} className="shot-button" style={buttonStyle} disabled={!isPlayerReady}>
        Angle
      </button>
      <button onClick={() => onShotButtonClick('Cut')} className="shot-button" style={buttonStyle} disabled={!isPlayerReady}>
        Cut
      </button>
      <button onClick={() => onShotButtonClick('Short')} className="shot-button" style={buttonStyle} disabled={!isPlayerReady}>
        Short
      </button>
      <button onClick={() => onShotButtonClick('Jumbo')} className="shot-button" style={buttonStyle} disabled={!isPlayerReady}>
        Jumbo
      </button>
      <button onClick={() => onShotButtonClick('Hit')} className="shot-button" style={buttonStyle} disabled={!isPlayerReady}>
        Hit
      </button>
      <button onClick={() => onShotButtonClick('Set Over')} className="shot-button" style={buttonStyle} disabled={!isPlayerReady}>
        Set Over
      </button>
      <button onClick={() => onShotButtonClick('Jump Set')} className="shot-button" style={buttonStyle} disabled={!isPlayerReady}>
        Jump Set
      </button>     
    </div>
  );
}
