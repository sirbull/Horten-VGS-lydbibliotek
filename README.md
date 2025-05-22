Horten VGS Lydbibliotek

Et lokalt skrivebordsprogram utviklet for elever og ansatte ved Medier og kommunikasjon, IKT og medieproduksjon og Medieproduksjon på Horten VGS.
Applikasjonen gjør det enkelt å navigere og søke i tusenvis av lokale lydfiler (lydeffekter og musikk), forhåndslytte, og lagre utvalgte filer til prosjektmapper.

Funksjoner:

- Søkefunksjon med live-filtrering
- Avspilling av én lydfil om gangen
- Visualisering av lyden med spillerhode
- Mapper vises strukturert med kollaps-funksjon
- Lagre-knapp for å velge hvor filen skal kopieres
- Tilfeldig bakgrunnsbilde hver gang appen åpnes
- Glassmorphism-design og (noe) responsiv layout
- Tastatursnarveier (valgfritt)
- Kjører lokalt – ingen nettforbindelse kreves

Teknologier brukt:
HTML, CSS, JavaScript (File System Access API)
Electron
Material Icons (Google)
Web Audio API

Installasjon og kjøring:
- Klon repoet
- Kjør
  npm install
  npm start

Bygg som app (macOS):
  npm run build
    Dette genererer .dmg og .app i dist/.

Bygging for Windows krever Windows-maskin eller CI/CD (se nedenfor)

Bygg for Windows:
  For å bygge .exe:
    Flytt prosjektet til en Windows-PC med Node.js
Installer og bygg med:
  npm install
  npm run build

Alternativt: Sett opp GitHub Actions for kryssbygging

Mappestruktur:

lydbibliotek/
├── index.html
├── main.js
├── preload.js
├── css/
│   └── style.css
├── js/
│   └── script.js
├── backgrounds/
│   └── bg1.jpg ... bg9.jpg
├── assets/
│   └── logo.svg
├── build/
│   └── icon.icns / icon.ico
├── package.json

