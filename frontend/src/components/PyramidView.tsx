import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Block as BlockType } from '../types/block';
import { Block } from './Block';
import { DropZone } from './DropZone';
import { LEVEL_BG_COLORS } from '../constants/block';
import { getCategoryColor } from '../utils/categoryColors';

interface PyramidViewProps {
  blocksByLevel: { [level: number]: BlockType[] };
  maxLevel: number;
  onBlockDelete: (blockId: string) => void;
  onBlockEdit: (block: BlockType) => void;
  isConnectionMode?: boolean;
  connectingFromBlockId?: string | null;
  hoveredBlockId?: string | null;
  onConnectionStart?: (blockId: string) => void;
  onConnectionEnd?: (blockId: string) => void;
  onConnectionCancel?: () => void;
  onBlockHover?: (blockId: string | null) => void;
  onRemoveDependency?: (fromBlockId: string, toBlockId: string) => void;
  allBlocks?: BlockType[]; // 모든 블록을 전달받아 의존성 관계를 파악 (선택적)
  isDragMode?: boolean;
  draggedBlockId?: string | null;
  dragOverLevel?: number | null;
  dragOverIndex?: number | null;
  onDragStart?: (blockId: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (level: number, index?: number) => void;
  onDragLeave?: () => void;
  onDrop?: (level: number, index?: number) => void;
}

export const PyramidView: React.FC<PyramidViewProps> = ({
  blocksByLevel,
  maxLevel,
  onBlockDelete,
  onBlockEdit,
  isConnectionMode = false,
  connectingFromBlockId = null,
  hoveredBlockId = null,
  onConnectionStart,
  onConnectionEnd,
  onConnectionCancel,
  onBlockHover,
  onRemoveDependency,
  allBlocks: allBlocksProp,
  isDragMode = false,
  draggedBlockId = null,
  dragOverLevel = null,
  dragOverIndex = null,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<{ [blockId: string]: HTMLDivElement | null }>({});
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<{ fromId: string; toId: string } | null>(null);

  // 모든 블록 수집 - prop이 있으면 사용하고, 없으면 blocksByLevel에서 계산
  const allBlocks = React.useMemo(() => {
    if (allBlocksProp && allBlocksProp.length > 0) {
      return allBlocksProp;
    }
    const blocks: BlockType[] = [];
    Object.values(blocksByLevel).forEach(levelBlocks => {
      blocks.push(...levelBlocks);
    });
    return blocks;
  }, [allBlocksProp, blocksByLevel]);

  // 컨테이너 크기 업데이트
  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [allBlocks]);

  // 블록 위치 업데이트
  useEffect(() => {
    const updateBlockPositions = () => {
      allBlocks.forEach(block => {
        const element = document.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement;
        if (element) {
          blockRefs.current[block.id] = element as HTMLDivElement;
        }
      });
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect());
      }
    };
    
    // 즉시 업데이트
    updateBlockPositions();
    
    // 스크롤이나 리사이즈 시에도 업데이트
    const timeout = setTimeout(updateBlockPositions, 100);
    window.addEventListener('scroll', updateBlockPositions, true);
    window.addEventListener('resize', updateBlockPositions);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', updateBlockPositions, true);
      window.removeEventListener('resize', updateBlockPositions);
    };
  }, [allBlocks, blocksByLevel, connectingFromBlockId, hoveredBlockId]);

  // 연결선 그리기 함수
  const renderConnections = () => {
    console.log('renderConnections 호출:', { containerRect: !!containerRect, isConnectionMode, allBlocksCount: allBlocks.length });
    
    // 드래그 모드일 때는 연결선 렌더링 스킵 (성능 최적화)
    if (!containerRect || !isConnectionMode || isDragMode) {
      console.log('조건 불만족:', { containerRect: !!containerRect, isConnectionMode, isDragMode });
      return null;
    }

    const connections: JSX.Element[] = [];
    const definedMarkers = new Set<string>();
    const markers: JSX.Element[] = [];

    console.log('allBlocks:', allBlocks.map(b => ({ id: b.id, dependencies: b.dependencies })));

    allBlocks.forEach(block => {
      if (!block.dependencies || block.dependencies.length === 0) return;

      const fromElement = blockRefs.current[block.id];
      if (!fromElement) {
        console.log('fromElement 없음:', block.id);
        return;
      }

      const fromRect = fromElement.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const fromY = fromRect.bottom - containerRect.top;

      block.dependencies.forEach(depId => {
        const toElement = blockRefs.current[depId];
        if (!toElement) return;

        const toRect = toElement.getBoundingClientRect();
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top - containerRect.top;

        // 카테고리 색상 가져오기 - 연결선은 더 진하게 표시
        const categoryColor = block.category ? getCategoryColor(block.category) : null;
        // 카테고리 색상을 더 진하게 만들기 (약간 어둡게)
        let strokeColor = categoryColor ? categoryColor.bg : '#6366f1';
        // hex 색상을 더 진하게 만들기 (간단한 방법: RGB 값 감소)
        if (strokeColor.startsWith('#')) {
          const hex = strokeColor.slice(1);
          const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
          const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
          const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
          strokeColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }

        // 마커 ID 생성
        const markerId = `arrow-${strokeColor.replace('#', '')}`;
        if (!definedMarkers.has(markerId)) {
          definedMarkers.add(markerId);
          markers.push(
            <marker
              key={markerId}
              id={markerId}
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="2"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,4 L5,2 z" fill={strokeColor} opacity="1" />
            </marker>
          );
        }

        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const isHovered = hoveredConnection?.fromId === block.id && hoveredConnection?.toId === depId;

        connections.push(
          <g key={`${block.id}-${depId}`}>
            {/* 연결선 - 클릭 가능하도록 pointerEvents 추가 */}
            <line
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke={strokeColor}
              strokeWidth="5"
              markerEnd={`url(#${markerId})`}
              opacity="1"
              style={{ 
                pointerEvents: 'stroke',
                cursor: 'pointer',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
              onMouseEnter={() => setHoveredConnection({ fromId: block.id, toId: depId })}
              onMouseLeave={() => setHoveredConnection(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (onRemoveDependency) {
                  onRemoveDependency(block.id, depId);
                }
              }}
            />
            {/* X 버튼 - hover 시에만 표시 */}
            {isHovered && (
              <g
                transform={`translate(${midX}, ${midY})`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRemoveDependency) {
                    onRemoveDependency(block.id, depId);
                  }
                }}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="12"
                  fill="white"
                  stroke={strokeColor}
                  strokeWidth="2"
                  opacity="0.95"
                />
                <line
                  x1="-6"
                  y1="-6"
                  x2="6"
                  y2="6"
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="-6"
                  y1="6"
                  x2="6"
                  y2="-6"
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        );
      });
    });

    // 연결 중인 블록에서 호버된 블록으로의 임시 연결선
    if (connectingFromBlockId && hoveredBlockId && connectingFromBlockId !== hoveredBlockId) {
      const fromElement = blockRefs.current[connectingFromBlockId];
      const toElement = blockRefs.current[hoveredBlockId];
      if (fromElement && toElement && containerRect) {
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
        const fromY = fromRect.bottom - containerRect.top;
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top - containerRect.top;

        const fromBlock = allBlocks.find(b => b.id === connectingFromBlockId);
        const categoryColor = fromBlock?.category ? getCategoryColor(fromBlock.category) : null;
        let strokeColor = categoryColor ? categoryColor.bg : '#6366f1';
        // hex 색상을 더 진하게 만들기
        if (strokeColor.startsWith('#')) {
          const hex = strokeColor.slice(1);
          const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
          const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
          const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
          strokeColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }

        connections.push(
          <line
            key="temp-connection"
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke={strokeColor}
            strokeWidth="5"
            strokeDasharray="5,5"
            opacity="0.9"
            style={{ 
              pointerEvents: 'none',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}
          />
        );
      }
    }

    // 연결 중인 상태이거나 연결선이 있을 때만 SVG 렌더링
    console.log('연결선 개수:', connections.length, 'connectingFromBlockId:', connectingFromBlockId);
    
    if (connections.length === 0 && !connectingFromBlockId) {
      console.log('연결선 없음, SVG 렌더링 안 함');
      return null;
    }

    console.log('SVG 렌더링:', { connectionsCount: connections.length, markersCount: markers.length });
    
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        <defs>
          {markers}
        </defs>
        {connections}
      </svg>
    );
  };

  // 레벨별로 렌더링 (아래에서 위로, 낮은 레벨부터 - 일반 피라미드: 아래가 기반, 위가 목표)
  const levels = Array.from({ length: maxLevel + 1 }, (_, i) => i);

  // 레벨에 따른 배경색 - useCallback으로 최적화
  const getLevelBgColor = useCallback((level: number) => {
    return LEVEL_BG_COLORS[Math.min(level, LEVEL_BG_COLORS.length - 1)];
  }, []);

  // 레벨에 따른 너비 - 모든 레벨 동일한 너비
  const getLevelWidth = useCallback(() => 100, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* 연결선 SVG 레이어 */}
      {renderConnections()}
      
      {/* 피라미드 영역 */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-start',
          overflowY: 'auto',
          padding: '16px 20px',
        }}
        onClick={isConnectionMode && connectingFromBlockId && onConnectionCancel ? onConnectionCancel : undefined}
      >
        {levels.map((level) => {
          const levelBlocks = blocksByLevel[level] || [];
          const hasBlocks = levelBlocks.length > 0;
          const levelWidth = getLevelWidth();
          const blockCount = levelBlocks.length;
          const isSingleBlock = blockCount === 1;

          return (
            <DropZone 
              key={level} 
              level={level}
              isDragMode={isDragMode}
              dragOverLevel={dragOverLevel}
              dragOverIndex={dragOverIndex}
              draggedBlockId={draggedBlockId}
              blocks={levelBlocks}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div
                style={{
                  width: `${levelWidth}%`,
                  backgroundColor: getLevelBgColor(level),
                  borderRadius: '16px',
                  padding: isSingleBlock ? '8px 12px' : '12px',
                  border: '1px solid',
                  borderColor: level === maxLevel ? '#6366f1' : level === 0 ? '#10b981' : '#e9ecef',
                  transition: 'all 0.3s ease',
                  boxShadow: hasBlocks ? '0 4px 12px rgba(0,0,0,0.06)' : '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '80px',
                }}
              >
                {/* 레벨 태그 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: hasBlocks ? (isSingleBlock ? '4px' : '8px') : '0',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: level === maxLevel ? '#6366f1' : level === 0 ? '#10b981' : '#6c757d',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: level === maxLevel ? '#eef2ff' : level === 0 ? '#ecfdf5' : '#f1f3f5',
                      border: 'none',
                      display: 'inline-block',
                    }}
                  >
                    {level === maxLevel ? '목표' : level === 0 ? '기반' : `Level ${level}`}
                  </span>
                </div>
                {hasBlocks ? (
                  <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-start', width: '100%', position: 'relative', alignItems: 'flex-start' }}>
                    {levelBlocks.map((block, index) => (
                      <React.Fragment key={block.id}>
                        {/* 삽입 인디케이터 - 블록 앞에 표시 (세로선) */}
                        {isDragMode && 
                         dragOverLevel === level && 
                         dragOverIndex === index && 
                         draggedBlockId !== block.id && (
                          <div
                            style={{
                              width: '3px',
                              minHeight: '60px',
                              backgroundColor: '#6366f1',
                              borderRadius: '2px',
                              marginRight: '4px',
                              boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
                              position: 'relative',
                              alignSelf: 'stretch',
                              flexShrink: 0,
                            }}
                          >
                            {/* 위쪽 화살표 */}
                            <div
                              style={{
                                position: 'absolute',
                                left: '50%',
                                top: '0',
                                transform: 'translateX(-50%)',
                                width: '0',
                                height: '0',
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderBottom: '6px solid #6366f1',
                                filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.4))',
                              }}
                            />
                            {/* 아래쪽 화살표 */}
                            <div
                              style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: '0',
                                transform: 'translateX(-50%)',
                                width: '0',
                                height: '0',
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderTop: '6px solid #6366f1',
                                filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.4))',
                              }}
                            />
                          </div>
                        )}
                        <Block
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
                      </React.Fragment>
                    ))}
                    {/* 삽입 인디케이터 - 맨 끝에 표시 (모든 블록 뒤) */}
                    {isDragMode && 
                     dragOverLevel === level && 
                     dragOverIndex === levelBlocks.length && (
                      <div
                        style={{
                          width: '3px',
                          minHeight: '60px',
                          backgroundColor: '#6366f1',
                          borderRadius: '2px',
                          marginLeft: '4px',
                          boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
                          position: 'relative',
                          alignSelf: 'stretch',
                          flexShrink: 0,
                        }}
                      >
                        {/* 위쪽 화살표 */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '0',
                            transform: 'translateX(-50%)',
                            width: '0',
                            height: '0',
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderBottom: '6px solid #6366f1',
                            filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.4))',
                          }}
                        />
                        {/* 아래쪽 화살표 */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            bottom: '0',
                            transform: 'translateX(-50%)',
                            width: '0',
                            height: '0',
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '6px solid #6366f1',
                            filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.4))',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* 빈 레벨에 드롭 오버 시 인디케이터 표시 */}
                    {isDragMode && dragOverLevel === level && dragOverIndex === 0 && (
                      <div
                        style={{
                          width: '100%',
                          height: '3px',
                          backgroundColor: '#6366f1',
                          borderRadius: '2px',
                          margin: '8px 0',
                          boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '0',
                            height: '0',
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '8px solid #6366f1',
                            filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.4))',
                          }}
                        />
                      </div>
                    )}
                    <span style={{ color: '#adb5bd', fontSize: '13px', fontStyle: 'italic', textAlign: 'left' }}>
                      여기에 블록을 드롭하세요
                    </span>
                  </>
                )}
              </div>
            </DropZone>
          );
        })}
      </div>
    </div>
  );
};

