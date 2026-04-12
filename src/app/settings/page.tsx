'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { Settings, Building, User, Palette, FileText, Save, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { showToast, hasPermission, currentUser } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const [settings, setSettings] = useState(store.getSettings());
  const [activeTab, setActiveTab] = useState('password');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState('');

  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const currentSettings = store.getSettings();
    if (currentSettings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const handleSave = () => {
    store.updateSettings(settings);
    setSavedAt(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    showToast('تم حفظ الإعدادات بنجاح', 'success');
  };

  const handleChangePassword = () => {
    setPassError('');
    if (!currentPassword.trim()) { setPassError('أدخل كلمة المرور الحالية'); return; }
    if (!newPassword.trim()) { setPassError('أدخل كلمة المرور الجديدة'); return; }
    if (newPassword.length < 6) { setPassError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (newPassword !== confirmPassword) { setPassError('كلمة المرور الجديدة غير متطابقة'); return; }

    const userId = store.getCurrentUserId();
    if (!userId) return;

    const result = store.changePassword(userId, currentPassword, newPassword);
    if (result.success) {
      showToast('تم تغيير كلمة المرور بنجاح', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else if (result.reason === 'wrong_password') {
      setPassError('كلمة المرور الحالية غير صحيحة');
    } else {
      setPassError('حدث خطأ');
    }
  };

  const update = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    if (field === 'theme') {
      if (value === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      store.updateSettings({ ...settings, theme: value });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)',
    borderRadius: 8, fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
  };

  const passwordInputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 50px 12px 14px', border: `2px solid ${passError ? 'var(--color-danger)' : dm ? 'var(--color-border)' : '#e5e7eb'}`,
    borderRadius: 12, fontSize: 14, fontFamily: 'inherit', direction: 'ltr', textAlign: 'right', outline: 'none',
  };

  const tabs = [
    { id: 'password', label: 'تغيير كلمة المرور', icon: <Lock size={18} /> },
    ...(hasPermission('settings_manage') ? [
      { id: 'office', label: 'بيانات المؤسسة', icon: <Building size={18} /> },
      { id: 'user', label: 'بيانات المستخدم', icon: <User size={18} /> },
      { id: 'report', label: 'إعدادات التقارير', icon: <FileText size={18} /> },
      { id: 'appearance', label: 'المظهر', icon: <Palette size={18} /> },
    ] : []),
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>الإعدادات</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>إدارة إعدادات النظام</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                borderRadius: 10, border: 'none', fontFamily: 'inherit',
                background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'right',
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          {/* Office Settings */}
          {activeTab === 'office' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building size={22} color="var(--color-primary)" />
                بيانات المؤسسة
              </h2>
              <div style={{ display: 'grid', gap: 16 }}>
                {[
                  { key: 'officeName', label: 'اسم المكتب (عربي)' },
                  { key: 'officeNameEn', label: 'اسم المكتب (إنجليزي)' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input value={(settings as any)[f.key]} onChange={(e) => update(f.key, e.target.value)} style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Settings */}
          {activeTab === 'user' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={22} color="var(--color-primary)" />
                بيانات المستخدم
              </h2>
              <div style={{ display: 'grid', gap: 16 }}>
                {[
                  { key: 'userName', label: 'الاسم الكامل' },
                  { key: 'userRole', label: 'المنصب' },
                  { key: 'userEmail', label: 'البريد الإلكتروني' },
                  { key: 'userPhone', label: 'رقم الهاتف' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input value={(settings as any)[f.key]} onChange={(e) => update(f.key, e.target.value)} style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change Password */}
          {activeTab === 'password' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={22} color="var(--color-primary)" />
                تغيير كلمة المرور
              </h2>
              <p style={{ fontSize: 13, color: dm ? 'var(--color-text-secondary)' : '#64748b', margin: '0 0 24px' }}>
                قم بتغيير كلمة المرور الخاصة بحسابك
              </p>

              {currentUser && (
                <div style={{
                  background: dm ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #1e3a5f, #0f172a)',
                  borderRadius: 12, padding: 16, color: 'white', display: 'flex',
                  alignItems: 'center', gap: 12, marginBottom: 24
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700
                  }}>
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{currentUser.fullName}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.7, fontFamily: 'monospace', direction: 'ltr' }}>
                      {currentUser.username}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: dm ? 'var(--color-text)' : '#374151', marginBottom: 6, display: 'block' }}>
                    كلمة المرور الحالية
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور الحالية"
                      style={passwordInputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      style={{
                        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: dm ? 'var(--color-text-muted)' : '#9ca3af', padding: 4
                      }}
                    >
                      {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: dm ? 'var(--color-text)' : '#374151', marginBottom: 6, display: 'block' }}>
                    كلمة المرور الجديدة
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور الجديدة"
                      style={passwordInputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{
                        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: dm ? 'var(--color-text-muted)' : '#9ca3af', padding: 4
                      }}
                    >
                      {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      {[
                        { check: newPassword.length >= 6, label: '6 أحرف على الأقل' },
                        { check: /[A-Z]/.test(newPassword), label: 'حرف كبير' },
                        { check: /[0-9]/.test(newPassword), label: 'رقم' },
                      ].map((rule, i) => (
                        <span key={i} style={{
                          fontSize: 11, fontWeight: 600,
                          color: rule.check ? '#22c55e' : dm ? 'var(--color-text-muted)' : '#94a3b8',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          {rule.check ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {rule.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: dm ? 'var(--color-text)' : '#374151', marginBottom: 6, display: 'block' }}>
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد كتابة كلمة المرور الجديدة"
                      style={{
                        ...passwordInputStyle,
                        borderColor: confirmPassword && confirmPassword !== newPassword ? '#ef4444' : dm ? 'var(--color-border)' : '#e5e7eb'
                      }}
                    />
                    {confirmPassword && confirmPassword === newPassword && (
                      <CheckCircle2 size={18} style={{
                        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#22c55e'
                      }} />
                    )}
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={14} /> كلمة المرور غير متطابقة
                    </span>
                  )}
                </div>

                {passError && (
                  <div style={{
                    background: dm ? 'var(--color-danger-bg)' : '#fee2e2', border: dm ? '1px solid #7f1d1d' : '1px solid #fca5a5', borderRadius: 10,
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <AlertCircle size={16} color="#ef4444" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: dm ? '#f87171' : '#b91c1c' }}>{passError}</span>
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Lock size={18} /> تغيير كلمة المرور
                </button>
              </div>
            </div>
          )}

          {/* Report Settings */}
          {activeTab === 'report' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={22} color="var(--color-primary)" />
                إعدادات التقارير
              </h2>
              <div style={{ display: 'grid', gap: 16 }}>
                {[
                  { key: 'reportPrefix', label: 'بادئة رقم التقرير' },
                  { key: 'defaultCurrency', label: 'العملة الافتراضية' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input value={(settings as any)[f.key]} onChange={(e) => update(f.key, e.target.value)} style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette size={22} color="var(--color-primary)" />
                المظهر
              </h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 10 }}>سمة النظام</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { value: 'light', label: 'فاتح', bg: '#ffffff', border: '#e2e8f0' },
                      { value: 'dark', label: 'داكن', bg: '#1e293b', border: '#475569' },
                    ].map(theme => (
                      <button key={theme.value} onClick={() => update('theme', theme.value)}
                        style={{
                          width: 120, height: 80, borderRadius: 12,
                          border: settings.theme === theme.value ? '3px solid var(--color-primary)' : `2px solid ${theme.border}`,
                          background: theme.bg, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'inherit', color: theme.value === 'dark' ? 'white' : 'inherit',
                          fontWeight: 600, fontSize: 14,
                        }}>
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'password' && hasPermission('settings_manage') && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={handleSave} className="btn btn-primary">
                <Save size={18} /> حفظ الإعدادات
              </button>
              {savedAt && (
                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} />
                  آخر حفظ: {savedAt}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
