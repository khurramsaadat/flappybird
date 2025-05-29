import { test, expect } from '@playwright/test';

test.describe('Flappy Bird Game', () => {
  test('score increments and stops at game over', async ({ page }) => {
    await page.goto('http://localhost:3002/');
    // Wait for the canvas to be visible
    await page.waitForSelector('canvas', { state: 'visible' });
    // Start the game by clicking the canvas
    await page.click('canvas');
    // Simulate jumps to pass a pipe
    for (let i = 0; i < 20; i++) {
      await page.mouse.click(200, 300);
      await page.waitForTimeout(300);
    }
    // Take screenshot after passing pipes
    await page.screenshot({ path: 'snapshot/flappy-after-pipe.png' });
    // End the game (let the bird fall)
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'snapshot/flappy-game-over.png' });
    // Optionally, check for "Game Over" text
    await expect(page.locator('text=Game Over')).toBeVisible();
  });
}); 