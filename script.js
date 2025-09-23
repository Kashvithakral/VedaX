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
    'consumer.help': 'Tip: Try BATCH123 for a demo.',
    'support.title': 'Support & FAQs',
    'support.contact': 'Contact',
    'faq.q1': 'What is traceability?',
    'faq.a1': 'Traceability links every batch from farm to consumer.',
    'faq.q2': 'How do I add harvest data?',
    'faq.a2': 'Farmers can record harvest with photos and GPS.',
    'faq.q3': 'Are lab results verified?',
    'faq.a3': 'Yes, labs upload certificates for each batch.'
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
    'consumer.help': 'संकेत: डेमो के लिए BATCH123 आज़माएँ।',
    'support.title': 'सहायता और सामान्य प्रश्न',
    'support.contact': 'संपर्क',
    'faq.q1': 'ट्रेसबिलिटी क्या है?',
    'faq.a1': 'ट्रेसबिलिटी हर बैच को खेत से उपभोक्ता तक जोड़ती है।',
    'faq.q2': 'मैं फसल डेटा कैसे जोड़ूँ?',
    'faq.a2': 'किसान फोटो और जीपीएस के साथ फसल दर्ज कर सकते हैं।',
    'faq.q3': 'क्या लैब परिणाम सत्यापित होते हैं?',
    'faq.a3': 'हाँ, हर बैच के लिए लैब प्रमाणपत्र अपलोड होते हैं।'
  }
};

function applyTranslations(lang) {
  const strings = translations[lang] || translations.en;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = strings[key];
    if (typeof value === 'string') {
      el.textContent = value;
    }
  });
  // Update placeholders
  const heroInput = document.getElementById('batch-input-hero');
  const consumerInput = document.getElementById('batch-input');
  if (heroInput) heroInput.setAttribute('placeholder', lang === 'hi' ? 'उदा. BATCH123' : 'e.g. BATCH123');
  if (consumerInput) consumerInput.setAttribute('placeholder', lang === 'hi' ? 'उदा. BATCH123' : 'e.g. BATCH123');
}

function simulateProvenance(batchId, lang) {
  const prov = document.getElementById('provenance');
  if (!prov) return;
  const isDemo = (batchId || '').trim().toUpperCase() === 'BATCH123';
  const t = translations[lang] || translations.en;

  const details = isDemo ? {
    farmer: lang === 'hi' ? 'किसान: अंजलि देव' : 'Farmer: Anjali Dev',
    location: lang === 'hi' ? 'स्थान: अल्मोड़ा, उत्तराखंड' : 'Location: Almora, Uttarakhand',
    harvest: lang === 'hi' ? 'कटाई: 12 मई 2025' : 'Harvest: 12 May 2025',
    lab: lang === 'hi' ? 'लैब प्रमाणपत्र: पास (हैवी मेटल्स, माइक्रोबियल)' : 'Lab Certificate: PASS (Heavy Metals, Microbial)',
    process: lang === 'hi' ? 'प्रसंस्करण: सौर सुखाना, कोल्ड-ग्राइंड' : 'Processing: Solar-dried, Cold-ground',
    manufacturer: lang === 'hi' ? 'निर्माता: VedaX Botanicals' : 'Manufacturer: VedaX Botanicals',
    story: lang === 'hi' ? 'यह बैच हिमालय की ढलानों पर उगाया गया था और स्थानीय सहकारी द्वारा एकत्रित किया गया।' : 'This batch was grown on Himalayan slopes and aggregated by a local cooperative.'
  } : {
    farmer: lang === 'hi' ? 'अज्ञात बैच' : 'Unknown batch',
    location: lang === 'hi' ? 'कृपया सही बैच आईडी दर्ज करें।' : 'Please enter a valid batch ID.',
    harvest: '', lab: '', process: '', manufacturer: '', story: ''
  };

  prov.innerHTML = `
    <div class="prov-card">
      <div class="prov-grid">
        <div>
          <h3>${isDemo ? (lang === 'hi' ? 'उत्पत्ति कहानी' : 'Provenance Story') : (lang === 'hi' ? 'कोई डेटा नहीं' : 'No Data')}</h3>
          <p>${details.story}</p>
          <ul>
            <li>${details.farmer}</li>
            <li>${details.location}</li>
            ${details.harvest ? `<li>${details.harvest}</li>` : ''}
            ${details.lab ? `<li>${details.lab}</li>` : ''}
            ${details.process ? `<li>${details.process}</li>` : ''}
            ${details.manufacturer ? `<li>${details.manufacturer}</li>` : ''}
          </ul>
        </div>
        <div class="prov-map" role="img" aria-label="Map placeholder">
          <div class="prov-marker" style="top: 30%; left: 62%"></div>
          <div class="prov-marker" style="top: 55%; left: 40%"></div>
        </div>
      </div>
      <div class="prov-legend">${isDemo ? (lang === 'hi' ? 'मानचित्र संकेतक: खेत, प्रयोगशाला, प्रसंस्करण' : 'Map markers: Farm, Lab, Processing') : ''}</div>
    </div>
  `;
}

function toggleMobileNav() {
  const button = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  if (!button || !links) return;
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  links.classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Language initialization
  const langSelect = document.getElementById('language-select');
  const savedLang = (localStorage.getItem('lang') || navigator.language || 'en').slice(0,2);
  const initialLang = ['en','hi'].includes(savedLang) ? savedLang : 'en';
  langSelect.value = initialLang;
  applyTranslations(initialLang);

  langSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    localStorage.setItem('lang', lang);
    applyTranslations(lang);
  });

  // Hero CTA
  document.getElementById('cta-button')?.addEventListener('click', () => {
    const id = document.getElementById('batch-input-hero').value || '';
    document.getElementById('batch-input').value = id;
    simulateProvenance(id, document.getElementById('language-select').value);
    document.getElementById('consumer').scrollIntoView({ behavior: 'smooth' });
  });

  // Consumer lookup
  document.getElementById('provenance-button')?.addEventListener('click', () => {
    const id = document.getElementById('batch-input').value || '';
    simulateProvenance(id, document.getElementById('language-select').value);
  });

  // Enter key triggers search
  ['batch-input','batch-input-hero'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const lang = document.getElementById('language-select').value;
        if (id === 'batch-input-hero') {
          document.getElementById('batch-input').value = el.value;
          simulateProvenance(el.value, lang);
          document.getElementById('consumer').scrollIntoView({ behavior: 'smooth' });
        } else {
          simulateProvenance(el.value, lang);
        }
      }
    });
  });

  // Mobile nav
  document.querySelector('.nav-toggle')?.addEventListener('click', toggleMobileNav);

  // Process offline queue at start
  processQueue().then(() => {
    renderHarvests();
    renderCompliance();
    renderBatchesAndLabs();
  });

  // Farmer form
  document.getElementById('harvest-form')?.addEventListener('submit', handleHarvestSubmit);

  // Processor form
  document.getElementById('process-form')?.addEventListener('submit', handleProcessSubmit);

  // FHIR download
  document.getElementById('download-fhir')?.addEventListener('click', () => {
    const id = (document.getElementById('batch-input')?.value || 'BATCH123').trim() || 'BATCH123';
    const bundle = buildFhirBundle(id);
    downloadJson(`vedax-${id}.fhir.json`, bundle);
  });

  // Simple auth
  const auth = getAuth();
  if (auth) {
    redirectForRole(auth.role);
  }

  // Auth listeners
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
  attachLogout();

  // Role guards
  const path = location.pathname.split('/').pop() || '';
  if (path === 'farmer.html') requireRole(['farmer','collector']);
  if (path === 'collector.html') requireRole(['collector','farmer']);
  if (path === 'processor.html') requireRole(['processor']);
  // consumer accessible to all
});


// Data storage keys
const LS_KEYS = {
  harvests: 'vedax.harvests',
  processes: 'vedax.processes',
  labResults: 'vedax.labResults',
  offlineQueue: 'vedax.offlineQueue'
};

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback; }
  catch { return fallback; }
}
function saveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// IDs
function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${rand}-${ts}`;
}

// Compliance rules (demo)
const GEOFENCE = { minLat: 20.0, maxLat: 35.5, minLng: 70.0, maxLng: 90.0 };
const SEASONAL = {
  // species: allowed months (1-12)
  Ashwagandha: [4,5,6,10,11],
  Tulsi: [3,4,5,6,7,8,9],
  Amla: [11,12,1,2]
};

function checkGeofence(lat, lng) {
  return lat >= GEOFENCE.minLat && lat <= GEOFENCE.maxLat && lng >= GEOFENCE.minLng && lng <= GEOFENCE.maxLng;
}
function checkSeason(species, date) {
  const m = (date.getMonth() + 1);
  const allowed = SEASONAL[species];
  if (!allowed) return true; // unknown species allowed
  return allowed.includes(m);
}

// Rendering
function renderHarvests() {
  const container = document.getElementById('harvest-list');
  if (!container) return;
  const items = loadJson(LS_KEYS.harvests, []);
  container.innerHTML = '';
  items.sort((a,b) => b.timestamp - a.timestamp).forEach((h) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    const meta = document.createElement('div');
    meta.innerHTML = `<div><strong>${h.sampleId}</strong> — ${h.species} — ${h.quantityKg} kg</div>
      <div class="list-meta">GPS: ${h.lat.toFixed(5)}, ${h.lng.toFixed(5)} · ${new Date(h.timestamp).toLocaleString()} ${h.synced ? '' : '(queued)'}</div>`;
    const right = document.createElement('div');
    if (h.photoDataUrl) {
      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = h.photoDataUrl;
      img.alt = 'Photo';
      right.appendChild(img);
    }
    item.appendChild(meta);
    item.appendChild(right);
    container.appendChild(item);
  });
}

function renderCompliance() {
  const container = document.getElementById('compliance-badges');
  if (!container) return;
  const items = loadJson(LS_KEYS.harvests, []);
  if (items.length === 0) {
    container.innerHTML = '<span class="badge warn">No harvests yet</span>';
    return;
  }
  const last = items.slice().sort((a,b)=>b.timestamp-a.timestamp)[0];
  const geoOk = checkGeofence(last.lat, last.lng);
  const seasonOk = checkSeason(last.species, new Date(last.timestamp));
  container.innerHTML = '';
  const geo = document.createElement('span');
  geo.className = `badge ${geoOk ? 'ok' : 'fail'}`;
  geo.textContent = geoOk ? 'Geo-fence PASS' : 'Geo-fence FAIL';
  const sea = document.createElement('span');
  sea.className = `badge ${seasonOk ? 'ok' : 'warn'}`;
  sea.textContent = seasonOk ? 'Seasonal OK' : 'Out-of-season';
  container.append(geo, sea);
}

function renderBatchesAndLabs() {
  const batchList = document.getElementById('batch-list');
  const labList = document.getElementById('lab-results');
  if (!batchList && !labList) return;
  const processes = loadJson(LS_KEYS.processes, []);
  const harvests = loadJson(LS_KEYS.harvests, []);

  // group by batchId
  const byBatch = processes.reduce((acc, p) => {
    acc[p.batchId] = acc[p.batchId] || [];
    acc[p.batchId].push(p);
    return acc;
  }, {});

  if (batchList) {
    batchList.innerHTML = '';
    Object.keys(byBatch).sort().forEach((batchId) => {
      const steps = byBatch[batchId];
      const li = document.createElement('div');
      li.className = 'list-item';
      const allCollectionIds = harvests.map(h=>h.sampleId); // demo linkage
      li.innerHTML = `<div><strong>${batchId}</strong><div class="list-meta">Collections: ${allCollectionIds.join(', ') || '—'}</div></div><div>${steps.length} steps</div>`;
      batchList.appendChild(li);
    });
  }

  if (labList) {
    labList.innerHTML = '';
    const labResults = loadJson(LS_KEYS.labResults, []);
    const knownBatches = Object.keys(byBatch);
    knownBatches.forEach((batchId) => {
      const lr = labResults.find(x => x.batchId === batchId) || simulateLabFor(batchId);
      const row = document.createElement('div');
      row.className = 'list-item';
      const badgeClass = lr.status === 'PASS' ? 'ok' : (lr.status === 'PENDING' ? 'warn' : 'fail');
      row.innerHTML = `<div><strong>${batchId}</strong><div class="list-meta">${lr.panel} · ${new Date(lr.timestamp).toLocaleDateString()}</div></div><div class="badge ${badgeClass}">${lr.status}</div>`;
      labList.appendChild(row);
    });
  }
}

function simulateLabFor(batchId) {
  const status = batchId.toUpperCase() === 'BATCH123' ? 'PASS' : 'PENDING';
  return { batchId, panel: 'HeavyMetals+Microbial', status, timestamp: Date.now() };
}

// Offline queue
function enqueueOffline(item) {
  const q = loadJson(LS_KEYS.offlineQueue, []);
  q.push(item);
  saveJson(LS_KEYS.offlineQueue, q);
}

async function processQueue() {
  const q = loadJson(LS_KEYS.offlineQueue, []);
  if (!q.length) return;
  const remaining = [];
  for (const item of q) {
    try {
      // simulate network commit
      await new Promise(res => setTimeout(res, 300));
      if (item.type === 'harvest') {
        const list = loadJson(LS_KEYS.harvests, []);
        const idx = list.findIndex(h => h.sampleId === item.payload.sampleId);
        if (idx >= 0) list[idx].synced = true; else list.push({ ...item.payload, synced: true });
        saveJson(LS_KEYS.harvests, list);
      } else if (item.type === 'process') {
        const list = loadJson(LS_KEYS.processes, []);
        list.push(item.payload);
        saveJson(LS_KEYS.processes, list);
      }
    } catch (e) {
      remaining.push(item);
    }
  }
  saveJson(LS_KEYS.offlineQueue, remaining);
}

window.addEventListener('online', () => { processQueue().then(() => { renderHarvests(); renderCompliance(); renderBatchesAndLabs(); }); });

// Handlers
function handleHarvestSubmit(e) {
  e.preventDefault();
  const species = document.getElementById('harvest-species')?.value?.trim() || '';
  const quantityKg = parseFloat(document.getElementById('harvest-qty')?.value || '0');
  const lat = parseFloat(document.getElementById('harvest-lat')?.value || '0');
  const lng = parseFloat(document.getElementById('harvest-lng')?.value || '0');
  const fileInput = document.getElementById('harvest-photo');
  const sampleId = generateId('SAMPLE');
  const timestamp = Date.now();

  const record = { sampleId, species, quantityKg, lat, lng, timestamp, photoDataUrl: null, synced: navigator.onLine };

  function finalizeSave() {
    const list = loadJson(LS_KEYS.harvests, []);
    list.push(record);
    saveJson(LS_KEYS.harvests, list);
    if (!navigator.onLine) enqueueOffline({ type: 'harvest', payload: record });
    renderHarvests();
    renderCompliance();
    const status = document.getElementById('harvest-status');
    if (status) {
      const ok1 = checkGeofence(lat, lng);
      const ok2 = checkSeason(species, new Date(timestamp));
      status.innerHTML = '';
      const b1 = document.createElement('span'); b1.className = `badge ${ok1 ? 'ok' : 'fail'}`; b1.textContent = ok1 ? 'Geo-fence PASS' : 'Geo-fence FAIL';
      const b2 = document.createElement('span'); b2.className = `badge ${ok2 ? 'ok' : 'warn'}`; b2.textContent = ok2 ? 'Seasonal OK' : 'Out-of-season';
      status.append(b1, b2);
    }
    e.target.reset();
  }

  const file = fileInput && fileInput.files && fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => { record.photoDataUrl = reader.result; finalizeSave(); };
    reader.onerror = () => { finalizeSave(); };
    reader.readAsDataURL(file);
  } else {
    finalizeSave();
  }
}

function handleProcessSubmit(e) {
  e.preventDefault();
  const batchIdRaw = document.getElementById('process-batch-id')?.value || '';
  const batchId = batchIdRaw.trim() || generateId('BATCH');
  const step = document.getElementById('process-step')?.value || 'drying';
  const notes = document.getElementById('process-notes')?.value?.trim() || '';
  const timestamp = Date.now();
  const entry = { id: generateId('STEP'), batchId, step, notes, timestamp, synced: navigator.onLine };
  if (navigator.onLine) {
    const list = loadJson(LS_KEYS.processes, []);
    list.push(entry);
    saveJson(LS_KEYS.processes, list);
  } else {
    enqueueOffline({ type: 'process', payload: entry });
  }
  renderBatchesAndLabs();
  e.target.reset();
}

// FHIR Bundle (simplified demo)
function buildFhirBundle(batchId) {
  const harvests = loadJson(LS_KEYS.harvests, []);
  const processes = loadJson(LS_KEYS.processes, []).filter(p => p.batchId.toUpperCase() === batchId.toUpperCase());
  const lab = simulateLabFor(batchId);

  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: []
  };

  harvests.forEach(h => {
    bundle.entry.push({
      resource: {
        resourceType: 'Observation',
        id: h.sampleId,
        status: 'final',
        code: { text: 'Herb collection event' },
        effectiveDateTime: new Date(h.timestamp).toISOString(),
        valueString: `${h.species} - ${h.quantityKg} kg`,
        component: [
          { code: { text: 'latitude' }, valueDecimal: h.lat },
          { code: { text: 'longitude' }, valueDecimal: h.lng }
        ]
      }
    });
  });

  processes.forEach(p => {
    bundle.entry.push({
      resource: {
        resourceType: 'Procedure',
        id: p.id,
        status: 'completed',
        code: { text: `Processing: ${p.step}` },
        performedDateTime: new Date(p.timestamp).toISOString(),
        note: [{ text: p.notes }]
      }
    });
  });

  bundle.entry.push({
    resource: {
      resourceType: 'DiagnosticReport',
      id: `LAB-${batchId}`,
      status: lab.status === 'PASS' ? 'final' : 'registered',
      code: { text: lab.panel },
      conclusion: lab.status
    }
  });

  return bundle;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}


// Simple auth
const AUTH_KEY = 'vedax.auth';
function getAuth() { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || '') || null; } catch { return null; } }
function setAuth(auth) { if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); else localStorage.removeItem(AUTH_KEY); }
function redirectForRole(role) {
  if (role === 'farmer') location.href = 'farmer.html';
  else if (role === 'collector') location.href = 'collector.html';
  else if (role === 'processor') location.href = 'processor.html';
  else location.href = 'consumer.html';
}
function requireRole(allowedRoles) {
  const auth = getAuth();
  if (!auth || (allowedRoles && !allowedRoles.includes(auth.role))) {
    location.href = 'login.html';
  }
}

function attachLogout() {
  const nav = document.getElementById('nav-links');
  if (!nav) return;
  const auth = getAuth();
  if (auth) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#'; a.textContent = 'Logout';
    a.addEventListener('click', (e) => { e.preventDefault(); setAuth(null); location.href = 'index.html#cards'; });
    li.appendChild(a);
    nav.appendChild(li);
  }
}

// Login/Signup handlers
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value || '';
  const role = document.getElementById('login-role')?.value;
  const err = document.getElementById('login-error');
  if (!email || !password || !role) { if (err) err.textContent = 'All fields are required.'; return; }
  setAuth({ email, role, ts: Date.now() });
  redirectForRole(role);
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name')?.value?.trim();
  const email = document.getElementById('signup-email')?.value?.trim();
  const password = document.getElementById('signup-password')?.value || '';
  const role = document.getElementById('signup-role')?.value;
  const err = document.getElementById('signup-error');
  if (!name || !email || !password || !role) { if (err) err.textContent = 'All fields are required.'; return; }
  // Simulate account creation
  setAuth({ email, role, ts: Date.now(), name });
  redirectForRole(role);
}


