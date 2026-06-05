import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const ConfirmToast = ({ 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  const { speak } = useAccessibility();
  
  const handleConfirm = () => {
    speak('Confirmed');
    onConfirm();
  };
  
  const handleCancel = () => {
    speak('Cancelled');
    onCancel();
  };

  const colors = {
    warning: { bg: '#fef3c7', border: '#f59e0b', btn: '#f59e0b', icon: '⚠️' },
    danger: { bg: '#fee2e2', border: '#ef4444', btn: '#ef4444', icon: '⚠️' },
    info: { bg: '#dbeafe', border: '#3b82f6', btn: '#3b82f6', icon: 'ℹ️' }
  };

  const style = colors[type] || colors.warning;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      minWidth: '320px',
      maxWidth: '90%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      zIndex: 10000,
      borderTop: `4px solid ${style.border}`,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '24px' }}>{style.icon}</span>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5', color: '#1a1a1a' }}>{message}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleCancel}
          style={{
            padding: '10px 20px',
            border: '1px solid #e2e8f0',
            backgroundColor: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#64748b',
            minWidth: '80px'
          }}
        >
          {cancelText}
        </button>
        <button 
          onClick={handleConfirm}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: style.btn,
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            minWidth: '80px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {confirmText}
        </button>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, -40%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ConfirmToast;