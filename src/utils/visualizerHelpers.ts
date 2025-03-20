
/**
 * Generates a smooth waveform effect that responds to audio input
 * @param frequencyData The frequency data from audio analyser
 * @param numBars Number of bars to display in the visualizer
 * @param sensitivity How sensitive the visualizer is to audio changes
 * @returns Array of normalized values for visualization
 */
export function generateWaveform(
  frequencyData: Uint8Array,
  numBars: number = 64,
  sensitivity: number = 1.5
): number[] {
  if (!frequencyData.length) return Array(numBars).fill(0);
  
  const sampleSize = Math.floor(frequencyData.length / numBars);
  const output: number[] = [];
  
  for (let i = 0; i < numBars; i++) {
    let sum = 0;
    for (let j = 0; j < sampleSize; j++) {
      const index = i * sampleSize + j;
      if (index < frequencyData.length) {
        sum += frequencyData[index];
      }
    }
    // Normalize and apply sensitivity
    const average = sum / sampleSize / 255;
    
    // Apply position-based variance (lower frequencies on left, higher on right)
    const positionMultiplier = 0.7 + (i / numBars) * 0.6; // Values between 0.7-1.3 based on position
    output.push(Math.min(1, average * sensitivity * positionMultiplier));
  }
  
  return smoothArray(output, 0.5);
}

/**
 * Applies a circular visualization effect
 * @param frequencyData The frequency data from audio analyser
 * @param numPoints Number of points around the circle
 * @param sensitivity How sensitive the visualizer is to audio changes
 * @returns Array of normalized values for circular visualization
 */
export function generateCircular(
  frequencyData: Uint8Array,
  numPoints: number = 64,
  sensitivity: number = 1.2
): number[] {
  if (!frequencyData.length) return Array(numPoints).fill(0);
  
  const output: number[] = [];
  const sampleSize = Math.floor(frequencyData.length / numPoints);
  
  for (let i = 0; i < numPoints; i++) {
    let sum = 0;
    for (let j = 0; j < sampleSize; j++) {
      const index = i * sampleSize + j;
      if (index < frequencyData.length) {
        sum += frequencyData[index];
      }
    }
    
    // Normalize and apply sensitivity
    const average = sum / sampleSize / 255;
    
    // Apply angle-based variation for more interesting movement
    const angle = (i / numPoints) * Math.PI * 2;
    const variationFactor = 1 + 0.3 * Math.sin(angle * 3); // Add wave pattern based on angle
    
    output.push(Math.min(1, average * sensitivity * variationFactor));
  }
  
  return smoothArray(output, 0.4); // Less smoothing for more dynamic movement
}

/**
 * Smooths an array using a moving average
 * @param array Input array to smooth
 * @param factor Smoothing factor (0-1)
 * @returns Smoothed array
 */
export function smoothArray(array: number[], factor: number = 0.5): number[] {
  if (factor <= 0) return array;
  if (factor >= 1) return Array(array.length).fill(array.reduce((a, b) => a + b, 0) / array.length);
  
  const result = array.slice();
  for (let i = 1; i < result.length - 1; i++) {
    result[i] = result[i] * (1 - factor) + ((result[i - 1] + result[i + 1]) / 2) * factor;
  }
  return result;
}

/**
 * Formats time in seconds to mm:ss format
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get luminance value for a volume level (for visualizer brightness)
 * @param volume Volume level (0-1)
 * @returns Luminance value (0-1)
 */
export function getVolumeLuminance(volume: number): number {
  return 0.3 + (volume * 0.7);
}

/**
 * Color theme definitions for the visualizer
 */
export const colorThemes = {
  blue: {
    name: 'Blue',
    gradient: ['rgba(137, 207, 240, 0.8)', 'rgba(190, 227, 248, 0.9)', 'rgba(137, 207, 240, 0.8)'],
    highlight: 'rgba(255, 255, 255, 0.8)',
    glow: 'rgba(255, 255, 255, 0.6)'
  },
  purple: {
    name: 'Purple',
    gradient: ['rgba(149, 128, 255, 0.8)', 'rgba(187, 169, 255, 0.9)', 'rgba(149, 128, 255, 0.8)'],
    highlight: 'rgba(240, 230, 255, 0.8)',
    glow: 'rgba(180, 160, 255, 0.6)'
  },
  green: {
    name: 'Green',
    gradient: ['rgba(97, 205, 132, 0.8)', 'rgba(155, 236, 183, 0.9)', 'rgba(97, 205, 132, 0.8)'],
    highlight: 'rgba(220, 255, 230, 0.8)',
    glow: 'rgba(130, 230, 160, 0.6)'
  },
  orange: {
    name: 'Orange',
    gradient: ['rgba(255, 146, 43, 0.8)', 'rgba(255, 186, 113, 0.9)', 'rgba(255, 146, 43, 0.8)'],
    highlight: 'rgba(255, 240, 220, 0.8)',
    glow: 'rgba(255, 170, 100, 0.6)'
  },
  pink: {
    name: 'Pink',
    gradient: ['rgba(255, 105, 180, 0.8)', 'rgba(255, 182, 219, 0.9)', 'rgba(255, 105, 180, 0.8)'],
    highlight: 'rgba(255, 230, 242, 0.8)',
    glow: 'rgba(255, 150, 200, 0.6)'
  },
  rainbow: {
    name: 'Rainbow',
    gradient: ['rgba(255, 0, 0, 0.8)', 'rgba(0, 255, 0, 0.8)', 'rgba(0, 0, 255, 0.8)'],
    highlight: 'rgba(255, 255, 255, 0.8)',
    glow: 'rgba(255, 255, 255, 0.6)',
    isRainbow: true
  }
};

/**
 * Color theme type
 */
export type ColorTheme = keyof typeof colorThemes;

/**
 * Generates a dynamic color based on frequency intensity
 * @param value Intensity value (0-1)
 * @param hueStart Starting hue
 * @param hueEnd Ending hue
 * @returns CSS color string
 */
export function getDynamicColor(
  value: number,
  hueStart: number = 200,
  hueEnd: number = 240
): string {
  const hue = hueStart + (hueEnd - hueStart) * value;
  const saturation = 70 + (30 * value);
  const lightness = 60 + (20 * value);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generates a rainbow color at a specific position
 * @param position Position value (0-1)
 * @param value Intensity value for brightness adjustment
 * @returns CSS color string
 */
export function getRainbowColor(position: number, value: number = 1): string {
  const hue = position * 360;
  const saturation = 70 + (30 * value);
  const lightness = 50 + (20 * value);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generates a color gradient for a position on the visualizer
 * @param position Position (0-1)
 * @param value Intensity value (0-1)
 * @param theme Color theme to use
 * @returns CSS color string
 */
export function getThemeColor(position: number, value: number, theme: ColorTheme = 'blue'): string {
  const selectedTheme = colorThemes[theme];
  
  if (selectedTheme.isRainbow) {
    return getRainbowColor(position, value);
  }
  
  // For normal themes, adjust color based on position and value
  const hueShift = value * 20; // Subtle hue shift based on intensity
  const saturationBoost = value * 30; // Boost saturation with higher values
  const lightnessBoost = value * 20; // Boost lightness with higher values
  
  // Extract the base color from the theme's first gradient color
  const baseColor = selectedTheme.gradient[0];
  const matches = baseColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
  
  if (!matches) return baseColor;
  
  const r = parseInt(matches[1]);
  const g = parseInt(matches[2]);
  const b = parseInt(matches[3]);
  
  // Create a slightly modified version based on position and value
  const intensity = 0.7 + value * 0.3;
  const positionVariance = 0.7 + (position * 0.6);
  
  return `rgba(${Math.min(255, r * positionVariance)}, ${Math.min(255, g * intensity)}, ${Math.min(255, b * intensity)}, ${0.7 + value * 0.3})`;
}
