import React, { ReactNode } from 'react';
import { Mode } from '../types/common';
import { ConnectionColorPalette } from './ConnectionColorPalette';

interface TabsProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  children: ReactNode;
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
  // 연결선 색상 팔레트 관련 props
  connectionColorPalette?: string[];
  selectedConnectionColor?: string | null;
  onColorSelect?: (color: string) => void;
  onColorAdd?: (color: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ 
  activeTab, 
  onTabChange, 
  children, 
  mode = 'view', 
  onModeChange,
  connectionColorPalette = [],
  selectedConnectionColor = null,
  onColorSelect,
  onColorAdd,
}) => {
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
        {onModeChange && (
          <div
            style={{
              marginRight: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {/* 눈 아이콘 - 보기 모드 */}
            <button
              onClick={() => onModeChange('view')}
              style={{
                padding: '8px',
                border: 'none',
                backgroundColor: mode === 'view' ? '#6366f1' : 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mode === 'view' ? '#ffffff' : '#6c757d',
              }}
              onMouseEnter={(e) => {
                if (mode !== 'view') {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (mode !== 'view') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              title="보기 모드"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            
            {/* 손 아이콘 - 드래그 모드 */}
            <button
              onClick={() => onModeChange('drag')}
              style={{
                padding: '8px',
                border: 'none',
                backgroundColor: mode === 'drag' ? '#6366f1' : 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mode === 'drag' ? '#ffffff' : '#6c757d',
              }}
              onMouseEnter={(e) => {
                if (mode !== 'drag') {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (mode !== 'drag') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              title="드래그 모드"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>
                <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/>
                <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/>
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
              </svg>
            </button>
            
            {/* 연결선 아이콘 - 연결 모드 */}
            <button
              onClick={() => onModeChange('connection')}
              style={{
                padding: '8px',
                border: 'none',
                backgroundColor: mode === 'connection' ? '#6366f1' : 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mode === 'connection' ? '#ffffff' : '#6c757d',
              }}
              onMouseEnter={(e) => {
                if (mode !== 'connection') {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (mode !== 'connection') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              title="연결선 모드"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="19" cy="5" r="2"/>
                <circle cx="5" cy="19" r="2"/>
                <path d="M5 17A12 12 0 0 1 17 5"/>
              </svg>
            </button>
            
            {/* 연결선 색상 팔레트 - 연결선 모드일 때만 표시 */}
            {mode === 'connection' && (
              <ConnectionColorPalette
                selectedColor={selectedConnectionColor}
                onColorSelect={onColorSelect || (() => {})}
                onColorAdd={onColorAdd || (() => {})}
                availableColors={connectionColorPalette.length > 0 ? connectionColorPalette : ['#6366f1']}
              />
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

