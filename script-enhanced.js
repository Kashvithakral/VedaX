/**
 * VedaX Enhanced Frontend Script
 * Integrates with backend API while maintaining all existing functionality
 */

// Translations (keeping existing translations)
const translations = {
  en: {
    brand: 'VedaX',
    'nav.home': 'Home',
    'nav.sections': 'Sections',
    'nav.about': 'About',
    'nav.support': 'Support',
    'aria.language': 'Language',
    'hero.title': 'Ayurvedic Herb Traceability',
    'hero.subtitle': 'Trust every step: farm to formulation',
    'hero.cta': 'Scan QR / Search Batch',
    'cards.title': 'Get Started',
    'cards.farmers.title': 'For Farmers',
    'cards.farmers.desc': 'Record harvest, add GPS and photos',
    'cards.processors.title': 'For Processors',
    'cards.processors.desc': 'Log drying, grinding, packaging',
    'cards.labs.title': 'For Labs',
    'cards.labs.desc': 'Upload test results',
    'cards.consumers.title': 'For Consumers',
    'cards.consumers.desc': 'Scan QR, see provenance story',
    'about.title': 'How Traceability Works',
    'about.harvest': 'Harvest',
    'about.lab': 'Lab',
    'about.process': 'Processing',
    'about.shop': 'Shop',
    'about.consumer': 'Consumer',
    'consumer.title': 'Consumer QR / Batch Lookup',
    'consumer.inputLabel': 'Enter Batch ID',
    'consumer.button': 'View Provenance',
    'consumer.help': 'Tip: Try searching for any batch ID.',
    'support.title': 'Support & FAQs',
    'support.contact': 'Contact',
    'faq.q1': 'What is traceability?',
    'faq.a1': 'Traceability links every batch from farm to consumer.',
    'faq.q2': 'How do I add harvest data?',
    'faq.a2': 'Farmers can record harvest with photos and GPS.',
    'faq.q3': 'Are lab results verified?',
    'faq.a3': 'Yes, labs upload certificates for each batch.',
    // New translations
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.syncing': 'Syncing...',
    'error.network': 'Network error. Please try again.',
    'error.auth': 'Authentication required.',
    'success.saved': 'Data saved successfully!',
    'success.synced': 'Data synced with server.',
    'loading': 'Loading...',
    'retry': 'Retry',
    'cancel': 'Cancel',
    'save': 'Save',
    'update': 'Update',
    'delete': 'Delete',
    'confirm': 'Confirm'
  },
  hi: {
    brand: 'VedaX',
    'nav.home': 'होम',
    'nav.sections': 'सेक्शन',
    'nav.about': 'जानकारी',
    'nav.support': 'सहायता',
    'aria.language': 'भाषा',
    'hero.title': 'आयुर्वेदिक जड़ी-बूटी अनुरेखण',
    'hero.subtitle': 'हर कदम पर भरोसा: खेत से निर्माण तक',
    'hero.cta': 'क्यूआर स्कैन / बैच खोजें',
    'cards.title': 'शुरू करें',
    'cards.farmers.title': 'किसानों के लिए',
    'cards.farmers.desc': 'फसल दर्ज करें, जीपीएस और फोटो जोड़ें',
    'cards.processors.title': 'प्रोसेसर्स के लिए',
    'cards.processors.desc': 'सुखाना, पीसना, पैकेजिंग लॉग करें',
    'cards.labs.title': 'प्रयोगशालाओं के लिए',
    'cards.labs.desc': 'टेस्ट परिणाम अपलोड करें',
    'cards.consumers.title': 'उपभोक्ताओं के लिए',
    'cards.consumers.desc': 'क्यूआर स्कैन करें, उत्पत्ति कहानी देखें',
    'about.title': 'ट्रेसबिलिटी कैसे काम करती है',
    'about.harvest': 'कटाई',
    'about.lab': 'प्रयोगशाला',
    'about.process': 'प्रसंस्करण',
    'about.shop': 'दुकान',
    'about.consumer': 'उपभोक्ता',
    'consumer.title': 'उपभोक्ता क्यूआर / बैच खोज',
    'consumer.inputLabel': 'बैच आईडी दर्ज करें',
    'consumer.button': 'उत्पत्ति देखें',
    'consumer.help': 'संकेत: किसी भी बैच आईडी की खोज करें।',
    'support.title': 'सहायता और सामान्य प्रश्न',
    'support.contact': 'संपर्क',
    'faq.q1': 'ट्रेसबिलिटी क्या है?',
    'faq.a1': 'ट्रेसबिलिटी हर बैच को खेत से उपभोक्ता तक जोड़ती है।',
    'faq.q2': 'मैं फसल डेटा कैसे जोड़ूँ?',
    'faq.a2': 'किसान फोटो और जीपीएस के साथ फसल दर्ज कर सकते हैं।',
    'faq.q3': 'क्या लैब परिणाम सत्यापित होते हैं?',
    'faq.a3': 'हाँ, हर बैच के लिए लैब प्रमाणपत्र अपलोड होते हैं।',
    // New translations
    'status.online': 'ऑनलाइन',
    'status.offline': 'ऑफलाइन',
    'status.syncing': 'सिंक हो रहा है...',
    'error.network': 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।',
    'error.auth': 'प्रमाणीकरण आवश्यक।',
    'success.saved': 'डेटा सफलतापूर्वक सहेजा गया!',
    'success.synced': 'डेटा सर्वर के साथ सिंक हो गया।',
    'loading': 'लोड हो रहा है...',
    'retry': 'पुनः प्रयास',
    'cancel': 'रद्द करें',
    'save': 'सहेजें',
    'update': 'अपडेट करें',
    'delete': 'हटाएं',
    'confirm': 'पुष्टि करें'
  }
};

// Global state management
class VedaXState {
  constructor() {
    this.data = {
      user: null,
      harvests: [],
      batches: [],
      labTests: [],
      dashboardData: null,
      isLoading: false,
      error: null,
      syncStatus: 'idle' // idle, syncing, synced, error
    };
    this.listeners = new Map();
  }

  setState(updates) {
    const prevState = { ...this.data };
    this.data = { ...this.data, ...updates };
    
    // Notify listeners
    Object.keys(updates).forEach(key => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach(callback => {
          callback(this.data[key], prevState[key]);
        });
      }
    });
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key).delete(callback);
    };
  }

  getState(key) {
    return key ? this.data[key] : this.data;
  }
}

// Create global state instance
const vedaxState = new VedaXState();

// Utility functions
const utils = {
  // Translation function
  t(key, lang = 'en') {
    return translations[lang]?.[key] || translations.en[key] || key;
  },

  // Format date
  formatDate(date, locale = 'en-US') {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format currency/numbers
  formatNumber(num, decimals = 2) {
    return Number(num).toFixed(decimals);
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Show notification
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
  },

  // Show loading state
  showLoading(element, show = true) {
    if (show) {
      element.classList.add('loading');
      element.disabled = true;
    } else {
      element.classList.remove('loading');
      element.disabled = false;
    }
  },

  // Get current location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },

  // Validate form data
  validateForm(formData, rules) {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = formData[field];
      
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = `${field} is required`;
      }
      
      if (value && rule.min && value < rule.min) {
        errors[field] = `${field} must be at least ${rule.min}`;
      }
      
      if (value && rule.max && value > rule.max) {
        errors[field] = `${field} must be at most ${rule.max}`;
      }
      
      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors[field] = `${field} format is invalid`;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Enhanced UI components
const UI = {
  // Apply translations to page
  applyTranslations(lang = 'en') {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = utils.t(key, lang);
      if (value) {
        el.textContent = value;
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = utils.t(key, lang);
      if (value) {
        el.setAttribute('placeholder', value);
      }
    });
  },

  // Create loading spinner
  createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = '<div class="spinner"></div>';
    return spinner;
  },

  // Create error message
  createErrorMessage(message, retry = null) {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.innerHTML = `
      <div class="error-content">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <span>${message}</span>
        ${retry ? '<button class="btn btn-sm retry-btn">Retry</button>' : ''}
      </div>
    `;
    
    if (retry) {
      error.querySelector('.retry-btn').addEventListener('click', retry);
    }
    
    return error;
  },

  // Create empty state
  createEmptyState(message, icon = 'fa-inbox') {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-content">
        <i class="fa-solid ${icon}"></i>
        <p>${message}</p>
      </div>
    `;
    return empty;
  },

  // Update connection status
  updateConnectionStatus() {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;

    const isOnline = navigator.onLine;
    const syncStatus = vedaxState.getState('syncStatus');
    
    statusEl.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
    
    let statusText = isOnline ? utils.t('status.online') : utils.t('status.offline');
    if (syncStatus === 'syncing') {
      statusText = utils.t('status.syncing');
    }
    
    statusEl.textContent = statusText;
  },

  // Render harvest list
  renderHarvestList(harvests, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (harvests.length === 0) {
      container.appendChild(this.createEmptyState('No harvests found', 'fa-seedling'));
      return;
    }

    harvests.forEach(harvest => {
      const item = document.createElement('div');
      item.className = 'list-item harvest-item';
      
      const complianceClass = harvest.compliance?.geofenceStatus === 'PASS' ? 'ok' : 'fail';
      const seasonalClass = harvest.compliance?.seasonalStatus === 'PASS' ? 'ok' : 
                           harvest.compliance?.seasonalStatus === 'WARNING' ? 'warn' : 'fail';
      
      item.innerHTML = `
        <div class="item-content">
          <div class="item-header">
            <strong>${harvest.sampleId}</strong>
            <span class="item-meta">${utils.formatDate(harvest.harvestDate)}</span>
          </div>
          <div class="item-details">
            <span>${harvest.species} — ${utils.formatNumber(harvest.quantityKg)} kg</span>
            <div class="item-location">
              <i class="fa-solid fa-location-dot"></i>
              GPS: ${harvest.location?.coordinates?.[1]?.toFixed(5)}, ${harvest.location?.coordinates?.[0]?.toFixed(5)}
            </div>
          </div>
          <div class="item-compliance">
            <span class="badge ${complianceClass}">
              ${harvest.compliance?.geofenceStatus || 'PENDING'}
            </span>
            <span class="badge ${seasonalClass}">
              ${harvest.compliance?.seasonalStatus || 'PENDING'}
            </span>
          </div>
        </div>
        ${harvest.photos?.length > 0 ? `
          <div class="item-photo">
            <img src="${harvest.photos[0].url}" alt="Harvest photo" class="thumb">
          </div>
        ` : ''}
      `;
      
      // Add click handler to view details
      item.addEventListener('click', () => {
        showHarvestDetails(harvest);
      });
      
      container.appendChild(item);
    });
  },

  // Render batch list
  renderBatchList(batches, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (batches.length === 0) {
      container.appendChild(this.createEmptyState('No batches found', 'fa-boxes-stacked'));
      return;
    }

    batches.forEach(batch => {
      const item = document.createElement('div');
      item.className = 'list-item batch-item';
      
      const statusClass = batch.status === 'APPROVED' ? 'ok' : 
                         batch.status === 'REJECTED' ? 'fail' : 'warn';
      
      item.innerHTML = `
        <div class="item-content">
          <div class="item-header">
            <strong>${batch.batchId}</strong>
            <span class="badge ${statusClass}">${batch.status}</span>
          </div>
          <div class="item-details">
            <span>${batch.species} — ${utils.formatNumber(batch.totalQuantityKg)} kg</span>
            <div class="item-meta">
              <span>Quality: ${batch.qualityGrade || 'PENDING'}</span>
              <span>Steps: ${batch.processingSteps?.length || 0}</span>
              <span>Tests: ${batch.labTests?.length || 0}</span>
            </div>
          </div>
        </div>
      `;
      
      // Add click handler to view details
      item.addEventListener('click', () => {
        showBatchDetails(batch);
      });
      
      container.appendChild(item);
    });
  }
};

// Enhanced provenance display
async function displayProvenance(id, type = 'batch') {
  const provContainer = document.getElementById('provenance');
  if (!provContainer) return;

  // Show loading
  provContainer.innerHTML = '';
  provContainer.appendChild(UI.createLoadingSpinner());

  try {
    let provenanceData;
    
    if (type === 'batch') {
      provenanceData = await vedaxAPI.getBatchProvenance(id);
    } else {
      provenanceData = await vedaxAPI.getHarvestProvenance(id);
    }

    // Clear loading and display data
    provContainer.innerHTML = '';
    
    if (!provenanceData) {
      provContainer.appendChild(UI.createErrorMessage('No provenance data found'));
      return;
    }

    // Create provenance display
    const provCard = document.createElement('div');
    provCard.className = 'prov-card';
    
    provCard.innerHTML = `
      <div class="prov-header">
        <h3>Provenance Trail</h3>
        <div class="prov-id">${id}</div>
      </div>
      
      <div class="prov-content">
        <div class="prov-timeline">
          ${provenanceData.timeline?.map(event => `
            <div class="timeline-item">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="timeline-title">${event.event}</div>
                <div class="timeline-meta">
                  <span class="timeline-date">${utils.formatDate(event.date)}</span>
                  <span class="timeline-actor">${event.actor}</span>
                </div>
                <div class="timeline-details">${event.details}</div>
              </div>
            </div>
          `).join('') || '<p>No timeline data available</p>'}
        </div>
        
        <div class="prov-map">
          <div class="map-placeholder">
            <i class="fa-solid fa-map-location-dot"></i>
            <p>Interactive map coming soon</p>
          </div>
        </div>
      </div>
      
      <div class="prov-actions">
        <button class="btn btn-secondary" onclick="downloadProvenance('${id}', '${type}')">
          <i class="fa-solid fa-download"></i>
          Download FHIR
        </button>
        <button class="btn btn-primary" onclick="shareProvenance('${id}', '${type}')">
          <i class="fa-solid fa-share"></i>
          Share
        </button>
      </div>
    `;
    
    provContainer.appendChild(provCard);
    
  } catch (error) {
    console.error('Failed to load provenance:', error);
    provContainer.innerHTML = '';
    provContainer.appendChild(UI.createErrorMessage(
      error.message || 'Failed to load provenance data',
      () => displayProvenance(id, type)
    ));
  }
}

// Enhanced form handlers
async function handleHarvestSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById('harvest-status');
  
  // Show loading
  utils.showLoading(submitBtn);
  if (statusEl) statusEl.innerHTML = '';

  try {
    // Get form data
    const formData = new FormData(form);
    const species = formData.get('species')?.trim();
    const quantityKg = parseFloat(formData.get('quantityKg'));
    const harvestMethod = formData.get('harvestMethod');
    
    // Get location
    let location;
    const lat = parseFloat(formData.get('latitude'));
    const lng = parseFloat(formData.get('longitude'));
    
    if (lat && lng) {
      location = { coordinates: [lng, lat] };
    } else {
      // Try to get current location
      try {
        const pos = await utils.getCurrentLocation();
        location = { coordinates: [pos.longitude, pos.latitude] };
      } catch (locError) {
        throw new Error('Location is required. Please enable GPS or enter coordinates manually.');
      }
    }

    // Validate required fields
    const validation = utils.validateForm({ species, quantityKg, harvestMethod }, {
      species: { required: true },
      quantityKg: { required: true, min: 0.01 },
      harvestMethod: { required: true }
    });

    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0]);
    }

    // Prepare harvest data
    const harvestData = {
      species,
      quantityKg,
      harvestMethod,
      location,
      harvestDate: new Date().toISOString()
    };

    // Get photos
    const photos = Array.from(form.querySelectorAll('input[type="file"]'))
      .flatMap(input => Array.from(input.files || []));

    // Submit to API
    const result = await vedaxAPI.createHarvest(harvestData, photos);
    
    // Show success
    utils.showNotification(utils.t('success.saved'), 'success');
    
    // Display compliance status
    if (statusEl && result.harvest.compliance) {
      const compliance = result.harvest.compliance;
      statusEl.innerHTML = `
        <span class="badge ${compliance.geofenceStatus === 'PASS' ? 'ok' : 'fail'}">
          Geo-fence: ${compliance.geofenceStatus}
        </span>
        <span class="badge ${compliance.seasonalStatus === 'PASS' ? 'ok' : 'warn'}">
          Seasonal: ${compliance.seasonalStatus}
        </span>
        <span class="badge ${compliance.sustainabilityScore >= 75 ? 'ok' : 'warn'}">
          Sustainability: ${compliance.sustainabilityScore}/100
        </span>
      `;
    }
    
    // Reset form
    form.reset();
    
    // Refresh harvest list
    await loadHarvests();
    
  } catch (error) {
    console.error('Failed to submit harvest:', error);
    utils.showNotification(error.message || utils.t('error.network'), 'error');
  } finally {
    utils.showLoading(submitBtn, false);
  }
}

async function handleProcessSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  
  utils.showLoading(submitBtn);

  try {
    const formData = new FormData(form);
    const batchId = formData.get('batchId')?.trim();
    const step = formData.get('step');
    const description = formData.get('description')?.trim();
    const notes = formData.get('notes')?.trim();

    if (!batchId || !step) {
      throw new Error('Batch ID and processing step are required');
    }

    const stepData = {
      step,
      description,
      conditions: { notes }
    };

    await vedaxAPI.addProcessingStep(batchId, stepData);
    
    utils.showNotification(utils.t('success.saved'), 'success');
    form.reset();
    
    // Refresh batch list
    await loadBatches();
    
  } catch (error) {
    console.error('Failed to submit processing step:', error);
    utils.showNotification(error.message || utils.t('error.network'), 'error');
  } finally {
    utils.showLoading(submitBtn, false);
  }
}

// Enhanced authentication
async function handleLogin(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('login-error');
  
  utils.showLoading(submitBtn);
  if (errorEl) errorEl.textContent = '';

  try {
    const formData = new FormData(form);
    const email = formData.get('email')?.trim();
    const password = formData.get('password');

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const result = await vedaxAPI.login(email, password);
    
    // Update state
    vedaxState.setState({ user: result.user });
    
    // Redirect based on role
    redirectForRole(result.user.role);
    
  } catch (error) {
    console.error('Login failed:', error);
    if (errorEl) {
      errorEl.textContent = error.message || utils.t('error.auth');
    }
  } finally {
    utils.showLoading(submitBtn, false);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('signup-error');
  
  utils.showLoading(submitBtn);
  if (errorEl) errorEl.textContent = '';

  try {
    const formData = new FormData(form);
    const userData = {
      name: formData.get('name')?.trim(),
      email: formData.get('email')?.trim(),
      password: formData.get('password'),
      role: formData.get('role')
    };

    // Validate required fields
    const validation = utils.validateForm(userData, {
      name: { required: true },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      password: { required: true, min: 6 },
      role: { required: true }
    });

    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0]);
    }

    const result = await vedaxAPI.register(userData);
    
    // Update state
    vedaxState.setState({ user: result.user });
    
    // Redirect based on role
    redirectForRole(result.user.role);
    
  } catch (error) {
    console.error('Signup failed:', error);
    if (errorEl) {
      errorEl.textContent = error.message || 'Registration failed';
    }
  } finally {
    utils.showLoading(submitBtn, false);
  }
}

// Data loading functions
async function loadHarvests() {
  try {
    vedaxState.setState({ isLoading: true });
    const result = await vedaxAPI.getHarvests();
    vedaxState.setState({ 
      harvests: result.harvests || [],
      isLoading: false 
    });
    
    // Update UI
    const container = document.getElementById('harvest-list');
    if (container) {
      UI.renderHarvestList(result.harvests || [], container);
    }
    
  } catch (error) {
    console.error('Failed to load harvests:', error);
    vedaxState.setState({ 
      error: error.message,
      isLoading: false 
    });
  }
}

async function loadBatches() {
  try {
    vedaxState.setState({ isLoading: true });
    const result = await vedaxAPI.getBatches();
    vedaxState.setState({ 
      batches: result.batches || [],
      isLoading: false 
    });
    
    // Update UI
    const container = document.getElementById('batch-list');
    if (container) {
      UI.renderBatchList(result.batches || [], container);
    }
    
  } catch (error) {
    console.error('Failed to load batches:', error);
    vedaxState.setState({ 
      error: error.message,
      isLoading: false 
    });
  }
}

async function loadDashboard() {
  try {
    const overview = await vedaxAPI.getDashboardOverview();
    vedaxState.setState({ dashboardData: overview });
    
    // Update dashboard UI if present
    updateDashboardUI(overview);
    
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

// Utility functions (keeping existing ones and adding new)
function redirectForRole(role) {
  const rolePages = {
    farmer: 'farmer.html',
    collector: 'collector.html',
    processor: 'processor.html',
    lab: 'lab.html',
    consumer: 'consumer.html'
  };
  
  const page = rolePages[role] || 'consumer.html';
  window.location.href = page;
}

function requireRole(allowedRoles) {
  const user = vedaxAPI.getCurrentUser();
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    window.location.href = 'login.html';
  }
}

// Enhanced mobile navigation
function toggleMobileNav() {
  const button = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  if (!button || !links) return;
  
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  links.classList.toggle('open');
}

// Download functions
async function downloadProvenance(id, type) {
  try {
    let data;
    if (type === 'batch') {
      data = await vedaxAPI.getBatchProvenance(id);
    } else {
      data = await vedaxAPI.getHarvestProvenance(id);
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vedax-${type}-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
  } catch (error) {
    utils.showNotification('Failed to download provenance data', 'error');
  }
}

function shareProvenance(id, type) {
  const url = `${window.location.origin}/${type === 'batch' ? 'batch' : 'harvest'}/${id}/provenance`;
  
  if (navigator.share) {
    navigator.share({
      title: `VedaX ${type} Provenance`,
      text: `View the complete provenance trail for ${type} ${id}`,
      url: url
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      utils.showNotification('Provenance URL copied to clipboard', 'success');
    });
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Initialize language
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    const savedLang = localStorage.getItem('vedax.language') || 'en';
    langSelect.value = savedLang;
    UI.applyTranslations(savedLang);

    langSelect.addEventListener('change', (e) => {
      const lang = e.target.value;
      localStorage.setItem('vedax.language', lang);
      UI.applyTranslations(lang);
    });
  }

  // Initialize connection status
  UI.updateConnectionStatus();
  window.addEventListener('online', UI.updateConnectionStatus);
  window.addEventListener('offline', UI.updateConnectionStatus);

  // Set up event listeners
  const harvestForm = document.getElementById('harvest-form');
  if (harvestForm) {
    harvestForm.addEventListener('submit', handleHarvestSubmit);
  }

  const processForm = document.getElementById('process-form');
  if (processForm) {
    processForm.addEventListener('submit', handleProcessSubmit);
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  // Consumer provenance lookup
  const provenanceBtn = document.getElementById('provenance-button');
  if (provenanceBtn) {
    provenanceBtn.addEventListener('click', async () => {
      const input = document.getElementById('batch-input');
      const id = input?.value?.trim();
      if (id) {
        await displayProvenance(id, 'batch');
      }
    });
  }

  // Hero CTA
  const ctaBtn = document.getElementById('cta-button');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', async () => {
      const heroInput = document.getElementById('batch-input-hero');
      const consumerInput = document.getElementById('batch-input');
      const id = heroInput?.value?.trim();
      
      if (id && consumerInput) {
        consumerInput.value = id;
        await displayProvenance(id, 'batch');
        document.getElementById('consumer')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Mobile navigation
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', toggleMobileNav);
  }

  // Get current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Skip authentication checks for public pages
  const publicPages = ['index.html', 'consumer.html', 'login.html', 'signup.html', ''];
  const isPublicPage = publicPages.includes(currentPage);
  
  // Only check authentication for protected pages
  if (!isPublicPage && vedaxAPI.isAuthenticated()) {
    try {
      const user = await vedaxAPI.getProfile();
      vedaxState.setState({ user: user.user });
      
      // Load role-specific data
      if (currentPage === 'farmer.html' || currentPage === 'collector.html') {
        await loadHarvests();
      } else if (currentPage === 'processor.html') {
        await loadBatches();
      }
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Token might be expired, clear it but don't redirect immediately
      vedaxAPI.setStoredAuth(null);
    }
  }

  // Role-based access control (only for protected pages)
  if (!isPublicPage) {
    if (currentPage === 'farmer.html') {
      requireRole(['farmer', 'collector']);
    } else if (currentPage === 'processor.html') {
      requireRole(['processor']);
    } else if (currentPage === 'lab.html') {
      requireRole(['lab']);
    }
  }

  // Listen for data sync events
  window.addEventListener('vedax:dataSync', (event) => {
    const { synced, failed } = event.detail;
    if (synced > 0) {
      utils.showNotification(`${synced} items synced successfully`, 'success');
      // Refresh current data
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage === 'farmer.html' || currentPage === 'collector.html') {
        loadHarvests();
      } else if (currentPage === 'processor.html') {
        loadBatches();
      }
    }
  });
});