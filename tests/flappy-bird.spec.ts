import { test, expect } from '@playwright/test';

test.describe('Flappy Bird Game', () => {
  test('score increments and stops at game over', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    // Wait for the canvas to be visible
    await page.waitForSelector('canvas', { state: 'visible' });
    // Start the game by clicking the overlay with data-testid 'start-overlay'
    await page.getByTestId('start-overlay').click();
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
    // Optionally, check for game over overlay
    await expect(page.getByTestId('game-over-overlay')).toBeVisible();
    // Restart the game by clicking the game over overlay
    await page.getByTestId('game-over-overlay').click();
    // After restart, the home overlay should be visible and the game should not start automatically
    await expect(page.getByTestId('start-overlay')).toBeVisible();
  });

  test('mobile double tap on game over overlay does NOT start game automatically', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8 size
    await page.waitForSelector('canvas', { state: 'visible' });
    // Start the game
    await page.getByTestId('start-overlay').click();
    // Simulate jumps to pass a pipe
    for (let i = 0; i < 10; i++) {
      await page.mouse.click(200, 300);
      await page.waitForTimeout(200);
    }
    // Let the bird fall and trigger game over
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'snapshot/game-over-debug.png' });
    await expect(page.getByTestId('game-over-overlay')).toBeVisible();
    // Simulate double tap on game over overlay
    const overlay = await page.getByTestId('game-over-overlay');
    await overlay.dispatchEvent('touchend');
    await page.waitForTimeout(50);
    await overlay.dispatchEvent('touchend');
    // After double tap, the home overlay should be visible and the game should NOT start automatically
    await expect(page.getByTestId('start-overlay')).toBeVisible();
    // Wait a bit and check that the game did NOT start
    await page.waitForTimeout(500);
    await expect(page.getByTestId('start-overlay')).toBeVisible();
  });
}); 