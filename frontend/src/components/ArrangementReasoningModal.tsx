import React from 'react';
import { COLORS, MODAL_STYLES, BUTTON_STYLES } from '../constants/styles';

interface ArrangementReasoningModalProps {
  reasoning: string;
  onClose: () => void;
}

// JSON 형식 파싱 및 타입 추출
const parseReasoning = (reasoning: string): { type: string; content: string } => {
  if (!reasoning) {
    return { type: 'arrangement', content: '' };
  }
  
  try {
    // JSON 형식인지 확인
    const parsed = JSON.parse(reasoning);
    if (parsed && typeof parsed === 'object' && 'type' in parsed && 'content' in parsed) {
      return {
        type: parsed.type || 'arrangement',
        content: parsed.content || ''
      };
    }
  } catch (e) {
    // JSON 파싱 실패 시 기존 문자열로 간주 (arrangement 타입)
  }
  
  // 기존 문자열 형식인 경우 arrangement로 간주
  return { type: 'arrangement', content: reasoning };
};

export const ArrangementReasoningModal: React.FC<ArrangementReasoningModalProps> = ({
  reasoning,
  onClose,
}) => {
  const { type, content } = parseReasoning(reasoning);
  
  // 제목은 항상 "AI 피드백"으로 통일
  const title = 'AI 피드백';
  
  return (
    <>
      <div style={MODAL_STYLES.overlay} onClick={onClose} />
      <div
        style={{
          ...MODAL_STYLES.container,
          padding: '32px',
          minWidth: '600px',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: COLORS.text.primary }}>
          {title}
        </h2>

        <div
          style={{
            padding: '20px',
            backgroundColor: COLORS.background.gray[50],
            borderRadius: '12px',
            border: `1px solid ${COLORS.border.default}`,
            fontSize: '14px',
            lineHeight: '1.8',
            color: COLORS.text.primary,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content || (type === 'feedback' ? '피드백이 제공되지 않았습니다.' : '배치 이유가 제공되지 않았습니다.')}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={BUTTON_STYLES.primary}
          >
            확인
          </button>
        </div>
      </div>
    </>
  );
};

