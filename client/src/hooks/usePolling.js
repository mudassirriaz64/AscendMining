import { useEffect, useRef } from 'react';

export default function usePolling(callback, interval = 30000, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
        id = setInterval(tick, interval);
      } else {
        clearInterval(id);
      }
    };

    let id = setInterval(tick, interval);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [interval, enabled]);
}
