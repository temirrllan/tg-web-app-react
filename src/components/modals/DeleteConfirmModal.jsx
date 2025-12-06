import React from 'react';
import Modal from '../common/Modal';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, habitTitle }) => {
  const handleYes = () => {
    onConfirm();
    onClose();
  };

  const handleNo = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="delete-modal">
      <div className="delete-modal__content">
        <h2 className="delete-modal__title">
          Are You Sure You Want<br />to Remove the Habit?
        </h2>
        <div className="delete-modal__buttons">
          <button 
            className="delete-modal__button delete-modal__button--yes"
            onClick={handleYes}
          >
            Yes
          </button>
          <button 
            className="delete-modal__button delete-modal__button--no"
            onClick={handleNo}
          >
            No
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;