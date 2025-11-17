/**
 * Analytics Service
 * Tracks user interactions and profile performance
 */
export default class AnalyticsService {
  constructor(config = {}) {
    this.config = {
      enableLocalTracking: true,
      enableGoogleAnalytics: false,
      enableCustomEvents: true,
      trackingEndpoint: null,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];

    this.init();
  }

  init() {
    // Load existing data
    this.loadStoredData();

    // Track page view
    this.trackEvent('page_view', {
      path: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });

    // Setup page unload tracking
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_leave', {
        duration: Date.now() - this.startTime
      });
      this.saveData();
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden');
      } else {
        this.trackEvent('page_visible');
      }
    });
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  trackEvent(eventName, eventData = {}) {
    const event = {
      id: this.generateEventId(),
      name: eventName,
      data: eventData,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ip: null // Would need backend endpoint
    };

    this.events.push(event);

    // Store in local storage immediately
    if (this.config.enableLocalTracking) {
      this.storeEvent(event);
    }

    // Send to analytics endpoint
    if (this.config.trackingEndpoint) {
      this.sendEvent(event);
    }

    // Send to Google Analytics if enabled
    if (this.config.enableGoogleAnalytics && typeof gtag !== 'undefined') {
      this.sendToGoogleAnalytics(eventName, eventData);
    }

    // Emit custom event
    if (this.config.enableCustomEvents) {
      this.emitCustomEvent(event);
    }

    return event;
  }

  generateEventId() {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // Track specific profile interactions
  trackProfileView(profileData) {
    return this.trackEvent('profile_view', {
      profileName: profileData.name,
      profileId: profileData.id,
      hasAvatar: !!profileData.avatar,
      socialLinkCount: profileData.socialLinks?.length || 0
    });
  }

  trackSocialLinkClick(linkId, linkUrl, profileData) {
    return this.trackEvent('social_link_click', {
      linkId,
      linkUrl,
      linkLabel: this.getLinkLabel(linkId),
      profileName: profileData.name,
      position: this.getLinkPosition(linkId)
    });
  }

  trackQRCodeGeneration(profileData, options = {}) {
    return this.trackEvent('qr_code_generated', {
      profileName: profileData.name,
      qrSize: options.size || 300,
      downloadType: options.download || 'display'
    });
  }

  trackVCardDownload(profileData) {
    return this.trackEvent('vcard_download', {
      profileName: profileData.name,
      hasSocialLinks: (profileData.socialLinks?.length || 0) > 0,
      socialLinkCount: profileData.socialLinks?.length || 0
    });
  }

  trackShareProfile(method, profileData) {
    return this.trackEvent('profile_share', {
      method, // 'native', 'clipboard', 'email', etc.
      profileName: profileData.name,
      url: window.location.href
    });
  }

  trackProfileEdit(action, fieldChanged) {
    return this.trackEvent('profile_edit', {
      action, // 'add', 'update', 'delete'
      field: fieldChanged,
      timestamp: Date.now()
    });
  }

  trackInteraction(type, target, details = {}) {
    return this.trackEvent('interaction', {
      type, // 'click', 'hover', 'scroll', etc.
      target, // element identifier
      ...details
    });
  }

  // Get link label from ID
  getLinkLabel(linkId) {
    const labels = {
      'github': 'GitHub',
      'frontend-mentor': 'Frontend Mentor',
      'linkedin': 'LinkedIn',
      'twitter': 'Twitter',
      'instagram': 'Instagram'
    };
    return labels[linkId] || linkId;
  }

  // Get position of link in list
  getLinkPosition(linkId) {
    const order = ['github', 'frontend-mentor', 'linkedin', 'twitter', 'instagram'];
    return order.indexOf(linkId) + 1;
  }

  // Store event in localStorage
  storeEvent(event) {
    try {
      const stored = localStorage.getItem('analytics_events') || '[]';
      const events = JSON.parse(stored);
      events.push(event);

      // Keep only last 1000 events to prevent storage issues
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }

      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }
  }

  // Load stored data
  loadStoredData() {
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        this.events = JSON.parse(stored);
      }

      // Load session data
      const sessionData = localStorage.getItem('analytics_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.sessionId === this.sessionId) {
          this.startTime = session.startTime;
        }
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  // Save data to localStorage
  saveData() {
    try {
      localStorage.setItem('analytics_session', JSON.stringify({
        sessionId: this.sessionId,
        startTime: this.startTime,
        lastEvent: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save analytics data:', error);
    }
  }

  // Send event to server endpoint
  async sendEvent(event) {
    if (!this.config.trackingEndpoint) return;

    try {
      await fetch(this.config.trackingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  // Send to Google Analytics
  sendToGoogleAnalytics(eventName, eventData) {
    if (typeof gtag === 'undefined') return;

    gtag('event', eventName, {
      event_category: 'Profile Interaction',
      event_label: eventData.profileName || 'Unknown',
      custom_parameter_1: eventData.linkId,
      custom_parameter_2: eventData.method,
      ...eventData
    });
  }

  // Emit custom DOM event
  emitCustomEvent(event) {
    const customEvent = new CustomEvent('analytics_event', {
      detail: event
    });
    document.dispatchEvent(customEvent);
  }

  // Get analytics summary
  getAnalyticsSummary(days = 30) {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp > cutoffDate);

    const summary = {
      totalEvents: recentEvents.length,
      uniqueEvents: new Set(recentEvents.map(e => e.name)).size,
      sessionDuration: Date.now() - this.startTime,
      events: {}
    };

    // Count by event type
    recentEvents.forEach(event => {
      summary.events[event.name] = (summary.events[event.name] || 0) + 1;
    });

    return summary;
  }

  // Get popular social links
  getPopularLinks() {
    const linkClicks = this.events.filter(e => e.name === 'social_link_click');
    const linkCounts = {};

    linkClicks.forEach(click => {
      const linkId = click.data.linkId;
      linkCounts[linkId] = (linkCounts[linkId] || 0) + 1;
    });

    return Object.entries(linkCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([linkId, count]) => ({
        linkId,
        label: this.getLinkLabel(linkId),
        count
      }));
  }

  // Export analytics data
  exportData() {
    const data = {
      events: this.events,
      sessionId: this.sessionId,
      startTime: this.startTime,
      exportTime: Date.now(),
      summary: this.getAnalyticsSummary()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Clear analytics data
  clearData() {
    this.events = [];
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_session');
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  // Privacy: Get data for GDPR export
  getPersonalData() {
    return {
      events: this.events,
      sessionId: this.sessionId,
      startTime: this.startTime,
      userAgent: navigator.userAgent
    };
  }

  // Privacy: Delete all personal data
  deletePersonalData() {
    this.clearData();
  }
}