# Test info

- Name: Flappy Bird Game >> score increments and stops at game over
- Location: D:\APPS\Web\mcp\flappy-bird\tests\flappy-bird.spec.ts:4:7

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /start/i })

    at D:\APPS\Web\mcp\flappy-bird\tests\flappy-bird.spec.ts:7:56
```

# Page snapshot

```yaml
- heading "404" [level=1]
- heading "This page could not be found." [level=2]
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Flappy Bird Game', () => {
   4 |   test('score increments and stops at game over', async ({ page }) => {
   5 |     await page.goto('http://localhost:3000/flappy-bird');
   6 |     // Start the game
>  7 |     await page.getByRole('button', { name: /start/i }).click();
     |                                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
   8 |     // Simulate jumps to pass a pipe
   9 |     for (let i = 0; i < 20; i++) {
  10 |       await page.mouse.click(200, 300);
  11 |       await page.waitForTimeout(300);
  12 |     }
  13 |     // Take screenshot after passing pipes
  14 |     await page.screenshot({ path: 'snapshot/flappy-after-pipe.png' });
  15 |     // Check that score is at least 1
  16 |     // (Score is drawn on canvas, so we just take a screenshot for manual review)
  17 |     // End the game (let the bird fall)
  18 |     await page.waitForTimeout(3000);
  19 |     await page.screenshot({ path: 'snapshot/flappy-game-over.png' });
  20 |     // Optionally, check for "Game Over" text
  21 |     await expect(page.locator('text=Game Over')).toBeVisible();
  22 |   });
  23 | }); 
```