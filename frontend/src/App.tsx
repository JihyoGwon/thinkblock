import React, { useState, useEffect } from 'react';
import { Block as BlockType } from './types/block';
import { PyramidView } from './components/PyramidView';
import { BlockForm } from './components/BlockForm';
import { api } from './services/api';
import './App.css';

function App() {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockType | null>(null);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const data = await api.getBlocks();
      setBlocks(data);
    } catch (error) {
      console.error('블록 로드 실패:', error);
    } finally {
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
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header
        style={{
          backgroundColor: '#1976d2',
          color: 'white',
          padding: '16px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '24px' }}>ThinkBlock</h1>
          <button
            onClick={() => {
              setEditingBlock(null);
              setShowForm(true);
            }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#1976d2',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + 블록 추가
          </button>
        </div>
      </header>

      <main>
        {blocks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666',
            }}
          >
            <p style={{ fontSize: '18px', marginBottom: '16px' }}>
              아직 블록이 없습니다.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#1976d2',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              첫 번째 블록 추가하기
            </button>
          </div>
        ) : (
          <PyramidView
            blocks={blocks}
            onBlockUpdate={handleUpdateBlock}
            onBlockDelete={handleDeleteBlock}
            onBlockEdit={handleEditBlock}
          />
        )}
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
    </div>
  );
}

export default App;

