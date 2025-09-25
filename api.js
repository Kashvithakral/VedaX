/**
 * VedaX API Client
 * Handles all communication with the backend API
 */

class VedaXAPI {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.token = this.getToken();
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  getBaseURL() {
    // Auto-detect API base URL
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Check if there's a custom API URL in localStorage (for development)
    const customApiUrl = localStorage.getItem('vedax.apiUrl');
    if (customApiUrl) {
      return customApiUrl;
    }
    
    // Development detection
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Try to detect if we're running on a different port than the API
      if (port && port !== '3000') {
        return 'http://127.0.0.1:3000/api';
      }
      return `http://${hostname}:3000/api`;
    }
    
    return '/api'; // Production - assume API is served from same domain
  }

  getToken() {
    const auth = this.getStoredAuth();
    return auth ? auth.token : null;
  }

  getStoredAuth() {
    try {
      return JSON.parse(localStorage.getItem('vedax.auth')) || null;
    } catch {
      return null;
    }
  }

  setStoredAuth(auth) {
    if (auth) {
      localStorage.setItem('vedax.auth', JSON.stringify(auth));
      this.token = auth.token;
    } else {
      localStorage.removeItem('vedax.auth');
      this.token = null;
    }
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    // Handle FormData (for file uploads)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        this.setStoredAuth(null);
        // Don't automatically redirect, let the calling code handle it
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      // If offline, queue the request for later
      if (!this.isOnline && options.method !== 'GET') {
        this.queueOfflineRequest(endpoint, options);
      }
      throw error;
    }
  }

  // Queue requests for offline sync
  queueOfflineRequest(endpoint, options) {
    const queue = JSON.parse(localStorage.getItem('vedax.offlineQueue') || '[]');
    queue.push({
      endpoint,
      options,
      timestamp: Date.now()
    });
    localStorage.setItem('vedax.offlineQueue', JSON.stringify(queue));
  }

  // Sync offline requests when back online
  async syncOfflineData() {
    const queue = JSON.parse(localStorage.getItem('vedax.offlineQueue') || '[]');
    if (queue.length === 0) return;

    const successful = [];
    const failed = [];

    for (const item of queue) {
      try {
        await this.request(item.endpoint, item.options);
        successful.push(item);
      } catch (error) {
        console.warn('Failed to sync offline request:', error);
        failed.push(item);
      }
    }

    // Update queue with failed requests only
    localStorage.setItem('vedax.offlineQueue', JSON.stringify(failed));
    
    if (successful.length > 0) {
      console.log(`Synced ${successful.length} offline requests`);
      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('vedax:dataSync', { 
        detail: { synced: successful.length, failed: failed.length }
      }));
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    this.setStoredAuth(response.data);
    return response.data;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    this.setStoredAuth(response.data);
    return response.data;
  }

  async getProfile() {
    const response = await this.request('/auth/me');
    return response.data;
  }

  async updateProfile(profileData) {
    const response = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return response.data;
  }

  logout() {
    this.setStoredAuth(null);
    window.location.href = 'index.html';
  }

  // Harvest methods
  async createHarvest(harvestData, photos = []) {
    const formData = new FormData();
    
    // Add harvest data
    Object.keys(harvestData).forEach(key => {
      if (typeof harvestData[key] === 'object') {
        formData.append(key, JSON.stringify(harvestData[key]));
      } else {
        formData.append(key, harvestData[key]);
      }
    });

    // Add photos
    photos.forEach((photo, index) => {
      formData.append('photos', photo);
    });

    const response = await this.request('/harvest', {
      method: 'POST',
      body: formData
    });
    
    return response.data;
  }

  async getHarvests(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await this.request(`/harvest?${params}`);
    return response.data;
  }

  async getHarvest(sampleId) {
    const response = await this.request(`/harvest/${sampleId}`);
    return response.data;
  }

  async getHarvestProvenance(sampleId) {
    const response = await this.request(`/harvest/${sampleId}/provenance`);
    return response.data;
  }

  async getHarvestStats() {
    const response = await this.request('/harvest/stats');
    return response.data;
  }

  // Batch methods
  async createBatch(batchData) {
    const response = await this.request('/batch', {
      method: 'POST',
      body: JSON.stringify(batchData)
    });
    return response.data;
  }

  async getBatches(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await this.request(`/batch?${params}`);
    return response.data;
  }

  async getBatch(batchId) {
    const response = await this.request(`/batch/${batchId}`);
    return response.data;
  }

  async getBatchProvenance(batchId) {
    const response = await this.request(`/batch/${batchId}/provenance`);
    return response.data;
  }

  async addProcessingStep(batchId, stepData) {
    const response = await this.request(`/batch/${batchId}/process`, {
      method: 'POST',
      body: JSON.stringify(stepData)
    });
    return response.data;
  }

  async completeProcessingStep(batchId, stepId, completionData) {
    const response = await this.request(`/batch/${batchId}/process/${stepId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(completionData)
    });
    return response.data;
  }

  // Lab methods
  async addLabTest(testData, certificate = null) {
    const formData = new FormData();
    
    Object.keys(testData).forEach(key => {
      if (typeof testData[key] === 'object') {
        formData.append(key, JSON.stringify(testData[key]));
      } else {
        formData.append(key, testData[key]);
      }
    });

    if (certificate) {
      formData.append('certificate', certificate);
    }

    const response = await this.request('/lab/test', {
      method: 'POST',
      body: formData
    });
    return response.data;
  }

  async getLabTests(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await this.request(`/lab/tests?${params}`);
    return response.data;
  }

  async getPendingTests() {
    const response = await this.request('/lab/pending');
    return response.data;
  }

  // QR Code methods
  async generateQRCode(data, format = 'dataurl') {
    const response = await this.request('/qr/generate', {
      method: 'POST',
      body: JSON.stringify({ data, format })
    });
    return response.data;
  }

  async getHarvestQR(sampleId, format = 'dataurl') {
    const response = await this.request(`/qr/harvest/${sampleId}?format=${format}`);
    return response.data;
  }

  async getBatchQR(batchId, format = 'dataurl') {
    const response = await this.request(`/qr/batch/${batchId}?format=${format}`);
    return response.data;
  }

  async scanQR(qrData) {
    const response = await this.request('/qr/scan', {
      method: 'POST',
      body: JSON.stringify({ qrData })
    });
    return response.data;
  }

  // Compliance methods
  async checkHarvestCompliance(harvestData) {
    const response = await this.request('/compliance/check-harvest', {
      method: 'POST',
      body: JSON.stringify(harvestData)
    });
    return response.data;
  }

  async getComplianceReport(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await this.request(`/compliance/report?${params}`);
    return response.data;
  }

  // Dashboard methods
  async getDashboardOverview() {
    const response = await this.request('/dashboard/overview');
    return response.data;
  }

  async getDashboardTrends(months = 12) {
    const response = await this.request(`/dashboard/trends?months=${months}`);
    return response.data;
  }

  async getComplianceDashboard() {
    const response = await this.request('/dashboard/compliance');
    return response.data;
  }

  // Blockchain methods
  async getBlockchainStatus() {
    const response = await this.request('/blockchain/status');
    return response.data;
  }

  async getBlockchainStats() {
    const response = await this.request('/blockchain/stats');
    return response.data;
  }

  // Utility methods
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return await response.json();
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  // Get current user info
  getCurrentUser() {
    const auth = this.getStoredAuth();
    return auth ? auth.user : null;
  }

  isAuthenticated() {
    return !!this.token;
  }

  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  hasPermission(permission) {
    const user = this.getCurrentUser();
    return user && user.permissions && user.permissions[permission];
  }
}

// Create global API instance
window.vedaxAPI = new VedaXAPI();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VedaXAPI;
}