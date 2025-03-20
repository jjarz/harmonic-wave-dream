import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import Visualizer from '@/components/Visualizer';
import AudioPlayer from '@/components/AudioPlayer';
import AudioUpload from '@/components/AudioUpload';
import AnimatedBackground from '@/components/AnimatedBackground';

const Index = () => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState<{ title?: string; artist?: string }>({});
  const [visualizerType, setVisualizerType] = useState<'bars' | 'circular' | 'wave'>('bars');
  const [showUpload, setShowUpload] = useState(true);
  
  // Use our custom hook for audio analysis
  const {
    audioRef,
    frequencyData,
    timeData,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    setVolume,
    seekTo
  } = useAudioAnalyzer(1024); // Higher fftSize for better resolution

  // Handle file selection
  const handleFileSelect = (file: File, objectUrl: string) => {
    setAudioSrc(objectUrl);
    setShowUpload(false);
    
    // Extract file name as track title
    const fileName = file.name;
    const title = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    setTrackInfo({ title });
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);

  // Reset to upload screen
  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioSrc(null);
    setTrackInfo({});
    setShowUpload(true);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative flex flex-col items-center justify-center text-white">
      {/* Background animation */}
      <AnimatedBackground 
        frequencyData={frequencyData}
        isPlaying={isPlaying}
      />
      
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioSrc || undefined} preload="metadata" />
      
      {/* App content */}
      <motion.div 
        className="container max-w-5xl px-4 py-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <header className="text-center mb-8">
          <motion.h1 
            className="text-3xl md:text-4xl font-light tracking-tight mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Audio <span className="font-medium">Visualizer</span>
          </motion.h1>
          <motion.p 
            className="text-white/70 max-w-md mx-auto text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Upload your audio files and see them come to life with beautiful visualizations
          </motion.p>
        </header>
        
        {/* Main content */}
        <div className="flex flex-col items-center">
          {/* Visualizer */}
          <motion.div 
            className="w-full h-[50vh] max-h-[500px] mb-6 glass-panel rounded-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {showUpload ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <AudioUpload onFileSelect={handleFileSelect} className="max-w-md w-full" />
              </div>
            ) : (
              <Visualizer 
                frequencyData={frequencyData}
                timeData={timeData}
                isPlaying={isPlaying}
                volume={volume}
                sensitivity={1.5}
                visualizationType={visualizerType}
              />
            )}
          </motion.div>
          
          {/* Controls */}
          {!showUpload && (
            <motion.div 
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <AudioPlayer 
                audioRef={audioRef}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                togglePlay={togglePlay}
                setVolume={setVolume}
                seekTo={seekTo}
                trackInfo={trackInfo}
              />
              
              {/* Additional controls */}
              <div className="flex justify-center mt-6">
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Upload a different track
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* Footer */}
      <motion.footer 
        className="w-full py-4 text-center text-white/40 text-xs absolute bottom-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <p>Minimalist Audio Visualizer • Beautifully Responsive</p>
      </motion.footer>
    </div>
  );
};

export default Index;
