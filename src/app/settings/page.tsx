'use client';

import React, { useState, useEffect, useRef } from 'react';
import { store } from '@/lib/store';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import {
  Settings, Building, User, Palette, Save, Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Upload, Download, Trash2, TrendingUp, Database, FileJson
} from 'lucide-react';


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


  /* ================= Market Prices JSON ================= */
  const [mpFile, setMpFile] = useState<File | null>(null);
  const [mpError, setMpError] = useState('');
  const [mpUploading, setMpUploading] = useState(false);
  const [mpSuccess, setMpSuccess] = useState(false);
  const mpFileInputRef = useRef<HTMLInputElement>(null);



  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleMpFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setMpError('');
    setMpSuccess(false);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMpError('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
      return;
    }
    if (!file.name.endsWith('.json')) {
      setMpError('يجب أن يكون الملف بصيغة JSON');
      return;
    }
    setMpFile(file);
  };

  const handleMpUpload = () => {
    if (!mpFile) { setMpError('يرجى اختيار ملف'); return; }
    setMpUploading(true);
    setMpError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.governorates || (typeof parsed.governorates !== 'object')) {
          setMpError('هيكل JSON غير صحيح: يجب أن يحتوي على حقل governorates');
          setMpUploading(false);
          return;
        }
        const govCount = Array.isArray(parsed.governorates) ? parsed.governorates.length : Object.keys(parsed.governorates).length;
        if (govCount === 0) {
          setMpError('ملف JSON لا يحتوي على أي محافظات');
          setMpUploading(false);
          return;
        }
        localStorage.setItem('ireo_market_prices', JSON.stringify(parsed));
        setMpUploading(false);
        setMpSuccess(true);
        setMpFile(null);
        if (mpFileInputRef.current) mpFileInputRef.current.value = '';
        showToast(`تم تحديث أسعار السوق بنجاح (${govCount} محافظة)`, 'success');
      } catch {
        setMpError('خطأ في تحليل ملف JSON. تأكد من أن الملف بصيغة JSON صحيحة');
        setMpUploading(false);
      }
    };
    reader.onerror = () => {
      setMpError('خطأ في قراءة الملف');
      setMpUploading(false);
    };
    reader.readAsText(mpFile);
  };

  const handleMpClear = () => {
    localStorage.removeItem('ireo_market_prices');
    setMpSuccess(true);
    setTimeout(() => setMpSuccess(false), 3000);
    showToast('تم حذف بيانات أسعار السوق بنجاح', 'success');
  };


  useEffect(() => {
    const userId = store.getCurrentUserId();
    let theme = settings.theme;
    if (userId && typeof window !== 'undefined') {
      const userTheme = localStorage.getItem('ireo_theme_' + userId);
      if (userTheme) theme = userTheme;
    }
    if (theme === 'dark' || theme === 'sepia') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  const handleSave = () => {
    // Exclude user-specific theme from global settings save
    const { theme, ...globalSettings } = settings;
    store.updateSettings(globalSettings as any);
    setSavedAt(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    showToast('تم حفظ الإعدادات بنجاح', 'success');
  };

  const handleChangePassword = async () => {
    setPassError('');
    if (!currentPassword.trim()) { setPassError('أدخل كلمة المرور الحالية'); return; }
    if (!newPassword.trim()) { setPassError('أدخل كلمة المرور الجديدة'); return; }
    if (newPassword.length < 6) { setPassError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (newPassword !== confirmPassword) { setPassError('كلمة المرور الجديدة غير متطابقة'); return; }

    const userId = store.getCurrentUserId();
    if (!userId) return;

    const result = await store.changePassword(userId, currentPassword, newPassword);
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
      if (value === 'dark' || value === 'sepia') {
        document.documentElement.setAttribute('data-theme', value);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      const userId = store.getCurrentUserId();
      if (userId && typeof window !== 'undefined') {
        localStorage.setItem('ireo_theme_' + userId, value);
      }
    }
  };



  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)',
    borderRadius: 24, fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
  };

  const passwordInputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 50px 12px 14px', border: `2px solid ${passError ? 'var(--color-danger)' : dm ? 'var(--color-border)' : '#e5e7eb'}`,
    borderRadius: 24, fontSize: 14, fontFamily: 'inherit', direction: 'ltr', textAlign: 'right', outline: 'none',
  };

  const tabs = [
    { id: 'password', label: 'تغيير كلمة المرور', icon: <Lock size={18} /> },
    { id: 'appearance', label: 'المظهر', icon: <Palette size={18} /> },
    ...(hasPermission('settings_manage') ? [
      { id: 'office', label: 'بيانات المؤسسة', icon: <Building size={18} /> },
      { id: 'user', label: 'بيانات المستخدم', icon: <User size={18} /> },
      { id: 'market_prices', label: 'أسعار السوق', icon: <TrendingUp size={18} /> },
    ] : []),
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px' }}>الإعدادات</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>إدارة إعدادات النظام</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {/* Tabs - horizontal on mobile */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, flexDirection: 'row' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderRadius: 24, border: 'none', fontFamily: 'inherit',
                background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'right',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
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
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
                قم بتغيير كلمة المرور الخاصة بحسابك
              </p>

              {currentUser && (
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
                  borderRadius: 24, padding: 16, color: 'white', display: 'flex',
                  alignItems: 'center', gap: 20, marginBottom: 24
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
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6, display: 'block' }}>
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
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6, display: 'block' }}>
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
                    <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {[
                        { check: newPassword.length >= 6, label: '6 أحرف على الأقل' },
                        { check: /[A-Z]/.test(newPassword), label: 'حرف كبير' },
                        { check: /[0-9]/.test(newPassword), label: 'رقم' },
                      ].map((rule, i) => (
                        <span key={i} style={{
                          fontSize: 11, fontWeight: 600,
                          color: rule.check ? '#22c55e' : 'var(--color-text-muted)',
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
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6, display: 'block' }}>
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
                    background: 'var(--color-danger-bg)', border: dm ? '1px solid #7f1d1d' : '1px solid #fca5a5', borderRadius: 24,
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <AlertCircle size={16} color="#ef4444" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-danger)' }}>{passError}</span>
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
                      { value: 'light', label: 'فاتح', bg: '#ffffff', border: '#e2e8f0', text: '#0f172a' },
                      { value: 'dark', label: 'داكن', bg: '#0f1522', border: '#1a2335', text: '#e2e6ef' },
                      { value: 'sepia', label: 'دافئ', bg: '#f4ecd8', border: '#d9cdb5', text: '#433422' },
                    ].map(theme => (
                      <button key={theme.value} onClick={() => update('theme', theme.value)}
                        style={{
                          flex: 1, minWidth: 90, maxWidth: 140, height: 70, borderRadius: 24,
                          border: settings.theme === theme.value ? '3px solid var(--color-primary)' : `2px solid ${theme.border}`,
                          background: theme.bg, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'inherit', color: theme.text,
                          fontWeight: 600, fontSize: 14,
                        }}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 10 }}>
                    وضع القراءة الدافئ مريح للعين عند قراءة التقارير الطويلة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Market Prices Settings */}
          {activeTab === 'market_prices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={22} color="var(--color-primary)" />
                  أسعار السوق
                </h2>
              </div>

              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 24px', lineHeight: 1.7 }}>
                قم برفع ملف JSON لتحديث بيانات أسعار السوق بشكل كامل. سيتم استبدال جميع البيانات الحالية بالبيانات الجديدة.
              </p>

              {/* Current Status */}
              <div style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: 20,
                padding: '20px 24px',
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'linear-gradient(135deg, #1e3a5f, #0f4c75)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Database size={20} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>حالة البيانات الحالية</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {(() => {
                        if (typeof window === 'undefined') return 'جاري التحميل...';
                        const saved = localStorage.getItem('ireo_market_prices');
                        if (saved) {
                          try {
                            const data = JSON.parse(saved);
                            const govCount = Object.keys(data.governorates || {}).length;
                            return `بيانات مخصصة — ${govCount} محافظة`;
                          } catch { return 'بيانات مخصصة'; }
                        }
                        return 'بيانات افتراضية (لم يتم رفع ملف)';
                      })()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      const saved = localStorage.getItem('ireo_market_prices');
                      if (saved) {
                        try {
                          const blob = new Blob([saved], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'market-prices-backup.json';
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch { /* ignore */ }
                      } else {
                        showToast('لا توجد بيانات مخصصة للتحميل', 'error');
                      }
                    }}
                    style={{
                      padding: '8px 16px', borderRadius: 14,
                      border: '1px solid var(--color-border)',
                      background: 'transparent', color: 'var(--color-text-secondary)',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Download size={14} />
                    تصدير البيانات الحالية
                  </button>
                  <button
                    onClick={handleMpClear}
                    style={{
                      padding: '8px 16px', borderRadius: 14,
                      border: '1px solid var(--color-danger-bg)',
                      background: 'transparent', color: 'var(--color-danger)',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Trash2 size={14} />
                    استعادة الافتراضي
                  </button>
                </div>
              </div>

              {/* JSON Structure Guide */}
              <div style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: 20,
                padding: '20px 24px',
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <FileJson size={20} color="var(--color-primary)" />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>هيكل الملف المطلوب</div>
                </div>
                <pre style={{
                  background: dm ? '#0f172a' : '#1e293b',
                  color: '#e2e8f0',
                  borderRadius: 14,
                  padding: '16px 20px',
                  fontSize: 12,
                  direction: 'ltr',
                  textAlign: 'left',
                  overflow: 'auto',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
{`{
  "governorates": {
    "gov_key": {
      "name_ar": "اسم المحافظة",
      "name_en": "Governorate Name",
      "regions": {
        "region_key": {
          "name_ar": "اسم الولاية",
          "name_en": "Region Name",
          "areas": [
            {
              "id": 1,
              "name": "اسم المنطقة",
              "residential": { "high": 200, "low": 100 },
              "residential_commercial": { "high": 300, "low": 150 },
              "industrial": { "high": 150, "low": 80 },
              "agricultural": { "high": 50, "low": 20 },
              "tourist": { "high": null, "low": null }
            }
          ]
        }
      },
      "areas": [ ... ]
    }
  },
  "statistics": { ... },
  "price_summary": { ... }
}`}
                </pre>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 10, lineHeight: 1.6 }}>
                  * governorates هو الحقل الوحيد المطلوب. الحقول الأخرى (statistics, price_summary) اختيارية.
                  <br />
                  * يمكن أن يحتوي القسم على regions (مناطق) أو areas (مناطق مباشرة) أو كلاهما.
                </p>
              </div>

              {/* Upload Area */}
              <div style={{
                border: mpFile ? '2px dashed var(--color-primary)' : '2px dashed var(--color-border)',
                borderRadius: 20,
                padding: '32px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: mpFile ? 'rgba(30, 58, 138, 0.06)' : 'var(--color-surface-alt)',
                transition: 'all 0.2s ease',
                marginBottom: 16,
              }}
                onClick={() => mpFileInputRef.current?.click()}
              >
                <Upload size={36} color={mpFile ? 'var(--color-primary)' : 'var(--color-text-muted)'} style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                  {mpFile ? mpFile.name : 'اضغط لاختيار ملف JSON'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {mpFile ? `${(mpFile.size / 1024).toFixed(1)} KB` : 'صيغة .json — بحد أقصى 10 ميجابايت'}
                </div>
                <input ref={mpFileInputRef} type="file" accept=".json" onChange={handleMpFileSelect} style={{ display: 'none' }} />
              </div>

              {/* Error */}
              {mpError && (
                <div style={{
                  background: 'var(--color-danger-bg)',
                  border: dm ? '1px solid #7f1d1d' : '1px solid #fca5a5',
                  borderRadius: 16,
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 16,
                }}>
                  <AlertCircle size={16} color="#ef4444" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-danger)' }}>{mpError}</span>
                </div>
              )}

              {/* Success */}
              {mpSuccess && (
                <div style={{
                  background: 'var(--color-success-bg)',
                  border: '1px solid #86efac',
                  borderRadius: 16,
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 16,
                }}>
                  <CheckCircle2 size={16} color="#22c55e" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>تم تحديث بيانات أسعار السوق بنجاح</span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                {mpFile && (
                  <button
                    onClick={() => { setMpFile(null); setMpError(''); if (mpFileInputRef.current) mpFileInputRef.current.value = ''; }}
                    style={{
                      padding: '10px 20px', borderRadius: 14,
                      border: '1px solid var(--color-border)',
                      background: 'transparent', color: 'var(--color-text-muted)',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                    }}
                  >
                    إلغاء
                  </button>
                )}
                <button
                  onClick={handleMpUpload}
                  disabled={!mpFile || mpUploading}
                  style={{
                    padding: '10px 24px', borderRadius: 14,
                    border: 'none',
                    background: (!mpFile || mpUploading) ? 'var(--color-border)' : 'var(--color-primary)',
                    color: (!mpFile || mpUploading) ? 'var(--color-text-muted)' : 'white',
                    cursor: (!mpFile || mpUploading) ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {mpUploading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                      جاري التحديث...
                    </span>
                  ) : (
                    <><Upload size={16} /> تحديث أسعار السوق</>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'password' && hasPermission('settings_manage') && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
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