'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, User, Shield, CheckCircle2, ChevronRight, ChevronLeft,
  AlertCircle, Users, Building2, Eye, EyeOff, Mail, Phone, Lock,
  FileText, Sparkles, Briefcase, UserCheck, Crown, EyeIcon, PenLine,
  Upload, Trash2
} from 'lucide-react';
import type { EmployeeRole } from '@/types';
import { EMPLOYEE_ROLES, PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const DEPARTMENTS = ['الإدارة العامة', 'قسم التثمين', 'قسم المراجعة', 'قسم إدخال البيانات', 'المبيعات'];

function getPasswordStrength(password: string): { label: string; color: string; bg: string; score: number } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { label: 'ضعيفة', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', score };
  if (score <= 4) return { label: 'متوسطة', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', score };
  return { label: 'قوية', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', score };
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('');
}

const AVATAR_COLORS = ['#1e3a5f', '#b45309', '#0891b2', '#7c3aed', '#15803d', '#dc2626'];

const ROLE_ICONS: Record<EmployeeRole, React.ReactNode> = {
  admin: <Crown size={20} />,
  appraiser: <PenLine size={20} />,
  reviewer: <EyeIcon size={20} />,
  data_entry: <FileText size={20} />,
  viewer: <Eye size={20} />,
};

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
    password: string;
    avatar: string;
  }) => void;
}

const STEPS = [
  { id: 1, title: 'البيانات الأساسية', subtitle: 'معلومات الموظف الشخصية', icon: User },
  { id: 2, title: 'الدور والصلاحيات', subtitle: 'تحديد الصلاحيات والمسؤوليات', icon: Shield },
];

export default function AddEmployeeModal({ isOpen, onClose, onAdd }: AddEmployeeModalProps) {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(p => ({ ...p, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => setForm(p => ({ ...p, avatar: '' }));

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'appraiser' as EmployeeRole,
    department: '',
    notes: '',
    permissions: ROLE_DEFAULT_PERMISSIONS.appraiser,
    password: '',
    avatar: '',
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      setShowPassword(false);
      setForm({
        fullName: '', username: '', email: '', phone: '',
        role: 'appraiser', department: '', notes: '',
        permissions: ROLE_DEFAULT_PERMISSIONS.appraiser, password: '', avatar: '',
      });
    }
  }, [isOpen]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.fullName.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';
      if (!form.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'بريد إلكتروني غير صحيح';
      if (!form.username.trim()) newErrors.username = 'اسم المستخدم مطلوب';
      if (!form.password) newErrors.password = 'كلمة المرور مطلوبة';
      else if (form.password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 2));
  };
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleSubmit = () => { onAdd({ ...form, password: form.password, avatar: form.avatar }); };

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
  }, {} as Record<string, typeof PERMISSIONS>);

  const roleInfo = EMPLOYEE_ROLES.find(r => r.value === form.role);
  const strength = getPasswordStrength(form.password);
  const avatarColor = AVATAR_COLORS[form.fullName.length % AVATAR_COLORS.length];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.78)',
      backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 200, padding: 24, direction: 'rtl'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 28,
        width: '100%',
        maxWidth: 900,
        maxHeight: '94vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 32px 80px -16px rgba(0, 0, 0, 0.45)',
        border: '1px solid var(--color-border)',
        animation: 'slideInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Top Accent Line */}
        <div style={{ height: 5, background: 'linear-gradient(90deg, var(--color-primary), #3b82f6, #22c55e)' }} />

        {/* Header */}
        <div style={{
          padding: '26px 32px',
          display: 'flex', alignItems: 'center', gap: 18,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #0f4c75 100%)',
          color: 'white', position: 'relative',
        }}>
          <div style={{
            width: 58, height: 58, borderRadius: 18,
            background: 'rgba(255,255,255,0.14)',
            border: '2px solid rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: 'white', flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            {form.fullName ? getInitials(form.fullName) : <Users size={26} />}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserCheck size={22} />
              إضافة موظف جديد
            </h2>
            <p style={{ fontSize: 13, opacity: 0.72, margin: '4px 0 0' }}>
              قم بإدخال بيانات الموظف وتعيين صلاحياته بدقة
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 14,
            padding: 11, cursor: 'pointer', color: 'rgba(255,255,255,0.85)',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div style={{
          padding: '22px 32px',
          background: 'var(--color-surface-alt)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '50%', left: '18%', right: '18%',
              height: 3, background: 'var(--color-border)', transform: 'translateY(-50%)', borderRadius: 2,
            }} />
            <div style={{
              position: 'absolute', top: '50%', right: '18%',
              width: currentStep === 2 ? '64%' : '0%',
              height: 3, background: 'linear-gradient(90deg, var(--color-primary), #3b82f6)',
              transform: 'translateY(-50%)', borderRadius: 2, transition: 'width 0.5s ease',
            }} />
            {STEPS.map((step) => {
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1, flex: 1 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'linear-gradient(135deg, var(--color-primary), #3b82f6)' : 'var(--color-surface)',
                    border: `2.5px solid ${isActive ? '#3b82f6' : 'var(--color-border)'}`,
                    color: isActive ? '#fff' : 'var(--color-text-muted)',
                    transition: 'all 0.35s ease',
                    boxShadow: isCurrent ? '0 0 0 6px rgba(59,130,246,0.12)' : 'none',
                  }}>
                    <step.icon size={21} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500, marginTop: 2 }}>
                      {step.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
          {currentStep === 1 && (
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {/* Left: Form */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Section: Personal Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>البيانات الشخصية</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>المعلومات الأساسية للموظف</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px 20px' }}>
                    <FormField label="الاسم الكامل" required error={errors.fullName}>
                      <div style={{ position: 'relative' }}>
                        <User size={17} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                        <input type="text" value={form.fullName}
                          onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                          placeholder="مثال: أحمد بن محمد"
                          className="form-input" style={{ paddingRight: 42, fontSize: 14 }}
                        />
                      </div>
                    </FormField>

                    <FormField label="صورة الموظف">
                      <div>
                        {form.avatar ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={form.avatar} alt="صورة الموظف" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', border: '2px solid var(--color-border)' }} />
                            <button onClick={removeAvatar} style={{
                              position: 'absolute', top: -6, left: -6,
                              width: 24, height: 24, borderRadius: '50%',
                              background: '#ef4444', color: 'white', border: 'none',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                            }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => avatarInputRef.current?.click()} style={{
                            width: 64, height: 64, borderRadius: 16,
                            border: '2px dashed var(--color-border)',
                            background: 'var(--color-surface-alt)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 3, cursor: 'pointer', color: 'var(--color-text-muted)',
                            transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                          >
                            <Upload size={18} />
                            <span style={{ fontSize: 9, fontWeight: 600 }}>رفع</span>
                          </button>
                        )}
                        <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                        <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>بحد أقصى 2 ميجابايت</p>
                      </div>
                    </FormField>

                    <FormField label="البريد الإلكتروني" required error={errors.email}>
                      <div style={{ position: 'relative' }}>
                        <Mail size={17} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                        <input type="email" value={form.email}
                          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="example@company.com"
                          className="form-input" style={{ paddingRight: 42, direction: 'ltr', textAlign: 'right', fontSize: 14 }}
                        />
                      </div>
                    </FormField>

                    <FormField label="اسم المستخدم" required error={errors.username}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', fontSize: 15, fontWeight: 800 }}>@</div>
                        <input type="text" value={form.username}
                          onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                          placeholder="اسم المستخدم للدخول"
                          className="form-input" style={{ paddingRight: 38, direction: 'ltr', textAlign: 'right', fontSize: 14 }}
                        />
                      </div>
                    </FormField>

                    <FormField label="رقم الهاتف">
                      <div style={{ position: 'relative' }}>
                        <Phone size={17} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                        <input type="tel" value={form.phone}
                          onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+968 XXXX XXXX"
                          className="form-input" style={{ paddingRight: 42, direction: 'ltr', textAlign: 'right', fontSize: 14 }}
                        />
                      </div>
                    </FormField>
                  </div>
                </div>

                {/* Section: Security */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                      <Lock size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>أمان الحساب</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>كلمة مرور قوية لحماية الحساب</div>
                    </div>
                  </div>

                  <FormField label="كلمة المرور" required error={errors.password}>
                    <div style={{ position: 'relative' }}>
                      <Lock size={17} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                      <input type={showPassword ? 'text' : 'password'} value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="أدخل كلمة مرور قوية"
                        className="form-input" style={{ paddingRight: 42, paddingLeft: 44, direction: 'ltr', textAlign: 'right', fontSize: 14 }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 5, display: 'flex' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormField>

                  {form.password && (
                    <div style={{ marginTop: 14, background: strength.bg, borderRadius: 14, padding: '14px 18px', border: `1px solid ${strength.color}30` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Sparkles size={15} color={strength.color} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: strength.color }}>
                            قوة كلمة المرور: {strength.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} style={{
                              width: 22, height: 6, borderRadius: 3,
                              background: i <= strength.score ? strength.color : 'var(--color-border)',
                              transition: 'background 0.3s ease',
                            }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                        {[
                          { ok: form.password.length >= 6, text: '6 أحرف على الأقل' },
                          { ok: form.password.length >= 8, text: '8 أحرف' },
                          { ok: /[A-Z]/.test(form.password), text: 'حرف كبير' },
                          { ok: /[a-z]/.test(form.password), text: 'حرف صغير' },
                          { ok: /[0-9]/.test(form.password), text: 'رقم' },
                          { ok: /[^A-Za-z0-9]/.test(form.password), text: 'رمز خاص' },
                        ].map((item, idx) => (
                          <span key={idx} style={{ color: item.ok ? strength.color : 'var(--color-text-muted)' }}>
                            {item.ok ? '✓' : '○'} {item.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Work Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>بيانات العمل</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>القسم والملاحظات</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px 20px' }}>
                    <FormField label="القسم">
                      <div style={{ position: 'relative' }}>
                        <Building2 size={17} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                        <select value={form.department}
                          onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                          className="form-input" style={{ paddingRight: 42, appearance: 'none', fontSize: 14 }}
                        >
                          <option value="">اختر القسم</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </FormField>

                    <FormField label="ملاحظات">
                      <div style={{ position: 'relative' }}>
                        <FileText size={17} style={{ position: 'absolute', right: 14, top: 14, color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                        <textarea value={form.notes}
                          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                          placeholder="ملاحظات إضافية..."
                          rows={2}
                          className="form-input" style={{ paddingRight: 42, minHeight: 60, resize: 'vertical', fontSize: 14 }}
                        />
                      </div>
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Right: Preview Card */}
              <div className='employee-preview-card' style={{ width: 240, flexShrink: 0, minWidth: 240, flex: '1 1 240px' }}>
                <div style={{
                  background: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 20,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 14,
                  position: 'sticky',
                  top: 0,
                }}>
                  {form.avatar ? (
                    <img src={form.avatar} alt="صورة الموظف" style={{
                      width: 88, height: 88, borderRadius: 24, objectFit: 'cover',
                      border: `3px solid ${form.fullName ? avatarColor : 'var(--color-border)'}`,
                      transition: 'all 0.3s ease',
                    }} />
                  ) : (
                    <div style={{
                      width: 88, height: 88, borderRadius: 24,
                      background: form.fullName ? `${avatarColor}20` : 'var(--color-border)',
                      border: `3px solid ${form.fullName ? avatarColor : 'var(--color-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, fontWeight: 800,
                      color: form.fullName ? avatarColor : 'var(--color-text-muted)',
                      transition: 'all 0.3s ease',
                    }}>
                      {form.fullName ? getInitials(form.fullName) : <User size={36} />}
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3 }}>
                      {form.fullName || 'اسم الموظف'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', direction: 'ltr' }}>
                      {form.email || 'email@example.com'}
                    </div>
                  </div>

                  {roleInfo && (
                    <div style={{
                      padding: '6px 16px', borderRadius: 20,
                      background: `${roleInfo.color}18`, color: roleInfo.color,
                      fontSize: 12, fontWeight: 700, border: `1.5px solid ${roleInfo.color}35`,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {ROLE_ICONS[roleInfo.value]}
                      {roleInfo.label}
                    </div>
                  )}

                  <div style={{ width: '100%', height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>القسم</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{form.department || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>الحالة</span>
                      <span style={{ fontWeight: 600, color: '#22c55e' }}>نشط</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>الصلاحيات</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{form.permissions.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Role Selection */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <Shield size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>الدور الوظيفي</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>اختر الدور المناسب للموظف</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                  {EMPLOYEE_ROLES.map(role => {
                    const isSelected = form.role === role.value;
                    return (
                      <button
                        key={role.value}
                        onClick={() => handleRoleChange(role.value)}
                        style={{
                          padding: '18px 16px', borderRadius: 16,
                          border: `2px solid ${isSelected ? role.color : 'var(--color-border)'}`,
                          background: isSelected ? `${role.color}10` : 'var(--color-surface)',
                          color: isSelected ? role.color : 'var(--color-text-muted)',
                          fontWeight: 700, fontSize: 13, cursor: 'pointer',
                          transition: 'all 0.25s ease', fontFamily: 'inherit',
                          textAlign: 'center', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 10,
                          boxShadow: isSelected ? `0 4px 16px ${role.color}25` : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                        }}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: isSelected ? `${role.color}20` : 'var(--color-surface-alt)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? role.color : 'var(--color-text-muted)',
                          transition: 'all 0.25s ease',
                        }}>
                          {ROLE_ICONS[role.value]}
                        </div>
                        <span>{role.label}</span>
                        {isSelected && (
                          <div style={{
                            padding: '3px 10px', borderRadius: 20, background: `${role.color}18`,
                            color: role.color, fontSize: 10, fontWeight: 700, border: `1px solid ${role.color}30`,
                          }}>
                            مُحدد
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Summary */}
              {roleInfo && (
                <div style={{
                  background: `${roleInfo.color}08`,
                  border: `1.5px solid ${roleInfo.color}25`,
                  borderRadius: 16,
                  padding: '16px 22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${roleInfo.color}18`, color: roleInfo.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: roleInfo.color }}>
                        صلاحيات الدور: {roleInfo.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {form.permissions.length} من {PERMISSIONS.length} صلاحية مفعّلة
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRoleChange(form.role)}
                    style={{
                      padding: '7px 16px', borderRadius: 10, border: 'none',
                      background: `${roleInfo.color}15`, color: roleInfo.color,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    إعادة تعيين الصلاحيات
                  </button>
                </div>
              )}

              {/* Permissions */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>الصلاحيات التفصيلية</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>يمكنك تعديل الصلاحيات يدوياً بعد اختيار الدور</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.entries(permCategories).map(([category, perms]) => {
                    const grantedCount = perms.filter(p => form.permissions.includes(p.id)).length;
                    const allGranted = grantedCount === perms.length;
                    return (
                      <div key={category} style={{
                        border: '1.5px solid var(--color-border)',
                        borderRadius: 18, overflow: 'hidden',
                        transition: 'border-color 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)40'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                      >
                        <div style={{
                          padding: '14px 22px',
                          background: 'var(--color-surface-alt)',
                          borderBottom: '1px solid var(--color-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 8,
                              background: allGranted ? 'var(--color-success)' : 'var(--color-primary-50)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: allGranted ? '#fff' : 'var(--color-primary)',
                              transition: 'all 0.2s',
                            }}>
                              <CheckCircle2 size={15} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>{category}</span>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                            background: allGranted ? 'var(--color-success-bg)' : 'var(--color-surface)',
                            color: allGranted ? 'var(--color-success)' : 'var(--color-text-muted)',
                            border: `1.5px solid ${allGranted ? 'var(--color-success)30' : 'var(--color-border)'}`,
                          }}>
                            {grantedCount}/{perms.length}
                          </span>
                        </div>

                        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                          {perms.map(perm => {
                            const isGranted = form.permissions.includes(perm.id);
                            return (
                              <button
                                key={perm.id}
                                onClick={() => togglePermission(perm.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  background: isGranted ? 'var(--color-success-bg)' : 'var(--color-surface-alt)',
                                  border: `2px solid ${isGranted ? 'var(--color-success)40' : 'var(--color-border)'}`,
                                  textAlign: 'right', fontFamily: 'inherit', flexDirection: 'row-reverse',
                                }}
                              >
                                <div style={{
                                  width: 24, height: 24, borderRadius: 7,
                                  background: isGranted ? 'var(--color-success)' : 'var(--color-border)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0, transition: 'all 0.2s',
                                }}>
                                  {isGranted ? <CheckCircle2 size={14} color="#fff" /> : <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-text-muted)' }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: isGranted ? 'var(--color-success)' : 'var(--color-text)' }}>
                                    {perm.label}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                    {perm.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--color-surface-alt)',
        }}>
          <button
            onClick={currentStep === 1 ? onClose : handlePrev}
            className="btn btn-outline"
            style={{ fontSize: 14, padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {currentStep === 1 ? 'إلغاء' : <><ChevronRight size={17} /> السابق</>}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              padding: '6px 16px', borderRadius: 20,
              background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
              fontSize: 12, fontWeight: 700, color: 'var(--color-primary)',
            }}>
              {currentStep} / {STEPS.length}
            </div>

            {currentStep < 2 ? (
              <button onClick={handleNext} className="btn btn-primary" style={{ fontSize: 14, padding: '10px 26px', display: 'flex', alignItems: 'center', gap: 8 }}>
                التالي <ChevronLeft size={17} />
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn btn-success" style={{ fontSize: 14, padding: '10px 26px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} />
                إضافة الموظف
              </button>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      ` }} />
    </div>
  );
}

function FormField({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <AlertCircle size={13} /> {error}
        </span>
      )}
    </div>
  );
}
