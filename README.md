# The Void — Demo v1.0.4 Offline iPad PWA

A cinematic solo science-fiction survival demo by **James Ritchie**. This build is ready for GitHub Pages and can be installed from Safari as an offline iPad web app.

## Stability repair in v1.0.4

- Play launches before the large offline archive begins caching
- Background cache work pauses during mission startup
- Updates reuse existing cached artwork and audio wherever possible
- Stalled media cannot trap the opening transition
- Installed copies automatically refresh onto the new service worker
- Ground Control transmissions retain the black terminal typing presentation

## Included in this build

- Complete playable demo through the current post-clone Control Room finale
- Local title, gameplay and credits audio under `assets/audio/`
- Cinematic **DEMO COMPLETE** ending with Return to Title and View Credits
- Curved, eased Luna-token travel with route trace, glow and arrival animation
- Progressive Web App manifest, iPad icons and offline service worker
- Browser save migration from v0.9.9

## Publish on GitHub Pages

1. Upload every file and folder in this repository to the repository root.
2. In GitHub, open **Settings → Pages**.
3. Deploy from the `main` branch and `/(root)`.
4. Wait for the HTTPS GitHub Pages address to become available.

## Install on iPad

1. Open the published game in **Safari** while online.
2. Leave the page open until the banner reports **OFFLINE DEMO READY // ADD TO HOME SCREEN**.
3. Tap **Share → Add to Home Screen**.
4. Launch the new Home Screen icon once while still online.
5. Test in Airplane Mode.

## Debris Field mini-game

The title menu now includes **The Void: Debris Field Mini-game**. Its files live in `debris-field/` and its transparent gameplay assets are `assets/IMGA1.png` through `assets/IMGA4.png`. The results screen returns to the main title.
