import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  generateWaveform, 
  generateCircular, 
  getThemeColor, 
  colorThemes, 
  type ColorTheme 
} from '@/utils/visualizerHelpers';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

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
  const [colorTheme, setColorTheme] = useState<ColorTheme>('blue');
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const { clientWidth, clientHeight } = canvasRef.current.parentElement;
        
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = clientWidth * dpr;
        canvasRef.current.height = clientHeight * dpr;
        
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const animate = (time: number) => {
      if (previousTimeRef.current === undefined) {
        previousTimeRef.current = time;
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      
      if (frequencyData.length) {
        if (visualizerMode === 'bars') {
          drawBarVisualizer(ctx, frequencyData, dimensions, sensitivity, volume, colorTheme);
        } else if (visualizerMode === 'circular') {
          drawCircularVisualizer(ctx, frequencyData, dimensions, sensitivity, volume, colorTheme);
        } else if (visualizerMode === 'wave') {
          drawWaveVisualizer(ctx, timeData, dimensions, sensitivity, volume, colorTheme);
        }
      } else {
        drawPlaceholderVisualizer(ctx, dimensions, colorTheme);
      }
      
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [frequencyData, timeData, dimensions, visualizerMode, isPlaying, sensitivity, volume, colorTheme]);

  useEffect(() => {
    setVisualizerMode(visualizationType);
  }, [visualizationType]);

  const drawBarVisualizer = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    dimensions: { width: number; height: number },
    sensitivity: number,
    volume: number,
    theme: ColorTheme
  ) => {
    const { width, height } = dimensions;
    const numBars = Math.min(128, Math.floor(width / 8));
    const values = generateWaveform(data, numBars, sensitivity);
    const barWidth = Math.max(2, (width / numBars) - 2);
    
    ctx.shadowColor = colorThemes[theme].glow;
    ctx.shadowBlur = 10;
    
    values.forEach((value, i) => {
      const position = i / numBars;
      const x = (i * (barWidth + 2)) + (width - (numBars * (barWidth + 2) - 2)) / 2;
      
      const positionEffect = 0.7 + Math.sin(position * Math.PI) * 0.6;
      const barHeight = Math.max(4, value * height * 0.8 * volume * positionEffect);
      
      ctx.shadowBlur = 10 * value;
      
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, height - barHeight + barWidth / 2);
      ctx.arcTo(x, height - barHeight, x + barWidth / 2, height - barHeight, barWidth / 2);
      ctx.arcTo(x + barWidth, height - barHeight, x + barWidth, height - barHeight + barWidth / 2, barWidth / 2);
      ctx.lineTo(x + barWidth, height);
      ctx.closePath();
      
      ctx.fillStyle = getThemeColor(position, value, theme);
      ctx.fill();
      
      if (value > 0.1) {
        ctx.beginPath();
        ctx.arc(x + barWidth / 2, height - barHeight, barWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = colorThemes[theme].highlight;
        ctx.fill();
      }
    });
    
    ctx.shadowBlur = 0;
  };

  const drawCircularVisualizer = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    dimensions: { width: number; height: number },
    sensitivity: number,
    volume: number,
    theme: ColorTheme
  ) => {
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.35;
    const numPoints = 180;
    const values = generateCircular(data, numPoints, sensitivity);
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.5);
    gradient.addColorStop(0, colorThemes[theme].highlight);
    gradient.addColorStop(0.5, colorThemes[theme].gradient[1]);
    gradient.addColorStop(1, 'rgba(137, 207, 240, 0.1)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.shadowColor = colorThemes[theme].glow;
    ctx.shadowBlur = 20;
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    const time = Date.now() / 1000;
    const pulseFactor = 0.1 + Math.sin(time) * 0.05;
    const points: { x: number, y: number, value: number, angle: number }[] = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const position = i / numPoints;
      
      const waveEffect = 0.2 * Math.sin(angle * 3 + time * 2);
      const distance = baseRadius + ((values[i] + waveEffect) * baseRadius * 0.8 * volume);
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      points.push({ x, y, value: values[i], angle });
    }
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      
      const cpX = (current.x + next.x) / 2;
      const cpY = (current.y + next.y) / 2;
      
      ctx.quadraticCurveTo(current.x, current.y, cpX, cpY);
    }
    
    ctx.closePath();
    ctx.strokeStyle = colorThemes[theme].gradient[0];
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.strokeStyle = colorThemes[theme].gradient[1];
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    points.forEach(({ x, y, value, angle }) => {
      const opacity = 0.1 + value * 0.9;
      const lineWidth = 0.5 + value * 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      
      const position = angle / (Math.PI * 2);
      ctx.strokeStyle = getThemeColor(position, value, theme);
      ctx.globalAlpha = opacity;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    });
    
    ctx.globalAlpha = 1;
  };

  const drawWaveVisualizer = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    dimensions: { width: number; height: number },
    sensitivity: number,
    volume: number,
    theme: ColorTheme
  ) => {
    const { width, height } = dimensions;
    const centerY = height / 2;
    
    if (!data.length) return;
    
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, colorThemes[theme].gradient[0]);
    gradient.addColorStop(0.5, colorThemes[theme].gradient[1]);
    gradient.addColorStop(1, colorThemes[theme].gradient[2]);
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = gradient;
    ctx.shadowColor = colorThemes[theme].glow;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    
    const sliceWidth = width / data.length;
    let x = 0;
    
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] / 128.0) - 1;
      const y = centerY + v * centerY * sensitivity * volume;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    
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
    
    ctx.strokeStyle = `${colorThemes[theme].gradient[0].replace('0.8', '0.4')}`;
    ctx.stroke();
    
    ctx.shadowBlur = 0;
  };

  const drawPlaceholderVisualizer = (
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number; height: number },
    theme: ColorTheme
  ) => {
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const time = Date.now() / 1000;
    const pulseSize = 0.5 + Math.sin(time * 2) * 0.1;
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, width * 0.25 * pulseSize
    );
    gradient.addColorStop(0, colorThemes[theme].highlight.replace('0.8', '0.2'));
    gradient.addColorStop(0.7, colorThemes[theme].gradient[1].replace('0.9', '0.1'));
    gradient.addColorStop(1, colorThemes[theme].gradient[0].replace('0.8', '0'));
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, width * 0.25 * pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
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
      
      <div className="absolute top-4 left-4 glass-panel rounded-lg py-1 px-2">
        <Select
          value={colorTheme}
          onValueChange={(value: ColorTheme) => setColorTheme(value)}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs bg-transparent border-white/10 text-white">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent className="bg-black/80 border-white/10 text-white">
            <SelectGroup>
              {Object.entries(colorThemes).map(([key, theme]) => (
                <SelectItem key={key} value={key} className="text-xs hover:bg-white/10">
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Visualizer;
