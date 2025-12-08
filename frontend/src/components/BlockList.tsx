import React from 'react';
import { Block as BlockType } from '../types/block';
import { Block } from './Block';

interface BlockListProps {
  blocks: BlockType[];
  onBlockDelete: (blockId: string) => void;
  onBlockEdit: (block: BlockType) => void;
  isConnectionMode?: boolean;
  connectingFromBlockId?: string | null;
  hoveredBlockId?: string | null;
  onConnectionStart?: (blockId: string) => void;
  onConnectionEnd?: (blockId: string) => void;
  onBlockHover?: (blockId: string | null) => void;
  isDragMode?: boolean;
  draggedBlockId?: string | null;
  onDragStart?: (blockId: string) => void;
  onDragEnd?: () => void;
}

export const BlockList: React.FC<BlockListProps> = ({
  blocks,
  onBlockDelete,
  onBlockEdit,
  isConnectionMode = false,
  connectingFromBlockId = null,
  hoveredBlockId = null,
  onConnectionStart,
  onConnectionEnd,
  onBlockHover,
  isDragMode = false,
  draggedBlockId = null,
  onDragStart,
  onDragEnd,
}) => {
  // 레벨이 0 미만인 블록들만 표시 (아직 피라미드에 배치되지 않은 블록)
  const unassignedBlocks = blocks.filter((block) => block.level < 0);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        paddingTop: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#495057' }}>
        블록 목록 ({unassignedBlocks.length})
      </h3>
      {unassignedBlocks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#adb5bd',
            fontSize: '14px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px dashed #e9ecef',
          }}
        >
          추가된 블록이 여기에 표시됩니다.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            alignItems: 'flex-start', // 왼쪽 정렬
            paddingLeft: '0', // 왼쪽 여백 제거
          }}
        >
          {unassignedBlocks.map((block) => (
            <Block
              key={block.id}
              block={block}
              onEdit={onBlockEdit}
              onDelete={onBlockDelete}
              isConnectionMode={isConnectionMode}
              connectingFromBlockId={connectingFromBlockId}
              hoveredBlockId={hoveredBlockId}
              onConnectionStart={onConnectionStart}
              onConnectionEnd={onConnectionEnd}
              onBlockHover={onBlockHover}
              isDragMode={isDragMode}
              draggedBlockId={draggedBlockId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
};

