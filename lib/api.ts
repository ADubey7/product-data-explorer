const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? "https://product-data-explorer.onrender.com"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

console.log("[v0] API_BASE_URL:", API_BASE_URL)
console.log("[v0] NODE_ENV:", process.env.NODE_ENV)
console.log("[v0] NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL)

interface ApiError extends Error {
  status?: number
  code?: string
}

class ApiClient {
  private baseUrl: string
  private defaultTimeout: number

  constructor(baseUrl: string = API_BASE_URL, timeout = 10000) {
    this.baseUrl = baseUrl
    this.defaultTimeout = timeout
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(errorData.details || `HTTP ${response.status}`) as ApiError
        error.status = response.status
        error.code = errorData.code
        throw error
      }

      return await response.json()
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as Error)) {
        await this.delay(1000)
        return this.request<T>(endpoint, options, retries - 1)
      }
      throw error
    }
  }

  private shouldRetry(error: Error): boolean {
    return (
      error.name === "AbortError" ||
      error.message.includes("fetch") ||
      (error as ApiError).status === 503 ||
      (error as ApiError).status === 502
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new ApiClient()

// Specific API methods
export const api = {
  getHeadings: () => apiClient.get<any[]>("/headings"),
  getCategories: (heading: string) => apiClient.get<any[]>(`/categories/${heading}`),
  getProducts: (category: string, page = 1) => apiClient.get<any[]>(`/products/${category}?page=${page}`),
  getProduct: (id: string, url?: string) =>
    apiClient.get<any>(`/product/${id}${url ? `?url=${encodeURIComponent(url)}` : ""}`),
  search: (query: string, page = 1) => apiClient.get<any[]>(`/search?q=${encodeURIComponent(query)}&page=${page}`),
  getHealth: () => apiClient.get<any>("/health"),
  getCacheStats: () => apiClient.get<any>("/cache/stats"),
  clearCache: () => apiClient.delete<any>("/cache"),
}
