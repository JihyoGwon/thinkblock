import React, { useState, useEffect, useRef } from 'react';
import { COLORS, MODAL_STYLES, BUTTON_STYLES } from '../constants/styles';
import { api } from '../services/api';
import { logger } from '../utils/logger';

interface AIFeedbackModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AIFeedbackModal: React.FC<AIFeedbackModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    // 이미 생성했으면 다시 생성하지 않음 (React Strict Mode 대응)
    if (!hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      handleGenerateFeedback();
    }
  }, []);

  const handleGenerateFeedback = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getFeedback(projectId);
      logger.debug('생성된 피드백:', result);
      
      setFeedback(result.feedback || '피드백을 생성할 수 없습니다.');
      setLoading(false);
      // onSuccess는 모달이 닫힐 때 호출하도록 변경 (확인 버튼 클릭 시)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || '피드백 생성에 실패했습니다.');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleGenerateFeedback();
  };

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
          AI 피드백
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

        {loading && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: COLORS.text.secondary,
              fontSize: '14px',
            }}
          >
            AI가 블록 배치를 분석하고 피드백을 생성하는 중...
          </div>
        )}

        {!loading && feedback && (
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
            {feedback}
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              // 모달을 먼저 닫고, 그 다음에 성공 콜백 호출 (상태 업데이트로 인한 리렌더링 방지)
              onClose();
              // 다음 틱에서 실행하여 모달이 완전히 닫힌 후 상태 업데이트
              setTimeout(() => {
                if (!loading && feedback) {
                  onSuccess();
                }
              }, 0);
            }}
            disabled={loading}
            style={{
              ...BUTTON_STYLES.primary,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '생성 중...' : '확인'}
          </button>
        </div>
      </div>
    </>
  );
};

