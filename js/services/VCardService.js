/**
 * vCard Service
 * Generates vCard files for contact import
 */
export default class VCardService {
  constructor() {
    this.version = '3.0';
  }

  generate(contactData) {
    const {
      name,
      firstName,
      lastName,
      title,
      organization,
      email,
      phone,
      website,
      location,
      avatar,
      socialLinks,
      notes
    } = contactData;

    // Split name into first and last name
    let firstNameFinal = firstName;
    let lastNameFinal = lastName;

    if (name && !firstName && !lastName) {
      const nameParts = name.trim().split(' ');
      firstNameFinal = nameParts[0] || '';
      lastNameFinal = nameParts.slice(1).join(' ') || '';
    }

    const vCardLines = [
      'BEGIN:VCARD',
      `VERSION:${this.version}`,
      `FN:${name || `${firstNameFinal} ${lastNameFinal}`.trim()}`,
      `N:${lastNameFinal};${firstNameFinal};;;`
    ];

    // Add title/role
    if (title) {
      vCardLines.push(`TITLE:${title}`);
    }

    // Add organization
    if (organization) {
      vCardLines.push(`ORG:${organization}`);
    }

    // Add phone
    if (phone) {
      vCardLines.push(`TEL;TYPE=CELL,VOICE:${phone}`);
    }

    // Add email
    if (email) {
      vCardLines.push(`EMAIL;TYPE=PREF,INTERNET:${email}`);
    }

    // Add website
    if (website) {
      vCardLines.push(`URL:${website}`);
    }

    // Add address from location
    if (location) {
      vCardLines.push(`ADR;TYPE=WORK:;;${location};;;;`);
    }

    // Add avatar/photo
    if (avatar) {
      // For web-based avatars, add URL
      if (avatar.startsWith('http')) {
        vCardLines.push(`PHOTO;VALUE=URI;TYPE=URL:${avatar}`);
      } else {
        // For local images, you might need to convert to base64
        vCardLines.push(`PHOTO;VALUE=URI;TYPE=URL:${avatar}`);
      }
    }

    // Add social media links as URLs
    if (socialLinks && Array.isArray(socialLinks)) {
      socialLinks.forEach(link => {
        if (link.url && link.url !== '#') {
          // Add custom social media field
          vCardLines.push(`X-SOCIALPROFILE;TYPE=${link.id.toUpperCase()}:${link.url}`);
          // Also add as URL for compatibility
          vCardLines.push(`URL;TYPE=${link.label}:${link.url}`);
        }
      });
    }

    // Add notes
    if (notes) {
      vCardLines.push(`NOTE:${notes.replace(/\n/g, '\\n')}`);
    }

    // Add creation date
    const now = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
    vCardLines.push(`REV:${now}`);

    // Add UID for uniqueness
    vCardLines.push(`UID:${Date.now()}-vcard`);

    vCardLines.push('END:VCARD');

    return vCardLines.join('\r\n');
  }

  generateSimple(name, title, location, socialLinks = []) {
    return this.generate({
      name,
      title,
      location,
      socialLinks
    });
  }

  generateFromProfile(profileData) {
    return this.generate({
      name: profileData.name,
      title: profileData.title,
      location: profileData.location,
      email: profileData.email,
      phone: profileData.phone,
      website: profileData.website,
      avatar: profileData.avatar,
      socialLinks: profileData.socialLinks,
      organization: profileData.organization,
      notes: profileData.bio
    });
  }

  // Enhanced vCard with more fields
  generateAdvanced(contactData) {
    const baseVCard = this.generate(contactData);

    // Add additional fields for enhanced vCard
    const additionalLines = [];

    // Add birthday if provided
    if (contactData.birthday) {
      const bday = new Date(contactData.birthday).toISOString().split('T')[0];
      additionalLines.push(`BDAY:${bday}`);
    }

    // Add work address
    if (contactData.workAddress) {
      additionalLines.push(`ADR;TYPE=WORK:;;${contactData.workAddress};;;;`);
    }

    // Add home address
    if (contactData.homeAddress) {
      additionalLines.push(`ADR;TYPE=HOME:;;${contactData.homeAddress};;;;`);
    }

    // Add instant messaging accounts
    if (contactData.imAccounts) {
      contactData.imAccounts.forEach(im => {
        additionalLines.push(`IMPP;TYPE=${im.type}:${im.value}`);
      });
    }

    // Add custom fields
    if (contactData.customFields) {
      contactData.customFields.forEach(field => {
        additionalLines.push(`X-${field.name}:${field.value}`);
      });
    }

    if (additionalLines.length > 0) {
      // Insert additional lines before END:VCARD
      const lines = baseVCard.split('\r\n');
      const endIndex = lines.indexOf('END:VCARD');
      lines.splice(endIndex, 0, ...additionalLines);
      return lines.join('\r\n');
    }

    return baseVCard;
  }

  // Validate vCard content
  validate(vCardContent) {
    const required = ['BEGIN:VCARD', 'VERSION:', 'FN:', 'END:VCARD'];
    const lines = vCardContent.split('\r\n');

    return required.every(reqLine =>
      lines.some(line => line.startsWith(reqLine))
    );
  }

  // Download vCard file
  download(vCardContent, filename = 'contact.vcf') {
    const blob = new Blob([vCardContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Convert vCard to different formats
  toJSON(vCardContent) {
    const lines = vCardContent.split('\r\n');
    const vCard = {};

    lines.forEach(line => {
      if (line.startsWith('FN:')) {
        vCard.fullName = line.substring(3);
      } else if (line.startsWith('TITLE:')) {
        vCard.title = line.substring(6);
      } else if (line.startsWith('EMAIL:')) {
        vCard.email = line.substring(6);
      } else if (line.startsWith('TEL:')) {
        vCard.phone = line.substring(4);
      } else if (line.startsWith('URL:')) {
        vCard.website = line.substring(4);
      }
    });

    return vCard;
  }
}