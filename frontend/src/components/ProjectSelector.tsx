import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { COLORS, BUTTON_STYLES } from '../constants/styles';
import { logger } from '../utils/logger';

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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicatingProject, setDuplicatingProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [duplicateProjectName, setDuplicateProjectName] = useState('');
  const [copyStructure, setCopyStructure] = useState(true);
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
      logger.error('프로젝트 로드 실패:', error);
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
      logger.error('프로젝트 생성 실패:', error);
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
      logger.error('프로젝트 삭제 실패:', error);
      alert('프로젝트 삭제에 실패했습니다.');
    }
  };

  const handleDuplicateClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setDuplicatingProject(project);
    setDuplicateProjectName(`${project.name} 복사본`);
    setCopyStructure(true);
    setShowDuplicateModal(true);
  };

  const handleDuplicateProject = async () => {
    if (!duplicatingProject || !duplicateProjectName.trim()) return;

    try {
      const newProject = await api.duplicateProject(
        duplicatingProject.id,
        duplicateProjectName.trim(),
        copyStructure
      );
      setShowDuplicateModal(false);
      setDuplicatingProject(null);
      setDuplicateProjectName('');
      navigate(`/project/${newProject.id}`);
    } catch (error) {
      logger.error('프로젝트 복제 실패:', error);
      alert('프로젝트 복제에 실패했습니다.');
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
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <button
                    onClick={(e) => handleDuplicateClick(project, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      const svg = e.currentTarget.querySelector('svg');
                      if (svg) svg.style.stroke = COLORS.primary;
                    }}
                    onMouseLeave={(e) => {
                      const svg = e.currentTarget.querySelector('svg');
                      if (svg) svg.style.stroke = COLORS.text.muted;
                    }}
                    title="복제"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        stroke: COLORS.text.muted,
                        strokeWidth: '1.5',
                        transition: 'stroke 0.2s',
                      }}
                    >
                      <rect
                        x="5"
                        y="5"
                        width="8"
                        height="8"
                        rx="1.5"
                        fill="none"
                      />
                      <rect
                        x="3"
                        y="3"
                        width="8"
                        height="8"
                        rx="1.5"
                        fill="none"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    style={{
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

        {showDuplicateModal && duplicatingProject && (
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
              onClick={() => {
                setShowDuplicateModal(false);
                setDuplicatingProject(null);
                setDuplicateProjectName('');
              }}
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
                minWidth: '450px',
                maxWidth: '550px',
                zIndex: 1001,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: COLORS.text.primary }}>
                프로젝트 복제
              </h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: COLORS.text.secondary }}>
                원본 프로젝트: <strong>{duplicatingProject.name}</strong>
              </p>
              
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
                  새 프로젝트 이름
                </label>
                <input
                  type="text"
                  value={duplicateProjectName}
                  onChange={(e) => setDuplicateProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDuplicateProject()}
                  placeholder="프로젝트 이름"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${COLORS.border.default}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

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
                  복제 옵션
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '12px',
                      border: `1px solid ${copyStructure ? COLORS.primary : COLORS.border.default}`,
                      borderRadius: '8px',
                      backgroundColor: copyStructure ? COLORS.background.gray[50] : 'transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!copyStructure) {
                        e.currentTarget.style.borderColor = COLORS.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!copyStructure) {
                        e.currentTarget.style.borderColor = COLORS.border.default;
                      }
                    }}
                  >
                    <input
                      type="radio"
                      checked={copyStructure}
                      onChange={() => setCopyStructure(true)}
                      style={{ marginRight: '12px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', color: COLORS.text.primary, marginBottom: '4px' }}>
                        전체 복사
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.text.secondary }}>
                        계층에 블록 배치 그대로 모든 것을 복사합니다
                      </div>
                    </div>
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '12px',
                      border: `1px solid ${!copyStructure ? COLORS.primary : COLORS.border.default}`,
                      borderRadius: '8px',
                      backgroundColor: !copyStructure ? COLORS.background.gray[50] : 'transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (copyStructure) {
                        e.currentTarget.style.borderColor = COLORS.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (copyStructure) {
                        e.currentTarget.style.borderColor = COLORS.border.default;
                      }
                    }}
                  >
                    <input
                      type="radio"
                      checked={!copyStructure}
                      onChange={() => setCopyStructure(false)}
                      style={{ marginRight: '12px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', color: COLORS.text.primary, marginBottom: '4px' }}>
                        블록만 복사
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.text.secondary }}>
                        블록을 좌측 리스트에 나열합니다 (계층 구조 제거)
                      </div>
                    </div>
                  </label>
                </div>
                <p style={{ marginTop: '12px', fontSize: '12px', color: COLORS.text.muted, fontStyle: 'italic' }}>
                  * 카테고리는 항상 복사됩니다
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setDuplicatingProject(null);
                    setDuplicateProjectName('');
                  }}
                  style={BUTTON_STYLES.secondary}
                >
                  취소
                </button>
                <button
                  onClick={handleDuplicateProject}
                  disabled={!duplicateProjectName.trim()}
                  style={{
                    ...BUTTON_STYLES.primary,
                    opacity: !duplicateProjectName.trim() ? 0.5 : 1,
                    cursor: !duplicateProjectName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  복제
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

