import { ref } from 'vue';

/**
 * Configuration service to manage app-wide settings
 */
class ConfigService {
  // Feature flags
  public useFirebaseData = ref(true); // Enable Firebase for new installs
  public enableUserManagement = ref(true);
  public enableGameSubmissions = ref(true);
  public enableEventManagement = ref(true);

  // Admin settings
  public requireAdminApproval = ref(false);
  public allowUserRegistration = ref(true);
  public enableGuestAccess = ref(true);

  /**
   * Initialize configuration from localStorage or environment
   */
  init() {
    // Load from localStorage if available
    const savedConfig = localStorage.getItem('ttg-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        this.useFirebaseData.value = config.useFirebaseData ?? true;
        this.enableUserManagement.value = config.enableUserManagement ?? true;
        this.enableGameSubmissions.value = config.enableGameSubmissions ?? true;
        this.enableEventManagement.value = config.enableEventManagement ?? true;
        this.requireAdminApproval.value = config.requireAdminApproval ?? false;
        this.allowUserRegistration.value = config.allowUserRegistration ?? true;
        this.enableGuestAccess.value = config.enableGuestAccess ?? true;
      } catch (error) {
        console.warn('Failed to parse saved configuration:', error);
      }
    }

    // Override with environment variables if available
    if (import.meta.env.VITE_USE_FIREBASE_DATA !== undefined) {
      this.useFirebaseData.value = import.meta.env.VITE_USE_FIREBASE_DATA === 'true';
    }
  }

  /**
   * Save current configuration to localStorage
   */
  save() {
    const config = {
      useFirebaseData: this.useFirebaseData.value,
      enableUserManagement: this.enableUserManagement.value,
      enableGameSubmissions: this.enableGameSubmissions.value,
      enableEventManagement: this.enableEventManagement.value,
      requireAdminApproval: this.requireAdminApproval.value,
      allowUserRegistration: this.allowUserRegistration.value,
      enableGuestAccess: this.enableGuestAccess.value,
    };

    localStorage.setItem('ttg-config', JSON.stringify(config));
  }

  /**
   * Reset to default configuration
   */
  reset() {
    this.useFirebaseData.value = true;
    this.enableUserManagement.value = true;
    this.enableGameSubmissions.value = true;
    this.enableEventManagement.value = true;
    this.requireAdminApproval.value = false;
    this.allowUserRegistration.value = true;
    this.enableGuestAccess.value = true;
    this.save();
  }
}

// Export singleton instance
export const configService = new ConfigService();

// Initialize on module load
configService.init();
