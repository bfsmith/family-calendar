import { SoundEffect } from '../types/SoundEffect';
import { soundEffects } from './soundEffects';

/**
 * Service for managing sound effects
 * Follows the Single Responsibility Principle by focusing only on sound effect management
 * Since sound effects are static files, no database integration is needed
 */
class SoundEffectService {
  private static instance: SoundEffectService;

  private constructor() {}

  static getInstance(): SoundEffectService {
    if (!SoundEffectService.instance) {
      SoundEffectService.instance = new SoundEffectService();
    }
    return SoundEffectService.instance;
  }

  /**
   * Get all available sound effects
   * @returns Array of available sound effects
   */
  listSoundEffects(): SoundEffect[] {
    return soundEffects;
  }

  /**
   * Get a specific sound effect by name
   * @param name The name of the sound effect to retrieve
   * @returns The sound effect if found, undefined otherwise
   */
  getSoundEffect(name: string): SoundEffect | undefined {
    return this.listSoundEffects().find(effect => effect.name === name);
  }
}

// Export singleton instance
export const soundEffectService = SoundEffectService.getInstance();
