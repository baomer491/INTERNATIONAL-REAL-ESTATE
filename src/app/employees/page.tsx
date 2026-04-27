'use client';

import React, { useState, useMemo, useRef } from 'react';
import { store } from '@/lib/store';
import { useApp } from '@/components/layout/AppContext';
import { useRealtime } from '@/hooks/useRealtime';
import { broadcastChange } from '@/lib/realtime-engine';
import type { Employee, EmployeeRole, EmployeeStatus, Permission } from '@/types';
import { EMPLOYEE_ROLES, PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from '@/types';
import {
  Users, PlusCircle, Search, Edit3, Trash2, Shield, Ban,
  CheckCircle2, X, Clock, LogIn, LogOut, UserCheck, UserX,
  Monitor, UserCog, ChevronDown, ChevronUp, ArrowLeft,
  LayoutGrid, List, Filter, Hash, Mail, Phone, MapPin,
  Calendar, Briefcase, Eye, EyeOff, Crown, FileText, PenLine,
  EyeIcon, AlertCircle, Building2, Upload, Camera
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';

const DEPARTMENTS = ['الإدارة العامة', 'قسم التثمين', 'قسم المراجعة', 'قسم إدخال البيانات', 'المبيعات'];

type ViewMode = 'list' | 'add' | 'edit';
type DisplayMode = 'grid' | 'table';

const roleIcons: Record<EmployeeRole, React.ReactNode> = {
  admin: <Crown size={18} />,
  appraiser: <PenLine size={18} />,
  reviewer: <EyeIcon size={18} />,
  data_entry: <FileText size={18} />,
  viewer: <Eye size={18} />,
};

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } catch { return '—'; }
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('');
}

function avatarColor(name: string): string {
  const colors = ['#1e3a5f', '#7c3aed', '#b45309', '#0891b2', '#15803d', '#dc2626', '#475569', '#be185d'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getPasswordStrength(password: string): { label: string; color: string; score: number } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { label: 'ضعيفة', color: '#ef4444', score };
  if (score <= 4) return { label: 'متوسطة', color: '#f59e0b', score };
  return { label: 'قوية', color: '#22c55e', score };
}

/* ── Styles ── */
const inputBase: React.CSSProperties = {
  width: '100%', padding: '11px 16px', border: '1.5px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'inherit',
  direction: 'rtl', background: 'var(--color-surface)',
  color: 'var(--color-text)', outline: 'none',
  transition: 'all var(--transition-fast)',
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-primary)';
    e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-50)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-border)';
    e.currentTarget.style.boxShadow = 'none';
  },
};

const Field: React.FC<{ label: string; required?: boolean; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, required, icon, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
      {icon} {label} {required && <span style={{ color: 'var(--color-danger)', fontSize: 15 }}>*</span>}
    </label>
    {children}
  </div>
);

const StatChip: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color?: string }> = ({ icon, label, value, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-xs)',
    flex: '1 1 160px', minWidth: 140,
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 'var(--radius-sm)',
      background: color || 'var(--color-primary-50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color ? 'white' : 'var(--color-primary)', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

export default function EmployeesPage() {
  const { showToast, hasPermission } = useApp();
  const { data: employees, refresh: refreshEmployees } = useRealtime('employees', () => store.getEmployees());
  const logs = store.getLoginLogs();

  /* ── State ── */
  const [mode, setMode] = useState<ViewMode>('list');
  const [display, setDisplay] = useState<DisplayMode>('grid');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<EmployeeRole | ''>('');
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | ''>('');
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [expandedLog, setExpandedLog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* ── Form ── */
  const [form, setForm] = useState({
    fullName: '', username: '', password: '', email: '',
    phone: '', role: 'appraiser' as EmployeeRole, department: '',
    notes: '', permissions: ROLE_DEFAULT_PERMISSIONS.appraiser,
    avatar: '',
  });

  const resetForm = () => setForm({
    fullName: '', username: '', password: '', email: '',
    phone: '', role: 'appraiser', department: '',
    notes: '', permissions: ROLE_DEFAULT_PERMISSIONS.appraiser,
    avatar: '',
  });

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    online: employees.filter(e => e.isActiveSession).length,
    suspended: employees.filter(e => e.status === 'suspended').length,
  }), [employees]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    let arr = [...employees];
    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter(e =>
        e.fullName.toLowerCase().includes(s) ||
        e.username.toLowerCase().includes(s) ||
        e.email.toLowerCase().includes(s) ||
        e.phone.includes(s)
      );
    }
    if (filterRole) arr = arr.filter(e => e.role === filterRole);
    if (filterStatus) arr = arr.filter(e => e.status === filterStatus);
    return arr;
  }, [employees, search, filterRole, filterStatus]);

  const { currentPage, totalPages, startIndex, endIndex, goToPage, hasNext, hasPrev } = usePagination({ totalItems: filtered.length, pageSize: 12 });
  const paginated = filtered.slice(startIndex, endIndex);

  const STATUS_MAP: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
    active: { label: 'نشط', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    suspended: { label: 'موقوف', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
    inactive: { label: 'غير نشط', color: 'var(--color-text-muted)', bg: 'var(--color-surface-alt)' },
  };

  const permCategories = useMemo(() => {
    const cats: Record<string, Permission[]> = {};
    PERMISSIONS.forEach(p => {
      if (!cats[p.category]) cats[p.category] = [];
      cats[p.category].push(p);
    });
    return cats;
  }, []);

  /* ── Handlers ── */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('حجم الصورة يجب أن يكون أقل من 2 ميغابايت', 'warning'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setForm(p => ({ ...p, avatar: reader.result as string }));
    reader.readAsDataURL(file);
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

  const validateForm = (): boolean => {
    if (!form.fullName.trim()) { showToast('الاسم الكامل مطلوب', 'warning'); return false; }
    if (!form.username.trim()) { showToast('اسم المستخدم مطلوب', 'warning'); return false; }
    if (mode === 'add' && !form.password.trim()) { showToast('كلمة المرور مطلوبة', 'warning'); return false; }
    if (!form.email.trim()) { showToast('البريد الإلكتروني مطلوب', 'warning'); return false; }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    const emp: Employee = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16);
      }),
      fullName: form.fullName, username: form.username, password: form.password,
      email: form.email, phone: form.phone, role: form.role, status: 'active',
      avatar: form.avatar, department: form.department,
      joinDate: new Date().toISOString(), lastLogin: null, lastLogout: null,
      isActiveSession: false, permissions: form.permissions, notes: form.notes,
    };
    await store.addEmployee(emp);
    broadcastChange('employees');
    setMode('list');
    resetForm();
    showToast('تمت إضافة الموظف بنجاح', 'success');
  };

  const handleEdit = async () => {
    if (!editEmp || !form.fullName.trim()) return;
    const updateData: Record<string, any> = {
      fullName: form.fullName, username: form.username, email: form.email,
      phone: form.phone, role: form.role, department: form.department,
      permissions: form.permissions, notes: form.notes, avatar: form.avatar,
    };
    if (form.password.trim()) updateData.password = form.password;
    await store.updateEmployee(editEmp.id, updateData);
    broadcastChange('employees');
    setMode('list');
    setEditEmp(null);
    resetForm();
    showToast('تم تحديث بيانات الموظف', 'success');
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await store.deleteEmployee(deleteConfirm.id);
      broadcastChange('employees');
      setDeleteConfirm(null);
      showToast('تم حذف الموظف', 'success');
    } catch (err: any) {
      showToast(err.message || 'فشل في حذف الموظف', 'error');
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    if (emp.status === 'active') {
      await store.suspendEmployee(emp.id);
      showToast('تم إيقاف الموظف', 'warning');
    } else {
      await store.activateEmployee(emp.id);
      showToast('تم تفعيل الموظف', 'success');
    }
    broadcastChange('employees');
  };

  const openEdit = (emp: Employee) => {
    setEditEmp(emp);
    setForm({
      fullName: emp.fullName, username: emp.username, password: '',
      email: emp.email, phone: emp.phone, role: emp.role,
      department: emp.department, notes: emp.notes,
      permissions: [...emp.permissions], avatar: emp.avatar || '',
    });
    setMode('edit');
  };

  const openAdd = () => { resetForm(); setMode('add'); };
  const cancelForm = () => { setMode('list'); setEditEmp(null); resetForm(); };

  /* ── Add / Edit Form View ── */
  if (mode === 'add' || mode === 'edit') {
    const isEdit = mode === 'edit';
    const passwordStrength = form.password ? getPasswordStrength(form.password) : null;

    return (
      <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 8px' }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <button onClick={cancelForm} style={{
            width: 42, height: 42, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'all var(--transition-fast)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
              {isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {isEdit ? `تحديث بيانات ${editEmp?.fullName}` : 'قم بإدخال بيانات الموظف وتحديد صلاحياته'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left: Form */}
          <div style={{ flex: '1 1 520px', minWidth: 0 }}>
            {/* Personal Info */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-primary-50)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
                }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>البيانات الشخصية</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>المعلومات الأساسية للموظف</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px 20px' }}>
                <Field label="الاسم الكامل" required icon={<Users size={15} />}>
                  <input type="text" value={form.fullName}
                    onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="الاسم الكامل" style={inputBase} {...focusHandlers} />
                </Field>
                <Field label="اسم المستخدم" required icon={<Hash size={15} />}>
                  <input type="text" value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    placeholder="اسم المستخدم للدخول" style={{ ...inputBase, direction: 'ltr', textAlign: 'right' }} {...focusHandlers} />
                </Field>
                <Field label={isEdit ? 'كلمة المرور الجديدة' : 'كلمة المرور'} required={!isEdit} icon={<Shield size={15} />}>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder={isEdit ? 'اتركه فارغاً لعدم التغيير' : 'أدخل كلمة المرور'}
                      style={{ ...inputBase, paddingLeft: 44, direction: 'ltr', textAlign: 'right' }} {...focusHandlers} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordStrength && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--color-surface-alt)', overflow: 'hidden' }}>
                        <div style={{ width: `${(passwordStrength.score / 6) * 100}%`, height: '100%', background: passwordStrength.color, borderRadius: 2, transition: 'width var(--transition-base)' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: passwordStrength.color }}>{passwordStrength.label}</span>
                    </div>
                  )}
                </Field>
                <Field label="البريد الإلكتروني" required icon={<Mail size={15} />}>
                  <input type="email" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="example@email.com" style={{ ...inputBase, direction: 'ltr', textAlign: 'right' }} {...focusHandlers} />
                </Field>
                <Field label="رقم الهاتف" icon={<Phone size={15} />}>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+968 XXXX XXXX" style={{ ...inputBase, direction: 'ltr', textAlign: 'right' }} {...focusHandlers} />
                </Field>
                <Field label="الدور الوظيفي" required icon={roleIcons[form.role]}>
                  <select value={form.role}
                    onChange={e => handleRoleChange(e.target.value as EmployeeRole)}
                    style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }} {...focusHandlers}>
                    {EMPLOYEE_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="القسم" icon={<Building2 size={15} />}>
                  <select value={form.department}
                    onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }} {...focusHandlers}>
                    <option value="">اختر القسم</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Permissions */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-warning-bg)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)',
                }}>
                  <Shield size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>الصلاحيات</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
                    تم تحديد {form.permissions.length} صلاحية
                  </div>
                </div>
              </div>

              {Object.entries(permCategories).map(([cat, perms]) => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
                    {cat}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                    {perms.map(perm => {
                      const active = form.permissions.includes(perm.id);
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => togglePermission(perm.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: active ? 'var(--color-primary-50)' : 'var(--color-surface)',
                            fontSize: 13, fontWeight: 600, textAlign: 'right',
                            color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          {active && <CheckCircle2 size={14} />}
                          {perm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-info-bg)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--color-info)',
                }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>ملاحظات</div>
                </div>
              </div>
              <textarea value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="ملاحظات إضافية..."
                rows={3}
                style={{ ...inputBase, minHeight: 80, resize: 'vertical' }} {...focusHandlers} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={cancelForm} className="btn btn-ghost" style={{ fontSize: 14, padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <X size={17} /> إلغاء
              </button>
              <button onClick={isEdit ? handleEdit : handleAdd} className="btn btn-primary" style={{ fontSize: 14, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={17} />
                {isEdit ? 'حفظ التعديلات' : 'إضافة الموظف'}
              </button>
            </div>
          </div>

          {/* Right: Preview Card */}
          <div style={{ width: 260, flexShrink: 0, position: 'sticky', top: 24 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 16px' }}>
                {form.avatar ? (
                  <img src={form.avatar} alt=""
                    style={{ width: 88, height: 88, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 88, height: 88, borderRadius: 'var(--radius-lg)',
                    background: form.fullName ? avatarColor(form.fullName) : 'var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 30, fontWeight: 800, color: 'white',
                    transition: 'all var(--transition-slow)',
                  }}>
                    {form.fullName ? getInitials(form.fullName) : <Users size={36} />}
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: -4, right: -4,
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--color-primary)', border: '2px solid var(--color-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white',
                  }}
                >
                  <Camera size={13} />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </div>

              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
                {form.fullName || 'اسم الموظف'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, direction: 'ltr' }}>
                @{form.username || 'username'}
              </div>

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px',
                borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700,
                background: `var(--color-primary-50)`,
                color: EMPLOYEE_ROLES.find(r => r.value === form.role)?.color || 'var(--color-primary)',
              }}>
                {roleIcons[form.role]}
                {EMPLOYEE_ROLES.find(r => r.value === form.role)?.label}
              </span>

              <div style={{ height: 1, background: 'var(--color-border)', margin: '20px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['البريد', form.email],
                  ['الهاتف', form.phone],
                  ['القسم', form.department],
                ].map(([label, val], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)', maxWidth: '55%', textAlign: 'left' }}>
                      {val || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── List View ── */
  const selectedLogs = selectedEmployee ? logs.filter(l => l.employeeId === selectedEmployee.id) : [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 8px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', color: 'var(--color-text)' }}>إدارة الموظفين</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            {filtered.length === employees.length
              ? `${employees.length} موظف مسجل`
              : `${filtered.length} من ${employees.length} موظف`}
          </p>
        </div>
        {hasPermission('employees_manage') && (
          <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '10px 22px' }}>
            <PlusCircle size={18} /> إضافة موظف
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatChip icon={<Users size={20} />} label="إجمالي الموظفين" value={stats.total} color="var(--color-primary)" />
        <StatChip icon={<UserCheck size={20} />} label="نشط" value={stats.active} color="var(--color-success)" />
        <StatChip icon={<Monitor size={20} />} label="متصل الآن" value={stats.online} color="var(--color-info)" />
        <StatChip icon={<UserX size={20} />} label="موقوف" value={stats.suspended} color="var(--color-danger)" />
      </div>

      {/* Filters + View Toggle */}
      <div className="card" style={{
        marginBottom: 24, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>
          <Filter size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>تصفية</span>
        </div>

        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input type="text" placeholder="بحث بالاسم، المستخدم، البريد..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputBase, paddingRight: 40, background: 'var(--color-surface-alt)' }}
            {...focusHandlers} />
        </div>

        <select value={filterRole} onChange={e => setFilterRole(e.target.value as EmployeeRole | '')}
          style={{ ...inputBase, width: 'auto', minWidth: 140, flex: '0 1 auto', appearance: 'none', cursor: 'pointer', background: 'var(--color-surface-alt)' }}
          {...focusHandlers}>
          <option value="">كل الأدوار</option>
          {EMPLOYEE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as EmployeeStatus | '')}
          style={{ ...inputBase, width: 'auto', minWidth: 120, flex: '0 1 auto', appearance: 'none', cursor: 'pointer', background: 'var(--color-surface-alt)' }}
          {...focusHandlers}>
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">موقوف</option>
          <option value="inactive">غير نشط</option>
        </select>

        {(search || filterRole || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }}
            className="btn btn-ghost" style={{ fontSize: 12, padding: '8px 14px', whiteSpace: 'nowrap' }}>
            <X size={14} /> مسح
          </button>
        )}

        <div style={{
          display: 'flex', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)',
          overflow: 'hidden', marginRight: 'auto',
        }}>
          {([
            { mode: 'grid' as DisplayMode, icon: <LayoutGrid size={16} />, label: 'بطاقات' },
            { mode: 'table' as DisplayMode, icon: <List size={16} />, label: 'جدول' },
          ]).map(opt => (
            <button key={opt.mode} onClick={() => setDisplay(opt.mode)} style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              background: display === opt.mode ? 'var(--color-primary)' : 'transparent',
              color: display === opt.mode ? 'white' : 'var(--color-text-muted)',
              fontSize: 12, fontWeight: 600, transition: 'all var(--transition-fast)',
            }}>
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="card" style={{
          textAlign: 'center', padding: '64px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-xl)',
            background: 'var(--color-surface-alt)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={36} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
              {search || filterRole || filterStatus ? 'لا توجد نتائج' : 'لا يوجد موظفين بعد'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {search || filterRole || filterStatus
                ? 'جرب تعديل معايير البحث أو التصفية'
                : 'قم بإضافة أول موظف للبدء'}
            </div>
          </div>
          {!search && !filterRole && !filterStatus && hasPermission('employees_manage') && (
            <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <PlusCircle size={18} /> إضافة أول موظف
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {filtered.length > 0 && display === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
          {paginated.map(emp => {
            const roleInfo = EMPLOYEE_ROLES.find(r => r.value === emp.role);
            const statusInfo = STATUS_MAP[emp.status];
            return (
              <div key={emp.id} className="card card-elevated" style={{ cursor: 'default', padding: 24 }}>
                {/* Top */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }} onClick={() => setSelectedEmployee(emp)}>
                    {emp.avatar ? (
                      <img src={emp.avatar} alt=""
                        style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: 52, height: 52, borderRadius: 'var(--radius-md)',
                        background: avatarColor(emp.fullName),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 18, fontWeight: 700,
                      }}>
                        {getInitials(emp.fullName)}
                      </div>
                    )}
                    {emp.isActiveSession && (
                      <div style={{
                        position: 'absolute', bottom: -2, left: -2,
                        width: 13, height: 13, borderRadius: '50%',
                        background: '#22c55e', border: '2px solid var(--color-surface)',
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setSelectedEmployee(emp)}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {emp.fullName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right', marginTop: 2 }}>
                      @{emp.username}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: `${roleInfo?.color}18`, color: roleInfo?.color,
                      }}>
                        {roleIcons[emp.role]}
                        <span style={{ marginRight: 4 }}>{roleInfo?.label}</span>
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 600, padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: statusInfo.bg, color: statusInfo.color,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo.color }} />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    {hasPermission('employees_manage') && (
                      <button onClick={() => openEdit(emp)} style={{
                        width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                        background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)',
                        transition: 'all var(--transition-fast)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-50)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    <button onClick={() => handleToggleStatus(emp)} style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                      background: emp.status === 'active' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                      color: emp.status === 'active' ? 'var(--color-danger)' : 'var(--color-success)',
                      transition: 'all var(--transition-fast)',
                    }}>
                      {emp.status === 'active' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    <Mail size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)', direction: 'ltr' }}>
                    <Phone size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <span>{emp.phone || '—'}</span>
                  </div>
                  {emp.department && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <Building2 size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <span>{emp.department}</span>
                    </div>
                  )}
                </div>

                {/* Status footer */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {emp.isActiveSession ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--color-success)', fontWeight: 700, fontSize: 11 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                      متصل الآن
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      آخر دخول: {formatDateTime(emp.lastLogin)}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button onClick={() => setSelectedEmployee(emp)} style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', cursor: 'pointer', background: 'var(--color-info-bg)', color: 'var(--color-info)',
                    }}>
                      <Clock size={13} />
                    </button>
                    {hasPermission('employees_manage') && (
                      <button onClick={() => setDeleteConfirm(emp)} style={{
                        width: 28, height: 28, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none', cursor: 'pointer', background: 'var(--color-danger-bg)', color: 'var(--color-danger)',
                      }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {filtered.length > 0 && display === 'table' && (
        <div className="card" style={{ marginBottom: 28, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['الموظف', 'الدور', 'القسم', 'الحالة', 'آخر دخول', 'التواصل', 'إجراءات'].map(h => (
                    <th key={h} style={{
                      padding: '14px 20px', textAlign: 'right', fontWeight: 700,
                      fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap',
                      borderBottom: '2px solid var(--color-border)',
                      background: 'var(--color-surface-alt)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(emp => {
                  const roleInfo = EMPLOYEE_ROLES.find(r => r.value === emp.role);
                  const statusInfo = STATUS_MAP[emp.status];
                  return (
                    <tr key={emp.id}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            {emp.avatar ? (
                              <img src={emp.avatar} alt="" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                            ) : (
                              <div style={{
                                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                                background: avatarColor(emp.fullName), display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 13, fontWeight: 700,
                              }}>
                                {getInitials(emp.fullName)}
                              </div>
                            )}
                            {emp.isActiveSession && (
                              <div style={{
                                position: 'absolute', bottom: -2, left: -2,
                                width: 10, height: 10, borderRadius: '50%',
                                background: '#22c55e', border: '2px solid var(--color-surface)',
                              }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 14 }}>{emp.fullName}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right' }}>@{emp.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 11, fontWeight: 700, padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: `${roleInfo?.color}18`, color: roleInfo?.color,
                        }}>
                          {roleIcons[emp.role]} {roleInfo?.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        {emp.department || '—'}
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 600, padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: statusInfo.bg, color: statusInfo.color,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo.color }} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {emp.isActiveSession ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontWeight: 700, fontSize: 11 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                            متصل الآن
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>{formatDateTime(emp.lastLogin)}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)', fontSize: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'right', fontSize: 11 }}>{emp.email}</span>
                          {emp.phone && <span style={{ color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right', fontSize: 11 }}>{emp.phone}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                        <div style={{ display: 'flex', gap: 3 }}>
                          <button onClick={() => setSelectedEmployee(emp)} title="سجل الدخول" style={{
                            width: 30, height: 30, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: 'none', cursor: 'pointer', background: 'var(--color-info-bg)', color: 'var(--color-info)',
                          }}><Clock size={14} /></button>
                          {hasPermission('employees_manage') && (
                            <button onClick={() => openEdit(emp)} title="تعديل" style={{
                              width: 30, height: 30, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: 'none', cursor: 'pointer', background: 'var(--color-primary-50)', color: 'var(--color-primary)',
                            }}><Edit3 size={14} /></button>
                          )}
                          {hasPermission('employees_manage') && (
                            <button onClick={() => handleToggleStatus(emp)} title={emp.status === 'active' ? 'إيقاف' : 'تفعيل'} style={{
                              width: 30, height: 30, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: 'none', cursor: 'pointer',
                              background: emp.status === 'active' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                              color: emp.status === 'active' ? 'var(--color-danger)' : 'var(--color-success)',
                            }}>{emp.status === 'active' ? <Ban size={14} /> : <CheckCircle2 size={14} />}</button>
                          )}
                          {hasPermission('employees_manage') && (
                            <button onClick={() => setDeleteConfirm(emp)} title="حذف" style={{
                              width: 30, height: 30, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: 'none', cursor: 'pointer', background: 'var(--color-danger-bg)', color: 'var(--color-danger)',
                            }}><Trash2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} hasNext={hasNext} hasPrev={hasPrev} />
      )}

      {/* Login Logs Section */}
      <div className="card" style={{ marginTop: 8 }}>
        <button onClick={() => setExpandedLog(!expandedLog)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', padding: 0,
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)',
              background: 'var(--color-info-bg)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--color-info)',
            }}>
              <Clock size={20} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                سجل الدخول والخروج
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{logs.length} سجل</p>
            </div>
          </div>
          {expandedLog ? <ChevronUp size={20} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--color-text-muted)' }} />}
        </button>

        {expandedLog && (
          <div style={{ marginTop: 18, overflowX: 'auto' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>الإجراء</th>
                  <th>التاريخ والوقت</th>
                  <th>عنوان IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 20).map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{log.employeeName}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 'var(--radius-full)',
                        background: log.action === 'login' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                        color: log.action === 'login' ? 'var(--color-success)' : 'var(--color-danger)',
                      }}>
                        {log.action === 'login' ? <><LogIn size={13} /> دخول</> : <><LogOut size={13} /> خروج</>}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDateTime(log.timestamp)}</td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Panel (Slide-in from right) */}
      {selectedEmployee && (
        <div>
          <div onClick={() => setSelectedEmployee(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150, animation: 'fadeIn 0.25s ease' }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(480px, 90vw)',
            background: 'var(--color-surface)', zIndex: 151,
            boxShadow: 'var(--shadow-xl)', borderLeft: '1px solid var(--color-border)',
            animation: 'slideInFromRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {selectedEmployee.avatar ? (
                  <img src={selectedEmployee.avatar} alt="" style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: 'var(--radius-md)',
                    background: avatarColor(selectedEmployee.fullName),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 20, fontWeight: 700,
                  }}>
                    {getInitials(selectedEmployee.fullName)}
                  </div>
                )}
                {selectedEmployee.isActiveSession && (
                  <div style={{
                    position: 'absolute', bottom: -2, left: -2,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#22c55e', border: '2px solid var(--color-surface)',
                    animation: 'pulse 1.5s infinite',
                  }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                  {selectedEmployee.fullName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right' }}>
                  @{selectedEmployee.username}
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)',
              }}>
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {/* Status & Role badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
                  padding: '6px 14px', borderRadius: 'var(--radius-full)',
                  background: `${EMPLOYEE_ROLES.find(r => r.value === selectedEmployee.role)?.color}18`,
                  color: EMPLOYEE_ROLES.find(r => r.value === selectedEmployee.role)?.color,
                }}>
                  {roleIcons[selectedEmployee.role]}
                  {EMPLOYEE_ROLES.find(r => r.value === selectedEmployee.role)?.label}
                </span>
                {(() => { const si = STATUS_MAP[selectedEmployee.status]; return (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                    padding: '6px 14px', borderRadius: 'var(--radius-full)',
                    background: si.bg, color: si.color,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: si.color }} />
                    {si.label}
                  </span>
                ); })()}
                {selectedEmployee.isActiveSession && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                    padding: '6px 14px', borderRadius: 'var(--radius-full)',
                    background: 'var(--color-success-bg)', color: 'var(--color-success)',
                  }}>
                    <Monitor size={13} /> متصل الآن
                  </span>
                )}
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: <Mail size={15} />, label: 'البريد الإلكتروني', value: selectedEmployee.email, dir: 'ltr' as const },
                  { icon: <Phone size={15} />, label: 'رقم الهاتف', value: selectedEmployee.phone || '—', dir: 'ltr' as const },
                  { icon: <Building2 size={15} />, label: 'القسم', value: selectedEmployee.department || '—' },
                  { icon: <Calendar size={15} />, label: 'تاريخ الانضمام', value: formatDateTime(selectedEmployee.joinDate) },
                  { icon: <LogIn size={15} />, label: 'آخر دخول', value: formatDateTime(selectedEmployee.lastLogin) },
                  { icon: <Shield size={15} />, label: 'الصلاحيات', value: `${selectedEmployee.permissions.length} صلاحية` },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 16px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-alt)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{row.icon}</span>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{row.label}</span>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
                      direction: row.dir || 'rtl', textAlign: row.dir === 'ltr' ? 'left' : 'right',
                      maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Permissions */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
                  الصلاحيات الممنوحة
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedEmployee.permissions.map(pid => {
                    const perm = PERMISSIONS.find(p => p.id === pid);
                    return perm ? (
                      <span key={pid} style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-primary-50)', color: 'var(--color-primary)',
                      }}>
                        {perm.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Notes */}
              {selectedEmployee.notes && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                    ملاحظات
                  </div>
                  <div style={{
                    padding: 16, borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.7,
                  }}>
                    {selectedEmployee.notes}
                  </div>
                </div>
              )}

              {/* Login Logs */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} /> آخر نشاط
                </div>
                {selectedLogs.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '12px 0' }}>
                    لا يوجد سجلات دخول
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedLogs.slice(0, 10).map(log => (
                      <div key={log.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface-alt)',
                      }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 'var(--radius-full)',
                          background: log.action === 'login' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                          color: log.action === 'login' ? 'var(--color-success)' : 'var(--color-danger)',
                        }}>
                          {log.action === 'login' ? <><LogIn size={12} /> دخول</> : <><LogOut size={12} /> خروج</>}
                        </span>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatDateTime(log.timestamp)}</span>
                          {log.ipAddress && (
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace', direction: 'ltr' }}>
                              {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--color-border)',
              display: 'flex', gap: 12, justifyContent: 'flex-end',
            }}>
              {hasPermission('employees_manage') && (
                <button onClick={() => { openEdit(selectedEmployee); setSelectedEmployee(null); }}
                  className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <Edit3 size={15} /> تعديل
                </button>
              )}
              {hasPermission('employees_manage') && (
                <button onClick={() => handleToggleStatus(selectedEmployee)}
                  className={selectedEmployee.status === 'active' ? 'btn btn-ghost' : 'btn btn-ghost'}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: selectedEmployee.status === 'active' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {selectedEmployee.status === 'active' ? <><Ban size={15} /> إيقاف</> : <><CheckCircle2 size={15} /> تفعيل</>}
                </button>
              )}
            </div>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes slideInFromRight {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          ` }} />
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div>
          <div onClick={() => setDeleteConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, animation: 'fadeIn 0.25s ease' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 201, animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div className="card" style={{ maxWidth: 420, width: '90vw', textAlign: 'center', padding: 32 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: 'var(--color-danger-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: 'var(--color-danger)',
              }}>
                <AlertCircle size={28} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text)' }}>
                تأكيد الحذف
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 4px', fontWeight: 600 }}>
                {deleteConfirm.fullName}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 12px' }}>
                هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
                <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">إلغاء</button>
                <button onClick={handleDelete} className="btn btn-danger">حذف</button>
              </div>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes slideInUp {
              from { opacity: 0; transform: translate(-50%, calc(-50% + 28px)) scale(0.96); }
              to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
          ` }} />
        </div>
      )}
    </div>
  );
}
