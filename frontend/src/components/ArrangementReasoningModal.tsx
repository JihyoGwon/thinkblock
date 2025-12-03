import React from 'react';
import { COLORS, MODAL_STYLES, BUTTON_STYLES } from '../constants/styles';

interface ArrangementReasoningModalProps {
  reasoning: string;
  onClose: () => void;
}

export const ArrangementReasoningModal: React.FC<ArrangementReasoningModalProps> = ({
  reasoning,
  onClose,
}) => {
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
          AI 블록 배치 이유
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
          {reasoning || '배치 이유가 제공되지 않았습니다.'}
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

