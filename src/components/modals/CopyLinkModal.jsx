import React from 'react';
import Modal from '../common/Modal';

const CopyLinkModal = ({ isOpen, onClose }) => {
  const handleOk = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="copy-modal">
      <h2 className="copy-modal__title">Copied!</h2>
      <p className="copy-modal__subtitle">Link is copied to clipboard</p>
      <button 
        className="copy-modal__button"
        onClick={handleOk}
      >
        OK
      </button>
    </Modal>
  );
};

export default CopyLinkModal;