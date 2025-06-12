import React from 'react';

// Define the Instructions component
// It receives the scrollToVideoSection function, buttonStyle, and isLoading as props from App.js
function Instructions({ scrollToVideoSection, buttonStyle, isLoading }) { // Added isLoading prop
  return (
    // Updated inline padding for the section
    <section id="instructions-section" style={{ padding: '5px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      {/* Updated inline styles for h2 font size and margin */}
      <h2 style={{ color: '#333', fontSize: '1.2em', marginBottom: '5px' }}>How to Use This App:</h2>
      <p style={{ fontSize: '.9em', lineHeight: '1.6', color: '#555' }}>
        Welcome to "READ THE SHOT!" This app helps you practice reading volleyball shots.
        Follow these steps to improve your game:
      </p>
      {/* Set paddingLeft to '0px' for the main <ul> element */}
      <ul style={{ fontSize: '.9em', lineHeight: '1.6', color: '#555', listStyleType: 'none', paddingLeft: '0px' }}> {/* ADDED paddingLeft: '0px' */}
        <li><strong>Watch the Video:</strong> Press play on the video. The video will show you an attack from the opponent.</li>
        <li><strong>Read the Shot:</strong> Observe the hitter's body positioning, arm positioning, and hand motion carefully.</li>
        <li><strong>Select the Shot:</strong> Choose the button that corresponds to the shot you believe the hitter is attempting (e.g., Line, Angle, Cut, Short, Jump Set).</li>
        <li><strong>Get Feedback:</strong>
          <ul style={{ listStyleType: 'none', paddingLeft: '0px' }}> {/* This already has paddingLeft: '0px' */}
            <li>If you're **Correct**, the video will continue playing for a few more seconds, allowing you to see the outcome.</li>
            <li>If you're **Incorrect**, the video will reset to the start time, giving you another chance to read the shot.</li>
          </ul>
        </li>
        <li><strong>Restart or Next:</strong>
          <ul style={{ listStyleType: 'none', paddingLeft: '0px' }}> {/* This already has paddingLeft: '0px' */}
            <li>Click "Restart Video" to re-watch the current video from the beginning of the action.</li>
            <li>Click "Next Video" to move to the next video in the list.</li>
          </ul>
        </li>
      </ul>
      <p style={{ fontSize: '1.1em', lineHeight: '1.6', color: '#555', marginTop: '0px' }}>
      </p>
      <button
        onClick={scrollToVideoSection}
        style={{ ...buttonStyle, backgroundColor: 'rgba(246, 150, 15, 0.95)' }}
        disabled={isLoading} // Disable button while loading
      >
        {isLoading ? 'Game Loading...' : 'Play Read The Shot!'} {/* Conditional text */}
      </button>
    </section>
  );
}

export default Instructions;
