import React, { ReactNode } from 'react';

interface TabsProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  children: ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: '#ffffff',
        }}
      >
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
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

