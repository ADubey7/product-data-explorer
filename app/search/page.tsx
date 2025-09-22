"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Star, ShoppingCart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SearchHeader } from "@/components/search-header"
import { NavigationBreadcrumb } from "@/components/navigation-breadcrumb"
import { api } from "@/lib/api"

interface SearchResult {
  id: string
  title: string
  author: string
  price: string
  image: string
  link: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(query)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (query) {
      setSearchQuery(query)
      performSearch(query, 1)
    }
  }, [query])

  const performSearch = async (searchTerm: string, pageNum: number) => {
    try {
      setLoading(true)
      const data = await api.search(searchTerm, pageNum)

      if (pageNum === 1) {
        setResults(data)
      } else {
        setResults((prev) => [...prev, ...data])
      }

      setHasMore(data.length === 20)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setPage(1)
      setResults([])
      setError(null)
      performSearch(searchQuery.trim(), 1)
      // Update URL without page reload
      window.history.pushState({}, "", `/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    performSearch(query, nextPage)
  }

  const breadcrumbItems = [{ label: `Search results for "${query}"` }]

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader showBackButton backHref="/" backLabel="← Back to Home" />

      <main className="container mx-auto px-4 py-8">
        <NavigationBreadcrumb items={breadcrumbItems} />

        {/* Search Form */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
            <Input
              type="text"
              placeholder="Search for books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </form>
        </div>

        {/* Results Header */}
        {query && !loading && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Search Results for "{query}"</h2>
            <p className="text-muted-foreground">
              {results.length > 0 ? `Found ${results.length} results` : "No results found"}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && page === 1 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Searching...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-destructive font-medium mb-2">Search failed</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button onClick={() => performSearch(query, 1)} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Search Results Grid */}
        {!loading && !error && results.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {results.map((result) => (
                <Link key={result.id} href={`/product/${result.id}?url=${encodeURIComponent(result.link)}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <Image
                        src={result.image || "/placeholder.svg"}
                        alt={result.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{result.author}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs font-bold">
                          {result.price}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">4.2</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button onClick={loadMore} disabled={loading} variant="outline" size="lg">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Results"
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any books matching "{query}". Try different keywords or browse our categories.
            </p>
            <Button asChild>
              <Link href="/">Browse Categories</Link>
            </Button>
          </div>
        )}

        {/* No Query State */}
        {!query && (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Start your search</h3>
            <p className="text-muted-foreground">Enter a search term above to find books</p>
          </div>
        )}
      </main>
    </div>
  )
}