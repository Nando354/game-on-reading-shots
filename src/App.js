import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Video from './components/Video';
import './App.css';
import './Video.css';
import ShotButtons from './components/ShotButtons';

function App() {
  // Define an array of video objects, each with an ID, a description/comment, and the correct shot
  // Now includes initialStartTime and initialStopTime for each video
  // Wrap videoList in useMemo to ensure stable reference across renders
  const videoList = useMemo(() => [
    { id: "21KPtT-e73o", description: "https://youtube.com/shorts/21KPtT-e73o?si=h9HMmPsz7wW5JSUH", correctShot: "Short", initialStartTime: 2.0, initialStopTime: 4.80 },
    { id: "ncticos1PKc", description: "Match 2", correctShot: "Angle", initialStartTime: 2.0, initialStopTime: 4.55},
    { id: "OoqS1pvUQbY", description: "Santa Monica Beach Volleyball Short", correctShot: "Line", initialStartTime: 2.0, initialStopTime: 3.35 },
    { id: "RGywebZ9oW8", description: "https://www.youtube.com/shorts/RGywebZ9oW8", correctShot: "Line", initialStartTime: 8.0, initialStopTime: 12.46 },
    { id: "4x8cuBp8hl4", description: "https://youtube.com/shorts/4x8cuBp8hl4?si=8sZRdQ_VnJ_g2C1t", correctShot: "Cut", initialStartTime: 1.0, initialStopTime: 4.57 },
    { id: "qKleF-nCHGc", description: "https://youtube.com/shorts/qKleF-nCHGc?si=f31EUlHr4WD7RvVm", correctShot: "Angle", initialStartTime: 0.5, initialStopTime: 4.68 },
    { id: "wqzozK6ErrI", description: "https://youtube.com/shorts/wqzozK6ErrI?si=-YQ7SSDP5gKbNuEW", correctShot: "Jump Set", initialStartTime: 2.5, initialStopTime: 4.27 },
    { id: "yGva0-yHgbE", description: "https://youtube.com/shorts/yGva0-yHgbE?si=UtAlsEh0tz_ix2KO", correctShot: "Line", initialStartTime: 2.5, initialStopTime: 4.60 }
  ], []); // Empty dependency array means it's created only once

  // State to manage the currently selected video from the list
  // Initialize with the first video in the list
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // Track current video by index
  const [currentVideo, setCurrentVideo] = useState(videoList[currentVideoIndex]);
  const [startAtTime, setStartAtTime] = useState(videoList[currentVideoIndex].initialStartTime);
  const [dynamicStopTime, setDynamicStopTime] = useState(videoList[currentVideoIndex].initialStopTime); 

  // Create a ref to access methods exposed by the Video component
  const videoRef = useRef(null);
  const videoSectionRef = useRef(null); // Ref for the video section to enable scrolling

  // State to display the current player state
  const [playerState, setPlayerState] = useState('Not Ready');

  // New state to track if the video player methods are ready to be called
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // State to hold the message from clicked ShotButton
  const [shotMessage, setShotMessage] = useState('');

  // Update currentVideo state when currentVideoIndex changes
  useEffect(() => {
    setCurrentVideo(videoList[currentVideoIndex]);
  }, [currentVideoIndex, videoList]); // Depend on videoList to ensure it's always the latest


  // Function to handle when the Video component signals that its player is ready
  // Wrapped in useCallback to prevent unnecessary re-creations
  const handlePlayerInitialized = useCallback(() => {
    console.log("App.js: Video player is now ready!");
    // Simply set isPlayerReady to true. The interval will then start polling for state.
    setIsPlayerReady(true);
    // Removed the setTimeout and immediate setPlayerState calls from here.
    // The setInterval in the useEffect below will now be solely responsible
    // for updating the playerState based on the videoRef's status.
  }, [setIsPlayerReady]); // Dependencies: only setIsPlayerReady (which is a stable function)


  // Set up an interval to regularly update the player state for display
  useEffect(() => {
    let interval;
    if (isPlayerReady) {
      interval = setInterval(() => {
        if (videoRef.current && typeof videoRef.current.getPlayerState === 'function') {
          const currentState = videoRef.current.getPlayerState();
          let newStateText = 'Unknown';

          switch (currentState) {
            case -1: newStateText = 'Unstarted'; break;
            case 0: newStateText = 'Ended'; break;
            case 1: newStateText = 'Playing'; break;
            case 2: newStateText = 'Paused'; break;
            case 3: newStateText = 'Buffering'; break;
            case 5: newStateText = 'Video Cued'; break;
            default: newStateText = 'Not Ready'; break;
          }

          setPlayerState(prevPlayerState => {
            if (prevPlayerState !== newStateText) {
              return newStateText;
            }
            return prevPlayerState;
          });

        } else {
          setPlayerState(prevPlayerState => {
            if (prevPlayerState !== 'Loading...') {
              return 'Loading...';
            }
            return prevPlayerState;
          });
        }
      }, 500);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlayerReady, videoRef, setPlayerState]);


  // Function to handle a click on any ShotButton
  const handleShotButtonClick = useCallback((buttonText) => {
    if (isPlayerReady && videoRef.current) {
      if (buttonText === currentVideo.correctShot) {
        setShotMessage('Good Read!');
        const currentTime = videoRef.current.getCurrentTime();
        const newStopTime = currentTime + 3;
        setDynamicStopTime(newStopTime);

        setTimeout(() => {
          if (videoRef.current && typeof videoRef.current.playVideo === 'function') {
            videoRef.current.playVideo();
          }
        }, 200);

      } else {
        setShotMessage('Wrong! You failed to read the shot.');
        videoRef.current.seekTo(startAtTime, true);
        
        setTimeout(() => {
          if (videoRef.current && typeof videoRef.current.playVideo === 'function') {
            videoRef.current.playVideo();
          }
        }, 200);
        setDynamicStopTime(currentVideo.initialStopTime);
      }
    } else {
      console.warn("App.js: Video player methods not ready when Shot Button clicked.");
      setShotMessage("Player not ready. Please wait a moment.");
    }
  }, [isPlayerReady, videoRef, currentVideo, startAtTime, setShotMessage, setDynamicStopTime]);


  // Modified handleChangeVideo to cycle through videos
  const handleNextVideo = useCallback(() => {
    const nextIndex = (currentVideoIndex + 1) % videoList.length;
    const nextVideo = videoList[nextIndex];

    setCurrentVideoIndex(nextIndex);
    setShotMessage('');
    setStartAtTime(nextVideo.initialStartTime);
    setDynamicStopTime(nextVideo.initialStopTime);
    setIsPlayerReady(false);
  }, [currentVideoIndex, videoList, setShotMessage, setStartAtTime, setDynamicStopTime, setIsPlayerReady]);

  // Handle Play button click
  const handlePlayVideo = useCallback(() => {
    if (isPlayerReady && videoRef.current) {
      const currentState = videoRef.current.getPlayerState();
      console.log("App.js: Play button clicked. Current player state:", currentState);

      // If already playing or buffering, do nothing or provide feedback
      if (currentState === window.YT.PlayerState.PLAYING || currentState === window.YT.PlayerState.BUFFERING) {
        setShotMessage('Video is already playing!');
        return;
      }

      // If ended, seek to start before playing
      if (currentState === window.YT.PlayerState.ENDED) {
        videoRef.current.seekTo(startAtTime, true); // Seek to original start time
        console.log("App.js: Seeking to start time before playing.");
      }

      // A small delay is still a good practice for programmatic calls
      setTimeout(() => {
        if (videoRef.current && typeof videoRef.current.playVideo === 'function') {
          videoRef.current.playVideo();
          console.log("App.js: Attempting to play video via button with delay.");
        }
      }, 150); // Slightly increased delay to 150ms

      setShotMessage(''); // Clear any previous message
    } else {
      console.warn("App.js: Video player methods not ready when Play button clicked.");
      setShotMessage("Player not ready. Please wait a moment.");
    }
  }, [isPlayerReady, videoRef, startAtTime, setShotMessage]); // Added startAtTime to dependencies

  // Function to scroll to the video section
  const scrollToVideoSection = useCallback(() => {
    if (videoSectionRef.current) {
      videoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);


  return (
    <div className="App">
      <header className="App-header">
        <h1>READ THE SHOT!</h1>
      </header>
      <main>
        {/* Instructions Section */}
        <section id="instructions-section" style={{ padding: '20px', maxWidth: '800px', margin: '20px auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#333', fontSize: '2em', marginBottom: '15px' }}>How to Use This App:</h2>
          <p style={{ fontSize: '1.1em', lineHeight: '1.6', color: '#555' }}>
            Welcome to "READ THE SHOT!" This app helps you practice reading volleyball shots.
            Follow these steps to improve your game:
          </p>
          <ol style={{ fontSize: '1.1em', lineHeight: '1.6', color: '#555', paddingLeft: '25px' }}>
            <li><strong>Watch the Video:</strong> Press play on the video. The video will show you an attack from the opponent.</li>
            <li><strong>Read the Shot:</strong> Observe the hitter's body positioning, arm positioning, and hand motion carefully.</li>
            <li><strong>Select the Shot:</strong> Choose the button that corresponds to the shot you believe the hitter is attempting (e.g., Line, Angle, Cut, Short, Jump Set).</li>
            <li><strong>Get Feedback:</strong>
              <ul>
                <li>If you're **Correct**, the video will continue playing for a few more seconds, allowing you to see the outcome.</li>
                <li>If you're **Incorrect**, the video will reset to the start time, giving you another chance to read the shot.</li>
              </ul>
            </li>
            <li><strong>Restart or Next:</strong>
              <ul>
                <li>Click "Restart Video" to re-watch the current video from the beginning of the action.</li>
                <li>Click "Next Video" to move to the next video in the list.</li>
              </ul>
            </li>
          </ol>
          <p style={{ fontSize: '1.1em', lineHeight: '1.6', color: '#555', marginTop: '20px' }}>
          </p>
          <button onClick={scrollToVideoSection} style={{ ...buttonStyle, backgroundColor: '#17a2b8' }}>
            Play Read The Shot!
          </button>
        </section>

        {/* Video Section */}
        <section id="video-section" ref={videoSectionRef}>
          <p style={{ fontSize: '1.2em', color: '#444' }}>Video starts at {startAtTime} seconds and pauses at {dynamicStopTime} seconds. VIDEO: <strong>{playerState}</strong></p>
          {/* <p style={{ fontSize: '1.2em', color: '#444' }}>VIDEO: <strong>{playerState}</strong></p> */}

          <Video
            key={currentVideo.id}
            ref={videoRef}
            embedId={currentVideo.id}
            startTime={startAtTime}
            stopTime={dynamicStopTime}
            onPlayerInitialized={handlePlayerInitialized}
          />

          {shotMessage && <p style={{ marginTop: '10px', marginBottom: '0px', fontSize: '3.1em', fontWeight: 'bold', color: '#333' }}>{shotMessage}</p>}
        </section>

        {/* Controls Section */}
        <section id="controls-section">
          <ShotButtons onShotButtonClick={handleShotButtonClick} isPlayerReady={isPlayerReady} />

          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                if (isPlayerReady) {
                  videoRef.current.seekTo(startAtTime, true);
                  setShotMessage('');
                  setDynamicStopTime(currentVideo.initialStopTime);
                } else {
                  console.warn("App.js: Video player methods not ready when Restart button clicked.");
                  setShotMessage("Player not ready. Please wait a moment.");
                }
              }}
              style={buttonStyle}
              disabled={!isPlayerReady}
            >
              Restart Video
            </button>
            {/* <button
              onClick={handlePlayVideo} 
              style={buttonStyle}
              disabled={!isPlayerReady}
            >
              Play Video
            </button> */}
            <button
              onClick={handleNextVideo}
              style={buttonStyle}
              disabled={!isPlayerReady}
            >
              Next Video
            </button>
          </div>
        </section>
        
        {/* Video List Section */}
        <section id="video-list-section" style={{ marginTop: '30px', textAlign: 'center' }}>
          <h3>Video List:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {videoList.map((video, index) => (
              <li
                key={video.id}
                style={{
                  padding: '5px',
                  backgroundColor: currentVideo.id === video.id ? '#e0f7fa' : 'transparent',
                  color: currentVideo.id === video.id ? '#007bff' : '#333',
                  fontWeight: currentVideo.id === video.id ? 'bold' : 'normal',
                  borderBottom: '1px solid #eee',
                  cursor: 'default'
                }}
              >
                {video.description}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

const buttonStyle = {
  margin: '10px',
  padding: '10px 20px',
  fontSize: '20px',
  fontWeight: 'bold',
  cursor: 'pointer',
  backgroundColor: 'rgba(249, 175, 73, 0.95)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'background-color 0.3s ease',
};

export default App;
