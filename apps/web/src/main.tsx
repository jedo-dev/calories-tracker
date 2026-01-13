import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Telegram WebApp initialization
const tg = (window as any).Telegram?.WebApp;
if (tg) {
  tg.ready();

  // Set header and background colors based on theme
  const themeParams = tg.themeParams;
  if (themeParams && themeParams.bg_color) {
    try {
      // Telegram WebApp API expects color in format #RRGGBB
      // bg_color from themeParams is a number (e.g., 0xFFFFFF)
      const bgColorHex = typeof themeParams.bg_color === 'number'
        ? themeParams.bg_color.toString(16).padStart(6, '0')
        : String(themeParams.bg_color).replace('#', '');

      if (bgColorHex && bgColorHex.length === 6 && /^[0-9a-fA-F]{6}$/.test(bgColorHex)) {
        const colorString = `#${bgColorHex}`;
        if (tg.setBackgroundColor) {
          tg.setBackgroundColor(colorString);
        }
        if (tg.setHeaderColor) {
          tg.setHeaderColor(colorString);
        }
      }
    } catch (e) {
      console.warn('[Telegram.WebApp] Failed to set colors:', e);
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

