import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react'; // Import useCallback
import '../Video.css'; 

// Ensure the YouTube IFrame API script is loaded globally once outside of the component's render.
// This script defines 'window.YT' and calls 'window.onYouTubeIframeAPIReady' when ready.
// We manage a queue for component-specific player initializations.
if (!window.YT_API_LOADED) {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag); // Fallback
  }
  window.YT_API_LOADED = true; // Mark as loaded
  window.ytPlayerReadyCallbacks = []; // Initialize a global queue for player ready callbacks
  window.onYouTubeIframeAPIReady = () => {
    console.log("Video.jsx: Global onYouTubeIframeAPIReady fired (from queue handler).");
    while (window.ytPlayerReadyCallbacks.length > 0) {
      const callback = window.ytPlayerReadyCallbacks.shift();
      if (typeof callback === 'function') {
        callback();
      }
    }
  };
}


// Use forwardRef to allow parent components to get a ref to this component
const Video = forwardRef(({ embedId, stopTime, startTime = 0, onPlayerInitialized }, ref) => {
  const iframeRef = useRef(null); // Ref to attach to the iframe element
  const playerRef = useRef(null); // Use a ref to store the YouTube player object
  const intervalRef = useRef(null); // Ref to store the interval ID for cleanup
  const playerCreationTimeoutRef = useRef(null); // Ref to store the timeout ID for player creation retry

  // New state to track if the internal YouTube player object is fully ready and its methods are available
  const [isInternalPlayerReady, setIsInternalPlayerReady] = useState(false);

  // NEW: Ref to store the latest stopTime value
  const stopTimeRef = useRef(stopTime);

  // NEW: Effect to keep stopTimeRef updated with the latest stopTime prop
  useEffect(() => {
    stopTimeRef.current = stopTime;
  }, [stopTime]);

  // useImperativeHandle exposes functions to the parent component via the ref
  // This dependency ensures these methods are redefined ONLY when isInternalPlayerReady changes
  useImperativeHandle(ref, () => ({
    playVideo: () => {
      // Add check before calling method
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.playVideo === 'function') {
        console.log("Video.jsx: Calling playVideo()");
        playerRef.current.playVideo();
      } else {
        console.warn("Video.jsx: playVideo - Player not internally ready or method not available.");
      }
    },
    pauseVideo: () => {
      // Add check before calling method
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        console.log("Video.jsx: Calling pauseVideo()");
        playerRef.current.pauseVideo();
      } else {
        console.warn("Video.jsx: pauseVideo - Player not internally ready or method not available.");
      }
    },
    stopVideo: () => {
      // Add check before calling method
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.stopVideo === 'function') {
        console.log("Video.jsx: Calling stopVideo()");
        playerRef.current.stopVideo();
      } else {
        console.warn("Video.jsx: stopVideo - Player not internally ready or method not available.");
      }
    },
    // Returns the current player state:
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    getPlayerState: () => {
      // Add check before calling method
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
        return playerRef.current.getPlayerState();
      }
      console.warn("Video.jsx: getPlayerState - Player not internally ready, returning null.");
      return null; // Return null if player is not ready or method is missing
    },
    // New method to get current time
    getCurrentTime: () => {
      // Add check before calling method
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        return playerRef.current.getCurrentTime();
      }
      console.warn("Video.jsx: getCurrentTime - Player not internally ready, returning 0.");
      return 0; // Return 0 if player is not ready or method is missing
    },
    // New method to seek to a specific time
    seekTo: (time, allowSeekAhead) => {
      // Add check before calling method
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.seekTo === 'function') {
        console.log(`Video.jsx: Calling seekTo(${time})`);
        playerRef.current.seekTo(time, allowSeekAhead);
      } else {
        console.warn("Video.jsx: seekTo - Player not internally ready or method not available.");
      }
    }
  }), [isInternalPlayerReady]); // Dependency is now the internal readiness state

  // Callback function when the player is ready, wrapped in useCallback
  const onPlayerReady = useCallback((event) => {
    console.log("Video.jsx: Player is ready. Event target:", event.target);
    setIsInternalPlayerReady(true); // Player is truly ready now
    if (onPlayerInitialized && typeof onPlayerInitialized === 'function') {
      onPlayerInitialized();
      console.log("Video.jsx: onPlayerInitialized callback fired.");
    }
    // Removed: Explicit playVideo() call with setTimeout. Rely on autoplay:1 in playerVars/src.
  }, [setIsInternalPlayerReady, onPlayerInitialized]); // Dependencies for useCallback


  // Callback function when the player's state changes (playing, paused, ended, etc.), wrapped in useCallback
  const onPlayerStateChange = useCallback((event) => {
    console.log("Video.jsx: Player state changed. New state:", event.data);
    // YT.PlayerState.PLAYING (1) = video is playing
    // YT.PlayerState.PAUSED (2) = video is paused
    // YT.PlayerState.ENDED (0) = video has ended

    if (event.data === window.YT.PlayerState.PLAYING) {
      console.log("Video.jsx: Video is playing. Starting interval check.");
      // Clear any existing interval to prevent multiple intervals from running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log("Video.jsx: Cleared previous interval.");
      }
      // If the video is playing, start an interval to check its current time
      intervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') { // Added check here
          const currentTime = playerRef.current.getCurrentTime();
          console.log(`Video.jsx: Current Time: ${currentTime.toFixed(2)}, Stop Time: ${stopTimeRef.current}`); // Use stopTimeRef.current
          if (stopTimeRef.current && currentTime >= stopTimeRef.current) { // Use stopTimeRef.current
            console.log(`Video.jsx: Stop time (${stopTimeRef.current}) reached or exceeded. Pausing video.`);
            playerRef.current.pauseVideo(); // Pause the video automatically at stopTime
            clearInterval(intervalRef.current); // Stop checking once paused
            intervalRef.current = null; // Reset ref
          }
        } else {
          console.log("Video.jsx: Player not available in interval check.");
          clearInterval(intervalRef.current); // Clear if player becomes unavailable
          intervalRef.current = null;
        }
      }, 100); // Check every 100 milliseconds for relatively precise stopping
    } else {
      console.log("Video.jsx: Video is not playing. Clearing interval.");
      // If the video is not playing (paused, ended, buffering, etc.), clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null; // Reset ref
      }
    }
  }, [intervalRef, playerRef, stopTimeRef]); // Dependencies for useCallback

  // Store the latest versions of the callbacks in refs to be used by the main useEffect
  const onPlayerReadyRef = useRef(onPlayerReady);
  const onPlayerStateChangeRef = useRef(onPlayerStateChange);

  // Update the refs whenever the memoized callbacks change
  useEffect(() => {
    onPlayerReadyRef.current = onPlayerReady;
    onPlayerStateChangeRef.current = onPlayerStateChange;
  }, [onPlayerReady, onPlayerStateChange]);


  // Effect for initializing and destroying the YouTube player
  useEffect(() => {
    console.log("Video.jsx: Player init useEffect triggered for embedId:", embedId);
    // Reset internal readiness when embedId changes
    setIsInternalPlayerReady(false); 

    const attemptPlayerCreation = () => {
      // Clear any previous attempts if this function is called again
      if (playerCreationTimeoutRef.current) {
        clearTimeout(playerCreationTimeoutRef.current);
        playerCreationTimeoutRef.current = null; // Reset ref
      }

      // Ensure both iframeRef.current exists, has contentWindow, AND the YT API is available
      // The `contentWindow` check is crucial for ensuring the iframe is fully ready for interaction.
      if (iframeRef.current && iframeRef.current.contentWindow && window.YT && window.YT.Player) {
        // Destroy existing player if any (important for re-mounts)
        if (playerRef.current) {
          if (typeof playerRef.current.destroy === 'function') {
            try {
              playerRef.current.destroy();
              console.log("Video.jsx: Existing YouTube player destroyed before new creation.");
            } catch (error) {
              console.warn("Video.jsx: Error destroying previous player (might be detached):", error);
            }
          }
          playerRef.current = null; // Ensure playerRef is null after destruction
        }

        console.log("Video.jsx: Creating new YT.Player instance for embedId:", embedId);
        const newPlayer = new window.YT.Player(iframeRef.current, {
          videoId: embedId, // The ID of the YouTube video
          playerVars: {
            autoplay: 1, // Set to 1 for automatic playback when component mounts/video changes
            controls: 1, // Show player controls
            rel: 0, // Don't show related videos from other channels at the end
            modestbranding: 1, // Less YouTube branding on the player
            start: startTime, // Pass startTime here too
          },
          events: {
            // Access callbacks via their refs to ensure the latest version is used
            'onReady': (event) => onPlayerReadyRef.current(event),
            'onStateChange': (event) => onPlayerStateChangeRef.current(event),
          },
        });
        playerRef.current = newPlayer;
      } else {
        console.log("Video.jsx: Deferring player creation. YT API ready:", !!window.YT, "Iframe Ref Ready:", !!iframeRef.current, "ContentWindow Ready:", !!(iframeRef.current && iframeRef.current.contentWindow));
        // If not ready, schedule another attempt after a short delay
        playerCreationTimeoutRef.current = setTimeout(attemptPlayerCreation, 100); // Retry every 100ms
      }
    };

    // Introduce a slight initial delay before the first attempt to create the player.
    // This gives the browser more time to fully render the iframe and its contentWindow.
    playerCreationTimeoutRef.current = setTimeout(attemptPlayerCreation, 50); // Initial delay of 50ms

    // Cleanup function: This runs when the component unmounts or before the effect re-runs
    return () => {
      console.log("Video.jsx: Player init cleanup function running for embedId:", embedId);
      // Clear any pending creation attempt if the component unmounts
      if (playerCreationTimeoutRef.current) {
        clearTimeout(playerCreationTimeoutRef.current);
        playerCreationTimeoutRef.current = null;
      }

      if (playerRef.current) { // Ensure player exists before attempting to interact
        // Pause gracefully before destroying if possible
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
        try {
          playerRef.current.destroy(); // Destroy the YouTube player instance to prevent memory leaks
          console.log("Video.jsx: YouTube player destroyed for embedId:", embedId);
        } catch (error) {
          console.warn("Video.jsx: Error during player destruction (already detached?):", error);
        }
        playerRef.current = null; // Ensure playerRef is null after destruction
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Clear any active time-checking interval
        intervalRef.current = null;
        console.log("Video.jsx: Interval cleared during cleanup.");
      }
    };
  }, [embedId, startTime, onPlayerReadyRef, onPlayerStateChangeRef]); // Removed playerRef and iframeRef from dependencies.


  return (
    <div className="video-responsive">
      {/* The iframe needs a ref so the YT.Player constructor can target it */}
      <iframe
        ref={iframeRef} // Attach the ref here
        width="853" // Default width
        height="480" // Default height
        // Removed 'picture-in-picture' from the allow attribute to prevent policy violation
        src={`http://www.youtube.com/embed/${embedId}?enablejsapi=1&start=${startTime}&autoplay=1`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        title="Embedded YouTube video"
      ></iframe>
    </div>
  );
}); // forwardRef closes here

export default Video;