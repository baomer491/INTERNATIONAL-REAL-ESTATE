'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
      background: dm
        ? 'linear-gradient(135deg, #0a0f1a 0%, #111827 40%, #1a2332 100%)'
        : 'linear-gradient(135deg, #0a1628 0%, #122a4e 40%, #1a3a6a 100%)',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated floating geometric shapes */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Large circle top-right */}
        <div style={{
          position: 'absolute', top: '-15%', right: '-10%', width: '50vw', height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30, 58, 95, 0.3) 0%, transparent 70%)',
          animation: 'float1 20s ease-in-out infinite',
        }} />
        {/* Medium circle bottom-left */}
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%', width: '35vw', height: '35vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 50, 80, 0.25) 0%, transparent 70%)',
          animation: 'float2 25s ease-in-out infinite',
        }} />
        {/* Small accent circles */}
        <div style={{
          position: 'absolute', top: '20%', left: '15%', width: 8, height: 8,
          borderRadius: '50%', background: 'rgba(100, 160, 220, 0.3)',
          animation: 'float3 15s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '60%', right: '20%', width: 6, height: 6,
          borderRadius: '50%', background: 'rgba(100, 160, 220, 0.2)',
          animation: 'float3 18s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '35%', right: '8%', width: 4, height: 4,
          borderRadius: '50%', background: 'rgba(100, 160, 220, 0.25)',
          animation: 'float3 12s ease-in-out infinite',
        }} />
      </div>

      {/* Cityscape SVG silhouette */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '35vh',
        opacity: dm ? 0.06 : 0.08, pointerEvents: 'none',
      }}>
        <svg viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%' }}>
          {/* Background buildings */}
          <rect x="0" y="180" width="60" height="220" fill="currentColor" />
          <rect x="55" y="140" width="45" height="260" fill="currentColor" />
          <rect x="95" y="200" width="70" height="200" fill="currentColor" />
          <rect x="160" y="100" width="50" height="300" fill="currentColor" />
          <rect x="205" y="160" width="40" height="240" fill="currentColor" />
          <rect x="240" y="120" width="55" height="280" fill="currentColor" />
          <rect x="290" y="80" width="40" height="320" fill="currentColor" />
          <rect x="325" y="180" width="60" height="220" fill="currentColor" />
          <rect x="380" y="60" width="35" height="340" fill="currentColor" />
          <rect x="410" y="130" width="50" height="270" fill="currentColor" />
          <rect x="455" y="170" width="65" height="230" fill="currentColor" />
          <rect x="515" y="90" width="45" height="310" fill="currentColor" />
          <rect x="555" y="150" width="55" height="250" fill="currentColor" />
          {/* Tallest building (center tower) */}
          <rect x="605" y="20" width="50" height="380" fill="currentColor" />
          <rect x="615" y="0" width="30" height="20" fill="currentColor" />
          {/* Right side buildings */}
          <rect x="650" y="110" width="60" height="290" fill="currentColor" />
          <rect x="705" y="170" width="45" height="230" fill="currentColor" />
          <rect x="745" y="130" width="55" height="270" fill="currentColor" />
          <rect x="795" y="190" width="40" height="210" fill="currentColor" />
          <rect x="830" y="70" width="50" height="330" fill="currentColor" />
          <rect x="875" y="160" width="65" height="240" fill="currentColor" />
          <rect x="935" y="100" width="40" height="300" fill="currentColor" />
          <rect x="970" y="180" width="55" height="220" fill="currentColor" />
          <rect x="1020" y="140" width="45" height="260" fill="currentColor" />
          <rect x="1060" y="200" width="60" height="200" fill="currentColor" />
          <rect x="1115" y="110" width="50" height="290" fill="currentColor" />
          <rect x="1160" y="170" width="40" height="230" fill="currentColor" />
          <rect x="1195" y="80" width="55" height="320" fill="currentColor" />
          <rect x="1245" y="150" width="45" height="250" fill="currentColor" />
          <rect x="1285" y="190" width="60" height="210" fill="currentColor" />
          <rect x="1340" y="120" width="50" height="280" fill="currentColor" />
          <rect x="1385" y="180" width="55" height="220" fill="currentColor" />
        </svg>
      </div>

      {/* Diagonal lines decoration */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '50%', height: '100%',
        opacity: 0.015, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 40px,
          rgba(255,255,255,0.5) 40px,
          rgba(255,255,255,0.5) 41px
        )`,
      }} />

      {/* Login Card */}
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Glass card effect */}
        <div style={{
          background: dm
            ? 'rgba(15, 23, 42, 0.85)'
            : 'rgba(255, 255, 255, 0.95)',
          borderRadius: 24,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: dm
            ? '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 32px 64px rgba(0,0,0,0.25), 0 0 80px rgba(30, 58, 95, 0.15)',
          overflow: 'hidden',
          border: dm ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.3)',
        }}>
          {/* Header with gradient */}
          <div style={{
            background: dm
              ? 'linear-gradient(135deg, #0f2337, #1e3a5f, #1a4a7a)'
              : 'linear-gradient(135deg, #0f2337, #1e3a5f, #2d5a8e)',
            padding: '44px 32px 36px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles in header */}
            <div style={{
              position: 'absolute', top: '-30px', right: '-30px', width: 100, height: 100,
              borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
            }} />
            <div style={{
              position: 'absolute', bottom: '-20px', left: '-20px', width: 80, height: 80,
              borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
            }} />

            <img
              src="/IRE-logopdf-trans.png"
              alt="مكتب العقارات الدولية"
              style={{
                width: 160, height: 'auto',
                margin: '0 auto 16px', display: 'block',
                filter: 'brightness(0) invert(1)',
                position: 'relative', zIndex: 1,
              }}
            />
            <h1 style={{
              color: 'white', fontSize: 22, fontWeight: 800,
              margin: 0, position: 'relative', zIndex: 1,
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              نظام التثمين العقاري
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '8px 0 0',
              position: 'relative', zIndex: 1,
            }}>
              International Real Estate Valuation System
            </p>
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
                padding: '10px 16px', borderRadius: 10,
                fontSize: 13, marginBottom: 16, textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 14, fontWeight: 600,
                color: 'var(--color-text)', marginBottom: 6,
              }}>
                اسم المستخدم
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                }} />
                <input
                  type="text" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  style={{
                    width: '100%', padding: '12px 44px 12px 14px',
                    border: '1.5px solid var(--color-border)', borderRadius: 10,
                    fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
                    background: dm ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                    color: 'var(--color-text)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 14, fontWeight: 600,
                color: 'var(--color-text)', marginBottom: 6,
              }}>
                كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  style={{
                    width: '100%', padding: '12px 44px',
                    border: '1.5px solid var(--color-border)', borderRadius: 10,
                    fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
                    background: dm ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                    color: 'var(--color-text)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: 'var(--color-text-muted)',
                  }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #2d5a8e)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 4px 14px rgba(30, 58, 95, 0.4)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 58, 95, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(30, 58, 95, 0.4)';
              }}
            >
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
          </form>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 24, fontSize: 12,
          color: 'rgba(255,255,255,0.35)',
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}>
          &copy; 2026 مكتب العقارات الدولية &mdash; جميع الحقوق محفوظة
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-30px, 20px) scale(1.05); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, -30px) scale(1.08); }
          }
          @keyframes float3 {
            0%, 100% { transform: translateY(0); opacity: 0.3; }
            50% { transform: translateY(-20px); opacity: 0.6; }
          }
        `
      }} />
    </div>
    </ErrorBoundary>
  );
}
