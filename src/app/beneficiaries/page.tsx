'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/components/layout/AppContext';
import type { Beneficiary, BeneficiaryRelation } from '@/types';
import { Users, Search, Phone, Mail, MapPin, FileText, Eye, X, PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { beneficiaryRelations } from '@/data/mock';

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

const emptyForm: FormData = {
  fullName: '',
  civilId: '',
  phone: '',
  email: '',
  address: '',
  relation: 'owner',
  workplace: '',
  notes: '',
  banksIds: [],
};

export default function BeneficiariesPage() {
  const { isDark } = useTheme();
  const { showToast } = useApp();
  const dm = isDark;
  const [beneficiaries, setBeneficiaries] = useState(store.getBeneficiaries());
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Beneficiary | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editBn, setEditBn] = useState<Beneficiary | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const banks = store.getBanks();

  const filtered = beneficiaries.filter(b =>
    b.fullName.includes(search) || b.civilId.includes(search) || b.phone.includes(search)
  );

  const handleAdd = () => {
    if (!form.fullName.trim() || !form.civilId.trim() || !form.phone.trim()) {
      showToast('يرجى تعبئة الحقول المطلوبة', 'warning');
      return;
    }
    const newBn: Beneficiary = {
      id: `bn-${Date.now()}`,
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
    store.addBeneficiary(newBn);
    setBeneficiaries(store.getBeneficiaries());
    setShowAdd(false);
    setForm(emptyForm);
    showToast('تمت إضافة المستفيد', 'success');
  };

  const handleEdit = () => {
    if (!editBn) return;
    if (!form.fullName.trim() || !form.civilId.trim() || !form.phone.trim()) {
      showToast('يرجى تعبئة الحقول المطلوبة', 'warning');
      return;
    }
    store.updateBeneficiary(editBn.id, {
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
    setBeneficiaries(store.getBeneficiaries());
    setEditBn(null);
    setForm(emptyForm);
    showToast('تم تحديث بيانات المستفيد', 'success');
  };

  const openEdit = (bn: Beneficiary) => {
    setEditBn(bn);
    setForm({
      fullName: bn.fullName,
      civilId: bn.civilId,
      phone: bn.phone,
      email: bn.email,
      address: bn.address,
      relation: bn.relation,
      workplace: bn.workplace || '',
      notes: bn.notes || '',
      banksIds: bn.banksIds || [],
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    store.deleteBeneficiary(deleteConfirm.id);
    setBeneficiaries(store.getBeneficiaries());
    setDeleteConfirm(null);
    showToast('تم حذف المستفيد', 'success');
  };

  const toggleBank = (bankId: string) => {
    setForm(prev => ({
      ...prev,
      banksIds: prev.banksIds.includes(bankId)
        ? prev.banksIds.filter(id => id !== bankId)
        : [...prev.banksIds, bankId],
    }));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)',
    borderRadius: 8, fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
    background: dm ? 'var(--color-surface-alt)' : '#f8fafc',
    color: 'var(--color-text)', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--color-text)',
  };

  const FormModal = ({ title, onClose, onSave }: { title: string; onClose: () => void; onSave: () => void }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: dm ? 'var(--color-surface)' : 'white', borderRadius: 16, padding: 28, maxWidth: 560, width: '90%', maxHeight: '85vh', overflowY: 'auto', animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={24} /></button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={labelStyle}>الاسم الكامل *</label>
            <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>الرقم المدني *</label>
              <input value={form.civilId} onChange={e => setForm(p => ({ ...p, civilId: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>الهاتف *</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>البريد الإلكتروني</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>الصفة</label>
              <select value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value as BeneficiaryRelation }))} style={inputStyle}>
                {beneficiaryRelations.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>العنوان</label>
            <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>جهة العمل</label>
            <input value={form.workplace} onChange={e => setForm(p => ({ ...p, workplace: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>ملاحظات</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>البنوك المرتبطة</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {banks.map(bank => (
                <label key={bank.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${form.banksIds.includes(bank.id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: form.banksIds.includes(bank.id)
                    ? 'var(--color-primary)'
                    : dm ? 'var(--color-surface-alt)' : '#f8fafc',
                  color: form.banksIds.includes(bank.id) ? 'white' : 'var(--color-text)',
                  fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                }}>
                  <input
                    type="checkbox"
                    checked={form.banksIds.includes(bank.id)}
                    onChange={() => toggleBank(bank.id)}
                    style={{ display: 'none' }}
                  />
                  {bank.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} className="btn btn-ghost">إلغاء</button>
          <button onClick={onSave} className="btn btn-primary">حفظ</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>المستفيدين</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>{filtered.length} مستفيد</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm(emptyForm); }} className="btn btn-primary">
          <PlusCircle size={18} /> إضافة مستفيد
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" placeholder="بحث بالاسم أو الرقم المدني..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 40px 10px 14px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', direction: 'rtl' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filtered.map(bn => (
          <div key={bn.id} className="card" style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div
                onClick={() => setSelected(bn)}
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {bn.fullName.charAt(0)}
              </div>
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelected(bn)}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{bn.fullName}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {beneficiaryRelations.find(r => r.value === bn.relation)?.label}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(bn)} style={{
                  padding: 7, borderRadius: 8, color: 'var(--color-text-secondary)',
                  background: 'var(--color-surface-alt)', display: 'flex', border: 'none', cursor: 'pointer',
                }}>
                  <Edit3 size={15} />
                </button>
                <button onClick={() => setDeleteConfirm(bn)} style={{
                  padding: 7, borderRadius: 8, color: 'var(--color-danger)',
                  background: 'var(--color-danger-bg, #fee2e2)', display: 'flex', border: 'none', cursor: 'pointer',
                }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <Phone size={14} /> {bn.phone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <FileText size={14} /> {bn.reportsCount} تقارير
              </div>
            </div>
            {bn.lastReportDate && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-muted)' }}>
                آخر تقرير: {formatDate(bn.lastReportDate)}
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: dm ? 'var(--color-surface)' : 'white', borderRadius: 16, padding: 32, maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto', animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>تفاصيل المستفيد</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={24} /></button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['الاسم الكامل', selected.fullName],
                ['الرقم المدني', selected.civilId],
                ['الهاتف', selected.phone],
                ['البريد', selected.email],
                ['العنوان', selected.address],
                ['الصفة', beneficiaryRelations.find(r => r.value === selected.relation)?.label],
                ['جهة العمل', selected.workplace],
                ['عدد التقارير', selected.reportsCount],
                ['آخر تقرير', selected.lastReportDate ? formatDate(selected.lastReportDate) : '—'],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: dm ? 'var(--color-surface-alt)' : '#f8fafc', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: dm ? 'var(--color-text-secondary)' : '#64748b' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{value || '—'}</span>
                </div>
              ))}
              {selected.banksIds && selected.banksIds.length > 0 && (
                <div style={{ padding: '8px 12px', background: dm ? 'var(--color-surface-alt)' : '#f8fafc', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: dm ? 'var(--color-text-secondary)' : '#64748b' }}>البنوك المرتبطة</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {selected.banksIds.map(bId => {
                      const bank = banks.find(b => b.id === bId);
                      return bank ? (
                        <span key={bId} style={{
                          fontSize: 12, padding: '3px 10px', borderRadius: 6,
                          background: 'var(--color-primary)', color: 'white', fontWeight: 500,
                        }}>
                          {bank.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {selected.notes && (
                <div style={{ padding: '8px 12px', background: dm ? 'var(--color-surface-alt)' : '#f8fafc', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: dm ? 'var(--color-text-secondary)' : '#64748b' }}>ملاحظات</span>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0' }}>{selected.notes}</p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => { setSelected(null); openEdit(selected); }} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit3 size={15} /> تعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <FormModal
          title="إضافة مستفيد"
          onClose={() => { setShowAdd(false); setForm(emptyForm); }}
          onSave={handleAdd}
        />
      )}

      {editBn && (
        <FormModal
          title="تعديل المستفيد"
          onClose={() => { setEditBn(null); setForm(emptyForm); }}
          onSave={handleEdit}
        />
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: dm ? 'var(--color-surface)' : 'white', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center', animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--color-danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Trash2 size={24} color="white" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>حذف المستفيد؟</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
              {deleteConfirm.fullName}
            </p>
            {deleteConfirm.reportsCount > 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-warning)', margin: '0 0 16px', fontWeight: 600 }}>
                تحذير: هذا المستفيد لديه {deleteConfirm.reportsCount} تقرير مرتبط
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">إلغاء</button>
              <button onClick={handleDelete} className="btn btn-danger">حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
