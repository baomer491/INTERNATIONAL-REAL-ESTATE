'use client';

import React from 'react';
import { Building2, Search, CheckCircle2 } from 'lucide-react';
import WizardStepLayout from '../WizardStepLayout';

interface BankSelectionStepProps {
  bankId: string;
  bankName: string;
  search: string;
  onSearchChange: (val: string) => void;
  onSelect: (id: string, name: string) => void;
  banks: { id: string; name: string; nameEn: string }[];
  error?: string;
}

export default function BankSelectionStep({
  bankId,
  search,
  onSearchChange,
  onSelect,
  banks,
  error,
}: BankSelectionStepProps) {
  const filtered = banks.filter(
    (b) => b.name.includes(search) || b.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <WizardStepLayout
      icon={<Building2 size={22} color="var(--color-primary)" />}
      title="اختيار البنك"
    >
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
          }}
        />
        <input
          type="text"
          placeholder="البحث عن بنك..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="form-input"
          style={{ paddingRight: 44 }}
        />
      </div>
      {error && <p className="form-error-message" style={{ marginBottom: 12 }}>{error}</p>}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {filtered.map((bank) => {
          const isSelected = bankId === bank.id;
          return (
            <button
              key={bank.id}
              onClick={() => onSelect(bank.id, bank.name)}
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                textAlign: 'right',
                fontFamily: 'inherit',
                border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: isSelected ? 'var(--color-info-bg)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? 'white' : 'var(--color-text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                <Building2 size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{bank.name}</div>
              </div>
              {isSelected && <CheckCircle2 size={20} color="var(--color-primary)" />}
            </button>
          );
        })}
      </div>
    </WizardStepLayout>
  );
}
