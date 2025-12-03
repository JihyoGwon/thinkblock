import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../constants/styles';

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = '카테고리 선택',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: `1px solid ${COLORS.border.default}`,
          borderRadius: '12px',
          fontSize: '14px',
          outline: 'none',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
          backgroundColor: COLORS.background.gray[50],
          color: value ? COLORS.text.primary : COLORS.text.muted,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = COLORS.border.focus;
          e.currentTarget.style.backgroundColor = COLORS.background.white;
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
        }}
        onBlur={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = COLORS.border.default;
            e.currentTarget.style.backgroundColor = COLORS.background.gray[50];
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <span style={{ flex: 1 }}>
          {value || (
            <span style={{ color: COLORS.text.muted }}>{placeholder}</span>
          )}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {value && (
            <span
              onClick={handleClear}
              style={{
                padding: '2px 6px',
                fontSize: '12px',
                color: COLORS.text.muted,
                cursor: 'pointer',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.background.gray[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ×
            </span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke={COLORS.text.secondary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: COLORS.background.white,
            border: `1px solid ${COLORS.border.default}`,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {options.length === 0 ? (
            <div
              style={{
                padding: '12px 16px',
                color: COLORS.text.muted,
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              옵션이 없습니다
            </div>
          ) : (
            options.map((option) => (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: COLORS.text.primary,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  backgroundColor: value === option ? COLORS.background.gray[50] : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (value !== option) {
                    e.currentTarget.style.backgroundColor = COLORS.background.gray[50];
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {option}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

