import React, { useState, useEffect, useRef } from 'react';
import { Block } from '../types/block';

interface BlockDescriptionModalProps {
  block: Block;
  onSave: (blockId: string, description: string) => void;
  onClose: () => void;
}

export const BlockDescriptionModal: React.FC<BlockDescriptionModalProps> = ({
  block,
  onSave,
  onClose,
}) => {
  const [description, setDescription] = useState(block.description);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, []);

  const handleSave = () => {
    onSave(block.id, description);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          zIndex: 1000,
          minWidth: '520px',
          maxWidth: '720px',
          border: '1px solid #e9ecef',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#212529' }}>
          {block.title}
        </h2>
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#666',
            }}
          >
            설명
          </label>
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="블록에 대한 설명을 입력하세요..."
            rows={8}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              fontSize: '14px',
              resize: 'vertical',
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              backgroundColor: '#f8f9fa',
              color: '#212529',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.backgroundColor = 'white';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #e9ecef',
              borderRadius: '10px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#495057',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: '#6366f1',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366f1';
            }}
          >
            저장
          </button>
        </div>
        <div
          style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#999',
            textAlign: 'right',
          }}
        >
          Ctrl+Enter로 저장, Esc로 취소
        </div>
      </div>
    </>
  );
};

