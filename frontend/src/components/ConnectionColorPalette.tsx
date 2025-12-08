import React, { useState } from 'react';
import { CONNECTION_COLOR_PALETTE } from '../constants/connectionColors';

interface ConnectionColorPaletteProps {
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  onColorAdd?: (color: string) => void;
  availableColors: string[];
}

export const ConnectionColorPalette: React.FC<ConnectionColorPaletteProps> = ({
  selectedColor,
  onColorSelect,
  onColorAdd,
  availableColors,
}) => {
  const [showPalettePicker, setShowPalettePicker] = useState(false);

  // 기본 팔레트에서 아직 추가되지 않은 색상들
  const unaddedColors = CONNECTION_COLOR_PALETTE.filter(
    color => !availableColors.includes(color)
  );

  const handleAddColor = (color: string) => {
    if (onColorAdd) {
      onColorAdd(color);
      setShowPalettePicker(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        position: 'relative',
      }}
      onMouseLeave={() => setShowPalettePicker(false)}
    >
      {/* 현재 사용 가능한 색상들 */}
      {availableColors.map((color) => (
        <button
          key={color}
          onClick={() => onColorSelect(color)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: color,
            border: selectedColor === color ? '3px solid #6366f1' : '2px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: selectedColor === color ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (selectedColor !== color) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedColor !== color) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          title={selectedColor === color ? '선택된 색상' : '색상 선택'}
        >
          {selectedColor === color && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      ))}

      {/* 플러스 버튼 - 색상 추가 */}
      {onColorAdd && unaddedColors.length > 0 && (
        <>
          <button
            onClick={() => setShowPalettePicker(!showPalettePicker)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '2px dashed #9ca3af',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.color = '#6366f1';
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="색상 추가"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* 색상 선택 팝업 */}
          {showPalettePicker && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                zIndex: 1000,
                minWidth: '240px',
                maxWidth: '280px',
              }}
            >
              {unaddedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleAddColor(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: '2px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title={`${color} 추가`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
