'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { store } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/components/layout/AppContext';
import { useRealtime } from '@/hooks/useRealtime';
import { broadcastChange } from '@/lib/realtime-engine';
import type { Beneficiary, BeneficiaryRelation } from '@/types';
import {
  Users, Search, Phone, Mail, MapPin, FileText, Eye, X, PlusCircle,
  Edit3, Trash2, Building2, CheckCircle2, LayoutGrid, List,
  UserCheck, UserPlus, Calendar, Briefcase, Hash, Filter, ChevronDown,
  ArrowLeft, Layers, Clock, Ban, ArrowUpDown, ChevronUp
} from 'lucide-react';
import { beneficiaryRelations } from '@/data/mock';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';

type FormData = {
  fullName: string;
  civilId: string;
  phone: string;
  email: string;
  address: string;
  relation: BeneficiaryRelation;
  workplace: string;
  notes: string;
  banksIds: string[];
};

type ViewMode = 'list' | 'add' | 'edit';
type DisplayMode = 'grid' | 'table';
type SortField = 'fullName' | 'civilId' | 'relation' | 'reportsCount' | 'lastReportDate';
type SortDir = 'asc' | 'desc';

const emptyForm: FormData = {
  fullName: '', civilId: '', phone: '', email: '', address: '',
  relation: 'owner', workplace: '', notes: '', banksIds: [],
};

const relationColors: Record<BeneficiaryRelation, { bg: string; text: string; border: string }> = {
  owner:                  { bg: 'var(--color-primary-50)',  text: 'var(--color-primary)',  border: 'var(--color-primary-100)' },
  buyer:                  { bg: 'var(--color-success-bg)',  text: 'var(--color-success)',  border: '#a7f3d0' },
  bank_client:            { bg: 'var(--color-info-bg)',     text: 'var(--color-info)',     border: '#bae6fd' },
  legal_representative:   { bg: 'var(--color-warning-bg)',  text: 'var(--color-warning)',  border: '#fde68a' },
  other:                  { bg: 'var(--color-surface-alt)', text: 'var(--color-text-secondary)', border: 'var(--color-border)' },
};

const avatarGradients = [
  'linear-gradient(135deg, #1e3a5f, #2d5a8e)',
  'linear-gradient(135deg, #065f46, #059669)',
  'linear-gradient(135deg, #1e3a5f, #0369a1)',
  'linear-gradient(135deg, #92400e, #d97706)',
  'linear-gradient(135deg, #4c1d95, #7c3aed)',
  'linear-gradient(135deg, #9d174d, #db2777)',
  'linear-gradient(135deg, #164e63, #0891b2)',
  'linear-gradient(135deg, #991b1b, #dc2626)',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

/* ── Input Styles ── */
const inputBase: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '1.5px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'inherit',
  direction: 'rtl', background: 'var(--color-surface)',
  color: 'var(--color-text)', outline: 'none',
  transition: 'all var(--transition-fast)',
};

const inputFocusStyle = { borderColor: 'var(--color-primary)', boxShadow: '0 0 0 3px var(--color-primary-50)' } as React.CSSProperties;

/* ── Field Component ── */
const Field: React.FC<{
  label: string; required?: boolean; icon?: React.ReactNode;
  children: React.ReactNode; style?: React.CSSProperties;
}> = ({ label, required, icon, children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
      {icon}
      {label}
      {required && <span style={{ color: 'var(--color-danger)', fontSize: 15 }}>*</span>}
    </label>
    {children}
  </div>
);

/* ── Stat Chip ── */
const StatChip: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color?: string }> = ({ icon, label, value, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-light)',
    boxShadow: 'var(--shadow-xs)',
    flex: '1 1 180px', minWidth: 160,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 'var(--radius-sm)',
      background: color || 'var(--color-primary-50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color ? 'white' : 'var(--color-primary)', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

export default function BeneficiariesPage() {
  const { isDark } = useTheme();
  const { showToast } = useApp();
  const dm = isDark;

  const { data: beneficiaries, refresh: refreshBeneficiaries } = useRealtime('beneficiaries', () => store.getBeneficiaries());
  const banks = store.getBanks();

  /* ── State ── */
  const [mode, setMode] = useState<ViewMode>('list');
  const [display, setDisplay] = useState<DisplayMode>('grid');
  const [search, setSearch] = useState('');
  const [relationFilter, setRelationFilter] = useState<BeneficiaryRelation | 'all'>('all');
  const [selected, setSelected] = useState<Beneficiary | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Beneficiary | null>(null);
  const [editBn, setEditBn] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showFilters, setShowFilters] = useState(false);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = beneficiaries.length;
    const owners = beneficiaries.filter(b => b.relation === 'owner').length;
    const buyers = beneficiaries.filter(b => b.relation === 'buyer').length;
    const withBanks = beneficiaries.filter(b => b.banksIds?.length > 0).length;
    const totalBanks = new Set(beneficiaries.flatMap(b => b.banksIds || [])).size;
    return { total, owners, buyers, withBanks, totalBanks };
  }, [beneficiaries]);

  /* ── Filter & Sort ── */
  const filtered = useMemo(() => {
    let arr = [...beneficiaries];

    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter(b =>
        b.fullName.toLowerCase().includes(s) ||
        b.civilId.includes(s) ||
        b.phone.includes(s) ||
        (b.email || '').toLowerCase().includes(s) ||
        (b.address || '').toLowerCase().includes(s)
      );
    }

    if (relationFilter !== 'all') {
      arr = arr.filter(b => b.relation === relationFilter);
    }

    arr.sort((a, b) => {
      let cmp = 0;
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'fullName': cmp = a.fullName.localeCompare(b.fullName, 'ar'); break;
        case 'civilId': cmp = a.civilId.localeCompare(b.civilId); break;
        case 'relation': cmp = a.relation.localeCompare(b.relation); break;
        case 'reportsCount': cmp = (a.reportsCount || 0) - (b.reportsCount || 0); break;
        case 'lastReportDate': cmp = (a.lastReportDate || '').localeCompare(b.lastReportDate || ''); break;
      }
      return cmp * dir;
    });

    return arr;
  }, [beneficiaries, search, relationFilter, sortField, sortDir]);

  const { currentPage, totalPages, startIndex, endIndex, goToPage, hasNext, hasPrev } = usePagination({ totalItems: filtered.length, pageSize: 12 });
  const paginatedFiltered = filtered.slice(startIndex, endIndex);

  /* ── Handlers ── */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const validateForm = (): boolean => {
    if (!form.fullName.trim() || !form.civilId.trim() || !form.phone.trim()) {
      showToast('يرجى تعبئة الحقول المطلوبة (الاسم، الرقم المدني، الهاتف)', 'warning');
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    const newBn: Beneficiary = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16);
      }),
      fullName: form.fullName,
      civilId: form.civilId,
      phone: form.phone,
      email: form.email,
      address: form.address,
      relation: form.relation,
      workplace: form.workplace,
      notes: form.notes,
      reportsCount: 0,
      banksIds: form.banksIds,
    };
    await store.addBeneficiary(newBn);
    refreshBeneficiaries();
    broadcastChange('beneficiaries');
    setMode('list');
    resetForm();
    showToast('تمت إضافة المستفيد بنجاح', 'success');
  };

  const handleEdit = async () => {
    if (!editBn) return;
    if (!validateForm()) return;
    await store.updateBeneficiary(editBn.id, {
      fullName: form.fullName,
      civilId: form.civilId,
      phone: form.phone,
      email: form.email,
      address: form.address,
      relation: form.relation,
      workplace: form.workplace,
      notes: form.notes,
      banksIds: form.banksIds,
    });
    refreshBeneficiaries();
    broadcastChange('beneficiaries');
    setMode('list');
    setEditBn(null);
    resetForm();
    showToast('تم تحديث بيانات المستفيد', 'success');
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await store.deleteBeneficiary(deleteConfirm.id);
    refreshBeneficiaries();
    broadcastChange('beneficiaries');
    setDeleteConfirm(null);
    showToast('تم حذف المستفيد', 'success');
  };

  const openEdit = (bn: Beneficiary) => {
    setEditBn(bn);
    setForm({
      fullName: bn.fullName, civilId: bn.civilId, phone: bn.phone,
      email: bn.email, address: bn.address, relation: bn.relation,
      workplace: bn.workplace || '', notes: bn.notes || '',
      banksIds: bn.banksIds || [],
    });
    setMode('edit');
  };

  const openAdd = () => {
    resetForm();
    setMode('add');
  };

  const cancelForm = () => {
    setMode('list');
    setEditBn(null);
    resetForm();
  };

  const resetForm = () => setForm(emptyForm);

  const toggleBank = (bankId: string) => {
    setForm(prev => ({
      ...prev,
      banksIds: prev.banksIds.includes(bankId)
        ? prev.banksIds.filter(id => id !== bankId)
        : [...prev.banksIds, bankId],
    }));
  };

  /* ── Focus style helper ── */
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'var(--color-primary)';
      e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-50)';
      e.currentTarget.style.background = 'var(--color-surface)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'var(--color-border)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.background = 'var(--color-surface)';
    },
  };

  /* ── Form View ── */
  if (mode === 'add' || mode === 'edit') {
    const isEdit = mode === 'edit';
    return (
      <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 8px' }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
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
              {isEdit ? 'تعديل المستفيد' : 'إضافة مستفيد جديد'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {isEdit ? 'تحديث بيانات المستفيد المختار' : 'قم بإدخال بيانات المستفيد وربطه بالبنوك'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left: Form */}
          <div style={{ flex: '1 1 500px', minWidth: 0 }}>
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
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>المعلومات الأساسية للمستفيد</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px 20px' }}>
                <Field label="الاسم الكامل" required icon={<Users size={15} />}>
                  <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="أدخل الاسم الكامل" style={inputBase} {...focusHandlers} />
                </Field>
                <Field label="الرقم المدني" required icon={<Hash size={15} />}>
                  <input value={form.civilId} onChange={e => setForm(p => ({ ...p, civilId: e.target.value }))}
                    placeholder="الرقم المدني" style={inputBase} {...focusHandlers} />
                </Field>
                <Field label="الهاتف" required icon={<Phone size={15} />}>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+968 XXXX XXXX" style={{ ...inputBase, direction: 'ltr', textAlign: 'right' }} {...focusHandlers} />
                </Field>
                <Field label="البريد الإلكتروني" icon={<Mail size={15} />}>
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="example@email.com" style={{ ...inputBase, direction: 'ltr', textAlign: 'right' }} {...focusHandlers} />
                </Field>
                <Field label="الصفة" icon={<UserPlus size={15} />}>
                  <select value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value as BeneficiaryRelation }))}
                    style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }} {...focusHandlers}>
                    {beneficiaryRelations.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="جهة العمل" icon={<Briefcase size={15} />}>
                  <input value={form.workplace} onChange={e => setForm(p => ({ ...p, workplace: e.target.value }))}
                    placeholder="اسم الشركة أو المؤسسة" style={inputBase} {...focusHandlers} />
                </Field>
              </div>
            </div>

            {/* Additional Info */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-info-bg)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--color-info)',
                }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>بيانات إضافية</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>العنوان والملاحظات</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="العنوان" icon={<MapPin size={15} />}>
                  <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="عنوان السكن" style={inputBase} {...focusHandlers} />
                </Field>
                <Field label="ملاحظات" icon={<FileText size={15} />}>
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="ملاحظات إضافية..." style={{ ...inputBase, minHeight: 80, resize: 'vertical' }} {...focusHandlers} />
                </Field>
              </div>
            </div>

            {/* Banks */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-warning-bg)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)',
                }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>البنوك المرتبطة</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
                    تم اختيار {form.banksIds.length} بنك
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {banks.map(bank => {
                  const active = form.banksIds.includes(bank.id);
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => toggleBank(bank.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 16px', borderRadius: 'var(--radius-full)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: active ? 'white' : 'var(--color-text-secondary)',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {active && <CheckCircle2 size={14} />}
                      {bank.name}
                    </button>
                  );
                })}
                {banks.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '12px 0' }}>
                    لا توجد بنوك متاحة
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={cancelForm} className="btn btn-ghost" style={{ fontSize: 14, padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <X size={17} /> إلغاء
              </button>
              <button onClick={isEdit ? handleEdit : handleAdd} className="btn btn-primary" style={{ fontSize: 14, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={17} />
                {isEdit ? 'حفظ التعديلات' : 'إضافة المستفيد'}
              </button>
            </div>
          </div>

          {/* Right: Preview Card */}
          <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 24 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 'var(--radius-lg)',
                background: form.fullName ? avatarColor(form.fullName) : 'var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: 'white', margin: '0 auto 16px',
                transition: 'all var(--transition-slow)',
              }}>
                {form.fullName ? form.fullName.charAt(0) : <Users size={32} />}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
                {form.fullName || 'اسم المستفيد'}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px',
                borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700,
                background: relationColors[form.relation]?.bg || 'var(--color-surface-alt)',
                color: relationColors[form.relation]?.text || 'var(--color-text-secondary)',
                border: `1.5px solid ${relationColors[form.relation]?.border || 'var(--color-border)'}`,
              }}>
                <CheckCircle2 size={12} />
                {beneficiaryRelations.find(r => r.value === form.relation)?.label || 'مالك'}
              </span>

              <div style={{ height: 1, background: 'var(--color-border)', margin: '20px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['الرقم المدني', form.civilId],
                  ['الهاتف', form.phone],
                  ['البريد', form.email],
                  ['العنوان', form.address],
                  ['جهة العمل', form.workplace],
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
  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 8px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 28, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', color: 'var(--color-text)' }}>المستفيدين</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            {filtered.length === beneficiaries.length
              ? `${beneficiaries.length} مستفيد`
              : `${filtered.length} من ${beneficiaries.length} مستفيد`}
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '10px 22px' }}>
          <PlusCircle size={18} /> إضافة مستفيد
        </button>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
      }}>
        <StatChip icon={<Users size={20} />} label="إجمالي المستفيدين" value={stats.total} color="var(--color-primary)" />
        <StatChip icon={<UserCheck size={20} />} label="مُلاك" value={stats.owners} color="var(--color-success)" />
        <StatChip icon={<UserPlus size={20} />} label="مشترين" value={stats.buyers} color="var(--color-info)" />
        <StatChip icon={<Building2 size={20} />} label="مرتبطين ببنوك" value={stats.withBanks} color="var(--color-warning)" />
      </div>

      {/* Search + Filters + View Toggle */}
      <div className="card" style={{
        marginBottom: 24, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="بحث بالاسم، الرقم المدني، الهاتف..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputBase, paddingRight: 42, background: 'var(--color-surface-alt)' }}
            {...focusHandlers}
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            borderRadius: 'var(--radius-sm)', border: `1.5px solid ${showFilters || relationFilter !== 'all' ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: showFilters || relationFilter !== 'all' ? 'var(--color-primary-50)' : 'var(--color-surface)',
            color: showFilters || relationFilter !== 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all var(--transition-fast)',
            whiteSpace: 'nowrap',
          }}
        >
          <Filter size={16} />
          {relationFilter === 'all' ? 'تصفية' : beneficiaryRelations.find(r => r.value === relationFilter)?.label}
          {relationFilter !== 'all' && (
            <span onClick={(e) => { e.stopPropagation(); setRelationFilter('all'); }}
              style={{
                marginRight: 4, width: 18, height: 18, borderRadius: '50%',
                background: 'var(--color-border)', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                fontSize: 10,
              }}>
              <X size={10} />
            </span>
          )}
          <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--transition-fast)' }} />
        </button>

        {/* View Toggle */}
        <div style={{
          display: 'flex', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)',
          overflow: 'hidden', marginRight: 'auto',
        }}>
          <button
            onClick={() => setDisplay('grid')}
            style={{
              padding: '9px 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              background: display === 'grid' ? 'var(--color-primary)' : 'transparent',
              color: display === 'grid' ? 'white' : 'var(--color-text-muted)',
              fontSize: 13, fontWeight: 600, transition: 'all var(--transition-fast)',
            }}
          >
            <LayoutGrid size={16} /> بطاقات
          </button>
          <button
            onClick={() => setDisplay('table')}
            style={{
              padding: '9px 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              background: display === 'table' ? 'var(--color-primary)' : 'transparent',
              color: display === 'table' ? 'white' : 'var(--color-text-muted)',
              fontSize: 13, fontWeight: 600, transition: 'all var(--transition-fast)',
            }}
          >
            <List size={16} /> جدول
          </button>
        </div>
      </div>

      {/* Relation Filters (expandable) */}
      {showFilters && (
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24,
          padding: '12px 0',
        }}>
          <button
            onClick={() => setRelationFilter('all')}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${relationFilter === 'all' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: relationFilter === 'all' ? 'var(--color-primary)' : 'transparent',
              color: relationFilter === 'all' ? 'white' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all var(--transition-fast)',
            }}
          >
            الكل
          </button>
          {beneficiaryRelations.map(r => (
            <button
              key={r.value}
              onClick={() => setRelationFilter(r.value)}
              style={{
                padding: '7px 16px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${relationFilter === r.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: relationFilter === r.value ? 'var(--color-primary)' : 'transparent',
                color: relationFilter === r.value ? 'white' : 'var(--color-text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all var(--transition-fast)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

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
            {search || relationFilter !== 'all' ? (
              <Search size={36} style={{ color: 'var(--color-text-muted)' }} />
            ) : (
              <Users size={36} style={{ color: 'var(--color-text-muted)' }} />
            )}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
              {search || relationFilter !== 'all' ? 'لا توجد نتائج' : 'لا يوجد مستفيدين بعد'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {search || relationFilter !== 'all'
                ? 'جرب تعديل معايير البحث أو التصفية'
                : 'قم بإضافة أول مستفيد للبدء'}
            </div>
          </div>
          {!search && relationFilter === 'all' && (
            <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <PlusCircle size={18} /> إضافة أول مستفيد
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {filtered.length > 0 && display === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
          {paginatedFiltered.map(bn => {
            const rel = relationColors[bn.relation] || relationColors.other;
            return (
              <div key={bn.id} className="card card-elevated" style={{ cursor: 'default', padding: 24 }}>
                {/* Top: Avatar + Name + Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div
                    onClick={() => setSelected(bn)}
                    style={{
                      width: 52, height: 52, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      background: avatarColor(bn.fullName),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 20, fontWeight: 700, flexShrink: 0,
                      transition: 'transform var(--transition-fast)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {bn.fullName.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setSelected(bn)}>
                    <div style={{
                      fontSize: 15, fontWeight: 700, color: 'var(--color-text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {bn.fullName}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px',
                        borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: rel.bg, color: rel.text, border: `1px solid ${rel.border}`,
                      }}>
                        <CheckCircle2 size={10} />
                        {beneficiaryRelations.find(r => r.value === bn.relation)?.label}
                      </span>
                      {bn.reportsCount > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)',
                        }}>
                          {bn.reportsCount} تقرير
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button onClick={() => openEdit(bn)} style={{
                      width: 34, height: 34, borderRadius: 'var(--radius-sm)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                      background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)',
                      transition: 'all var(--transition-fast)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-50)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm(bn)} style={{
                      width: 34, height: 34, borderRadius: 'var(--radius-sm)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                      background: 'var(--color-danger-bg)', color: 'var(--color-danger)',
                      transition: 'all var(--transition-fast)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-danger-bg)'; e.currentTarget.style.color = 'var(--color-danger)'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    <Hash size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
                    <span style={{ fontWeight: 500 }}>{bn.civilId}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)', direction: 'ltr' }}>
                    <Phone size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
                    <span style={{ fontWeight: 500 }}>{bn.phone}</span>
                  </div>
                  {bn.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <Mail size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
                      <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bn.email}
                      </span>
                    </div>
                  )}
                  {bn.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <MapPin size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
                      <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bn.address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Banks */}
                {bn.banksIds && bn.banksIds.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-light)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {bn.banksIds.slice(0, 3).map(bId => {
                        const bank = banks.find(b => b.id === bId);
                        return bank ? (
                          <span key={bId} style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)',
                          }}>
                            {bank.name}
                          </span>
                        ) : null;
                      })}
                      {bn.banksIds.length > 3 && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--color-primary-50)', color: 'var(--color-primary)',
                        }}>
                          +{bn.banksIds.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Last Report */}
                {bn.lastReportDate && (
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />
                    آخر تقرير: {formatDate(bn.lastReportDate)}
                  </div>
                )}
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
                  {[
                    { field: 'fullName' as SortField, label: 'الاسم', icon: null },
                    { field: 'civilId' as SortField, label: 'الرقم المدني', icon: null },
                    { field: 'relation' as SortField, label: 'الصفة', icon: null },
                    { field: null, label: 'التواصل', icon: null },
                    { field: 'reportsCount' as SortField, label: 'التقارير', icon: null },
                    { field: 'lastReportDate' as SortField, label: 'آخر تقرير', icon: null },
                  ].map(col => (
                    <th key={col.label} style={{
                      padding: '14px 20px', textAlign: 'right', fontWeight: 700,
                      fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap',
                      borderBottom: '2px solid var(--color-border)',
                      background: 'var(--color-surface-alt)',
                      cursor: col.field ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                      onClick={() => col.field && handleSort(col.field)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {col.label}
                        {col.field && sortField === col.field && (
                          <ChevronUp size={14} style={{
                            transform: sortDir === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform var(--transition-fast)',
                            color: 'var(--color-primary)',
                          }} />
                        )}
                        {col.field && sortField !== col.field && (
                          <ArrowUpDown size={12} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                        )}
                      </div>
                    </th>
                  ))}
                  <th style={{
                    padding: '14px 20px', textAlign: 'right', fontWeight: 700, fontSize: 12,
                    color: 'var(--color-text-muted)', borderBottom: '2px solid var(--color-border)',
                    background: 'var(--color-surface-alt)', width: 80,
                  }}>
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiltered.map(bn => (
                  <tr key={bn.id} style={{ transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                          background: avatarColor(bn.fullName), display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 14, fontWeight: 700, flexShrink: 0,
                        }}>
                          {bn.fullName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 14 }}>{bn.fullName}</div>
                          {bn.workplace && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{bn.workplace}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      {bn.civilId}
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: relationColors[bn.relation]?.bg || 'var(--color-surface-alt)',
                        color: relationColors[bn.relation]?.text || 'var(--color-text-secondary)',
                        border: `1px solid ${relationColors[bn.relation]?.border || 'var(--color-border)'}`,
                      }}>
                        {beneficiaryRelations.find(r => r.value === bn.relation)?.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'right' }}>
                          {bn.phone}
                        </span>
                        {bn.email && (
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right' }}>
                            {bn.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                      <span style={{
                        fontWeight: 700, color: bn.reportsCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontSize: 14,
                      }}>
                        {bn.reportsCount}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {bn.lastReportDate ? formatDate(bn.lastReportDate) : '—'}
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setSelected(bn)} style={{
                          width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                          background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-info-bg)'; e.currentTarget.style.color = 'var(--color-info)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                        >
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(bn)} style={{
                          width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                          background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-50)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(bn)} style={{
                          width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                          background: 'var(--color-danger-bg)', color: 'var(--color-danger)',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger)'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-danger-bg)'; e.currentTarget.style.color = 'var(--color-danger)'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} hasNext={hasNext} hasPrev={hasPrev} />
      )}

      {/* Detail Panel (Slide-in from right) */}
      {selected && (
        <div>
          {/* Overlay */}
          <div
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 150, animation: 'fadeIn 0.25s ease',
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(480px, 90vw)',
            background: 'var(--color-surface)', zIndex: 151,
            boxShadow: 'var(--shadow-xl)',
            borderLeft: '1px solid var(--color-border)',
            animation: 'slideInFromRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Panel Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 16,
              background: 'var(--color-surface)',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 'var(--radius-md)',
                background: avatarColor(selected.fullName),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 22, fontWeight: 700, flexShrink: 0,
              }}>
                {selected.fullName.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>{selected.fullName}</div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
                  fontSize: 11, fontWeight: 700, padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: relationColors[selected.relation]?.bg || 'var(--color-surface-alt)',
                  color: relationColors[selected.relation]?.text || 'var(--color-text-secondary)',
                }}>
                  {beneficiaryRelations.find(r => r.value === selected.relation)?.label}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: <Hash size={15} />, label: 'الرقم المدني', value: selected.civilId },
                  { icon: <Phone size={15} />, label: 'الهاتف', value: selected.phone, dir: 'ltr' as const },
                  { icon: <Mail size={15} />, label: 'البريد الإلكتروني', value: selected.email || '—', dir: 'ltr' as const },
                  { icon: <MapPin size={15} />, label: 'العنوان', value: selected.address || '—' },
                  { icon: <Briefcase size={15} />, label: 'جهة العمل', value: selected.workplace || '—' },
                  { icon: <FileText size={15} />, label: 'عدد التقارير', value: String(selected.reportsCount) },
                  { icon: <Calendar size={15} />, label: 'آخر تقرير', value: selected.lastReportDate ? formatDate(selected.lastReportDate) : '—' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-alt)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{row.icon}</span>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{row.label}</span>
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--color-text)',
                      direction: row.dir || 'rtl', textAlign: row.dir === 'ltr' ? 'left' : 'right',
                      maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Associated Banks */}
              {selected.banksIds && selected.banksIds.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
                    البنوك المرتبطة
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selected.banksIds.map(bId => {
                      const bank = banks.find(b => b.id === bId);
                      return bank ? (
                        <span key={bId} style={{
                          fontSize: 12, fontWeight: 600, padding: '6px 14px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--color-primary)', color: 'white',
                        }}>
                          {bank.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                    ملاحظات
                  </div>
                  <div style={{
                    padding: 16, borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.7,
                  }}>
                    {selected.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--color-border)',
              display: 'flex', gap: 12, justifyContent: 'flex-end',
              background: 'var(--color-surface)',
            }}>
              <button onClick={() => { setSelected(null); openEdit(selected); }} className="btn btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Edit3 size={15} /> تعديل
              </button>
              <button onClick={() => { const s = selected; setSelected(null); setDeleteConfirm(s); }} className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Trash2 size={15} /> حذف
              </button>
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
          <div
            onClick={() => setDeleteConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, animation: 'fadeIn 0.25s ease' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 201, animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div className="card" style={{ maxWidth: 420, width: '90vw', textAlign: 'center', padding: 32 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: 'var(--color-danger-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                color: 'var(--color-danger)',
              }}>
                <Trash2 size={28} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text)' }}>
                حذف المستفيد؟
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 4px', fontWeight: 600 }}>
                {deleteConfirm.fullName}
              </p>
              {deleteConfirm.reportsCount > 0 && (
                <p style={{ fontSize: 13, color: 'var(--color-warning)', margin: '0 0 12px', fontWeight: 600 }}>
                  تحذير: هذا المستفيد لديه {deleteConfirm.reportsCount} تقرير مرتبط
                </p>
              )}
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
