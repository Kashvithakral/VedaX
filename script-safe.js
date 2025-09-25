/**
 * VedaX Safe Frontend Script
 * Safe version that prevents refresh loops
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
    'cards.labs.desc': 'टेस्ट परिणाम अप��ोड करें',
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
    'loading': 'लोड हो ���हा है...',
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
    if (!element) return;
    
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
  }
};

// Safe authentication functions
function redirectForRole(role) {
  // Prevent infinite redirects by checking if we're already on the target page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  const rolePages = {
    farmer: 'farmer.html',
    collector: 'collector.html',
    processor: 'processor.html',
    lab: 'lab.html',
    consumer: 'consumer.html',
    admin: 'admin.html'
  };
  
  const targetPage = rolePages[role] || 'consumer.html';
  
  // Only redirect if we're not already on the target page
  if (currentPage !== targetPage) {
    console.log(`Redirecting ${role} from ${currentPage} to ${targetPage}`);
    window.location.href = targetPage;
  }
}

function checkPageAccess() {
  // Get current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Define public pages that don't require authentication
  const publicPages = ['index.html', 'consumer.html', 'login.html', 'signup.html', ''];
  
  // If it's a public page, allow access
  if (publicPages.includes(currentPage)) {
    return true;
  }
  
  // For protected pages, check authentication
  if (!window.vedaxAPI || !window.vedaxAPI.isAuthenticated()) {
    console.log(`Access denied to ${currentPage} - not authenticated`);
    window.location.href = 'login.html';
    return false;
  }
  
  // Check role-based access
  const user = window.vedaxAPI.getCurrentUser();
  if (!user) {
    console.log(`Access denied to ${currentPage} - no user data`);
    window.location.href = 'login.html';
    return false;
  }
  
  // Define page-role mappings
  const pageRoles = {
    'farmer.html': ['farmer', 'collector'],
    'collector.html': ['farmer', 'collector'],
    'processor.html': ['processor'],
    'lab.html': ['lab'],
    'admin.html': ['admin']
  };
  
  const allowedRoles = pageRoles[currentPage];
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`Access denied to ${currentPage} - role ${user.role} not allowed`);
    // Redirect to appropriate page for their role
    redirectForRole(user.role);
    return false;
  }
  
  return true;
}

// Enhanced form handlers
async function handleLogin(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('login-error');
  
  utils.showLoading(submitBtn);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }

  try {
    const formData = new FormData(form);
    const email = formData.get('email')?.trim();
    const password = formData.get('password');

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Check if API is available
    if (!window.vedaxAPI) {
      throw new Error('API not available. Please check your connection.');
    }

    const result = await window.vedaxAPI.login(email, password);
    
    // Update state
    vedaxState.setState({ user: result.user });
    
    // Show success message
    utils.showNotification('Login successful!', 'success');
    
    // Redirect based on role after a short delay
    setTimeout(() => {
      redirectForRole(result.user.role);
    }, 1000);
    
  } catch (error) {
    console.error('Login failed:', error);
    if (errorEl) {
      errorEl.textContent = error.message || utils.t('error.auth');
      errorEl.style.display = 'block';
    }
    utils.showNotification(error.message || 'Login failed', 'error');
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
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }

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

    // Check if API is available
    if (!window.vedaxAPI) {
      throw new Error('API not available. Please check your connection.');
    }

    const result = await window.vedaxAPI.register(userData);
    
    // Update state
    vedaxState.setState({ user: result.user });
    
    // Show success message
    utils.showNotification('Account created successfully!', 'success');
    
    // Redirect based on role after a short delay
    setTimeout(() => {
      redirectForRole(result.user.role);
    }, 1000);
    
  } catch (error) {
    console.error('Signup failed:', error);
    if (errorEl) {
      errorEl.textContent = error.message || 'Registration failed';
      errorEl.style.display = 'block';
    }
    utils.showNotification(error.message || 'Registration failed', 'error');
  } finally {
    utils.showLoading(submitBtn, false);
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

// Safe initialization
function initializePage() {
  console.log('Initializing VedaX page...');
  
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
        utils.showNotification('Provenance lookup feature coming soon!', 'info');
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
        document.getElementById('consumer')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Mobile navigation
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', toggleMobileNav);
  }

  // Check page access (this is safe and won't cause loops)
  checkPageAccess();
  
  console.log('VedaX page initialized successfully');
}

// Safe DOM ready handler
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}