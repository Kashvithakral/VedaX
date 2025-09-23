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
});


