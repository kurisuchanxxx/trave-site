# Casa in Campagna Trave, sito web

Sito bilingue (IT/EN) per la casa vacanze "Casa in Campagna" in Contrada Trave 125, Montacuto (Ancona).
Obiettivo: portare prenotazioni dirette (modulo, WhatsApp, telefono) con una tariffa più bassa di Booking.

Anteprima: https://kurisuchanxxx.github.io/trave-site/ (si aggiorna a ogni merge su `main`).

## Pagine

| Pagina | IT | EN |
|---|---|---|
| Home | `/` | `/en/` |
| La casa | `/la-casa/` | `/en/the-house/` |
| Galleria | `/galleria/` | `/en/gallery/` |
| Dintorni | `/dintorni/` | `/en/surroundings/` |
| Prezzi e prenotazione | `/prezzi/` | `/en/rates/` |
| Contatti | `/contatti/` | `/en/contact/` |

## Come si modifica

Le pagine HTML sono **generate**: testi, contatti, foto e struttura stanno in `scripts/build.mjs`.
Dopo ogni modifica:

```
node scripts/build.mjs
```

Il comando riscrive tutti gli `index.html` e `sitemap.xml`. Non modificare a mano gli HTML generati, le modifiche verrebbero perse al build successivo. Nessuna dipendenza da installare, basta Node 18+.

```
css/style.css     stile
js/main.js        header, menu mobile, slideshow, modulo, lightbox
images/           foto ottimizzate (WebP + JPG + miniature -640)
scripts/build.mjs generatore delle pagine
Casa in campagna montacuto/   foto originali da Booking (non usate dal sito)
```

Anteprima locale: `npx serve .`

## Da completare prima del lancio

In `scripts/build.mjs`, oggetto `C` in cima al file:

- [ ] `SITE`: dominio reale (ora `https://www.casaincampagnatrave.it`), anche in `robots.txt`
- [ ] telefono (`phone`, `tel`, `wa`) ed email
- [ ] `cin`: Codice Identificativo Nazionale, obbligatorio
- [ ] `lat`/`lng`: coordinate esatte da Google Maps

Da confermare con il cliente:

- [ ] Numero di camere (Booking dice 1, le foto ne mostrano 2)
- [ ] Stagioni e date nella pagina Prezzi (ora sono un esempio: bassa ottobre-maggio, media giugno e settembre, alta luglio e agosto, Ferragosto) e se mostrare i prezzi o lasciare "su richiesta"
- [ ] Eventuale sconto o codice promo per chi prenota diretto (come il "PROMO2026" del Rustico del Conero)
- [ ] Foto in alta risoluzione: quelle attuali vengono da Booking (max 1024px, alcune invernali)
- [ ] Pagine privacy e cookie

Tecnico:

- [ ] Modulo: funziona su Netlify (Netlify Forms). Su GitHub Pages l'invio fallisce e il JS apre il client email con i dati come ripiego
- [ ] Google Analytics e Search Console; il JS invia l'evento `generate_lead` se `gtag` è presente

## Scelte SEO

- URL leggibili per lingua, `hreflang` IT/EN e canonical su ogni pagina
- Un H1 per pagina, title e description scritti per pagina
- JSON-LD: `VacationRental` in home, `FAQPage` nella pagina Prezzi, `BreadcrumbList` nelle pagine interne
- Immagini con nomi descrittivi, `alt` in entrambe le lingue, WebP, lazy loading
- CTA "prenota direttamente" in ogni pagina e barra fissa su mobile
