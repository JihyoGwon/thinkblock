import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, MODAL_STYLES, BUTTON_STYLES } from '../constants/styles';
import { getCategoryColor, CATEGORY_COLORS } from '../utils/categoryColors';

interface CategoryManagerProps {
  categories: string[];
  categoryColors?: Record<string, { bg: string; text: string }>;
  onCategoriesChange: (categories: string[]) => void;
  onCategoryColorsChange?: (colors: Record<string, { bg: string; text: string }>) => void;
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  categoryColors = {},
  onCategoriesChange,
  onCategoryColorsChange,
  onClose,
}) => {
  const [editingCategories, setEditingCategories] = useState<string[]>(categories);
  const [editingCategoryColors, setEditingCategoryColors] = useState<Record<string, { bg: string; text: string }>>(categoryColors);
  const [newCategory, setNewCategory] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setEditingCategories(categories);
  }, [categories]);

  useEffect(() => {
    setEditingCategoryColors(categoryColors);
  }, [categoryColors]);


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

  const handleColorButtonClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (colorPickerOpen === index) {
      setColorPickerOpen(null);
      setPopupPosition(null);
    } else {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const popupWidth = 180;
      const popupHeight = 200;
      const spacing = 8;
      
      // 버튼 바로 아래에 표시
      let top = rect.bottom + spacing;
      // 버튼의 오른쪽에 맞춰서 표시
      let left = rect.right - popupWidth;
      
      // 화면 오른쪽을 벗어나면 버튼 왼쪽에 표시
      if (left < 0) {
        left = rect.left;
      }
      
      // 화면 하단을 벗어나면 버튼 위에 표시
      if (top + popupHeight > window.innerHeight) {
        top = rect.top - popupHeight - spacing;
        // 위로도 벗어나면 화면 상단에 붙여서 표시
        if (top < 0) {
          top = spacing;
        }
      }
      
      setPopupPosition({ top, left });
      setColorPickerOpen(index);
    }
  };

  const handleColorSelect = (categoryIndex: number, color: { bg: string; text: string }) => {
    const category = editingCategories[categoryIndex];
    if (!category) return;
    
    const updated = { ...editingCategoryColors };
    updated[category] = color;
    setEditingCategoryColors(updated);
    setColorPickerOpen(null);
    setPopupPosition(null);
  };

  const handleColorReset = (categoryIndex: number) => {
    const category = editingCategories[categoryIndex];
    if (!category) return;
    
    const updated = { ...editingCategoryColors };
    delete updated[category];
    setEditingCategoryColors(updated);
    setColorPickerOpen(null);
    setPopupPosition(null);
  };

  const handleSave = () => {
    onCategoriesChange(editingCategories);
    if (onCategoryColorsChange) {
      onCategoryColorsChange(editingCategoryColors);
    }
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
            editingCategories.map((category, index) => {
              const currentColor = editingCategoryColors[category] || getCategoryColor(category);
              
              return (
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
                    position: 'relative',
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
                  {/* 색상 선택 버튼 */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => handleColorButtonClick(index, e)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: `2px solid ${COLORS.border.default}`,
                        backgroundColor: currentColor.bg,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = COLORS.primary;
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = COLORS.border.default;
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          color: currentColor.text,
                          fontWeight: '600',
                        }}
                      >
                        ●
                      </span>
                    </button>
                  </div>
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
              );
            })
          )}
        </div>
      </div>

      {/* 색상 팔레트 - Portal을 사용해서 body에 직접 렌더링 (스크롤 영역에 가려지지 않음) */}
      {colorPickerOpen !== null && popupPosition && createPortal(
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1001,
            }}
            onClick={() => {
              setColorPickerOpen(null);
              setPopupPosition(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              backgroundColor: COLORS.background.white,
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1002,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              minWidth: '160px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {CATEGORY_COLORS.map((color, colorIndex) => (
              <button
                key={colorIndex}
                type="button"
                onClick={() => handleColorSelect(colorPickerOpen, color)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `2px solid ${
                    (editingCategoryColors[editingCategories[colorPickerOpen]] || getCategoryColor(editingCategories[colorPickerOpen])).bg === color.bg &&
                    (editingCategoryColors[editingCategories[colorPickerOpen]] || getCategoryColor(editingCategories[colorPickerOpen])).text === color.text
                      ? COLORS.primary
                      : COLORS.border.default
                  }`,
                  backgroundColor: color.bg,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: color.text,
                    fontWeight: '600',
                  }}
                >
                  ●
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleColorReset(colorPickerOpen)}
              style={{
                gridColumn: '1 / -1',
                padding: '6px 12px',
                marginTop: '4px',
                border: `1px solid ${COLORS.border.default}`,
                borderRadius: '6px',
                backgroundColor: COLORS.background.gray[50],
                color: COLORS.text.secondary,
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.background.gray[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.background.gray[50];
              }}
            >
              기본 색상으로 재설정
            </button>
          </div>
        </>,
        document.body
      )}

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

