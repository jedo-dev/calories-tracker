import { useState, useEffect } from 'react';
import { Theme, lightTheme, darkTheme, getThemeFromTelegram } from './theme';

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(lightTheme);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.themeParams) {
      const telegramTheme = getThemeFromTelegram(tg.themeParams);
      if (telegramTheme) {
        setTheme(telegramTheme);
      } else {
        const isDark = tg.themeParams.color_scheme === 'dark';
        setTheme(isDark ? darkTheme : lightTheme);
      }
    } else {
      setTheme(lightTheme);
    }

    if (tg?.onEvent) {
      const handleThemeChange = () => {
        if (tg.themeParams) {
          const telegramTheme = getThemeFromTelegram(tg.themeParams);
          if (telegramTheme) {
            setTheme(telegramTheme);
          } else {
            const isDark = tg.themeParams.color_scheme === 'dark';
            setTheme(isDark ? darkTheme : lightTheme);
          }
        }
      };
      tg.onEvent('themeChanged', handleThemeChange);
      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    }
  }, []);

  return theme;
}
