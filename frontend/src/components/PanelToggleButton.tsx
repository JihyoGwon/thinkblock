import React from 'react';

interface PanelToggleButtonProps {
  isCollapsed: boolean;
  leftPosition: number;
  onToggle: () => void;
}

export const PanelToggleButton: React.FC<PanelToggleButtonProps> = ({
  isCollapsed,
  leftPosition,
  onToggle,
}) => {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'absolute',
        left: isCollapsed ? '0' : `${leftPosition}px`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '32px',
        height: '64px',
        backgroundColor: '#ffffff',
        border: '1px solid #e9ecef',
        borderLeft: isCollapsed ? '1px solid #e9ecef' : 'none',
        borderRadius: isCollapsed ? '0 8px 8px 0' : '8px 0 0 8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'left 0.3s ease, border-radius 0.3s ease',
        zIndex: 10,
      }}
      title={isCollapsed ? '블록 목록 펼치기' : '블록 목록 접기'}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
        }}
      >
        <path
          d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
          fill="#495057"
        />
      </svg>
    </button>
  );
};

