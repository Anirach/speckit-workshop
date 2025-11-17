/**
 * Integration Tests: User Story 4 - Delete Photos/Albums
 * Tests complete deletion workflow with confirmation
 * Framework: Playwright
 */

import { test, expect } from '@playwright/test'

test.describe('User Story 4: Delete Photos and Albums', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForSelector('[data-testid="album-list"]')
  })

  test('T112: should show confirmation modal when deleting album', async ({ page }) => {
    // Click delete button on first album
    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    await firstAlbum.hover()
    await firstAlbum.locator('[data-testid="delete-album"]').click()

    // Verify confirmation modal appears
    const modal = page.locator('[data-testid="confirm-modal"]')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText(/Are you sure/i)
  })

  test('T112: should display album name in confirmation message', async ({ page }) => {
    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    const albumTitle = await firstAlbum.locator('h3').textContent()

    await firstAlbum.hover()
    await firstAlbum.locator('[data-testid="delete-album"]').click()

    const modal = page.locator('[data-testid="confirm-modal"]')
    await expect(modal).toContainText(albumTitle)
  })

  test('T112: should show photo count in deletion warning', async ({ page }) => {
    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    const photoCount = await firstAlbum.locator('[data-testid="photo-count"]').textContent()

    await firstAlbum.hover()
    await firstAlbum.locator('[data-testid="delete-album"]').click()

    const modal = page.locator('[data-testid="confirm-modal"]')
    await expect(modal).toContainText(photoCount)
  })

  test('T112: should cancel deletion when clicking Cancel', async ({ page }) => {
    const albumCount = await page.locator('[data-testid="album-card"]').count()

    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    await firstAlbum.hover()
    await firstAlbum.locator('[data-testid="delete-album"]').click()

    // Click Cancel in modal
    await page.click('[data-testid="modal-cancel"]')

    // Verify modal closed
    const modal = page.locator('[data-testid="confirm-modal"]')
    await expect(modal).not.toBeVisible()

    // Verify album still exists
    const newAlbumCount = await page.locator('[data-testid="album-card"]').count()
    expect(newAlbumCount).toBe(albumCount)
  })

  test('T112: should delete album when clicking Confirm', async ({ page }) => {
    const albumCount = await page.locator('[data-testid="album-card"]').count()

    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    const albumTitle = await firstAlbum.locator('h3').textContent()

    await firstAlbum.hover()
    await firstAlbum.locator('[data-testid="delete-album"]').click()

    // Click Confirm in modal
    await page.click('[data-testid="modal-confirm"]')

    // Wait for deletion
    await page.waitForTimeout(500)

    // Verify album removed
    const newAlbumCount = await page.locator('[data-testid="album-card"]').count()
    expect(newAlbumCount).toBe(albumCount - 1)

    // Verify album no longer in list
    const albumTitles = await page.locator('[data-testid="album-card"] h3').allTextContents()
    expect(albumTitles).not.toContain(albumTitle)
  })

  test('T113: should cascade delete all photos in album', async ({ page }) => {
    // Open album first
    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    const albumTitle = await firstAlbum.locator('h3').textContent()
    await firstAlbum.click()

    // Count photos
    await page.waitForSelector('[data-testid="photo-grid"]')
    const photoCount = await page.locator('[data-testid="photo-tile"]').count()

    expect(photoCount).toBeGreaterThan(0)

    // Go back and delete album
    await page.click('[data-testid="back-button"]')
    await page.waitForSelector('[data-testid="album-list"]')

    const albumToDelete = page.locator('[data-testid="album-card"]', {
      hasText: albumTitle
    })
    await albumToDelete.hover()
    await albumToDelete.locator('[data-testid="delete-album"]').click()
    await page.click('[data-testid="modal-confirm"]')

    await page.waitForTimeout(500)

    // Verify photos were deleted from database
    const remainingPhotos = await page.evaluate(async (title) => {
      const db = await window.getDatabase()
      const album = db.queryOne('SELECT id FROM Album WHERE name = ?', [title])
      if (!album) return 0

      const photos = db.query('SELECT * FROM Photo WHERE album_id = ?', [album.id])
      return photos.length
    }, albumTitle)

    expect(remainingPhotos).toBe(0)
  })

  test('T113: should delete photo files from storage', async ({ page }) => {
    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    await firstAlbum.click()

    await page.waitForSelector('[data-testid="photo-grid"]')

    // Get photo file path before deletion
    const photoPath = await page.evaluate(async () => {
      const db = await window.getDatabase()
      const photo = db.queryOne('SELECT file_path FROM Photo ORDER BY id DESC LIMIT 1')
      return photo.file_path
    })

    // Delete the album
    await page.click('[data-testid="back-button"]')
    await page.waitForSelector('[data-testid="album-list"]')

    const firstAlbumAgain = page.locator('[data-testid="album-card"]').first()
    await firstAlbumAgain.hover()
    await firstAlbumAgain.locator('[data-testid="delete-album"]').click()
    await page.click('[data-testid="modal-confirm"]')

    await page.waitForTimeout(1000)

    // Verify file was deleted
    const fileExists = await page.evaluate(async (path) => {
      try {
        const response = await fetch(path)
        return response.ok
      } catch {
        return false
      }
    }, photoPath)

    expect(fileExists).toBe(false)
  })

  test('T112: should support keyboard shortcuts (Escape to cancel)', async ({ page }) => {
    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    await firstAlbum.hover()
    await firstAlbum.locator('[data-testid="delete-album"]').click()

    const modal = page.locator('[data-testid="confirm-modal"]')
    await expect(modal).toBeVisible()

    // Press Escape to cancel
    await page.keyboard.press('Escape')

    // Verify modal closed
    await expect(modal).not.toBeVisible()
  })

  test('T112: should support Enter to confirm deletion', async ({ page }) => {
    const albumCount = await page.locator('[data-testid="album-card"]').count()

    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    await firstAlbum.hover()
    await firstAlbum.locator('[data-testid="delete-album"]').click()

    // Press Enter to confirm
    await page.keyboard.press('Enter')

    await page.waitForTimeout(500)

    // Verify deletion occurred
    const newAlbumCount = await page.locator('[data-testid="album-card"]').count()
    expect(newAlbumCount).toBe(albumCount - 1)
  })

  test('T113: should delete individual photos from album', async ({ page }) => {
    // Open album
    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    await firstAlbum.click()

    await page.waitForSelector('[data-testid="photo-grid"]')
    const initialPhotoCount = await page.locator('[data-testid="photo-tile"]').count()

    // Delete first photo
    const firstPhoto = page.locator('[data-testid="photo-tile"]').first()
    await firstPhoto.hover()
    await firstPhoto.locator('[data-testid="delete-photo"]').click()

    // Confirm deletion
    await page.click('[data-testid="modal-confirm"]')
    await page.waitForTimeout(500)

    // Verify photo removed
    const newPhotoCount = await page.locator('[data-testid="photo-tile"]').count()
    expect(newPhotoCount).toBe(initialPhotoCount - 1)
  })

  test('T113: should update album photo count after photo deletion', async ({ page }) => {
    // Open album
    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    const initialCount = await firstAlbum.locator('[data-testid="photo-count"]').textContent()
    await firstAlbum.click()

    await page.waitForSelector('[data-testid="photo-grid"]')

    // Delete a photo
    const firstPhoto = page.locator('[data-testid="photo-tile"]').first()
    await firstPhoto.hover()
    await firstPhoto.locator('[data-testid="delete-photo"]').click()
    await page.click('[data-testid="modal-confirm"]')
    await page.waitForTimeout(500)

    // Go back to album list
    await page.click('[data-testid="back-button"]')
    await page.waitForSelector('[data-testid="album-list"]')

    // Verify photo count decreased
    const firstAlbumAgain = page.locator('[data-testid="album-card"]').first()
    const newCount = await firstAlbumAgain.locator('[data-testid="photo-count"]').textContent()

    const initialNum = parseInt(initialCount.match(/\d+/)[0])
    const newNum = parseInt(newCount.match(/\d+/)[0])

    expect(newNum).toBe(initialNum - 1)
  })

  test('should show error message if deletion fails', async ({ page }) => {
    // Mock deletion failure
    await page.evaluate(() => {
      window.simulateDeletionError = true
    })

    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    await firstAlbum.hover()
    await firstAlbum.locator('[data-testid="delete-album"]').click()
    await page.click('[data-testid="modal-confirm"]')

    // Verify error message
    const errorToast = page.locator('[data-testid="error-toast"]')
    await expect(errorToast).toBeVisible({ timeout: 3000 })
    await expect(errorToast).toContainText(/error|failed/i)
  })

  test('should trap focus in confirmation modal', async ({ page }) => {
    const firstAlbum = page.locator('[data-testid="album-card"]').first()
    await firstAlbum.hover()
    await firstAlbum.locator('[data-testid="delete-album"]').click()

    const modal = page.locator('[data-testid="confirm-modal"]')
    await expect(modal).toBeVisible()

    // Tab through focusable elements
    await page.keyboard.press('Tab')
    const cancelButton = page.locator('[data-testid="modal-cancel"]')
    await expect(cancelButton).toBeFocused()

    await page.keyboard.press('Tab')
    const confirmButton = page.locator('[data-testid="modal-confirm"]')
    await expect(confirmButton).toBeFocused()

    // Tab again should loop back
    await page.keyboard.press('Tab')
    await expect(cancelButton).toBeFocused()
  })
})
