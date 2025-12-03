import { useState, useEffect } from 'react';
import { Block } from '../types/block';
import { COLORS, MODAL_STYLES, BUTTON_STYLES } from '../constants/styles';
import { CategoryDropdown } from './CategoryDropdown';

interface BlockFormProps {
  block?: Block | null;
  maxLevel: number;
  onSubmit: (block: Omit<Block, 'id'>) => void;
  onCancel: () => void;
  categories: string[];
}

export const BlockForm: React.FC<BlockFormProps> = ({
  block,
  maxLevel,
  onSubmit,
  onCancel,
  categories,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(0);
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setDescription(block.description);
      setLevel(block.level);
      setCategory(block.category || '');
    } else {
      setTitle('');
      setDescription('');
      setLevel(0);
      setCategory('');
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
      category: category || undefined,
    });

    // 폼 초기화
    setTitle('');
    setDescription('');
    setLevel(0);
    setCategory('');
  };

  return (
    <div
      style={{
        ...MODAL_STYLES.container,
        padding: '32px',
        minWidth: '480px',
        maxWidth: '600px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: COLORS.text.primary }}>
        {block ? '블록 수정' : '새 블록 추가'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text.secondary,
            }}
          >
            제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="블록 제목을 입력하세요..."
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              backgroundColor: COLORS.background.gray[50],
              color: COLORS.text.primary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.border.focus;
              e.target.style.backgroundColor = COLORS.background.white;
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = COLORS.border.default;
              e.target.style.backgroundColor = COLORS.background.gray[50];
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text.secondary,
            }}
          >
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="블록에 대한 설명을 입력하세요..."
            rows={4}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '12px',
              fontSize: '14px',
              resize: 'vertical',
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              backgroundColor: COLORS.background.gray[50],
              color: COLORS.text.primary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.border.focus;
              e.target.style.backgroundColor = COLORS.background.white;
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = COLORS.border.default;
              e.target.style.backgroundColor = COLORS.background.gray[50];
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text.secondary,
            }}
          >
            카테고리
          </label>
          <CategoryDropdown
            value={category}
            onChange={setCategory}
            options={categories}
            placeholder="카테고리를 선택하세요"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text.secondary,
            }}
          >
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
              padding: '14px 16px',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              backgroundColor: COLORS.background.gray[50],
              color: COLORS.text.primary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.border.focus;
              e.target.style.backgroundColor = COLORS.background.white;
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = COLORS.border.default;
              e.target.style.backgroundColor = COLORS.background.gray[50];
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={BUTTON_STYLES.secondary}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.background.gray[50];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.background.white;
            }}
          >
            취소
          </button>
          <button
            type="submit"
            style={BUTTON_STYLES.primary}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primaryHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primary;
            }}
          >
            {block ? '수정' : '추가'}
          </button>
        </div>
      </form>
    </div>
  );
};

