import React from 'react';
import { Block as BlockType } from '../types/block';
import { COLORS } from '../constants/styles';

interface TableViewProps {
  blocks: BlockType[];
  onBlockEdit: (block: BlockType) => void;
  onBlockDelete: (blockId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  blocks,
  onBlockEdit,
  onBlockDelete,
}) => {
  // 레벨별로 정렬 (높은 레벨부터)
  const sortedBlocks = [...blocks].sort((a, b) => {
    if (a.level !== b.level) {
      return b.level - a.level; // 높은 레벨이 먼저
    }
    return a.order - b.order;
  });

  const getLevelLabel = (level: number) => {
    if (level < 0) return '미배치';
    if (level === 0) return '기반';
    return `Level ${level}`;
  };

  const getLevelColor = (level: number) => {
    if (level < 0) return COLORS.text.muted;
    if (level === 0) return COLORS.success;
    return COLORS.primary;
  };

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: COLORS.background.white,
        padding: '24px',
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.background.white,
          borderRadius: '12px',
          border: `1px solid ${COLORS.border.default}`,
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: COLORS.background.gray[50],
                borderBottom: `2px solid ${COLORS.border.default}`,
              }}
            >
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: COLORS.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                레벨
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: COLORS.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                제목
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: COLORS.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                카테고리
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: COLORS.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                설명
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: COLORS.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: '80px',
                }}
              >
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBlocks.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: COLORS.text.muted,
                    fontSize: '14px',
                  }}
                >
                  블록이 없습니다. 블록을 추가해주세요.
                </td>
              </tr>
            ) : (
              sortedBlocks.map((block, index) => (
                <tr
                  key={block.id}
                  style={{
                    borderBottom: `1px solid ${COLORS.border.default}`,
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.background.gray[50];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.background.white;
                  }}
                  onDoubleClick={() => onBlockEdit(block)}
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: getLevelColor(block.level),
                    }}
                  >
                    {getLevelLabel(block.level)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: COLORS.text.primary,
                      fontWeight: '500',
                    }}
                  >
                    {block.title}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}
                  >
                    {block.category ? (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: COLORS.primary,
                          backgroundColor: '#eef2ff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'inline-block',
                        }}
                      >
                        {block.category}
                      </span>
                    ) : (
                      <span style={{ color: COLORS.text.muted, fontStyle: 'italic' }}>
                        없음
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: COLORS.text.secondary,
                    }}
                  >
                    {block.description || (
                      <span style={{ color: COLORS.text.muted, fontStyle: 'italic' }}>
                        설명 없음
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockDelete(block.id);
                      }}
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
                      title="삭제"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

