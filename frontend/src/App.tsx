import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCorners, CollisionDetection } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Block as BlockType } from './types/block';
import { PyramidView } from './components/PyramidView';
import { TableView } from './components/TableView';
import { Tabs } from './components/Tabs';
import { BlockForm } from './components/BlockForm';
import { BlockInput } from './components/BlockInput';
import { BlockList } from './components/BlockList';
import { CategoryManager } from './components/CategoryManager';
import { AIGenerateBlocksModal } from './components/AIGenerateBlocksModal';
import { AIArrangeBlocksModal } from './components/AIArrangeBlocksModal';
import { ArrangementReasoningModal } from './components/ArrangementReasoningModal';
import { api } from './services/api';
import { groupBlocksByLevel, calculateMaxLevel } from './utils/blockUtils';
import { MODAL_STYLES, BUTTON_STYLES, COLORS } from './constants/styles';
import { CATEGORIES as DEFAULT_CATEGORIES } from './constants/categories';
import './App.css';

function App() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockType | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [showAIArrangeModal, setShowAIArrangeModal] = useState(false);
  const [showArrangementReasoning, setShowArrangementReasoning] = useState(false);
  const [arrangementReasoning, setArrangementReasoning] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [project, setProject] = useState<{ id: string; name: string } | null>(null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }

    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [blocksData, categoriesData, projectData] = await Promise.all([
          api.getBlocks(projectId),
          api.getCategories(projectId),
          api.getProject(projectId),
        ]);
        if (!cancelled) {
          setBlocks(Array.isArray(blocksData) ? blocksData : []);
          // 카테고리가 없으면 기본 카테고리 사용
          setCategories(categoriesData.length > 0 ? categoriesData : [...DEFAULT_CATEGORIES]);
          setProject(projectData);
          // 저장된 배치 이유 불러오기
          if (projectData && (projectData as any).arrangement_reasoning) {
            setArrangementReasoning((projectData as any).arrangement_reasoning);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        if (!cancelled) {
          setBlocks([]);
          // 에러 발생 시 기본 카테고리 사용
          setCategories([...DEFAULT_CATEGORIES]);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [projectId, navigate]);

  const handleCreateBlock = async (blockData: Omit<BlockType, 'id'>) => {
    if (!projectId) return;
    try {
      const newBlock = await api.createBlock(projectId, blockData);
      setBlocks([...blocks, newBlock]);
      setShowForm(false);
    } catch (error) {
      console.error('블록 생성 실패:', error);
      alert('블록 생성에 실패했습니다.');
    }
  };

  const handleQuickCreate = async (title: string) => {
    if (!projectId) return;
    try {
      // 레벨 -1로 설정하여 아직 배치되지 않은 블록으로 표시
      // 실제로는 레벨 0이 아닌 특별한 값으로 관리하거나, 별도 필드로 관리
      // 일단 level을 -1로 설정하고, 피라미드에서는 level >= 0만 표시
      const unassignedBlocks = blocks.filter((b) => b.level < 0);
      const newBlock = await api.createBlock(projectId, {
        title,
        description: '',
        level: -1, // 아직 배치되지 않은 블록
        order: unassignedBlocks.length,
      });
      setBlocks([...blocks, newBlock]);
    } catch (error) {
      console.error('블록 생성 실패:', error);
      alert('블록 생성에 실패했습니다.');
    }
  };


  const handleUpdateBlock = async (blockId: string, updates: Partial<BlockType>) => {
    if (!projectId) return;
    try {
      const updatedBlock = await api.updateBlock(projectId, blockId, updates);
      setBlocks(blocks.map((b) => (b.id === blockId ? updatedBlock : b)));
      setEditingBlock(null);
      setShowForm(false);
    } catch (error) {
      console.error('블록 업데이트 실패:', error);
      alert('블록 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!projectId) return;
    if (!confirm('정말 이 블록을 삭제하시겠습니까?')) return;

    try {
      await api.deleteBlock(projectId, blockId);
      setBlocks(blocks.filter((b) => b.id !== blockId));
    } catch (error) {
      console.error('블록 삭제 실패:', error);
      alert('블록 삭제에 실패했습니다.');
    }
  };

  const handleResetBlocks = async () => {
    if (!projectId) return;
    
    setShowResetConfirm(true);
  };

  const confirmResetBlocks = async () => {
    if (!projectId) return;
    
    try {
      // 모든 블록 삭제
      const deletePromises = blocks.map((block) => api.deleteBlock(projectId, block.id));
      await Promise.all(deletePromises);
      
      setBlocks([]);
      setShowResetConfirm(false);
      setArrangementReasoning(''); // 배치 이유도 초기화
    } catch (error) {
      console.error('블록 초기화 실패:', error);
      alert('블록 초기화에 실패했습니다.');
    }
  };

  const handleEditBlock = (block: BlockType) => {
    setEditingBlock(block);
    setShowForm(true);
  };

  const handleCategoriesChange = async (newCategories: string[]) => {
    if (!projectId) return;
    try {
      await api.updateCategories(projectId, newCategories);
      setCategories(newCategories);
    } catch (error) {
      console.error('카테고리 업데이트 실패:', error);
      alert('카테고리 업데이트에 실패했습니다.');
    }
  };

  const handleProjectNameEdit = () => {
    if (!project) return;
    setEditingProjectName(project.name);
    setIsEditingProjectName(true);
  };

  const handleProjectNameSave = async () => {
    if (!projectId || !editingProjectName.trim()) {
      setIsEditingProjectName(false);
      return;
    }

    try {
      const updatedProject = await api.updateProject(projectId, { name: editingProjectName.trim() });
      setProject(updatedProject);
      setIsEditingProjectName(false);
    } catch (error) {
      console.error('프로젝트명 업데이트 실패:', error);
      alert('프로젝트명 업데이트에 실패했습니다.');
    }
  };

  const handleProjectNameCancel = () => {
    setIsEditingProjectName(false);
    setEditingProjectName('');
  };

  const handleAIClick = () => {
    setShowAIGenerateModal(true);
  };

  const handleAIArrangeClick = () => {
    setShowAIArrangeModal(true);
  };

  const handleAIGenerateSuccess = async () => {
    // 블록 목록 새로고침
    if (!projectId) return;
    try {
      const blocksData = await api.getBlocks(projectId);
      setBlocks(Array.isArray(blocksData) ? blocksData : []);
    } catch (error) {
      console.error('블록 로드 실패:', error);
    }
  };

  const handleAIArrangeSuccess = async (reasoning?: string) => {
    // 블록 목록 새로고침
    if (!projectId) return;
    try {
      const blocksData = await api.getBlocks(projectId);
      setBlocks(Array.isArray(blocksData) ? blocksData : []);
      
      // 배치 이유 저장
      console.log('🔍 handleAIArrangeSuccess 호출됨, reasoning:', reasoning ? `${reasoning.length} 문자` : '없음');
      if (reasoning) {
        setArrangementReasoning(reasoning);
        console.log('🔍 arrangementReasoning state 설정 완료');
      } else {
        setArrangementReasoning('');
        console.log('🔍 arrangementReasoning을 빈 문자열로 설정');
      }
    } catch (error) {
      console.error('블록 로드 실패:', error);
    }
  };

  // 레벨별로 블록 그룹화 (드래그앤드롭 처리를 위해 필요)
  const blocksByLevel = useMemo(() => groupBlocksByLevel(blocks), [blocks]);
  const maxLevel = useMemo(() => calculateMaxLevel(blocks), [blocks]);

  // 커스텀 collision detection: 안정적인 드롭 감지
  const customCollisionDetection: CollisionDetection = (args) => {
    // 기본 collision detection 사용 (안정적)
    const collisions = closestCorners(args);
    
    // 드롭존이 감지되면 우선 처리
    if (collisions && collisions.length > 0) {
      const dropzoneCollision = collisions.find(
        collision => collision.id.toString().startsWith('dropzone-level-')
      );
      if (dropzoneCollision) {
        return [dropzoneCollision];
      }
    }
    
    return collisions;
  };

  // 드래그앤드롭 핸들러 (BlockList와 PyramidView 모두에서 사용)
  const handleDragEnd = async (event: DragEndEvent) => {
    if (!projectId) return;
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeBlock = blocks.find((b) => b.id === active.id);
    if (!activeBlock) return;
    
    // 드롭존에 드롭한 경우 (레벨 컨테이너에 드롭)
    if (typeof over.id === 'string' && over.id.startsWith('dropzone-level-')) {
      const targetLevel = parseInt(over.id.replace('dropzone-level-', ''));
      const targetLevelBlocks = blocksByLevel[targetLevel] || [];
      const newOrder = targetLevelBlocks.length;

      handleUpdateBlock(activeBlock.id, {
        level: targetLevel,
        order: newOrder,
      });
      return;
    }

    const overBlock = blocks.find((b) => b.id === over.id);

    if (!overBlock) return;

    // 같은 레벨 내에서 드래그: order만 변경
    if (activeBlock.level === overBlock.level && activeBlock.level >= 0) {
      const levelBlocks = blocksByLevel[activeBlock.level] || [];
      const oldIndex = levelBlocks.findIndex((b) => b.id === active.id);
      const newIndex = levelBlocks.findIndex((b) => b.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newOrder = arrayMove(levelBlocks, oldIndex, newIndex);

        newOrder.forEach((block, index) => {
          if (block.order !== index) {
            handleUpdateBlock(block.id, { order: index });
          }
        });
      }
    } else if (overBlock.level >= 0 && activeBlock.level !== overBlock.level) {
      // 다른 레벨로 드래그: level과 order 변경
      // 블록에 드롭했지만, 실제로는 해당 레벨의 드롭존에 드롭한 것으로 처리
      const targetLevel = overBlock.level;
      const targetLevelBlocks = blocksByLevel[targetLevel] || [];
      const newOrder = targetLevelBlocks.length;

      handleUpdateBlock(activeBlock.id, {
        level: targetLevel,
        order: newOrder,
      });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="App">
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
              onClick={() => setShowCategoryManager(true)}
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
              onClick={handleResetBlocks}
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

      <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
        <main
        style={{
          height: 'calc(100vh - 80px)',
          backgroundColor: '#fafafa',
          overflow: 'hidden',
        }}
      >
        {activeTab === 0 ? (
          <DndContext 
            collisionDetection={customCollisionDetection}
            onDragEnd={handleDragEnd}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              {/* 왼쪽: 입력 영역 및 블록 목록 */}
              <div
                style={{
                  width: '520px',
                  flexShrink: 0,
                  backgroundColor: '#f8f9fa',
                  borderRight: '1px solid #e9ecef',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                        <BlockInput 
                          onSubmit={handleQuickCreate} 
                          onAIClick={handleAIClick} 
                          onAIArrangeClick={handleAIArrangeClick}
                        />
                <BlockList
                  blocks={blocks}
                  onBlockDelete={handleDeleteBlock}
                  onBlockEdit={handleEditBlock}
                />
              </div>

              {/* 오른쪽: 피라미드 영역 */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                }}
              >
                <PyramidView
                  blocksByLevel={blocksByLevel}
                  maxLevel={maxLevel}
                  onBlockDelete={handleDeleteBlock}
                  onBlockEdit={handleEditBlock}
                />
              </div>
            </div>
          </DndContext>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {/* 왼쪽: 입력 영역 및 블록 목록 */}
            <div
              style={{
                width: '520px',
                flexShrink: 0,
                backgroundColor: '#f8f9fa',
                borderRight: '1px solid #e9ecef',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
                        <BlockInput 
                          onSubmit={handleQuickCreate} 
                          onAIClick={handleAIClick} 
                          onAIArrangeClick={handleAIArrangeClick}
                        />
              <BlockList
                blocks={blocks}
                onBlockDelete={handleDeleteBlock}
                onBlockEdit={handleEditBlock}
              />
            </div>

            {/* 오른쪽: 표 영역 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
              }}
            >
              <TableView
                blocks={blocks}
                maxLevel={maxLevel}
                onBlockDelete={handleDeleteBlock}
                onBlockEdit={handleEditBlock}
              />
            </div>
          </div>
        )}
        </main>
      </Tabs>

      {showForm && (
        <>
          <div
            style={MODAL_STYLES.overlay}
            onClick={() => {
              setShowForm(false);
              setEditingBlock(null);
            }}
          />
          <BlockForm
            block={editingBlock}
            maxLevel={maxLevel}
            onSubmit={editingBlock ? (data) => handleUpdateBlock(editingBlock.id, data) : handleCreateBlock}
            onCancel={() => {
              setShowForm(false);
              setEditingBlock(null);
            }}
            categories={categories}
          />
        </>
      )}

      {showCategoryManager && (
        <>
          <div
            style={MODAL_STYLES.overlay}
            onClick={() => setShowCategoryManager(false)}
          />
          <CategoryManager
            categories={categories}
            onCategoriesChange={handleCategoriesChange}
            onClose={() => setShowCategoryManager(false)}
          />
        </>
      )}

      {showAIGenerateModal && projectId && (
        <AIGenerateBlocksModal
          projectId={projectId}
          onClose={() => setShowAIGenerateModal(false)}
          onSuccess={handleAIGenerateSuccess}
        />
      )}

      {showAIArrangeModal && projectId && (
        <AIArrangeBlocksModal
          projectId={projectId}
          blocks={blocks}
          onClose={() => setShowAIArrangeModal(false)}
          onSuccess={handleAIArrangeSuccess}
        />
      )}

      {/* 왼쪽 하단 플로팅 버튼 */}
      <button
        onClick={() => {
          // AI 배치 이유 보기
          if (arrangementReasoning) {
            setShowArrangementReasoning(true);
          }
        }}
        disabled={!arrangementReasoning}
        style={{
          position: 'fixed',
          bottom: '32px',
          left: '32px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: arrangementReasoning ? COLORS.primary : '#adb5bd',
          color: 'white',
          border: 'none',
          cursor: arrangementReasoning ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: arrangementReasoning ? '0 4px 12px rgba(99, 102, 241, 0.4)' : '0 2px 6px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          zIndex: 100,
          opacity: arrangementReasoning ? 1 : 0.6,
        }}
        onMouseEnter={(e) => {
          if (arrangementReasoning) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (arrangementReasoning) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
          }
        }}
        title={arrangementReasoning ? 'AI 배치 이유 보기' : '배치 이유가 없습니다'}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 2V8H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 13H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 17H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 9H9H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {showArrangementReasoning && arrangementReasoning && (
        <ArrangementReasoningModal
          reasoning={arrangementReasoning}
          onClose={() => setShowArrangementReasoning(false)}
        />
      )}

      {/* 초기화 확인 모달 */}
      {showResetConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            style={{
              backgroundColor: COLORS.background.white,
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              border: `1px solid ${COLORS.border.default}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: COLORS.text.primary,
              }}
            >
              전체 블록 초기화
            </h2>
            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                color: COLORS.text.secondary,
                lineHeight: '1.6',
              }}
            >
              정말 모든 블록을 삭제하시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  ...BUTTON_STYLES.secondary,
                  padding: '10px 20px',
                }}
              >
                취소
              </button>
              <button
                onClick={confirmResetBlocks}
                style={{
                  ...BUTTON_STYLES.primary,
                  padding: '10px 20px',
                  backgroundColor: COLORS.danger,
                  borderColor: COLORS.danger,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.danger;
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

