import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Block as BlockType } from './types/block';
import { Mode } from './types/common';
import { handleError, showConfirm } from './utils/errorHandler';
import { PyramidView } from './components/PyramidView';
import { TableView } from './components/TableView';
import { Tabs } from './components/Tabs';
import { BlockForm } from './components/BlockForm';
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
import { CONNECTION_COLOR_PALETTE } from './constants/connectionColors';
import { MODAL_STYLES, BUTTON_STYLES, COLORS } from './constants/styles';
import './App.css';

function App() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // 커스텀 훅 사용
  const { blocks, loading, createBlock, updateBlock, deleteBlock, fetchBlocks } = useBlocks(projectId);
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
  // 모드: 'view' (보기), 'connection' (연결선), 'drag' (드래그)
  const [mode, setMode] = useState<Mode>('view'); // 기본값: 보기 모드
  // 연결선 모드 상태
  const [connectingFromBlockId, setConnectingFromBlockId] = useState<string | null>(null); // 연결 시작 블록 ID
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null); // 호버된 블록 ID
  // 연결선 색상 팔레트 상태
  const [connectionColorPalette, setConnectionColorPalette] = useState<string[]>([]); // 사용 가능한 색상 목록
  const [selectedConnectionColor, setSelectedConnectionColor] = useState<string | null>(null); // 선택된 색상
  const [dependencyColors, setDependencyColors] = useState<Record<string, string>>({}); // 의존성 색상 맵 {fromBlockId_toBlockId: color}
  // 드래그 모드 상태
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null); // 드래그 중인 블록 ID
  const [dragOverLevel, setDragOverLevel] = useState<number | null>(null); // 드롭 오버 중인 레벨
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null); // 드롭 위치 인덱스
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

  // 연결선 색상 팔레트 로드
  useEffect(() => {
    if (!projectId) return;
    
    const loadColorPalette = async () => {
      try {
        const colors = await api.getConnectionColorPalette(projectId);
        // 기본 팔레트 색상 목록
        const defaultColors = [...CONNECTION_COLOR_PALETTE];
        
        // 기존 색상이 기본 팔레트에 포함된 색상들인지 확인
        const defaultColorsArray = defaultColors as readonly string[];
        const isValidPalette = colors.length > 0 && 
          colors.every(color => defaultColorsArray.includes(color));
        
        if (colors.length === 0) {
          // DB에 색상이 없으면 첫 번째 색상만 설정 (처음 사용)
          const defaultColor = [defaultColors[0]];
          setConnectionColorPalette(defaultColor);
          setSelectedConnectionColor(defaultColor[0]);
          // 백엔드에 저장 시도 (실패해도 무시)
          try {
            await api.updateConnectionColorPalette(projectId, defaultColor);
          } catch (e) {
            console.warn('기본 색상 저장 실패 (무시됨):', e);
          }
        } else if (isValidPalette) {
          // DB에 색상이 있고 모두 기본 팔레트에 포함되면 사용자가 추가한 색상들로 간주 (1개든 10개든 모두 표시)
          setConnectionColorPalette(colors);
          setSelectedConnectionColor(colors[0]);
        } else {
          // 유효하지 않은 색상이 있으면 첫 번째 색상만 설정
          const defaultColor = [defaultColors[0]];
          setConnectionColorPalette(defaultColor);
          setSelectedConnectionColor(defaultColor[0]);
          // 백엔드에 저장 시도 (실패해도 무시)
          try {
            await api.updateConnectionColorPalette(projectId, defaultColor);
          } catch (e) {
            console.warn('기본 색상 저장 실패 (무시됨):', e);
          }
        }
      } catch (error) {
        console.error('색상 팔레트 로드 실패:', error);
        // 기본 색상 팔레트 설정 (첫 번째 색상만)
        const defaultColors = [...CONNECTION_COLOR_PALETTE];
        const defaultColor = [defaultColors[0]];
        setConnectionColorPalette(defaultColor);
        setSelectedConnectionColor(defaultColor[0]);
      }
    };

    const loadDependencyColors = async () => {
      try {
        const colors = await api.getDependencyColors(projectId);
        setDependencyColors(colors || {});
      } catch (error) {
        console.error('의존성 색상 로드 실패:', error);
        setDependencyColors({});
      }
    };

    loadColorPalette();
    loadDependencyColors();
  }, [projectId]);

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
    
    try {
      const blockToDelete = blocks.find(b => b.id === blockId);
      if (!blockToDelete) return;
      
      // 블록 삭제
      await deleteBlock(blockId);
      
      // 같은 레벨의 뒤에 있는 블록들의 order를 -1씩 감소
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

  // 드래그 모드 핸들러
  const handleDragStart = useCallback((blockId: string) => {
    if (mode !== 'drag') return;
    setDraggedBlockId(blockId);
  }, [mode]);

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDragOverLevel(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(async (targetLevel: number, targetIndex?: number) => {
    if (!draggedBlockId || mode !== 'drag') return;
    
    try {
      const draggedBlock = blocks.find(b => b.id === draggedBlockId);
      if (!draggedBlock) return;

      // 같은 레벨 내에서 순서 변경인 경우
      if (draggedBlock.level === targetLevel) {
        // 같은 레벨의 모든 블록 가져오기 (드래그 중인 블록 포함)
        const allLevelBlocks = blocks
          .filter(b => b.level === targetLevel)
          .sort((a, b) => a.order - b.order);
        
        // 드래그 중인 블록의 현재 인덱스 찾기
        const currentIndex = allLevelBlocks.findIndex(b => b.id === draggedBlockId);
        
        if (currentIndex === -1) {
          // 드래그 중인 블록을 찾을 수 없으면 에러
          throw new Error('드래그 중인 블록을 찾을 수 없습니다.');
        }
        
        // calculateDropIndex가 반환하는 인덱스는 드래그 중인 블록을 포함한 blocks 배열 기준
        // allLevelBlocks도 동일한 순서이므로, targetIndex를 그대로 사용
        let actualInsertIndex: number;
        if (targetIndex !== undefined && targetIndex !== null) {
          actualInsertIndex = targetIndex;
        } else {
          actualInsertIndex = allLevelBlocks.length;
        }
        
        // targetLevelBlocks 기준으로 insertIndex 계산 (newOrder 계산용)
        const targetLevelBlocks = allLevelBlocks.filter(b => b.id !== draggedBlockId);
        let insertIndex: number;
        if (targetIndex !== undefined && targetIndex !== null) {
          // targetIndex는 allLevelBlocks 기준이므로, targetLevelBlocks 기준으로 변환
          // 드래그 중인 블록이 삽입 위치보다 앞에 있으면, 삽입 위치를 1 감소
          if (currentIndex < actualInsertIndex) {
            insertIndex = actualInsertIndex - 1;
          } else {
            insertIndex = actualInsertIndex;
          }
        } else {
          insertIndex = targetLevelBlocks.length;
        }
        
        // 새로운 order 값 계산
        let newOrder: number;
        if (targetLevelBlocks.length === 0) {
          newOrder = 0;
        } else if (insertIndex === 0) {
          newOrder = Math.max(0, targetLevelBlocks[0].order - 1);
        } else if (insertIndex >= targetLevelBlocks.length) {
          newOrder = targetLevelBlocks[targetLevelBlocks.length - 1].order + 1;
        } else {
          const prevOrder = targetLevelBlocks[insertIndex - 1].order;
          const nextOrder = targetLevelBlocks[insertIndex].order;
          if (nextOrder - prevOrder <= 1) {
            newOrder = prevOrder + 1;
          } else {
            newOrder = Math.floor((prevOrder + nextOrder) / 2);
          }
        }
        
        // 기존 위치보다 앞으로 이동하는 경우
        if (actualInsertIndex < currentIndex) {
          // 삽입 위치부터 현재 위치 전까지의 블록들의 order를 +1
          const blocksToUpdate = allLevelBlocks
            .slice(actualInsertIndex, currentIndex)
            .map(b => ({ ...b, newOrder: b.order + 1 }));
          
          const updatePromises = [
            updateBlock(draggedBlockId, { level: targetLevel, order: newOrder }),
            ...blocksToUpdate.map(b => 
              updateBlock(b.id, { order: b.newOrder })
            )
          ];
          await Promise.all(updatePromises);
        } else if (actualInsertIndex > currentIndex) {
          // 뒤로 이동하는 경우
          // 현재 위치 다음부터 삽입 위치 전까지의 블록들의 order를 -1
          // 예: a(0)를 b(1)와 c(2) 사이에 삽입하려면:
          // - a의 order를 b와 c 사이 값으로 설정 (newOrder)
          // - b의 order를 -1 (b가 a 뒤로 밀려남)
          // - c의 order는 그대로 유지
          const blocksToUpdate = allLevelBlocks
            .slice(currentIndex + 1, actualInsertIndex)
            .map(b => ({ ...b, newOrder: b.order - 1 }));
          
          const updatePromises = [
            updateBlock(draggedBlockId, { level: targetLevel, order: newOrder }),
            ...blocksToUpdate.map(b => 
              updateBlock(b.id, { order: b.newOrder })
            )
          ];
          await Promise.all(updatePromises);
        } else {
          // 같은 위치에 드롭 (변경 없음)
          // 아무것도 하지 않음
        }
      } else {
        // 다른 레벨로 이동하는 경우
        // 타겟 레벨의 블록들 가져오기 (드래그 중인 블록 제외)
        const targetLevelBlocks = blocks
          .filter(b => b.level === targetLevel && b.id !== draggedBlockId)
          .sort((a, b) => a.order - b.order);

        // calculateDropIndex가 반환하는 인덱스는 해당 레벨의 blocks 배열 기준
        // DropZone에 전달되는 blocks는 해당 레벨의 블록만 포함하므로,
        // targetIndex는 해당 레벨 내에서의 인덱스
        // targetLevelBlocks도 동일한 레벨의 블록만 포함하므로, targetIndex를 그대로 사용 가능
        let insertIndex: number;
        if (targetIndex !== undefined && targetIndex !== null) {
          // targetIndex는 해당 레벨의 blocks 배열 기준 (드래그 중인 블록 제외)
          // targetLevelBlocks도 동일하므로 그대로 사용
          insertIndex = Math.min(Math.max(0, targetIndex), targetLevelBlocks.length);
        } else {
          insertIndex = targetLevelBlocks.length;
        }

        // 새로운 order 값 계산
        let newOrder: number;
        if (targetLevelBlocks.length === 0) {
          newOrder = 0;
        } else if (insertIndex === 0) {
          newOrder = Math.max(0, targetLevelBlocks[0].order - 1);
        } else if (insertIndex >= targetLevelBlocks.length) {
          newOrder = targetLevelBlocks[targetLevelBlocks.length - 1].order + 1;
        } else {
          const prevOrder = targetLevelBlocks[insertIndex - 1].order;
          const nextOrder = targetLevelBlocks[insertIndex].order;
          if (nextOrder - prevOrder <= 1) {
            newOrder = prevOrder + 1;
          } else {
            newOrder = Math.floor((prevOrder + nextOrder) / 2);
          }
        }
        
        // 삽입 위치 이후의 블록들의 order를 +1
        // newOrder보다 크거나 같은 order를 가진 블록들만 업데이트 (중복 업데이트 방지)
        const blocksToUpdate = targetLevelBlocks
          .slice(insertIndex)
          .filter(b => b.order >= newOrder);
        
        const updatePromises = [
          updateBlock(draggedBlockId, { level: targetLevel, order: newOrder }),
          ...blocksToUpdate.map(b => 
            updateBlock(b.id, { order: b.order + 1 })
          )
        ];
        await Promise.all(updatePromises);
      }

      // fetchBlocks() 호출 제거 - updateBlock이 이미 로컬 상태를 업데이트하므로 불필요
      // await fetchBlocks();
    } catch (error) {
      handleError(error, '블록 이동에 실패했습니다.');
    } finally {
      setDraggedBlockId(null);
      setDragOverLevel(null);
      setDragOverIndex(null);
    }
  }, [draggedBlockId, mode, blocks, updateBlock, fetchBlocks]);

  // 모드 변경 핸들러
  const handleModeChange = useCallback((newMode: Mode) => {
    // 기존 모드 상태 초기화
    if (mode === 'connection') {
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
    } else if (mode === 'drag') {
      setDraggedBlockId(null);
      setDragOverLevel(null);
      setDragOverIndex(null);
    }
    setMode(newMode);
  }, [mode]);

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
      // 선택된 색상이 있으면 색상 정보와 함께 의존성 추가
      await api.addDependency(projectId, connectingFromBlockId, toBlockId, selectedConnectionColor || undefined);
      await fetchBlocks();
      
      // 의존성 색상 맵 업데이트
      if (selectedConnectionColor) {
        const colorKey = `${connectingFromBlockId}_${toBlockId}`;
        setDependencyColors(prev => ({
          ...prev,
          [colorKey]: selectedConnectionColor,
        }));
      }
      
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
    } catch (error) {
      handleError(error, '의존성 추가에 실패했습니다.');
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
    }
  }, [mode, connectingFromBlockId, projectId, selectedConnectionColor]);

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
      
      // 의존성 색상 맵에서도 제거
      const colorKey = `${fromBlockId}_${toBlockId}`;
      setDependencyColors(prev => {
        const newColors = { ...prev };
        delete newColors[colorKey];
        return newColors;
      });
    } catch (error) {
      handleError(error, '의존성 삭제에 실패했습니다.');
    }
  }, [projectId]);

  // 색상 팔레트 관리 함수
  const handleColorSelect = useCallback((color: string) => {
    setSelectedConnectionColor(color);
  }, []);

  const handleColorAdd = useCallback(async (color: string) => {
    if (!projectId) return;
    
    // 기본 팔레트에 포함된 색상만 추가 가능
    if (!CONNECTION_COLOR_PALETTE.includes(color as any)) {
      return;
    }
    
    // 이미 추가된 색상이면 무시
    if (connectionColorPalette.includes(color)) {
      return;
    }
    
    try {
      const newPalette = [...connectionColorPalette, color];
      await api.updateConnectionColorPalette(projectId, newPalette);
      setConnectionColorPalette(newPalette);
      // 새로 추가된 색상을 자동으로 선택
      setSelectedConnectionColor(color);
    } catch (error) {
      handleError(error, '색상 추가에 실패했습니다.');
    }
  }, [projectId, connectionColorPalette]);

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
            {/* 왼쪽: 입력 영역 및 블록 목록 */}
            <LeftPanel
              isCollapsed={isLeftPanelCollapsed}
              blocks={blocks}
              onQuickCreate={handleQuickCreate}
              onAIClick={handleAIClick}
              onAIArrangeClick={handleAIArrangeClick}
              onBlockDelete={handleDeleteBlock}
              onBlockEdit={handleEditBlock}
              isConnectionMode={mode === 'connection'}
              connectingFromBlockId={connectingFromBlockId}
              hoveredBlockId={hoveredBlockId}
              onConnectionStart={handleConnectionStart}
              onConnectionEnd={handleConnectionEnd}
              onBlockHover={setHoveredBlockId}
              isDragMode={mode === 'drag'}
              draggedBlockId={draggedBlockId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
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
                 isConnectionMode={mode === 'connection'}
                 connectingFromBlockId={connectingFromBlockId}
                 hoveredBlockId={hoveredBlockId}
                 onConnectionStart={handleConnectionStart}
                 onConnectionEnd={handleConnectionEnd}
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
                 onDragOver={(level, index) => {
                   setDragOverLevel(level);
                   setDragOverIndex(index ?? null);
                 }}
                 onDragLeave={() => {
                   setDragOverLevel(null);
                   setDragOverIndex(null);
                 }}
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
            {/* 왼쪽: 입력 영역 및 블록 목록 */}
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

