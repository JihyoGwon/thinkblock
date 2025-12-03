import React, { useState } from 'react';
import { COLORS, MODAL_STYLES, BUTTON_STYLES } from '../constants/styles';
import { Block } from '../types/block';
import { api } from '../services/api';

interface AIArrangeBlocksModalProps {
  projectId: string;
  blocks: Block[];
  onClose: () => void;
  onSuccess: (reasoning?: string) => void;
}

export const AIArrangeBlocksModal: React.FC<AIArrangeBlocksModalProps> = ({
  projectId,
  blocks,
  onClose,
  onSuccess,
}) => {
  // 모든 블록을 배치 대상으로 표시 (이미 배치된 블록도 포함)
  const allBlocks = blocks;
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
    new Set(allBlocks.map((block) => block.id))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBlockSelection = (blockId: string) => {
    const newSelected = new Set(selectedBlockIds);
    if (newSelected.has(blockId)) {
      newSelected.delete(blockId);
    } else {
      newSelected.add(blockId);
    }
    setSelectedBlockIds(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedBlockIds.size === 0) {
      setError('배치할 블록을 최소 1개 이상 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.arrangeBlocks(projectId, Array.from(selectedBlockIds));
      
      setLoading(false);
      // API 응답에서 배치 이유 추출
      const reasoning = (result as any).reasoning || '';
      console.log('🔍 배치 이유 추출:', reasoning ? `${reasoning.length} 문자` : '없음');
      onSuccess(reasoning);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || '블록 배치에 실패했습니다.');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit();
  };

  return (
    <>
      <div style={MODAL_STYLES.overlay} onClick={onClose} />
      <div
        style={{
          ...MODAL_STYLES.container,
          padding: '32px',
          minWidth: '600px',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: COLORS.text.primary }}>
          AI 블록 배치
        </h2>

        {error && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#fff5f5',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: COLORS.danger,
              fontSize: '14px',
            }}
          >
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>오류 발생</div>
            <div style={{ marginBottom: '12px' }}>{error}</div>
            <button
              onClick={handleRetry}
              style={{
                ...BUTTON_STYLES.primary,
                padding: '6px 12px',
                fontSize: '12px',
              }}
            >
              재시도
            </button>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: COLORS.text.secondary }}>
            AI가 블록들의 우선순위와 의존성을 분석하여 적절한 레벨에 자동으로 배치합니다.
          </p>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: COLORS.text.secondary }}>
            배치할 블록을 선택해주세요 (이미 배치된 블록도 재배치 가능):
          </p>
        </div>

        {allBlocks.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: COLORS.text.secondary,
              fontSize: '14px',
              backgroundColor: COLORS.background.gray[50],
              borderRadius: '8px',
              border: '1px dashed #e9ecef',
            }}
          >
            배치할 블록이 없습니다.
          </div>
        ) : (
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: COLORS.background.gray[50],
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allBlocks.map((block) => {
                const isAssigned = block.level >= 0;
                return (
                  <label
                    key={block.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: selectedBlockIds.has(block.id) ? COLORS.background.white : 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: `1px solid ${selectedBlockIds.has(block.id) ? COLORS.primary : 'transparent'}`,
                      transition: 'all 0.2s',
                      opacity: selectedBlockIds.has(block.id) ? 1 : 0.7,
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedBlockIds.has(block.id)) {
                        e.currentTarget.style.backgroundColor = COLORS.background.white;
                        e.currentTarget.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedBlockIds.has(block.id)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.opacity = '0.7';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBlockIds.has(block.id)}
                      onChange={() => toggleBlockSelection(block.id)}
                      style={{
                        marginTop: '2px',
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: COLORS.text.primary }}>
                          {block.title}
                        </div>
                        {isAssigned && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              color: '#10b981',
                              backgroundColor: '#d1fae5',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            레벨 {block.level}
                          </span>
                        )}
                      </div>
                      {block.category && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#6366f1',
                            backgroundColor: '#eef2ff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            marginRight: '8px',
                          }}
                        >
                          {block.category}
                        </span>
                      )}
                      {block.description && (
                        <div style={{ fontSize: '12px', color: COLORS.text.secondary, marginTop: '4px', lineHeight: '1.4' }}>
                          {block.description.substring(0, 100)}
                          {block.description.length > 100 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              ...BUTTON_STYLES.secondary,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || selectedBlockIds.size === 0}
            style={{
              ...BUTTON_STYLES.primary,
              opacity: loading || selectedBlockIds.size === 0 ? 0.5 : 1,
              cursor: loading || selectedBlockIds.size === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '배치 중...' : '블록 배치'}
          </button>
        </div>
      </div>
    </>
  );
};

