// Simulate voice detection (in a real implementation, you'd use a proper voice recognition API)
export const detectVoiceActivity = (audioLevel: number): boolean => {
  // Threshold for voice detection (adjust based on your needs)
  const VOICE_THRESHOLD = 0.2;
  return audioLevel > VOICE_THRESHOLD;
};

// Simulate visual detection
export const detectVisualAnomaly = (timeSinceLastWarning: number): boolean => {
  const baseDetectionProbability = 0.3;
  const timeFactorMultiplier = Math.min(timeSinceLastWarning / 10000, 1);
  const finalProbability = baseDetectionProbability * timeFactorMultiplier;
  return Math.random() < finalProbability;
};