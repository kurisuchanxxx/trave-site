# Casa in Campagna, sito web

Sito bilingue (IT/EN) della casa vacanze "Casa in Campagna", Contrada Trave 125, Montacuto (Ancona).
Obiettivo: far prenotare direttamente dal sito (modulo, WhatsApp, telefono), con un'esperienza che ispiri più fiducia di un portale.

Anteprima: https://kurisuchanxxx.github.io/trave-site/ (noindex, si aggiorna a ogni merge su `main`).

## Come funziona

Sito statico generato da `scripts/build.mjs` (Node 20+, nessuna dipendenza). Il build scrive tutto in `dist/`, che non è nel repository: GitHub Actions lo genera e pubblica solo quella cartella.

```
node scripts/build.mjs                          anteprima (noindex)
SHOW_PLACEHOLDERS=1 node scripts/build.mjs      anteprima con contatti segnaposto e stagioni indicative (è quella online)
SITE_ENV=production node scripts/build.mjs      produzione: si ferma se mancano CIN, telefono, email, titolare privacy
npx serve dist                                  vedere il risultato in locale
```

| Cartella | Contenuto |
|---|---|
| `scripts/data/site.mjs` | identità, contatti, CIN, dati legali, promo, vantaggi diretti, recensioni |
| `scripts/data/rates.mjs` | stagioni, tariffe, cosa è incluso, imposta di soggiorno, condizioni |
| `scripts/data/photos.mjs` | foto: didascalie, alt IT/EN, ruolo e limite di ingrandimento |
| `scripts/data/places.mjs`, `amenities.mjs`, `faq.mjs` | distanze, servizi e regole, domande frequenti |
| `scripts/copy/it.mjs`, `en.mjs` | tutti i testi delle pagine |
| `css/`, `js/`, `fonts/`, `images/` | stile, comportamenti, font ospitati sul sito, foto ottimizzate |
| `scripts/make-derivatives.mjs` | da eseguire una volta sola: sfondi sfocati, immagini social, favicon (usa sharp, fuori dal repo) |

La struttura dei dati ricalca i documenti che serviranno in Sanity (site, photo, rates/season, place, amenity, faq) per il passaggio ad Astro + Sanity su Cloudflare.

Un campo `null` non viene mai inventato: il componente che lo usa sparisce. Il build segnala tutto ciò che manca.

## Regole dei contenuti

- Mai confronti di prezzo con Booking o Airbnb, mai "miglior prezzo" o "senza commissioni": il vantaggio della prenotazione diretta è implicito (contatto diretto, richieste su misura, nessun pagamento per chiedere).
- Niente fatti inventati: recensioni, voti, tempi di risposta, condizioni di cancellazione, promo e vantaggi compaiono solo quando il proprietario li conferma.
- Niente trattini lunghi nei testi: il build si ferma se ne trova uno.

## Da chiedere al proprietario

**Obbligatori per il lancio**
- CIN (Codice Identificativo Nazionale), obbligatorio su ogni annuncio, sito compreso
- telefono, WhatsApp, email
- nome e recapiti del titolare per l'informativa privacy, tempi di conservazione dei dati
- dominio definitivo

**Tariffe** (in `rates.mjs`)
- conferma o correzione delle stagioni proposte (bassa, primavera e autunno, media, alta, Ferragosto, festività natalizie) e dei periodi
- prezzo a notte per stagione (per la casa intera), eventuale prezzo settimanale, soggiorno minimo, giorno fisso di arrivo
- pulizia finale, legna per il camino, consumi
- caparra, saldo, metodi di pagamento, deposito cauzionale, cancellazione (pubblichiamo solo il testo del proprietario)
- importo dell'imposta di soggiorno applicato alla casa
- appena i prezzi ci sono, la pagina Prezzi mostra "da € X / notte", attiva lo stimatore del soggiorno e aggiunge lo schema Offer per Google

**Fiducia** (in `site.mjs`)
- tempo di risposta realistico ("di solito rispondiamo entro...")
- nome e foto dell'host, se vuole comparire
- eventuale vantaggio solo per chi prenota diretto (codice promo, benvenuto, orari flessibili)
- permesso di citare il voto 8,7 alla posizione su Booking, con link
- recensioni con consenso degli ospiti e nota su come vengono verificate (Omnibus)
- coordinate del cancello per la mappa
- servizio per il modulo (Formspree, Web3Forms o funzione Cloudflare): senza, il modulo apre l'app di posta

**Foto**: quelle attuali vengono da Booking (max 1024px). Il layout non le ingrandisce mai oltre la loro dimensione; con foto originali ad alta risoluzione il sito migliora subito.

## SEO tecnica

- URL per lingua, canonical e `hreflang` reciproci, `x-default`
- title e description scritti per pagina, un H1 per pagina, breadcrumb visibile
- JSON-LD: `WebSite`, `LodgingBusiness`, `House` (letti, ospiti, superficie), `WebPage`/`CollectionPage`/`ContactPage`, `BreadcrumbList`, `FAQPage` solo con risposte confermate, `Offer` solo con prezzi reali. Mai `VacationRental`, `AggregateRating`, recensioni o valori segnaposto
- immagini con `srcset`/`sizes`, WebP con JPG di riserva, preload dell'immagine principale, dimensioni esplicite
- font ospitati sul sito (niente richieste a Google), mappa caricata solo al clic
- sitemap con `lastmod`, hreflang e immagini; robots.txt; 404; manifest e icone
- anteprima su GitHub Pages con `noindex` scritto nell'HTML
