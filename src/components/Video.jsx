import React, { useRef, useEffect, forwardRef, useState, useCallback, useImperativeHandle } from 'react';
import '../Video.css';

// Ensure the YouTube IFrame API script is loaded globally once.
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
  window.onYouTubeIframeAPIReady = () => {
    console.log("Video.jsx: Global onYouTubeIframeAPIReady fired. YT API is now available.");
  };
}

const Video = forwardRef(({ embedId, stopTime, startTime = 0, onPlayerInitialized, onVideoPausedForStopTime }, ref) => {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const playerCreationTimeoutRef = useRef(null);

  const [isInternalPlayerReady, setIsInternalPlayerReady] = useState(false);
  // NEW: State to explicitly track if the video was paused by our app's logic
  const [isPausedByAppLogic, setIsPausedByAppLogic] = useState(false);

  const stopTimeRef = useRef(stopTime); // Use ref to hold stopTime
  const startTimeRef = useRef(startTime); // Use ref to hold startTime
  const embedIdRef = useRef(embedId); // Use ref to hold embedId

  // Update refs when props change
  useEffect(() => {
    stopTimeRef.current = stopTime;
    startTimeRef.current = startTime;
    // Only update embedIdRef if it actually changes, to avoid unnecessary re-renders or API calls
    if (embedIdRef.current !== embedId) {
      embedIdRef.current = embedId;
    }
  }, [stopTime, startTime, embedId]);

  // Callback for when the player is ready
  const onPlayerReady = useCallback((event) => {
    console.log("Video.jsx: Player is ready. Event target:", event.target);
    setIsInternalPlayerReady(true); // Player is truly ready now
    setIsPausedByAppLogic(false); // Reset this flag when player is ready for a new video/state

    if (onPlayerInitialized && typeof onPlayerInitialized === 'function') {
      onPlayerInitialized(); // Notify parent that player is ready
      console.log("Video.jsx: onPlayerInitialized callback fired.");
    }
    // Autoplay the video once it's ready and loaded (handled by loadVideoById or initial creation)
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      console.log("Video.jsx: Auto-playing video on player ready.");
      playerRef.current.playVideo();
    }
  }, [onPlayerInitialized]);

  // Callback for when the player's state changes
  const onPlayerStateChange = useCallback((event) => {
    console.log(`Video.jsx: Player state changed. New state: ${event.data} (Current stopTimeRef: ${stopTimeRef.current})`);

    if (event.data === window.YT.PlayerState.PLAYING) {
      console.log("Video.jsx: Video is playing. Starting interval check.");
      // Clear any existing interval to prevent duplicates
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          const currentTimeStr = typeof currentTime === 'number' && !isNaN(currentTime)
            ? currentTime.toFixed(2)
            : 'N/A';
          // console.log(`Video.jsx: Interval check - Current Time: ${currentTimeStr}, Stop Time: ${stopTimeRef.current}`);
          // Use stopTimeRef.current for the check
          if (stopTimeRef.current && currentTime >= stopTimeRef.current) {
            console.log(`Video.jsx: Stop time (${stopTimeRef.current}) reached or exceeded. Attempting to pause video.`);
            // Clear the interval immediately to prevent multiple pause calls
            clearInterval(intervalRef.current);
            intervalRef.current = null;

            // Attempt to pause. Add a small delay and a fallback to stopVideo if pause fails.
            setTimeout(() => {
              if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
                playerRef.current.pauseVideo();
                setIsPausedByAppLogic(true); // Mark that app paused it
                console.log("Video.jsx: Player state immediately after pauseVideo:", playerRef.current.getPlayerState());

                // Double-check if it's still playing after a very short moment
                setTimeout(() => {
                  if (playerRef.current && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
                    console.warn("Video.jsx: Player still playing after pause, attempting stopVideo as fallback.");
                    playerRef.current.stopVideo(); // More aggressive stop
                  }
                }, 20); // Very short delay to check state
              } else {
                console.warn("Video.jsx: Player not available for delayed pause.");
              }
            }, 50); // Small delay before initial pausing

            // Call the parent callback after a slight delay to ensure player state is stable
            setTimeout(() => {
              if (onVideoPausedForStopTime && typeof onVideoPausedForStopTime === 'function') {
                onVideoPausedForStopTime();
              }
            }, 100); // Delay callback slightly after pause attempt
          }
        } else {
          console.log("Video.jsx: Player not available in interval check (during playback). Clearing interval.");
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 100); // Check every 100ms
    } else {
      // If state is not PLAYING, ensure interval is cleared
      console.log("Video.jsx: Video is not playing. Clearing interval.");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // If the player transitions to a non-playing state (e.g., paused by user, ended),
      // and it wasn't explicitly paused by our stop-time logic, reset isPausedByAppLogic.
      // This is important if the user manually pauses or video ends naturally.
      if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
        // Only reset if it wasn't our app's pause, or if it was our app's pause but it's now ended.
        if (!isPausedByAppLogic || (isPausedByAppLogic && event.data === window.YT.PlayerState.ENDED)) {
          console.log("Video.jsx: Player paused/ended by external factor or naturally, resetting isPausedByAppLogic.");
          setIsPausedByAppLogic(false);
        }
      } else {
        // For other states like buffering, unstarted, cueing, ensure isPausedByAppLogic is false
        setIsPausedByAppLogic(false);
      }
    }
  }, [onVideoPausedForStopTime, isPausedByAppLogic]);

  // Store the latest versions of the callbacks in refs to be used by the main useEffect
  const onPlayerReadyRef = useRef(onPlayerReady);
  const onPlayerStateChangeRef = useRef(onPlayerStateChange);

  useEffect(() => {
    onPlayerReadyRef.current = onPlayerReady;
    onPlayerStateChangeRef.current = onPlayerStateChange;
  }, [onPlayerReady, onPlayerStateChange]);

  // Main effect for player initialization and loading new videos
  useEffect(() => {
    console.log("Video.jsx: Main player useEffect triggered for embedId:", embedId);

    // Function to create or load video into existing player
    const createOrLoadPlayer = () => {
      if (playerCreationTimeoutRef.current) {
        clearTimeout(playerCreationTimeoutRef.current);
        playerCreationTimeoutRef.current = null;
      }

      if (iframeRef.current && iframeRef.current.contentWindow && window.YT && window.YT.Player) {
        if (playerRef.current) {
          // Player already exists, load new video
          console.log("Video.jsx: Player exists, loading new video:", embedIdRef.current);
          if (typeof playerRef.current.loadVideoById === 'function') {
            playerRef.current.loadVideoById({
              videoId: embedIdRef.current,
              startSeconds: startTimeRef.current,
              autoplay: 1, // Autoplay the new video
              mute: 1, // Keep muted for autoplay policies
            });
            // Do NOT setIsInternalPlayerReady(true) here. Let onPlayerReady handle it.
            // Do NOT call onPlayerInitialized here. Let onPlayerReady handle it.
          } else {
            console.warn("Video.jsx: loadVideoById method not available on playerRef.current. Attempting re-creation.");
            // Fallback: If loadVideoById is somehow missing, destroy and recreate
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
              try { playerRef.current.destroy(); } catch (e) { console.warn("Error destroying player before re-creation:", e); }
            }
            playerRef.current = null; // Clear ref to force new creation
            playerCreationTimeoutRef.current = setTimeout(createOrLoadPlayer, 50); // Retry creation
          }
        } else {
          // Player does not exist, create a new one
          console.log("Video.jsx: Creating new YT.Player instance for embedId:", embedIdRef.current);
          const newPlayer = new window.YT.Player(iframeRef.current, {
            videoId: embedIdRef.current,
            playerVars: {
              autoplay: 1, // Autoplay when player is first created
              controls: 1,
              rel: 0,
              modestbranding: 1,
              start: startTimeRef.current,
              mute: 1, // Mute by default to satisfy autoplay policies
              origin: window.location.origin,
            },
            events: {
              'onReady': (event) => onPlayerReadyRef.current(event),
              'onStateChange': (event) => onPlayerStateChangeRef.current(event),
            },
          });
          playerRef.current = newPlayer;
        }
      } else {
        console.log("Video.jsx: Deferring player creation/load. YT API ready:", !!window.YT, "Iframe Ref Ready:", !!iframeRef.current, "ContentWindow Ready:", !!(iframeRef.current && iframeRef.current.contentWindow));
        playerCreationTimeoutRef.current = setTimeout(createOrLoadPlayer, 100);
      }
    };

    // Initial call to create or load the player
    // This will run whenever embedId changes, ensuring the player updates
    playerCreationTimeoutRef.current = setTimeout(createOrLoadPlayer, 50);

    // Cleanup function
    return () => {
      console.log("Video.jsx: Player cleanup running for embedId:", embedIdRef.current);
      if (playerCreationTimeoutRef.current) {
        clearTimeout(playerCreationTimeoutRef.current);
        playerCreationTimeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Only destroy the player if it exists and is attached to the DOM
      if (playerRef.current && typeof playerRef.current.destroy === 'function' && iframeRef.current && iframeRef.current.parentNode) {
        try {
          playerRef.current.destroy();
          console.log("Video.jsx: YouTube player destroyed for embedId:", embedIdRef.current);
        } catch (error) {
          console.warn("Video.jsx: Error during player destruction:", error);
        }
        playerRef.current = null;
      } else {
        console.log("Video.jsx: Player not destroyed during cleanup (not found or not attached).");
      }
      setIsInternalPlayerReady(false); // Reset internal readiness state
      setIsPausedByAppLogic(false); // Reset app-paused state
    };
  }, [embedId]); // Depend on embedId to trigger loading of new videos

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    playVideo: () => {
      // Allow play only if not explicitly paused by app logic, or if we are overriding an app pause
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.playVideo === 'function') {
        console.log("Video.jsx: Calling playVideo() via imperative handle.");
        setIsPausedByAppLogic(false); // Clear the app-paused flag if play is explicitly called
        playerRef.current.playVideo();
      } else {
        console.warn("Video.jsx: playVideo - Player not internally ready or method not available.");
      }
    },
    pauseVideo: () => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        console.log("Video.jsx: Calling pauseVideo() via imperative handle.");
        playerRef.current.pauseVideo();
      } else {
        console.warn("Video.jsx: pauseVideo - Player not internally ready or method not available.");
      }
    },
    stopVideo: () => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.stopVideo === 'function') {
        console.log("Video.jsx: Calling stopVideo() via imperative handle.");
        playerRef.current.stopVideo();
      } else {
        console.warn("Video.jsx: stopVideo - Player not internally ready or method not available.");
      }
    },
    getPlayerState: () => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
        return playerRef.current.getPlayerState();
      }
      return null;
    },
    getCurrentTime: () => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        return playerRef.current.getCurrentTime();
      }
      return 0;
    },
    seekTo: (time, allowSeekAhead) => {
      if (isInternalPlayerReady && playerRef.current && typeof playerRef.current.seekTo === 'function') {
        console.log(`Video.jsx: Calling seekTo(${time}) via imperative handle.`);
        setIsPausedByAppLogic(false); // Clear app-paused flag on seek
        playerRef.current.seekTo(time, allowSeekAhead);
      } else {
        console.warn("Video.jsx: seekTo - Player not internally ready or method not available.");
      }
    },
    // NEW: Method to load a new video and update its parameters
    loadNewVideo: (newEmbedId, newStartTime, newStopTime) => {
      console.log(`Video.jsx: loadNewVideo called with ID: ${newEmbedId}, Start: ${newStartTime}, Stop: ${newStopTime}`);
      // Update refs immediately
      embedIdRef.current = newEmbedId;
      startTimeRef.current = newStartTime;
      stopTimeRef.current = newStopTime;
      setIsPausedByAppLogic(false); // Reset app-paused flag on new video load

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById({
          videoId: newEmbedId,
          startSeconds: newStartTime,
          autoplay: 1, // Autoplay the new video
          mute: 1, // Keep muted for autoplay policies
        });
        // Do NOT setIsInternalPlayerReady(true) here. Let onPlayerReady handle it.
        // Do NOT call onPlayerInitialized here. Let onPlayerReady handle it.
      } else {
        console.warn("Video.jsx: loadNewVideo - Player not initialized or loadVideoById method not available. Triggering main useEffect via prop change.");
        // If player isn't ready, rely on the main useEffect (which depends on `embedId` prop)
        // to re-create or load the player. This is why `embedId` must be a prop, not just a ref.
        // If the embedId prop itself hasn't changed, but only start/stop times, this won't re-trigger.
        // In that case, the `loadVideoById` call above is crucial.
        // If playerRef.current is null here, it means the main useEffect hasn't created it yet.
        // We should ensure the main useEffect is responsible for initial creation.
        // This `loadNewVideo` method is for *subsequent* video changes on an *existing* player.
        // If playerRef.current is null here, it's an unexpected state.
      }
    },
    // NEW: Method to load a video and play it immediately
    loadVideoAndPlay: (embedId, startTime, stopTime) => {
      console.log(`Video.jsx: loadVideoAndPlay called with ID: ${embedId}, Start: ${startTime}, Stop: ${stopTime}`);
      // Update refs
      embedIdRef.current = embedId;
      startTimeRef.current = startTime;
      stopTimeRef.current = stopTime;
      setIsPausedByAppLogic(false);

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById({
          videoId: embedId,
          startSeconds: startTime,
          autoplay: 1,
          mute: 1,
        });
      } else {
        console.warn("Video.jsx: loadVideoAndPlay - Player not initialized or loadVideoById method not available.");
        // Optionally, you could trigger a re-render or handle this case as needed
      }
    },
    // NEW: Expose isInternalPlayerReady status
    getIsPlayerReady: () => isInternalPlayerReady,
  }), [isInternalPlayerReady, isPausedByAppLogic]); // Add isPausedByAppLogic to dependencies

  // Video.jsx
  useEffect(() => {
    // ...player setup...
    if (isInternalPlayerReady) {
      // DO NOT auto-play here!
      // Only play when App.js calls loadVideoAndPlay
    }
  }, [isInternalPlayerReady]);

  return (
    <div className="video-responsive">
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${embedId}?enablejsapi=1&controls=1&rel=0&modestbranding=1&mute=1&origin=${window.location.origin}`}
        frameBorder="0"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        title="Embedded YouTube video"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
      ></iframe>
    </div>
  );
});

export default Video;
