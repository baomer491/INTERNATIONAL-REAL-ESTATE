import React from 'react';
import { Check } from 'lucide-react';

interface StepDef {
  num: number;
  title: string;
  icon: React.ReactNode;
}

interface StepIndicatorProps {
  steps: StepDef[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  const totalSteps = steps.length;

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="wizard-step-indicator">
        {steps.map((step, i) => {
          const stepIndex = i + 1;
          const isActive = currentStep === stepIndex;
          const isCompleted = currentStep > stepIndex;
          const clickable = isCompleted || isActive;

          let pillClass = 'wizard-step-pill';
          if (isActive) pillClass += ' active';
          else if (isCompleted) pillClass += ' completed';

          return (
            <React.Fragment key={step.num}>
              <button
                className={pillClass}
                onClick={() => { if (clickable) onStepClick(stepIndex); }}
                style={{ cursor: clickable ? 'pointer' : 'default' }}
              >
                <span className="step-icon">
                  {isCompleted ? <Check size={14} /> : step.icon}
                </span>
                <span className="step-label">{step.title}</span>
              </button>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    minWidth: 16,
                    maxWidth: 40,
                    height: 2,
                    background: isCompleted ? 'var(--color-success)' : 'var(--color-border)',
                    borderRadius: 1,
                    transition: 'background 0.3s',
                    flexShrink: 0,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="wizard-progress-track">
        <div
          className="wizard-progress-fill"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
