HUNT 01 — LUNA WALKING/GROUNDING FIX

Replace these files in the repository:
  hunt01/game.js
  service-worker.js

Changes:
- Removes the malformed undersized left-walk frame from the animation sequence.
- Advances walk animation using real distance travelled, preventing sliding at walls.
- Uses a stable floor anchor and contact shadow so Luna remains planted on the deck.
- Updates the offline cache version to the-void-demo-v1.2.11.
