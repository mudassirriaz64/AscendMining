/**
 * useTawkTo
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides helper functions to control the Tawk.to chat widget from any
 * React component without needing the widget mounted nearby.
 *
 * Usage:
 *   const { openChat, closeChat, toggleChat, isReady } = useTawkTo();
 *   <button onClick={openChat}>Chat with us</button>
 */
const useTawkTo = () => {
  const api = () => window.Tawk_API;

  const isReady = () => !!(api() && typeof api().maximize === 'function');

  /** Open (maximise) the chat widget */
  const openChat = () => {
    if (isReady()) {
      api().maximize();
    } else {
      // Widget not loaded yet — wait and retry once
      const interval = setInterval(() => {
        if (isReady()) {
          api().maximize();
          clearInterval(interval);
        }
      }, 300);
      // Give up after 5s to avoid infinite loop
      setTimeout(() => clearInterval(interval), 5000);
    }
  };

  /** Minimise the chat widget */
  const closeChat = () => {
    if (isReady()) api().minimize();
  };

  /** Toggle open/closed */
  const toggleChat = () => {
    if (isReady()) api().toggle();
  };

  /** Hide the widget button entirely */
  const hideWidget = () => {
    if (isReady()) api().hideWidget();
  };

  /** Show the widget button again */
  const showWidget = () => {
    if (isReady()) api().showWidget();
  };

  return { openChat, closeChat, toggleChat, hideWidget, showWidget, isReady };
};

export default useTawkTo;
