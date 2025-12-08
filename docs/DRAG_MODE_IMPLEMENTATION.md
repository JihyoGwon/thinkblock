# 드래그 모드 구현 가이드

## 개요
블록을 드래그앤드롭으로 레벨 간 이동할 수 있는 드래그 모드 구현 가이드입니다.

## 구현 순서

### 1단계: 타입 정의 확장

#### 1.1 모드 타입에 'drag' 추가
**파일**: `frontend/src/types/common.ts`

**작업 내용**:
- `Mode` 타입에 `'drag'` 추가
- 기존: `export type Mode = 'view' | 'connection';`
- 변경: `export type Mode = 'view' | 'connection' | 'drag';`

**주의사항**:
- 타입 변경으로 인해 기존 코드에서 타입 에러가 발생할 수 있으므로, 모든 모드 체크 로직을 확인해야 함

---

### 2단계: Tabs 컴포넌트 수정

#### 2.1 손가락 아이콘 버튼 기능 수정
**파일**: `frontend/src/components/Tabs.tsx`

**작업 내용**:
1. 손가락 아이콘 버튼의 `onClick` 핸들러 수정
   - 현재: `onClick={() => onModeChange('view')}`
   - 변경: `onClick={() => onModeChange('drag')}`

2. 드래그 모드 활성화 상태 표시 추가
   - `mode === 'drag'`일 때 배경색과 텍스트 색상 변경
   - 보기 모드와 연결선 모드와 동일한 스타일 패턴 적용

**구현 예시**:
```typescript
<button
  onClick={() => onModeChange('drag')}
  style={{
    padding: '8px',
    border: 'none',
    backgroundColor: mode === 'drag' ? '#6366f1' : 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: mode === 'drag' ? '#ffffff' : '#6c757d',
  }}
  // ... hover 이벤트 핸들러
>
```

**주의사항**:
- 세 가지 모드(보기, 드래그, 연결선) 중 하나만 활성화되도록 보장
- 모드 전환 시 기존 상태 초기화 필요 (예: 연결선 모드의 `connectingFromBlockId`)

---

### 3단계: App.tsx 상태 관리 추가

#### 3.1 드래그 모드 상태 추가
**파일**: `frontend/src/App.tsx`

**작업 내용**:
1. 모드 타입 업데이트
   - `useState<'view' | 'connection'>` → `useState<Mode>`
   - `Mode` 타입 import 추가

2. 드래그 관련 상태 추가
   ```typescript
   const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
   const [dragOverLevel, setDragOverLevel] = useState<number | null>(null);
   const [dragOverIndex, setDragOverIndex] = useState<number | null>(null); // 드롭 위치 인덱스
   ```

3. 드래그 핸들러 함수 추가
   ```typescript
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
           throw new Error('드래그 중인 블록을 찾을 수 없습니다.');
         }
         
         // calculateDropIndex가 반환하는 인덱스는 드래그 중인 블록을 포함한 blocks 배열 기준
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
         }
       } else {
         // 다른 레벨로 이동하는 경우
         const targetLevelBlocks = blocks
           .filter(b => b.level === targetLevel && b.id !== draggedBlockId)
           .sort((a, b) => a.order - b.order);

         // calculateDropIndex가 반환하는 인덱스는 해당 레벨의 blocks 배열 기준
         // DropZone에 전달되는 blocks는 해당 레벨의 블록만 포함하므로,
         // targetIndex는 해당 레벨 내에서의 인덱스
         let insertIndex: number;
         if (targetIndex !== undefined && targetIndex !== null) {
           // 범위 체크 추가 (안전성)
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
     } catch (error) {
       handleError(error, '블록 이동에 실패했습니다.');
     } finally {
       setDraggedBlockId(null);
       setDragOverLevel(null);
       setDragOverIndex(null);
     }
   }, [draggedBlockId, mode, blocks, updateBlock]);
   ```

**주의사항**:
- `handleDrop`에서 드롭 위치(`targetIndex`)를 받아서 정확한 `order` 값 계산
- 같은 레벨 내에서 순서 변경 시 기존 블록들의 `order` 재조정 필요
  - 앞으로 이동: 삽입 위치부터 현재 위치 전까지의 블록들의 `order`를 +1
  - 뒤로 이동: 현재 위치 다음부터 삽입 위치 전까지의 블록들의 `order`를 -1
- 다른 레벨로 이동 시 삽입 위치 이후 블록들의 `order` 재조정 필요
- 드래그 중 모드 변경 시 드래그 상태 초기화 필요

**`order` 연속성 관련**:
- 드래그앤드롭 로직 자체는 `order` 값을 연속적으로 유지함 (0, 1, 2, 3...)
- **블록 삭제 시 `order` 재조정 로직을 반드시 구현해야 함** (10단계 참고)
  - 삭제된 블록보다 뒤에 있는 같은 레벨의 블록들의 `order`를 -1씩 감소
  - 예: [블록A(order:0), 블록B(order:1), 블록C(order:2)]에서 블록B 삭제 시
  - 블록C의 order를 2 → 1로 재조정
  - 결과: [블록A(order:0), 블록C(order:1)] → 연속성 유지 ✅

**order 재조정 예시**:

**예시 1: 같은 레벨 내에서 앞으로 이동**
```
초기 상태: Level 1에 [블록A(order:0), 블록B(order:1), 블록C(order:2)]
블록C를 블록A 앞으로 이동

1. 드래그 중인 블록: 블록C (현재 인덱스: 2)
2. 삽입 위치: 0 (블록A 앞)
3. 블록C의 새 order 계산: 0 (맨 앞)
4. 재조정 대상: 삽입 위치(0)부터 현재 위치 전(2)까지 → 블록A, 블록B
   - 블록A: order 0 → 1
   - 블록B: order 1 → 2
   - 블록C: order 2 → 0
5. 결과: [블록C(order:0), 블록A(order:1), 블록B(order:2)]
```

**예시 2: 같은 레벨 내에서 뒤로 이동**
```
초기 상태: Level 1에 [블록A(order:0), 블록B(order:1), 블록C(order:2)]
블록A를 맨 끝으로 이동

1. 드래그 중인 블록: 블록A (현재 인덱스: 0)
2. 삽입 위치: 3 (맨 끝)
3. 블록A의 새 order 계산: 2 (마지막 블록 order + 1)
4. 재조정 대상: 현재 위치 다음(1)부터 삽입 위치 전(3)까지 → 블록B, 블록C
   - 블록B: order 1 → 0
   - 블록C: order 2 → 1
   - 블록A: order 0 → 2
5. 결과: [블록B(order:0), 블록C(order:1), 블록A(order:2)]
```

**예시 3: 다른 레벨로 이동**
```
초기 상태: 
  Level 0: [블록A(order:0), 블록B(order:1)]
  Level 1: [블록C(order:0), 블록D(order:1)]
블록A를 Level 1의 블록C와 블록D 사이로 이동

1. 드래그 중인 블록: 블록A (Level 0)
2. 타겟 레벨: Level 1
3. 삽입 위치: 1 (블록C와 블록D 사이)
4. 블록A의 새 order 계산: 블록C(order:0)와 블록D(order:1) 사이 → 1
5. 재조정 대상: 삽입 위치(1) 이후 → 블록D
   - 블록D: order 1 → 2
   - 블록A: level 0 → 1, order 0 → 1
6. 결과:
  Level 0: [블록B(order:1)]
  Level 1: [블록C(order:0), 블록A(order:1), 블록D(order:2)]
```

---

### 4단계: Block 컴포넌트 드래그 기능 추가

#### 4.1 Block Props 확장
**파일**: `frontend/src/components/Block.tsx`

**작업 내용**:
1. Props 인터페이스에 드래그 관련 props 추가
   ```typescript
   interface BlockProps {
     // ... 기존 props
     isDragMode?: boolean;
     draggedBlockId?: string | null;
     onDragStart?: (blockId: string) => void;
     onDragEnd?: () => void;
   }
   ```

#### 4.2 드래그 이벤트 핸들러 추가
**작업 내용**:
1. `draggable` 속성 추가
   - 드래그 모드일 때만 `draggable="true"`
   - 다른 모드일 때는 `draggable="false"` 또는 생략

2. 드래그 이벤트 핸들러 구현
   ```typescript
   const handleDragStart = (e: React.DragEvent) => {
     if (!isDragMode || !onDragStart) return;
     e.dataTransfer.effectAllowed = 'move';
     e.dataTransfer.setData('text/plain', block.id);
     onDragStart(block.id);
   };

   const handleDragEnd = (e: React.DragEvent) => {
     if (!isDragMode || !onDragEnd) return;
     onDragEnd();
   };
   ```

3. 스타일 수정
   - 드래그 모드일 때 커서: `cursor: isDragMode ? 'grab' : 'pointer'`
   - 드래그 중일 때: `cursor: 'grabbing'`, `opacity: 0.5`
   - 드래그 중인 블록 표시: `draggedBlockId === block.id`일 때 시각적 피드백

4. onClick 이벤트 수정
   - 드래그 모드일 때는 편집 모달을 열지 않도록 수정
   ```typescript
   onClick={(e) => {
     if (isDragMode) {
       // 드래그 모드에서는 클릭 이벤트 무시
       return;
     }
     // ... 기존 로직
   }}
   ```

**주의사항**:
- `onMouseDown`과 드래그 이벤트가 충돌하지 않도록 주의
- 삭제 버튼 클릭 시 드래그가 시작되지 않도록 `onMouseDown`에서 `stopPropagation` 유지

---

### 5단계: DropZone 컴포넌트 드롭 기능 추가

#### 5.1 DropZone Props 확장
**파일**: `frontend/src/components/DropZone.tsx`

**작업 내용**:
1. Props 인터페이스 확장
   ```typescript
   interface DropZoneProps {
     level: number;
     children: React.ReactNode;
     isDragMode?: boolean;
     dragOverLevel?: number | null;
     dragOverIndex?: number | null;
     draggedBlockId?: string | null;
     blocks?: BlockType[]; // 해당 레벨의 블록 목록 (드롭 위치 계산용)
     onDragOver?: (level: number, index?: number) => void;
     onDragLeave?: () => void;
     onDrop?: (level: number, index?: number) => void;
   }
   ```

#### 5.2 드롭 이벤트 핸들러 구현
**작업 내용**:
1. 드롭 위치 계산 함수 추가
   ```typescript
   // 드래그 중인 마우스 위치를 기반으로 삽입 인덱스 계산
   const calculateDropIndex = (e: React.DragEvent): number | undefined => {
     if (!blocks || blocks.length === 0) return 0;
     
     const dropZoneElement = e.currentTarget as HTMLElement;
     const mouseX = e.clientX;
     const mouseY = e.clientY;
     
     // 블록 요소들을 찾아서 위치 계산 (드래그 중인 블록 제외)
     const blockElements = Array.from(dropZoneElement.querySelectorAll('[data-block-id]'))
       .filter(el => {
         const blockId = (el as HTMLElement).getAttribute('data-block-id');
         return blockId !== draggedBlockId;
       }) as HTMLElement[];
     
     if (blockElements.length === 0) return 0;
     
     // 블록들을 위치 순서로 정렬 (Y 좌표 우선, 그 다음 X 좌표)
     const blocksWithIndex = blockElements
       .map((el) => {
         const blockId = el.getAttribute('data-block-id');
         const originalIndex = blocks.findIndex(b => b.id === blockId);
         const rect = el.getBoundingClientRect();
         return {
           element: el,
           rect,
           blockId,
           originalIndex: originalIndex !== -1 ? originalIndex : blocks.length,
           distanceY: Math.abs(rect.top + rect.height / 2 - mouseY),
           distanceX: Math.abs(rect.left + rect.width / 2 - mouseX),
         };
       })
       .sort((a, b) => {
         // 같은 줄에 있는지 확인 (Y 좌표 차이가 작으면 같은 줄)
         const sameRowA = a.distanceY < a.rect.height;
         const sameRowB = b.distanceY < b.rect.height;
         
         if (sameRowA && !sameRowB) return -1;
         if (!sameRowA && sameRowB) return 1;
         
         // 같은 줄이면 X 좌표로 정렬, 다른 줄이면 Y 좌표로 정렬
         if (sameRowA && sameRowB) {
           return a.rect.left - b.rect.left;
         } else {
           return a.rect.top - b.rect.top;
         }
       });
     
     let insertIndex = blocks.length; // 기본값: 맨 끝
     
     // 마우스 위치를 기반으로 삽입 위치 찾기
     for (let i = 0; i < blocksWithIndex.length; i++) {
       const blockRect = blocksWithIndex[i].rect;
       const blockCenterX = blockRect.left + blockRect.width / 2;
       const blockCenterY = blockRect.top + blockRect.height / 2;
       
       // 마우스가 블록과 같은 줄에 있는지 확인 (Y 좌표 차이가 블록 높이의 절반 이하)
       const isSameRow = Math.abs(mouseY - blockCenterY) < blockRect.height / 2;
       
       if (isSameRow) {
         // 같은 줄에 있으면 X 좌표로 판단
         if (mouseX < blockRect.left) {
           // 마우스가 블록의 왼쪽 경계 전에 있으면 그 앞에 삽입
           insertIndex = blocksWithIndex[i].originalIndex;
           break;
         } else if (mouseX <= blockRect.right) {
           // 마우스가 블록 안에 있으면
           if (mouseX < blockCenterX) {
             // 블록의 왼쪽 절반에 있으면 그 앞에 삽입
             insertIndex = blocksWithIndex[i].originalIndex;
             break;
           } else {
             // 블록의 오른쪽 절반에 있으면 그 뒤에 삽입
             if (i < blocksWithIndex.length - 1) {
               const nextBlock = blocksWithIndex[i + 1];
               const nextBlockRect = nextBlock.rect;
               const isNextSameRow = Math.abs(mouseY - (nextBlockRect.top + nextBlockRect.height / 2)) < nextBlockRect.height / 2;
               
               if (isNextSameRow && mouseX > blockRect.right) {
                 // 다음 블록도 같은 줄에 있고 마우스가 현재 블록 오른쪽 경계 밖에 있으면 다음 블록 앞에 삽입
                 insertIndex = nextBlock.originalIndex;
                 break;
               } else {
                 // 다음 블록이 다른 줄이거나 마우스가 블록 안에 있으면 현재 블록 뒤에 삽입
                 insertIndex = blocksWithIndex[i].originalIndex + 1;
                 break;
               }
             } else {
               // 마지막 블록이면 그 뒤에 삽입
               insertIndex = blocksWithIndex[i].originalIndex + 1;
               break;
             }
           }
         }
       }
     }
     
     // 마우스가 모든 블록보다 오른쪽에 있고 같은 줄에 있으면 맨 끝
     if (insertIndex === blocks.length && blocksWithIndex.length > 0) {
       const lastRowBlocks = blocksWithIndex.filter(b => {
         const blockCenterY = b.rect.top + b.rect.height / 2;
         return Math.abs(mouseY - blockCenterY) < b.rect.height / 2;
       });
       
       if (lastRowBlocks.length > 0) {
         const rightmostBlock = lastRowBlocks[lastRowBlocks.length - 1];
         if (mouseX > rightmostBlock.rect.right) {
           insertIndex = rightmostBlock.originalIndex + 1;
         }
       }
     }
     
     return insertIndex;
   };
   ```
   
**주의사항**:
- 블록들이 가로로 배치되어 있으므로 X 좌표를 기준으로 삽입 위치 계산
- 다중 행 레이아웃을 지원하기 위해 Y 좌표로 같은 줄 판단
- 블록의 왼쪽 경계(`blockRect.left`)를 고려하여 정확한 삽입 위치 계산
- 드래그 중인 블록은 계산에서 제외

2. 드롭 이벤트 핸들러 추가
   ```typescript
   const handleDragOver = (e: React.DragEvent) => {
     if (!isDragMode) return;
     e.preventDefault();
     e.stopPropagation();
     e.dataTransfer.dropEffect = 'move';
     
     // 드롭 위치 인덱스 계산
     const dropIndex = calculateDropIndex(e);
     
     if (onDragOver) {
       onDragOver(level, dropIndex);
     }
   };

   const handleDrop = (e: React.DragEvent) => {
     if (!isDragMode || !onDrop) return;
     e.preventDefault();
     e.stopPropagation();
     
     // 드롭 위치 인덱스 계산
     const dropIndex = calculateDropIndex(e);
     
     onDrop(level, dropIndex);
   };

   const handleDragLeave = (e: React.DragEvent) => {
     if (!isDragMode || !onDragLeave) return;
     // 자식 요소로 이동한 경우는 무시
     if (e.currentTarget.contains(e.relatedTarget as Node)) {
       return;
     }
     onDragLeave();
   };
   ```

2. 시각적 피드백 추가
   - `dragOverLevel === level`일 때 배경색 변경 또는 테두리 강조
   - 드롭 가능한 영역임을 명확히 표시

**주의사항**:
- `onDragOver`에서 `preventDefault()` 필수 (기본 동작이 드롭을 막음)
- `handleDragLeave`에서 자식 요소로의 이동은 무시해야 함 (깜빡임 방지)
- 블록들이 가로로 배치되어 있으므로 X 좌표를 기준으로 삽입 위치 계산
- 다중 행 레이아웃을 지원하기 위해 Y 좌표로 같은 줄 판단
- 블록의 왼쪽 경계(`blockRect.left`)를 고려하여 정확한 삽입 위치 계산
- 드래그 중인 블록은 계산에서 제외

---

### 6단계: PyramidView 컴포넌트 통합

#### 6.1 Props 전달
**파일**: `frontend/src/components/PyramidView.tsx`

**작업 내용**:
1. Props 인터페이스에 드래그 관련 props 추가
   ```typescript
   interface PyramidViewProps {
     // ... 기존 props
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
   ```

2. DropZone에 props 전달
   ```typescript
   <DropZone 
     key={level} 
     level={level}
     isDragMode={isDragMode}
     dragOverLevel={dragOverLevel}
     dragOverIndex={dragOverIndex}
     draggedBlockId={draggedBlockId}
     blocks={levelBlocks} // 해당 레벨의 블록 목록 전달
     onDragOver={onDragOver}
     onDragLeave={onDragLeave}
     onDrop={onDrop}
   >
   ```

3. Block 컴포넌트에 드래그 props 전달
   ```typescript
   <Block
     // ... 기존 props
     isDragMode={isDragMode}
     draggedBlockId={draggedBlockId}
     onDragStart={onDragStart}
     onDragEnd={onDragEnd}
   />
   ```

4. 삽입 인디케이터 렌더링
   - 드래그 모드에서 드롭 위치를 시각적으로 표시
   - 블록 앞/뒤에 세로 인디케이터 표시
   - 빈 레벨에 가로 인디케이터 표시
   ```typescript
   {isDragMode && 
    dragOverLevel === level && 
    dragOverIndex === index && 
    draggedBlockId !== block.id && (
     <InsertionIndicator type="vertical" position="before" />
   )}
   ```

**주의사항**:
- 연결선 모드와 드래그 모드가 동시에 활성화되지 않도록 보장
- 드래그 모드일 때 연결선 렌더링 스킵 (성능 최적화)
- 삽입 인디케이터는 드래그 중인 블록이 아닐 때만 표시

---

### 7단계: BlockList 컴포넌트 통합

#### 7.1 LeftPanel에서 BlockList로 props 전달
**파일**: `frontend/src/components/LeftPanel.tsx`, `frontend/src/components/BlockList.tsx`

**작업 내용**:
1. LeftPanel에 드래그 관련 props 추가
2. BlockList에 드래그 관련 props 추가
3. Block 컴포넌트에 드래그 props 전달

**주의사항**:
- 왼쪽 패널의 블록 목록에서도 드래그 가능해야 함
- 드래그 모드일 때 블록 목록의 블록도 피라미드로 드래그 가능해야 함

---

### 8단계: App.tsx 최종 통합

#### 8.1 모든 컴포넌트에 props 전달
**파일**: `frontend/src/App.tsx`

**작업 내용**:
1. PyramidView에 드래그 관련 props 전달
   ```typescript
   <PyramidView
     // ... 기존 props
     isDragMode={mode === 'drag'}
     draggedBlockId={draggedBlockId}
     dragOverLevel={dragOverLevel}
     dragOverIndex={dragOverIndex}
     onDragStart={handleDragStart}
     onDragEnd={handleDragEnd}
     onDragOver={(level, index) => {
       setDragOverLevel(level);
       setDragOverIndex(index);
     }}
     onDragLeave={() => {
       setDragOverLevel(null);
       setDragOverIndex(null);
     }}
     onDrop={handleDrop}
   />
   ```

2. LeftPanel에 드래그 관련 props 전달
   ```typescript
   <LeftPanel
     // ... 기존 props
     isDragMode={mode === 'drag'}
     draggedBlockId={draggedBlockId}
     onDragStart={handleDragStart}
     onDragEnd={handleDragEnd}
   />
   ```

**주의사항**:
- 모드 전환 시 드래그 상태 초기화
- 에러 처리 및 사용자 피드백 추가

---

### 9단계: 모드 전환 시 상태 초기화

#### 9.1 모드 변경 시 정리 로직
**파일**: `frontend/src/App.tsx`

**작업 내용**:
1. 모드 변경 핸들러 수정
   ```typescript
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
   ```

**주의사항**:
- 모드 전환 시 모든 관련 상태를 깔끔하게 초기화
- 사용자 경험을 해치지 않도록 주의

---

### 10단계: 테스트 및 최적화

#### 10.1 기능 테스트 항목
1. **기본 드래그앤드롭**
   - 블록을 드래그하여 다른 레벨로 이동
   - 드롭 영역 시각적 피드백 확인
   - 드롭 후 블록이 올바른 레벨에 배치되는지 확인

2. **모드 전환**
   - 드래그 모드 ↔ 보기 모드 전환
   - 드래그 모드 ↔ 연결선 모드 전환
   - 드래그 중 모드 전환 시 상태 초기화 확인

3. **이벤트 충돌 방지**
   - 드래그 모드에서 블록 클릭 시 편집 모달이 열리지 않는지 확인
   - 삭제 버튼 클릭 시 드래그가 시작되지 않는지 확인
   - 연결선 모드와 드래그 모드가 동시에 활성화되지 않는지 확인

4. **에러 처리**
   - 네트워크 에러 시 적절한 에러 메시지 표시
   - 드롭 실패 시 원래 위치로 복귀

#### 10.2 성능 최적화
1. **불필요한 리렌더링 방지**
   - `useCallback`으로 이벤트 핸들러 메모이제이션
   - `useMemo`로 계산된 값 캐싱
   - 드래그 중인 블록만 opacity 변경
   - `fetchBlocks()` 호출 제거 - `updateBlock`이 이미 로컬 상태를 업데이트

2. **드래그 모드 최적화**
   - 드래그 모드일 때 연결선 렌더링 스킵
   - 드래그 중 불필요한 애니메이션 비활성화

3. **드롭 위치 계산 최적화**
   - 블록의 왼쪽 경계(`blockRect.left`)를 고려하여 정확한 삽입 위치 계산
   - 다중 행 레이아웃 지원 (Y 좌표로 같은 줄 판단)
   - X 좌표 기반 삽입 위치 계산 (가로 배치 블록)

#### 10.3 접근성 개선
1. 키보드 접근성 (선택사항)
   - 키보드로 블록 선택 및 레벨 이동
   - 스크린 리더 지원

2. 시각적 피드백 강화
   - 드래그 중 블록 반투명 처리
   - 드롭 가능 영역 명확한 표시
   - 드롭 불가 영역 표시 (필요시)

---

## 구현 시 주의사항

### 1. 이벤트 전파 제어
- 드래그 이벤트와 클릭 이벤트가 충돌하지 않도록 주의
- `stopPropagation()` 적절히 사용
- 삭제 버튼 등 특정 요소는 드래그를 방지해야 함

### 2. 상태 관리
- 드래그 상태는 최상위 컴포넌트(App)에서 관리
- 모드 전환 시 모든 관련 상태 초기화
- 에러 발생 시 상태 복구

### 3. 사용자 경험
- 드래그 시작 시 즉각적인 시각적 피드백
- 드롭 가능 영역 명확한 표시
- 드롭 불가 영역도 명확히 표시 (필요시)
- 드래그 취소 시 원래 위치로 복귀 (선택사항)

### 4. 성능
- 드래그 중 불필요한 리렌더링 최소화
- 드래그 모드일 때 불필요한 기능 비활성화
- 대량의 블록이 있어도 부드러운 드래그 경험

### 5. 에러 처리
- 네트워크 에러 시 사용자에게 명확한 메시지
- 드롭 실패 시 원래 상태로 복구
- 서버와 클라이언트 상태 동기화

---

## 체크리스트

### 타입 및 인터페이스
- [ ] `Mode` 타입에 `'drag'` 추가
- [ ] Block 컴포넌트 Props에 드래그 관련 props 추가
- [ ] DropZone 컴포넌트 Props에 드래그 관련 props 추가
- [ ] PyramidView Props에 드래그 관련 props 추가
- [ ] BlockList Props에 드래그 관련 props 추가
- [ ] LeftPanel Props에 드래그 관련 props 추가

### 상태 관리
- [ ] App.tsx에 드래그 관련 상태 추가
- [ ] 드래그 핸들러 함수 구현
- [ ] 모드 전환 시 상태 초기화 로직 추가

### UI 컴포넌트
- [ ] Tabs 컴포넌트 손가락 아이콘 버튼 수정
- [ ] Block 컴포넌트에 드래그 이벤트 추가
- [ ] Block 컴포넌트 스타일 수정 (커서, opacity 등)
- [ ] DropZone 컴포넌트에 드롭 이벤트 추가
- [ ] DropZone 시각적 피드백 추가

### 통합
- [ ] PyramidView에 드래그 props 전달
- [ ] BlockList에 드래그 props 전달
- [ ] LeftPanel에 드래그 props 전달
- [ ] App.tsx에서 모든 컴포넌트에 props 전달

### 테스트
- [ ] 기본 드래그앤드롭 동작 확인
- [ ] 모드 전환 동작 확인
- [ ] 이벤트 충돌 방지 확인
- [ ] 에러 처리 확인
- [ ] 성능 테스트

---

## 예상 소요 시간

- 타입 정의 및 기본 구조: 30분
- Block 컴포넌트 드래그 기능: 1시간
- DropZone 컴포넌트 드롭 기능: 1시간
- 통합 및 상태 관리: 1시간
- 테스트 및 버그 수정: 1시간
- 최적화 및 다듬기: 30분

**총 예상 시간: 약 5시간**

---

## 참고 자료

- [MDN: HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [React: Drag and Drop](https://react.dev/reference/react-dom/components/common#dnd-support)
- 기존 연결선 모드 구현 패턴 참고 (`isConnectionMode` 패턴)

