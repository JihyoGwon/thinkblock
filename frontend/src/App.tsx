import { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Block as BlockType } from './types/block';
import { PyramidView } from './components/PyramidView';
import { TableView } from './components/TableView';
import { Tabs } from './components/Tabs';
import { BlockForm } from './components/BlockForm';
import { BlockInput } from './components/BlockInput';
import { BlockList } from './components/BlockList';
import { CategoryManager } from './components/CategoryManager';
import { api } from './services/api';
import { groupBlocksByLevel, calculateMaxLevel } from './utils/blockUtils';
import { MODAL_STYLES, COLORS } from './constants/styles';
import { CATEGORIES as DEFAULT_CATEGORIES } from './constants/categories';
import './App.css';

function App() {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockType | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categories, setCategories] = useState<string[]>(() => {
    // 로컬스토리지에서 카테고리 불러오기
    const saved = localStorage.getItem('thinkblock_categories');
    return saved ? JSON.parse(saved) : [...DEFAULT_CATEGORIES];
  });

  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.getBlocks();
        if (!cancelled) {
          setBlocks(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (error) {
        console.error('블록 로드 실패:', error);
        if (!cancelled) {
          setBlocks([]);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateBlock = async (blockData: Omit<BlockType, 'id'>) => {
    try {
      const newBlock = await api.createBlock(blockData);
      setBlocks([...blocks, newBlock]);
      setShowForm(false);
    } catch (error) {
      console.error('블록 생성 실패:', error);
      alert('블록 생성에 실패했습니다.');
    }
  };

  const handleQuickCreate = async (title: string) => {
    try {
      // 레벨 -1로 설정하여 아직 배치되지 않은 블록으로 표시
      // 실제로는 레벨 0이 아닌 특별한 값으로 관리하거나, 별도 필드로 관리
      // 일단 level을 -1로 설정하고, 피라미드에서는 level >= 0만 표시
      const unassignedBlocks = blocks.filter((b) => b.level < 0);
      const newBlock = await api.createBlock({
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
    try {
      const updatedBlock = await api.updateBlock(blockId, updates);
      setBlocks(blocks.map((b) => (b.id === blockId ? updatedBlock : b)));
      setEditingBlock(null);
      setShowForm(false);
    } catch (error) {
      console.error('블록 업데이트 실패:', error);
      alert('블록 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('정말 이 블록을 삭제하시겠습니까?')) return;

    try {
      await api.deleteBlock(blockId);
      setBlocks(blocks.filter((b) => b.id !== blockId));
    } catch (error) {
      console.error('블록 삭제 실패:', error);
      alert('블록 삭제에 실패했습니다.');
    }
  };

  const handleEditBlock = (block: BlockType) => {
    setEditingBlock(block);
    setShowForm(true);
  };

  const handleCategoriesChange = (newCategories: string[]) => {
    setCategories(newCategories);
    localStorage.setItem('thinkblock_categories', JSON.stringify(newCategories));
  };

  // 레벨별로 블록 그룹화 (드래그앤드롭 처리를 위해 필요)
  const blocksByLevel = useMemo(() => groupBlocksByLevel(blocks), [blocks]);
  const maxLevel = useMemo(() => calculateMaxLevel(blocks), [blocks]);

  // 드래그앤드롭 핸들러 (BlockList와 PyramidView 모두에서 사용)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeBlock = blocks.find((b) => b.id === active.id);
    
    // 드롭존에 드롭한 경우 (빈 레벨에 드롭)
    if (typeof over.id === 'string' && over.id.startsWith('dropzone-level-')) {
      if (!activeBlock) return;
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

    if (!activeBlock || !overBlock) return;

    // 같은 레벨 내에서 드래그: order만 변경
    if (activeBlock.level === overBlock.level && activeBlock.level >= 0) {
      const levelBlocks = blocksByLevel[activeBlock.level] || [];
      const oldIndex = levelBlocks.findIndex((b) => b.id === active.id);
      const newIndex = levelBlocks.findIndex((b) => b.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(levelBlocks, oldIndex, newIndex);

        newOrder.forEach((block, index) => {
          if (block.order !== index) {
            handleUpdateBlock(block.id, { order: index });
          }
        });
      }
    } else if (overBlock.level >= 0) {
      // 다른 레벨로 드래그: level과 order 변경
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
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: '#212529' }}>
            ThinkBlock
          </h1>
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
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                  width: '380px',
                  flexShrink: 0,
                  backgroundColor: '#f8f9fa',
                  borderRight: '1px solid #e9ecef',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <BlockInput onSubmit={handleQuickCreate} />
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
                  blocks={blocks}
                  blocksByLevel={blocksByLevel}
                  maxLevel={maxLevel}
                  onBlockUpdate={handleUpdateBlock}
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
                width: '380px',
                flexShrink: 0,
                backgroundColor: '#f8f9fa',
                borderRight: '1px solid #e9ecef',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <BlockInput onSubmit={handleQuickCreate} />
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
    </div>
  );
}

export default App;

