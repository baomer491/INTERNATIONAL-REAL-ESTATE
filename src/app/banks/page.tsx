'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { useRealtime } from '@/hooks/useRealtime';
import { broadcastChange } from '@/lib/realtime-engine';
import type { Bank } from '@/types';
import { Building2, PlusCircle, Phone, Mail, Edit3, X, User } from 'lucide-react';

export default function BanksPage() {
  const { showToast, hasPermission } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const { data: banks, refresh: refreshBanks } = useRealtime('banks', () => store.getBanks());
  const [showAdd, setShowAdd] = useState(false);
  const [editBank, setEditBank] = useState<Bank | null>(null);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const newBank: Bank = {
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        }),
      name: form.name,
      nameEn: form.name,
      logo: '',
      isActive: true,
      reportTemplate: 'standard',
      contactPerson: form.contactPerson,
      phone: form.phone,
      email: form.email,
      address: form.address,
    };
    store.addBank(newBank);
    refreshBanks();
    broadcastChange('banks');
    setShowAdd(false);
    setForm({ name: '', contactPerson: '', phone: '', email: '', address: '' });
    showToast('تمت إضافة البنك', 'success');
  };

  const handleEdit = () => {
    if (!editBank || !form.name.trim()) return;
    store.updateBank(editBank.id, {
      name: form.name,
      contactPerson: form.contactPerson,
      phone: form.phone,
      email: form.email,
      address: form.address,
    });
    refreshBanks();
    broadcastChange('banks');
    setEditBank(null);
    setForm({ name: '', contactPerson: '', phone: '', email: '', address: '' });
    showToast('تم تحديث بيانات البنك', 'success');
  };

  const openEdit = (bank: Bank) => {
    setEditBank(bank);
    setForm({ name: bank.name, contactPerson: bank.contactPerson, phone: bank.phone, email: bank.email, address: bank.address });
  };

  const Modal = ({ title, onClose, onSave }: { title: string; onClose: () => void; onSave: () => void }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div style={{ background: dm ? 'var(--color-surface)' : 'white', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%', animation: 'slideInUp 0.3s', border: dm ? '1px solid var(--color-border)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            { key: 'name', label: 'اسم البنك *' },
            { key: 'contactPerson', label: 'جهة الاتصال' },
            { key: 'phone', label: 'الهاتف' },
            { key: 'email', label: 'البريد' },
            { key: 'address', label: 'العنوان' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', direction: 'rtl' }} />
            </div>
          ))}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>البنوك</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>{banks.length} بنك</p>
        </div>
        {hasPermission('banks_manage') && (
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <PlusCircle size={18} /> إضافة بنك
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {banks.map(bank => (
          <div key={bank.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: dm ? '#1e3a5f' : '#e8eef6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: dm ? '#60a5fa' : '#1e3a5f',
              }}>
                <Building2 size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{bank.name}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {bank.contactPerson && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {bank.contactPerson}</div>}
              {bank.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> {bank.phone}</div>}
              {bank.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> {bank.email}</div>}
            </div>
            {hasPermission('banks_manage') && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                <button onClick={() => openEdit(bank)} className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                  <Edit3 size={14} /> تعديل
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd && <Modal title="إضافة بنك" onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editBank && <Modal title="تعديل البنك" onClose={() => setEditBank(null)} onSave={handleEdit} />}
    </div>
  );
}
