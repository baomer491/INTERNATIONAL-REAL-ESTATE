'use client';

import React, { useState, useMemo } from 'react';
import { store } from '@/lib/store';
import { useApp } from '@/components/layout/AppContext';
import type { Employee, EmployeeRole, EmployeeStatus, LoginLog, Permission } from '@/types';
import { EMPLOYEE_ROLES, PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from '@/types';
import {
  Users, PlusCircle, Search, Edit3, Trash2, Shield, Ban,
  CheckCircle2, XCircle, Clock, Eye, LogIn, LogOut,
  UserCheck, UserX, ChevronDown, ChevronUp, X, AlertCircle,
  Monitor, Key, UserCog
} from 'lucide-react';
import AddEmployeeModal from '@/components/employees/AddEmployeeModal';
import { useTheme } from '@/hooks/useTheme';

const DEPARTMENTS = ['الإدارة العامة', 'قسم التثمين', 'قسم المراجعة', 'قسم إدخال البيانات', 'المبيعات'];

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '---';
  }
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('');
}

const AVATAR_COLORS = ['#1e3a5f', '#b45309', '#0891b2', '#7c3aed', '#15803d', '#dc2626', '#475569', '#be185d'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  direction: 'rtl',
};

export default function EmployeesPage() {
  const { showToast, hasPermission } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const [employees, setEmployees] = useState(store.getEmployees());
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [expandedLog, setExpandedLog] = useState(false);

  const STATUS_MAP: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
    active: { label: 'نشط', color: dm ? '#34d399' : '#15803d', bg: dm ? '#14532d' : '#dcfce7' },
    suspended: { label: 'موقوف', color: dm ? '#f87171' : '#b91c1c', bg: dm ? '#450a0a' : '#fee2e2' },
    inactive: { label: 'غير نشط', color: dm ? 'var(--color-text-secondary)' : '#475569', bg: dm ? 'var(--color-surface-alt)' : '#f1f5f9' },
  };

  const [form, setForm] = useState<{
    fullName: string;
    username: string;
    password: string;
    email: string;
    phone: string;
    role: EmployeeRole;
    department: string;
    notes: string;
    permissions: string[];
  }>({
    fullName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'appraiser',
    department: '',
    notes: '',
    permissions: ROLE_DEFAULT_PERMISSIONS.appraiser,
  });

  const handleTextChange = (field: 'fullName' | 'username' | 'password' | 'email' | 'phone' | 'department' | 'notes', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (search && !e.fullName.includes(search) && !e.username.includes(search) && !e.email.includes(search)) return false;
      if (filterRole && e.role !== filterRole) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      return true;
    });
  }, [employees, search, filterRole, filterStatus]);

  const activeCount = employees.filter(e => e.status === 'active').length;
  const suspendedCount = employees.filter(e => e.status === 'suspended').length;
  const onlineCount = employees.filter(e => e.isActiveSession).length;

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

  const handleAdd = async (data: {
    fullName: string;
    username: string;
    email: string;
    phone: string;
    role: EmployeeRole;
    department: string;
    notes: string;
    permissions: string[];
    tempPassword: string;
  }) => {
    const emp: Employee = {
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        }),
      fullName: data.fullName,
      username: data.username,
      password: data.tempPassword,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: 'active',
      avatar: '',
      department: data.department,
      joinDate: new Date().toISOString(),
      lastLogin: null,
      lastLogout: null,
      isActiveSession: false,
      permissions: data.permissions,
      notes: data.notes,
    };
    await store.addEmployee(emp);
    setEmployees(store.getEmployees());
  };

  const handleEdit = () => {
    if (!selectedEmployee || !form.fullName.trim()) return;
    const updateData: Record<string, any> = {
      fullName: form.fullName, username: form.username, email: form.email,
      phone: form.phone, role: form.role, department: form.department,
      permissions: form.permissions, notes: form.notes,
    };
    if (form.password.trim()) {
      updateData.password = form.password;
    }
    store.updateEmployee(selectedEmployee.id, updateData);
    setEmployees(store.getEmployees());
    setShowEdit(false);
    setSelectedEmployee(null);
    showToast('تم تحديث بيانات الموظف', 'success');
  };

  const openEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setForm({
      fullName: emp.fullName, username: emp.username, password: emp.password, email: emp.email,
      phone: emp.phone, role: emp.role, department: emp.department,
      notes: emp.notes, permissions: [...emp.permissions],
    });
    setShowEdit(true);
  };

  const openPermissions = (emp: Employee) => {
    setSelectedEmployee(emp);
    setForm(prev => ({ ...prev, permissions: [...emp.permissions] }));
    setShowPermissions(true);
  };

  const handleSavePermissions = () => {
    if (!selectedEmployee) return;
    store.updateEmployee(selectedEmployee.id, { permissions: form.permissions });
    setEmployees(store.getEmployees());
    setShowPermissions(false);
    setSelectedEmployee(null);
    showToast('تم تحديث الصلاحيات', 'success');
  };

  const handleDelete = (id: string) => {
    store.deleteEmployee(id);
    setEmployees(store.getEmployees());
    setDeleteConfirm(null);
    showToast('تم حذف الموظف', 'success');
  };

  const handleToggleStatus = (emp: Employee) => {
    if (emp.status === 'active') {
      store.suspendEmployee(emp.id);
      showToast('تم إيقاف الموظف', 'warning');
    } else {
      store.activateEmployee(emp.id);
      showToast('تم تفعيل الموظف', 'success');
    }
    setEmployees(store.getEmployees());
  };

  const permCategories = useMemo(() => {
    const cats: Record<string, Permission[]> = {};
    PERMISSIONS.forEach(p => {
      if (!cats[p.category]) cats[p.category] = [];
      cats[p.category].push(p);
    });
    return cats;
  }, []);

  const logs = store.getLoginLogs();
  const selectedLogs = selectedEmployee ? logs.filter(l => l.employeeId === selectedEmployee.id) : [];

  const Modal = ({ title, onClose, onSave, children, wide }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode; wide?: boolean }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ background: dm ? 'var(--color-surface)' : 'white', borderRadius: 16, padding: 32, maxWidth: wide ? 680 : 500, width: '100%', maxHeight: '85vh', overflowY: 'auto', animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-muted)' }}><X size={24} /></button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <button onClick={onClose} className="btn btn-ghost">إلغاء</button>
          <button onClick={onSave} className="btn btn-primary">حفظ</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>إدارة الموظفين</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>{employees.length} موظف</p>
        </div>
        {hasPermission('employees_manage') && (
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <PlusCircle size={18} /> إضافة موظف
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'إجمالي الموظفين', value: employees.length, icon: <Users size={20} />, color: dm ? '#60a5fa' : '#1e3a5f', bg: dm ? '#1e3a5f' : '#e8eef6' },
          { label: 'نشط', value: activeCount, icon: <UserCheck size={20} />, color: dm ? '#34d399' : '#15803d', bg: dm ? '#14532d' : '#dcfce7' },
          { label: 'متصل الآن', value: onlineCount, icon: <Monitor size={20} />, color: dm ? '#22d3ee' : '#0891b2', bg: dm ? '#164e63' : '#cffafe' },
          { label: 'موقوف', value: suspendedCount, icon: <UserX size={20} />, color: dm ? '#f87171' : '#b91c1c', bg: dm ? '#450a0a' : '#fee2e2' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 6px', fontWeight: 500 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dm ? 'var(--color-text-muted)' : '#94a3b8' }} />
            <input type="text" placeholder="بحث بالاسم أو اسم المستخدم أو البريد..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', direction: 'rtl' }} />
          </div>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', appearance: 'none', minWidth: 150 }}>
            <option value="">كل الأدوار</option>
            {EMPLOYEE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', appearance: 'none', minWidth: 130 }}>
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
            <option value="inactive">غير نشط</option>
          </select>
          {(search || filterRole || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }} className="btn btn-ghost btn-sm">
              <X size={14} /> مسح
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>اسم المستخدم</th>
                <th>الدور</th>
                <th>القسم</th>
                <th>الحالة</th>
                <th>آخر دخول</th>
                <th>آخر خروج</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                    <Users size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p style={{ fontSize: 15, fontWeight: 600 }}>لا يوجد موظفين</p>
                  </div>
                </td></tr>
              ) : filtered.map(emp => {
                const statusInfo = STATUS_MAP[emp.status];
                const roleInfo = EMPLOYEE_ROLES.find(r => r.value === emp.role);
                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: getAvatarColor(emp.id),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
                          position: 'relative',
                        }}>
                          {getInitials(emp.fullName)}
                          {emp.isActiveSession && (
                            <div style={{
                              position: 'absolute', bottom: -1, left: -1,
                              width: 12, height: 12, borderRadius: '50%',
                              background: '#22c55e', border: dm ? '2px solid var(--color-surface)' : '2px solid white',
                            }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 1 }}>{emp.fullName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{emp.username}</td>
                    <td>
                      <span className="badge" style={{ background: `${roleInfo?.color}15`, color: roleInfo?.color, fontSize: 12 }}>
                        {roleInfo?.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{emp.department}</td>
                    <td>
                      <span className="badge" style={{ background: statusInfo.bg, color: statusInfo.color, fontSize: 12 }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: emp.lastLogin ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {emp.lastLogin ? formatDateTime(emp.lastLogin) : '—'}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: emp.lastLogout ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {emp.isActiveSession ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#22c55e', fontWeight: 600, fontSize: 11 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                          متصل الآن
                        </span>
                      ) : (emp.lastLogout ? formatDateTime(emp.lastLogout) : '—')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {hasPermission('employees_manage') && (
                          <button onClick={() => openEdit(emp)} title="تعديل" style={{ padding: 6, borderRadius: 6, color: '#3b82f6', background: dm ? '#1e3a5f' : '#dbeafe', border: 'none', cursor: 'pointer', display: 'flex' }}><Edit3 size={15} /></button>
                        )}
                        {hasPermission('employees_permissions') && (
                          <button onClick={() => openPermissions(emp)} title="الصلاحيات" style={{ padding: 6, borderRadius: 6, color: '#7c3aed', background: dm ? '#2e1065' : '#f3e8ff', border: 'none', cursor: 'pointer', display: 'flex' }}><Shield size={15} /></button>
                        )}
                        <button onClick={() => { setSelectedEmployee(emp); setShowLogs(true); }} title="سجل الدخول" style={{ padding: 6, borderRadius: 6, color: '#b45309', background: dm ? '#451a03' : '#fef3c7', border: 'none', cursor: 'pointer', display: 'flex' }}><Clock size={15} /></button>
                        {hasPermission('employees_manage') && (
                          <button onClick={() => handleToggleStatus(emp)} title={emp.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            style={{ padding: 6, borderRadius: 6, color: emp.status === 'active' ? (dm ? '#f87171' : '#b91c1c') : (dm ? '#34d399' : '#15803d'), background: emp.status === 'active' ? (dm ? '#450a0a' : '#fee2e2') : (dm ? '#14532d' : '#dcfce7'), border: 'none', cursor: 'pointer', display: 'flex' }}>
                            {emp.status === 'active' ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                          </button>
                        )}
                        {hasPermission('employees_manage') && (
                          <button onClick={() => setDeleteConfirm(emp.id)} title="حذف" style={{ padding: 6, borderRadius: 6, color: '#ef4444', background: dm ? '#450a0a' : '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
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

      <div className="card" style={{ marginTop: 20 }}>
        <button onClick={() => setExpandedLog(!expandedLog)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} color="var(--color-primary)" />
            سجل الدخول والخروج
            <span className="badge badge-blue" style={{ fontSize: 11 }}>{logs.length}</span>
          </h3>
          {expandedLog ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expandedLog && (
          <div style={{ marginTop: 16, overflowX: 'auto' }}>
            <table className="data-table">
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: log.action === 'login' ? (dm ? '#14532d' : '#dcfce7') : (dm ? '#450a0a' : '#fee2e2'), color: log.action === 'login' ? (dm ? '#34d399' : '#15803d') : (dm ? '#f87171' : '#b91c1c') }}>
                        {log.action === 'login' ? <><LogIn size={13} /> دخول</> : <><LogOut size={13} /> خروج</>}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{formatDateTime(log.timestamp)}</td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right', color: 'var(--color-text-muted)' }}>{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddEmployeeModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
      />

      {showEdit && (
        <Modal title={`تعديل بيانات: ${selectedEmployee?.fullName}`} onClose={() => { setShowEdit(false); setSelectedEmployee(null); }} onSave={handleEdit}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>الاسم الكامل *</label>
              <input type="text" value={form.fullName} onChange={(e) => handleTextChange('fullName', e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>اسم المستخدم *</label>
              <input type="text" value={form.username} onChange={(e) => handleTextChange('username', e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>كلمة المرور</label>
              <input type="password" value={form.password} onChange={(e) => handleTextChange('password', e.target.value)} placeholder="اتركه فارغاً لعدم التغيير" style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>البريد الإلكتروني *</label>
              <input type="email" value={form.email} onChange={(e) => handleTextChange('email', e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>رقم الهاتف</label>
              <input type="tel" value={form.phone} onChange={(e) => handleTextChange('phone', e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>الدور</label>
              <select value={form.role} onChange={(e) => handleRoleChange(e.target.value as EmployeeRole)} style={{ ...INPUT_STYLE, appearance: 'none' }}>
                {EMPLOYEE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>القسم</label>
              <select value={form.department} onChange={(e) => handleTextChange('department', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none' }}>
                <option value="">اختر القسم</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>ملاحظات</label>
              <textarea value={form.notes} onChange={(e) => handleTextChange('notes', e.target.value)} style={{ ...INPUT_STYLE, minHeight: 60, resize: 'vertical' }} />
            </div>
          </div>
        </Modal>
      )}

      {showPermissions && selectedEmployee && (
        <Modal title={`صلاحيات: ${selectedEmployee.fullName}`} onClose={() => { setShowPermissions(false); setSelectedEmployee(null); }} onSave={handleSavePermissions} wide>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="badge" style={{ background: `${EMPLOYEE_ROLES.find(r => r.value === selectedEmployee.role)?.color}15`, color: EMPLOYEE_ROLES.find(r => r.value === selectedEmployee.role)?.color }}>
                {EMPLOYEE_ROLES.find(r => r.value === selectedEmployee.role)?.label}
              </span>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                ({form.permissions.length} من {PERMISSIONS.length} صلاحية)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EMPLOYEE_ROLES.map(r => (
                <button key={r.value} onClick={() => setForm(p => ({ ...p, permissions: ROLE_DEFAULT_PERMISSIONS[r.value] }))}
                  style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid var(--color-border)`, background: form.role === r.value ? (dm ? '#1e3a5f' : '#e8eef6') : (dm ? 'var(--color-surface-alt)' : 'white'), cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                  تطبيق صلاحيات {r.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {Object.entries(permCategories).map(([category, perms]) => (
              <div key={category}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                  {category}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {perms.map(perm => (
                    <label key={perm.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      borderRadius: 8, cursor: 'pointer', fontSize: 13,
                      background: form.permissions.includes(perm.id) ? (dm ? '#14532d' : '#f0fdf4') : (dm ? 'var(--color-surface-alt)' : '#fafbfc'),
                      border: `1px solid ${form.permissions.includes(perm.id) ? (dm ? '#166534' : '#bbf7d0') : 'var(--color-border)'}`,
                      transition: 'all 0.15s',
                    }}>
                      <input type="checkbox" checked={form.permissions.includes(perm.id)} onChange={() => togglePermission(perm.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{perm.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showLogs && selectedEmployee && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: dm ? 'var(--color-surface)' : 'white', borderRadius: 16, padding: 32, maxWidth: 560, width: '100%', maxHeight: '80vh', overflowY: 'auto', animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={20} color="var(--color-primary)" />
                سجل الدخول — {selectedEmployee.fullName}
              </h3>
              <button onClick={() => { setShowLogs(false); setSelectedEmployee(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-muted)' }}>الجلسة الحالية</div>
              {selectedEmployee.isActiveSession && selectedEmployee.lastLogin ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: dm ? '#14532d' : '#f0fdf4', borderRadius: 10, border: dm ? '1px solid #166534' : '1px solid #bbf7d0' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: dm ? '#34d399' : '#15803d' }}>متصل الآن</div>
                    <div style={{ fontSize: 12, color: dm ? '#4ade80' : '#166534' }}>دخل في: {formatDateTime(selectedEmployee.lastLogin)}</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 14, background: dm ? 'var(--color-surface-alt)' : '#f8fafc', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  غير متصل حالياً
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-muted)' }}>السجل</div>
            {selectedLogs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)', fontSize: 13 }}>لا يوجد سجل دخول</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: dm ? 'var(--color-surface-alt)' : '#f8fafc', borderRadius: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: log.action === 'login' ? (dm ? '#14532d' : '#dcfce7') : (dm ? '#450a0a' : '#fee2e2'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: log.action === 'login' ? (dm ? '#34d399' : '#15803d') : (dm ? '#f87171' : '#b91c1c'),
                    }}>
                      {log.action === 'login' ? <LogIn size={16} /> : <LogOut size={16} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {log.action === 'login' ? 'دخول' : 'خروج'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
                        {log.ipAddress}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => { setShowLogs(false); setSelectedEmployee(null); }} className="btn btn-ghost">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: dm ? 'var(--color-surface)' : 'white', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center', animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: dm ? '#450a0a' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>حذف الموظف؟</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 24px' }}>هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">إلغاء</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-danger">حذف</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      ` }} />
    </div>
  );
}
