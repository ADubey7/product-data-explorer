const axios = require("axios")
const cheerio = require("cheerio")

class ScraperService {
  constructor() {
    this.maxRetries = 3
    this.retryDelay = 1000
    this.timeout = 10000

    // Create axios instance with default config
    this.client = axios.create({
      timeout: this.timeout,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
  }

  async fetchWithRetry(url, retries = this.maxRetries) {
    try {
      const response = await this.client.get(url)
      return response.data
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        console.log(`Retrying ${url}, attempts left: ${retries - 1}`)
        await this.delay(this.retryDelay)
        return this.fetchWithRetry(url, retries - 1)
      }
      throw error
    }
  }

  shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx status codes
    return (
      error.code === "ENOTFOUND" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      (error.response && error.response.status >= 500)
    )
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  parseHTML(html) {
    return cheerio.load(html)
  }

  extractText(element) {
    return element.text().trim()
  }

  extractAttribute(element, attr) {
    return element.attr(attr)
  }

  makeAbsoluteUrl(url, baseUrl = "https://www.wob.com") {
    if (!url) return null
    if (url.startsWith("http")) return url
    if (url.startsWith("//")) return `https:${url}`
    if (url.startsWith("/")) return `${baseUrl}${url}`
    return `${baseUrl}/${url}`
  }

  sanitizeText(text) {
    return text
      .replace(/\s+/g, " ")
      .replace(/[^\w\s-]/g, "")
      .trim()
  }

  generateId(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 50)
  }
}

module.exports = new ScraperService()
