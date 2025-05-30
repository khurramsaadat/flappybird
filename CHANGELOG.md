# CHANGELOG

## 2024-06-09
- Added `@playwright/test` to `devDependencies` in `package.json` for test support.
- Ran `npm install` to update dependencies.
- Staged, committed, and pushed changes to GitHub.
- Fixed ESLint error in `src/app/page.tsx` by correcting the `onClick` handler for the `<canvas>` element to use a direct ternary expression, resolving Netlify build failure.
- Replaced all <img> tags with Next.js <Image /> component for all images, including game assets, for better optimization and to resolve ESLint warnings.
- Removed unused GAME_GUIDE variable from page.tsx.
- Used useCallback for handleJump and updated useEffect dependencies accordingly.

### Directory and File Structure

- .next/
  - cache/
  - server/
    - app/
      - _not-found/
        - page/
      - favicon.ico/
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
- src/
  - app/
    - page.tsx
    - layout.tsx
    - favicon.ico
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