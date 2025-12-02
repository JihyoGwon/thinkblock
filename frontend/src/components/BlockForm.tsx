import React, { useState, useEffect } from 'react';
import { Block } from '../types/block';

interface BlockFormProps {
  block?: Block | null;
  maxLevel: number;
  onSubmit: (block: Omit<Block, 'id'>) => void;
  onCancel: () => void;
}

export const BlockForm: React.FC<BlockFormProps> = ({
  block,
  maxLevel,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setDescription(block.description);
      setLevel(block.level);
    } else {
      setTitle('');
      setDescription('');
      setLevel(0);
    }
  }, [block]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      level,
      order: 0, // 임시값, 서버에서 계산
    });

    // 폼 초기화
    setTitle('');
    setDescription('');
    setLevel(0);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '400px',
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        {block ? '블록 수정' : '새 블록 추가'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            레벨 (0: 기반, {maxLevel}: 목표)
          </label>
          <input
            type="number"
            min="0"
            max={maxLevel}
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#1976d2',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {block ? '수정' : '추가'}
          </button>
        </div>
      </form>
    </div>
  );
};

