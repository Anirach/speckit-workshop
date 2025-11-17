/**
 * Virtual Scrolling Implementation
 * Renders only visible items for optimal performance with large lists (100+ albums)
 */

export class VirtualScroller {
  constructor(options = {}) {
    this.container = options.container // Scroll container element
    this.itemHeight = options.itemHeight || 200 // Height of each item
    this.items = options.items || [] // All items data
    this.renderItem = options.renderItem // Function to render item: (item, index) => HTMLElement
    this.bufferSize = options.bufferSize || 5 // Number of items to render above/below viewport
    this.onScroll = options.onScroll || null // Optional scroll callback

    this.scrollTop = 0
    this.viewportHeight = 0
    this.contentElement = null
    this.spacerTop = null
    this.spacerBottom = null

    this.init()
  }

  /**
   * Initialize virtual scroller
   */
  init() {
    if (!this.container) {
      throw new Error('Container element is required for virtual scrolling')
    }

    // Create scroll content wrapper
    this.contentElement = document.createElement('div')
    this.contentElement.className = 'virtual-scroll-content'
    this.contentElement.style.position = 'relative'

    // Create spacers for proper scroll height
    this.spacerTop = document.createElement('div')
    this.spacerTop.className = 'virtual-scroll-spacer-top'

    this.spacerBottom = document.createElement('div')
    this.spacerBottom.className = 'virtual-scroll-spacer-bottom'

    this.container.appendChild(this.spacerTop)
    this.container.appendChild(this.contentElement)
    this.container.appendChild(this.spacerBottom)

    // Set up scroll listener
    this.container.addEventListener('scroll', this.handleScroll.bind(this))

    // Measure viewport
    this.viewportHeight = this.container.clientHeight

    // Initial render
    this.render()
  }

  /**
   * Handle scroll event
   */
  handleScroll() {
    this.scrollTop = this.container.scrollTop
    this.render()

    if (this.onScroll) {
      this.onScroll(this.scrollTop, this.getVisibleRange())
    }
  }

  /**
   * Get visible item range
   * @returns {Object} { start, end } indices
   */
  getVisibleRange() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = Math.ceil((this.scrollTop + this.viewportHeight) / this.itemHeight)

    return {
      start: Math.max(0, startIndex - this.bufferSize),
      end: Math.min(this.items.length, endIndex + this.bufferSize)
    }
  }

  /**
   * Render visible items
   */
  render() {
    const { start, end } = this.getVisibleRange()

    // Clear current content
    this.contentElement.innerHTML = ''

    // Set spacer heights
    const topHeight = start * this.itemHeight
    const bottomHeight = (this.items.length - end) * this.itemHeight

    this.spacerTop.style.height = `${topHeight}px`
    this.spacerBottom.style.height = `${bottomHeight}px`

    // Render visible items
    for (let i = start; i < end; i++) {
      if (!this.items[i]) continue

      const itemElement = this.renderItem(this.items[i], i)
      itemElement.style.height = `${this.itemHeight}px`
      itemElement.setAttribute('data-index', i)

      this.contentElement.appendChild(itemElement)
    }
  }

  /**
   * Update items and re-render
   * @param {Array} newItems - New items array
   */
  updateItems(newItems) {
    this.items = newItems
    this.render()
  }

  /**
   * Scroll to specific item index
   * @param {number} index - Item index
   * @param {boolean} smooth - Use smooth scrolling
   */
  scrollToIndex(index, smooth = true) {
    const targetScroll = index * this.itemHeight

    this.container.scrollTo({
      top: targetScroll,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }

  /**
   * Get total scroll height
   * @returns {number} Total height
   */
  getTotalHeight() {
    return this.items.length * this.itemHeight
  }

  /**
   * Destroy virtual scroller
   */
  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll)
    this.container.innerHTML = ''
  }
}

/**
 * Create virtual scroller for album grid
 * @param {HTMLElement} container - Container element
 * @param {Array} albums - Albums array
 * @param {Function} renderAlbum - Function to render album card
 * @returns {VirtualScroller} Virtual scroller instance
 */
export function createAlbumVirtualScroller(container, albums, renderAlbum) {
  return new VirtualScroller({
    container,
    items: albums,
    itemHeight: 250, // Album card height + gap
    renderItem: renderAlbum,
    bufferSize: 3 // Render 3 extra rows above/below
  })
}

/**
 * Create virtual scroller for photo grid
 * @param {HTMLElement} container - Container element
 * @param {Array} photos - Photos array
 * @param {Function} renderPhoto - Function to render photo tile
 * @param {number} columns - Number of columns in grid
 * @returns {VirtualScroller} Virtual scroller instance
 */
export function createPhotoVirtualScroller(container, photos, renderPhoto, columns = 4) {
  const rowHeight = 320 // Photo tile height + gap

  // Group photos by rows
  const rows = []
  for (let i = 0; i < photos.length; i += columns) {
    rows.push(photos.slice(i, i + columns))
  }

  return new VirtualScroller({
    container,
    items: rows,
    itemHeight: rowHeight,
    renderItem: (row, rowIndex) => {
      const rowElement = document.createElement('div')
      rowElement.className = 'photo-grid-row'
      rowElement.style.display = 'grid'
      rowElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
      rowElement.style.gap = '16px'

      row.forEach((photo, colIndex) => {
        const photoIndex = rowIndex * columns + colIndex
        const photoElement = renderPhoto(photo, photoIndex)
        rowElement.appendChild(photoElement)
      })

      return rowElement
    },
    bufferSize: 2 // Render 2 extra rows above/below
  })
}

export default VirtualScroller
