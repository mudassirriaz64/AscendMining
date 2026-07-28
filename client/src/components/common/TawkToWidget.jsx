import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

/**
 * TawkToWidget
 * ─────────────────────────────────────────────────────────────────────────────
 * Injects the Tawk.to live-chat script once, then pre-identifies the
 * logged-in investor (name + email) so agents know who they're talking to.
 *
 * ✏️  TO CONFIGURE: set the two env vars in client/.env:
 *     VITE_TAWK_PROPERTY_ID=<your-property-id>
 *     VITE_TAWK_WIDGET_ID=<your-widget-id>
 *
 *  Both values are in the Tawk.to embed URL:
 *     https://embed.tawk.to/PROPERTY_ID/WIDGET_ID
 *
 * This component renders nothing — it's a pure side-effect loader.
 */
const PROPERTY_ID = import.meta.env.VITE_TAWK_PROPERTY_ID || 'YOUR_PROPERTY_ID_HERE';
const WIDGET_ID   = import.meta.env.VITE_TAWK_WIDGET_ID   || 'YOUR_WIDGET_ID_HERE';

const TawkToWidget = () => {
  const { user } = useSelector((state) => state.auth);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Initialise Tawk globals before the script loads
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // When Tawk.to finishes loading, pre-fill visitor identity
    window.Tawk_API.onLoad = () => {
      if (user) {
        window.Tawk_API.setAttributes(
          {
            name:  user.fullName  || user.username || 'Investor',
            email: user.email     || '',
            id:    user.id        || user._id || '',
          },
          (err) => {
            if (err) console.warn('[Tawk.to] setAttributes error:', err);
          }
        );
      }
    };

    // Inject the Tawk.to embed script
    const script = document.createElement('script');
    script.async  = true;
    script.src    = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);

    return () => {
      // Cleanup: remove widget on unmount (e.g. user logs out)
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
        window.Tawk_API.hideWidget();
      }
    };
  }, []); // run once on mount

  // When the logged-in user changes (e.g. after hydration), update attributes
  useEffect(() => {
    if (!user || !window.Tawk_API?.setAttributes) return;

    window.Tawk_API.setAttributes(
      {
        name:  user.fullName  || user.username || 'Investor',
        email: user.email     || '',
        id:    user.id        || user._id || '',
      },
      (err) => {
        if (err) console.warn('[Tawk.to] setAttributes error:', err);
      }
    );
  }, [user]);

  return null; // renders nothing
};

export default TawkToWidget;
