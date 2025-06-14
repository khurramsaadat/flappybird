# Progress Log

## 2025-06-03
- Removed unused game-over.png and replaced with animated GAME OVER text (Press Start 2P font, yellow, pulsing, centered).
- Further reduced font size for Score and Best overlays.
- Ensured all overlays and prompts use Press Start 2P font and consistent animation.
- Addressed all reported bugs: double jump, pipe spacing, event handling, and overlay logic.
- Updated Playwright tests and data-testid attributes for overlays.
- Documented all changes and followed best practices per Khurram's rules.
- Persistent Next.js React Client Manifest server errors noted (see terminal logs).
- All changes committed and ready for push.
- Removed double-tap-to-restart logic from mobile touch handler. Now only 'Tap to restart' is supported on overlays; double tap during gameplay no longer ends the game. (UX and bugfix improvement)
- Removed gameOverImg reference and loading (cleanup, fixes 404 error for /images/game-over.png).
- Increased pipe speed to 6.0 after score reaches 40 (game difficulty scaling).
- Reduced all game sound volumes by 50% (volume set to 0.25 for all sounds).
- Removed unused variables 'lastTap' and 'setLastTap' to fix TypeScript lint error.
- Ensured 'TAP TO RESTART' takes user to home screen overlay (not directly into game).
- Fixed event bubbling on 'TAP TO RESTART' so it always returns to home overlay and does not immediately start the game. Used stopPropagation on overlay handlers.

## 2025-06-03
- User requested: Idle bird should float smoothly in a sine wave, looping every 5 seconds, with no pause between loops. Animation speed and amplitude should scale with screen size. Minimum pipe gap on mobile should be bird height x 6 for both horizontal and vertical gaps. Add comments for easy tweaking.
- User confirmed all clarifications and requested to proceed.
- Implemented a smooth, looping idle bird animation (sine wave, 5s loop, amplitude scales with bird size).
- Enforced minimum pipe gap (bird height x 6) for both horizontal and vertical gaps on mobile devices for better playability.
- Added clear comments in code for easy tweaking of these values.
- Checked and resolved all Problems tab and terminal issues before and after changes. 