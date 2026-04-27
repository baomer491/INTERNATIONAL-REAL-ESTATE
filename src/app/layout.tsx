import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/layout/AppContext';

export const metadata: Metadata = {
  title: 'نظام التثمين العقاري — مكتب العقارات الدولية',
  description: 'نظام متكامل لإدارة تقارير التثمين العقاري',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, * {
              font-family: 'Noto Kufi Arabic', 'Segoe UI', Tahoma, sans-serif !important;
            }
          `
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var userId = localStorage.getItem('ireo_current_user_id');
                var theme = null;
                if (userId) {
                  theme = localStorage.getItem('ireo_theme_' + userId);
                }
                if (!theme) {
                  var settings = JSON.parse(localStorage.getItem('ireo_settings') || '{}');
                  theme = settings.theme;
                }
                if (theme === 'dark' || theme === 'sepia') {
                  document.documentElement.setAttribute('data-theme', theme);
                }
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body suppressHydrationWarning>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
