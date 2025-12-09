/**
 * 프로젝트 헤더 컴포넌트
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../constants/styles';

interface Project {
  id: string;
  name: string;
}

interface ProjectHeaderProps {
  project: Project | null;
  onProjectNameUpdate: (name: string) => Promise<void>;
  onCategoryManagerOpen: () => void;
  onResetBlocks: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onProjectNameUpdate,
  onCategoryManagerOpen,
  onResetBlocks,
}) => {
  const navigate = useNavigate();
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState('');

  const handleProjectNameEdit = () => {
    if (!project) return;
    setEditingProjectName(project.name);
    setIsEditingProjectName(true);
  };

  const handleProjectNameSave = async () => {
    if (!editingProjectName.trim()) {
      setIsEditingProjectName(false);
      return;
    }

    try {
      await onProjectNameUpdate(editingProjectName.trim());
      setIsEditingProjectName(false);
    } catch (error) {
      // 에러는 상위 컴포넌트에서 처리됨
    }
  };

  const handleProjectNameCancel = () => {
    setIsEditingProjectName(false);
    setEditingProjectName('');
  };

  return (
    <header
      style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e9ecef',
        padding: '20px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isEditingProjectName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={editingProjectName}
                onChange={(e) => setEditingProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleProjectNameSave();
                  } else if (e.key === 'Escape') {
                    handleProjectNameCancel();
                  }
                }}
                autoFocus
                style={{
                  fontSize: '22px',
                  fontWeight: '600',
                  color: '#212529',
                  border: `1px solid ${COLORS.primary}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  outline: 'none',
                  minWidth: '200px',
                }}
              />
              <button
                onClick={handleProjectNameSave}
                style={{
                  padding: '4px 12px',
                  border: `1px solid ${COLORS.primary}`,
                  borderRadius: '6px',
                  backgroundColor: COLORS.primary,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                저장
              </button>
              <button
                onClick={handleProjectNameCancel}
                style={{
                  padding: '4px 12px',
                  border: `1px solid ${COLORS.border.default}`,
                  borderRadius: '6px',
                  backgroundColor: COLORS.background.white,
                  color: COLORS.text.secondary,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                취소
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                onClick={() => navigate('/projects')}
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: '600',
                  color: '#212529',
                  cursor: 'pointer',
                }}
              >
                {project?.name || 'ThinkBlock'}
              </h1>
              {project && (
                <button
                  onClick={handleProjectNameEdit}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: COLORS.text.muted,
                    fontSize: '14px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.text.muted;
                  }}
                  title="프로젝트명 수정"
                >
                  ✏️
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{
              padding: '8px 16px',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '8px',
              backgroundColor: COLORS.background.white,
              color: COLORS.text.secondary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            프로젝트 목록
          </button>
          <button
            onClick={onCategoryManagerOpen}
            style={{
              padding: '8px 16px',
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '8px',
              backgroundColor: COLORS.background.white,
              color: COLORS.text.secondary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.background.gray[50];
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.color = COLORS.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.background.white;
              e.currentTarget.style.borderColor = COLORS.border.default;
              e.currentTarget.style.color = COLORS.text.secondary;
            }}
          >
            카테고리 관리
          </button>
          <button
            onClick={onResetBlocks}
            style={{
              padding: '8px 16px',
              border: `1px solid ${COLORS.danger}`,
              borderRadius: '8px',
              backgroundColor: COLORS.background.white,
              color: COLORS.danger,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fff5f5';
              e.currentTarget.style.borderColor = COLORS.danger;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.background.white;
              e.currentTarget.style.borderColor = COLORS.danger;
            }}
          >
            초기화
          </button>
        </div>
      </div>
    </header>
  );
};

