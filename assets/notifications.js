/**
 * Modern Notification System
 * Professional, minimalistic notifications for the e-commerce platform
 */

class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 3;
    this.defaultDuration = 5000;
    this.init();
  }

  init() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
        font-family: 'Secular One', sans-serif;
      `;
      document.body.appendChild(container);
    }
  }

  show(message, type = 'info', duration = null) {
    const notification = this.createNotification(message, type);
    const container = document.getElementById('notification-container');
    
    if (!container) {
      console.error('Notification container not found');
      return;
    }

    // Add to container
    container.appendChild(notification);
    this.notifications.push(notification);

    // Limit number of notifications
    if (this.notifications.length > this.maxNotifications) {
      const oldestNotification = this.notifications.shift();
      if (oldestNotification && oldestNotification.parentNode) {
        oldestNotification.parentNode.removeChild(oldestNotification);
      }
    }

    // Animate in
    this.animateIn(notification);

    // Auto remove
    const autoRemoveDuration = duration !== null ? duration : this.defaultDuration;
    if (autoRemoveDuration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, autoRemoveDuration);
    }

    return notification;
  }

  createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = this.getIcon(type);
    const colors = this.getColors(type);
    
    notification.style.cssText = `
      background: ${colors.background};
      color: ${colors.text};
      border: 1px solid ${colors.border};
      border-radius: 8px;
      padding: 16px 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 400px;
      word-wrap: break-word;
      font-size: 14px;
      line-height: 1.5;
      position: relative;
      overflow: hidden;
    `;

    // Add subtle gradient overlay
    const gradient = document.createElement('div');
    gradient.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: ${colors.gradient};
      opacity: 0.8;
    `;
    notification.appendChild(gradient);

    // Icon
    const iconElement = document.createElement('div');
    iconElement.innerHTML = icon;
    iconElement.style.cssText = `
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      margin-top: 1px;
    `;
    notification.appendChild(iconElement);

    // Message
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.cssText = `
      flex: 1;
      margin: 0;
      padding: 0;
    `;
    notification.appendChild(messageElement);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: ${colors.text};
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;
      margin-left: 8px;
      margin-top: -2px;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.opacity = '1';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.opacity = '0.7';
    });
    
    closeButton.addEventListener('click', () => {
      this.remove(notification);
    });
    
    notification.appendChild(closeButton);

    return notification;
  }

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  getColors(type) {
    const colorSchemes = {
      success: {
        background: '#f0f9ff',
        text: '#065f46',
        border: '#a7f3d0',
        gradient: '#10b981'
      },
      error: {
        background: '#fef2f2',
        text: '#991b1b',
        border: '#fecaca',
        gradient: '#ef4444'
      },
      warning: {
        background: '#fffbeb',
        text: '#92400e',
        border: '#fed7aa',
        gradient: '#f59e0b'
      },
      info: {
        background: '#eff6ff',
        text: '#1e40af',
        border: '#bfdbfe',
        gradient: '#3b82f6'
      }
    };
    return colorSchemes[type] || colorSchemes.info;
  }

  animateIn(notification) {
    // Trigger reflow
    notification.offsetHeight;
    
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }

  animateOut(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
  }

  remove(notification) {
    if (!notification || !notification.parentNode) return;

    this.animateOut(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      // Remove from notifications array
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }

  // Convenience methods
  success(message, duration = null) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = null) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = null) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = null) {
    return this.show(message, 'info', duration);
  }

  // Clear all notifications
  clear() {
    this.notifications.forEach(notification => {
      this.remove(notification);
    });
  }
}

// Global notification instance
const notifications = new NotificationSystem();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSystem, notifications };
}

// Make available globally
window.notifications = notifications;
