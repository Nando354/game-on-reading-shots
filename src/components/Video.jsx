import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import '../Video.css';

// Use forwardRef to allow parent components to get a ref to this component
const Video = forwardRef(({ embedId, stopTime, startTime = 0, onPlayerInitialized, showVideoElement }, ref) => {
  const iframeRef = useRef(null); // Ref to attach to the iframe element
  const playerRef = useRef(null); // Use a ref to store the YouTube player object
  const intervalRef = useRef(null); // Ref to store the interval ID for cleanup

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
  }), [isInternalPlayerReady]); // Dependency is now the internal readiness state

  // Effect for initializing and destroying the YouTube player (depends ONLY on embedId)
  useEffect(() => {
    console.log("Video.jsx: Player init useEffect triggered for embedId:", embedId);
    // Reset internal readiness ONLY when embedId changes
    setIsInternalPlayerReady(false); 

    window.onYouTubeIframeAPIReady = () => {
      console.log("Video.jsx: onYouTubeIframeAPIReady fired.");
      if (iframeRef.current) {
        console.log("Video.jsx: Creating new YT.Player instance.");
        const newPlayer = new window.YT.Player(iframeRef.current, {
          videoId: embedId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange, // Attach state change listener here
          },
        });
        playerRef.current = newPlayer; // Store the player instance in the ref
      } else {
        console.log("Video.jsx: iframeRef.current is null when onYouTubeIframeAPIReady fired.");
      }
    };

    if (window.YT && window.YT.Player) {
      console.log("Video.jsx: YT API already loaded, calling onYouTubeIframeAPIReady manually.");
      window.onYouTubeIframeAPIReady();
    } else {
      console.log("Video.jsx: YT API not yet loaded.");
    }

    // Cleanup function for player initialization
    return () => {
      console.log("Video.jsx: Player init cleanup function running.");
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        console.log("Video.jsx: YouTube player destroyed.");
      }
      // Also clear the interval here in case the component unmounts while playing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log("Video.jsx: Interval cleared during player init cleanup.");
      }
      if (window.onYouTubeIframeAPIReady) {
          delete window.onYouTubeIframeAPIReady;
          console.log("Video.jsx: onYouTubeIframeAPIReady global function deleted.");
      }
    };
  }, [embedId]); // This effect now depends ONLY on embedId

  // Callback function when the player is ready (from YouTube API)
  const onPlayerReady = (event) => {
    console.log("Video.jsx: Player is ready. Event target:", event.target);
    setIsInternalPlayerReady(true); // Player is truly ready now
    if (onPlayerInitialized && typeof onPlayerInitialized === 'function') {
      onPlayerInitialized();
      console.log("Video.jsx: onPlayerInitialized callback fired.");
    }
    if (startTime > 0) {
      console.log(`Video.jsx: Seeking to startTime: ${startTime}`);
      event.target.seekTo(startTime, true);
    }
  };

  // Callback function when the player's state changes
  // This function needs to be stable and capture the latest `stopTime`
  const onPlayerStateChange = (event) => {
    console.log("Video.jsx: Player state changed. New state:", event.data);
    if (event.data === window.YT.PlayerState.PLAYING) {
      console.log("Video.jsx: Video is playing. Starting interval check.");
      // Clear any existing interval before starting a new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log("Video.jsx: Cleared previous interval.");
      }
      // The interval now directly uses the `stopTimeRef.current`
      intervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          // Use stopTimeRef.current for the check
          if (stopTimeRef.current && currentTime >= stopTimeRef.current) {
            console.log(`Video.jsx: Stop time (${stopTimeRef.current}) reached or exceeded. Pausing video.`);
            playerRef.current.pauseVideo();
            clearInterval(intervalRef.current);
            intervalRef.current = null;
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
    }
  };

  return (
    // Control visibility using CSS display property
    <div className="video-responsive" style={{ display: showVideoElement ? 'block' : 'none' }}>
      <iframe
        ref={iframeRef}
        width="853"
        height="480"
        src={`http://www.youtube.com/embed/${embedId}?enablejsapi=1`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        title="Embedded YouTube video"
      ></iframe>
    </div>
  );
});

export default Video;
