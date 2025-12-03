import React, { useState, useEffect } from 'react';
import { COLORS, MODAL_STYLES, BUTTON_STYLES } from '../constants/styles';

interface CategoryManagerProps {
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onCategoriesChange,
  onClose,
}) => {
  const [editingCategories, setEditingCategories] = useState<string[]>(categories);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    setEditingCategories(categories);
  }, [categories]);

  const handleAddCategory = () => {
    if (newCategory.trim() && !editingCategories.includes(newCategory.trim())) {
      setEditingCategories([...editingCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (index: number) => {
    setEditingCategories(editingCategories.filter((_, i) => i !== index));
  };

  const handleUpdateCategory = (index: number, value: string) => {
    const updated = [...editingCategories];
    updated[index] = value;
    setEditingCategories(updated);
  };

  const handleSave = () => {
    onCategoriesChange(editingCategories);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index?: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index !== undefined) {
        // 수정 중인 카테고리 저장
        const input = e.currentTarget;
        input.blur();
      } else {
        // 새 카테고리 추가
        handleAddCategory();
      }
    }
  };

  return (
    <div
      style={{
        ...MODAL_STYLES.container,
        padding: '32px',
        minWidth: '500px',
        maxWidth: '600px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: COLORS.text.primary }}>
        카테고리 관리
      </h2>

      {/* 새 카테고리 추가 */}
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
          새 카테고리 추가
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="카테고리 이름을 입력하세요..."
            style={{
              flex: 1,
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
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={!newCategory.trim() || editingCategories.includes(newCategory.trim())}
            style={{
              ...BUTTON_STYLES.primary,
              padding: '14px 20px',
              opacity: !newCategory.trim() || editingCategories.includes(newCategory.trim()) ? 0.5 : 1,
              cursor: !newCategory.trim() || editingCategories.includes(newCategory.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            추가
          </button>
        </div>
      </div>

      {/* 카테고리 목록 */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: COLORS.text.secondary,
          }}
        >
          카테고리 목록 ({editingCategories.length}개)
        </label>
        <div
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: `1px solid ${COLORS.border.default}`,
            borderRadius: '12px',
            padding: '8px',
            backgroundColor: COLORS.background.gray[50],
          }}
        >
          {editingCategories.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: COLORS.text.muted,
                fontSize: '14px',
              }}
            >
              카테고리가 없습니다
            </div>
          ) : (
            editingCategories.map((category, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  backgroundColor: COLORS.background.white,
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.border.default}`,
                }}
              >
                <input
                  type="text"
                  value={category}
                  onChange={(e) => handleUpdateCategory(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: COLORS.text.primary,
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = COLORS.background.gray[50];
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(index)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: COLORS.danger,
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s',
                    opacity: 0.6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff5f5';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '0.6';
                  }}
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
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
          type="button"
          onClick={handleSave}
          style={BUTTON_STYLES.primary}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primary;
          }}
        >
          저장
        </button>
      </div>
    </div>
  );
};

