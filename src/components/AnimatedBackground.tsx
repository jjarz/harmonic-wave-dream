
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps {
  className?: string;
  frequencyData?: Uint8Array;
  isPlaying?: boolean;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  className,
  frequencyData,
  isPlaying = false
}) => {
  const [energy, setEnergy] = useState(0);
  
  // Calculate audio energy level for background animation intensity
  useEffect(() => {
    if (frequencyData && frequencyData.length > 0) {
      // Calculate average energy from lower frequencies
      const lowerFreqEnd = Math.min(32, frequencyData.length);
      let sum = 0;
      for (let i = 0; i < lowerFreqEnd; i++) {
        sum += frequencyData[i];
      }
      // Normalize from 0-255 to 0-1 range
      const average = sum / (lowerFreqEnd * 255);
      
      // Apply smoothing
      setEnergy(prev => prev * 0.6 + average * 0.4);
    } else {
      // Decay energy when not playing
      setEnergy(prev => prev * 0.95);
    }
  }, [frequencyData]);

  return (
    <div className={cn(
      "fixed inset-0 -z-10 overflow-hidden",
      className
    )}>
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1a2d] to-[#090a14] transition-opacity duration-1000" />

      {/* Animated circles */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-[50vw] h-[50vw] rounded-full blur-[60px] opacity-20 bg-[#1e88e5] animate-float"
          style={{ 
            top: '-10vh', 
            right: '-10vw',
            animationDelay: '0.5s',
            transform: `scale(${isPlaying ? 1 + energy * 0.3 : 1})`,
            transition: 'transform 0.5s ease-out',
          }}
        />
        <div 
          className="absolute w-[40vw] h-[40vw] rounded-full blur-[60px] opacity-20 bg-[#651fff] animate-float"
          style={{ 
            bottom: '-10vh', 
            left: '-8vw',
            animationDelay: '1.5s',
            animationDirection: 'reverse',
            transform: `scale(${isPlaying ? 1 + energy * 0.5 : 1})`,
            transition: 'transform 0.5s ease-out',
          }}
        />
        <div 
          className="absolute w-[32vw] h-[32vw] rounded-full blur-[80px] opacity-10 bg-[#00bfa5] animate-float"
          style={{ 
            top: '60vh', 
            right: '5vw',
            animationDelay: '3s',
            transform: `scale(${isPlaying ? 1 + energy * 0.4 : 1})`,
            transition: 'transform 0.5s ease-out',
          }}
        />
      </div>

      {/* Animated grid overlay */}
      <div 
        className="absolute inset-0 grid grid-cols-[repeat(25,1fr)] grid-rows-[repeat(25,1fr)] opacity-10"
        style={{
          opacity: isPlaying ? 0.05 + energy * 0.1 : 0.05,
          transition: 'opacity 1s ease'
        }}
      >
        {Array.from({ length: 25 * 25 }).map((_, index) => (
          <div 
            key={index}
            className="border border-white/5"
          />
        ))}
      </div>

      {/* Optional reactive effect that appears when audio is playing */}
      {isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-0"
          style={{
            opacity: energy * 0.3,
            transition: 'opacity 0.3s ease'
          }}
        >
          <div 
            className="w-[100vmin] h-[100vmin] rounded-full border border-white/10 animate-pulse-subtle"
            style={{
              transform: `scale(${0.5 + energy * 1.5})`,
              opacity: 0.2 * energy,
              transition: 'transform 0.5s ease-out, opacity 0.5s ease-out'
            }}
          />
        </div>
      )}

      {/* Subtle film grain effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <filter id="noise">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.8" 
              numOctaves="3" 
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>
      </div>
    </div>
  );
};

export default AnimatedBackground;
