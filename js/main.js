/**
 * Main Application Entry Point
 * Initializes the digital card application
 */

import { ProfileCard } from './components/ProfileCard.js';
import AnalyticsService from './services/AnalyticsService.js';

class DigitalCardApp {
  constructor() {
    this.profileCard = null;
    this.analytics = null;
    this.isInitialized = false;
    this.config = this.loadConfig();
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Initialize analytics first
      this.analytics = new AnalyticsService({
        enableLocalTracking: true,
        enableGoogleAnalytics: this.config.googleAnalyticsEnabled,
        enableCustomEvents: true
      });

      // Track application start
      this.analytics.trackEvent('app_init', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });

      // Find the profile card container
      const container = document.querySelector('.card')?.parentElement || document.body;

      // Initialize profile card with enhanced features
      this.profileCard = new ProfileCard(container, {
        animations: this.config.animationsEnabled,
        qrEnabled: this.config.qrCodeEnabled,
        vCardEnabled: this.config.vCardEnabled,
        shareEnabled: this.config.shareEnabled,
        analytics: true,
        editable: this.config.editMode
      });

      // Setup global event listeners
      this.setupGlobalListeners();

      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Add CSS enhancements
      this.addCSSEnhancements();

      this.isInitialized = true;

      console.log('Digital Card App initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Digital Card App:', error);
      this.showErrorMessage('Failed to load application. Please refresh the page.');
    }
  }

  loadConfig() {
    // Default configuration
    const defaultConfig = {
      animationsEnabled: true,
      qrCodeEnabled: true,
      vCardEnabled: true,
      shareEnabled: true,
      googleAnalyticsEnabled: false,
      editMode: false,
      theme: 'dark'
    };

    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('appConfig');
      if (saved) {
        return { ...defaultConfig, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Could not load saved config:', error);
    }

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlConfig = {};
    if (urlParams.has('edit')) urlConfig.editMode = urlParams.get('edit') === 'true';
    if (urlParams.has('theme')) urlConfig.theme = urlParams.get('theme');
    if (urlParams.has('no-animations')) urlConfig.animationsEnabled = false;

    return { ...defaultConfig, ...urlConfig };
  }

  setupGlobalListeners() {
    // Listen for custom analytics events
    document.addEventListener('analytics_event', (e) => {
      this.handleAnalyticsEvent(e.detail);
    });

    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'userProfile') {
        this.handleProfileUpdate();
      }
    });

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.showNotification('You are back online');
    });

    window.addEventListener('offline', () => {
      this.showNotification('You are offline. Some features may not work.');
    });

    // Handle page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.analytics.trackEvent('page_visible');
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when not typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'e':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleEditMode();
          }
          break;
        case 'q':
          // Quick QR code generation
          if (this.profileCard && this.config.qrCodeEnabled) {
            this.profileCard.handleAction('qr');
          }
          break;
        case 's':
          // Quick sharing
          if (this.profileCard && this.config.shareEnabled) {
            e.preventDefault();
            this.profileCard.handleAction('share');
          }
          break;
        case 'd':
          // Quick vCard download
          if (this.profileCard && this.config.vCardEnabled) {
            e.preventDefault();
            this.profileCard.handleAction('vcard');
          }
          break;
        case '?':
          // Show help
          this.showHelp();
          break;
      }
    });
  }

  addCSSEnhancements() {
    // Add enhanced styles for new features
    const enhancedStyles = `
      <style>
        /* Action Buttons */
        .card-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0 2rem 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .action-btn {
          background-color: #333333;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .action-btn:hover {
          background-color: hsl(75, 94%, 57%);
          transform: translateY(-2px);
        }

        /* Social Button Enhancements */
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .btn-icon {
          font-size: 1.1rem;
        }

        .btn-text {
          font-size: 0.9rem;
        }

        /* Modal Styles */
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.8);
        }

        .modal-content {
          background-color: rgb(31, 31, 31);
          padding: 2rem;
          border-radius: 1rem;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          position: relative;
          text-align: center;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
        }

        /* Notification Styles */
        .notification {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background-color: hsl(75, 94%, 57%);
          color: #151515;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          z-index: 2000;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Loading Spinner */
        .loading {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid #f3f3f3;
          border-top: 2px solid hsl(75, 94%, 57%);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Edit Mode Styles */
        .edit-mode .social-btn {
          cursor: move;
        }

        .edit-mode .social-btn:hover {
          background-color: #555;
        }

        /* Responsive Design */
        @media (max-width: 375px) {
          .card-actions {
            padding: 0 1rem 1.5rem;
          }

          .action-btn {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }

          .social-btn {
            flex-direction: column;
            gap: 0.25rem;
          }

          .btn-text {
            font-size: 0.8rem;
          }
        }

        /* Dark Theme Enhancements */
        body.theme-light {
          background-color: #f5f5f5;
          color: #333;
        }

        body.theme-light .card {
          background-color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        body.theme-light .action-btn,
        body.theme-light .social-btn {
          background-color: #f0f0f0;
          color: #333;
        }

        /* High Contrast Mode */
        @media (prefers-contrast: high) {
          .social-btn, .action-btn {
            border: 2px solid white;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .social-btn, .action-btn {
            transition: none;
          }

          @keyframes slideUp {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', enhancedStyles);
  }

  handleAnalyticsEvent(event) {
    // Handle custom analytics events
    switch (event.name) {
      case 'social_link_click':
        console.log(`Social link clicked: ${event.data.linkId}`);
        break;
      case 'qr_code_generated':
        console.log('QR Code generated');
        break;
      case 'vcard_download':
        console.log('vCard downloaded');
        break;
      case 'profile_share':
        console.log(`Profile shared via: ${event.data.method}`);
        break;
    }
  }

  handleProfileUpdate() {
    // Reload profile when it's updated in another tab
    if (this.profileCard) {
      this.profileCard.loadProfileData().then(() => {
        this.profileCard.render();
        this.showNotification('Profile updated');
      });
    }
  }

  toggleEditMode() {
    this.config.editMode = !this.config.editMode;
    localStorage.setItem('appConfig', JSON.stringify(this.config));

    if (this.profileCard) {
      this.profileCard.config.editable = this.config.editMode;
      this.profileCard.render();
    }

    document.body.classList.toggle('edit-mode', this.config.editMode);
    this.showNotification(this.config.editMode ? 'Edit mode enabled' : 'Edit mode disabled');
  }

  showHelp() {
    const helpText = `
      Digital Card Help:

      Shortcuts:
      Q - Generate QR Code
      S - Share Profile
      D - Download vCard
      Ctrl/Cmd + E - Toggle Edit Mode

      Features:
      • Click social links to visit profiles
      • Action buttons for sharing and contact import
      • Automatic analytics tracking
      • Responsive design for all devices

      URL Parameters:
      ?edit=true - Enable edit mode
      ?theme=light - Switch to light theme
      ?no-animations - Disable animations
    `;

    this.showNotification(helpText, 8000);
  }

  showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, duration);
  }

  showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      background-color: #ff4444;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      z-index: 3000;
      font-weight: 600;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 5000);
  }

  // Public API methods
  getAnalytics() {
    return this.analytics;
  }

  getProfileCard() {
    return this.profileCard;
  }

  getConfig() {
    return this.config;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('appConfig', JSON.stringify(this.config));
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Make app globally available
  window.digitalCardApp = new DigitalCardApp();

  // Initialize the app
  await window.digitalCardApp.init();

  // Make analytics available for debugging
  window.analytics = window.digitalCardApp.getAnalytics();

  console.log('Digital Card App ready!');
  console.log('Press ? for keyboard shortcuts');
});

// Fallback for late initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

async function initApp() {
  if (!window.digitalCardApp) {
    window.digitalCardApp = new DigitalCardApp();
    await window.digitalCardApp.init();
  }
}