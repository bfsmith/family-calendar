/**
 * Represents a sound effect used throughout the application
 */
export interface SoundEffect {
  /** Unique identifier for the sound effect */
  name: string;
  
  /** File path to the audio file, relative to the public directory (e.g., '/audio/notifications/chore-complete.mp3') */
  filePath: string;
  
  /** Duration of the sound effect in seconds */
  durationSeconds: number;
}
