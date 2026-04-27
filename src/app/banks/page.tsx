'use client';

import React, { useState, useRef, useEffect } from 'react';
import { store } from '@/lib/store';
import { useApp } from '@/components/layout/AppContext';
import { useRealtime } from '@/hooks/useRealtime';
import { broadcastChange } from '@/lib/realtime-engine';
import type { Bank } from '@/types';
import { Building2, PlusCircle, Phone, Mail, Edit3, X, User, Search, MapPin, AlertCircle, Trash2 } from 'lucide-react';

function BankField({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
    </div>
  );
}

// Modal component
const Modal = ({ title, isOpen, onClose, onSave, icon, children }: { 
  title: string; isOpen: boolean; onClose: () => void; onSave: () => void; icon: React.ReactNode; children: React.ReactNode 
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.addEventListener('keydown', handleEsc); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, direction: 'rtl',
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', cursor: 'pointer',
      }} onClick={onClose} />
      <div style={{
        position: 'relative', background: 'var(--color-surface)',
        borderRadius: 16, width: '100%', maxWidth: 480,
        animation: 'modalIn 0.2s ease-out'
      }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        ` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <h2 style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflow: 'auto' }}>
          {children}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="btn btn-ghost">إلغاء</button>
          <button onClick={onSave} className="btn btn-primary">حفظ</button>
        </div>
      </div>
    </div>
  );
};

export default function BanksPage() {
  const { showToast, hasPermission } = useApp();
  const { data: banks, refresh: refreshBanks } = useRealtime('banks', () => store.getBanks());
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', logo: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredBanks = banks.filter(b => !search || b.name.includes(search) || b.contactPerson?.includes(search));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'مطلوب';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'غير صحيح';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const bankData = { name: form.name, contactPerson: form.contactPerson, phone: form.phone, email: form.email, address: form.address, logo: form.logo };
    if (mode === 'add') {
      store.addBank({ ...bankData, id: crypto.randomUUID(), nameEn: form.name, isActive: true, reportTemplate: 'standard' } as Bank);
    } else if (selectedBank) {
      store.updateBank(selectedBank.id, bankData);
    }
    refreshBanks();
    broadcastChange('banks');
    showToast(mode === 'add' ? 'تمت الإضافة' : 'تم التحديث', 'success');
    handleClose();
  };

  const handleDelete = async () => {
    if (!selectedBank) return;
    await store.deleteBank(selectedBank.id);
    refreshBanks();
    broadcastChange('banks');
    showToast('تم الحذف', 'success');
    setSelectedBank(null);
  };

  const handleClose = () => { setMode('list'); setSelectedBank(null); setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', logo: '' }); setErrors({}); };
  const openEdit = (b: Bank) => { setSelectedBank(b); setForm({ name: b.name, contactPerson: b.contactPerson || '', phone: b.phone || '', email: b.email || '', address: b.address || '', logo: b.logo || '' }); setMode('edit'); };
  const openAdd = () => { setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', logo: '' }); setMode('add'); };

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('حجم كبير', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setForm(p => ({ ...p, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const modeAny = mode as 'list' | 'add' | 'edit';

  // List View
  if (modeAny === 'list') {
    return (
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>البنوك</h1>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{banks.length} بنك</p>
            </div>
          </div>
          {hasPermission('banks_manage') && (
            <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PlusCircle size={16} /> إضافة
            </button>
          )}
        </div>

        {/* Search */}
        {banks.length > 0 && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={16} color="var(--color-text-muted)" />
            <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--color-text)' }} />
          </div>
        )}

        {/* Grid */}
        {filteredBanks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, background: 'var(--color-surface)', borderRadius: 12 }}>
            <Building2 size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>{search ? 'لا توجد نتائج' : 'أضف بنك جديد'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filteredBanks.map(bank => (
              <div key={bank.id} style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {bank.logo ? (
                    <img src={bank.logo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={18} color="var(--color-primary)" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{bank.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-success)' }}>{bank.isActive ? 'نشط' : 'متوقف'}</div>
                  </div>
                  {hasPermission('banks_manage') && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(bank)} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setSelectedBank(bank)} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: 'var(--color-danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {bank.contactPerson && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={12} /> {bank.contactPerson}</div>}
                  {bank.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {bank.phone}</div>}
                  {bank.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} /> {bank.email}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {mode === 'edit' && (
        <Modal title="تعديل البنك" isOpen={true} onClose={handleClose} onSave={handleSave} icon={<Building2 size={16} color="white" />}>
          <BankField label="اسم البنك" required error={errors.name}>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="form-input" style={{ fontSize: 13 }} />
          </BankField>
          <BankField label="جهة الاتصال">
            <input type="text" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} className="form-input" style={{ fontSize: 13 }} />
          </BankField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <BankField label="الهاتف">
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="form-input" style={{ fontSize: 13 }} />
            </BankField>
            <BankField label="البريد" error={errors.email}>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="form-input" style={{ fontSize: 13 }} />
            </BankField>
          </div>
          <BankField label="العنوان">
            <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="form-input" style={{ fontSize: 13 }} />
          </BankField>
          <BankField label="الشعار">
            {form.logo ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={form.logo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                <button onClick={() => setForm(p => ({ ...p, logo: '' }))} style={{ position: 'absolute', top: -6, left: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{ width: 48, height: 48, borderRadius: 8, border: '2px dashed var(--color-border)', background: 'var(--color-surface-alt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlusCircle size={18} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onLogoChange} style={{ display: 'none' }} />
          </BankField>
        </Modal>
        )}

        {/* Delete Modal */}
        {selectedBank && !mode && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'absolute', inset: 0 }} onClick={() => setSelectedBank(null)} />
            <div style={{ position: 'relative', background: 'var(--color-surface)', borderRadius: 12, padding: 20, maxWidth: 320, width: '100%', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Trash2 size={20} color="var(--color-danger)" />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>حذف {selectedBank.name}؟</h3>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                <button onClick={() => setSelectedBank(null)} className="btn btn-ghost">إلغاء</button>
                <button onClick={handleDelete} className="btn btn-danger">حذف</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Add/Edit View
  if (modeAny === 'add' || modeAny === 'edit') {
    return (
    <div style={{ padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{mode === 'add' ? 'إضافة بنك جديد' : 'تعديل البنك'}</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BankField label="اسم البنك" required error={errors.name}>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم البنك" className="form-input" />
          </BankField>
          <BankField label="جهة الاتصال">
            <input type="text" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} placeholder="الشخص المسؤول" className="form-input" />
          </BankField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <BankField label="رقم الهاتف">
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+968..." className="form-input" />
            </BankField>
            <BankField label="البريد الإلكتروني" error={errors.email}>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@bank.om" className="form-input" />
            </BankField>
          </div>
          <BankField label="العنوان">
            <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="عنوان الفرع" className="form-input" />
          </BankField>
          <BankField label="شعار البنك">
            <div>
              {form.logo ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={form.logo} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                  <button onClick={() => setForm(p => ({ ...p, logo: '' }))} style={{ position: 'absolute', top: -8, left: -8, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} style={{ width: 56, height: 56, borderRadius: 10, border: '2px dashed var(--color-border)', background: 'var(--color-surface-alt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={20} />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={onLogoChange} style={{ display: 'none' }} />
            </div>
          </BankField>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleClose} className="btn btn-ghost" style={{ flex: 1 }}>إلغاء</button>
          <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>حفظ</button>
        </div>
      </div>
    </div>
    );
  }

  return null;
}