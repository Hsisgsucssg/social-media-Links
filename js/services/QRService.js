/**
 * QR Code Service
 * Handles QR code generation and display
 */
export default class QRService {
  constructor() {
    this.loaded = false;
    this.qrCodeLib = null;
  }

  async loadLibrary() {
    if (this.loaded) return;

    try {
      // Dynamically import qrcode library
      const QRCode = await import('qrcode');
      this.qrCodeLib = QRCode.default;
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load QR Code library:', error);
      throw new Error('QR Code generation not available');
    }
  }

  async generate(text, options = {}) {
    await this.loadLibrary();

    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      return await this.qrCodeLib.toDataURL(text, mergedOptions);
    } catch (error) {
      console.error('QR Code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async generateCanvas(text, options = {}) {
    await this.loadLibrary();

    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      return await this.qrCodeLib.toCanvas(text, mergedOptions);
    } catch (error) {
      console.error('QR Canvas generation failed:', error);
      throw new Error('Failed to generate QR canvas');
    }
  }

  generateWithLogo(text, logoUrl, options = {}) {
    // This would require a more advanced QR library or custom implementation
    // For now, return the basic QR code
    return this.generate(text, options);
  }

  async downloadQR(text, filename = 'qrcode.png', options = {}) {
    const dataUrl = await this.generate(text, options);
    this.downloadDataUrl(dataUrl, filename);
  }

  downloadDataUrl(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Generate different types of QR codes
  async generateProfileQR(profileUrl, options = {}) {
    return this.generate(profileUrl, {
      width: 300,
      color: {
        dark: '#151515',
        light: '#FFFFFF'
      },
      ...options
    });
  }

  async generateWiFiQR(ssid, password, security = 'WPA', options = {}) {
    const wifiString = `WIFI:T:${security};S:${ssid};P:${password};;`;
    return this.generate(wifiString, options);
  }

  async generateEmailQR(email, subject = '', body = '', options = {}) {
    const emailString = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return this.generate(emailString, options);
  }

  async generatePhoneQR(phoneNumber, options = {}) {
    const phoneString = `tel:${phoneNumber}`;
    return this.generate(phoneString, options);
  }

  // Batch generation for multiple QR codes
  async generateBatch(items, options = {}) {
    const promises = items.map(item => this.generate(item.text, item.options || options));
    return await Promise.all(promises);
  }
}