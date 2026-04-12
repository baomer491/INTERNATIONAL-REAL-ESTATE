import React from 'react';

interface SelectionGridProps {
  items: { value: string; label: string; icon?: React.ReactNode }[];
  selected: string;
  onSelect: (value: string) => void;
  minItemWidth?: number;
  big?: boolean;
}

export default function SelectionGrid({ items, selected, onSelect, minItemWidth = 140, big }: SelectionGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`,
        gap: big ? 16 : 10,
      }}
    >
      {items.map((item) => {
        const isSelected = selected === item.value;
        if (big) {
          return (
            <button
              key={item.value}
              onClick={() => onSelect(item.value)}
              className={`wizard-big-card${isSelected ? ' selected' : ''}`}
            >
              <div className="card-icon">{item.icon}</div>
              <div className="card-title">{item.label}</div>
            </button>
          );
        }
        return (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            className={`wizard-selection-card${isSelected ? ' selected' : ''}`}
          >
            {item.icon && <span style={{ marginLeft: 6 }}>{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
