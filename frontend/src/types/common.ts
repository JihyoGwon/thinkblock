/**
 * 공통 타입 정의
 */

export type Mode = 'view' | 'connection' | 'drag';

export interface Project {
  id: string;
  name: string;
  arrangement_reasoning?: string;
}

export interface ModalState {
  showForm: boolean;
  showCategoryManager: boolean;
  showAIGenerateModal: boolean;
  showAIArrangeModal: boolean;
  showArrangementReasoning: boolean;
  showResetConfirm: boolean;
}

