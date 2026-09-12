# SHARP

A personal, mobile-first cognitive training app covering 18 domains.

[Open SHARP](https://ryantigrine-cloud.github.io/Sharp/gpt-sharp/final.html)

- **Focused Daily:** six weak or neglected domains, targeting ten active minutes and finishing at a block boundary.
- **Quick:** six varied short blocks.
- **Full Daily:** all 18 domains, a weakness bonus, and scheduled delayed recall.
- **Games:** individual practice without changing saved progression.

Progress is browser-local. Use **Performance → Export progress** for backup or transfer. The September 2026 release preserves previous scores as a separate series while correcting question and scoring logic. SHARP scores are personal training signals, not IQ or clinical assessments.

## Development

Use Node.js 24 or later:

```sh
npm ci --ignore-scripts
npm run test:static
npm test
npx playwright install --with-deps chromium webkit
npm run test:browser
```

Production entry: `gpt-sharp/final.html`. The versioned implementation is in `gpt-sharp/releases/20260912/`.

[Release architecture, storage contract and deployment procedure](docs/SHARP-20260912.md)

[Audit finding implementation map](docs/SHARP-audit-closure.md)

The validation workflow must pass for the exact release commit before production is switched. Required-check enforcement in repository settings and physical iPhone/VoiceOver validation are recorded separately from the automated test results.
