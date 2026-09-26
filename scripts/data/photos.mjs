// Manifest delle foto. Le foto arrivano da Booking (max 1024px): ogni immagine ha un limite di
// visualizzazione (maxW) per non mostrarla mai troppo ingrandita.
// role: hero | plate | band | narrow | detail | thumb    room: filtro della galleria

export const ROLE_CAP = { hero: 576, plate: 880, band: 1024, narrow: 300, detail: 480, thumb: 360 };

export const PHOTOS = [
  { key: 'tramonto-giardino', w: 576, h: 768, role: 'hero', room: 'esterni', focal: '50% 30%', veil: 0.55,
    alt: { it: 'Il giardino al tramonto con il Monte Conero sullo sfondo', en: 'The garden at sunset with Monte Conero behind' },
    caption: { it: 'Il giardino al tramonto', en: 'The garden at sunset' } },
  { key: 'vista-dalla-finestra', w: 576, h: 768, role: 'hero', room: 'camere', focal: '50% 0%', veil: 0.65,
    alt: { it: 'Il Monte Conero e le palme del giardino visti dalla finestra', en: 'Monte Conero and the garden palms seen from the window' },
    caption: { it: 'Il Conero dalla finestra', en: 'The Conero from the window' } },
  { key: 'giardino-palma-mare', w: 578, h: 768, role: 'hero', room: 'esterni', focal: '50% 25%', veil: 0.65,
    alt: { it: 'Il giardino recintato con la palma e uno scorcio di mare', en: 'The fenced garden with the palm and a glimpse of the sea' },
    caption: { it: 'Il giardino e lo scorcio di mare', en: 'The garden and a glimpse of the sea' } },
  { key: 'casa-esterno-cortile', w: 1024, h: 768, role: 'hero', room: 'esterni', focal: '85% 50%', veil: 0.55,
    alt: { it: 'Il cortile e l\'ingresso della casa al Trave', en: 'The courtyard and entrance of the house at Trave' },
    caption: { it: 'Il cortile e l\'ingresso', en: 'The courtyard and entrance' } },
  { key: 'camera-matrimoniale', w: 1024, h: 768, role: 'hero', room: 'camere', focal: '50% 20%', veil: 0.7,
    alt: { it: 'La camera matrimoniale con travi a vista e aria condizionata', en: 'The double bedroom with exposed beams and air conditioning' },
    caption: { it: 'La camera matrimoniale', en: 'The double bedroom' } },
  { key: 'soggiorno-travi', w: 576, h: 704, role: 'hero', room: 'interni', focal: '50% 40%', veil: 0.7,
    alt: { it: 'Il soggiorno con travi a vista, tavolo da pranzo e scala', en: 'The living room with exposed beams, dining table and staircase' },
    caption: { it: 'Il soggiorno', en: 'The living room' } },
  { key: 'giardino-vista-conero', w: 578, h: 768, role: 'plate', room: 'esterni', focal: '50% 35%',
    alt: { it: 'Il prato del giardino con il Monte Conero dietro gli alberi', en: 'The garden lawn with Monte Conero behind the trees' },
    caption: { it: 'Il Conero dal giardino', en: 'The Conero from the garden' } },
  { key: 'soggiorno-camino', w: 576, h: 704, role: 'plate', room: 'interni', focal: '50% 45%',
    alt: { it: 'Il soggiorno con camino, divani e tavolo da pranzo', en: 'The living room with fireplace, sofas and dining table' },
    caption: { it: 'Il soggiorno con camino', en: 'The living room with fireplace' } },
  { key: 'camera-doppia', w: 578, h: 704, role: 'plate', room: 'camere', focal: '50% 40%',
    alt: { it: 'La camera con due letti singoli', en: 'The twin bedroom with two single beds' },
    caption: { it: 'La camera con due letti', en: 'The twin bedroom' } },
  { key: 'cucina', w: 576, h: 704, role: 'plate', room: 'interni', focal: '50% 50%', cap: 440,
    alt: { it: 'La cucina abitabile con tavolo, forno e frigorifero', en: 'The eat-in kitchen with table, oven and fridge' },
    caption: { it: 'La cucina abitabile', en: 'The eat-in kitchen' } },
  { key: 'camera-matrimoniale-armadio', w: 1024, h: 768, role: 'thumb', room: 'camere', focal: '50% 50%',
    alt: { it: 'La camera matrimoniale con l\'armadio in legno', en: 'The double bedroom with the wooden wardrobe' },
    caption: { it: 'L\'armadio della camera matrimoniale', en: 'The double bedroom wardrobe' } },
  { key: 'camera-doppia-armadio', w: 578, h: 704, role: 'thumb', room: 'camere', focal: '50% 50%',
    alt: { it: 'La camera con due letti singoli e l\'armadio', en: 'The twin bedroom with its wardrobe' },
    caption: { it: 'La camera con due letti', en: 'The twin bedroom' } },
  { key: 'bagno-vasca', w: 346, h: 704, role: 'narrow', room: 'bagni', focal: '50% 50%',
    alt: { it: 'Il bagno con vasca e lavatrice', en: 'The bathroom with bathtub and washing machine' },
    caption: { it: 'Il bagno con vasca', en: 'The bathroom with bathtub' } },
  { key: 'bagno-doccia', w: 346, h: 704, role: 'narrow', room: 'bagni', focal: '50% 50%',
    alt: { it: 'Il bagno con doccia', en: 'The bathroom with shower' },
    caption: { it: 'Il bagno con doccia', en: 'The bathroom with shower' } },
  { key: 'bagno-secondo', w: 346, h: 704, role: 'narrow', room: 'bagni', focal: '50% 50%',
    alt: { it: 'Il secondo bagno con lavabo e sanitari', en: 'The second bathroom' },
    caption: { it: 'Il secondo bagno', en: 'The second bathroom' } },
  { key: 'spiaggia-mezzavalle-conero', w: 1024, h: 403, role: 'band', room: 'dintorni', focal: '50% 50%', veil: 0.6,
    alt: { it: 'La spiaggia di Mezzavalle sotto il Monte Conero', en: 'Mezzavalle beach below Monte Conero' },
    caption: { it: 'La spiaggia di Mezzavalle e il Monte Conero', en: 'Mezzavalle beach and Monte Conero' } },
  { key: 'parcheggio-privato', w: 1024, h: 403, role: 'detail', room: 'esterni', focal: '50% 50%',
    alt: { it: 'L\'ingresso con la sbarra del parcheggio privato', en: 'The entrance with the gate of the private parking' },
    caption: { it: 'Il parcheggio privato con sbarra', en: 'The gated private parking' } },
];

export const PHOTO = Object.fromEntries(PHOTOS.map((p, i) => [p.key, { ...p, tav: i + 1 }]));

export const maxW = p => Math.min(p.cap || ROLE_CAP[p.role], Math.round(p.w * 1.1));

export const HERO_SLIDES = ['tramonto-giardino', 'vista-dalla-finestra', 'giardino-palma-mare', 'casa-esterno-cortile', 'camera-matrimoniale', 'soggiorno-travi'];
