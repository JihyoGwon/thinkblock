import React from 'react';
import { Block as BlockType } from '../types/block';
import { Block } from './Block';

interface BlockListProps {
  blocks: BlockType[];
  onBlockClick: (block: BlockType) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockEdit: (block: BlockType) => void;
}

export const BlockList: React.FC<BlockListProps> = ({
  blocks,
  onBlockClick,
  onBlockDelete,
  onBlockEdit,
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
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
        블록 목록 ({unassignedBlocks.length})
      </h3>
      {unassignedBlocks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#999',
            fontSize: '14px',
          }}
        >
          추가된 블록이 여기에 표시됩니다.
          <br />
          블록을 드래그하여 피라미드에 배치하세요.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {unassignedBlocks.map((block) => (
            <Block
              key={block.id}
              block={block}
              onEdit={onBlockEdit}
              onDelete={onBlockDelete}
              onClick={onBlockClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

