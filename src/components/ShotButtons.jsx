import React from 'react';

export default function ShotButtons({ onShotButtonClick }) { // Renamed prop for clarity
  return (
    <div className="shot-buttons" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button onClick={() => onShotButtonClick('Line')} className="shot-button" style={buttonStyle}>
        Line
      </button>
      <button onClick={() => onShotButtonClick('Angle')} className="shot-button" style={buttonStyle}>
        Angle
      </button>
      <button onClick={() => onShotButtonClick('Cut')} className="shot-button" style={buttonStyle}>
        Cut
      </button>
      <button onClick={() => onShotButtonClick('Short')} className="shot-button" style={buttonStyle}>
        Short
      </button>
      <button onClick={() => onShotButtonClick('Jumbo')} className="shot-button" style={buttonStyle}>
        Jumbo
      </button>
      <button onClick={() => onShotButtonClick('Hit')} className="shot-button" style={buttonStyle}>
        Hit
      </button>
      <button onClick={() => onShotButtonClick('Set Over')} className="shot-button" style={buttonStyle}>
        Set Over
      </button>   
    </div>
  );
}

// Reusable button style (moved here for ShotButtons)
const buttonStyle = {
  padding: '10px 20px',
  fontSize: '16px',
  cursor: 'pointer',
  backgroundColor: '#28a745', // A different color for these buttons
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'background-color 0.3s ease',
};
