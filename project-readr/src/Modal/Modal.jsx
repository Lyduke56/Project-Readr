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
