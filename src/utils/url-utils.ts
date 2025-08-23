/**
 * Utility functions for URL operations
 */

/**
 * Extract hostname from a URL string
 * @param urlString - The URL string to extract hostname from
 * @returns The hostname if valid URL, or the original string if parsing fails
 */
export function extractHostname (urlString: string): string {
  try {
    // Handle URLs without protocol by adding a default one
    let urlToParse = urlString
    if (!urlToParse.includes('://')) {
      urlToParse = `http://${urlToParse}`
    }

    const url = new URL(urlToParse)
    return url.hostname
  } catch (error) {
    // If URL parsing fails, return the original string
    return urlString
  }
}
