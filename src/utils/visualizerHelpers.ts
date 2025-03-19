
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
    output.push(Math.min(1, average * sensitivity));
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
  const waveform = generateWaveform(frequencyData, numPoints, sensitivity);
  // Mirror the second half for a more symmetrical circular effect
  const halfLength = Math.floor(waveform.length / 2);
  for (let i = 0; i < halfLength; i++) {
    waveform[waveform.length - 1 - i] = waveform[i];
  }
  return waveform;
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
