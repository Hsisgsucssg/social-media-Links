/**
 * Analytics Dashboard Component
 * Provides insights into profile performance and user engagement
 */
export class AnalyticsDashboard {
  constructor(analyticsService, config = {}) {
    this.analytics = analyticsService;
    this.config = {
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      showCharts: true,
      ...config
    };

    this.isVisible = false;
    this.lastUpdate = null;

    this.init();
  }

  init() {
    this.setupEventListeners();

    if (this.config.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  setupEventListeners() {
    // Listen for analytics shortcut
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        this.toggle();
      }
    });
  }

  async show() {
    if (this.isVisible) return;

    const modal = this.createModal();
    await this.loadAnalyticsData();

    this.isVisible = true;
    this.lastUpdate = Date.now();
  }

  hide() {
    const existingModal = document.querySelector('.analytics-modal');
    if (existingModal) {
      document.body.removeChild(existingModal);
    }

    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  createModal() {
    // Remove existing modal if present
    const existingModal = document.querySelector('.analytics-modal');
    if (existingModal) {
      document.body.removeChild(existingModal);
    }

    const modal = document.createElement('div');
    modal.className = 'modal analytics-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.closest('.modal').remove()"></div>
      <div class="modal-content analytics-content" style="max-width: 800px; width: 90vw;">
        <button class="modal-close">&times;</button>

        <div class="analytics-header">
          <h2>📊 Profile Analytics</h2>
          <div class="analytics-controls">
            <button id="refresh-analytics" class="action-btn">🔄 Refresh</button>
            <button id="export-analytics" class="action-btn">📥 Export</button>
            <button id="clear-analytics" class="action-btn">🗑️ Clear</button>
          </div>
        </div>

        <div class="analytics-body">
          <div class="analytics-overview">
            <h3>Overview</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value" id="total-views">0</div>
                <div class="stat-label">Profile Views</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="total-clicks">0</div>
                <div class="stat-label">Link Clicks</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="qr-generations">0</div>
                <div class="stat-label">QR Codes</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="vcard-downloads">0</div>
                <div class="stat-label">vCard Downloads</div>
              </div>
            </div>
          </div>

          <div class="analytics-sections">
            <div class="analytics-section">
              <h3>📈 Popular Links</h3>
              <div id="popular-links" class="link-stats">
                <div class="loading">Loading...</div>
              </div>
            </div>

            <div class="analytics-section">
              <h3>🕐 Recent Activity</h3>
              <div id="recent-activity" class="activity-list">
                <div class="loading">Loading...</div>
              </div>
            </div>

            <div class="analytics-section">
              <h3>📱 Device & Browser Info</h3>
              <div id="device-info" class="device-stats">
                <div class="loading">Loading...</div>
              </div>
            </div>

            <div class="analytics-section">
              <h3>🔄 Sharing Methods</h3>
              <div id="sharing-stats" class="sharing-stats">
                <div class="loading">Loading...</div>
              </div>
            </div>
          </div>

          <div class="analytics-footer">
            <p>Last updated: <span id="last-update">Never</span></p>
            <p>Data stored locally in your browser</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(modal);

    // Add analytics-specific styles
    this.addAnalyticsStyles();

    return modal;
  }

  attachModalListeners(modal) {
    // Close button
    modal.querySelector('.modal-close').addEventListener('click', () => {
      this.hide();
    });

    // Refresh button
    modal.querySelector('#refresh-analytics').addEventListener('click', () => {
      this.loadAnalyticsData();
    });

    // Export button
    modal.querySelector('#export-analytics').addEventListener('click', () => {
      this.analytics.exportData();
    });

    // Clear button
    modal.querySelector('#clear-analytics').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
        this.analytics.clearData();
        this.loadAnalyticsData();
      }
    });
  }

  async loadAnalyticsData() {
    try {
      const summary = this.analytics.getAnalyticsSummary();
      const popularLinks = this.analytics.getPopularLinks();

      // Update overview stats
      this.updateOverviewStats(summary);

      // Update popular links
      this.updatePopularLinks(popularLinks);

      // Update recent activity
      this.updateRecentActivity();

      // Update device info
      this.updateDeviceInfo();

      // Update sharing stats
      this.updateSharingStats();

      // Update last update time
      this.updateLastUpdateTime();

    } catch (error) {
      console.error('Error loading analytics data:', error);
      this.showError('Failed to load analytics data');
    }
  }

  updateOverviewStats(summary) {
    const events = summary.events;

    document.getElementById('total-views').textContent =
      (events.profile_view || 0).toLocaleString();
    document.getElementById('total-clicks').textContent =
      (events.social_link_click || 0).toLocaleString();
    document.getElementById('qr-generations').textContent =
      (events.qr_code_generated || 0).toLocaleString();
    document.getElementById('vcard-downloads').textContent =
      (events.vcard_download || 0).toLocaleString();

    // Add animation to numbers
    this.animateNumbers();
  }

  updatePopularLinks(popularLinks) {
    const container = document.getElementById('popular-links');

    if (popularLinks.length === 0) {
      container.innerHTML = '<p>No link clicks recorded yet</p>';
      return;
    }

    const maxClicks = Math.max(...popularLinks.map(link => link.count));

    container.innerHTML = popularLinks.map((link, index) => {
      const percentage = maxClicks > 0 ? (link.count / maxClicks) * 100 : 0;

      return `
        <div class="link-stat-item" style="animation-delay: ${index * 0.1}s">
          <div class="link-info">
            <span class="link-icon">${this.getLinkIcon(link.linkId)}</span>
            <span class="link-label">${link.label}</span>
          </div>
          <div class="link-stats">
            <div class="link-count">${link.count.toLocaleString()}</div>
            <div class="link-bar">
              <div class="link-bar-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateRecentActivity() {
    const container = document.getElementById('recent-activity');
    const recentEvents = this.analytics.events
      .filter(event => event.name !== 'page_view' && event.name !== 'page_leave')
      .slice(-10)
      .reverse();

    if (recentEvents.length === 0) {
      container.innerHTML = '<p>No recent activity</p>';
      return;
    }

    container.innerHTML = recentEvents.map(event => {
      const timeAgo = this.getTimeAgo(event.timestamp);
      const icon = this.getEventIcon(event.name);
      const description = this.getEventDescription(event);

      return `
        <div class="activity-item">
          <div class="activity-icon">${icon}</div>
          <div class="activity-content">
            <div class="activity-description">${description}</div>
            <div class="activity-time">${timeAgo}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateDeviceInfo() {
    const container = document.getElementById('device-info');

    // Get unique user agents and count them
    const userAgents = {};
    this.analytics.events.forEach(event => {
      if (event.userAgent) {
        const browser = this.detectBrowser(event.userAgent);
        const os = this.detectOS(event.userAgent);
        const key = `${browser} on ${os}`;

        userAgents[key] = (userAgents[key] || 0) + 1;
      }
    });

    const devices = Object.entries(userAgents)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (devices.length === 0) {
      container.innerHTML = '<p>No device data available</p>';
      return;
    }

    container.innerHTML = devices.map(([device, count], index) => {
      const [browser, os] = device.split(' on ');
      return `
        <div class="device-item" style="animation-delay: ${index * 0.1}s">
          <div class="device-info">
            <div class="device-browser">${browser}</div>
            <div class="device-os">${os}</div>
          </div>
          <div class="device-count">${count.toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  updateSharingStats() {
    const container = document.getElementById('sharing-stats');

    // Get sharing events
    const sharingEvents = this.analytics.events
      .filter(event => event.name === 'profile_share');

    if (sharingEvents.length === 0) {
      container.innerHTML = '<p>No sharing activity yet</p>';
      return;
    }

    // Group by sharing method
    const methods = {};
    sharingEvents.forEach(event => {
      const method = event.data.method || 'unknown';
      methods[method] = (methods[method] || 0) + 1;
    });

    container.innerHTML = Object.entries(methods)
      .sort(([,a], [,b]) => b - a)
      .map(([method, count], index) => {
        const icon = this.getSharingIcon(method);
        return `
          <div class="sharing-item" style="animation-delay: ${index * 0.1}s">
            <div class="sharing-info">
              <span class="sharing-icon">${icon}</span>
              <span class="sharing-method">${this.capitalizeFirst(method)}</span>
            </div>
            <div class="sharing-count">${count.toLocaleString()}</div>
          </div>
        `;
      }).join('');
  }

  updateLastUpdateTime() {
    const element = document.getElementById('last-update');
    if (this.lastUpdate) {
      element.textContent = new Date(this.lastUpdate).toLocaleTimeString();
    } else {
      element.textContent = 'Never';
    }
  }

  // Utility methods
  getLinkIcon(linkId) {
    const icons = {
      'github': '🐙',
      'frontend-mentor': '💻',
      'linkedin': '💼',
      'twitter': '🐦',
      'instagram': '📸'
    };
    return icons[linkId] || '🔗';
  }

  getEventIcon(eventName) {
    const icons = {
      'social_link_click': '🔗',
      'qr_code_generated': '📱',
      'vcard_download': '📇',
      'profile_share': '🔀',
      'profile_edit': '✏️'
    };
    return icons[eventName] || '📊';
  }

  getEventDescription(event) {
    switch (event.name) {
      case 'social_link_click':
        return `Clicked ${event.data.linkLabel || 'a link'}`;
      case 'qr_code_generated':
        return 'Generated QR code';
      case 'vcard_download':
        return 'Downloaded vCard';
      case 'profile_share':
        return `Shared via ${this.capitalizeFirst(event.data.method || 'unknown')}`;
      case 'profile_edit':
        return `Edited profile: ${event.data.field || 'unknown'}`;
      default:
        return 'Unknown activity';
    }
  }

  getSharingIcon(method) {
    const icons = {
      'native': '📱',
      'clipboard': '📋',
      'email': '📧',
      'sms': '💬',
      'unknown': '❓'
    };
    return icons[method] || '🔀';
  }

  detectBrowser(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  detectOS(userAgent) {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  animateNumbers() {
    const numberElements = document.querySelectorAll('.stat-value');
    numberElements.forEach(element => {
      const finalValue = parseInt(element.textContent.replace(/,/g, ''));
      let currentValue = 0;
      const increment = Math.ceil(finalValue / 20);

      const animation = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
          currentValue = finalValue;
          clearInterval(animation);
        }
        element.textContent = currentValue.toLocaleString();
      }, 50);
    });
  }

  showError(message) {
    const errorElement = document.querySelector('.analytics-body');
    if (errorElement) {
      errorElement.innerHTML = `
        <div class="error-message">
          <p>❌ ${message}</p>
        </div>
      `;
    }
  }

  startAutoRefresh() {
    setInterval(() => {
      if (this.isVisible) {
        this.loadAnalyticsData();
      }
    }, this.config.refreshInterval);
  }

  addAnalyticsStyles() {
    const existingStyles = document.getElementById('analytics-styles');
    if (existingStyles) return;

    const styles = document.createElement('style');
    styles.id = 'analytics-styles';
    styles.textContent = `
      .analytics-content {
        max-height: 90vh;
        overflow-y: auto;
      }

      .analytics-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .analytics-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background-color: #333;
        padding: 1.5rem;
        border-radius: 0.5rem;
        text-align: center;
        transition: transform 0.3s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: hsl(75, 94%, 57%);
        margin-bottom: 0.5rem;
      }

      .stat-label {
        font-size: 0.9rem;
        opacity: 0.8;
      }

      .analytics-sections {
        display: grid;
        gap: 2rem;
      }

      .analytics-section {
        background-color: rgba(255, 255, 255, 0.05);
        padding: 1.5rem;
        border-radius: 0.5rem;
      }

      .analytics-section h3 {
        margin-bottom: 1rem;
        color: hsl(75, 94%, 57%);
      }

      .link-stat-item, .device-item, .sharing-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        opacity: 0;
        animation: fadeInSlide 0.5s ease forwards;
      }

      .link-info, .device-info, .sharing-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .link-icon, .sharing-icon {
        font-size: 1.2rem;
      }

      .link-stats {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .link-count {
        min-width: 3rem;
        text-align: right;
        font-weight: 600;
      }

      .link-bar {
        width: 100px;
        height: 8px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
      }

      .link-bar-fill {
        height: 100%;
        background-color: hsl(75, 94%, 57%);
        transition: width 0.5s ease;
      }

      .activity-item {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .activity-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
      }

      .activity-content {
        flex: 1;
      }

      .activity-description {
        margin-bottom: 0.25rem;
      }

      .activity-time {
        font-size: 0.8rem;
        opacity: 0.7;
      }

      .device-browser, .sharing-method {
        font-weight: 600;
      }

      .device-os {
        font-size: 0.8rem;
        opacity: 0.8;
      }

      .device-count, .sharing-count {
        font-weight: 600;
        color: hsl(75, 94%, 57%);
      }

      .analytics-footer {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
        opacity: 0.7;
        font-size: 0.9rem;
      }

      .error-message {
        text-align: center;
        padding: 2rem;
        background-color: rgba(255, 0, 0, 0.1);
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 0, 0, 0.3);
      }

      @keyframes fadeInSlide {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .analytics-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .link-stat-item, .device-item, .sharing-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .link-stats {
          width: 100%;
        }

        .link-bar {
          flex: 1;
        }
      }
    `;

    document.head.appendChild(styles);
  }
}