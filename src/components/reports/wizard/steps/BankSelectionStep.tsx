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
  banks: { id: string; name: string; nameEn: string; logo?: string }[];
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

  const selectedBank = banks.find(b => b.id === bankId);

  return (
    <WizardStepLayout
      icon={<Building2 size={22} color="var(--color-primary)" />}
      title="اختيار البنك"
    >
      {/* Selected Bank Card */}
      {selectedBank && (
        <div style={{
          marginBottom: 20,
          padding: '18px 24px',
          borderRadius: 16,
          border: '2px solid var(--color-primary)',
          background: 'linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-surface) 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative accent */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 4, height: '100%',
            background: 'var(--color-primary)', borderRadius: '0 16px 16px 0',
          }} />

          {/* Bank Logo */}
          <div style={{
            width: 64, height: 64, borderRadius: 14, flexShrink: 0,
            background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '2px solid var(--color-border)',
            overflow: 'hidden',
          }}>
            {selectedBank.logo ? (
              <img src={selectedBank.logo} alt={selectedBank.name} style={{
                width: '100%', height: '100%', objectFit: 'contain', padding: 6,
              }} />
            ) : (
              <Building2 size={28} color="var(--color-primary)" />
            )}
          </div>

          {/* Bank Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 2, letterSpacing: 0.5 }}>
              البنك المختار
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
              {selectedBank.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {selectedBank.nameEn}
            </div>
          </div>

          {/* Check Badge */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
          }}>
            <CheckCircle2 size={20} color="white" />
          </div>
        </div>
      )}

      {/* Search */}
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

      {/* Bank Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
                padding: 0,
                borderRadius: 14,
                textAlign: 'center',
                fontFamily: 'inherit',
                border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: isSelected ? 'var(--color-info-bg)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Selected ribbon */}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }}>
                  <CheckCircle2 size={13} color="white" />
                </div>
              )}

              {/* Logo Area */}
              <div style={{
                height: 90,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 20px',
                background: isSelected ? 'rgba(37, 99, 235, 0.03)' : 'var(--color-surface-alt)',
                borderBottom: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
              }}>
                {bank.logo ? (
                  <img src={bank.logo} alt={bank.name} style={{
                    maxWidth: '100%', maxHeight: 60, objectFit: 'contain',
                    filter: isSelected ? 'none' : 'grayscale(0.1)',
                    transition: 'all 0.2s',
                  }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isSelected ? 'white' : 'var(--color-text-muted)',
                    transition: 'all 0.2s',
                  }}>
                    <Building2 size={24} />
                  </div>
                )}
              </div>

              {/* Name Area */}
              <div style={{ padding: '10px 14px' }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {bank.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </WizardStepLayout>
  );
}
