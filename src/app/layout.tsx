import type { Metadata } from 'next';
import './globals.css';

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
                var settings = JSON.parse(localStorage.getItem('ireo_settings') || '{}');
                if (settings.theme === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
