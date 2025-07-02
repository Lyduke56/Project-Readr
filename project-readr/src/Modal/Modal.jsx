import './Modal.css';

export const Modal = ({ isOpened, onClose, children }) => {
    
    const onOverlayClick = ({ target, currentTarget }) => {
        if (target === currentTarget) onClose();
    };

    if (!isOpened) return null;

    return (
        <div className="overlay" onClick={onOverlayClick}>
            <div className="container">
                <button className="icon-mask" onClick={onClose} />
                {children}
            </div>
        </div>
    );
};

function ParentComponent() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <div>
      {isEditModalOpen && (
        <Modal>
          <EditProfile onClose={handleCloseModal} />
        </Modal>
      )}
    </div>
  );
}
