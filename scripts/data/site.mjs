// Identità, contatti, dati legali e fiducia.
// null = dato sconosciuto: il componente che lo usa viene nascosto, mai inventato.
// In produzione (SITE_ENV=production) il build si ferma se mancano cin, email, phone, legal.controllerName.

export const SITE = {
  origin: 'https://www.casaincampagnatrave.it', // DA CONFERMARE: dominio definitivo
  name: 'Casa in Campagna',                      // DA CONFERMARE: stesso nome dell'annuncio Booking
  alternateName: 'Casa in Campagna Trave',
  address: {
    street: 'Contrada Trave 125',
    frazione: 'Montacuto',
    zip: '60129',
    city: 'Ancona',
    province: 'AN',
    region: 'Marche',
    country: 'IT',
    display: 'Contrada Trave 125, Montacuto, 60129 Ancona (AN)', // unica stringa NAP, usata ovunque
    short: 'Contrada Trave 125, Montacuto (AN)',
  },
  maps: 'https://www.google.com/maps/dir/?api=1&destination=Contrada+Trave+125,+60129+Montacuto+AN',
  geo: null,          // { lat: 43.xxxxx, lng: 13.xxxxx } dal pin del cancello
  phone: null,        // { display: '+39 ...', e164: '+39...' }
  whatsapp: null,     // solo cifre, es. '39333...'
  email: null,
  cin: null,          // BLOCCANTE per il lancio (art. 13-ter DL 145/2023)
  cir: null,
  formEndpoint: null, // es. URL Formspree / Web3Forms / Cloudflare Pages Function
  responseTime: null, // { it: 'poche ore', en: 'a few hours' }
  bookingUrl: null,   // { it, en } solo dopo aver verificato che il link funziona
  host: { name: null, photo: null, bio: { it: null, en: null }, ownerRun: null },
  legal: { controllerName: null, controllerAddress: null, controllerEmail: null, formProvider: null, retention: null },
  trust: {
    showLocationScore: false, // richiede ok del cliente, link e data di rilevazione
    locationScore: { value: '8,7', valueEn: '8.7', source: 'Booking.com', url: null, checkedOn: null },
  },
  promo: { code: null, benefit: { it: null, en: null }, terms: { it: null, en: null } },
  perks: [ // tutti disattivati finché il proprietario non li conferma
    { key: 'welcome', enabled: false, text: { it: null, en: null } },
    { key: 'flexTime', enabled: false, text: { it: null, en: null } },
  ],
  reviews: [],                         // { author, month, text: { it, en }, source, url, consent: true }
  reviewsMethod: { it: null, en: null }, // nota Omnibus, obbligatoria prima di mostrare recensioni
  hostTips: { it: [], en: [] },
  facts: {
    sizeM2: 110, maxGuests: 6, bedrooms: 2, bathrooms: 2,
    checkin: '15:00', checkout: '10:00',
  },
};

// Segnaposto mostrati SOLO nell'anteprima (SHOW_PLACEHOLDERS=1), mai in produzione.
export const PREVIEW_PLACEHOLDERS = {
  phone: { display: '+39 000 000 0000', e164: '+390000000000' },
  whatsapp: '390000000000',
  email: 'info@casaincampagnatrave.it',
};
