THE VOID — HUNT 01 v1.1.7 THRUSTER FIX

Upload the contents of the included the-void-demo-main folder over the matching paths in your GitHub repository.

Changed files:
- hunt01/game.js
- hunt01/assets/map/hunt01-map.svg
- service-worker.js
- VERSION.txt

Fixes:
- Removed the two large rectangular collision blockers from inside the port and starboard thruster chambers.
- Removed their matching visual machinery rectangles from the SVG map.
- Thruster chamber floors and kill zones are now fully traversable.
- Camera frames the complete port or starboard chamber while Luna is inside it.
- Added safe camera look-room near world edges so the starboard side no longer cuts off on wide iPad screens.
- Offline cache bumped to v1.2.7.
