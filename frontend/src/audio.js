export const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Safari only lets an AudioContext resume while a user gesture handler is
// still running; called later (e.g. after an await), resume() never settles.
// Call this synchronously at the top of any handler that will lead to playback.
export function unlockAudio() {
  if (audioContext.state !== 'running') {
    audioContext.resume().catch((err) => console.error('Error resuming audio:', err));
  }
}

// Fallback for playback that starts without a fresh gesture (e.g. after a
// page refresh): resume on the next interaction anywhere on the page.
['click', 'touchend', 'keydown'].forEach((type) => {
  document.addEventListener(type, unlockAudio, { capture: true });
});
