import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragMoveEvent, closestCorners, CollisionDetection } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Block as BlockType } from './types/block';
import { handleError, showConfirm } from './utils/errorHandler';
import { PyramidView } from './components/PyramidView';
import { TableView } from './components/TableView';
import { Tabs } from './components/Tabs';
import { BlockForm } from './components/BlockForm';
import { BlockList } from './components/BlockList';
import { LeftPanel } from './components/LeftPanel';
import { PanelToggleButton } from './components/PanelToggleButton';
import { CategoryManager } from './components/CategoryManager';
import { AIGenerateBlocksModal } from './components/AIGenerateBlocksModal';
import { AIArrangeBlocksModal } from './components/AIArrangeBlocksModal';
import { ArrangementReasoningModal } from './components/ArrangementReasoningModal';
import { api } from './services/api';
import { useBlocks } from './hooks/useBlocks';
import { useProjectData } from './hooks/useProjectData';
import { groupBlocksByLevel, calculateMaxLevel } from './utils/blockUtils';
import { MODAL_STYLES, BUTTON_STYLES, COLORS } from './constants/styles';
import { DRAG_THRESHOLD } from './constants/block';
import './App.css';

function App() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // 커스텀 훅 사용
  const { blocks, loading, createBlock, updateBlock, deleteBlock, setBlocks, fetchBlocks } = useBlocks(projectId);
  const {
    categories,
    project,
    arrangementReasoning,
    loading: projectLoading,
    setArrangementReasoning,
    updateCategories,
    updateProject,
  } = useProjectData(projectId);
  
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockType | null>(null);
  // 모드: 'view' (보기), 'drag' (드래그), 'connection' (연결선)
  const [mode, setMode] = useState<'view' | 'drag' | 'connection'>('view'); // 기본값: 보기 모드
  const [hasDragged, setHasDragged] = useState(false); // 실제로 드래그했는지 추적
  // 연결선 모드 상태
  const [connectingFromBlockId, setConnectingFromBlockId] = useState<string | null>(null); // 연결 시작 블록 ID
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null); // 호버된 블록 ID
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [showAIArrangeModal, setShowAIArrangeModal] = useState(false);
  const [showArrangementReasoning, setShowArrangementReasoning] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
  }, [projectId, navigate]);

  const handleCreateBlock = async (blockData: Omit<BlockType, 'id'>) => {
    try {
      await createBlock(blockData);
      setShowForm(false);
    } catch (error) {
      // 에러는 useBlocks에서 처리됨
    }
  };

  const handleQuickCreate = async (title: string) => {
    try {
      const unassignedBlocks = blocks.filter((b) => b.level < 0);
      await createBlock({
        title,
        description: '',
        level: -1, // 아직 배치되지 않은 블록
        order: unassignedBlocks.length,
      });
    } catch (error) {
      // 에러는 useBlocks에서 처리됨
    }
  };


  const handleUpdateBlock = async (blockId: string, updates: Partial<BlockType>) => {
    try {
      await updateBlock(blockId, updates);
      setEditingBlock(null);
      setShowForm(false);
    } catch (error) {
      // 에러는 useBlocks에서 처리됨
    }
  };

  const handleDeleteBlock = useCallback(async (blockId: string) => {
    if (!showConfirm('정말 이 블록을 삭제하시겠습니까?')) return;
    await deleteBlock(blockId);
  }, [deleteBlock]);

  const handleResetBlocks = async () => {
    if (!projectId) return;
    
    setShowResetConfirm(true);
  };

  const confirmResetBlocks = async () => {
    if (!projectId) return;
    
    try {
      // 모든 블록 삭제
      const deletePromises = blocks.map((block) => deleteBlock(block.id));
      await Promise.all(deletePromises);
      
      setShowResetConfirm(false);
      setArrangementReasoning(''); // 배치 이유도 초기화
    } catch (error) {
      // 에러는 useBlocks에서 처리됨
    }
  };

  const handleEditBlock = useCallback((block: BlockType) => {
    setEditingBlock(block);
    setShowForm(true);
  }, []);

  // 연결선 모드 핸들러
  const handleConnectionStart = useCallback((blockId: string) => {
    if (mode !== 'connection') return;
    if (blockId === '') {
      // 빈 문자열이면 연결 취소
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
      return;
    }
    console.log('연결 시작:', blockId);
    setConnectingFromBlockId(blockId);
  }, [mode]);

  const handleConnectionEnd = useCallback(async (toBlockId: string) => {
    console.log('handleConnectionEnd 호출:', { mode, connectingFromBlockId, toBlockId, projectId });
    if (mode !== 'connection' || !connectingFromBlockId || !projectId) {
      console.log('조건 불만족:', { mode, connectingFromBlockId, projectId });
      return;
    }
    if (connectingFromBlockId === toBlockId) {
      console.log('같은 블록 클릭, 연결 취소');
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
      return;
    }
    try {
      await api.addDependency(projectId, connectingFromBlockId, toBlockId);
      await fetchBlocks();
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
    } catch (error) {
      handleError(error, '의존성 추가에 실패했습니다.');
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
    }
  }, [mode, connectingFromBlockId, projectId]);

  const handleConnectionCancel = useCallback(() => {
    if (mode !== 'connection') return;
    setConnectingFromBlockId(null);
    setHoveredBlockId(null);
  }, [mode]);

  const handleRemoveDependency = useCallback(async (fromBlockId: string, toBlockId: string) => {
    if (!projectId) return;

    try {
      await api.removeDependency(projectId, fromBlockId, toBlockId);
      await fetchBlocks();
    } catch (error) {
      handleError(error, '의존성 삭제에 실패했습니다.');
    }
  }, [projectId]);

  const handleCategoriesChange = async (newCategories: string[]) => {
    try {
      await updateCategories(newCategories);
    } catch (error) {
      // 에러는 useProjectData에서 처리됨
    }
  };

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
      await updateProject({ name: editingProjectName.trim() });
      setIsEditingProjectName(false);
    } catch (error) {
      // 에러는 useProjectData에서 처리됨
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
    await fetchBlocks();
  };

  const handleAIArrangeSuccess = async (reasoning?: string) => {
    await fetchBlocks();
    if (reasoning) {
      setArrangementReasoning(reasoning);
    } else {
      setArrangementReasoning('');
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

  // 드래그 시작 핸들러
  const handleDragStart = () => {
    setHasDragged(false); // 드래그 시작 시 초기화
  };

  // 드래그 이동 핸들러 - 실제로 움직였는지 확인
  const handleDragMove = (event: DragMoveEvent) => {
    // 실제로 움직였는지 확인 (DRAG_THRESHOLD 이상 이동해야 드래그로 인정)
    const deltaX = Math.abs(event.delta.x);
    const deltaY = Math.abs(event.delta.y);
    if (deltaX >= DRAG_THRESHOLD || deltaY >= DRAG_THRESHOLD) {
      setHasDragged(true);
    }
  };

  // 드래그앤드롭 핸들러 (BlockList와 PyramidView 모두에서 사용)
  const handleDragEnd = async (event: DragEndEvent) => {
    if (!projectId) return;
    const { active, over } = event;

    // 실제로 드래그하지 않았으면 무시 (클릭만 한 경우)
    if (!hasDragged) {
      setHasDragged(false);
      return;
    }

    if (!over || active.id === over.id) {
      setHasDragged(false);
      return;
    }

    setHasDragged(false);

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

  if (loading || projectLoading) {
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

      <Tabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        mode={mode}
        onModeChange={setMode}
      >
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
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* 왼쪽: 입력 영역 및 블록 목록 */}
              <LeftPanel
                isCollapsed={isLeftPanelCollapsed}
                blocks={blocks}
                onQuickCreate={handleQuickCreate}
                onAIClick={handleAIClick}
                onAIArrangeClick={handleAIArrangeClick}
                onBlockDelete={handleDeleteBlock}
                onBlockEdit={handleEditBlock}
                isEditMode={mode === 'drag'}
                isConnectionMode={mode === 'connection'}
                connectingFromBlockId={connectingFromBlockId}
                hoveredBlockId={hoveredBlockId}
                onConnectionStart={handleConnectionStart}
                onConnectionEnd={handleConnectionEnd}
                onBlockHover={setHoveredBlockId}
              />

              {/* 토글 버튼 */}
              <PanelToggleButton
                isCollapsed={isLeftPanelCollapsed}
                leftPosition={400}
                onToggle={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
              />

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
                  isEditMode={mode === 'drag'}
                  isConnectionMode={mode === 'connection'}
                  connectingFromBlockId={connectingFromBlockId}
                  hoveredBlockId={hoveredBlockId}
                  onConnectionStart={handleConnectionStart}
                  onConnectionEnd={handleConnectionEnd}
                  onConnectionCancel={handleConnectionCancel}
                  onBlockHover={setHoveredBlockId}
                  onRemoveDependency={handleRemoveDependency}
                  allBlocks={blocks}
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
              position: 'relative',
            }}
          >
            {/* 왼쪽: 입력 영역 및 블록 목록 */}
            <LeftPanel
              isCollapsed={isLeftPanelCollapsed}
              blocks={blocks}
              onQuickCreate={handleQuickCreate}
              onAIClick={handleAIClick}
              onAIArrangeClick={handleAIArrangeClick}
              onBlockDelete={handleDeleteBlock}
              onBlockEdit={handleEditBlock}
            />

            {/* 토글 버튼 */}
            <PanelToggleButton
              isCollapsed={isLeftPanelCollapsed}
              leftPosition={400}
              onToggle={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            />

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

