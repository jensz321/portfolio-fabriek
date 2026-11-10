# De Fabriek — een speelbaar portfolio

Rijd met een heftruck door mijn portfolio. Elke hal in de fabriek is een stukje van mij:
over mij, mijn route tot nu toe, stage bij Raket, PadPlanner, Wie rijdt er? en meer.

Geïnspireerd door de portfolio van [Bruno Simon](https://bruno-simon.com).
De gewone versie van mijn portfolio staat op [jens.vanduinkerken.net](https://jens.vanduinkerken.net).

## Besturing

| Toets | Actie |
|---|---|
| W A S D / pijltjes | rijden |
| R | terug naar de poort |
| M | geluid aan/uit |

Op een telefoon rijd je met de joystick linksonder.

## Techniek

- [React Three Fiber](https://r3f.docs.pmnd.rs) + [drei](https://drei.docs.pmnd.rs) voor de 3D-wereld
- [Rapier](https://rapier.rs) voor de physics (heftruck, dozen, lopende banden)
- Geluid volledig gesynthetiseerd met de Web Audio API, zonder geluidsbestanden
- Vite + TypeScript

```bash
npm install
npm run dev
```

Handige parameters tijdens ontwikkelen: `?perf` (fps en render-statistieken), `?debug` (physics-vormen).

## Waar staat wat

- `src/content.ts`: alle tekst van de site
- `src/layout.ts`: de plattegrond (posities van de hallen)
- `src/world/`: de 3D-wereld; `life/` bevat alles wat beweegt
- `src/audio/`: het geluid
- `src/lottery.ts`: dezelfde loting als de Wie rijdt er?-app

## Credits

3D-modellen: [Factory Kit](https://kenney.nl/assets/factory-kit) en [Car Kit](https://kenney.nl/assets/car-kit) van Kenney, CC0.
