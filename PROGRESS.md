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

## 2025-06-03
- User requested: Idle bird should float smoothly in a sine wave, looping every 5 seconds, with no pause between loops. Animation speed and amplitude should scale with screen size. Minimum pipe gap on mobile should be bird height x 6 for both horizontal and vertical gaps. Add comments for easy tweaking.
- User confirmed all clarifications and requested to proceed.
- Implemented a smooth, looping idle bird animation (sine wave, 5s loop, amplitude scales with bird size).
- Enforced minimum pipe gap (bird height x 6) for both horizontal and vertical gaps on mobile devices for better playability.
- Added clear comments in code for easy tweaking of these values.
- Checked and resolved all Problems tab and terminal issues before and after changes. 