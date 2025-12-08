import React, { useState } from 'react';

interface ConnectionColorPaletteProps {
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  onColorAdd: (color: string) => void;
  availableColors: string[];
}

export const ConnectionColorPalette: React.FC<ConnectionColorPaletteProps> = ({
  selectedColor,
  onColorSelect,
  onColorAdd,
  availableColors,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempColor, setTempColor] = useState('#6366f1');

  const handleAddColor = () => {
    if (tempColor && !availableColors.includes(tempColor)) {
      onColorAdd(tempColor);
      setShowColorPicker(false);
      setTempColor('#6366f1');
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
      }}
    >
      {/* 기존 색상들 */}
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
      {!showColorPicker ? (
        <button
          onClick={() => setShowColorPicker(true)}
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
          title="새 색상 추가"
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
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* 색상 선택기 */}
          <input
            type="color"
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          />
          {/* 확인 버튼 */}
          <button
            onClick={handleAddColor}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              color: '#10b981',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            title="색상 추가"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          {/* 취소 버튼 */}
          <button
            onClick={() => {
              setShowColorPicker(false);
              setTempColor('#6366f1');
            }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            title="취소"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

