import { SoundEffect } from '../types/SoundEffect';

/**
 * Static data source for all available sound effects
 * These correspond to the actual mp3 files in /public/audio/notifications
 * Durations measured using ffmpeg for accuracy
 */
export const soundEffects: SoundEffect[] = [
  {
    name: 'all-done',
    filePath: '/audio/notifications/all-done.mp3',
    durationSeconds: 1.071
  },
  {
    name: 'beep-alarm',
    filePath: '/audio/notifications/beep-alarm.mp3',
    durationSeconds: 7.08
  },
  {
    name: 'bell-3',
    filePath: '/audio/notifications/bell-3.mp3',
    durationSeconds: 1.848
  },
  {
    name: 'calm-ring',
    filePath: '/audio/notifications/calm-ring.mp3',
    durationSeconds: 9.672
  },
  {
    name: 'cheery',
    filePath: '/audio/notifications/cheery.mp3',
    durationSeconds: 7.752
  },
  {
    name: 'chime',
    filePath: '/audio/notifications/chime.mp3',
    durationSeconds: 1.848
  },
  {
    name: 'coins',
    filePath: '/audio/notifications/coins.mp3',
    durationSeconds: 2.220406
  },
  {
    name: 'happy-bell',
    filePath: '/audio/notifications/happy-bell.mp3',
    durationSeconds: 1.848
  },
  {
    name: 'hello',
    filePath: '/audio/notifications/hello.mp3',
    durationSeconds: 1.152
  },
  {
    name: 'level-up',
    filePath: '/audio/notifications/level-up.mp3',
    durationSeconds: 1.056
  },
  {
    name: 'look-at-me',
    filePath: '/audio/notifications/look-at-me.mp3',
    durationSeconds: 3.395906
  },
  {
    name: 'old-alarm-clock',
    filePath: '/audio/notifications/old-alarm-clock.mp3',
    durationSeconds: 6.12
  },
  {
    name: 'submarine',
    filePath: '/audio/notifications/submarine.mp3',
    durationSeconds: 3.048
  },
  {
    name: 'thriller-warning',
    filePath: '/audio/notifications/thriller-warning.mp3',
    durationSeconds: 5.06775
  },
  {
    name: 'welcome',
    filePath: '/audio/notifications/welcome.mp3',
    durationSeconds: 2.52
  }
];
