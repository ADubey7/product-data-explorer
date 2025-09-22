"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingCart, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SearchHeader } from "@/components/search-header"
import { NavigationBreadcrumb } from "@/components/navigation-breadcrumb"
import { api } from "@/lib/api"

interface Product {
  id: string
  title: string
  author: string
  price: string
  image: string
  link: string
  category: string
}

export default function ProductsPage() {
  const params = useParams()
  const category = params.category as string

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (category) {
      fetchProducts()
    }
  }, [category, page])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProducts(category, page)

      if (page === 1) {
        setProducts(data)
      } else {
        setProducts((prev) => [...prev, ...data])
      }

      setHasMore(data.length === 20) // Assuming 20 items per page
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    setPage((prev) => prev + 1)
  }

  const categoryDisplayName = category
    ? category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : ""

  const breadcrumbItems = [{ label: "Categories", href: "/" }, { label: categoryDisplayName }]

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader showBackButton backHref="/" backLabel="← Back to Categories" />

      <main className="container mx-auto px-4 py-8">
        <NavigationBreadcrumb items={breadcrumbItems} />

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{categoryDisplayName} Books</h2>
          <p className="text-muted-foreground text-lg">
            Discover books in the {categoryDisplayName.toLowerCase()} category
          </p>
        </div>

        {/* Loading State */}
        {loading && page === 1 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading products...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-destructive font-medium mb-2">Failed to load products</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button onClick={() => fetchProducts()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/product/${product.id}?url=${encodeURIComponent(product.link)}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{product.author}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs font-bold">
                          {product.price}
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
                    "Load More Products"
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground">
              We couldn't find any products in the {categoryDisplayName.toLowerCase()} category.
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Browse Other Categories</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}