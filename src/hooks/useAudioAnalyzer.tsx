
import { useState, useEffect, useRef } from 'react';

interface AudioAnalyzerHook {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playAudio: () => void;
  pauseAudio: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
}

export function useAudioAnalyzer(fftSize: number = 256): AudioAnalyzerHook {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array());
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const initAudioAnalyzer = () => {
        // Create audio context and analyzer
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const newAnalyser = context.createAnalyser();
        
        // Configure analyzer
        newAnalyser.fftSize = fftSize;
        newAnalyser.smoothingTimeConstant = 0.8;
        
        // Connect audio element to the analyzer
        if (audioRef.current) {
          sourceRef.current = context.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(newAnalyser);
          newAnalyser.connect(context.destination);
        }
        
        // Initialize data arrays
        const newFrequencyData = new Uint8Array(newAnalyser.frequencyBinCount);
        const newTimeData = new Uint8Array(newAnalyser.frequencyBinCount);
        
        setAudioContext(context);
        setAnalyser(newAnalyser);
        setFrequencyData(newFrequencyData);
        setTimeData(newTimeData);
        
        // Set up animation loop to update data
        const updateData = () => {
          if (newAnalyser) {
            newAnalyser.getByteFrequencyData(newFrequencyData);
            newAnalyser.getByteTimeDomainData(newTimeData);
            
            setFrequencyData(new Uint8Array(newFrequencyData));
            setTimeData(new Uint8Array(newTimeData));
            
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }
          animationFrameRef.current = requestAnimationFrame(updateData);
        };
        
        updateData();
      };

      // Set up event listeners for the audio element
      audioRef.current.addEventListener('play', () => setIsPlaying(true));
      audioRef.current.addEventListener('pause', () => setIsPlaying(false));
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });
      audioRef.current.addEventListener('durationchange', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      // Set initial volume
      audioRef.current.volume = volume;
      
      // Initialize analyzer when audio is loaded
      audioRef.current.addEventListener('loadedmetadata', initAudioAnalyzer);
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', initAudioAnalyzer);
        }
      };
    }
  }, [fftSize]);

  // Play control
  const playAudio = () => {
    if (audioRef.current) {
      // Initialize audio context on first play (to handle autoplay policies)
      if (!audioContext) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
      }
      
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => console.error("Play failed:", error));
    }
  };

  // Pause control
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  // Volume control
  const setVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolumeState(newVolume);
    }
  };

  // Seek control
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  return {
    audioRef,
    audioContext,
    analyser,
    frequencyData,
    timeData,
    isPlaying,
    currentTime,
    duration,
    volume,
    playAudio,
    pauseAudio,
    togglePlay,
    setVolume,
    seekTo
  };
}
