/**
 * Integration Tests: User Story 3 - Import Photos
 * Tests complete photo import workflow
 * Framework: Playwright
 */

import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('User Story 3: Import Photos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForSelector('[data-testid="album-list"]')
  })

  test('T089: should open file picker on import button click', async ({ page }) => {
    // Click import button
    const importButton = page.locator('[data-testid="import-button"]')
    await importButton.click()

    // Verify file input triggered
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toHaveAttribute('accept', 'image/*')
    await expect(fileInput).toHaveAttribute('multiple', '')
  })

  test('T089: should accept multiple JPEG/PNG files', async ({ page }) => {
    const importButton = page.locator('[data-testid="import-button"]')

    // Prepare test files
    const testFiles = [
      path.resolve(__dirname, '../fixtures/photo1.jpg'),
      path.resolve(__dirname, '../fixtures/photo2.jpg'),
      path.resolve(__dirname, '../fixtures/photo3.png')
    ]

    // Set files
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFiles)

    // Verify files selected
    const fileCount = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]')
      return input.files.length
    })

    expect(fileCount).toBe(3)
  })

  test('T089: should show progress indicator during import', async ({ page }) => {
    // Start import
    await page.click('[data-testid="import-button"]')

    const testFiles = [
      path.resolve(__dirname, '../fixtures/photo1.jpg'),
      path.resolve(__dirname, '../fixtures/photo2.jpg')
    ]

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFiles)

    // Verify progress indicator appears
    const progressBar = page.locator('[data-testid="import-progress"]')
    await expect(progressBar).toBeVisible({ timeout: 3000 })

    // Verify progress text
    const progressText = page.locator('[data-testid="import-progress-text"]')
    await expect(progressText).toContainText(/Importing \d+ of \d+/)
  })

  test('T089: should update progress percentage', async ({ page }) => {
    await page.click('[data-testid="import-button"]')

    const testFiles = [
      path.resolve(__dirname, '../fixtures/photo1.jpg'),
      path.resolve(__dirname, '../fixtures/photo2.jpg'),
      path.resolve(__dirname, '../fixtures/photo3.jpg')
    ]

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFiles)

    // Monitor progress updates
    const progressValues = []
    const progressBar = page.locator('[data-testid="import-progress"] progress')

    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(500)
      const value = await progressBar.getAttribute('value')
      progressValues.push(parseFloat(value))
    }

    // Verify progress increases
    expect(progressValues[progressValues.length - 1]).toBeGreaterThan(progressValues[0])
  })

  test('T089: should show completion message', async ({ page }) => {
    await page.click('[data-testid="import-button"]')

    const testFile = path.resolve(__dirname, '../fixtures/photo1.jpg')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([testFile])

    // Wait for import completion
    await page.waitForSelector('[data-testid="import-complete"]', { timeout: 5000 })

    const completeMessage = page.locator('[data-testid="import-complete"]')
    await expect(completeMessage).toContainText(/Import complete/)
  })

  test('T090: should detect and skip duplicate photos', async ({ page }) => {
    // Import photo first time
    await page.click('[data-testid="import-button"]')
    const testFile = path.resolve(__dirname, '../fixtures/duplicate-test.jpg')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([testFile])

    await page.waitForSelector('[data-testid="import-complete"]', { timeout: 5000 })

    // Import same photo again
    await page.click('[data-testid="import-button"]')
    const fileInput2 = page.locator('input[type="file"]')
    await fileInput2.setInputFiles([testFile])

    // Verify duplicate message
    await page.waitForSelector('[data-testid="duplicate-warning"]', { timeout: 3000 })
    const duplicateMessage = page.locator('[data-testid="duplicate-warning"]')
    await expect(duplicateMessage).toContainText(/duplicate|already exists/i)
  })

  test('T090: should display duplicate count in summary', async ({ page }) => {
    // Import duplicates
    await page.click('[data-testid="import-button"]')

    const testFiles = [
      path.resolve(__dirname, '../fixtures/photo1.jpg'),
      path.resolve(__dirname, '../fixtures/photo1.jpg') // Duplicate
    ]

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFiles)

    await page.waitForSelector('[data-testid="import-summary"]', { timeout: 5000 })

    const summary = page.locator('[data-testid="import-summary"]')
    await expect(summary).toContainText(/1 duplicate/)
  })

  test('T090: should extract EXIF metadata', async ({ page }) => {
    await page.click('[data-testid="import-button"]')

    const testFile = path.resolve(__dirname, '../fixtures/exif-photo.jpg')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([testFile])

    await page.waitForSelector('[data-testid="import-complete"]', { timeout: 5000 })

    // Verify EXIF data was stored
    const photoData = await page.evaluate(async () => {
      const db = await window.getDatabase()
      const photos = db.query('SELECT * FROM Photo ORDER BY id DESC LIMIT 1')
      return photos[0]
    })

    expect(photoData.date_taken).toBeTruthy()
    expect(photoData.width).toBeGreaterThan(0)
    expect(photoData.height).toBeGreaterThan(0)
  })

  test('T077: should import at ≥5 photos/second rate', async ({ page }) => {
    const photoCount = 10
    const testFiles = Array.from({ length: photoCount }, (_, i) =>
      path.resolve(__dirname, `../fixtures/perf-test-${i + 1}.jpg`)
    )

    await page.click('[data-testid="import-button"]')
    const fileInput = page.locator('input[type="file"]')

    const startTime = Date.now()
    await fileInput.setInputFiles(testFiles)

    await page.waitForSelector('[data-testid="import-complete"]', { timeout: 10000 })
    const endTime = Date.now()

    const duration = (endTime - startTime) / 1000 // seconds
    const rate = photoCount / duration

    expect(rate).toBeGreaterThanOrEqual(5)
  })

  test('T090: should organize photos into correct albums by date', async ({ page }) => {
    await page.click('[data-testid="import-button"]')

    const testFiles = [
      path.resolve(__dirname, '../fixtures/jan-2024-photo.jpg'),
      path.resolve(__dirname, '../fixtures/feb-2024-photo.jpg')
    ]

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFiles)

    await page.waitForSelector('[data-testid="import-complete"]', { timeout: 5000 })

    // Navigate to albums view
    await page.goto('http://localhost:5173')
    await page.waitForSelector('[data-testid="album-list"]')

    // Verify two separate albums created
    const albumTitles = await page.locator('[data-testid="album-card"] h3').allTextContents()
    expect(albumTitles).toContain('2024-01')
    expect(albumTitles).toContain('2024-02')
  })

  test('T090: should generate thumbnails for imported photos', async ({ page }) => {
    await page.click('[data-testid="import-button"]')

    const testFile = path.resolve(__dirname, '../fixtures/large-photo.jpg')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([testFile])

    await page.waitForSelector('[data-testid="import-complete"]', { timeout: 5000 })

    // Verify thumbnail was generated
    const photoData = await page.evaluate(async () => {
      const db = await window.getDatabase()
      const photos = db.query('SELECT thumbnail_path FROM Photo ORDER BY id DESC LIMIT 1')
      return photos[0]
    })

    expect(photoData.thumbnail_path).toBeTruthy()
    expect(photoData.thumbnail_path).toContain('thumbnails')
  })

  test('should handle import errors gracefully', async ({ page }) => {
    await page.click('[data-testid="import-button"]')

    // Simulate corrupted file
    const testFile = path.resolve(__dirname, '../fixtures/corrupted.jpg')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([testFile])

    // Verify error message
    const errorMessage = page.locator('[data-testid="import-error"]')
    await expect(errorMessage).toBeVisible({ timeout: 3000 })
    await expect(errorMessage).toContainText(/error|failed/i)
  })

  test('should allow canceling import in progress', async ({ page }) => {
    await page.click('[data-testid="import-button"]')

    const testFiles = Array.from({ length: 20 }, (_, i) =>
      path.resolve(__dirname, `../fixtures/photo-${i + 1}.jpg`)
    )

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFiles)

    // Wait for import to start
    await page.waitForSelector('[data-testid="import-progress"]')

    // Click cancel button
    await page.click('[data-testid="cancel-import"]')

    // Verify import stopped
    const cancelMessage = page.locator('[data-testid="import-canceled"]')
    await expect(cancelMessage).toBeVisible()
  })
})
