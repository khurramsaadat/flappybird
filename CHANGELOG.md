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

## 2025-06-03
- Implemented a smooth, looping idle bird animation (sine wave, 5s loop, amplitude scales with bird size).
- Enforced minimum pipe gap (bird height x 6) for both horizontal and vertical gaps on mobile devices for better playability.
- Added clear comments in code for easy tweaking of these values.
- Checked and resolved all Problems tab and terminal issues before and after changes.

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