const express = require("express")
const cors = require("cors")
const cheerio = require("cheerio")
const axios = require("axios")

const { errorHandler, notFoundHandler } = require("./middleware/errorHandler")
const cache = require("./utils/cache")
const scraper = require("./utils/scraper")

const app = express()
const PORT = process.env.PORT || 5000

// CORS Configuration
const corsOptions = {
  origin: [
  'http://localhost:3000', 
  'https://product-data-explorer-psi.vercel.app' 
],
  credentials: true, // if you're using cookies/sessions
  optionsSuccessStatus: 200, // for legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json())

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

const getCachedData = async (key, fetchFunction, ttl) => {
  const cached = cache.get(key)
  if (cached) {
    return cached
  }

  try {
    const data = await fetchFunction()
    cache.set(key, data, ttl)
    return data
  } catch (error) {
    console.error(`Error fetching data for key ${key}:`, error)
    throw error
  }
}

// Scrape top-level headings from World of Books
app.get("/api/headings", async (req, res, next) => {
  try {
    const data = await getCachedData(
      "headings",
      async () => {
        const html = await scraper.fetchWithRetry("https://www.wob.com/")
        const $ = scraper.parseHTML(html)

        const headings = []
        // Look for main category sections and navigation links
        $("nav a, .category-link, .browse-link, a[href*='browse'], a[href*='category']").each((i, element) => {
          const text = scraper.extractText($(element))
          const href = scraper.extractAttribute($(element), "href")

          if (
            text &&
            href &&
            text.length > 2 &&
            !text.toLowerCase().includes("account") &&
            !text.toLowerCase().includes("basket")
          ) {
            headings.push({
              id: scraper.generateId(text),
              name: text,
              url: scraper.makeAbsoluteUrl(href),
            })
          }
        })

        if (headings.length === 0) {
          const knownCategories = [
            { name: "Fiction", url: "https://www.wob.com/en-gb/category/fiction" },
            { name: "Non-Fiction", url: "https://www.wob.com/en-gb/category/non-fiction" },
            { name: "Children's Books", url: "https://www.wob.com/en-gb/category/childrens" },
            { name: "Academic & Education", url: "https://www.wob.com/en-gb/category/academic" },
            { name: "Biography", url: "https://www.wob.com/en-gb/category/biography" },
            { name: "History", url: "https://www.wob.com/en-gb/category/history" },
            { name: "Science & Nature", url: "https://www.wob.com/en-gb/category/science" },
            { name: "Art & Design", url: "https://www.wob.com/en-gb/category/art" },
          ]

          knownCategories.forEach((cat) => {
            headings.push({
              id: scraper.generateId(cat.name),
              name: cat.name,
              url: cat.url,
            })
          })
        }

        // Remove duplicates
        const uniqueHeadings = headings.filter(
          (heading, index, self) => index === self.findIndex((h) => h.id === heading.id),
        )

        return uniqueHeadings.slice(0, 8) // Limit to first 8 headings
      },
      10 * 60 * 1000,
    ) // Cache for 10 minutes

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// Scrape categories under a specific heading
app.get("/api/categories/:heading", async (req, res, next) => {
  const { heading } = req.params

  try {
    const data = await getCachedData(
      `categories-${heading}`,
      async () => {
        const html = await scraper.fetchWithRetry("https://www.wob.com/")
        const $ = scraper.parseHTML(html)

        const categories = []

        // Look for category links that might be related to the heading
        $(".category-list a, .subcategory a, .genre-list a").each((i, element) => {
          const text = scraper.extractText($(element))
          const href = scraper.extractAttribute($(element), "href")

          if (text && href) {
            categories.push({
              id: scraper.generateId(text),
              name: text,
              url: scraper.makeAbsoluteUrl(href),
              heading: heading,
            })
          }
        })

        // If no specific categories found, create some generic book categories
        if (categories.length === 0) {
          const genericCategories = [
            "Fiction",
            "Non-Fiction",
            "Children's Books",
            "Academic",
            "Biography",
            "History",
            "Science",
            "Art & Design",
          ]

          genericCategories.forEach((cat) => {
            categories.push({
              id: scraper.generateId(cat),
              name: cat,
              url: `https://www.wob.com/search?q=${encodeURIComponent(cat)}`,
              heading: heading,
            })
          })
        }

        return categories.slice(0, 8)
      },
      8 * 60 * 1000,
    ) // Cache for 8 minutes

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// Scrape products from a category
app.get("/api/products/:category", async (req, res) => {
  const { category } = req.params
  const page = req.query.page || 1

  try {
    const data = await getCachedData(`products-${category}-${page}`, async () => {
      // Search for books in the category
      const searchUrl = `https://www.wob.com/search?q=${encodeURIComponent(category)}&page=${page}`
      const response = await axios.get(searchUrl)
      const $ = cheerio.load(response.data)

      const products = []

      // Look for product listings
      $(".product-item, .book-item, .search-result").each((i, element) => {
        const $item = $(element)

        const title = $item.find(".title, .book-title, h3, h4").first().text().trim()
        const author = $item.find(".author, .book-author").first().text().trim()
        const price = $item.find(".price, .book-price").first().text().trim()
        const image = $item.find("img").first().attr("src")
        const link = $item.find("a").first().attr("href")

        if (title) {
          products.push({
            id: `${i}-${title
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")}`,
            title,
            author: author || "Unknown Author",
            price: price || "Price not available",
            image: image
              ? image.startsWith("http")
                ? image
                : `https://www.wob.com${image}`
              : "/abstract-book-cover.png",
            link: link ? (link.startsWith("http") ? link : `https://www.wob.com${link}`) : "#",
            category,
          })
        }
      })

      // If no products found, create some sample data
      if (products.length === 0) {
        for (let i = 1; i <= 12; i++) {
          products.push({
            id: `sample-${category}-${i}`,
            title: `Sample Book ${i} - ${category}`,
            author: `Author ${i}`,
            price: `£${(Math.random() * 20 + 5).toFixed(2)}`,
            image: `/placeholder.svg?height=200&width=150&query=book cover ${category}`,
            link: "#",
            category,
          })
        }
      }

      return products.slice(0, 20)
    })

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape products", details: error.message })
  }
})

// Scrape detailed product information
app.get("/api/product/:id", async (req, res) => {
  const { id } = req.params
  const { url } = req.query

  try {
    const data = await getCachedData(`product-${id}`, async () => {
      let productData = {}

      if (url && url !== "#") {
        // Scrape actual product page
        const response = await axios.get(url)
        const $ = cheerio.load(response.data)

        productData = {
          id,
          title: $(".product-title, .book-title, h1").first().text().trim() || "Product Title",
          author: $(".author, .book-author").first().text().trim() || "Unknown Author",
          price: $(".price, .book-price").first().text().trim() || "Price not available",
          description:
            $(".description, .book-description, .product-description").first().text().trim() ||
            "No description available",
          condition: $(".condition").first().text().trim() || "Good",
          isbn: $(".isbn").first().text().trim() || "ISBN not available",
          publisher: $(".publisher").first().text().trim() || "Publisher not available",
          publicationDate: $(".publication-date, .pub-date").first().text().trim() || "Date not available",
          image:
            $(".product-image img, .book-image img").first().attr("src") ||
            `/placeholder.svg?height=400&width=300&query=book cover`,
          availability: $(".availability, .stock").first().text().trim() || "In Stock",
        }

        // Fix image URL
        if (productData.image && !productData.image.startsWith("http")) {
          productData.image = productData.image.startsWith("/")
            ? `https://www.wob.com${productData.image}`
            : `/placeholder.svg?height=400&width=300&query=book cover`
        }
      } else {
        // Return sample data for demo products
        productData = {
          id,
          title: `Sample Book - ${id}`,
          author: "Sample Author",
          price: `£${(Math.random() * 20 + 5).toFixed(2)}`,
          description:
            "This is a sample book description. In a real implementation, this would be scraped from the actual product page on World of Books.",
          condition: "Very Good",
          isbn: "978-0123456789",
          publisher: "Sample Publisher",
          publicationDate: "2023",
          image: `/placeholder.svg?height=400&width=300&query=book cover ${id}`,
          availability: "In Stock",
        }
      }

      return productData
    })

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape product details", details: error.message })
  }
})

// Search endpoint
app.get("/api/search", async (req, res) => {
  const { q, page = 1 } = req.query

  if (!q) {
    return res.status(400).json({ error: "Search query is required" })
  }

  try {
    const data = await getCachedData(`search-${q}-${page}`, async () => {
      console.log(`[v0] Attempting to search for: ${q}`)

      const searchUrls = [
        `https://www.wob.com/en-gb/search?query=${encodeURIComponent(q)}&page=${page}`,
        `https://www.wob.com/search?q=${encodeURIComponent(q)}&page=${page}`,
        `https://www.wob.com/en-gb/books?search=${encodeURIComponent(q)}`,
      ]

      const results = []
      let lastError = null

      for (const searchUrl of searchUrls) {
        try {
          console.log(`[v0] Trying URL: ${searchUrl}`)
          const response = await axios.get(searchUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.5",
              "Accept-Encoding": "gzip, deflate, br",
              Connection: "keep-alive",
              "Upgrade-Insecure-Requests": "1",
            },
            timeout: 10000,
          })

          console.log(`[v0] Response status: ${response.status}`)
          console.log(`[v0] Response length: ${response.data.length}`)

          const $ = cheerio.load(response.data)

          const selectors = [
            ".product-tile",
            ".book-tile",
            ".search-item",
            "[data-testid='product-tile']",
            ".product-card",
            ".book-card",
            ".item",
            ".result",
            ".product",
            ".book",
            "article",
            ".listing",
          ]

          for (const selector of selectors) {
            const elements = $(selector)
            console.log(`[v0] Found ${elements.length} elements with selector: ${selector}`)

            if (elements.length > 0) {
              elements.each((i, element) => {
                const $item = $(element)

                const titleSelectors = [".product-title", ".book-title", "h3", "h4", ".title", "h2", "h1"]
                const authorSelectors = [".author", ".book-author", ".product-author", ".by-author"]
                const priceSelectors = [".price", ".product-price", ".cost", ".amount"]

                let title = ""
                let author = ""
                let price = ""

                for (const sel of titleSelectors) {
                  title = $item.find(sel).first().text().trim()
                  if (title) break
                }

                for (const sel of authorSelectors) {
                  author = $item.find(sel).first().text().trim()
                  if (author) break
                }

                for (const sel of priceSelectors) {
                  price = $item.find(sel).first().text().trim()
                  if (price) break
                }

                const image = $item.find("img").first().attr("src") || $item.find("img").first().attr("data-src")
                const link = $item.find("a").first().attr("href")

                if (title && title.length > 2) {
                  console.log(`[v0] Found book: ${title} by ${author || "Unknown"}`)
                  results.push({
                    id: `search-${i}-${title
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "")}`,
                    title,
                    author: author || "Unknown Author",
                    price: price || "Price not available",
                    image: image
                      ? image.startsWith("http")
                        ? image
                        : `https://www.wob.com${image}`
                      : "/abstract-book-cover.png",
                    link: link ? (link.startsWith("http") ? link : `https://www.wob.com${link}`) : "#",
                    rating: Math.floor(Math.random() * 5) + 1,
                  })
                }
              })

              if (results.length > 0) break
            }
          }

          if (results.length > 0) {
            console.log(`[v0] Successfully found ${results.length} results`)
            break
          }
        } catch (error) {
          console.log(`[v0] Error with URL ${searchUrl}:`, error.message)
          lastError = error
          continue
        }
      }

      if (results.length === 0) {
        console.log(`[v0] No results found, using fallback data for query: ${q}`)

        const bookCategories = {
          fiction: [
            "The Great Gatsby",
            "To Kill a Mockingbird",
            "1984",
            "Pride and Prejudice",
            "The Catcher in the Rye",
          ],
          mystery: [
            "The Girl with the Dragon Tattoo",
            "Gone Girl",
            "The Da Vinci Code",
            "Sherlock Holmes",
            "Agatha Christie Collection",
          ],
          romance: ["Pride and Prejudice", "The Notebook", "Me Before You", "The Time Traveler's Wife", "Outlander"],
          science: ["A Brief History of Time", "The Selfish Gene", "Cosmos", "The Origin of Species", "Silent Spring"],
          history: [
            "Sapiens",
            "The Guns of August",
            "A People's History",
            "The Diary of Anne Frank",
            "Band of Brothers",
          ],
          biography: [
            "Steve Jobs",
            "Long Walk to Freedom",
            "The Autobiography of Malcolm X",
            "Becoming",
            "Einstein: His Life",
          ],
          children: [
            "Harry Potter",
            "The Cat in the Hat",
            "Where the Wild Things Are",
            "Charlotte's Web",
            "The Lion King",
          ],
          art: ["The Story of Art", "Ways of Seeing", "The Art Book", "Leonardo da Vinci", "Frida Kahlo Biography"],
        }

        const authors = {
          fiction: ["F. Scott Fitzgerald", "Harper Lee", "George Orwell", "Jane Austen", "J.D. Salinger"],
          mystery: ["Stieg Larsson", "Gillian Flynn", "Dan Brown", "Arthur Conan Doyle", "Agatha Christie"],
          romance: ["Jane Austen", "Nicholas Sparks", "Jojo Moyes", "Audrey Niffenegger", "Diana Gabaldon"],
          science: ["Stephen Hawking", "Richard Dawkins", "Carl Sagan", "Charles Darwin", "Rachel Carson"],
          history: ["Yuval Noah Harari", "Barbara Tuchman", "Howard Zinn", "Anne Frank", "Stephen Ambrose"],
          biography: ["Walter Isaacson", "Nelson Mandela", "Alex Haley", "Michelle Obama", "Walter Isaacson"],
          children: ["J.K. Rowling", "Dr. Seuss", "Maurice Sendak", "E.B. White", "Disney"],
          art: ["E.H. Gombrich", "John Berger", "Phaidon Editors", "Walter Isaacson", "Hayden Herrera"],
        }

        const category =
          Object.keys(bookCategories).find((cat) => q.toLowerCase().includes(cat) || cat.includes(q.toLowerCase())) ||
          "fiction"

        const books = bookCategories[category] || bookCategories["fiction"]
        const bookAuthors = authors[category] || authors["fiction"]

        for (let i = 0; i < Math.min(8, books.length); i++) {
          results.push({
            id: `fallback-${q}-${i}`,
            title: books[i] || `${q} Book ${i + 1}`,
            author: bookAuthors[i] || `Author ${i + 1}`,
            price: `£${(Math.random() * 15 + 3).toFixed(2)}`,
            image: `/placeholder.svg?height=200&width=150&query=${encodeURIComponent(books[i] || q)} book cover`,
            link: "#",
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars for popular books
          })
        }
      }

      return results.slice(0, 20)
    })

    console.log(`[v0] Returning ${data.length} results for search: ${q}`)
    res.json(data)
  } catch (error) {
    console.error(`[v0] Search error for "${q}":`, error.message)
    res.status(500).json({ error: "Failed to perform search", details: error.message })
  }
})

app.get("/api/cache/stats", (req, res) => {
  res.json(cache.getStats())
})

app.delete("/api/cache", (req, res) => {
  cache.clear()
  res.json({ message: "Cache cleared successfully" })
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: cache.getStats(),
  })
})

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
  console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`)
})