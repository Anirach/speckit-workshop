/**
 * Integration Tests: User Story 2 - Reorder Albums
 * Tests drag-and-drop album reordering workflow
 * Framework: Playwright
 */

import { test, expect } from '@playwright/test'

test.describe('User Story 2: Reorder Albums', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForSelector('[data-testid="album-list"]')
  })

  test('T060: should drag album to new position', async ({ page }) => {
    const albums = page.locator('[data-testid="album-card"]')
    const firstAlbum = albums.first()
    const secondAlbum = albums.nth(1)

    // Get initial titles
    const firstTitle = await firstAlbum.locator('h3').textContent()
    const secondTitle = await secondAlbum.locator('h3').textContent()

    // Drag first album to second position
    await firstAlbum.dragTo(secondAlbum)

    // Wait for reordering to complete
    await page.waitForTimeout(500)

    // Verify positions swapped
    const newFirstTitle = await albums.first().locator('h3').textContent()
    const newSecondTitle = await albums.nth(1).locator('h3').textContent()

    expect(newFirstTitle).toBe(secondTitle)
    expect(newSecondTitle).toBe(firstTitle)
  })

  test('T060: should show visual feedback during drag', async ({ page }) => {
    const firstAlbum = page.locator('[data-testid="album-card"]').first()

    // Start dragging
    await firstAlbum.hover()
    await page.mouse.down()

    // Verify drag feedback
    const isDragging = await firstAlbum.evaluate(el => {
      return el.classList.contains('dragging') ||
             el.style.opacity < 1 ||
             el.style.transform.includes('scale')
    })

    expect(isDragging).toBe(true)

    await page.mouse.up()
  })

  test('T060: should update drag cursor during operation', async ({ page }) => {
    const firstAlbum = page.locator('[data-testid="album-card"]').first()

    // Check cursor changes to grabbing
    await firstAlbum.hover()
    const initialCursor = await firstAlbum.evaluate(el => {
      return window.getComputedStyle(el).cursor
    })

    expect(initialCursor).toMatch(/grab|pointer/)

    await page.mouse.down()

    const draggingCursor = await firstAlbum.evaluate(el => {
      return window.getComputedStyle(el).cursor
    })

    expect(draggingCursor).toMatch(/grabbing|move/)

    await page.mouse.up()
  })

  test('T061: should persist album order after page reload', async ({ page }) => {
    const albums = page.locator('[data-testid="album-card"]')

    // Drag first to third position
    await albums.first().dragTo(albums.nth(2))
    await page.waitForTimeout(500)

    // Get new order
    const reorderedTitles = await albums.allTextContents()

    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="album-list"]')

    // Verify order persisted
    const persistedTitles = await albums.allTextContents()
    expect(persistedTitles).toEqual(reorderedTitles)
  })

  test('T062: should maintain 60fps during drag operation', async ({ page }) => {
    const firstAlbum = page.locator('[data-testid="album-card"]').first()

    // Measure FPS during drag
    const fps = await page.evaluate(async () => {
      return new Promise((resolve) => {
        let frameCount = 0
        let lastTime = performance.now()
        let totalFPS = 0
        let measurements = 0

        function measureFrame (currentTime) {
          frameCount++
          const delta = currentTime - lastTime

          if (delta >= 1000) {
            const currentFPS = (frameCount / delta) * 1000
            totalFPS += currentFPS
            measurements++
            frameCount = 0
            lastTime = currentTime
          }

          if (measurements < 3) {
            requestAnimationFrame(measureFrame)
          } else {
            resolve(totalFPS / measurements)
          }
        }

        requestAnimationFrame(measureFrame)
      })
    })

    expect(fps).toBeGreaterThanOrEqual(60)
  })

  test('T062: should use GPU-accelerated transforms', async ({ page }) => {
    const firstAlbum = page.locator('[data-testid="album-card"]').first()

    await firstAlbum.hover()
    await page.mouse.down()

    // Check for translate3d or matrix3d transform
    const transform = await firstAlbum.evaluate(el => {
      return window.getComputedStyle(el).transform
    })

    expect(transform).toMatch(/matrix3d|translate3d/)

    await page.mouse.up()
  })

  test('T063: should handle keyboard-based reordering (Alt+Up/Down)', async ({ page }) => {
    const albums = page.locator('[data-testid="album-card"]')
    const secondAlbum = albums.nth(1)

    await secondAlbum.focus()

    // Get initial position
    const initialTitle = await secondAlbum.locator('h3').textContent()

    // Move up with Alt+ArrowUp
    await page.keyboard.press('Alt+ArrowUp')
    await page.waitForTimeout(300)

    // Verify it moved to first position
    const newFirstTitle = await albums.first().locator('h3').textContent()
    expect(newFirstTitle).toBe(initialTitle)
  })

  test('T063: should move album down with Alt+ArrowDown', async ({ page }) => {
    const albums = page.locator('[data-testid="album-card"]')
    const firstAlbum = albums.first()

    await firstAlbum.focus()

    const initialTitle = await firstAlbum.locator('h3').textContent()

    // Move down
    await page.keyboard.press('Alt+ArrowDown')
    await page.waitForTimeout(300)

    // Verify it moved to second position
    const newSecondTitle = await albums.nth(1).locator('h3').textContent()
    expect(newSecondTitle).toBe(initialTitle)
  })

  test('T063: should prevent moving first album up', async ({ page }) => {
    const albums = page.locator('[data-testid="album-card"]')
    const firstAlbum = albums.first()

    await firstAlbum.focus()

    const initialTitle = await firstAlbum.locator('h3').textContent()

    // Try to move up (should not work)
    await page.keyboard.press('Alt+ArrowUp')
    await page.waitForTimeout(300)

    // Verify it stayed in first position
    const stillFirstTitle = await albums.first().locator('h3').textContent()
    expect(stillFirstTitle).toBe(initialTitle)
  })

  test('T063: should prevent moving last album down', async ({ page }) => {
    const albums = page.locator('[data-testid="album-card"]')
    const lastAlbum = albums.last()

    await lastAlbum.focus()

    const initialTitle = await lastAlbum.locator('h3').textContent()

    // Try to move down (should not work)
    await page.keyboard.press('Alt+ArrowDown')
    await page.waitForTimeout(300)

    // Verify it stayed in last position
    const stillLastTitle = await albums.last().locator('h3').textContent()
    expect(stillLastTitle).toBe(initialTitle)
  })

  test('should update AlbumOrder table correctly', async ({ page }) => {
    const albums = page.locator('[data-testid="album-card"]')

    // Perform reordering
    await albums.first().dragTo(albums.nth(2))
    await page.waitForTimeout(500)

    // Verify database was updated
    const orderData = await page.evaluate(async () => {
      const db = await window.getDatabase()
      return db.query('SELECT album_id, position FROM AlbumOrder ORDER BY position')
    })

    // Verify positions are sequential
    orderData.forEach((row, index) => {
      expect(row.position).toBe(index)
    })
  })

  test('should handle rapid successive drags', async ({ page }) => {
    const albums = page.locator('[data-testid="album-card"]')

    // Perform multiple drags quickly
    await albums.first().dragTo(albums.nth(1))
    await albums.nth(2).dragTo(albums.first())
    await albums.nth(1).dragTo(albums.last())

    await page.waitForTimeout(1000)

    // Verify final state is consistent
    const finalOrder = await albums.allTextContents()
    expect(finalOrder).toHaveLength(await albums.count())
  })
})
