import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import '../Video.css';

// Ensure the YouTube IFrame API script is loaded globally once.
// This script defines 'window.YT' and calls 'window.onYouTubeIframeAPIReady' when ready.
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
  // Define the global callback function. This will be called by the YouTube API when it's fully loaded.
  window.onYouTubeIframeAPIReady = () => {
    console.log("Video.jsx: Global onYouTubeIframeAPIReady fired. YT API is now available.");
  };
}

const Video = forwardRef(({ embedId, stopTime, startTime = 0, onPlayerInitialized, onVideoPausedForStopTime }, ref) => { // Added onVideoPausedForStopTime prop
  const iframeRef = useRef(null); // Ref to attach to the iframe element
  const playerRef = useRef(null); // Use a ref to store the YouTube player object
  const intervalRef = useRef(null); // Ref to store the interval ID for cleanup
  const playerCreationTimeoutRef = useRef(null); // Ref to store the timeout ID for player creation retry

  // State to track if the internal YouTube player object is fully ready and its methods are available
  const [isInternalPlayerReady, setIsInternalPlayerReady] = useState(false);

  // Ref to store the latest stopTime value (to prevent stale closures in setInterval)
  const stopTimeRef = useRef(stopTime);

  // Effect to keep stopTimeRef updated with the latest stopTime prop
  useEffect(() => {
    stopTimeRef.current = stopTime;
  }, [stopTime]);

  // useImperativeHandle exposes functions to the parent component via the ref
  useImperativeHandle(ref, () => ({
    playVideo: () => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.playVideo === 'function') {
        console.log("Video.jsx: Calling playVideo()");
        playerRef.current.playVideo();
      } else {
        console.warn("Video.jsx: playVideo - Player not internally ready or method not available.");
      }
    },
    pauseVideo: () => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        console.log("Video.jsx: Calling pauseVideo()");
        playerRef.current.pauseVideo();
      } else {
        console.warn("Video.jsx: pauseVideo - Player not internally ready or method not available.");
      }
    },
    stopVideo: () => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.stopVideo === 'function') {
        console.log("Video.jsx: Calling stopVideo()");
        playerRef.current.stopVideo();
      } else {
        console.warn("Video.jsx: stopVideo - Player not internally ready or method not available.");
      }
    },
    getPlayerState: () => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
        return playerRef.current.getPlayerState();
      }
      console.warn("Video.jsx: getPlayerState - Player not internally ready, returning null.");
      return null;
    },
    getCurrentTime: () => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        return playerRef.current.getCurrentTime();
      }
      console.warn("Video.jsx: getCurrentTime - Player not internally ready, returning 0.");
      return 0;
    },
    seekTo: (time, allowSeekAhead) => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.seekTo === 'function') {
        console.log(`Video.jsx: Calling seekTo(${time})`);
        playerRef.current.seekTo(time, allowSeekAhead);
      } else {
        console.warn("Video.jsx: seekTo - Player not internally ready or method not available.");
      }
    }
  }), [isInternalPlayerReady]); // Redefine exposed methods only when internal readiness changes

  // Callback function when the player is ready (from YouTube API)
  const onPlayerReady = useCallback((event) => {
    console.log("Video.jsx: Player is ready. Event target:", event.target);
    setIsInternalPlayerReady(true); // Player is truly ready now
    if (onPlayerInitialized && typeof onPlayerInitialized === 'function') {
      onPlayerInitialized();
      console.log("Video.jsx: onPlayerInitialized callback fired.");
    }
    // No autoplay here
  }, [onPlayerInitialized]);

  // Callback function when the player's state changes
  const onPlayerStateChange = useCallback((event) => {
    console.log("Video.jsx: Player state changed. New state:", event.data);
    if (event.data === window.YT.PlayerState.PLAYING) {
      console.log("Video.jsx: Video is playing. Starting interval check.");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log("Video.jsx: Cleared previous interval.");
      }
      intervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          if (stopTimeRef.current && currentTime >= stopTimeRef.current) {
            console.log(`Video.jsx: Stop time (${stopTimeRef.current}) reached or exceeded. Pausing video.`);
            playerRef.current.pauseVideo();
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            // Call the new callback when video pauses due to stopTime
            if (onVideoPausedForStopTime && typeof onVideoPausedForStopTime === 'function') {
              onVideoPausedForStopTime();
            }
          }
        } else {
          console.log("Video.jsx: Player not available in interval check (during playback).");
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 100);
    } else {
      console.log("Video.jsx: Video is not playing. Clearing interval.");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // If video ended naturally (state 0) or paused (state 2) and it wasn't explicitly paused by the user,
      // and it reached the stop time, trigger the callback.
      // This covers cases where it might have ended slightly past stopTime naturally.
      if ((event.data === window.YT.PlayerState.ENDED || event.data === window.YT.PlayerState.PAUSED) &&
          onVideoPausedForStopTime && typeof onVideoPausedForStopTime === 'function' &&
          playerRef.current && typeof playerRef.current.getCurrentTime === 'function' &&
          playerRef.current.getCurrentTime() >= stopTimeRef.current - 0.5 // Check if it's near or past stopTime
        ) {
          onVideoPausedForStopTime();
      }
    }
  }, [intervalRef, playerRef, stopTimeRef, onVideoPausedForStopTime]); // Added onVideoPausedForStopTime to dependencies

  const onPlayerReadyRef = useRef(onPlayerReady);
  const onPlayerStateChangeRef = useRef(onPlayerStateChange);

  useEffect(() => {
    onPlayerReadyRef.current = onPlayerReady;
    onPlayerStateChangeRef.current = onPlayerStateChange;
  }, [onPlayerReady, onPlayerStateChange]);


  // Player initialization and lifecycle management
  useEffect(() => {
    console.log("Video.jsx: Player init useEffect triggered for embedId:", embedId);
    setIsInternalPlayerReady(false); 

    // Clear any existing retry timeout
    if (playerCreationTimeoutRef.current) {
      clearTimeout(playerCreationTimeoutRef.current);
      playerCreationTimeoutRef.current = null;
    }

    const createPlayerInstance = () => {
      // Check for both window.YT and iframeRef.current before proceeding
      if (iframeRef.current && window.YT && window.YT.Player) {
        // Destroy existing player if it exists before creating a new one
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          try {
            if (typeof playerRef.current.pauseVideo === 'function') {
              playerRef.current.pauseVideo();
            }
            playerRef.current.destroy();
            playerRef.current = null;
            console.log("Video.jsx: Existing YouTube player destroyed before creating new one.");
          } catch (error) {
            console.warn("Video.jsx: Error destroying previous player (might be detached):", error);
          }
        }

        console.log("Video.jsx: Creating new YT.Player instance for embedId:", embedId);
        const newPlayer = new window.YT.Player(iframeRef.current, {
          videoId: embedId,
          playerVars: {
            autoplay: 0, // IMPORTANT: Set to 0 to prevent autoplay on initial load
            controls: 1,
            rel: 0,
            modestbranding: 1,
            start: startTime, // Pass startTime here
            mute: 1, // Mute the video
          },
          events: {
            'onReady': (event) => onPlayerReadyRef.current(event),
            'onStateChange': (event) => onPlayerStateChangeRef.current(event),
          },
        });
        playerRef.current = newPlayer;
      } else {
        // If API or iframe is not ready, retry creation after a short delay
        console.log("Video.jsx: YT API or iframe not fully ready to create player. Retrying in 100ms...");
        playerCreationTimeoutRef.current = setTimeout(createPlayerInstance, 100);
      }
    };

    // Initial attempt to create the player after a small delay to let DOM settle
    playerCreationTimeoutRef.current = setTimeout(createPlayerInstance, 200); // Increased initial delay to 200ms

    // Cleanup function
    return () => {
      console.log("Video.jsx: Player cleanup running for embedId:", embedId);
      if (playerCreationTimeoutRef.current) {
        clearTimeout(playerCreationTimeoutRef.current);
        playerCreationTimeoutRef.current = null;
      }
      if (playerRef.current) {
        // Clear interval check before destroying player
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        if (typeof playerRef.current.pauseVideo === 'function') {
          try { playerRef.current.pauseVideo(); } catch (e) { console.warn("Error pausing player during cleanup:", e); }
        }
        try {
          playerRef.current.destroy();
          playerRef.current = null;
          console.log("Video.jsx: YouTube player destroyed for embedId:", embedId);
        } catch (error) {
          console.warn("Video.jsx: Error during player destruction (already detached or invalid state):", error);
        }
      }
    };
  }, [embedId, startTime]); // Dependencies: embedId and startTime

  return (
    <div className="video-responsive">
      <iframe
        ref={iframeRef}
        width="853"
        height="480"
        src={`https://www.youtube.com/embed/${embedId}?enablejsapi=1&start=${startTime}&autoplay=0&mute=1`} // CRITICAL FIX: Changed to HTTPS and autoplay=0
        frameBorder="0"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" // Kept standard allow attributes
        referrerPolicy="strict-origin-when-cross-origin"
        title="Embedded YouTube video"
      ></iframe>
    </div>
  );
});

export default Video;
