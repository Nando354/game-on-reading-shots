import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Video from './components/Video';
import './App.css';
import './Video.css';
import ShotButtons from './components/ShotButtons';
import Instructions from './components/Instructions'; // Import the new Instructions component

// Utility function to shuffle an array (Fisher-Yates (Knuth) shuffle)
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

function App() {
  // Define an array of video objects, each with an ID, a title, a URL, and the correct shot
  const initialVideoList = useMemo(() => [
    { id: "21KPtT-e73o", title: "Loading title...", videoUrl: null, correctShot: "Short", initialStartTime: 2.0, initialStopTime: 4.80 },
    { id: "ncticos1PKc", title: "Loading title...", videoUrl: null, correctShot: "Angle", initialStartTime: 2.0, initialStopTime: 4.55},
    { id: "OoqS1pvUQbY", title: "Loading title...", videoUrl: null, correctShot: "Line", initialStartTime: 2.0, initialStopTime: 3.35 },
    { id: "RGywebZ9oW8", title: "Loading title...", videoUrl: null, correctShot: "Line", initialStartTime: 8.0, initialStopTime: 12.48 },
    { id: "4x8cuBp8hl4", title: "Loading title...", videoUrl: null, correctShot: "Cut", initialStartTime: 1.0, initialStopTime: 4.57 },
    { id: "i9Zh0oxh5gs", title: "Loading title...", videoUrl: null, correctShot: "Line", initialStartTime: 5.0, initialStopTime: 9.51 },
    { id: "oa9wFeBFzMY", title: "Loading title...", videoUrl: null, correctShot: "Line", initialStartTime: 2.0, initialStopTime: 8.26 },
    { id: "sg9C1Hu3HW8", title: "Loading title...", videoUrl: null, correctShot: "Set Over", initialStartTime: 3.0, initialStopTime: 7.00 },
    { id: "wqzozK6ErrI", title: "Loading title...", videoUrl: null, correctShot: "Line", initialStartTime: 1.0, initialStopTime: 5.89 },
    { id: "lKDk0zIWNC4", title: "Loading title...", videoUrl: null, correctShot: "Angle", initialStartTime: 0.0, initialStopTime: 5.04 },
    { id: "oFm_dwzmjD8", title: "Loading title...", videoUrl: null, correctShot: "Line", initialStartTime: 0.0, initialStopTime: 4.52 },
    { id: "trV2xBDevf8", title: "Loading title...", videoUrl: null, correctShot: "Set Over", initialStartTime: 1.0, initialStopTime: 6.59 },
    { id: "jJ3o8WQwxgs", title: "Loading title...", videoUrl: null, correctShot: "Hit on 2", initialStartTime: 0.0, initialStopTime: 2.05 },
    { id: "Nf39ym_abvo", title: "Loading title...", videoUrl: null, correctShot: "Angle", initialStartTime: 5.0, initialStopTime: 9.23 },
    { id: "_z-t6Rt5P6E", title: "Loading title...", videoUrl: null, correctShot: "Cut", initialStartTime: 16.0, initialStopTime: 21.17 },
    { id: "PFIjY7rXQ6o", title: "Loading title...", videoUrl: null, correctShot: "Hit on 1", initialStartTime: 0.0, initialStopTime: 6.59 }
  ], []);

  // State to hold the fully populated video list (with titles/URLs fetched)
  const [videoList, setVideoList] = useState(initialVideoList);

  // State for the shuffled playback queue
  const [shuffledVideoQueue, setShuffledVideoQueue] = useState([]);
  const [currentShuffledIndex, setCurrentShuffledIndex] = useState(0);

  // Use currentVideo from the shuffled queue
  // This will be the video currently playing or about to play
  const currentVideo = shuffledVideoQueue[currentShuffledIndex] || videoList[0]; // Fallback to first video in original list

  const [startAtTime, setStartAtTime] = useState(currentVideo.initialStartTime);
  const [dynamicStopTime, setDynamicStopTime] = useState(currentVideo.initialStopTime);

  // Create a ref to access methods exposed by the Video component
  const videoRef = useRef(null);
  const videoSectionRef = useRef(null); // Ref for the video section to enable scrolling

  // State to display the current player state
  const [playerState, setPlayerState] = useState('Not Ready');

  // New state to track if the video player methods are ready to be called
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // State to hold the message from clicked ShotButton
  const [shotMessage, setShotMessage] = useState('');
  // New state for message color
  const [shotMessageColor, setShotMessageColor] = useState('#333'); // Default color

  // Define an array of possible correct messages
  const correctMessages = useMemo(() => [
    "Read that like a Book!",
    "Let's Go Defense!!!",
    "Are you Psychic? No you Read the Shot!",
    "They can't get one Past You!",
    "Eagle Eyes!!"
  ], []);

  // Define an array of possible incorrect messages
  const incorrectMessages = useMemo(() => [
    "Do you need Glasses?",
    "You Lost that Point",
    "Thanks for the Charity",
    "No Guessing Allowed",
    "Watch The Hitter",
    "Nope. Read The Body, Arm, Hand",
    "Back to Practice",
    "Apologize to your Teammate"
  ], []);

  // State to track if video details are being loaded (e.g., titles from YouTube API)
  const [isLoadingVideoDetails, setIsLoadingVideoDetails] = useState(true);

  // Initialize shuffled queue when videoList is populated
  useEffect(() => {
    // Check if all videos in the initial list have their titles loaded
    // and if the shuffled queue hasn't been initialized yet.
    if (videoList.every(video => video.title !== "Loading title...") && shuffledVideoQueue.length === 0) {
      setShuffledVideoQueue(shuffleArray([...videoList])); // Create the first shuffled queue
      setCurrentShuffledIndex(0); // Start from the beginning of the shuffled list
      console.log("App.js: Initial shuffled video queue created and current index set to 0.");
    }
  }, [videoList, shuffledVideoQueue.length]); // Depend on videoList and shuffledQueue.length

  // Update currentVideo details (start/stop times) when the shuffled index changes
  useEffect(() => {
    // Ensure the queue is not empty and the index is valid
    if (shuffledVideoQueue.length > 0 && currentShuffledIndex < shuffledVideoQueue.length) {
      const selectedVideo = shuffledVideoQueue[currentShuffledIndex];
      setStartAtTime(selectedVideo.initialStartTime);
      setDynamicStopTime(selectedVideo.initialStopTime);
      setIsPlayerReady(false); // Reset readiness for the new video to trigger re-initialization in Video.jsx
      console.log(`App.js: Current video updated to ID: ${selectedVideo.id}, Start: ${selectedVideo.initialStartTime}, Stop: ${selectedVideo.initialStopTime}`);
    }
  }, [currentShuffledIndex, shuffledVideoQueue]);


  // Function to handle when the Video component signals that its player is ready
  const handlePlayerInitialized = useCallback(() => {
    console.log("App.js: Video player is now ready!");
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
        // Randomly select a correct message
        const randomIndex = Math.floor(Math.random() * correctMessages.length);
        setShotMessage(correctMessages[randomIndex]);
        setShotMessageColor('green'); // Set color to green for correct answer

        const currentTime = videoRef.current.getCurrentTime();
        const newStopTime = currentTime + 3;
        setDynamicStopTime(newStopTime);

        setTimeout(() => {
          if (videoRef.current && typeof videoRef.current.playVideo === 'function') {
            videoRef.current.playVideo();
          }
        }, 200);

      } else {
        // Randomly select an incorrect message
        const randomIndex = Math.floor(Math.random() * incorrectMessages.length);
        setShotMessage(incorrectMessages[randomIndex]);
        setShotMessageColor('red'); // Set color to red for incorrect answer

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
      setShotMessageColor('#333'); // Default color if player not ready
    }
  }, [isPlayerReady, videoRef, currentVideo, startAtTime, setShotMessage, setDynamicStopTime, correctMessages, incorrectMessages, setShotMessageColor]);


  // Modified handleNextVideo to use a shuffled queue
  const handleNextVideo = useCallback(() => {
    if (shuffledVideoQueue.length === 0) {
      console.warn("Shuffled video queue is empty. Cannot play next video.");
      return;
    }

    let nextIndex = currentShuffledIndex + 1;
    // If we reached the end of the shuffled queue, reshuffle and start over
    if (nextIndex >= shuffledVideoQueue.length) {
      console.log("App.js: End of shuffled queue reached. Reshuffling video list.");
      setShuffledVideoQueue(shuffleArray([...videoList])); // Shuffle the original full list
      nextIndex = 0; // Start from the beginning of the new shuffled list
    }

    setCurrentShuffledIndex(nextIndex);
    setShotMessage('');
    setShotMessageColor('#333'); // Reset message color
    setIsPlayerReady(false); // Reset readiness to trigger player re-initialization for the new video
  }, [currentShuffledIndex, shuffledVideoQueue, videoList, setShotMessage, setIsPlayerReady, setShotMessageColor]);


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
      const updatedVideoList = [...initialVideoList]; // Use initialVideoList as base

      for (let i = 0; i < updatedVideoList.length; i++) {
        const video = updatedVideoList[i];
        // Only fetch if title is still "Loading title..." or if videoUrl is null
        if (video.title === "Loading title..." || video.videoUrl === null) {
          let tempPlayer = null;
          let tempDiv = null;

          try {
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
              // Ensure HTTPS for the temporary iframe as well
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

            updatedVideoList[i] = {
              ...video,
              title: videoData.title,
              videoUrl: videoUrl,
              initialStopTime: videoData.duration ? Math.min(video.initialStopTime, videoData.duration) : video.initialStopTime,
            };

          } catch (error) {
            console.error(`Error fetching details for video ID ${video.id}:`, error);
            updatedVideoList[i] = {
              ...video,
              title: `Error loading: ${error.message || 'Unknown error'}`,
              videoUrl: `https://www.youtube.com/watch?v=${video.id}`
            };
          } finally {
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
      // This helps avoid re-triggering effects unnecessarily.
      if (JSON.stringify(updatedVideoList) !== JSON.stringify(videoList)) {
        setVideoList(updatedVideoList);
      }
      setIsLoadingVideoDetails(false);
    };

    fetchAndPopulateVideoDetails();
  }, [initialVideoList, videoList]); // Depend on initialVideoList to run once, and videoList for comparison


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
          {isLoadingVideoDetails || shuffledVideoQueue.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#666', marginTop: '20px' }}>
              Loading video details and preparing playback queue... Please wait...
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

          {/* Apply dynamic color to shotMessage */}
          {shotMessage && <p style={{ marginTop: '0px', marginBottom: '0px', fontSize: '3.1em', fontWeight: 'bold', color: shotMessageColor }}>{shotMessage}</p>}
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
                  setShotMessageColor('#333'); // Reset message color on restart
                  setDynamicStopTime(currentVideo.initialStopTime);
                  setTimeout(() => {
                    if (videoRef.current && typeof videoRef.current.playVideo === 'function') {
                      videoRef.current.playVideo();
                    }
                  }, 100);
                } else {
                  console.warn("App.js: Video player methods not ready when Restart button clicked.");
                  setShotMessage("Player not ready. Please wait a moment.");
                  setShotMessageColor('#333'); // Default color if player not ready
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
              disabled={!isPlayerReady || isLoadingVideoDetails || shuffledVideoQueue.length === 0}
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
                {/* Display video title and URL (if available) */}
                {video.videoUrl && `(URL: ${video.videoUrl})`}
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
