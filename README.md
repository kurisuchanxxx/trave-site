# Casa in Campagna Trave, sito web

Sito vetrina bilingue (IT/EN) per la casa vacanze "Casa in Campagna" in Contrada Trave 125, Montacuto (Ancona).
Obiettivo: portare prenotazioni dirette (modulo, WhatsApp, telefono) con una tariffa più bassa di Booking.

## Struttura

```
index.html        pagina italiana (una sola pagina, sezioni ancorate)
en/index.html     pagina inglese
css/style.css     stile
js/main.js        menu mobile, barra disponibilità, invio modulo, lightbox
images/           foto rinominate con nomi SEO, in WebP + JPG, con miniature -640
sitemap.xml, robots.txt, favicon.svg, netlify.toml
Casa in campagna montacuto/   foto originali da Booking (non usate dal sito)
```

Nessun build step: è HTML statico, si può pubblicare su Netlify, Vercel, Cloudflare Pages o GitHub Pages.

## Anteprima locale

```
npx serve .
```

## Da completare prima del lancio

- [ ] Dominio: sostituire `https://www.casaincampagnatrave.it` in `index.html`, `en/index.html`, `sitemap.xml`, `robots.txt` con quello reale
- [ ] Telefono: sostituire `+39 000 000 0000` e `390000000000` (link WhatsApp e tel) in entrambe le pagine
- [ ] Email: sostituire `info@casaincampagnatrave.it` in entrambe le pagine
- [ ] Coordinate GPS nel JSON-LD (`geo`): verificare su Google Maps, ora sono approssimative
- [ ] CIN (Codice Identificativo Nazionale) nel footer: obbligatorio per legge
- [ ] Confermare con il cliente che le camere sono 2 (Booking dice 1, le foto mostrano 2)
- [ ] Pagina privacy e cookie (ora i link puntano a `#privacy`)
- [ ] Modulo: su Netlify funziona da solo (Netlify Forms, `data-netlify="true"`); su altri hosting usare Formspree o simile cambiando `action`. Se l'invio fallisce il JS apre il client email come fallback
- [ ] Google Analytics o simile e Search Console; il JS invia già l'evento `generate_lead` se `gtag` è presente
- [ ] Foto: quelle attuali vengono da Booking (bassa risoluzione, alcune invernali). Chiedere al cliente foto estive dell'esterno, del giardino e del mare a risoluzione piena

## Scelte SEO

- Un H1 per pagina, title e description scritti a mano, keyword: casa vacanze Trave, Conero, Mezzavalle, Portonovo, Montacuto, Ancona
- `hreflang` IT/EN e canonical
- JSON-LD `VacationRental` (con indirizzo, occupancy, amenity, orari) e `FAQPage`
- Immagini con nomi descrittivi, `alt` completi, WebP con fallback JPG, lazy loading, sitemap immagini
- CTA "prenota direttamente" ripetuta: hero, barra disponibilità, sezione dedicata, footer mobile fisso
