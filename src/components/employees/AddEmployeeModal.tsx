'use client';

import React, { useState, useEffect } from 'react';
import {
  X, User, Shield, CheckCircle2, ChevronRight, ChevronLeft,
  AlertCircle, Users, Building2, Copy, Eye, EyeOff, Lock
} from 'lucide-react';
import type { EmployeeRole, Permission } from '@/types';
import { EMPLOYEE_ROLES, PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const DEPARTMENTS = ['الإدارة العامة', 'قسم التثمين', 'قسم المراجعة', 'قسم إدخال البيانات', 'المبيعات'];

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const nums = '23456789';
  const specials = '@#$%&*';
  const all = upper + lower + nums + specials;
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += nums[Math.floor(Math.random() * nums.length)];
  password += specials[Math.floor(Math.random() * specials.length)];
  for (let i = 0; i < 4; i++) password += all[Math.floor(Math.random() * all.length)];
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (employee: {
    fullName: string;
    username: string;
    email: string;
    phone: string;
    role: EmployeeRole;
    department: string;
    notes: string;
    permissions: string[];
    tempPassword: string;
  }) => void;
}

const STEPS = [
  { id: 1, title: 'بيانات الموظف', icon: User },
  { id: 2, title: 'الصلاحيات', icon: Shield },
];

export default function AddEmployeeModal({ isOpen, onClose, onAdd }: AddEmployeeModalProps) {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'appraiser' as EmployeeRole,
    department: '',
    notes: '',
    permissions: ROLE_DEFAULT_PERMISSIONS.appraiser,
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      setGeneratedPassword('');
      setShowPassword(false);
      setCopied(false);
      setForm({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        role: 'appraiser',
        department: '',
        notes: '',
        permissions: ROLE_DEFAULT_PERMISSIONS.appraiser,
      });
    }
  }, [isOpen]);

  const dm = isDark;
  const txt = dm ? 'var(--color-text)' : '#374151';
  const txtSec = dm ? 'var(--color-text-secondary)' : '#64748b';
  const txtMut = dm ? 'var(--color-text-muted)' : '#94a3b8';
  const border = dm ? 'var(--color-border)' : '#e5e7eb';
  const surface = dm ? 'var(--color-surface)' : 'white';
  const surfaceAlt = dm ? 'var(--color-surface-alt)' : '#f8fafc';

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.fullName.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';
      if (!form.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'بريد إلكتروني غير صحيح';
      if (!form.username.trim()) newErrors.username = 'اسم المستخدم مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    const tempPassword = generateTempPassword();
    setGeneratedPassword(tempPassword);
    onAdd({ ...form, tempPassword });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = (role: EmployeeRole) => {
    setForm(prev => ({ ...prev, role, permissions: ROLE_DEFAULT_PERMISSIONS[role] }));
  };

  const togglePermission = (permId: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const permCategories = PERMISSIONS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const roleInfo = EMPLOYEE_ROLES.find(r => r.value === form.role);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 200, padding: 20, direction: 'rtl'
    }}>
      <div style={{
        background: surface, borderRadius: 24, width: '100%', maxWidth: 720,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: dm ? '1px solid var(--color-border)' : 'none',
        animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Success State - Show Generated Password */}
        {generatedPassword ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle2 size={40} color="white" />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: dm ? 'var(--color-primary)' : '#1e3a5f' }}>
              تمت إضافة الموظف بنجاح
            </h2>
            <p style={{ fontSize: 14, color: txtSec, margin: '0 0 24px' }}>
              {form.fullName} — {roleInfo?.label}
            </p>

            <div style={{
              background: dm ? '#451a03' : '#fffbeb', border: `2px solid ${dm ? '#78350f' : '#fde68a'}`, borderRadius: 16,
              padding: 20, marginBottom: 24
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, justifyContent: 'center'
              }}>
                <AlertCircle size={18} color={dm ? '#fbbf24' : '#b45309'} />
                <span style={{ fontSize: 14, fontWeight: 700, color: dm ? '#fbbf24' : '#92400e' }}>
                  كلمة المرور المؤقتة
                </span>
              </div>
              <p style={{ fontSize: 12, color: dm ? '#fcd34d' : '#92400e', margin: '0 0 14px' }}>
                  انسخ هذه الكلمة المرور وأرسلها للموظف. يجب عليه تغييرها عند أول تسجيل دخول.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: surface, borderRadius: 12, padding: '14px 16px',
                border: `2px solid ${border}`
              }}>
                <div style={{
                  flex: 1, fontSize: 22, fontWeight: 800, fontFamily: 'monospace',
                  direction: 'ltr', letterSpacing: 2, color: dm ? 'var(--color-primary)' : '#1e3a5f'
                }}>
                  {showPassword ? generatedPassword : '•'.repeat(generatedPassword.length)}
                </div>
                <button onClick={() => setShowPassword(!showPassword)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: txtSec, padding: 6
                }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button onClick={handleCopyPassword} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: copied ? '#22c55e' : 'var(--color-primary)', color: 'white',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit'
                }}>
                  <Copy size={16} />
                  {copied ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
              marginBottom: 20, fontSize: 13, color: txtSec
            }}>
              <span>اسم المستخدم:</span>
              <span style={{
                fontFamily: 'monospace', fontWeight: 700, background: surfaceAlt,
                padding: '4px 12px', borderRadius: 8, direction: 'ltr', color: dm ? 'var(--color-primary)' : '#1e3a5f'
              }}>{form.username}</span>
            </div>

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
              تم
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: dm ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
              color: 'white'
            }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={24} />
                  إضافة موظف جديد
                </h2>
                <p style={{ fontSize: 13, opacity: 0.8, margin: '4px 0 0' }}>أدخل بيانات الموظف الجديد</p>
              </div>
              <button onClick={onClose} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12,
                padding: 10, cursor: 'pointer', color: 'white', transition: 'all 0.2s'
              }}>
                <X size={20} />
              </button>
            </div>

            {/* Progress Steps */}
            <div style={{ padding: '20px 28px', background: surfaceAlt, borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '25%', right: '25%',
                  height: 3, background: dm ? 'var(--color-border)' : '#e2e8f0', transform: 'translateY(-50%)', borderRadius: 2
                }} />
                <div style={{
                  position: 'absolute', top: '50%', right: '25%', width: currentStep === 2 ? '100%' : '0%',
                  height: 3, background: dm ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : 'linear-gradient(90deg, #1e3a5f, #3b82f6)',
                  transform: 'translateY(-50%)', borderRadius: 2, transition: 'width 0.4s ease'
                }} />

                {STEPS.map((step) => {
                  const isActive = currentStep >= step.id;
                  const isCurrent = currentStep === step.id;
                  return (
                    <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: isActive ? (dm ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'linear-gradient(135deg, #1e3a5f, #3b82f6)') : surface,
                        border: `2px solid ${isActive ? (dm ? '#60a5fa' : '#3b82f6') : border}`,
                        color: isActive ? '#fff' : txtMut,
                        transition: 'all 0.3s ease',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'
                      }}>
                        <step.icon size={20} />
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: isActive ? (dm ? '#60a5fa' : '#1e3a5f') : txtMut,
                        whiteSpace: 'nowrap'
                      }}>{step.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
              {/* Step 1: Employee Data */}
              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: txt, marginBottom: 6, display: 'block' }}>
                        الاسم الكامل *
                      </label>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="أدخل الاسم الكامل"
                        style={{
                          width: '100%', padding: '12px 16px', border: `2px solid ${errors.fullName ? '#ef4444' : border}`,
                          borderRadius: 12, fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
                          transition: 'all 0.2s', outline: 'none', background: surface, color: 'var(--color-text)'
                        }}
                      />
                      {errors.fullName && (
                        <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertCircle size={14} /> {errors.fullName}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: txt, marginBottom: 6, display: 'block' }}>
                        البريد الإلكتروني *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@domain.com"
                        style={{
                          width: '100%', padding: '12px 16px', border: `2px solid ${errors.email ? '#ef4444' : border}`,
                          borderRadius: 12, fontSize: 14, fontFamily: 'inherit', direction: 'ltr', textAlign: 'right',
                          transition: 'all 0.2s', outline: 'none', background: surface, color: 'var(--color-text)'
                        }}
                      />
                      {errors.email && (
                        <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertCircle size={14} /> {errors.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: txt, marginBottom: 6, display: 'block' }}>
                      اسم المستخدم *
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="أدخل اسم المستخدم"
                      style={{
                        width: '100%', padding: '12px 16px', border: `2px solid ${errors.username ? '#ef4444' : border}`,
                        borderRadius: 12, fontSize: 14, fontFamily: 'inherit', direction: 'ltr', textAlign: 'right',
                        outline: 'none', background: surface, color: 'var(--color-text)'
                      }}
                    />
                    {errors.username && (
                      <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={14} /> {errors.username}
                      </span>
                    )}
                  </div>

                  <div style={{
                    background: dm ? '#1e3a5f' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    <Lock size={18} color={dm ? '#60a5fa' : '#1e3a5f'} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: dm ? '#93c5fd' : '#1e40af' }}>
                      سيتم توليد كلمة مرور مؤقتة تلقائياً بعد الإضافة
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: txt, marginBottom: 6, display: 'block' }}>
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+968 XXXX XXXX"
                      style={{
                        width: '100%', padding: '12px 16px', border: `2px solid ${border}`,
                        borderRadius: 12, fontSize: 14, fontFamily: 'inherit', direction: 'ltr', textAlign: 'right',
                        outline: 'none', background: surface, color: 'var(--color-text)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: txt, marginBottom: 6, display: 'block' }}>
                      القسم
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: txtMut }} />
                      <select
                        value={form.department}
                        onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                        style={{
                          width: '100%', padding: '12px 16px 12px 40px', border: `2px solid ${border}`,
                          borderRadius: 12, fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
                          appearance: 'none', background: surface, outline: 'none', color: 'var(--color-text)'
                        }}
                      >
                        <option value="">اختر القسم</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: txt, marginBottom: 6, display: 'block' }}>
                      الدور الوظيفي
                    </label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {EMPLOYEE_ROLES.map(role => (
                        <button
                          key={role.value}
                          onClick={() => handleRoleChange(role.value)}
                          style={{
                            padding: '10px 18px', borderRadius: 12, border: `2px solid ${form.role === role.value ? role.color : border}`,
                            background: form.role === role.value ? `${role.color}15` : surface,
                            color: form.role === role.value ? role.color : txtSec,
                            fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                            fontFamily: 'inherit'
                          }}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: txt, marginBottom: 6, display: 'block' }}>
                      ملاحظات
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ملاحظات إضافية..."
                      style={{
                        width: '100%', padding: '12px 16px', border: `2px solid ${border}`,
                        borderRadius: 12, fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
                        minHeight: 80, resize: 'vertical', outline: 'none', background: surface, color: 'var(--color-text)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Permissions */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    background: dm ? '#14532d' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${roleInfo?.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: roleInfo?.color
                      }}>
                        <Shield size={22} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dm ? 'var(--color-text)' : '#1e3a5f' }}>صلاحيات {roleInfo?.label}</p>
                        <p style={{ margin: 0, fontSize: 12, color: txtSec }}>{form.permissions.length} من {PERMISSIONS.length} صلاحية</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {EMPLOYEE_ROLES.map(r => (
                        <button
                          key={r.value}
                          onClick={() => handleRoleChange(r.value)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                            background: form.role === r.value ? `${r.color}15` : surface,
                            color: form.role === r.value ? r.color : txtSec,
                            fontWeight: 600, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                            fontFamily: 'inherit'
                          }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 16 }}>
                    {Object.entries(permCategories).map(([category, perms]) => (
                      <div key={category} style={{
                        border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '12px 16px', background: surfaceAlt, borderBottom: `1px solid ${border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: dm ? 'var(--color-text)' : '#1e3a5f' }}>{category}</span>
                          <span style={{ fontSize: 11, color: txtSec }}>
                            {perms.filter(p => form.permissions.includes(p.id)).length}/{perms.length}
                          </span>
                        </div>
                        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {perms.map(perm => {
                            const isGranted = form.permissions.includes(perm.id);
                            return (
                              <button
                                key={perm.id}
                                onClick={() => togglePermission(perm.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                                  background: isGranted ? (dm ? '#14532d' : '#f0fdf4') : surface,
                                  border: `2px solid ${isGranted ? (dm ? '#166534' : '#86efac') : border}`,
                                  textAlign: 'right', fontFamily: 'inherit'
                                }}
                              >
                                <div style={{
                                  width: 20, height: 20, borderRadius: 6,
                                  background: isGranted ? '#22c55e' : border,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0, transition: 'all 0.2s'
                                }}>
                                  {isGranted && <CheckCircle2 size={14} color="white" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: isGranted ? (dm ? '#34d399' : '#166534') : txt }}>
                                    {perm.label}
                                  </div>
                                  <div style={{ fontSize: 11, color: txtMut }}>{perm.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 28px', borderTop: '1px solid var(--color-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: surfaceAlt
            }}>
              <button
                onClick={currentStep === 1 ? onClose : handlePrev}
                className="btn btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {currentStep === 1 ? (
                  <>إلغاء</>
                ) : (
                  <><ChevronRight size={18} /> السابق</>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: txtSec }}>
                  الخطوة {currentStep} من {STEPS.length}
                </span>
                {currentStep < 2 ? (
                  <button onClick={handleNext} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    التالي <ChevronLeft size={18} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={18} /> إضافة الموظف
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }} />
    </div>
  );
}
