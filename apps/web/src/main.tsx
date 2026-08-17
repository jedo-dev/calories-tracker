import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Side-effect: ловит beforeinstallprompt до того, как он отстреляет
import './utils/installPrompt';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Сервис-воркер нужен только для пуш-уведомлений; регистрация сама по себе
// ничего не запрашивает у пользователя (разрешение — только из настроек).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
