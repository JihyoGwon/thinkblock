/**
 * 모달 상태 관리 커스텀 훅
 */
import { useState, useCallback } from 'react';
import { ModalState } from '../types/common';

const initialModalState: ModalState = {
  showForm: false,
  showCategoryManager: false,
  showAIGenerateModal: false,
  showAIArrangeModal: false,
  showArrangementReasoning: false,
  showResetConfirm: false,
};

export const useModal = () => {
  const [modals, setModals] = useState<ModalState>(initialModalState);

  const openModal = useCallback((modalName: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(initialModalState);
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
  };
};

