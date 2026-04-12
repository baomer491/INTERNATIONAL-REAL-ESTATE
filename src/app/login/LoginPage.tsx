'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const { login, showToast } = useApp();
  const { isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dm = isDark;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم');
      return;
    }
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = login(username, password);
      if (!result.success) {
        if (result.reason === 'suspended') {
          setError('تم إيقاف هذا الحساب. تواصل مع مدير النظام.');
        } else if (result.reason === 'inactive') {
          setError('هذا الحساب غير نشط. تواصل مع مدير النظام.');
        } else {
          setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
        showToast('فشل تسجيل الدخول', 'error');
      } else {
        showToast('تم تسجيل الدخول بنجاح', 'success');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dm
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        : 'linear-gradient(135deg, #0f2337 0%, #1e3a5f 50%, #2d5a8e 100%)',
      padding: 20,
    }}>
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: dm ? 'rgba(30, 41, 59, 0.97)' : 'rgba(255,255,255,0.97)',
          borderRadius: 20,
          boxShadow: dm ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          border: dm ? '1px solid #334155' : 'none',
        }}>
          <div style={{
            background: dm
              ? 'linear-gradient(135deg, #1e293b, #334155)'
              : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
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
            <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>
              نظام التثمين العقاري
            </h1>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
            <h2 style={{
              fontSize: 18, fontWeight: 700, color: 'var(--color-text)',
              margin: '0 0 24px', textAlign: 'center',
            }}>
              تسجيل الدخول
            </h2>

            {error && (
              <div style={{
                background: dm ? '#450a0a' : '#fef2f2',
                border: `1px solid ${dm ? '#7f1d1d' : '#fecaca'}`,
                color: dm ? '#fca5a5' : '#b91c1c',
                padding: '10px 16px', borderRadius: 8,
                fontSize: 13, marginBottom: 16, textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                اسم المستخدم
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  style={{
                    width: '100%', padding: '12px 44px 12px 14px',
                    border: '1.5px solid var(--color-border)', borderRadius: 8,
                    fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
                    background: dm ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  style={{
                    width: '100%', padding: '12px 44px',
                    border: '1.5px solid var(--color-border)', borderRadius: 8,
                    fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
                    background: dm ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-muted)',
                  }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#94a3b8' : 'var(--color-primary)',
                color: 'white', border: 'none', borderRadius: 8,
                fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {loading ? (
                <>
                  <div style={{
                    width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                  جاري التحميل...
                </>
              ) : 'تسجيل الدخول'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
              للتجربة: اسم المستخدم <strong>admin</strong> وكلمة المرور <strong>admin123</strong>
            </p>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          &copy; 2026 مكتب العقارات الدولية &mdash; جميع الحقوق محفوظة
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `@keyframes spin { to { transform: rotate(360deg); } }`
      }} />
    </div>
  );
}
