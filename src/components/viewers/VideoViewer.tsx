import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Film } from 'lucide-react';

interface VideoViewerProps {
  fileUrl?: string;
  fileName?: string;
  description?: string;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({
  fileUrl,
  fileName = 'Video.mp4',
  description,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  const fallbackVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  const videoSrc = fileUrl || fallbackVideo;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/70 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-purple-400" />
          <span className="font-mono font-medium text-neutral-200">{fileName}</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Speed presets */}
        <div className="flex items-center gap-1 bg-neutral-900 rounded-md p-0.5 border border-neutral-800">
          {[0.5, 1, 1.25, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums transition-colors ${
                speed === s ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Video Viewport */}
      <div className="flex-1 bg-black flex items-center justify-center relative group">
        <video
          ref={videoRef}
          src={videoSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="max-h-[65vh] w-auto max-w-full cursor-pointer"
        />

        {/* Center play icon overlay if paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-xl hover:bg-indigo-500 transition-transform active:scale-95"
          >
            <Play className="h-6 w-6 ml-1" />
          </button>
        )}
      </div>

      {/* Custom Control Bar */}
      <div className="border-t border-neutral-800 bg-neutral-900/90 px-4 py-2.5">
        {/* Scrubber */}
        <div className="flex items-center gap-3 mb-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              title="Restart"
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <span className="font-mono text-xs tabular-nums text-neutral-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              title="Fullscreen"
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {description && (
        <div className="border-t border-neutral-800 bg-neutral-900/40 px-4 py-2 text-xs text-neutral-400">
          {description}
        </div>
      )}
    </div>
  );
};
