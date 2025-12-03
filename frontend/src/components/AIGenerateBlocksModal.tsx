import React, { useState } from 'react';
import { COLORS, MODAL_STYLES, BUTTON_STYLES } from '../constants/styles';
import { api } from '../services/api';

interface AIGenerateBlocksModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AIGenerateBlocksModal: React.FC<AIGenerateBlocksModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const [projectOverview, setProjectOverview] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [problems, setProblems] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!projectOverview.trim() || !currentStatus.trim() || !problems.trim()) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const blocks = await api.generateBlocks(
        projectId,
        projectOverview.trim(),
        currentStatus.trim(),
        problems.trim(),
        additionalInfo.trim()
      );
      
      console.log('생성된 블록:', blocks);
      
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || '블록 생성에 실패했습니다.');
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
          AI 블록 생성
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
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text.secondary,
            }}
          >
            프로젝트 개요 <span style={{ color: COLORS.danger }}>*</span>
          </label>
          <textarea
            value={projectOverview}
            onChange={(e) => setProjectOverview(e.target.value)}
            placeholder="프로젝트의 목적, 범위, 주요 기능 등을 설명해주세요."
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              backgroundColor: COLORS.background.gray[50],
              color: COLORS.text.primary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.primary;
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
            현재 진행 상황 <span style={{ color: COLORS.danger }}>*</span>
          </label>
          <textarea
            value={currentStatus}
            onChange={(e) => setCurrentStatus(e.target.value)}
            placeholder="현재까지 완료된 작업, 진행 중인 작업 등을 설명해주세요."
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              backgroundColor: COLORS.background.gray[50],
              color: COLORS.text.primary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.primary;
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
            문제점/병목지점 <span style={{ color: COLORS.danger }}>*</span>
          </label>
          <textarea
            value={problems}
            onChange={(e) => setProblems(e.target.value)}
            placeholder="현재 겪고 있는 문제나 병목지점을 설명해주세요."
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              backgroundColor: COLORS.background.gray[50],
              color: COLORS.text.primary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.primary;
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
            기타 참고 사항
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="추가로 참고할 만한 정보가 있다면 입력해주세요. (선택사항)"
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              backgroundColor: COLORS.background.gray[50],
              color: COLORS.text.primary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.primary;
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
            disabled={loading || !projectOverview.trim() || !currentStatus.trim() || !problems.trim()}
            style={{
              ...BUTTON_STYLES.primary,
              opacity: loading || !projectOverview.trim() || !currentStatus.trim() || !problems.trim() ? 0.5 : 1,
              cursor: loading || !projectOverview.trim() || !currentStatus.trim() || !problems.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '생성 중...' : '블록 생성'}
          </button>
        </div>
      </div>
    </>
  );
};

