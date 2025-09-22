"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Star, ShoppingCart, BookOpen, Calendar, Building, Hash, Package, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SearchHeader } from "@/components/search-header"
import { NavigationBreadcrumb } from "@/components/navigation-breadcrumb"
import { api } from "@/lib/api"

interface ProductDetail {
  id: string
  title: string
  author: string
  price: string
  description: string
  condition: string
  isbn: string
  publisher: string
  publicationDate: string
  image: string
  availability: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const url = searchParams.get("url")

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchProductDetail()
    }
  }, [id, url])

  const fetchProductDetail = async () => {
    try {
      setLoading(true)
      const data = await api.getProduct(id, url || undefined)
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [
    { label: "Categories", href: "/" },
    { label: "Products", href: "/search" },
    { label: product?.title || "Product Details" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader showBackButton backHref="/" backLabel="← Back" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading product details...</span>
          </div>
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader showBackButton backHref="/" backLabel="← Back" />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-destructive font-medium mb-2">Failed to load product details</p>
              <p className="text-muted-foreground text-sm mb-4">{error || "Product not found"}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchProductDetail} variant="outline">
                  Try Again
                </Button>
                <Button asChild>
                  <Link href="/">Browse Categories</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader showBackButton backHref="/" backLabel="← Back" />

      <main className="container mx-auto px-4 py-8">
        <NavigationBreadcrumb items={breadcrumbItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="aspect-[3/4] relative">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </Card>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">{product.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">by {product.author}</p>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <Star className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground ml-1">(4.2)</span>
                </div>
                <Badge variant={product.availability === "In Stock" ? "default" : "secondary"}>
                  {product.availability}
                </Badge>
              </div>

              <div className="text-3xl font-bold text-primary mb-6">{product.price}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              {url && url !== "#" && (
                <Button variant="outline" size="lg" asChild>
                  <Link href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    View on World of Books
                  </Link>
                </Button>
              )}
            </div>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Condition:</span>
                    <Badge variant="outline">{product.condition}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">ISBN:</span>
                    <span className="text-sm font-mono">{product.isbn}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Publisher:</span>
                    <span className="text-sm">{product.publisher}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Published:</span>
                    <span className="text-sm">{product.publicationDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed text-pretty">{product.description}</p>
          </CardContent>
        </Card>

        {/* Related Products Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Placeholder for related products */}
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <Image
                    src={`/related-book-.jpg?height=300&width=225&query=related book ${i + 1}`}
                    alt={`Related book ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1">
                    Related Book Title {i + 1}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">Author Name</p>
                  <Badge variant="secondary" className="text-xs">
                    £{(Math.random() * 15 + 5).toFixed(2)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}