/**
 * 프로젝트 페이지 컴포넌트
 * App.tsx에서 분리된 메인 프로젝트 뷰
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Block as BlockType } from '../types/block';
import { Mode } from '../types/common';
import { handleError, showConfirm } from '../utils/errorHandler';
import { PyramidView } from '../components/PyramidView';
import { TableView } from '../components/TableView';
import { Tabs } from '../components/Tabs';
import { BlockForm } from '../components/BlockForm';
import { LeftPanel } from '../components/LeftPanel';
import { PanelToggleButton } from '../components/PanelToggleButton';
import { CategoryManager } from '../components/CategoryManager';
import { ProjectHeader } from '../components/ProjectHeader';
import { AIGenerateBlocksModal } from '../components/AIGenerateBlocksModal';
import { AIArrangeBlocksModal } from '../components/AIArrangeBlocksModal';
import { AIFeedbackModal } from '../components/AIFeedbackModal';
import { ArrangementReasoningModal } from '../components/ArrangementReasoningModal';
import { useBlocks } from '../hooks/useBlocks';
import { useProjectData } from '../hooks/useProjectData';
import { useConnectionMode } from '../hooks/useConnectionMode';
import { useDragMode } from '../hooks/useDragMode';
import { useConnectionColors } from '../hooks/useConnectionColors';
import { groupBlocksByLevel, calculateMaxLevel } from '../utils/blockUtils';
import { MODAL_STYLES, BUTTON_STYLES, COLORS } from '../constants/styles';
import { api } from '../services/api';
import '../App.css';

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // 커스텀 훅 사용
  const { blocks, loading, createBlock, updateBlock, deleteBlock, fetchBlocks } = useBlocks(projectId);
  const {
    categories,
    categoryColors,
    project,
    arrangementReasoning,
    loading: projectLoading,
    setArrangementReasoning,
    updateCategories,
    updateCategoryColors,
    updateProject,
    refetch: refetchProjectData,
  } = useProjectData(projectId);

  // 상태 정의 (먼저 정의)
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockType | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [showAIArrangeModal, setShowAIArrangeModal] = useState(false);
  const [showAIFeedbackModal, setShowAIFeedbackModal] = useState(false);
  const [showArrangementReasoning, setShowArrangementReasoning] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  // 연결선 색상 관리
  const {
    connectionColorPalette,
    selectedConnectionColor,
    dependencyColors,
    setDependencyColors,
    handleColorSelect,
    handleColorAdd,
  } = useConnectionColors(projectId);

  // 연결선 모드
  const {
    connectingFromBlockId,
    hoveredBlockId,
    setHoveredBlockId,
    handleConnectionStart: handleConnectionStartBase,
    handleConnectionEnd: handleConnectionEndBase,
    handleConnectionCancel: handleConnectionCancelBase,
    handleRemoveDependency,
  } = useConnectionMode({
    projectId,
    fetchBlocks,
    setDependencyColors,
  });

  // 드래그 모드
  const {
    draggedBlockId,
    dragOverLevel,
    dragOverIndex,
    handleDragStart: handleDragStartBase,
    handleDragEnd,
    handleDrop: handleDropBase,
    handleDragOver,
    handleDragLeave,
  } = useDragMode({
    blocks,
    updateBlock,
  });

  // mode를 포함한 래퍼 함수들 (mode 상태 정의 후)
  const handleConnectionStart = useCallback((blockId: string) => {
    handleConnectionStartBase(blockId, mode);
  }, [handleConnectionStartBase, mode]);

  const handleConnectionEnd = useCallback(async (toBlockId: string, selectedColor: string | null) => {
    await handleConnectionEndBase(toBlockId, selectedColor, mode);
  }, [handleConnectionEndBase, mode]);

  const handleConnectionCancel = useCallback(() => {
    handleConnectionCancelBase(mode);
  }, [handleConnectionCancelBase, mode]);

  const handleDragStart = useCallback((blockId: string) => {
    handleDragStartBase(blockId, mode);
  }, [handleDragStartBase, mode]);

  const handleDrop = useCallback(async (targetLevel: number, targetIndex?: number) => {
    await handleDropBase(targetLevel, mode, targetIndex);
  }, [handleDropBase, mode]);

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
        level: -1,
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
    
    try {
      const blockToDelete = blocks.find(b => b.id === blockId);
      if (!blockToDelete) return;
      
      await deleteBlock(blockId);
      
      if (blockToDelete.level >= 0) {
        const sameLevelBlocks = blocks
          .filter(b => b.level === blockToDelete.level && b.id !== blockId)
          .filter(b => b.order > blockToDelete.order)
          .sort((a, b) => a.order - b.order);
        
        const updatePromises = sameLevelBlocks.map(b => 
          updateBlock(b.id, { order: b.order - 1 })
        );
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      }
      
      await fetchBlocks();
    } catch (error) {
      handleError(error, '블록 삭제에 실패했습니다.');
    }
  }, [blocks, deleteBlock, updateBlock, fetchBlocks]);

  const handleResetBlocks = async () => {
    if (!projectId) return;
    setShowResetConfirm(true);
  };

  const confirmResetBlocks = async () => {
    if (!projectId) return;
    
    try {
      const deletePromises = blocks.map((block) => deleteBlock(block.id));
      await Promise.all(deletePromises);
      
      setShowResetConfirm(false);
      setArrangementReasoning('');
    } catch (error) {
      // 에러는 useBlocks에서 처리됨
    }
  };

  const handleEditBlock = useCallback((block: BlockType) => {
    setEditingBlock(block);
    setShowForm(true);
  }, []);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
  }, []);


  const handleCategoriesChange = async (newCategories: string[]) => {
    try {
      await updateCategories(newCategories);
    } catch (error) {
      // 에러는 useProjectData에서 처리됨
    }
  };

  const handleAIClick = () => {
    setShowAIGenerateModal(true);
  };

  const handleAIArrangeClick = () => {
    setShowAIArrangeModal(true);
  };

  const handleAIFeedbackClick = () => {
    setShowAIFeedbackModal(true);
  };

  const handleAIGenerateSuccess = async () => {
    await fetchBlocks();
  };

  const handleAIArrangeSuccess = async (_reasoning?: string) => {
    await fetchBlocks();
    // 프로젝트 데이터 다시 로드하여 최신 arrangement_reasoning 가져오기
    await refetchProjectData();
  };

  const handleAIFeedbackSuccess = async () => {
    // 프로젝트 데이터 다시 로드하여 최신 피드백 가져오기
    await refetchProjectData();
  };

  // 레벨별로 블록 그룹화
  const blocksByLevel = useMemo(() => groupBlocksByLevel(blocks), [blocks]);
  const maxLevel = useMemo(() => calculateMaxLevel(blocks), [blocks]);

  if (loading || projectLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <ProjectHeader
        project={project}
        onProjectNameUpdate={(name) => updateProject({ name })}
        onCategoryManagerOpen={() => setShowCategoryManager(true)}
        onResetBlocks={handleResetBlocks}
      />

      <Tabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        mode={mode}
        onModeChange={handleModeChange}
        connectionColorPalette={connectionColorPalette}
        selectedConnectionColor={selectedConnectionColor}
        onColorSelect={handleColorSelect}
        onColorAdd={handleColorAdd}
      >
        <main
          style={{
            height: 'calc(100vh - 80px)',
            backgroundColor: '#fafafa',
            overflow: 'hidden',
          }}
        >
          {activeTab === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <LeftPanel
                isCollapsed={isLeftPanelCollapsed}
                blocks={blocks}
                onQuickCreate={handleQuickCreate}
                onAIClick={handleAIClick}
                onAIArrangeClick={handleAIArrangeClick}
                onAIFeedbackClick={handleAIFeedbackClick}
                onBlockDelete={handleDeleteBlock}
                onBlockEdit={handleEditBlock}
                isConnectionMode={mode === 'connection'}
                connectingFromBlockId={connectingFromBlockId}
                hoveredBlockId={hoveredBlockId}
                onConnectionStart={handleConnectionStart}
                onConnectionEnd={(toBlockId) => handleConnectionEnd(toBlockId, selectedConnectionColor)}
                onBlockHover={setHoveredBlockId}
                isDragMode={mode === 'drag'}
                draggedBlockId={draggedBlockId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />

              <PanelToggleButton
                isCollapsed={isLeftPanelCollapsed}
                leftPosition={400}
                onToggle={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
              />

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
                  isConnectionMode={mode === 'connection'}
                  connectingFromBlockId={connectingFromBlockId}
                  hoveredBlockId={hoveredBlockId}
                  onConnectionStart={handleConnectionStart}
                  categoryColors={categoryColors}
                  onConnectionEnd={(toBlockId) => handleConnectionEnd(toBlockId, selectedConnectionColor)}
                  onConnectionCancel={handleConnectionCancel}
                  onBlockHover={setHoveredBlockId}
                  onRemoveDependency={handleRemoveDependency}
                  allBlocks={blocks}
                  isDragMode={mode === 'drag'}
                  draggedBlockId={draggedBlockId}
                  dragOverLevel={dragOverLevel}
                  dragOverIndex={dragOverIndex}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  selectedConnectionColor={selectedConnectionColor}
                  dependencyColors={dependencyColors}
                />
              </div>
            </div>
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
              <LeftPanel
                isCollapsed={isLeftPanelCollapsed}
                blocks={blocks}
                onQuickCreate={handleQuickCreate}
                onAIClick={handleAIClick}
                onAIArrangeClick={handleAIArrangeClick}
                onBlockDelete={handleDeleteBlock}
                onBlockEdit={handleEditBlock}
                isDragMode={mode === 'drag'}
                draggedBlockId={draggedBlockId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />

              <PanelToggleButton
                isCollapsed={isLeftPanelCollapsed}
                leftPosition={400}
                onToggle={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
              />

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
                  categoryColors={categoryColors}
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
            categoryColors={categoryColors}
            onCategoriesChange={handleCategoriesChange}
            onCategoryColorsChange={updateCategoryColors}
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

      {showAIFeedbackModal && projectId && (
        <AIFeedbackModal
          projectId={projectId}
          onClose={() => setShowAIFeedbackModal(false)}
          onSuccess={handleAIFeedbackSuccess}
        />
      )}

      <button
        onClick={() => {
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
};

