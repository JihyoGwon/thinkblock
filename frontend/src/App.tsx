import React, { useState, useEffect } from 'react';
import { Block as BlockType } from './types/block';
import { PyramidView } from './components/PyramidView';
import { BlockForm } from './components/BlockForm';
import { BlockInput } from './components/BlockInput';
import { BlockList } from './components/BlockList';
import { BlockDescriptionModal } from './components/BlockDescriptionModal';
import { api } from './services/api';
import './App.css';

function App() {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockType | null>(null);
  const [descriptionModalBlock, setDescriptionModalBlock] = useState<BlockType | null>(null);

  useEffect(() => {
    console.log('App 컴포넌트 마운트됨, loadBlocks 호출');
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      console.log('블록 로드 시작...');
      const data = await api.getBlocks();
      console.log('블록 로드 성공:', data);
      setBlocks(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('블록 로드 실패:', error);
      console.error('에러 상세:', error.message || error);
      // 에러가 발생해도 빈 배열로 설정하여 로딩 상태 해제
      setBlocks([]);
      // 네트워크 에러인 경우 사용자에게 알림
      if (error?.message) {
        alert(`블록 로드 실패: ${error.message}`);
      }
    } finally {
      console.log('로딩 상태 해제');
      setLoading(false);
    }
  };

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

  const handleBlockClick = (block: BlockType) => {
    setDescriptionModalBlock(block);
  };

  const handleSaveDescription = async (blockId: string, description: string) => {
    try {
      await handleUpdateBlock(blockId, { description });
    } catch (error) {
      console.error('설명 저장 실패:', error);
      alert('설명 저장에 실패했습니다.');
    }
  };

  const handleUpdateBlock = async (blockId: string, updates: Partial<BlockType>) => {
    try {
      const updatedBlock = await api.updateBlock(blockId, updates);
      setBlocks(blocks.map((b) => (b.id === blockId ? updatedBlock : b)));
      setEditingBlock(null);
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

  const maxLevel = Math.max(...blocks.map((b) => b.level), 0);

  if (loading) {
    console.log('로딩 상태:', loading);
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>로딩 중...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          백엔드 서버가 실행 중인지 확인하세요.
          <br />
          콘솔(F12)에서 에러 메시지를 확인하세요.
        </div>
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
        </div>
      </header>

      <main
          style={{
            display: 'flex',
            flexDirection: 'row',
            height: 'calc(100vh - 80px)',
            backgroundColor: '#fafafa',
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
              onBlockClick={handleBlockClick}
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
              onBlockUpdate={handleUpdateBlock}
              onBlockDelete={handleDeleteBlock}
              onBlockEdit={handleEditBlock}
              onBlockClick={handleBlockClick}
            />
          </div>
        </main>

      {showForm && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 999,
            }}
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
          />
        </>
      )}

      {descriptionModalBlock && (
        <BlockDescriptionModal
          block={descriptionModalBlock}
          onSave={handleSaveDescription}
          onClose={() => setDescriptionModalBlock(null)}
        />
      )}
    </div>
  );
}

export default App;

