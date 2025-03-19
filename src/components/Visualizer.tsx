
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { generateWaveform, generateCircular, getDynamicColor } from '@/utils/visualizerHelpers';

interface VisualizerProps {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  isPlaying: boolean;
  volume: number;
  sensitivity?: number;
  className?: string;
  visualizationType?: 'bars' | 'circular' | 'wave';
}

const Visualizer: React.FC<VisualizerProps> = ({
  frequencyData,
  timeData,
  isPlaying,
  volume,
  sensitivity = 1.5,
  className,
  visualizationType = 'bars'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'circular' | 'wave'>(visualizationType);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  // Set up canvas and handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const { clientWidth, clientHeight } = canvasRef.current.parentElement;
        
        // Set canvas dimensions for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = clientWidth * dpr;
        canvasRef.current.height = clientHeight * dpr;
        
        // Set display size using CSS
        canvasRef.current.style.width = `${clientWidth}px`;
        canvasRef.current.style.height = `${clientHeight}px`;
        
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const animate = (time: number) => {
      if (previousTimeRef.current === undefined) {
        previousTimeRef.current = time;
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Scale for high DPI displays
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      
      // Draw visualizer based on mode
      if (frequencyData.length) {
        if (visualizerMode === 'bars') {
          drawBarVisualizer(ctx, frequencyData, dimensions, sensitivity, volume);
        } else if (visualizerMode === 'circular') {
          drawCircularVisualizer(ctx, frequencyData, dimensions, sensitivity, volume);
        } else if (visualizerMode === 'wave') {
          drawWaveVisualizer(ctx, timeData, dimensions, sensitivity, volume);
        }
      } else {
        // Draw placeholder visualizer when no audio data
        drawPlaceholderVisualizer(ctx, dimensions);
      }
      
      // Continue animation loop
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [frequencyData, timeData, dimensions, visualizerMode, isPlaying, sensitivity, volume]);

  // Change visualizer mode when prop changes
  useEffect(() => {
    setVisualizerMode(visualizationType);
  }, [visualizationType]);

  // Bar visualizer drawing function
  const drawBarVisualizer = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    dimensions: { width: number; height: number },
    sensitivity: number,
    volume: number
  ) => {
    const { width, height } = dimensions;
    const numBars = Math.min(128, Math.floor(width / 8));
    const values = generateWaveform(data, numBars, sensitivity);
    const barWidth = Math.max(2, (width / numBars) - 2);
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgba(190, 227, 248, 0.7)');
    gradient.addColorStop(0.5, 'rgba(137, 207, 240, 0.8)');
    gradient.addColorStop(1, 'rgba(96, 183, 231, 0.9)');
    
    values.forEach((value, i) => {
      const x = (i * (barWidth + 2)) + (width - (numBars * (barWidth + 2) - 2)) / 2;
      const barHeight = Math.max(4, value * height * 0.8 * volume);
      
      // Bar glow effect
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 10 * value;
      
      // Draw bar with rounded top
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, height - barHeight + barWidth / 2);
      ctx.arcTo(x, height - barHeight, x + barWidth / 2, height - barHeight, barWidth / 2);
      ctx.arcTo(x + barWidth, height - barHeight, x + barWidth, height - barHeight + barWidth / 2, barWidth / 2);
      ctx.lineTo(x + barWidth, height);
      ctx.closePath();
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add small bubble on top for active bars
      if (value > 0.1) {
        ctx.beginPath();
        ctx.arc(x + barWidth / 2, height - barHeight, barWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }
    });
    
    // Reset shadow for performance
    ctx.shadowBlur = 0;
  };

  // Circular visualizer drawing function
  const drawCircularVisualizer = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    dimensions: { width: number; height: number },
    sensitivity: number,
    volume: number
  ) => {
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const numPoints = 128;
    const values = generateCircular(data, numPoints, sensitivity);
    
    // Draw central glowing orb
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.5);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(190, 227, 248, 0.7)');
    gradient.addColorStop(1, 'rgba(137, 207, 240, 0.1)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fill();
    
    // Reset shadow for performance during line drawing
    ctx.shadowBlur = 0;
    
    // Draw circular wave
    ctx.beginPath();
    values.forEach((value, i) => {
      const angle = (i / numPoints) * Math.PI * 2;
      const distance = radius + (value * radius * 0.5 * volume);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add subtle glow to the circle
    ctx.strokeStyle = 'rgba(190, 227, 248, 0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw connecting lines from center to high-value points for more visual interest
    values.forEach((value, i) => {
      if (value > 0.6) {
        const angle = (i / numPoints) * Math.PI * 2;
        const distance = radius + (value * radius * 0.5 * volume);
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        
        const intensity = value - 0.6;
        ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  };

  // Wave visualizer drawing function
  const drawWaveVisualizer = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    dimensions: { width: number; height: number },
    sensitivity: number,
    volume: number
  ) => {
    const { width, height } = dimensions;
    const centerY = height / 2;
    
    // No data case
    if (!data.length) return;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(137, 207, 240, 0.8)');
    gradient.addColorStop(0.5, 'rgba(190, 227, 248, 0.9)');
    gradient.addColorStop(1, 'rgba(137, 207, 240, 0.8)');
    
    // Set up wave line style
    ctx.lineWidth = 3;
    ctx.strokeStyle = gradient;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 10;
    
    // Draw waveform
    ctx.beginPath();
    
    const sliceWidth = width / data.length;
    let x = 0;
    
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] / 128.0) - 1; // Convert to -1 to 1 range
      const y = centerY + v * centerY * sensitivity * volume;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    
    // Add mirrored wave for aesthetics (with reduced opacity)
    ctx.beginPath();
    x = 0;
    
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] / 128.0) - 1;
      const y = centerY - v * centerY * sensitivity * volume;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.strokeStyle = 'rgba(190, 227, 248, 0.4)';
    ctx.stroke();
    
    // Reset shadow for performance
    ctx.shadowBlur = 0;
  };

  // Placeholder visualizer when no audio is playing
  const drawPlaceholderVisualizer = (
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number; height: number }
  ) => {
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw pulsing circle
    const time = Date.now() / 1000;
    const pulseSize = 0.5 + Math.sin(time * 2) * 0.1;
    
    // Create gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, width * 0.25 * pulseSize
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(0.7, 'rgba(190, 227, 248, 0.1)');
    gradient.addColorStop(1, 'rgba(137, 207, 240, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, width * 0.25 * pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw hint text
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('Upload an audio file to begin', centerX, centerY + 40);
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {/* Mode selector */}
      <div className="absolute top-4 right-4 flex gap-2 glass-panel rounded-lg p-1">
        <button 
          onClick={() => setVisualizerMode('bars')}
          className={cn(
            "px-3 py-1.5 text-xs rounded-md transition-all",
            visualizerMode === 'bars' 
              ? "bg-white/20 text-white" 
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          Bars
        </button>
        <button 
          onClick={() => setVisualizerMode('circular')}
          className={cn(
            "px-3 py-1.5 text-xs rounded-md transition-all",
            visualizerMode === 'circular' 
              ? "bg-white/20 text-white" 
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          Circular
        </button>
        <button 
          onClick={() => setVisualizerMode('wave')}
          className={cn(
            "px-3 py-1.5 text-xs rounded-md transition-all",
            visualizerMode === 'wave' 
              ? "bg-white/20 text-white" 
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          Wave
        </button>
      </div>
    </div>
  );
};

export default Visualizer;
