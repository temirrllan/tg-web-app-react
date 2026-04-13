import React from 'react';
import Modal from '../common/Modal';
import { useTranslation } from '../../hooks/useTranslation';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, habitTitle }) => {
  const { t } = useTranslation();
  const handleYes = () => {
    onConfirm();
    onClose();
  };

  const handleNo = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="delete-modal">
      <h2 className="delete-modal__title">
        {t('common.deleteHabitConfirm')}
      </h2>
      <div className="delete-modal__buttons">
        <button
          className="delete-modal__button delete-modal__button--yes"
          onClick={handleYes}
        >
          {t('common.yes')}
        </button>
        <button
          className="delete-modal__button delete-modal__button--no"
          onClick={handleNo}
        >
          {t('common.no')}
        </button>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;