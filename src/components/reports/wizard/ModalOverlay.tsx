import React from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalOverlayProps {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}

export default function ModalOverlay({ children, onClose, wide }: ModalOverlayProps) {
  return (
    <div className="wizard-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wizard-modal-content" style={wide ? { maxWidth: 720 } : undefined}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--color-text-muted)',
          }}
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
