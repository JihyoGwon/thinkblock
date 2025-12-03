import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { COLORS, BUTTON_STYLES } from '../constants/styles';

interface Project {
  id: string;
  name: string;
  createdAt?: any;
  updatedAt?: any;
}

export const ProjectSelector: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const project = await api.createProject(newProjectName.trim());
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
      alert('프로젝트 생성에 실패했습니다.');
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('정말 이 프로젝트를 삭제하시겠습니까? 모든 데이터가 삭제됩니다.')) return;

    try {
      await api.deleteProject(projectId);
      loadProjects();
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
      alert('프로젝트 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: COLORS.background.gray[50],
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: COLORS.text.primary, marginBottom: '8px' }}>
            ThinkBlock
          </h1>
          <p style={{ fontSize: '16px', color: COLORS.text.secondary }}>프로젝트를 선택하거나 새로 만드세요</p>
        </div>

        <div style={{ marginBottom: '24px', textAlign: 'right' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              ...BUTTON_STYLES.primary,
              padding: '12px 24px',
              fontSize: '15px',
            }}
          >
            + 새 프로젝트
          </button>
        </div>

        {projects.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: COLORS.background.white,
              borderRadius: '12px',
              border: `1px solid ${COLORS.border.default}`,
            }}
          >
            <p style={{ fontSize: '16px', color: COLORS.text.secondary, marginBottom: '24px' }}>
              프로젝트가 없습니다
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                ...BUTTON_STYLES.primary,
                padding: '12px 24px',
                fontSize: '15px',
              }}
            >
              첫 프로젝트 만들기
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                style={{
                  backgroundColor: COLORS.background.white,
                  borderRadius: '12px',
                  padding: '20px',
                  border: `1px solid ${COLORS.border.default}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border.default;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: COLORS.text.primary,
                    marginBottom: '8px',
                    marginRight: '32px',
                  }}
                >
                  {project.name}
                </h3>
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: COLORS.text.muted,
                    fontSize: '18px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.danger;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.text.muted;
                  }}
                  title="삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}
              onClick={() => setShowCreateModal(false)}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: COLORS.background.white,
                borderRadius: '12px',
                padding: '32px',
                minWidth: '400px',
                maxWidth: '500px',
                zIndex: 1001,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: COLORS.text.primary }}>
                새 프로젝트 만들기
              </h2>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                placeholder="프로젝트 이름"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${COLORS.border.default}`,
                  borderRadius: '8px',
                  fontSize: '15px',
                  marginBottom: '20px',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                  }}
                  style={BUTTON_STYLES.secondary}
                >
                  취소
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  style={{
                    ...BUTTON_STYLES.primary,
                    opacity: !newProjectName.trim() ? 0.5 : 1,
                    cursor: !newProjectName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  만들기
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

