// Tariffe. Nomi e periodi delle stagioni sono una PROPOSTA da confermare con il proprietario:
// finché confirmed è false, in produzione la tabella non viene mostrata (compare il blocco "preventivo su misura").
// nightly/weekly in euro per la casa intera; null = "Su richiesta". Mai 0.
// periods: coppie ['MM-GG', 'MM-GG'] incluse; possono scavalcare l'anno. Le stagioni special vincono sulle sovrapposizioni.

export const RATES = {
  currency: 'EUR',
  validYear: null,     // es. 2027, serve per validFrom/validThrough nello schema
  priceBasis: 'house', // prezzo per la casa intera fino a maxGuests (DA CONFERMARE)
  maxGuests: 6,
  lastUpdated: null,   // 'AAAA-MM-GG'
  minStayRule: 'arrival', // 'arrival' | 'max'
  seasons: [
    { id: 'low', name: { it: 'Bassa stagione', en: 'Low season' }, periods: [['01-07', '03-31'], ['11-01', '12-20']], nightly: null, weekly: null, minNights: null, changeoverDay: null, special: false, confirmed: false },
    { id: 'shoulder', name: { it: 'Primavera e autunno', en: 'Spring and autumn' }, periods: [['04-01', '05-31'], ['10-01', '10-31']], nightly: null, weekly: null, minNights: null, changeoverDay: null, special: false, confirmed: false },
    { id: 'mid', name: { it: 'Media stagione', en: 'Mid season' }, periods: [['06-01', '06-30'], ['09-01', '09-30']], nightly: null, weekly: null, minNights: null, changeoverDay: null, special: false, confirmed: false },
    { id: 'high', name: { it: 'Alta stagione', en: 'High season' }, periods: [['07-01', '08-08'], ['08-24', '08-31']], nightly: null, weekly: null, minNights: null, changeoverDay: null, special: false, confirmed: false },
    { id: 'peak', name: { it: 'Ferragosto', en: 'Ferragosto (mid August)' }, periods: [['08-09', '08-23']], nightly: null, weekly: null, minNights: null, changeoverDay: null, special: true, confirmed: false },
    { id: 'holidays', name: { it: 'Festività natalizie', en: 'Christmas and New Year' }, periods: [['12-21', '01-06']], nightly: null, weekly: null, minNights: null, changeoverDay: null, special: true, confirmed: false },
  ],
  // Voci dall'annuncio Booking della struttura: confirmed true. Le altre restano nascoste finché non confermate.
  included: [
    { key: 'linens', confirmed: true, label: { it: 'Lenzuola e asciugamani', en: 'Bed linen and towels' } },
    { key: 'wifi', confirmed: true, label: { it: 'Wi-Fi in tutta la casa', en: 'Wi-Fi throughout the house' } },
    { key: 'ac', confirmed: true, label: { it: 'Aria condizionata e riscaldamento', en: 'Air conditioning and heating' } },
    { key: 'parking', confirmed: true, label: { it: 'Parcheggio privato con sbarra', en: 'Gated private parking' } },
    { key: 'petsFree', confirmed: true, label: { it: 'Animali senza supplemento', en: 'Pets at no extra charge' } },
    { key: 'courtesy', confirmed: true, label: { it: 'Set di cortesia e asciugacapelli', en: 'Toiletries and hairdryer' } },
    { key: 'firewood', confirmed: false, label: { it: 'Legna per il camino', en: 'Firewood for the fireplace' } },
    { key: 'utilities', confirmed: false, label: { it: 'Consumi inclusi', en: 'Utilities included' } },
  ],
  extras: [
    { key: 'cleaning', label: { it: 'Pulizia finale', en: 'Final cleaning' }, amount: null, per: 'stay', mandatory: null },
  ],
  touristTax: {
    applies: true, amountPerPersonNight: null, maxNights: null, exemptUnderAge: null,
    sourceUrl: 'https://anconaentrate.iswebcloud.it/pagina22253_imposta-di-soggiorno.html',
  },
  terms: { deposit: null, balance: null, securityDeposit: null, cancellation: null, paymentMethods: null },
};
