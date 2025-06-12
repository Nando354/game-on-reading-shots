import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Video from './components/Video';
import './App.css';
import './Video.css';
import ShotButtons from './components/ShotButtons';
import Instructions from './components/Instructions'; // Import the new Instructions component

function App() {
  // Define an array of video objects, each with an ID, a title, a URL, and the correct shot
  // The 'title' and 'videoUrl' will be dynamically populated.
  // Changed to useState, with useMemo providing the initial value.
  const [videoList, setVideoList] = useState(() => [ // FIX: Declare videoList as state
    { id: "21KPtT-e73o", title: "Loading title...", videoUrl: null, correctShot: "Short", initialStartTime: 2.0, initialStopTime: 4.80 },
    { id: "ncticos1PKc", title: "Loading title...", videoUrl: null, correctShot: "Angle", initialStartTime: 2.0, initialStopTime: 4.55},
    { id: "OoqS1pvUQbY", title: "Loading title...", videoUrl: null, correctShot: "Line", initialStartTime: 2.0, initialStopTime: 3.35 },
    { id: "RGywebZ9oW8", title: "Loading title...", videoUrl: null, correctShot: "Line", initialStartTime: 8.0, initialStopTime: 12.46 },
    { id: "4x8cuBp8hl4", title: "Loading title...", videoUrl: null, correctShot: "Cut", initialStartTime: 1.0, initialStopTime: 4.57 },
    { id: "qKleF-nCHGc", title: "Loading title...", videoUrl: null, correctShot: "Angle", initialStartTime: 0.5, initialStopTime: 4.68 },
    { id: "wqzozK6ErrI", title: "Loading title...", videoUrl: null, correctShot: "Jump Set", initialStartTime: 2.5, initialStopTime: 4.27 },
    { id: "yGva0-yHgbE", title: "Loading title...", videoUrl: null, correctShot: "Line", initialStartTime: 2.5, initialStopTime: 4.60 }
  ]); // Empty dependency array removed from useMemo because it's now wrapped by useState


  // State to manage the currently selected video from the list
  // Initialize with the first video in the list
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // Track current video by index
  // Ensure currentVideo state is initialized with the correct structure from videoList
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

  // State to track if video details are being loaded (e.g., titles from YouTube API)
  const [isLoadingVideoDetails, setIsLoadingVideoDetails] = useState(true);

  // Update currentVideo state, startAtTime, and dynamicStopTime when currentVideoIndex changes
  useEffect(() => {
    setCurrentVideo(videoList[currentVideoIndex]);
    setStartAtTime(videoList[currentVideoIndex].initialStartTime);
    setDynamicStopTime(videoList[currentVideoIndex].initialStopTime);
    setIsPlayerReady(false); // Reset readiness for the new video to trigger re-initialization in Video.jsx
  }, [currentVideoIndex, videoList]); // Depend on videoList to ensure it's always the latest


  // Function to handle when the Video component signals that its player is ready
  // Wrapped in useCallback to prevent unnecessary re-creations
  const handlePlayerInitialized = useCallback(() => {
    console.log("App.js: Video player is now ready!");
    // Simply set isPlayerReady to true. The interval will then start polling for state.
    setIsPlayerReady(true);
  }, [setIsPlayerReady]);


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

  // Function to scroll to the video section
  const scrollToVideoSection = useCallback(() => {
    if (videoSectionRef.current) {
      videoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Effect to fetch video details dynamically for the list
  useEffect(() => {
    const fetchAndPopulateVideoDetails = async () => {
      setIsLoadingVideoDetails(true);
      const updatedVideoList = [...videoList]; // Create a mutable copy

      for (let i = 0; i < updatedVideoList.length; i++) {
        const video = updatedVideoList[i];
        // Only fetch if title is still "Loading title..." or if videoUrl is null
        if (video.title === "Loading title..." || video.videoUrl === null) {
          let tempPlayer = null;
          let tempDiv = null;

          try {
            // Create a temporary hidden div and iframe to initialize a YouTube player
            tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '-9999px';
            document.body.appendChild(tempDiv);

            const playerReadyPromise = new Promise((resolve, reject) => {
              let attempts = 0;
              const maxAttempts = 50; 

              const createTempPlayer = () => {
                const tempIframe = tempDiv.querySelector('iframe');
                // Check for global YT object and if iframe is ready
                if (window.YT && window.YT.Player && tempIframe && tempIframe.contentWindow) {
                  tempPlayer = new window.YT.Player(tempIframe, {
                    videoId: video.id,
                    playerVars: {
                      controls: 0, autoplay: 0, mute: 1, enablejsapi: 1,
                    },
                    events: {
                      'onReady': (event) => resolve(event.target),
                      'onError': (error) => {
                        console.error("App.js: Temporary player error for ID:", video.id, error);
                        reject(new Error(`Failed to load video ${error.data}`));
                      },
                    },
                  });
                } else {
                  attempts++;
                  if (attempts < maxAttempts) {
                    setTimeout(createTempPlayer, 100);
                  } else {
                    reject(new Error("Timeout: YouTube API or temporary iframe not ready for video details."));
                  }
                }
              };

              const newIframe = document.createElement('iframe');
              newIframe.id = `temp-yt-player-${video.id}-${Date.now()}`;
              newIframe.width = '1';
              newIframe.height = '1';
              newIframe.src = `https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=0&controls=0&mute=1`;
              newIframe.style.border = 'none';
              tempDiv.appendChild(newIframe);

              createTempPlayer();
            });

            const loadedPlayer = await playerReadyPromise;
            const videoData = loadedPlayer.getVideoData();
            const videoUrl = loadedPlayer.getVideoUrl();

            if (!videoData || !videoData.title) {
              throw new Error("Could not retrieve video title from API.");
            }
            
            // Update the specific video object in the copied list with fetched title and URL
            updatedVideoList[i] = {
              ...video,
              title: videoData.title,
              videoUrl: videoUrl,
              // Ensure initialStopTime does not exceed video duration if duration is available
              initialStopTime: videoData.duration ? Math.min(video.initialStopTime, videoData.duration) : video.initialStopTime,
            };

          } catch (error) {
            console.error(`Error fetching details for video ID ${video.id}:`, error);
            // Fallback for error: retain existing title or set an error message
            updatedVideoList[i] = {
              ...video,
              title: `Error loading: ${error.message || 'Unknown error'}`,
              videoUrl: `https://www.youtube.com/watch?v=${video.id}` // Fallback URL
            };
          } finally {
            // Clean up temporary player and div
            if (tempPlayer && typeof tempPlayer.destroy === 'function') {
                try { tempPlayer.destroy(); } catch (e) { console.warn("Error destroying temp player:", e); }
            }
            if (tempDiv && tempDiv.parentNode) {
                tempDiv.parentNode.removeChild(tempDiv);
            }
          }
        }
      }
      // Only update state if the list has actually changed to prevent unnecessary re-renders
      if (JSON.stringify(updatedVideoList) !== JSON.stringify(videoList)) {
        setVideoList(updatedVideoList);
      }
      setIsLoadingVideoDetails(false);
    };

    fetchAndPopulateVideoDetails();
  }, [videoList]); // Dependency: videoList to re-run if it changes (e.g., initially or if a video entry structure changes)


  return (
    <div className="App">
      <header className="App-header">
        <h1>READ THE SHOT!</h1>
      </header>
      <main>
        {/* Instructions Section - Now a separate component */}
        <Instructions scrollToVideoSection={scrollToVideoSection} buttonStyle={buttonStyle} isLoading={isLoadingVideoDetails} />

        {/* Video Section */}
        <section id="video-section" ref={videoSectionRef}>
          <p style={{ fontSize: '.6em', color: '#444' }}>Video starts at {startAtTime} seconds and pauses at {dynamicStopTime} seconds. VIDEO: <strong>{playerState}</strong></p>

          {/* Conditional rendering for loading state */}
          {isLoadingVideoDetails ? (
            <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#666', marginTop: '20px' }}>
              Loading video details... Please wait...
            </p>
          ) : (
            <Video
              key={currentVideo.id} // Key ensures re-mount of Video component when ID changes
              ref={videoRef}
              embedId={currentVideo.id}
              startTime={startAtTime}
              stopTime={dynamicStopTime}
              onPlayerInitialized={handlePlayerInitialized}
            />
          )}

          {shotMessage && <p style={{ marginTop: '0px', marginBottom: '0px', fontSize: '3.1em', fontWeight: 'bold', color: '#333' }}>{shotMessage}</p>}
        </section>

        {/* Controls Section */}
        <section id="controls-section">
          <ShotButtons onShotButtonClick={handleShotButtonClick} isPlayerReady={isPlayerReady && !isLoadingVideoDetails} />

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
              disabled={!isPlayerReady || isLoadingVideoDetails}
            >
              Restart Video
            </button>
            <button
              onClick={handleNextVideo}
              style={buttonStyle}
              disabled={!isPlayerReady || isLoadingVideoDetails}
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
                {/* Display only the video URL now */}
                {video.videoUrl}
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
  backgroundColor: 'rgba(246, 150, 15, 0.95)', // Updated color for consistency
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'background-color 0.3s ease',
};

export default App;
