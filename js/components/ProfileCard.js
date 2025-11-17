/**
 * ProfileCard Component
 * Manages the user profile display and interactions
 */
export class ProfileCard {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      animations: true,
      qrEnabled: true,
      vCardEnabled: true,
      analytics: true,
      ...config
    };

    this.profileData = null;
    this.socialLinks = [];
    this.isEditing = false;

    this.init();
  }

  async init() {
    await this.loadProfileData();
    this.setupEventListeners();
    this.render();

    if (this.config.animations) {
      this.setupAnimations();
    }

    if (this.config.analytics) {
      this.trackProfileView();
    }
  }

  async loadProfileData() {
    // Default profile data matching the current design
    this.profileData = {
      name: "Jessica Randall",
      title: "Frontend developer and avid reader.",
      location: "London, United Kingdom",
      avatar: "./assets/images/avatar-jessica.jpeg",
      theme: "dark"
    };

    this.socialLinks = [
      { id: 'github', label: 'GitHub', icon: '🐙', url: '#', color: '#333' },
      { id: 'frontend-mentor', label: 'Frontend Mentor', icon: '💻', url: '#', color: '#333' },
      { id: 'linkedin', label: 'LinkedIn', icon: '💼', url: '#', color: '#0077B5' },
      { id: 'twitter', label: 'Twitter', icon: '🐦', url: '#', color: '#1DA1F2' },
      { id: 'instagram', label: 'Instagram', icon: '📸', url: '#', color: '#E4405F' }
    ];

    // Try to load from localStorage if available
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const data = JSON.parse(savedProfile);
        this.profileData = { ...this.profileData, ...data.profile };
        this.socialLinks = data.socialLinks || this.socialLinks;
      } catch (e) {
        console.warn('Could not load saved profile:', e);
      }
    }
  }

  setupEventListeners() {
    // Add click handlers for social links
    this.container.addEventListener('click', (e) => {
      const button = e.target.closest('[data-social-link]');
      if (button) {
        this.handleSocialLinkClick(button.dataset.socialLink);
      }
    });

    // Add edit button if enabled
    if (this.config.editable) {
      this.addEditButton();
    }
  }

  handleSocialLinkClick(linkId) {
    const link = this.socialLinks.find(l => l.id === linkId);
    if (link && this.config.analytics) {
      this.trackLinkClick(linkId);
    }

    // Add click animation
    if (this.config.animations) {
      this.animateClick(linkId);
    }
  }

  render() {
    const html = `
      <div class="card profile-card" data-profile-card>
        <div class="info">
          <img src="${this.profileData.avatar}" alt="${this.profileData.name}" class="profile-avatar">
          <h2>${this.profileData.name}</h2>
          <p>${this.profileData.location}</p>
          <p id="p-1">"${this.profileData.title}"</p>
        </div>

        <div class="btn-s social-links">
          ${this.socialLinks.map(link => `
            <button
              id="btn-${link.id}"
              class="social-btn"
              data-social-link="${link.id}"
              data-url="${link.url}"
              style="--btn-color: ${link.color}"
            >
              <span class="btn-icon">${link.icon}</span>
              <span class="btn-text">${link.label}</span>
            </button>
          `).join('')}
        </div>

        <div class="card-actions">
          ${this.config.qrEnabled ? `
            <button class="action-btn" data-action="qr" title="Generate QR Code">
              📱 QR Code
            </button>
          ` : ''}
          ${this.config.vCardEnabled ? `
            <button class="action-btn" data-action="vcard" title="Download Contact">
              📇 vCard
            </button>
          ` : ''}
          ${this.config.shareEnabled ? `
            <button class="action-btn" data-action="share" title="Share Profile">
              🔗 Share
            </button>
          ` : ''}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachActionListeners();
  }

  attachActionListeners() {
    const actionButtons = this.container.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleAction(action);
      });
    });
  }

  handleAction(action) {
    switch (action) {
      case 'qr':
        this.showQRCode();
        break;
      case 'vcard':
        this.downloadVCard();
        break;
      case 'share':
        this.shareProfile();
        break;
    }
  }

  async showQRCode() {
    const { default: QRCode } = await import('../services/QRService.js');
    const qrService = new QRCode();

    const modal = this.createModal();
    const qrContainer = modal.querySelector('.modal-content');

    qrService.generate(this.getProfileUrl(), { size: 300 })
      .then(qrDataUrl => {
        qrContainer.innerHTML = `
          <h3>Scan QR Code</h3>
          <img src="${qrDataUrl}" alt="QR Code" style="max-width: 100%;">
          <p style="margin-top: 1rem; opacity: 0.8;">Scan to visit this profile</p>
        `;
      });
  }

  downloadVCard() {
    const { default: VCardService } = await import('../services/VCardService.js');
    const vCardService = new VCardService();

    const vCardData = vCardService.generate({
      name: this.profileData.name,
      title: this.profileData.title,
      location: this.profileData.location,
      socialLinks: this.socialLinks.filter(link => link.url !== '#')
    });

    this.downloadFile(vCardData, 'contact.vcf', 'text/vcard');
  }

  async shareProfile() {
    const shareData = {
      title: `${this.profileData.name}'s Profile`,
      text: `Check out ${this.profileData.name}'s profile`,
      url: this.getProfileUrl()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        this.fallbackShare(shareData);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.fallbackShare(shareData);
      }
    }
  }

  fallbackShare(shareData) {
    // Copy to clipboard fallback
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareData.url);
      this.showNotification('Link copied to clipboard!');
    } else {
      this.showNotification('Could not share profile');
    }
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <button class="modal-close">&times;</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    const close = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelector('.modal-overlay').addEventListener('click', close);

    return modal;
  }

  downloadFile(data, filename, type) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  getProfileUrl() {
    return window.location.href;
  }

  setupAnimations() {
    // Add entrance animations
    const elements = this.container.querySelectorAll('.info, .social-btn, .action-btn');
    elements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';

      setTimeout(() => {
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  animateClick(linkId) {
    const button = this.container.querySelector(`[data-social-link="${linkId}"]`);
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }
  }

  trackLinkClick(linkId) {
    // Simple analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'social_link_click', {
        link_id: linkId,
        profile_name: this.profileData.name
      });
    }

    // Also track in localStorage for demo purposes
    const clicks = JSON.parse(localStorage.getItem('linkClicks') || '{}');
    clicks[linkId] = (clicks[linkId] || 0) + 1;
    localStorage.setItem('linkClicks', JSON.stringify(clicks));
  }

  trackProfileView() {
    // Track profile views
    if (typeof gtag !== 'undefined') {
      gtag('event', 'profile_view', {
        profile_name: this.profileData.name
      });
    }

    // Local tracking
    const views = parseInt(localStorage.getItem('profileViews') || '0') + 1;
    localStorage.setItem('profileViews', views.toString());
  }

  updateProfile(newData) {
    this.profileData = { ...this.profileData, ...newData };
    this.saveProfile();
    this.render();
  }

  saveProfile() {
    const data = {
      profile: this.profileData,
      socialLinks: this.socialLinks,
      timestamp: Date.now()
    };
    localStorage.setItem('userProfile', JSON.stringify(data));
  }
}