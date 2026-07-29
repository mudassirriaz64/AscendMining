/**
 * Flashes the browser tab title when a new message arrives and the tab is backgrounded
 */
let flashInterval = null;
let originalTitle = '';

export const triggerTabFlash = (messageText = 'New message') => {
  if (!document.hidden) return;
  if (flashInterval) return; // already flashing

  originalTitle = document.title;
  let showFlash = true;

  flashInterval = window.setInterval(() => {
    document.title = showFlash ? `💬 ${messageText}` : originalTitle;
    showFlash = !showFlash;
  }, 1200);

  const clearFlash = () => {
    if (!document.hidden) {
      window.clearInterval(flashInterval);
      flashInterval = null;
      document.title = originalTitle;
      window.removeEventListener('focus', clearFlash);
      document.removeEventListener('visibilitychange', clearFlash);
    }
  };

  window.addEventListener('focus', clearFlash);
  document.addEventListener('visibilitychange', clearFlash);
};
