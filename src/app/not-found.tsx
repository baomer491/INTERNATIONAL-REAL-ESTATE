'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f2337 0%, #1e3a5f 50%, #2d5a8e 100%)',
      padding: 20,
    }}>
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 20,
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
            padding: '40px 32px', textAlign: 'center',
          }}>
            <img
              src="/IRE-logopdf-trans.png"
              alt="مكتب العقارات الدولية"
              style={{
                width: 180, height: 'auto',
                margin: '0 auto 20px', display: 'block',
                filter: 'brightness(0) invert(1)',
              }}
            />
          </div>

          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <AlertCircle size={48} color="var(--color-primary)" strokeWidth={1.5} />
            </div>

            <h1 style={{
              fontSize: 72, fontWeight: 800, color: 'var(--color-primary)',
              margin: '0 0 8px', lineHeight: 1, letterSpacing: -2,
            }}>
              404
            </h1>

            <h2 style={{
              fontSize: 22, fontWeight: 700, color: 'var(--color-text)',
              margin: '0 0 12px',
            }}>
              الصفحة غير موجودة
            </h2>

            <p style={{
              fontSize: 15, color: 'var(--color-text-secondary)',
              margin: '0 0 32px', lineHeight: 1.7,
            }}>
              عذراً، الصفحة التي تبحث عنها غير موجودة
            </p>

            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '14px 32px',
                background: 'var(--color-primary)', color: 'white',
                borderRadius: 10, fontSize: 15, fontWeight: 700,
                textDecoration: 'none', fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}
            >
              <Home size={18} />
              العودة للرئيسية
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          &copy; 2026 مكتب العقارات الدولية &mdash; جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
