import './Modal.css';
import { FaArrowLeft } from 'react-icons/fa';

export const Modal = ({ isOpened, onClose, children }) => {
    
    const onOverlayClick = ({ target, currentTarget }) => {
        if (target === currentTarget) onClose();
    };

    if (!isOpened) return null;

    return (
        <div className="overlay" onClick={onOverlayClick}>
            <div className="modal-container">
                <button className="icon-mask" onClick={onClose}>
                    <FaArrowLeft className="icon-mask"/>
                </button>
                {children}
            </div>
        </div>
    );
};
