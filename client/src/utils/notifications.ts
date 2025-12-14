// Custom notification and confirmation system

interface NotificationOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClick?: () => void;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export function showNotification(message: string, options: NotificationOptions = {}) {
  const { type = 'info', duration = 3000, onClick } = options;

  // Remove any existing notifications
  const existing = document.getElementById('custom-notification');
  if (existing) {
    existing.remove();
  }

  const colors = {
    success: { bg: '#059669', border: '#10b981' },
    error: { bg: '#dc2626', border: '#ef4444' },
    info: { bg: '#2563eb', border: '#3b82f6' },
    warning: { bg: '#d97706', border: '#f59e0b' }
  };

  const color = colors[type];

  const notification = document.createElement('div');
  notification.id = 'custom-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color.bg};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2);
    z-index: 100000;
    min-width: 280px;
    font-family: 'Pixel Game', monospace;
    font-size: 14px;
    animation: slideInRight 0.3s ease-out;
    image-rendering: pixelated;
    ${onClick ? 'cursor: pointer;' : ''}
  `;

  // Add border shadow (pixelated style)
  notification.style.boxShadow = `
    0 -2px 0 0 ${color.border},
    2px -2px 0 0 ${color.border},
    2px 0 0 0 ${color.border},
    2px 2px 0 0 ${color.border},
    0 2px 0 0 ${color.border},
    -2px 2px 0 0 ${color.border},
    -2px 0 0 0 ${color.border},
    -2px -2px 0 0 ${color.border},
    0 10px 25px rgba(0, 0, 0, 0.3)
  `;

  notification.innerHTML = `
    <style>
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    </style>
    <div>${message}</div>
  `;

  document.body.appendChild(notification);

  // Add click handler if provided
  if (onClick) {
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
      onClick();
    });
    
    // Add hover effect for clickable notifications
    notification.addEventListener('mouseenter', () => {
      notification.style.transform = 'scale(1.02)';
    });
    notification.addEventListener('mouseleave', () => {
      notification.style.transform = 'scale(1)';
    });
  }

  // Auto-dismiss
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    message,
    confirmText = 'CONFIRM',
    cancelText = 'CANCEL',
    confirmColor = '#dc2626'
  } = options;

  return new Promise((resolve) => {
    // Remove any existing modals
    const existing = document.getElementById('custom-confirm-modal');
    if (existing) {
      existing.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'custom-confirm-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100001;
      font-family: 'Pixel Game', monospace;
      animation: fadeIn 0.2s ease-out;
    `;

    modal.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .confirm-box {
          background: linear-gradient(to bottom right, #0a1929, #0d2137);
          padding: 24px;
          border-radius: 8px;
          min-width: 400px;
          max-width: 500px;
          animation: scaleIn 0.3s ease-out;
          image-rendering: pixelated;
          box-shadow:
            0 -3px 0 0 #3d8aa8,
            3px -3px 0 0 #3d8aa8,
            3px 0 0 0 #3d8aa8,
            3px 3px 0 0 #3d8aa8,
            0 3px 0 0 #3d8aa8,
            -3px 3px 0 0 #3d8aa8,
            -3px 0 0 0 #3d8aa8,
            -3px -3px 0 0 #3d8aa8,
            0 10px 50px rgba(0, 0, 0, 0.5);
        }
        .confirm-title {
          color: #e0f7ff;
          font-size: 20px;
          margin-bottom: 16px;
          text-align: center;
        }
        .confirm-message {
          color: #5db3d1;
          font-size: 14px;
          margin-bottom: 24px;
          text-align: center;
          line-height: 1.6;
        }
        .confirm-buttons {
          display: flex;
          gap: 12px;
        }
        .confirm-btn {
          flex: 1;
          padding: 12px 16px;
          font-family: 'Pixel Game', monospace;
          font-size: 14px;
          cursor: pointer;
          border: none;
          transition: all 0.1s;
          image-rendering: pixelated;
        }
        .confirm-btn:active {
          transform: translateY(2px);
        }
        .btn-cancel {
          background: linear-gradient(to bottom, #2c6b87, #1a4558);
          color: white;
          box-shadow:
            0 -2px 0 0 #3d8aa8,
            2px -2px 0 0 #3d8aa8,
            2px 0 0 0 #3d8aa8,
            2px 2px 0 0 #1a4558,
            0 2px 0 0 #1a4558,
            -2px 2px 0 0 #1a4558,
            -2px 0 0 0 #3d8aa8,
            -2px -2px 0 0 #3d8aa8;
        }
        .btn-cancel:hover {
          background: linear-gradient(to bottom, #3d8aa8, #2c6b87);
        }
        .btn-confirm {
          background: linear-gradient(to bottom, ${confirmColor}, ${confirmColor}dd);
          color: white;
          box-shadow:
            0 -2px 0 0 ${confirmColor}ee,
            2px -2px 0 0 ${confirmColor}ee,
            2px 0 0 0 ${confirmColor}ee,
            2px 2px 0 0 ${confirmColor}aa,
            0 2px 0 0 ${confirmColor}aa,
            -2px 2px 0 0 ${confirmColor}aa,
            -2px 0 0 0 ${confirmColor}ee,
            -2px -2px 0 0 ${confirmColor}ee;
        }
        .btn-confirm:hover {
          background: linear-gradient(to bottom, ${confirmColor}ee, ${confirmColor}cc);
        }
      </style>
      <div class="confirm-box">
        <div class="confirm-title">${title}</div>
        <div class="confirm-message">${message}</div>
        <div class="confirm-buttons">
          <button class="confirm-btn btn-cancel" id="btn-cancel">${cancelText}</button>
          <button class="confirm-btn btn-confirm" id="btn-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const removeModal = () => {
      modal.style.animation = 'fadeIn 0.2s ease-in reverse';
      setTimeout(() => modal.remove(), 200);
    };

    document.getElementById('btn-cancel')?.addEventListener('click', () => {
      removeModal();
      resolve(false);
    });

    document.getElementById('btn-confirm')?.addEventListener('click', () => {
      removeModal();
      resolve(true);
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        removeModal();
        resolve(false);
      }
    });

    // Close on ESC key
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        removeModal();
        resolve(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}
