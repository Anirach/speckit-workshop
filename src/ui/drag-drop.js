/**
 * Drag-and-Drop Controller
 * GPU-accelerated drag-and-drop for album reordering
 * Target: 60fps (16.67ms frame time)
 */

import { updateAlbumOrder } from '../services/album-service.js'
import { showError } from '../lib/errors.js'

// Drag state
let draggedElement = null
let placeholderElement = null
let offsetX = 0
let offsetY = 0
let initialIndex = -1
let currentIndex = -1
let isDragging = false
let animationFrameId = null

/**
 * Initialize drag-and-drop for album cards
 * @param {HTMLElement} containerElement - Album grid container
 */
export function initializeDragDrop(containerElement) {
  // Add event delegation for drag start
  containerElement.addEventListener('mousedown', onMouseDown)

  // Keyboard shortcuts for accessibility
  containerElement.addEventListener('keydown', onKeyDown)
}

/**
 * Attach drag handlers to a single album card
 * @param {HTMLElement} cardElement - Album card element
 */
export function attachDragHandlers(cardElement) {
  cardElement.setAttribute('draggable', 'true')
  cardElement.setAttribute('tabindex', '0')

  // Add visual affordance
  cardElement.style.cursor = 'grab'
  cardElement.setAttribute(
    'aria-label',
    `${cardElement.querySelector('.album-title')?.textContent || 'Album'} - Press Alt+Arrow keys to reorder`
  )
}

/**
 * Handle mouse down event (drag start)
 * @param {MouseEvent} e
 */
function onMouseDown(e) {
  // Only handle left mouse button
  if (e.button !== 0) return

  const card = e.target.closest('.album-card')
  if (!card) return

  // Prevent text selection during drag
  e.preventDefault()

  draggedElement = card
  const rect = card.getBoundingClientRect()
  offsetX = e.clientX - rect.left
  offsetY = e.clientY - rect.top

  // Store initial index
  const container = card.parentElement
  const cards = Array.from(container.querySelectorAll('.album-card'))
  initialIndex = cards.indexOf(card)
  currentIndex = initialIndex

  // Create placeholder
  placeholderElement = createPlaceholder(card)
  card.parentElement.insertBefore(placeholderElement, card.nextSibling)

  // Style dragged element
  card.classList.add('dragging')
  card.style.position = 'fixed'
  card.style.zIndex = '1000'
  card.style.width = `${rect.width}px`
  card.style.height = `${rect.height}px`
  card.style.cursor = 'grabbing'
  card.style.pointerEvents = 'none'

  // Set initial position
  updateDragPosition(e.clientX, e.clientY)

  isDragging = true

  // Attach global event listeners
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

/**
 * Handle mouse move event (dragging)
 * @param {MouseEvent} e
 */
function onMouseMove(e) {
  if (!isDragging || !draggedElement) return

  // Use requestAnimationFrame for 60fps
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  animationFrameId = requestAnimationFrame(() => {
    updateDragPosition(e.clientX, e.clientY)
    updatePlaceholderPosition(e.clientX, e.clientY)
  })
}

/**
 * Update dragged element position with GPU acceleration
 * @param {number} clientX - Mouse X position
 * @param {number} clientY - Mouse Y position
 */
function updateDragPosition(clientX, clientY) {
  if (!draggedElement) return

  const x = clientX - offsetX
  const y = clientY - offsetY

  // GPU-accelerated transform (no layout reflow)
  draggedElement.style.transform = `translate3d(${x}px, ${y}px, 0)`
}

/**
 * Update placeholder position based on mouse position
 * @param {number} clientX - Mouse X position
 * @param {number} clientY - Mouse Y position
 */
function updatePlaceholderPosition(clientX, clientY) {
  if (!placeholderElement || !draggedElement) return

  const container = placeholderElement.parentElement
  const cards = Array.from(container.querySelectorAll('.album-card:not(.dragging)'))

  // Find the card closest to mouse position
  let closestCard = null
  let closestDistance = Infinity
  let insertBefore = false

  cards.forEach(card => {
    const rect = card.getBoundingClientRect()
    const cardCenterX = rect.left + rect.width / 2
    const cardCenterY = rect.top + rect.height / 2

    const distance = Math.sqrt(
      Math.pow(clientX - cardCenterX, 2) + Math.pow(clientY - cardCenterY, 2)
    )

    if (distance < closestDistance) {
      closestDistance = distance
      closestCard = card

      // Determine if we should insert before or after
      const isLeftHalf = clientX < cardCenterX
      const isTopHalf = clientY < cardCenterY
      insertBefore = isLeftHalf || isTopHalf
    }
  })

  // Move placeholder to new position
  if (closestCard) {
    const newIndex = cards.indexOf(closestCard) + (insertBefore ? 0 : 1)

    if (newIndex !== currentIndex) {
      currentIndex = newIndex

      if (insertBefore) {
        container.insertBefore(placeholderElement, closestCard)
      } else {
        container.insertBefore(placeholderElement, closestCard.nextSibling)
      }
    }
  }
}

/**
 * Handle mouse up event (drop)
 * @param {MouseEvent} e
 */
async function onMouseUp(e) {
  if (!isDragging || !draggedElement) return

  // Cancel any pending animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  // Remove global event listeners
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)

  // Check if position changed
  if (currentIndex !== initialIndex && currentIndex >= 0) {
    // Save new order to database
    const albumId = parseInt(draggedElement.dataset.albumId, 10)

    try {
      await updateAlbumOrder(albumId, currentIndex)
    } catch (error) {
      showError('Failed to save album order. Please try again.')
      console.error('Failed to update album order:', error)
    }
  }

  // Reset dragged element
  draggedElement.classList.remove('dragging')
  draggedElement.style.position = ''
  draggedElement.style.zIndex = ''
  draggedElement.style.width = ''
  draggedElement.style.height = ''
  draggedElement.style.transform = ''
  draggedElement.style.cursor = 'grab'
  draggedElement.style.pointerEvents = ''

  // Replace placeholder with dragged element
  if (placeholderElement && placeholderElement.parentElement) {
    placeholderElement.parentElement.insertBefore(draggedElement, placeholderElement)
    placeholderElement.remove()
  }

  // Reset state
  draggedElement = null
  placeholderElement = null
  isDragging = false
  initialIndex = -1
  currentIndex = -1
}

/**
 * Handle keyboard shortcuts (Alt+Arrow keys)
 * @param {KeyboardEvent} e
 */
function onKeyDown(e) {
  const card = e.target.closest('.album-card')
  if (!card) return

  // Handle Escape key during drag
  if (e.key === 'Escape' && isDragging) {
    cancelDrag()
    return
  }

  // Handle Alt+Arrow keys for reordering
  if (
    e.altKey &&
    (e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown')
  ) {
    e.preventDefault()
    moveCardWithKeyboard(card, e.key)
  }
}

/**
 * Cancel drag operation
 */
function cancelDrag() {
  if (!isDragging || !draggedElement) return

  // Cancel animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  // Remove event listeners
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)

  // Reset dragged element to original position
  draggedElement.classList.remove('dragging')
  draggedElement.style.position = ''
  draggedElement.style.zIndex = ''
  draggedElement.style.width = ''
  draggedElement.style.height = ''
  draggedElement.style.transform = ''
  draggedElement.style.cursor = 'grab'
  draggedElement.style.pointerEvents = ''

  // Remove placeholder
  if (placeholderElement && placeholderElement.parentElement) {
    placeholderElement.remove()
  }

  // Reset state
  draggedElement = null
  placeholderElement = null
  isDragging = false
  initialIndex = -1
  currentIndex = -1
}

/**
 * Move card using keyboard
 * @param {HTMLElement} card - Album card to move
 * @param {string} key - Arrow key pressed
 */
async function moveCardWithKeyboard(card, key) {
  const container = card.parentElement
  const cards = Array.from(container.querySelectorAll('.album-card'))
  const currentIndex = cards.indexOf(card)

  let newIndex = currentIndex

  // Determine grid layout (approximate)
  const containerWidth = container.getBoundingClientRect().width
  const cardWidth = card.getBoundingClientRect().width
  const cardsPerRow = Math.floor(containerWidth / (cardWidth + 20)) // 20px gap

  switch (key) {
    case 'ArrowLeft':
      newIndex = Math.max(0, currentIndex - 1)
      break
    case 'ArrowRight':
      newIndex = Math.min(cards.length - 1, currentIndex + 1)
      break
    case 'ArrowUp':
      newIndex = Math.max(0, currentIndex - cardsPerRow)
      break
    case 'ArrowDown':
      newIndex = Math.min(cards.length - 1, currentIndex + cardsPerRow)
      break
  }

  // Only update if position changed
  if (newIndex !== currentIndex) {
    const albumId = parseInt(card.dataset.albumId, 10)

    try {
      await updateAlbumOrder(albumId, newIndex)

      // Reorder DOM to match
      const targetCard = cards[newIndex]
      if (newIndex < currentIndex) {
        container.insertBefore(card, targetCard)
      } else {
        container.insertBefore(card, targetCard.nextSibling)
      }

      // Move focus to reordered card
      card.focus()
    } catch (error) {
      showError('Failed to reorder album. Please try again.')
      console.error('Failed to update album order:', error)
    }
  }
}

/**
 * Create placeholder element
 * @param {HTMLElement} card - Original card
 * @returns {HTMLElement} Placeholder element
 */
function createPlaceholder(card) {
  const placeholder = document.createElement('div')
  placeholder.className = 'album-card album-placeholder'
  placeholder.style.width = `${card.offsetWidth}px`
  placeholder.style.height = `${card.offsetHeight}px`
  placeholder.style.border = '2px dashed #ccc'
  placeholder.style.background = 'rgba(0, 0, 0, 0.05)'
  placeholder.style.borderRadius = '8px'

  return placeholder
}

/**
 * Cleanup drag-and-drop handlers
 * @param {HTMLElement} containerElement - Album grid container
 */
export function cleanupDragDrop(containerElement) {
  containerElement.removeEventListener('mousedown', onMouseDown)
  containerElement.removeEventListener('keydown', onKeyDown)

  // Cancel any ongoing drag
  if (isDragging) {
    cancelDrag()
  }
}
