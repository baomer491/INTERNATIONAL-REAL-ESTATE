'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 360, padding: 24, direction: 'rtl', fontFamily: 'inherit',
        }}>
          <div className="card-elevated animate-scale-in" style={{
            textAlign: 'center',
            maxWidth: 480, width: '100%',
            padding: '44px 36px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative top accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-accent) 100%)',
            }} />

            {/* Icon */}
            <div style={{
              width: 72, height: 72, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-danger-bg) 0%, rgba(244,63,94,0.08) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 4px 12px rgba(244,63,94,0.12)',
            }}>
              <AlertTriangle size={32} color="var(--color-danger)" strokeWidth={1.8} />
            </div>

            <h2 style={{
              fontSize: 20, fontWeight: 800,
              color: 'var(--color-text)', margin: '0 0 10px',
              letterSpacing: '-0.01em',
            }}>
              حدث خطأ غير متوقع
            </h2>
            <p style={{
              fontSize: 15, color: 'var(--color-text-secondary)',
              margin: '0 0 8px', lineHeight: 1.7,
            }}>
              {this.state.error?.message || 'يرجى تحديث الصفحة أو المحاولة لاحقاً'}
            </p>
            <p style={{
              fontSize: 13, color: 'var(--color-text-muted)',
              margin: '0 0 28px',
            }}>
              إذا استمرت المشكلة، تواصل مع فريق الدعم الفني
            </p>

            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ minWidth: 160, justifyContent: 'center' }}
            >
              <RefreshCw size={17} />
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
