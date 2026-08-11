'use client';

const notificationSoundUrl = '/api/notification-sound';
let audio: HTMLAudioElement | null = null;

function getAudio() {
  if (!audio) {
    audio = new Audio(notificationSoundUrl);
    audio.preload = 'auto';
  }
  return audio;
}

function playFallbackTone() {
  if (!window.AudioContext) return;

  const context = new window.AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  gain.gain.setValueAtTime(0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.35);
  oscillator.addEventListener('ended', () => context.close());
}

/** Unlocks audio after a user gesture so later notification sounds are allowed by browsers. */
export async function primeNotificationSound() {
  if (typeof window === 'undefined') return;

  try {
    const player = getAudio();
    player.muted = true;
    await player.play();
    player.pause();
    player.currentTime = 0;
    player.muted = false;
  } catch {
    // A later user gesture can still unlock audio. Notification playback remains best-effort.
  }
}

/** Plays the custom sound and falls back to a short browser alert tone if it is unavailable. */
export async function playNotificationSound() {
  if (typeof window === 'undefined') return;

  try {
    const player = getAudio().cloneNode(true) as HTMLAudioElement;
    player.currentTime = 0;
    await player.play();
  } catch {
    try {
      playFallbackTone();
    } catch {
      // Browsers may block all sound until the user has interacted with the page.
    }
  }
}
