'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Eye, EyeOff, Lock, User, Building2, Shield, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const { login, showToast } = useApp();
  const { isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
    await new Promise(r => setTimeout(r, 800));

    const result = await login(username, password);
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
  };

  return (
    <ErrorBoundary>
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: "url('/login-bg.png') center center / cover no-repeat",
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Cinematic dark overlay with vignette */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(180deg, rgba(2,6,18,0.45) 0%, rgba(2,6,18,0.3) 40%, rgba(2,6,18,0.5) 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Subtle warm glow from city lights */}
      <div style={{
        position: 'fixed', bottom: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '140%', height: '60%',
        background: 'radial-gradient(ellipse at center bottom, rgba(201,169,110,0.06) 0%, transparent 55%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Main login card */}
      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>

        {/* Top gold accent line */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.8), rgba(255,200,100,0.9), rgba(201,169,110,0.8), transparent)',
          borderRadius: '3px 3px 0 0',
          marginBottom: -1,
          position: 'relative', zIndex: 2,
        }} />

        {/* Glass card */}
        <div style={{
          background: 'rgba(8, 14, 30, 0.4)',
          borderRadius: '0 0 24px 24px',
          backdropFilter: 'blur(40px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.3)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,169,110,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: 'none',
        }}>

          {/* Thin divider */}
          <div style={{
            margin: '32px 32px 0',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)',
          }} />

          {/* Form Section */}
          <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>

            {/* Section label */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{
                fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.88)',
                margin: 0, letterSpacing: '0.02em',
              }}>
                تسجيل الدخول
              </h2>
              <p style={{
                fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '6px 0 0',
                fontWeight: 400,
              }}>
                أدخل بياناتك للوصول إلى النظام
              </p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.12)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                color: '#fca5a5',
                padding: '12px 16px', borderRadius: 14,
                fontSize: 13, marginBottom: 20, textAlign: 'center',
                fontWeight: 500, backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Shield size={15} />
                {error}
              </div>
            )}

            {/* Username field */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.55)', marginBottom: 8,
                letterSpacing: '0.02em',
              }}>
                اسم المستخدم
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', right: 0, top: 0, bottom: 0, width: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(201,169,110,0.08)',
                  borderRadius: '0 12px 12px 0',
                  borderRight: '1px solid rgba(201,169,110,0.15)',
                }}>
                  <User size={16} color="rgba(201,169,110,0.6)" />
                </div>
                <input
                  type="text" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  style={{
                    width: '100%', padding: '13px 16px 13px 16px',
                    paddingRight: 56,
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                    fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.9)',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(201,169,110,0.4)';
                    e.target.style.background = 'rgba(255,255,255,0.07)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.background = 'rgba(255,255,255,0.04)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.55)', marginBottom: 8,
                letterSpacing: '0.02em',
              }}>
                كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', right: 0, top: 0, bottom: 0, width: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(201,169,110,0.08)',
                  borderRadius: '0 12px 12px 0',
                  borderRight: '1px solid rgba(201,169,110,0.15)',
                }}>
                  <Lock size={16} color="rgba(201,169,110,0.6)" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  style={{
                    width: '100%', padding: '13px 48px 13px 16px',
                    paddingRight: 56,
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                    fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.9)',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(201,169,110,0.4)';
                    e.target.style.background = 'rgba(255,255,255,0.07)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.background = 'rgba(255,255,255,0.04)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                    color: 'rgba(255,255,255,0.3)',
                    borderRadius: 8,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(201,169,110,0.7)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '15px',
                background: loading
                  ? 'rgba(201,169,110,0.2)'
                  : 'linear-gradient(135deg, #b8922e 0%, #d4a843 40%, #c9a96e 60%, #b8922e 100%)',
                color: loading ? 'rgba(255,255,255,0.4)' : '#0a0f1a',
                border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 10,
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: loading
                  ? 'none'
                  : '0 4px 20px rgba(201,169,110,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                position: 'relative', overflow: 'hidden',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,169,110,0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = loading
                  ? 'none'
                  : '0 4px 20px rgba(201,169,110,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                  }} />
                  جاري التحقق...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={18} strokeWidth={2.5} />
                  تسجيل الدخول
                  <ChevronRight size={16} />
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Bottom gold accent line */}
        <div style={{
          height: 2, marginTop: -1,
          background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.4), transparent)',
          borderRadius: '0 0 2px 2px',
          position: 'relative', zIndex: 2,
        }} />

        {/* Copyright */}
        <p style={{
          textAlign: 'center', marginTop: 24, fontSize: 12,
          color: 'rgba(255,255,255,0.2)',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          fontWeight: 500, letterSpacing: '0.02em',
        }}>
          &copy; 2026 مكتب العقارات الدولية &mdash; جميع الحقوق محفوظة
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `
      }} />
    </div>
    </ErrorBoundary>
  );
}
