'use client';

import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const apply = () => {
      let theme: string | null = null;
      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('ireo_current_user_id');
        if (userId) {
          theme = localStorage.getItem('ireo_theme_' + userId);
        }
        if (!theme) {
          try {
            const settings = JSON.parse(localStorage.getItem('ireo_settings') || '{}');
            theme = settings.theme || null;
          } catch { /* ignore */ }
        }
      }
      const dark = theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDark(dark);
    };

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    window.addEventListener('storage', apply);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', apply);
    };
  }, []);

  return { isDark };
}
