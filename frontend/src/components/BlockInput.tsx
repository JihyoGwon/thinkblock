import React, { useState, useRef, useEffect } from 'react';

interface BlockInputProps {
  onSubmit: (title: string) => void;
}

export const BlockInput: React.FC<BlockInputProps> = ({ onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleBlur = () => {
    // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록
    setTimeout(() => {
      handleSubmit();
    }, 200);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#333', flex: 1 }}>
            블록 추가
          </h2>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#1976d2',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1565c0';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1976d2';
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
            onBlur={handleBlur}
            placeholder="블록 제목을 입력하세요..."
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #1976d2',
              borderRadius: '6px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>
      )}
    </div>
  );
};

