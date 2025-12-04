import React, { ReactNode } from 'react';

interface TabsProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  children: ReactNode;
  isEditMode?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, children, isEditMode = false, onEditModeChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ display: 'flex' }}>
        <button
          onClick={() => onTabChange(0)}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 0 ? '600' : '400',
            color: activeTab === 0 ? '#6366f1' : '#6c757d',
            borderBottom: activeTab === 0 ? '2px solid #6366f1' : '2px solid transparent',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 0) {
              e.currentTarget.style.color = '#212529';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 0) {
              e.currentTarget.style.color = '#6c757d';
            }
          }}
        >
          피라미드 뷰
        </button>
        <button
          onClick={() => onTabChange(1)}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 1 ? '600' : '400',
            color: activeTab === 1 ? '#6366f1' : '#6c757d',
            borderBottom: activeTab === 1 ? '2px solid #6366f1' : '2px solid transparent',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 1) {
              e.currentTarget.style.color = '#212529';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 1) {
              e.currentTarget.style.color = '#6c757d';
            }
          }}
        >
          표 뷰
        </button>
        </div>
        {onEditModeChange && (
          <div
            style={{
              marginRight: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#6c757d',
                fontWeight: '500',
              }}
            >
              수정 모드
            </span>
            <button
              onClick={() => onEditModeChange(!isEditMode)}
              style={{
                position: 'relative',
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isEditMode ? '#6366f1' : '#e9ecef',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                padding: '0',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isEditMode) {
                  e.currentTarget.style.backgroundColor = '#d1d5db';
                }
              }}
              onMouseLeave={(e) => {
                if (!isEditMode) {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                }
              }}
              title={isEditMode ? '수정 모드 비활성화' : '수정 모드 활성화'}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: isEditMode ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              />
            </button>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

