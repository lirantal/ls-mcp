import { describe, test } from 'node:test'
import assert from 'node:assert'
import { extractHostname } from '../src/utils/url-utils.js'

describe('URL Utils', () => {
  describe('extractHostname', () => {
    test('extracts hostname from HTTP URL', () => {
      const result = extractHostname('http://localhost:3000/mcp')
      assert.strictEqual(result, 'localhost')
    })

    test('extracts hostname from HTTPS URL', () => {
      const result = extractHostname('https://api.example.com/mcp')
      assert.strictEqual(result, 'api.example.com')
    })

    test('extracts hostname from URL without protocol', () => {
      const result = extractHostname('localhost:3000/mcp')
      assert.strictEqual(result, 'localhost')
    })

    test('extracts hostname from URL with IP address', () => {
      const result = extractHostname('http://192.168.1.100:8080/mcp')
      assert.strictEqual(result, '192.168.1.100')
    })

    test('extracts hostname from URL with subdomain', () => {
      const result = extractHostname('https://subdomain.example.com:443/mcp')
      assert.strictEqual(result, 'subdomain.example.com')
    })

    test('extracts hostname from URL with complex path', () => {
      const result = extractHostname('http://example.com/api/v1/mcp/server')
      assert.strictEqual(result, 'example.com')
    })

    test('extracts hostname from URL with query parameters', () => {
      const result = extractHostname('https://api.example.com/mcp?token=123&version=2.0')
      assert.strictEqual(result, 'api.example.com')
    })

    test('extracts hostname from URL with port', () => {
      const result = extractHostname('http://localhost:8080')
      assert.strictEqual(result, 'localhost')
    })

    test('extracts hostname from URL without port', () => {
      const result = extractHostname('https://example.com')
      assert.strictEqual(result, 'example.com')
    })

    test('returns original string for invalid URL', () => {
      const result = extractHostname('not-a-url')
      assert.strictEqual(result, 'not-a-url')
    })

    test('returns original string for empty string', () => {
      const result = extractHostname('')
      assert.strictEqual(result, '')
    })

    test('handles malformed URL gracefully', () => {
      const result = extractHostname('http://:invalid')
      assert.strictEqual(result, 'http://:invalid')
    })
  })


})
