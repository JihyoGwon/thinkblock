import React, { useState, useRef, useEffect } from 'react';

interface BlockInputProps {
  onSubmit: (title: string) => void;
  onAIClick?: () => void;
  projectId?: string; // 향후 사용 예정
}

export const BlockInput: React.FC<BlockInputProps> = ({ onSubmit, onAIClick, projectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) {
      setIsOpen(false);
      setTitle('');
      return;
    }

    onSubmit(title.trim());
    setTitle('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setTitle('');
    }
  };


  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: isOpen ? '12px' : '0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {onAIClick && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAIMenu(!showAIMenu)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: showAIMenu ? '#059669' : '#10b981',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                }}
                onMouseEnter={(e) => {
                  if (!showAIMenu) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showAIMenu) {
                    e.currentTarget.style.backgroundColor = '#10b981';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                title="AI 도움말"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ stroke: 'white', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}
                >
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <rect x="7" y="14" width="4" height="4" rx="1" />
                  <rect x="13" y="14" width="4" height="4" rx="1" />
                  <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  <circle cx="9" cy="11" r="1" fill="white" />
                  <circle cx="15" cy="11" r="1" fill="white" />
                  <path d="M12 5v3" />
                </svg>
              </button>
              
              {showAIMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #e9ecef',
                    minWidth: '160px',
                    zIndex: 1000,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => {
                      setShowAIMenu(false);
                      onAIClick();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#212529',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    블록 생성
                  </button>
                  <button
                    onClick={() => {
                      setShowAIMenu(false);
                      // 블록 배치는 나중에 구현
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#212529',
                      transition: 'background-color 0.2s',
                      borderTop: '1px solid #e9ecef',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    블록 배치
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: isOpen ? '#6c757d' : '#6366f1',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isOpen ? '#5a6268' : '#4f46e5';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isOpen ? '#6c757d' : '#6366f1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isOpen ? '×' : '+'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            animation: 'fadeIn 0.2s ease-in',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="블록 제목을 입력하세요..."
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.2s',
              backgroundColor: 'white',
              color: '#212529',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.boxShadow = 'none';
              // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록
              setTimeout(() => {
                handleSubmit();
              }, 200);
            }}
          />
        </div>
      )}
    </div>
  );
};

