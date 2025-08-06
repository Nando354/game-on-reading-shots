import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Video from './components/Video';
import './App.css';
import './Video.css'; // Keep this import for now
import ShotButtons from './components/ShotButtons';

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
  // State to control visibility of the instructions page
  const [showInstructions, setShowInstructions] = useState(true);
  // State to control visibility of the video list section
  const [showVideoList, setShowVideoList] = useState(false); // Initially false
  // State to control visibility of the hamburger menu dropdown
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  // States for button highlighting
  const [highlightNextButton, setHighlightNextButton] = useState(false);
  const [highlightRestartButton, setHighlightRestartButton] = useState(false);

  // States for scoring
  const [correctScores, setCorrectScores] = useState(0); // Counts correct answers for the first 10 unique videos
  const [totalAttemptsTracked, setTotalAttemptsTracked] = useState(0); // Counts unique videos presented, up to 10
  // Stores whether a video has been attempted for scoring purposes in the current game cycle
  const [videoAttemptStatus, setVideoAttemptStatus] = useState({}); // { videoId: true }
  // State for showing the score modal
  const [showScoreModal, setShowScoreModal] = useState(false);
  // NEW: State to track if the 10th video has been attempted (answered)
  const [hasTenthVideoBeenAttempted, setHasTenthVideoBeenAttempted] = useState(false);

  // NEW: State to track the current game level (e.g., 'beginner', 'advanced')
  const [gameLevel, setGameLevel] = useState('none'); // 'none', 'beginner', 'advanced'

  // NEW: State to control visibility of the video screen (for advanced level blackout)
  const [isVideoScreenHidden, setIsVideoScreenHidden] = useState(false);

  // NEW: State to indicate if the blackout is due to reaching the initial stop time
  const [isBlackoutForInitialStop, setIsBlackoutForInitialStop] = useState(false);

  // NEW: State to control blackout countdown
  const [blackoutCountdown, setBlackoutCountdown] = useState(null); // null means no timer active


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
    { id: "_z-t6Rt5P6E", title: "Loading title...", videoUrl: null, correctShot: "Hit on 2", initialStartTime: 16.0, initialStopTime: 21.17 },
    { id: "PFIjY7rXQ6o", title: "Loading title...", videoUrl: null, correctShot: "Hit on 1", initialStartTime: 0.0, initialStopTime: 6.59 },
    { id: "NWG9NfrZfO0", title: "Loading title...", videoUrl: null, correctShot: "Cut", initialStartTime: 0.0, initialStopTime: 3.95 },
    { id: "IVL0y1nhV1k", title: "Loading title...", videoUrl: null, correctShot: "Cut", initialStartTime: 0.0, initialStopTime: 5.47 },
    { id: "lds1lM2XmZI", title: "Loading title...", videoUrl: null, correctShot: "Cut", initialStartTime: 12.0, initialStopTime: 20.62 },
    { id: "d2n2RIqJP88", title: "Loading title...", videoUrl: null, correctShot: "Short", initialStartTime: 6.0, initialStopTime: 10.18 },
    { id: "kgiwsnvAWuk", title: "Loading title...", videoUrl: null, correctShot: "Cut", initialStartTime: 0.0, initialStopTime: 3.72 },
    { id: "SQMNDCkhJwI", title: "Loading title...", videoUrl: null, correctShot: "Cut", initialStartTime: 0.0, initialStopTime: 5.19 },
    { id: "0MUJRveghTc", title: "Loading title...", videoUrl: null, correctShot: "Set Over", initialStartTime: 9.0, initialStopTime: 14.45 },
    { id: "2J46Jd3lz_k", title: "Loading title...", videoUrl: null, correctShot: "Hit on 2", initialStartTime: 4.0, initialStopTime: 7.69 },
    { id: "WZ9RhCIN9_Q", title: "Loading title...", videoUrl: null, correctShot: "Cut", initialStartTime: 11.0, initialStopTime: 16.00 },
    { id: "p-zaS41MFyQ", title: "Loading title...", videoUrl: null, correctShot: "Jumbo", initialStartTime: 4.0, initialStopTime: 7.71 },
    { id: "2mUUc3scIyY", title: "Loading title...", videoUrl: null, correctShot: "Jumbo", initialStartTime: 9.0, initialStopTime: 15.59 }
  ], []);

  // State to hold the fully populated video list (with titles/URLs fetched)
  const [videoList, setVideoList] = useState(initialVideoList);

  // State for the shuffled playback queue
  const [shuffledVideoQueue, setShuffledVideoQueue] = useState([]);
  const [currentShuffledIndex, setCurrentShuffledIndex] = useState(0);
  // NEW: State to hold the video details that are *pending* to be loaded into the player
  const [pendingVideoLoad, setPendingVideoLoad] = useState(null);


  // Use currentVideo from the shuffled queue
  // This will be the video currently playing or about to play
  const currentVideo = shuffledVideoQueue[currentShuffledIndex] || videoList[0]; // Fallback to first video in original list

  const [startAtTime, setStartAtTime] = useState(currentVideo.initialStartTime);
  const [dynamicStopTime, setDynamicStopTime] = useState(currentVideo.initialStopTime);

  // Create a ref to access methods exposed by the Video component
  const videoRef = useRef(null);

  // State to display the current player state
  const [playerState, setPlayerState] = useState('Not Ready');

  // Removed isPlayerReady state from App.js

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

  // Ref for background music
  const backgroundMusicRef = useRef(null);
  // Refs for sound effects
  const applauseSoundRef = useRef(null);
  const awwSoundRef = useRef(null);

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
                      origin: window.location.origin, // Ensure origin is set for temp player
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
              // Ensure HTTPS for the temporary iframe as well and origin
              newIframe.src = `https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=0&controls=0&mute=1&origin=${window.location.origin}`;
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

  // Effect to set pending video load when currentShuffledIndex changes
  useEffect(() => {
    if (shuffledVideoQueue.length > 0 && currentShuffledIndex < shuffledVideoQueue.length) {
      const selectedVideo = shuffledVideoQueue[currentShuffledIndex];
      setPendingVideoLoad({
        id: selectedVideo.id,
        startTime: selectedVideo.initialStartTime,
        stopTime: selectedVideo.initialStopTime
      });
      setStartAtTime(selectedVideo.initialStartTime);
      setDynamicStopTime(selectedVideo.initialStopTime);
      // Removed setIsPlayerReady(false) here, Video.jsx manages its own internal readiness
      console.log(`App.js: Pending video load set for ID: ${selectedVideo.id}`);

      // Increment totalAttemptsTracked here, reflecting videos presented, capped at 10
      setTotalAttemptsTracked(Math.min(currentShuffledIndex + 1, 10));
    }
  }, [currentShuffledIndex, shuffledVideoQueue]);

  // Effect to load new video into player when Video component is ready and a video is pending load
  useEffect(() => {
    // Check if videoRef.current exists and its getIsPlayerReady method reports true
    if (videoRef.current?.getIsPlayerReady() && pendingVideoLoad && typeof videoRef.current.loadVideoAndPlay === 'function') {
      console.log(`App.js: Loading pending video via videoRef.current.loadVideoAndPlay: ID: ${pendingVideoLoad.id}, Start: ${pendingVideoLoad.startTime}, Stop: ${pendingVideoLoad.stopTime}`);
      videoRef.current.loadVideoAndPlay(pendingVideoLoad.id, pendingVideoLoad.startTime, pendingVideoLoad.stopTime);
      setPendingVideoLoad(null); // Clear pending load after initiating
      console.log(`App.js: Current video updated to ID: ${pendingVideoLoad.id}, Start: ${pendingVideoLoad.startTime}, Stop: ${pendingVideoLoad.stopTime}`);
    } else if (pendingVideoLoad && !videoRef.current?.getIsPlayerReady()) { // Check readiness via ref
      console.warn("App.js: Video pending load, but player not ready. Waiting...");
    }
  }, [pendingVideoLoad]); // Removed isPlayerReady from dependencies


  // Function to handle when the Video component signals that its player is ready
  const handlePlayerInitialized = useCallback(() => {
    console.log("App.js: Video player is now ready!");
    // Removed setIsPlayerReady(true) here, as Video.jsx manages its own internal readiness
  }, []);


  // Set up an interval to regularly update the player state for display
  useEffect(() => {
    let interval;
    // Check player readiness via ref
    if (videoRef.current?.getIsPlayerReady()) {
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
  }, [videoRef]); // Depend on videoRef to access getIsPlayerReady()


  // Function to handle a click on any ShotButton
  const handleShotButtonClick = useCallback((buttonText) => {
    // Check for player readiness via ref before proceeding
    if (!videoRef.current?.getIsPlayerReady() || !videoRef.current) {
      console.warn("App.js: Video player methods not ready when Shot Button clicked.");
      setShotMessage("Player not ready. Please wait a moment.");
      setShotMessageColor('#333');
      setHighlightNextButton(false);
      setHighlightRestartButton(false);
      return; // Exit early if player is not ready
    }

    // Stop all sound effects before playing a new one
    if (applauseSoundRef.current) applauseSoundRef.current.pause();
    if (awwSoundRef.current) awwSoundRef.current.currentTime = 0; // Reset aww sound
    if (applauseSoundRef.current) applauseSoundRef.current.currentTime = 0; // Reset applause sound

    const videoId = currentVideo.id;
    const isFirstAttemptForThisVideo = !videoAttemptStatus[videoId];

    // --- Scoring Logic (for correctScores) ---
    // Only increment correctScores if this is the first attempt on THIS unique video
    if (isFirstAttemptForThisVideo) {
      if (buttonText === currentVideo.correctShot) {
        setCorrectScores(prev => prev + 1);
      }
      setVideoAttemptStatus(prev => ({ ...prev, [videoId]: true })); // Mark this video as attempted for scoring

      // NEW: If this is the 10th video's first attempt, mark it for modal display later
      if (totalAttemptsTracked === 10) {
        setHasTenthVideoBeenAttempted(true);
      }
    }

    // --- Feedback and Video Playback Logic ---
    if (buttonText === currentVideo.correctShot) {
      const randomIndex = Math.floor(Math.random() * correctMessages.length);
      setShotMessage(correctMessages[randomIndex]);
      setShotMessageColor('green');
      setHighlightNextButton(true);
      setHighlightRestartButton(false);
      setBlackoutCountdown(null); // Reset blackout countdown when correct answer is given

      const currentTime = videoRef.current.getCurrentTime();
      const newStopTimeForPlayback = currentTime + 3; // Video will play for 3 more seconds
      setDynamicStopTime(newStopTimeForPlayback); // Update dynamic stop time for the current video

      if (applauseSoundRef.current) {
        applauseSoundRef.current.play().catch(e => console.error("Error playing applause sound:", e));
      }

      // Unhide video screen in advanced level when correct
      if (gameLevel === 'advanced') {
        setIsVideoScreenHidden(false);
      }

      // Now we call the Video component's new method to play with the updated stop time
      if (videoRef.current && typeof videoRef.current.loadVideoAndPlay === 'function') {
        videoRef.current.loadVideoAndPlay(currentVideo.id, currentTime, newStopTimeForPlayback);
      } else {
        console.warn("App.js: loadVideoAndPlay method not available on videoRef.current.");
      }

      // Modal logic for correct answers on 10th video is handled by handleVideoPausedForModalCheck
    } else { // Incorrect answer
      const randomIndex = Math.floor(Math.random() * incorrectMessages.length);
      setShotMessage(incorrectMessages[randomIndex]);
      setShotMessageColor('red');
      setHighlightRestartButton(true);
      setHighlightNextButton(false);

      if (awwSoundRef.current) {
        awwSoundRef.current.play().catch(e => console.error("Error playing aww sound:", e));
      }

      // Reset video to its initial start time and play again.
      // We'll use the new method to ensure correct stop time is used.
      if (videoRef.current && typeof videoRef.current.loadVideoAndPlay === 'function') {
        videoRef.current.loadVideoAndPlay(currentVideo.id, startAtTime, currentVideo.initialStopTime);
      } else {
        console.warn("App.js: loadVideoAndPlay method not available on videoRef.current.");
      }
      setDynamicStopTime(currentVideo.initialStopTime); // Reset stop time for incorrect answer

      // NEW: If it's the 10th video and incorrect, mark it for modal display later
      // The modal will then be triggered by handleVideoPausedForModalCheck after the video resets and pauses.
      if (totalAttemptsTracked === 10) {
        setHasTenthVideoBeenAttempted(true);
      }
    }
  }, [videoRef, currentVideo, startAtTime, setShotMessage, setDynamicStopTime, correctMessages, incorrectMessages, setShotMessageColor, videoAttemptStatus, totalAttemptsTracked]);

  // Callback for when the video pauses/ends due to stop time or natural end
  const handleVideoPausedForModalCheck = useCallback(() => {
    console.log("App.js: handleVideoPausedForModalCheck triggered.");
    // NEW: If advanced level, hide video screen when it pauses at stop time
    if (gameLevel === 'advanced' && dynamicStopTime === currentVideo.initialStopTime) {
    setIsVideoScreenHidden(true);
    setBlackoutCountdown(3);
    setIsBlackoutForInitialStop(true);
  } else {
    setIsBlackoutForInitialStop(false);
  }

    // Only show the modal if the 10th video has been attempted and is now paused/ended
    // This is the single entry point for showing the modal after an attempt on the 10th video.
    if (totalAttemptsTracked === 10 && hasTenthVideoBeenAttempted) {
        console.log("App.js: Showing score modal.");
        setShowScoreModal(true);
        setHasTenthVideoBeenAttempted(false); // Reset for next game cycle
    }
}, [totalAttemptsTracked, hasTenthVideoBeenAttempted, gameLevel, dynamicStopTime, currentVideo]);

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
      // Note: Score reset logic is now handled by the modal's restart button or game start button
    }

    // Update current shuffled index. This will trigger the useEffect that loads the new video.
    setCurrentShuffledIndex(nextIndex);
    setShotMessage('');
    setShotMessageColor('#333'); // Reset message color
    // Removed setIsPlayerReady(false) here
    setHighlightNextButton(false); // Reset highlight
    setHighlightRestartButton(false); // Reset highlight
    setIsVideoScreenHidden(false); // Ensure video is visible for the next video
  }, [currentShuffledIndex, shuffledVideoQueue, videoList, setShotMessage, setShotMessageColor]);


  // Handler for "Start Playing!" button in instructions
  // Modified to accept gameLevel
  const handleStartPlaying = useCallback((level) => {
    setGameLevel(level); // Set the selected game level
    setShowInstructions(false);
    setShowVideoList(false); // Ensure video list is hidden when starting to play
    setHighlightNextButton(false); // Reset highlights on game start
    setHighlightRestartButton(false); // Reset highlights on game start
    // Reset scoring for a new game start
    setCorrectScores(0);
    setTotalAttemptsTracked(0); // Reset total videos tracked
    setVideoAttemptStatus({}); // Reset status of videos attempted for scoring
    setShowScoreModal(false); // Ensure modal is hidden
    setHasTenthVideoBeenAttempted(false); // NEW: Reset this flag
    setIsVideoScreenHidden(false); // Ensure video is visible at game start

    const newShuffledQueue = shuffleArray([...videoList]);
    setShuffledVideoQueue(newShuffledQueue);
    setCurrentShuffledIndex(0);

    if (newShuffledQueue.length > 0) {
      setStartAtTime(newShuffledQueue[0].initialStartTime);
      setDynamicStopTime(newShuffledQueue[0].initialStopTime);
    }

    // Initial video load is now handled by the useEffect that watches currentShuffledIndex
    // No direct call to videoRef.current.loadNewVideo here
  }, [videoList]);

  // General handler for navigation from hamburger menu
  const handleNavigationClick = useCallback((target) => {
    setShowHamburgerMenu(false); // Close menu on click
    setHighlightNextButton(false); // Reset highlights on navigation
    setHighlightRestartButton(false); // Reset highlights on navigation
    // Reset scoring if navigating to another section (effectively starting a new game context)
    setCorrectScores(0);
    setTotalAttemptsTracked(0);
    setVideoAttemptStatus({});
    setShowScoreModal(false); // Ensure modal is hidden
    setHasTenthVideoBeenAttempted(false); // NEW: Reset this flag
    setGameLevel('none'); // Reset game level when navigating away from game play
    setIsVideoScreenHidden(false); // Ensure video is visible if navigating back to instructions/list

    // Control visibility of sections using CSS classes
    if (target === 'instructions') {
      setShowInstructions(true);
      setShowVideoList(false);
    } else if (target === 'videoList') {
      setShowVideoList(true);
      setShowInstructions(false);
    } else if (target === 'game') {
      setShowInstructions(false);
      setShowVideoList(false);
      // Ensure game is ready to play if navigating directly to it
      if (shuffledVideoQueue.length === 0) {
        const newShuffledQueue = shuffleArray([...videoList]);
        setShuffledVideoQueue(newShuffledQueue);
        setCurrentShuffledIndex(0);
        // The useEffect watching currentShuffledIndex will handle loading the video
      } else {
        // If navigating back to game and queue exists, ensure current video is loaded/playing
        const current = shuffledVideoQueue[currentShuffledIndex];
        // Check player readiness via ref before calling loadVideoAndPlay
        if (videoRef.current?.getIsPlayerReady() && current && typeof videoRef.current.loadVideoAndPlay === 'function') {
          videoRef.current.loadVideoAndPlay(current.id, current.initialStartTime, current.initialStopTime);
        }
      }
      // If navigating to game directly, ensure a level is set, default to beginner if none
      if (gameLevel === 'none') {
        setGameLevel('beginner');
      }
    }
  }, [shuffledVideoQueue.length, videoList, gameLevel, currentShuffledIndex, shuffledVideoQueue]);

  // Function to restart the game from the modal
  const handleRestartGame = useCallback(() => {
    setCorrectScores(0);
    setTotalAttemptsTracked(0);
    setVideoAttemptStatus({});
    const newShuffledQueue = shuffleArray([...videoList]); // Reshuffle for a new game
    setShuffledVideoQueue(newShuffledQueue);
    setCurrentShuffledIndex(0); // Start from the first video
    setShotMessage('');
    setShotMessageColor('#333');
    // Removed setIsPlayerReady(false) here
    setHighlightNextButton(false);
    setHighlightRestartButton(false);
    setShowScoreModal(false); // Hide the modal
    setHasTenthVideoBeenAttempted(false); // NEW: Reset this flag
    setIsVideoScreenHidden(false); // Ensure video is visible on game restart

    // The useEffect watching currentShuffledIndex will handle loading the video
  }, [videoList]);

  // Effect to control background music playback
  useEffect(() => {
    if (backgroundMusicRef.current) {
      if (!showInstructions && !showScoreModal) {
        // Play music when game starts and modal is not visible
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.play().catch(e => console.error("Error playing music:", e));
      } else {
        // Pause music when instructions are shown or modal is visible
        backgroundMusicRef.current.pause();
        // Optionally reset to start for next play
        backgroundMusicRef.current.currentTime = 0; 
      }
    }
  }, [showInstructions, showScoreModal]); // Dependencies for music control

  // Effect to handle blackout countdown
  useEffect(() => {
    if (blackoutCountdown === null) return;
    if (blackoutCountdown === 0) {
      // Timer expired, show incorrect message and reset blackout
      const randomIndex = Math.floor(Math.random() * incorrectMessages.length);
      setShotMessage(incorrectMessages[randomIndex]);
      setShotMessageColor('red');
      setHighlightRestartButton(true);
      setHighlightNextButton(false);
      setIsVideoScreenHidden(false); // Reveal video
      setBlackoutCountdown(null); // Stop timer
      // Do NOT increment correctScores
    } else {
      const timer = setTimeout(() => {
        setBlackoutCountdown(blackoutCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [blackoutCountdown, incorrectMessages]);

  // Calculate score for display
  const displayPercentage = totalAttemptsTracked > 0 ?
    ((correctScores / 10) * 100).toFixed(0) // Always calculate out of 10
    : 0;

  // The numerator for the X/10 display is correctScores
  const displayCorrectCount = correctScores;


  return (
    <div className="App">
      {/* Audio element for background music */}
      <audio ref={backgroundMusicRef} src="/Alan Walker - Fade.mp3" preload="auto" />
      {/* Audio elements for sound effects */}
      <audio ref={applauseSoundRef} src="/applause-108368.mp3" preload="auto" />
      <audio ref={awwSoundRef} src="/aww-8277.mp3" preload="auto" />

      <header className="App-header">
        <h1>READ THE SHOT!</h1>
      </header>

      {/* Hamburger Menu Container - Fixed position to float on all screens */}
      <div
        className="hamburger-menu-container"
        onMouseEnter={() => setShowHamburgerMenu(true)}
        onMouseLeave={() => setShowHamburgerMenu(false)}
      >
        <div className="hamburger-icon">
          ☰ {/* Hamburger icon character */}
        </div>
        {showHamburgerMenu && (
          <div className="dropdown-menu">
            <div onClick={() => handleNavigationClick('instructions')}>Instructions</div>
            <div onClick={() => handleNavigationClick('videoList')}>Video List</div>
            <div onClick={() => handleNavigationClick('game')}>Game</div>
          </div>
        )}
      </div>

      {/* Instructions Page (conditionally visible using CSS class) */}
      <section id="instructions-page" className={showInstructions ? '' : 'hidden'}>
        <div className="instructions-content">
          {/* Level Selection Buttons */}
          <div className="level-selection-container">
            <button
              onClick={() => handleStartPlaying('beginner')}
              className="start-button"
              disabled={isLoadingVideoDetails}
            >
              {isLoadingVideoDetails ? 'Loading Videos...' : 'Beginner Level'}
            </button>
            <button
              onClick={() => handleStartPlaying('advanced')}
              className="start-button advanced-button"
              disabled={isLoadingVideoDetails}
            >
              {isLoadingVideoDetails ? 'Loading Videos...' : 'Advanced Level'}
            </button>
          </div>
          
          {isLoadingVideoDetails && (
            <p className="loading-instructions-message">
              (Please wait for videos to load)
            </p>
          )}
          <h2 className="instructions-title">How to Use This App:</h2>
          <p className="instructions-text">
            Welcome to "READ THE SHOT!" This app helps you practice reading volleyball shots.
            Follow these steps to improve your game:
          </p>
          <ol className="instructions-list">
            <li><strong>Watch the Video:</strong> The video will play from a designated start time and pause automatically at a specific point.</li>
            <li><strong>Read the Shot:</strong> Observe the hitter's body, arm, and hand motion carefully during the playback.</li>
            <li><strong>Select the Shot:</strong> Choose the button below that corresponds to the shot you believe the hitter is attempting (e.g., Line, Angle, Cut, Short, Jump Set).</li>
            <li><strong>Get Feedback:</strong>
              <ul className="feedback-list">
                <li>If you're **correct**, the video will continue playing for a few more seconds, allowing you to see the outcome.</li>
                <li>If you're **incorrect**, the video will reset to the start time, giving you another chance to read the shot.</li>
              </ul>
            </li>
            <li><strong>Restart or Next:</strong>
              <ul className="action-list">
                <li>Click "Restart Video" to re-watch the current video from the beginning of the action.</li>
                <li>Click "Next Video" to move to the next video in the list.</li>
              </ul>
            </li>
            <li><strong>Score Tracking:</strong> 
              <ul className="action-list">
                <li>Your score will be tracked over the first 10 unique videos and shots you attempt to read.</li>
                <li>Your score is only tracked on your first attempt any subsequent video restarts will not be counted towards your points</li>
                <li>After 10 attempts, your final score will be displayed, and you can choose to play again!</li>
              </ul>
            </li>
          </ol>
          
        </div>
      </section>

      {/* Main Application Content (always mounted, visibility controlled by CSS class) */}
      {/* This 'main' element will now always be in the DOM. */}
      <main className={(!showInstructions && !showVideoList) ? '' : 'hidden'}>
        {/* Video Section */}
        <section id="video-section">
          <p className="video-status-text">Video starts at {startAtTime} seconds and pauses at {dynamicStopTime} seconds. VIDEO: <strong>{playerState}</strong></p>
          {/* Always render the video player container */}
          <div className="video-player-container">
            {/* Pass initial video details from videoList[0] to ensure stable props on initial mount */}
            <Video
              ref={videoRef}
              embedId={videoList[0].id}
              startTime={videoList[0].initialStartTime}
              stopTime={videoList[0].initialStopTime}
              onPlayerInitialized={handlePlayerInitialized}
              onVideoPausedForStopTime={handleVideoPausedForModalCheck}
            />
            {/* Overlay for loading state */}
            {(isLoadingVideoDetails || shuffledVideoQueue.length === 0) && (
              <div className="video-overlay-message">
                <p className="loading-message">
                  Loading video details and preparing playback queue... Please wait...
                </p>
              </div>
            )}
            {/* Blackout screen overlayed on top of the video */}
            {isVideoScreenHidden && isBlackoutForInitialStop && (
              <div className="video-blackout-screen">
                {gameLevel === 'advanced' && blackoutCountdown !== null && (
                 <div className="blackout-timer">
                  <span>{blackoutCountdown}</span>
                 </div>
                )}
                {/* Content for blackout screen, e.g., countdown */}
              </div>
            )}
          </div>

          {/* Apply dynamic color to shotMessage */}
          {shotMessage && <p className="shot-message" style={{ color: shotMessageColor }}>{shotMessage}</p>}
        </section>

        {/* Controls Section */}
        <section id="controls-section">
          <ShotButtons onShotButtonClick={handleShotButtonClick} isPlayerReady={videoRef.current?.getIsPlayerReady() && !isLoadingVideoDetails} />

          <div className="action-buttons-container">
            <button
              onClick={() => {
                // Check player readiness via ref
                if (videoRef.current?.getIsPlayerReady() && videoRef.current && typeof videoRef.current.loadVideoAndPlay === 'function') {
                  videoRef.current.loadVideoAndPlay(currentVideo.id, startAtTime, currentVideo.initialStopTime);
                  setShotMessage('');
                  setShotMessageColor('#333'); // Reset message color on restart
                  setDynamicStopTime(currentVideo.initialStopTime);
                  setHighlightRestartButton(false); // Reset highlight
                  setHighlightNextButton(false); // Reset highlight
                  setIsVideoScreenHidden(false); // Ensure video is visible on restart
                } else {
                  console.warn("App.js: Video player methods not ready when Restart button clicked.");
                  setShotMessage("Player not ready. Please wait a moment.");
                  setShotMessageColor('#333'); // Default color if player not ready
                }
              }}
              className={`action-button ${highlightRestartButton ? 'highlight-active' : ''}`}
              // Check player readiness via ref
              disabled={!videoRef.current?.getIsPlayerReady() || isLoadingVideoDetails}
            >
              Restart Video
            </button>

            {/* Score Display - Display only if attempts have been made AND modal is NOT visible */}
            {totalAttemptsTracked > 0 && !showScoreModal && (
                <p className="score-display">
                    SCORE: {displayPercentage}% - VIDEO (<strong style={{color: 'white'}}>{displayCorrectCount}</strong>/10)
                </p>
            )}

            <button
              onClick={handleNextVideo}
              className={`action-button ${highlightNextButton ? 'highlight-active' : ''}`}
              // Check player readiness via ref
              disabled={!videoRef.current?.getIsPlayerReady() || isLoadingVideoDetails || shuffledVideoQueue.length === 0 || showScoreModal}
            >
              Next Video
            </button>
          </div>
        </section>
      </main>

      {/* Video List Section (always mounted, visibility controlled by CSS class) */}
      <section id="video-list-section" className={showVideoList ? '' : 'hidden'}>
        <h3>Video List:</h3>
        <ul className="video-list">
          {videoList.map((video, index) => (
            <li
              key={video.id}
              className={`video-list-item ${currentVideo.id === video.id ? 'current-video' : ''}`}
            >
              {video.title} {video.videoUrl && `(URL: ${video.videoUrl})`}
            </li>
          ))}
        </ul>
      </section>

      {/* Score Modal */}
      {showScoreModal && (
        <div className="score-modal-overlay">
          <div className="score-modal-content">
            <h2>Game Over!</h2>
            <p>Your Final Score:</p>
            <p className="final-score">{displayCorrectCount}/10 ({displayPercentage}%)</p> {/* Changed display to X/10 */}
            <button
              onClick={handleRestartGame}
              className="modal-restart-button"
            >
              Play Again!
            </button>
          </div>
        </div>
      )}

      {/* Effect to handle blackout countdown */}
      {blackoutCountdown !== null && (
        <div className="blackout-countdown">
          <p>Next attempt in {blackoutCountdown} seconds...</p>
        </div>
      )}

      {/* Sound Icon for toggling background music */}
      <div className="sound-icon-container" onClick={() => {
  if (backgroundMusicRef.current) {
    if (backgroundMusicRef.current.paused) {
      backgroundMusicRef.current.play();
    } else {
      backgroundMusicRef.current.pause();
    }
  }
}}>
  <img
    src="/sound-icon.svg"
    alt="Toggle sound"
    className={`sound-icon ${backgroundMusicRef.current && !backgroundMusicRef.current.paused ? 'sound-on' : 'sound-off'}`}
  />
</div>
    </div>
  );
}

export default App;
