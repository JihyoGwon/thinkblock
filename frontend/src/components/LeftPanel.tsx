import React from 'react';
import { BlockInput } from './BlockInput';
import { BlockList } from './BlockList';
import { Block as BlockType } from '../types/block';

interface LeftPanelProps {
  isCollapsed: boolean;
  blocks: BlockType[];
  onQuickCreate: (title: string) => void;
  onAIClick: () => void;
  onAIArrangeClick: () => void;
  onBlockDelete: (blockId: string) => void;
  onBlockEdit: (block: BlockType) => void;
  isEditMode?: boolean;
  isConnectionMode?: boolean;
  connectingFromBlockId?: string | null;
  hoveredBlockId?: string | null;
  onConnectionStart?: (blockId: string) => void;
  onConnectionEnd?: (blockId: string) => void;
  onBlockHover?: (blockId: string | null) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  isCollapsed,
  blocks,
  onQuickCreate,
  onAIClick,
  onAIArrangeClick,
  onBlockDelete,
  onBlockEdit,
  isEditMode = false,
  isConnectionMode = false,
  connectingFromBlockId = null,
  hoveredBlockId = null,
  onConnectionStart,
  onConnectionEnd,
  onBlockHover,
}) => {
  return (
    <div
      style={{
        width: isCollapsed ? '0' : '400px',
        flexShrink: 0,
        backgroundColor: '#f8f9fa',
        borderRight: isCollapsed ? 'none' : '1px solid #e9ecef',
        padding: isCollapsed ? '0' : '32px',
        display: isCollapsed ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease, padding 0.3s ease, border 0.3s ease',
      }}
    >
      <BlockInput 
        onSubmit={onQuickCreate} 
        onAIClick={onAIClick} 
        onAIArrangeClick={onAIArrangeClick}
      />
      <BlockList
        blocks={blocks}
        onBlockDelete={onBlockDelete}
        onBlockEdit={onBlockEdit}
        isEditMode={isEditMode}
        isConnectionMode={isConnectionMode}
        connectingFromBlockId={connectingFromBlockId}
        hoveredBlockId={hoveredBlockId}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        onBlockHover={onBlockHover}
      />
    </div>
  );
};

