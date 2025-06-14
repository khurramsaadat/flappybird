# CHANGELOG

## 2024-06-09
- Added `@playwright/test` to `devDependencies` in `package.json` for test support.
- Ran `npm install` to update dependencies.
- Staged, committed, and pushed changes to GitHub.
- Fixed ESLint error in `src/app/page.tsx` by correcting the `onClick` handler for the `<canvas>` element to use a direct ternary expression, resolving Netlify build failure.
- Replaced all <img> tags with Next.js <Image /> component for all images, including game assets, for better optimization and to resolve ESLint warnings.
- Removed unused GAME_GUIDE variable from page.tsx.
- Used useCallback for handleJump and updated useEffect dependencies accordingly.
- Refactored game over logic to use ref for instant state updates.
- Attempted to implement fade-in animation for game-over.png and sequential fade for scores/message (not yet working as intended).
- Removed debug overlays and alerts from draw function.
- Fallback 'Game Over!' red text and message still showing; further work needed to fully remove and unify custom UI.
- Updated PostCSS config to use `@tailwindcss/postcss` as the plugin for Tailwind v4 compatibility and Netlify build fix.
- Fixed PostCSS config: replaced '@tailwindcss/postcss' with 'tailwindcss' in postcss.config.mjs to resolve Netlify build error.
- Created `favicon.svg` (yellow circle with white 'f') and removed `favicon.ico`; ensured layout uses `favicon.svg` only.
- Fixed image aspect ratio warning for `Flappy-Bird-Logo.png` by setting both width and height and using `width: auto`.
- Made bird rotation smooth and natural using lerp interpolation, keeping max angle at 30 degrees.
- Cleaned up `public/` directory and code for production.
- Updated directory structure to reflect `favicon.svg` and removal of `favicon.ico`.
- Removed unused variables (`showScore`, `isGameOver`) and all related logic for code cleanliness and Netlify build success.
- Fixed linter errors by ensuring `ctx` is not null before use in the draw function.
- Updated useEffect dependency array for responsive canvas scaling to include both `height` and `width`.
- Attempted to implement idle bird floating animation before game start (not yet working, will revisit).
- Added pulsing animation to "TAP TO START" overlay.
- Best score now persists using localStorage.

## [2025-06-03]
### Changes
- Removed unused `public/images/game-over.png` (replaced with animated GAME OVER text).
- Animated two-line "GAME OVER" text using Press Start 2P font in yellow, centered and pulsing.
- Font improvements: further reduced font size for Score and Best, ensured all overlays use Press Start 2P.
- All overlays and prompts now use consistent font and animation.
- Bugfixes: addressed all reported issues, including double jump, pipe spacing, and event handling.
- Updated Playwright tests and data-testid attributes for overlays.
- Documented all changes and followed best practices per Khurram's rules.
- Noted persistent Next.js React Client Manifest server errors (see terminal logs for details).
- Removed double-tap-to-restart logic from mobile touch handler. Now only 'Tap to restart' is supported on overlays; double tap during gameplay no longer ends the game. (UX and bugfix improvement)
- Removed gameOverImg reference and loading (cleanup, fixes 404 error for /images/game-over.png).
- Increased pipe speed to 6.0 after score reaches 40 (game difficulty scaling).
- Reduced all game sound volumes by 50% (volume set to 0.25 for all sounds).
- Removed unused variables 'lastTap' and 'setLastTap' to fix TypeScript lint error.
- Ensured 'TAP TO RESTART' takes user to home screen overlay (not directly into game).
- Fixed event bubbling on 'TAP TO RESTART' so it always returns to home overlay and does not immediately start the game. Used stopPropagation on overlay handlers.

### Modified files
- .cursor/rules/khurram-rules.mdc
- src/app/layout.tsx
- src/app/page.tsx
- tests/flappy-bird.spec.ts
- test-results/.last-run.json

### Deleted files
- public/images/game-over.png
- test-results/tests-flappy-bird-Flappy-B-3fa4a-ents-and-stops-at-game-over/error-context.md

### Directory and file structure
```
flappy-bird/
  .next/
  public/
    audio/
    images/
      (game-over.png removed)
  src/
    app/
      layout.tsx
      page.tsx
  test-results/
    .last-run.json
  tests/
    flappy-bird.spec.ts
  .gitignore
  CHANGELOG.md
  eslint.config.mjs
  netlify.toml
  next-env.d.ts
  next.config.ts
  package-lock.json
  package.json
  postcss.config.mjs
  PROGRESS.md
  README.md
  tsconfig.json
  tsconfig.tsbuildinfo
```

### Notes
- Persistent server errors: Next.js React Client Manifest module not found (see terminal logs). No user-facing impact observed.

### Directory and File Structure

- .next/
  - cache/
  - server/
    - app/
      - _not-found/
        - page/
      - favicon.ico/ (removed)
        - route/
      - page/
    - chunks/
      - ssr/
  - static/
    - chunks/
    - development/
    - media/
  - types/
- public/
  - audio/
  - images/
  - favicon.svg
- src/
  - app/
    - page.tsx
    - layout.tsx
    - globals.css
- test-results/
  - tests-flappy-bird-Flappy-B-3fa4a-ents-and-stops-at-game-over/
- tests/
  - flappy-bird.spec.ts
- .gitignore
- eslint.config.mjs
- netlify.toml
- next-env.d.ts
- next.config.ts
- package.json
- postcss.config.mjs
- README.md
- tsconfig.json

### Known Issues
- Idle animation for bird before game start is not yet working as intended.
- Warning for game-over.png: Next.js Image expects both width and height, but CSS may override. (No functional impact.)
- favicon.svg 404: favicon.svg is present in public/images/favicon.svg but not in public/. Consider moving or updating the reference.

### Commands Used
- Various code edits to src/app/page.tsx
- Playwright MCP browser inspection

--- 