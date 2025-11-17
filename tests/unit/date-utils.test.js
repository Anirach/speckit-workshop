/**
 * Unit Tests: Date Utilities
 * Tests date parsing, formatting, and timezone handling
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest'
import * as dateUtils from '../../src/lib/date-utils.js'

describe('DateUtils Unit Tests', () => {
  describe('parseDate', () => {
    it('should parse ISO 8601 date string', () => {
      const result = dateUtils.parseDate('2024-01-15T14:30:22+08:00')

      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0) // January is 0
      expect(result.getDate()).toBe(15)
    })

    it('should parse UTC date string', () => {
      const result = dateUtils.parseDate('2024-01-15T06:30:22Z')

      expect(result.toISOString()).toContain('2024-01-15')
    })

    it('should handle invalid date strings', () => {
      const result = dateUtils.parseDate('invalid-date')

      expect(result).toBeNull()
    })
  })

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T14:30:22')
      const result = dateUtils.formatDate(date)

      expect(result).toBe('2024-01-15')
    })

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T14:30:22')
      const result = dateUtils.formatDate(date, 'MM/DD/YYYY')

      expect(result).toBe('01/15/2024')
    })

    it('should handle null or undefined dates', () => {
      expect(dateUtils.formatDate(null)).toBe('')
      expect(dateUtils.formatDate(undefined)).toBe('')
    })
  })

  describe('extractYearMonth (T041)', () => {
    it('should extract year and month from ISO date', () => {
      const result = dateUtils.extractYearMonth('2024-01-15T14:30:22+08:00')

      expect(result).toBe('2024-01')
    })

    it('should handle dates without time component', () => {
      const result = dateUtils.extractYearMonth('2024-03-20')

      expect(result).toBe('2024-03')
    })

    it('should preserve leading zeros in month', () => {
      const result = dateUtils.extractYearMonth('2024-09-05')

      expect(result).toBe('2024-09')
    })
  })

  describe('preserveTimezone (T086)', () => {
    it('should preserve original timezone offset', () => {
      const dateString = '2024-01-15T14:30:22+08:00'
      const result = dateUtils.preserveTimezone(dateString)

      expect(result).toContain('+08:00')
    })

    it('should preserve negative timezone offset', () => {
      const dateString = '2024-01-15T14:30:22-05:00'
      const result = dateUtils.preserveTimezone(dateString)

      expect(result).toContain('-05:00')
    })

    it('should preserve UTC timezone', () => {
      const dateString = '2024-01-15T14:30:22Z'
      const result = dateUtils.preserveTimezone(dateString)

      expect(result).toContain('Z')
    })
  })

  describe('getMonthName', () => {
    it('should return full month name', () => {
      expect(dateUtils.getMonthName(0)).toBe('January')
      expect(dateUtils.getMonthName(5)).toBe('June')
      expect(dateUtils.getMonthName(11)).toBe('December')
    })

    it('should return short month name', () => {
      expect(dateUtils.getMonthName(0, true)).toBe('Jan')
      expect(dateUtils.getMonthName(5, true)).toBe('Jun')
      expect(dateUtils.getMonthName(11, true)).toBe('Dec')
    })
  })

  describe('sortByDate', () => {
    it('should sort dates in descending order (newest first)', () => {
      const dates = [
        { date: '2024-01-10' },
        { date: '2024-01-15' },
        { date: '2024-01-05' }
      ]

      const result = dateUtils.sortByDate(dates, 'date', 'desc')

      expect(result[0].date).toBe('2024-01-15')
      expect(result[1].date).toBe('2024-01-10')
      expect(result[2].date).toBe('2024-01-05')
    })

    it('should sort dates in ascending order', () => {
      const dates = [
        { date: '2024-01-10' },
        { date: '2024-01-15' },
        { date: '2024-01-05' }
      ]

      const result = dateUtils.sortByDate(dates, 'date', 'asc')

      expect(result[0].date).toBe('2024-01-05')
      expect(result[1].date).toBe('2024-01-10')
      expect(result[2].date).toBe('2024-01-15')
    })
  })

  describe('isValidDate', () => {
    it('should validate correct date strings', () => {
      expect(dateUtils.isValidDate('2024-01-15')).toBe(true)
      expect(dateUtils.isValidDate('2024-01-15T14:30:22+08:00')).toBe(true)
    })

    it('should reject invalid date strings', () => {
      expect(dateUtils.isValidDate('2024-13-01')).toBe(false) // Invalid month
      expect(dateUtils.isValidDate('2024-01-32')).toBe(false) // Invalid day
      expect(dateUtils.isValidDate('not-a-date')).toBe(false)
    })

    it('should validate Date objects', () => {
      expect(dateUtils.isValidDate(new Date('2024-01-15'))).toBe(true)
      expect(dateUtils.isValidDate(new Date('invalid'))).toBe(false)
    })
  })

  describe('getRelativeTime', () => {
    it('should return relative time string', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const result = dateUtils.getRelativeTime(oneHourAgo)

      expect(result).toContain('hour')
    })

    it('should handle dates in the past', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const result = dateUtils.getRelativeTime(yesterday)

      expect(result).toMatch(/(day|hour)/)
    })
  })
})
