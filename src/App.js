import React, { useState, useRef, useEffect } from 'react';
import Video from './components/Video';
import './App.css';
import './Video.css';
import ShotButtons from './components/ShotButtons';

function App() {
  const videoList = [
    { id: "OoqS1pvUQbY", description: "Santa Monica Beach Volleyball Short", correctShot: "Line", initialStartTime: 2.0, initialStopTime: 3.35 },
    { id: "25p9Pjv49rg", description: "Santa Monica Beach Volleyball Short", correctShot: "Line", initialStartTime: 4.0, initialStopTime: 5.35 },
    { id: "j39vexlVjQHF08F5", description: "Santa Monica Beach Volleyball Short", correctShot: "Line", initialStartTime: 1.0, initialStopTime: 2.35 }
  ];

  const [currentVideo, setCurrentVideo] = useState(videoList[0]);
  const [startAtTime, setStartAtTime] = useState(videoList[0].initialStartTime);
  const [dynamicStopTime, setDynamicStopTime] = useState(videoList[0].initialStopTime);
  const videoRef = useRef(null);
  const [playerState, setPlayerState] = useState('Not Ready');
  const [isPlayerReady, setIsPlayerReady] = useState(false); // Manages player readiness
  const [shotMessage, setShotMessage] = useState('');
  // Re-added the missing showVideoElement state
  const [showVideoElement, setShowVideoElement] = useState(true); 

  // Function to handle when the Video component signals that its player is ready
  const handlePlayerInitialized = () => {
    console.log("App.js: Video player is now ready!");
    setIsPlayerReady(true);
    // You can call updatePlayerState here immediately after the player is ready
    updatePlayerState();
  };

  // Function to get and update the player state (now called based on readiness)
  const updatePlayerState = () => {
    // This check is very important. videoRef.current might be null or not fully ready briefly.
    if (videoRef.current && typeof videoRef.current.getPlayerState === 'function') {
      const state = videoRef.current.getPlayerState(); // This is App.js:44
      let stateText = 'Unknown';
      switch (state) {
        case -1: stateText = 'Unstarted'; setShowVideoElement(true); break; // Show video
        case 0: stateText = 'Ended'; setShowVideoElement(false); break; // Hide video
        case 1: stateText = 'Playing'; setShowVideoElement(true); break; // Show video
        case 2: stateText = 'Paused'; setShowVideoElement(false); break; // Hide video
        case 3: stateText = 'Buffering'; setShowVideoElement(true); break; // Show video
        case 5: stateText = 'Video Cued'; setShowVideoElement(true); break; // Show video
        default: stateText = 'Not Ready'; setShowVideoElement(true); break; // Show video
      }
      setPlayerState(stateText);
    } else if (!isPlayerReady) {
      setPlayerState('Loading...');
      setShowVideoElement(true); // Show loading state
    } else {
      // This else block is for when isPlayerReady is true but methods are still missing.
      // This is the race condition we're trying to eliminate.
      setPlayerState('Player methods not yet available...');
    }
  };

  // Set up an interval to regularly update the player state for display
  // This interval will now only run if the player is ready, preventing early calls
  useEffect(() => {
    let interval;
    if (isPlayerReady) {
      interval = setInterval(updatePlayerState, 500);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlayerReady]); // Rerun effect when isPlayerReady changes

  const handleShotButtonClick = (buttonText) => {
    if (isPlayerReady) {
      if (buttonText === currentVideo.correctShot) {
        setShotMessage('Good Read!');
        console.log("DEBUG App.js: videoRef.current at click:", videoRef.current);
        console.log("DEBUG App.js: typeof videoRef.current.getCurrentTime at click:", typeof videoRef.current.getCurrentTime);
        const currentTime = videoRef.current.getCurrentTime(); // This is App.js:78
        const newStopTime = currentTime + 3;
        setDynamicStopTime(newStopTime);
        videoRef.current.playVideo();
        setShowVideoElement(true); // Ensure video is visible when playing
      } else {
        setShotMessage('Wrong! You failed to read the shot.');
        videoRef.current.seekTo(startAtTime, true);
        videoRef.current.playVideo();
        setDynamicStopTime(currentVideo.initialStopTime);
        setShowVideoElement(true); // Ensure video is visible when playing
      }
    } else {
      console.warn("App.js: Video player methods not ready when Shot Button clicked.");
      setShotMessage("Player not ready. Please wait a moment.");
    }
  };

  const handleChangeVideo = (video) => {
    setCurrentVideo(video);
    setShotMessage('');
    setStartAtTime(video.initialStartTime);
    setDynamicStopTime(video.initialStopTime);
    setIsPlayerReady(false); // Set to false as a new video means player will re-initialize
    setShowVideoElement(true); // Ensure video is visible when selecting a new one
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>READ THE SHOT!</h1>
      </header>
      <main>
        <h2>Read the body, arm and hand motion. Then select which shot the hitter is hitting</h2>
        <p>Video starts at {startAtTime} seconds and pauses at {dynamicStopTime} seconds.</p>
        <p>VIDEO: <strong>{playerState}</strong></p>

        <Video
          ref={videoRef}
          embedId={currentVideo.id}
          startTime={startAtTime}
          stopTime={dynamicStopTime}
          onPlayerInitialized={handlePlayerInitialized} // Pass the initialization callback
          showVideoElement={showVideoElement} // Corrected: Removed the problematic comment
        />

        {/* Display a message when video is hidden */}
        {!showVideoElement && (
          <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#666', marginTop: '20px' }}>
            Video is currently paused or ended. Click Play or a Shot Button to resume.
          </p>
        )}

        {shotMessage && <p style={{ marginTop: '10px', fontSize: '1.1em', fontWeight: 'bold', color: '#333' }}>{shotMessage}</p>}

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => {
              if (isPlayerReady) {
                videoRef.current.seekTo(startAtTime, true);
                videoRef.current.playVideo();
                setShotMessage('');
                setDynamicStopTime(currentVideo.initialStopTime);
                setShowVideoElement(true); // Ensure video is visible when playing
              } else {
                console.warn("App.js: Video player methods not ready when Restart button clicked.");
                setShotMessage("Player not ready. Please wait a moment.");
              }
            }}
            style={buttonStyle}
            disabled={!isPlayerReady}
          >
            Restart from Start Time
          </button>
        </div>

        <ShotButtons onShotButtonClick={handleShotButtonClick} isPlayerReady={isPlayerReady} />

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <h3>Select Another Video:</h3>
          {videoList.map((video) => (
            <button
              key={video.id}
              onClick={() => handleChangeVideo(video)}
              style={{
                ...buttonStyle,
                backgroundColor: currentVideo.id === video.id ? '#0056b3' : '#007bff'
              }}
              disabled={!isPlayerReady}
            >
              {video.description}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

const buttonStyle = {
  margin: '10px',
  padding: '10px 20px',
  fontSize: '16px',
  cursor: 'pointer',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'background-color 0.3s ease',
};

export default App;
