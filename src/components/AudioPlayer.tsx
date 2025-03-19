
import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/visualizerHelpers';

interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
  trackInfo?: {
    title?: string;
    artist?: string;
  };
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioRef,
  isPlaying,
  currentTime,
  duration,
  volume,
  togglePlay,
  setVolume,
  seekTo,
  onNext,
  onPrevious,
  className,
  trackInfo
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const progressRef = React.useRef<HTMLDivElement>(null);

  // Handle progress bar interactions
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      seekTo(pos * duration);
    }
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    handleProgressDrag(e);
  };

  const handleProgressDrag = (e: React.MouseEvent | MouseEvent) => {
    if (isDragging && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setDragValue(pos * duration);
    }
  };

  const handleProgressMouseUp = () => {
    if (isDragging) {
      seekTo(dragValue);
      setIsDragging(false);
      document.body.style.userSelect = '';
    }
  };

  // Add mouse move and mouse up event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleProgressDrag(e);
    const handleMouseUp = () => handleProgressMouseUp();

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragValue]);

  // Toggle mute
  const handleToggleMute = () => {
    if (isMuted) {
      setVolume(volume > 0 ? volume : 0.5);
    } else {
      setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  // Update volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Calculate progress percentage
  const progressPercent = isDragging 
    ? (dragValue / duration) * 100 
    : ((currentTime || 0) / (duration || 1)) * 100;

  // Add ripple effect on button click
  const handleButtonRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  return (
    <div className={cn(
      "audio-controls w-full max-w-md mx-auto p-4 rounded-xl glass-panel animate-fade-in",
      className
    )}>
      {/* Track info */}
      {trackInfo && (trackInfo.title || trackInfo.artist) && (
        <div className="mb-3 text-center">
          {trackInfo.title && (
            <div className="font-medium text-sm truncate">{trackInfo.title}</div>
          )}
          {trackInfo.artist && (
            <div className="text-xs text-muted-foreground truncate">{trackInfo.artist}</div>
          )}
        </div>
      )}
      
      {/* Progress bar */}
      <div 
        ref={progressRef}
        className="progress-bar w-full mb-2" 
        onClick={handleProgressClick}
        onMouseDown={handleProgressMouseDown}
      >
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Time display */}
      <div className="flex justify-between text-xs mb-3">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      
      {/* Playback controls */}
      <div className="flex items-center justify-center gap-4">
        {onPrevious && (
          <button 
            onClick={(e) => { onPrevious(); handleButtonRipple(e); }} 
            className="control-button relative overflow-hidden"
            aria-label="Previous track"
          >
            <SkipBack size={18} />
          </button>
        )}
        
        <button 
          onClick={(e) => { togglePlay(); handleButtonRipple(e); }}
          className="control-button relative overflow-hidden bg-white/5 p-3"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        
        {onNext && (
          <button 
            onClick={(e) => { onNext(); handleButtonRipple(e); }} 
            className="control-button relative overflow-hidden"
            aria-label="Next track"
          >
            <SkipForward size={18} />
          </button>
        )}
        
        {/* Volume control */}
        <div className="relative ml-auto">
          <button 
            className="control-button relative overflow-hidden"
            onClick={handleToggleMute}
            onMouseEnter={() => setShowVolumeSlider(true)}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {volume === 0 || isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          {showVolumeSlider && (
            <div 
              className="absolute bottom-full mb-2 -left-12 p-2 glass-panel rounded-lg animate-fade-in"
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 accent-white/70"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
