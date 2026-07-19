'use client';

import { useEffect } from 'react';

export default function Modal({ 
  isOpen, 
  onClose, 
  onConfirm = null, 
  title = 'Notifikasi', 
  message, 
  type = 'info', 
  confirmText = 'Ya', 
  cancelText = 'Batal' 
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmType = type === 'confirm' || !!onConfirm;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container glassmorphism" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {type === 'error' ? '⚠️' : type === 'confirm' ? '❓' : 'ℹ️'} {title}
          </h3>
          <button className="modal-close-x" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          {isConfirmType ? (
            <>
              <button className="modal-btn modal-btn-secondary" onClick={onClose}>
                {cancelText}
              </button>
              <button className="modal-btn" onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}>
                {confirmText}
              </button>
            </>
          ) : (
            <button className="modal-btn" onClick={onClose}>
              Tutup
            </button>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease-out;
        }

        .modal-container {
          background: #0c0c0e;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 10px 25px rgba(212, 175, 55, 0.15);
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-title {
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #d4af37;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-close-x {
          background: none;
          border: none;
          color: #888;
          font-size: 24px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .modal-close-x:hover {
          color: #ffffff;
        }

        .modal-body {
          padding: 20px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #e4e4e7;
          line-height: 1.5;
        }

        .modal-message {
          margin: 0;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .modal-btn {
          background: #d4af37;
          color: #000000;
          border: none;
          padding: 8px 24px;
          border-radius: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-btn:hover {
          background: #ffffff;
          transform: translateY(-1px);
        }

        .modal-btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
