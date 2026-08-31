import React, { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Sparkles,
  Check,
  PictureInPicture,
  Loader2,
  AlertCircle
} from "lucide-react";

export interface VideoQualityOption {
  id: number; // -1 for Auto, or level index
  label: string;
  height?: number;
  bitrate?: number;
}

export interface ModernVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onDurationChange?: (duration: number) => void;
  onPreviewLimitReached?: () => void;
  previewLimitSeconds?: number;
  className?: string;
  /** Pass the video's unique ID to enable automatic progress save/restore across sessions */
  videoId?: string | number;
}

const SPEED_OPTIONS = [
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "1x (Обычная)", value: 1.0 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "1.75x", value: 1.75 },
  { label: "2x", value: 2.0 },
];

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export function ModernVideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  onEnded,
  onTimeUpdate,
  onDurationChange,
  onPreviewLimitReached,
  previewLimitSeconds,
  className = "",
  videoId,
}: ModernVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<any>(null);
  const isDraggingScrubberRef = useRef(false);
  // Track whether actual playback has ever begun (prevents poster flash during buffering)
  const hasStartedPlaybackRef = useRef(false);
  // Persist progress save interval
  const progressSaveIntervalRef = useRef<any>(null);
  const currentStreamKeyRef = useRef<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const bufferingTimeoutRef = useRef<any>(null);

  const setBuffering = useCallback((buffering: boolean) => {
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
    if (buffering) {
      // Debounce: only show spinner if playback is genuinely stalled for 450ms+
      bufferingTimeoutRef.current = setTimeout(() => {
        setIsBuffering(true);
      }, 450);
    } else {
      setIsBuffering(false);
    }
  }, []);

  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem("player_volume");
      return saved !== null ? parseFloat(saved) : 1;
    } catch {
      return 1;
    }
  });
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("player_muted") === "true";
    } catch {
      return false;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Quality settings
  const [qualityOptions, setQualityOptions] = useState<VideoQualityOption[]>([
    { id: -1, label: "Авто" }
  ]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [activeQualityLabel, setActiveQualityLabel] = useState<string>("Авто");

  // Dropdown menus
  const [openSettingsMenu, setOpenSettingsMenu] = useState(false);
  const [settingsSubmenu, setSettingsSubmenu] = useState<"root" | "quality" | "speed">("root");

  // Hover preview tooltip on scrubber
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  // Skip animations
  const [skipFeedback, setSkipFeedback] = useState<"forward" | "backward" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cleanup helper for Hls & Video instance
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch (e) {
        console.warn("[ModernVideoPlayer] Hls destroy warning:", e);
      }
      hlsRef.current = null;
    }
  }, []);

  // Initialize and load stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Check if the exact stream is already active (prevents stream teardown on token refreshes or re-renders)
    const streamKey = src.split("?")[0];
    if (currentStreamKeyRef.current === streamKey && (hlsRef.current || video.src)) {
      return; // Stream is already playing uninterrupted
    }
    currentStreamKeyRef.current = streamKey;

    setErrorMessage(null);
    const wasPlaying = isPlaying || autoPlay;
    if (wasPlaying) {
      setBuffering(true);
    } else {
      setIsBuffering(false);
    }

    // Save previous playback position so stream transitions or buffer hiccups never reset to 0:00
    const resumeTime = video.currentTime > 0 ? video.currentTime : currentTime;

    // Stop and clean up any existing Hls
    destroyHls();

    const isHlsUrl = src.includes(".m3u8") || src.includes("/manifest");

    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        // ── Smooth VOD Pre-buffering & Zero-Stutter Configuration ──
        maxBufferLength: 90,               // Smooth 90s buffer ahead
        maxMaxBufferLength: 180,           // Max 180s buffer
        maxBufferSize: 256 * 1024 * 1024,  // 256MB buffer memory limit
        maxBufferHole: 0.6,                // Seamlessly tolerate micro GOP timestamp gaps
        highBufferWatchdogPeriod: 2,       // Active stall watchdog to prevent player freezes
        nudgeMaxRetry: 5,                  // Instantly micro-nudge (<10ms) across segment boundaries without stall
        nudgeOffset: 0.1,                  // Tiny 0.1s offset to skip micro-gaps invisibly
        startFragPrefetch: true,           // Prefetch next segment in parallel before current finishes
        backBufferLength: 60,              // Keep past 60s in buffer for instant rewind
        lowLatencyMode: false,             // VOD mode for maximum stability
        startLevel: -1,
        abrEwmaDefaultEstimate: 8000000,   // Assume fast connection (8 Mbps) to avoid starting at low quality
        abrBandWidthFactor: 0.9,
        abrBandWidthUpFactor: 0.7,
        abrMaxWithRealBitrate: false,      // Prevent erratic bitrate jumps
        maxStarvationDelay: 6,             // Stay on current quality unless true network stall
        maxLoadingDelay: 6,
        fragLoadingTimeOut: 30000,
        fragLoadingMaxRetry: 8,
        fragLoadingRetryDelay: 500,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 6,
        progressive: true,
        enableWorker: true,
        defaultAudioCodec: "mp4a.40.2",
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setBuffering(false);
        if (data.levels && data.levels.length > 0) {
          const levels: VideoQualityOption[] = [
            { id: -1, label: "Авто" },
            ...data.levels.map((lvl, idx) => ({
              id: idx,
              height: lvl.height,
              bitrate: lvl.bitrate,
              label: lvl.height ? `${lvl.height}p` : `Уровень ${idx + 1}`
            }))
          ];
          setQualityOptions(levels);
        } else {
          setQualityOptions([{ id: -1, label: "Авто (HD)" }]);
        }

        // Seamlessly restore playback time if we were already in the middle of playback
        if (resumeTime > 0) {
          try {
            video.currentTime = resumeTime;
          } catch {}
        }

        if (wasPlaying) {
          video.play().catch(() => setIsPlaying(false));
        }
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setBuffering(false);
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        setBuffering(false);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const levelObj = hls.levels[data.level];
        if (levelObj && levelObj.height) {
          if (hls.autoLevelEnabled) {
            setActiveQualityLabel(`Авто (${levelObj.height}p)`);
          } else {
            setActiveQualityLabel(`${levelObj.height}p`);
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        const currentPos = video.currentTime > 0 ? video.currentTime : currentTime;
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("[ModernVideoPlayer] Network error, recovering stream...", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("[ModernVideoPlayer] Media error, recovering without resetting position...", data);
              hls.recoverMediaError();
              if (currentPos > 0) {
                try { video.currentTime = currentPos; } catch {}
              }
              break;
            default:
              console.error("[ModernVideoPlayer] Unrecoverable HLS error, falling back to direct stream:", data);
              destroyHls();
              video.src = src;
              if (currentPos > 0) {
                const onMeta = () => {
                  try { video.currentTime = currentPos; } catch {}
                  video.removeEventListener("loadedmetadata", onMeta);
                };
                video.addEventListener("loadedmetadata", onMeta);
              }
              if (wasPlaying) {
                video.play().catch(() => {});
              }
              break;
          }
        }
      });
    } else {
      // Native MP4 or Safari HLS
      video.src = src;
      setQualityOptions([
        { id: -1, label: "Авто (HD)" },
        { id: 1080, label: "1080p Full HD" },
        { id: 720, label: "720p HD" },
        { id: 480, label: "480p SD" }
      ]);
      if (resumeTime > 0) {
        const onLoadedMeta = () => {
          try { video.currentTime = resumeTime; } catch {}
          video.removeEventListener("loadedmetadata", onLoadedMeta);
        };
        video.addEventListener("loadedmetadata", onLoadedMeta);
      }
      if (wasPlaying) {
        video.play().catch(() => setIsPlaying(false));
      }
    }

    return () => {
      destroyHls();
    };
  }, [src, destroyHls, setBuffering]);

  // Handle Unmount cleanup globally
  useEffect(() => {
    return () => {
      destroyHls();
      // Save final position before unmount
      if (videoId && videoRef.current) {
        const t = videoRef.current.currentTime;
        if (t > 3) {
          try { localStorage.setItem(`vp_${videoId}`, t.toString()); } catch {}
        }
      }
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute("src");
          videoRef.current.load();
        } catch {}
      }
    };
  }, [destroyHls, videoId]);

  // ── Auto-save progress every 5s & restore on mount ──
  useEffect(() => {
    if (!videoId) return;
    // Restore saved position when the video metadata loads
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => {
      try {
        const saved = localStorage.getItem(`vp_${videoId}`);
        if (saved) {
          const t = parseFloat(saved);
          if (t > 3 && video.duration && t < video.duration - 5) {
            video.currentTime = t;
          }
        }
      } catch {}
    };
    video.addEventListener("loadedmetadata", onMeta);
    // Periodic save every 5 seconds during playback
    progressSaveIntervalRef.current = setInterval(() => {
      if (video && !video.paused && video.currentTime > 3) {
        try { localStorage.setItem(`vp_${videoId}`, video.currentTime.toString()); } catch {}
      }
    }, 5000);
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
    };
  }, [videoId, src]);

  // Sync volume & mute state to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
    try {
      localStorage.setItem("player_volume", volume.toString());
      localStorage.setItem("player_muted", isMuted ? "true" : "false");
    } catch {}
  }, [volume, isMuted]);

  // Sync playback speed
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Reset controls timer on user activity
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isDraggingScrubberRef.current && !openSettingsMenu) {
          setShowControls(false);
        }
      }, 2600);
    }
  }, [isPlaying, openSettingsMenu]);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn("Play interrupted:", e);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
    handleUserActivity();
  }, [handleUserActivity]);

  // Seek function - Instant, direct time jump on single video element
  const seekTo = useCallback((targetTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clampedTime = Math.max(0, Math.min(targetTime, duration || video.duration || 0));
    video.currentTime = clampedTime;
    setCurrentTime(clampedTime);
    handleUserActivity();
  }, [duration, handleUserActivity]);

  // Skip relative (+/- seconds) with visual feedback
  const skipRelative = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    seekTo(video.currentTime + seconds);
    setSkipFeedback(seconds > 0 ? "forward" : "backward");
    setTimeout(() => setSkipFeedback(null), 500);
  }, [seekTo]);

  // Change Quality Level
  const handleSelectQuality = (qualityId: number, label: string) => {
    setCurrentQuality(qualityId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityId;
      if (qualityId === -1) {
        setActiveQualityLabel("Авто");
      } else {
        setActiveQualityLabel(label);
      }
    } else {
      setActiveQualityLabel(label);
    }
    setOpenSettingsMenu(false);
    setSettingsSubmenu("root");
  };

  // Change Playback Speed
  const handleSelectSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    setOpenSettingsMenu(false);
    setSettingsSubmenu("root");
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error("Exit fullscreen error:", err);
      }
    }
  }, []);

  // Track fullscreen changes from ESC or native events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Picture in Picture toggle
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP error:", err);
    }
  }, []);

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          skipRelative(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          skipRelative(10);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume((v) => Math.min(1, Math.round((v + 0.1) * 10) / 10));
          setIsMuted(false);
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume((v) => Math.max(0, Math.round((v - 0.1) * 10) / 10));
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          if (duration > 0) {
            const percent = parseInt(e.key, 10) / 10;
            seekTo(duration * percent);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleFullscreen, skipRelative, duration, seekTo]);

  // Video Native Event Handlers
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const time = video.currentTime;
    setCurrentTime(time);
    setBuffering(false);
    onTimeUpdate?.(time, video.duration || duration);

    // Buffer range calculation
    if (video.buffered.length > 0) {
      try {
        const end = video.buffered.end(video.buffered.length - 1);
        setBufferedEnd(end);
      } catch {}
    }

    // Preview Limitation Check
    if (previewLimitSeconds && previewLimitSeconds > 0 && time >= previewLimitSeconds) {
      video.pause();
      setIsPlaying(false);
      onPreviewLimitReached?.();
    }
  };

  const handleVideoDurationChange = () => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration;
    if (dur && !isNaN(dur) && dur > 0) {
      setDuration(dur);
      onDurationChange?.(dur);
    }
  };

  const handleVideoProgress = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.buffered.length > 0) {
      try {
        const end = video.buffered.end(video.buffered.length - 1);
        setBufferedEnd(end);
      } catch {}
    }
  };

  // Scrubber interaction
  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const target = pos * duration;
    seekTo(target);
    isDraggingScrubberRef.current = true;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingScrubberRef.current) return;
      const movePos = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      seekTo(movePos * duration);
    };

    const handleMouseUp = () => {
      isDraggingScrubberRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleScrubberMouseLeave = () => {
    setHoverTime(null);
  };

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative w-full h-full bg-slate-950 select-none overflow-hidden group/player font-sans rounded-inherit ${className}`}
      style={{ minHeight: "240px" }}
    >
      {/* ── Native Single Video Element ── */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="auto"
        onPlay={() => {
          setIsPlaying(true);
          setBuffering(false);
          hasStartedPlaybackRef.current = true;
        }}
        onPause={() => {
          if (videoRef.current?.paused) {
            setIsPlaying(false);
          }
        }}
        onTimeUpdate={handleVideoTimeUpdate}
        onDurationChange={handleVideoDurationChange}
        onProgress={handleVideoProgress}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setBuffering(false);
        }}
        onCanPlay={() => setBuffering(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onError={() => {
          setBuffering(false);
          setErrorMessage("Не удалось загрузить видео. Пожалуйста, попробуйте позже.");
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* ── Top Ambient Video Title Overlay ── */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 pointer-events-none flex items-center justify-between z-20 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2">
          {title && (
            <h3 className="text-white text-sm sm:text-base font-bold truncate max-w-md drop-shadow-md">
              {title}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-[11px] backdrop-blur-md shadow-sm">
            {activeQualityLabel}
          </span>
        </div>
      </div>

      {/* ── Skip Relative Visual Ripples (+10s / -10s) ── */}
      {skipFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md border border-white/20 text-amber-400 px-5 py-3 rounded-full text-base font-black shadow-2xl animate-in zoom-in-90 fade-in duration-200">
            {skipFeedback === "forward" ? (
              <>
                <span>+10 сек</span>
                <RotateCw className="h-5 w-5 animate-spin" />
              </>
            ) : (
              <>
                <RotateCcw className="h-5 w-5 animate-spin" />
                <span>-10 сек</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Center Buffering Spinner — only shows when actively playing and stalled ── */}
      {isBuffering && isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 bg-black/25 backdrop-blur-[1px]">
          <div className="h-14 w-14 rounded-full bg-slate-950/80 border border-amber-400/30 flex items-center justify-center shadow-2xl backdrop-blur-sm">
            <Loader2 className="h-7 w-7 text-amber-400 animate-spin" />
          </div>
        </div>
      )}

      {/* ── Big Center Play Button (always visible when paused) ── */}
      <div
        onClick={togglePlay}
        className={`absolute inset-0 flex items-center justify-center cursor-pointer z-10 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300 ${
          !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-400/40 hover:scale-110 active:scale-95 transition-transform duration-200">
          <Play className="h-7 w-7 sm:h-9 sm:w-9 fill-current ml-1" />
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white gap-3 p-6 text-center z-30">
          <div className="h-14 w-14 rounded-2xl bg-destructive/20 border border-destructive/40 flex items-center justify-center text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold max-w-sm">{errorMessage}</p>
          <button
            onClick={() => {
              setErrorMessage(null);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20"
          >
            Повторить попытку
          </button>
        </div>
      )}

      {/* ── Bottom Controls Bar Overlay ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-all duration-300 z-30 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {/* ── Progress Scrubber Bar ── */}
        <div
          onMouseDown={handleScrubberMouseDown}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={handleScrubberMouseLeave}
          className="relative w-full h-4 sm:h-5 group/scrubber cursor-pointer flex items-center mb-2"
        >
          {/* Background Track */}
          <div className="relative w-full h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden transition-all group-hover/scrubber:h-2.5">
            {/* Buffered Progress */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/40 rounded-full transition-all duration-150"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Played Progress */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full shadow-lg shadow-amber-400/50"
              style={{ width: `${playedPercent}%` }}
            />
          </div>

          {/* Scrub Handle Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-white border-2 border-amber-400 shadow-md transition-transform scale-0 group-hover/scrubber:scale-100 pointer-events-none"
            style={{ left: `${playedPercent}%` }}
          />

          {/* Hover Time Preview Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-950/90 border border-white/20 text-white text-[11px] font-bold backdrop-blur-md shadow-lg pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* ── Controls Row ── */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="h-9 w-9 rounded-xl text-white hover:text-amber-400 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title={isPlaying ? "Пауза (Space)" : "Воспроизведение (Space)"}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={() => skipRelative(-10)}
              className="h-9 w-9 rounded-xl text-white/80 hover:text-amber-400 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Назад на 10 сек (←)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Forward 10s */}
            <button
              onClick={() => skipRelative(10)}
              className="h-9 w-9 rounded-xl text-white/80 hover:text-amber-400 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Вперед на 10 сек (→)"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center group/vol">
              <button
                onClick={() => setIsMuted((prev) => !prev)}
                className="h-9 w-9 rounded-xl text-white hover:text-amber-400 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title={isMuted ? "Включить звук (M)" : "Выключить звук (M)"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              <div className="w-0 group-hover/vol:w-20 transition-all duration-200 overflow-hidden flex items-center pr-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (v > 0 && isMuted) setIsMuted(false);
                  }}
                  className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="text-white/90 text-xs sm:text-sm font-semibold tabular-nums ml-1 flex items-center gap-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 relative">
            {/* Settings Menu Toggle (Quality & Speed) */}
            <div className="relative">
              <button
                onClick={() => {
                  setOpenSettingsMenu((prev) => !prev);
                  setSettingsSubmenu("root");
                }}
                className={`h-9 w-9 rounded-xl text-white hover:text-amber-400 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer ${
                  openSettingsMenu ? "text-amber-400 bg-white/10" : ""
                }`}
                title="Настройки"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Settings Dropdown Popover */}
              {openSettingsMenu && (
                <div className="absolute bottom-11 right-0 w-52 bg-slate-950/95 border border-white/15 rounded-2xl p-2 backdrop-blur-2xl shadow-2xl z-50 text-white animate-in zoom-in-95 duration-150">
                  {settingsSubmenu === "root" && (
                    <div className="space-y-1">
                      {/* Quality Option Row */}
                      <button
                        onClick={() => setSettingsSubmenu("quality")}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                          Качество
                        </span>
                        <span className="text-amber-400 text-[11px] font-bold">
                          {activeQualityLabel}
                        </span>
                      </button>

                      {/* Speed Option Row */}
                      <button
                        onClick={() => setSettingsSubmenu("speed")}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors"
                      >
                        <span>Скорость воспроизведения</span>
                        <span className="text-amber-400 text-[11px] font-bold">
                          {playbackSpeed}x
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Quality Submenu */}
                  {settingsSubmenu === "quality" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/10">
                        <button
                          onClick={() => setSettingsSubmenu("root")}
                          className="text-[11px] text-amber-400 font-bold hover:underline"
                        >
                          ← Назад
                        </button>
                        <span className="text-xs font-bold">Выбор качества</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {qualityOptions.map((opt) => {
                          const isSelected = currentQuality === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleSelectQuality(opt.id, opt.label)}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                                isSelected ? "bg-amber-400/20 text-amber-400 font-bold" : "hover:bg-white/10"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Speed Submenu */}
                  {settingsSubmenu === "speed" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/10">
                        <button
                          onClick={() => setSettingsSubmenu("root")}
                          className="text-[11px] text-amber-400 font-bold hover:underline"
                        >
                          ← Назад
                        </button>
                        <span className="text-xs font-bold">Скорость</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {SPEED_OPTIONS.map((opt) => {
                          const isSelected = playbackSpeed === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleSelectSpeed(opt.value)}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                                isSelected ? "bg-amber-400/20 text-amber-400 font-bold" : "hover:bg-white/10"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            {"pictureInPictureEnabled" in document && (
              <button
                onClick={togglePiP}
                className="h-9 w-9 rounded-xl text-white/80 hover:text-amber-400 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Картинка в картинке"
              >
                <PictureInPicture className="h-4 w-4" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="h-9 w-9 rounded-xl text-white hover:text-amber-400 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title={isFullscreen ? "Выйти из полноэкранного режима (F)" : "На весь экран (F)"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
