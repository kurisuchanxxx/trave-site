// Distanze dall'annuncio Booking (calcolate con OpenStreetMap). Portonovo: Booking indica il Lago Grande di Portonovo a 5,3 km.
// Le descrizioni sono fatti generali sui luoghi: da far rileggere all'agenzia.

export const PLACES = [
  { id: 'trave', name: { it: 'Scoglio del Trave', en: 'Scoglio del Trave' }, km: 0.6, approx: false,
    heading: { it: 'Scoglio del Trave a 600 m', en: 'Scoglio del Trave, 600 m away' },
    description: {
      it: 'La lunga scogliera naturale che dalla costa del Conero entra nel mare, tra Mezzavalle e Portonovo. È il punto più vicino alla casa.',
      en: 'The long natural reef that runs out into the sea from the Conero coast, between Mezzavalle and Portonovo. It is the closest point to the house.',
    } },
  { id: 'mezzavalle', name: { it: 'Spiaggia di Mezzavalle', en: 'Mezzavalle beach' }, km: 1.1, approx: false,
    heading: { it: 'Spiaggia di Mezzavalle a 1,1 km', en: 'Mezzavalle beach, 1.1 km away' },
    description: {
      it: 'Una lunga spiaggia libera ai piedi della falesia bianca del Monte Conero, raggiungibile a piedi dal sentiero.',
      en: 'A long free beach at the foot of the white cliffs of Monte Conero, reached on foot by a path.',
    } },
  { id: 'portonovo', name: { it: 'Portonovo', en: 'Portonovo' }, km: 5, approx: true,
    heading: { it: 'Portonovo a circa 5 km', en: 'Portonovo, about 5 km away' },
    description: {
      it: 'La baia sotto il Conero con la chiesa romanica di Santa Maria di Portonovo, la Torre De Bosis, il Fortino Napoleonico e i laghetti.',
      en: 'The bay below the Conero with the Romanesque church of Santa Maria di Portonovo, the De Bosis tower, the Napoleonic fort and the small lakes.',
    } },
  { id: 'ancona', name: { it: 'Stazione di Ancona', en: 'Ancona station' }, km: 6.6, approx: false,
    heading: { it: 'Ancona a 6,6 km', en: 'Ancona, 6.6 km away' },
    description: {
      it: 'Il capoluogo delle Marche: il porto, il Duomo di San Ciriaco e il Passetto. Dalla stazione passano i treni della linea adriatica.',
      en: 'The capital of the Marche: the harbour, the cathedral of San Ciriaco and the Passetto. Trains on the Adriatic line stop at the station.',
    } },
  { id: 'aeroporto', name: { it: 'Aeroporto di Ancona', en: 'Ancona airport' }, km: 19, approx: false, heading: null, description: null },
];
